import { NextFunction, Request, Response } from 'express';
import { DomainError } from '../../shared/errors';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof DomainError) {
    res.status(400).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: 'Erro interno no servidor.' });
};
