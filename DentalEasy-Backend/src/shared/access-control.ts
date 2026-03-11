import { AuthorizationError } from './errors';
import { UserContext, UserRole } from './types';

export const ensureRole = (user: UserContext, allowed: UserRole[]): void => {
  if (!allowed.includes(user.role)) {
    throw new AuthorizationError();
  }
};

export const ensureSameOrganization = (
  user: UserContext,
  organizationId: string,
): void => {
  if (user.organizationId !== organizationId) {
    throw new AuthorizationError('Acesso negado para dados de outra clinica.');
  }
};
