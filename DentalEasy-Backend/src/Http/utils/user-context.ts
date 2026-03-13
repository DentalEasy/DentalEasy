import { Request } from 'express';
import { AuthenticationError } from '../../shared/errors';
import { UserContext } from '../../shared/types';

export const getUserContext = (req: Request): UserContext => {
  if (!req.user) {
    throw new AuthenticationError();
  }

  return req.user;
};
