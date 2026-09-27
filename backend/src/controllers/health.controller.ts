import { Request, Response, NextFunction } from 'express';
import { getHealthStatus } from '../services/health.service';

export const checkHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await getHealthStatus();
    res.status(200).json(health);
  } catch (error) {
    next(error);
  }
};
