import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../../shared/errors';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados invalidos na requisicao.',
        details: err.issues,
      },
    });
    return;
  }

  if (err instanceof DomainError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
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
  console.error('[UnhandledError]', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno no servidor.',
    },
  });
};
