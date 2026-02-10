import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || undefined,
    });
    return;
  }

  // Multer errors (file size, file type, etc.)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        message: 'File too large. Maximum size: 2GB',
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Multer file filter errors (thrown as plain Error)
  if (err.message && err.message.startsWith('File type not allowed')) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [
        { field: 'video', message: err.message },
      ],
    });
    return;
  }

  // Prisma known request errors
  if (err.name === 'PrismaClientKnownRequestError' && 'code' in err) {
    const prismaErr = err as Error & { code: string };
    if (prismaErr.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'A record with this value already exists',
      });
      return;
    }
  }

  // Body-parser SyntaxError (malformed JSON)
  if (err instanceof SyntaxError && 'statusCode' in err && (err as any).statusCode === 400) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
    });
    return;
  }

  if (err instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
