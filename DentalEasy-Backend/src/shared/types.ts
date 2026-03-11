export type UserRole = 'ADMIN' | 'SECRETARY' | 'DENTIST';

export interface UserContext {
  userId: string;
  organizationId: string;
  role: UserRole;
}
