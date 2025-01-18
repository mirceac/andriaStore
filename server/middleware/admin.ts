import { Request, Response, NextFunction } from "express";

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = req.user as any;
  if (!user.isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }

  next();
}
