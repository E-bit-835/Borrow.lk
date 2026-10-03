import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

/** JSON 404 for unknown API routes (instead of Express' default HTML page). */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
}

/** Translate known library / database errors into a client-safe status, code and message. */
function normalizeError(err: any): { status: number; code: string; message: string } {
  // File upload errors
  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    return {
      status: tooLarge ? 413 : 400,
      code: 'UPLOAD_ERROR',
      message: tooLarge ? 'File is too large. Maximum size is 15 MB.' : err.message,
    };
  }

  // Body parser errors
  if (err?.type === 'entity.parse.failed') {
    return { status: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON.' };
  }
  if (err?.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' };
  }

  // PostgreSQL errors (pg DatabaseError carries a 5-character SQLSTATE in `code`)
  if (typeof err?.code === 'string' && /^[0-9A-Z]{5}$/.test(err.code) && err.severity) {
    if (err.code === '23505') {
      return { status: 409, code: 'CONFLICT', message: 'A record with these details already exists.' };
    }
    if (err.code === '23503') {
      return { status: 400, code: 'INVALID_REFERENCE', message: 'A referenced record does not exist.' };
    }
    if (err.code.startsWith('22') || err.code.startsWith('23')) {
      return { status: 400, code: 'INVALID_INPUT', message: 'The submitted data is invalid.' };
    }
    return { status: 500, code: 'DATABASE_ERROR', message: 'A database error occurred.' };
  }

  const status = Number(err?.status || err?.statusCode) || 500;
  const code = typeof err?.code === 'string' ? err.code : status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST';
  // Never leak internal error text for unexpected failures outside development
  const message =
    status >= 500 && process.env.NODE_ENV !== 'development'
      ? 'An unexpected error occurred on the server.'
      : err?.message || 'An unexpected error occurred on the server.';

  return { status, code, message };
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const { status, code, message } = normalizeError(err);

  if (status >= 500) {
    console.error('❌ Server Error:', err);
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && status >= 500 ? { stack: err.stack } : {}),
    },
  });
}
