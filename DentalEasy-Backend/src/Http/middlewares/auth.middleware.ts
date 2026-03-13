import { NextFunction, Request, Response } from 'express';
import { AuthenticationError, AuthorizationError } from '../../shared/errors';
import { verifyAccessToken } from '../../shared/jwt';
import { UserRole } from '../../shared/types';

const bearerPrefix = 'Bearer ';

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authorization = req.header('authorization');

    if (!authorization || !authorization.startsWith(bearerPrefix)) {
      throw new AuthenticationError(
        'Token ausente. Informe o header Authorization: Bearer <token>.',
      );
    }

    const token = authorization.slice(bearerPrefix.length).trim();
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.sub,
      organizationId: payload.organizationId,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles =
  (allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError();
      }

      next();
    } catch (error) {
      next(error);
    }
  };
