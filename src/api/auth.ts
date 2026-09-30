import type { Request, Response, NextFunction } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const configuredKey = process.env.BEASTMQ_API_KEY;
  if (!configuredKey) {
    return next();
  }

  const headerKey = req.headers["x-api-key"] as string | undefined;
  const authHeader = req.headers.authorization;
  const bearerKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  const providedKey = headerKey || bearerKey;
  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing API key" });
  }

  next();
}
