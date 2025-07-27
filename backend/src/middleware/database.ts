import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const requireDatabase = (req: Request, res: Response, next: NextFunction) => {
  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database unavailable',
      message: 'This endpoint requires a database connection. Please set up MongoDB.',
      demo: true
    });
  }
  next();
};

export const optionalDatabase = (req: Request, res: Response, next: NextFunction) => {
  // Add database status to request for conditional handling
  (req as any).dbAvailable = mongoose.connection.readyState === 1;
  next();
};
