import crypto from 'crypto';

/**
 * Clearly Identified Local Demonstration Identity Flow
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * This module provides a clearly labeled local demonstration identity registry and
 * HMAC-signed demo session token for university prototype evaluation of Customer,
 * Student Rider, and Support Admin roles. It is NOT production OAuth/OIDC authentication.
 */

const DEMO_SECRET =
  process.env.DEMO_SESSION_SECRET || 'unieats-seusl-demo-secret-key-2026';

export const DEMO_IDENTITIES = {
  'cust-ruvini': {
    id: 'cust-ruvini',
    role: 'customer',
    name: 'Ruvini Thackshila',
    phone: '+94 77 234 5678',
    campus: 'South Eastern University, Oluvil',
  },
  'cust-kamal': {
    id: 'cust-kamal',
    role: 'customer',
    name: 'Kamal Jayasinghe',
    phone: '+94 71 987 6543',
    campus: 'South Eastern University, Oluvil',
  },
  'rider-1': {
    id: 'rider-1',
    role: 'rider',
    name: 'Kasun Perera',
    phone: '+94 77 812 3401',
    vehicle: 'Honda Dio 110 • WP BJM-4821',
  },
  'rider-2': {
    id: 'rider-2',
    role: 'rider',
    name: 'Nadeesha Silva',
    phone: '+94 71 445 9920',
    vehicle: 'TVS Ntorq 125 • SG KQ-9012',
  },
  'rider-3': {
    id: 'rider-3',
    role: 'rider',
    name: 'Dinesh Fernando',
    phone: '+94 76 309 1188',
    vehicle: 'Yamaha RayZR • WP CAR-2290',
  },
  'admin-1': {
    id: 'admin-1',
    role: 'admin',
    name: 'UniEats Campus Support Admin',
    phone: '+94 11 234 5000',
  },
};

export function createDemoSessionToken(actorId) {
  const identity = DEMO_IDENTITIES[actorId];
  if (!identity) return null;
  const payload = Buffer.from(
    JSON.stringify({
      id: identity.id,
      role: identity.role,
      name: identity.name,
      mode: 'local_demo_identity',
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', DEMO_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyDemoSessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expectedSig = crypto
    .createHmac('sha256', DEMO_SECRET)
    .update(payload)
    .digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return DEMO_IDENTITIES[parsed.id] || null;
  } catch {
    return null;
  }
}

/**
 * Resolves the current demonstration actor from request headers or query token.
 * Rejects unrecognized actor IDs or mismatched role claims.
 */
export function resolveDemoActor(req, res, next) {
  const token =
    req.headers['x-demo-session-token'] || req.query.demoToken || '';
  if (token) {
    const verified = verifyDemoSessionToken(token);
    if (!verified) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_DEMO_TOKEN',
        message: 'Invalid demonstration session token.',
      });
    }
    req.actor = { ...verified, authMode: 'local_demonstration_identity' };
    return next();
  }

  const headerActorId = (
    req.headers['x-demo-actor-id'] ||
    req.query.demoActorId ||
    ''
  ).trim();
  const headerRole = (
    req.headers['x-demo-actor-role'] ||
    req.query.demoActorRole ||
    ''
  )
    .trim()
    .toLowerCase();

  // If no header is provided, default to null so protected endpoints can reject unauthenticated calls
  if (!headerActorId) {
    req.actor = null;
    return next();
  }

  const registered = DEMO_IDENTITIES[headerActorId];
  if (!registered) {
    return res.status(401).json({
      success: false,
      code: 'UNRECOGNIZED_DEMO_IDENTITY',
      message: `Unrecognized demonstration identity "${headerActorId}". Use one of the registered demo profiles.`,
    });
  }

  if (headerRole && headerRole !== registered.role) {
    return res.status(403).json({
      success: false,
      code: 'ROLE_MISMATCH',
      message: `Identity "${headerActorId}" has role "${registered.role}", not "${headerRole}".`,
    });
  }

  req.actor = { ...registered, authMode: 'local_demonstration_identity' };
  return next();
}

/**
 * Enforces that `req.actor` is present and has one of the allowed roles.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.actor) {
      return res.status(401).json({
        success: false,
        code: 'AUTHENTICATION_REQUIRED',
        message:
          'Demonstration identity is required (pass X-Demo-Actor-Id or X-Demo-Session-Token).',
      });
    }

    if (!allowedRoles.includes(req.actor.role)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        message: `Access denied. Required role: [${allowedRoles.join(', ')}], current role: "${req.actor.role}".`,
      });
    }

    return next();
  };
}
