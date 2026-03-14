import { env } from '../../config/env';
import { UserRole } from '../../shared/types';
import { prisma } from './prisma-client';

export interface AuthOrganizationRecord {
  id: string;
  nome: string;
  slug: string;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  cnpj: string | null;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export interface AuthUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl: string | null;
  role: UserRole;
  active: boolean;
  organizationId: string;
  failedLoginAttempts: number;
  loginBlockedUntil: Date | null;
  mfaEnabled: boolean;
  mfaSecretEncrypted: string | null;
  mfaBackupCodesHash: string[];
  mfaEnrolledAt: Date | null;
  organization: AuthOrganizationRecord;
}

export class PrismaUserRepository {
  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    return prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { organization: true },
    });
  }

  async findById(userId: string): Promise<AuthUserRecord | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
  }

  async registerFailedLogin(userId: string): Promise<void> {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        failedLoginAttempts: true,
      },
    });

    if (!current) {
      return;
    }

    const attempts = current.failedLoginAttempts + 1;
    const shouldBlock = attempts >= env.AUTH_LOGIN_MAX_ATTEMPTS_PER_ACCOUNT;
    const loginBlockedUntil = shouldBlock
      ? new Date(Date.now() + env.AUTH_LOGIN_BLOCK_MINUTES * 60 * 1000)
      : null;

    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        loginBlockedUntil,
      },
    });
  }

  async clearFailedLogins(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        loginBlockedUntil: null,
      },
    });
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    });
  }
}
