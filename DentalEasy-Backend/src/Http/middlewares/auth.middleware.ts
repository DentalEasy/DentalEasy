import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../../shared/types';

const allowedRoles: UserRole[] = ['ADMIN', 'SECRETARY', 'DENTIST'];

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const userId = req.header('x-user-id');
  const organizationId = req.header('x-organization-id');
  const role = req.header('x-user-role') as UserRole | undefined;

  if (!userId || !organizationId || !role || !allowedRoles.includes(role)) {
    res.status(401).json({
      message:
        'Credenciais invalidas. Informe x-user-id, x-organization-id e x-user-role.',
    });
    return;
  }

  req.user = {
    userId,
    organizationId,
    role,
  };

  next();
};
