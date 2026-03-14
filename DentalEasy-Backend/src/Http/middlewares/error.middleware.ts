import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../../config/env';
import { DomainError } from '../../shared/errors';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isProduction = env.NODE_ENV === 'production';

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados invalidos na requisicao.',
        details: isProduction ? undefined : err.issues,
      },
    });
    return;
  }

  if (err instanceof DomainError) {
    const isServerError = err.statusCode >= 500;
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: isProduction && isServerError
          ? 'Erro interno no servidor.'
          : err.message,
        details: isProduction ? undefined : err.details,
      },
    });
    return;
  }

  if ('status' in err && (err as { status?: number }).status === 413) {
    res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Payload acima do limite permitido.',
      },
    });
    return;
  }

  if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'JSON invalido na requisicao.',
      },
    });
    return;
  }

  // Log unknown errors to aid local diagnostics and production incident triage.
  // eslint-disable-next-line no-console
  console.error('[UnhandledError]', {
    method: req.method,
    path: req.path,
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno no servidor.',
      details: isProduction ? undefined : { stack: err.stack },
    },
  });
};
