import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Unhandled Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error occurred';

  res.status(statusCode).json({
    success: false,
    error: err.name || 'ServerError',
    message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
