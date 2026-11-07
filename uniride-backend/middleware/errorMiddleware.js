export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (error?.code === 11000) return res.status(409).json({ message: "A record with this value already exists." });
  if (error?.name === "ValidationError") return res.status(400).json({ message: error.message });
  res.status(500).json({ message: "An unexpected server error occurred." });
}
