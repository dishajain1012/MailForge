import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include user if not already done by Passport
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name?: string | null;
      avatarUrl?: string | null;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
};
