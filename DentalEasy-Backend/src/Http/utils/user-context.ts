import { Request } from 'express';
import { AuthorizationError } from '../../shared/errors';
import { UserContext } from '../../shared/types';

export const getUserContext = (req: Request): UserContext => {
  if (!req.user) {
    throw new AuthorizationError('Usuario nao autenticado.');
  }

  return req.user;
};
