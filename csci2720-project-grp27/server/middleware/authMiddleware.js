import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/tokenService.js";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; username: string; role: "user" | "admin" };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = verifyAccessToken(header.split(" ")[1]);
    req.user = { id: decoded.sub, username: decoded.username, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export const authorize = (...roles: Array<"user" | "admin">) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
};
