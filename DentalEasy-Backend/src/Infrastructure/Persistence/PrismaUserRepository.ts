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
  organization: AuthOrganizationRecord;
}

export class PrismaUserRepository {
  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    return prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });
  }

  async findById(userId: string): Promise<AuthUserRecord | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
  }
}
