import AuditLog from "../models/AuditLog.js";

export async function writeAudit(req, action, target = "", details = "") {
  try {
    await AuditLog.create({
      actor: req.user?.name || "Admin",
      action,
      target,
      details,
      ip: req.ip
    });
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
}
