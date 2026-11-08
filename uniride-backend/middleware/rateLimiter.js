/**
 * Sliding-window in-memory rate limiter for the Overpass shop discovery endpoint.
 * Protects shared public Overpass infrastructure from excessive requests.
 */

const windows = new Map();

export function resetRateLimiter() {
  windows.clear();
}

export function createDiscoveryRateLimiter(options = {}) {
  return (req, res, next) => {
    const windowMs = Number(
      options.windowMs || process.env.DISCOVERY_RATE_LIMIT_WINDOW_MS || 60000
    );
    const maxRequests = Number(
      options.max || process.env.DISCOVERY_RATE_LIMIT_MAX || 30
    );

    const key =
      req.headers['x-forwarded-for'] ||
      req.headers['x-demo-actor-id'] ||
      req.ip ||
      'global-client';

    const now = Date.now();
    const record = windows.get(key) || [];
    const activeTimestamps = record.filter((ts) => now - ts < windowMs);

    if (activeTimestamps.length >= maxRequests) {
      const oldest = activeTimestamps[0];
      const retryAfterSec = Math.max(
        1,
        Math.ceil((windowMs - (now - oldest)) / 1000)
      );
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        code: 'DISCOVERY_RATE_LIMIT_EXCEEDED',
        message: `Too many shop discovery requests. Please wait ${retryAfterSec}s before searching a new area.`,
        retryAfterSeconds: retryAfterSec,
      });
    }

    activeTimestamps.push(now);
    windows.set(key, activeTimestamps);
    return next();
  };
}
