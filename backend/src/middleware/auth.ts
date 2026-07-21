import { RequestHandler } from "express";
import { verifyToken } from "../utils/jwt";
import type { AccountRole } from "../utils/enums";

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  try {
    req.user = verifyToken(header.slice("Bearer ".length));
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export function requireRole(role: AccountRole): RequestHandler {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      res.status(403).json({ error: `Only ${role.toLowerCase()} accounts can do this` });
      return;
    }
    next();
  };
}
