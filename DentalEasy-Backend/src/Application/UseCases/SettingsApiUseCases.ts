import bcrypt from 'bcryptjs';
import {
  CreateTeamMemberDTO,
  UpdateNotificationPreferencesDTO,
  UpdateOrganizationSettingsDTO,
  UpdateTeamMemberDTO,
} from '../DTOs';
import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { UserContext } from '../../shared/types';

export interface ApiOrganizationSettings {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export interface ApiTeamMember {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SECRETARY' | 'DENTIST';
  avatarUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiNotificationPreferences {
  appointmentReminders: boolean;
  paymentAlerts: boolean;
  inventoryAlerts: boolean;
  systemAlerts: boolean;
  updatedAt: string;
}

export interface ApiPlanInfo {
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  limits: {
    users: number;
    inventoryItems: number;
    reportsHistoryMonths: number;
  };
}

const planLimits: Record<ApiPlanInfo['plan'], ApiPlanInfo['limits']> = {
  FREE: {
    users: 2,
    inventoryItems: 100,
    reportsHistoryMonths: 3,
  },
  PRO: {
    users: 10,
    inventoryItems: 1000,
    reportsHistoryMonths: 12,
  },
  ENTERPRISE: {
    users: 100,
    inventoryItems: 10000,
    reportsHistoryMonths: 36,
  },
};

const mapOrganization = (organization: {
  id: string;
  nome: string;
  slug: string;
  logoUrl: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
}): ApiOrganizationSettings => ({
  id: organization.id,
  name: organization.nome,
  slug: organization.slug,
  logoUrl: organization.logoUrl ?? undefined,
  document: organization.cnpj ?? undefined,
  email: organization.email ?? undefined,
  phone: organization.phone ?? undefined,
  address: organization.address ?? undefined,
  city: organization.city ?? undefined,
  state: organization.state ?? undefined,
  plan: organization.plan,
});

const mapTeamMember = (member: {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SECRETARY' | 'DENTIST';
  avatarUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ApiTeamMember => ({
  id: member.id,
  organizationId: member.organizationId,
  name: member.name,
  email: member.email,
  role: member.role,
  avatarUrl: member.avatarUrl ?? undefined,
  active: member.active,
  createdAt: member.createdAt.toISOString(),
  updatedAt: member.updatedAt.toISOString(),
});

export class SettingsApiUseCases {
  async getOrganizationSettings(user: UserContext): Promise<ApiOrganizationSettings> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (!organization) {
      throw new NotFoundError('Organizacao nao encontrada.');
    }

    return mapOrganization(organization);
  }

  async updateOrganizationSettings(
    user: UserContext,
    dto: UpdateOrganizationSettingsDTO,
  ): Promise<ApiOrganizationSettings> {
    ensureRole(user, ['ADMIN']);
    const updated = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        nome: dto.name,
        cnpj: dto.document,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        logoUrl: dto.logoUrl,
      },
    });

    return mapOrganization(updated);
  }

  async listTeam(user: UserContext): Promise<ApiTeamMember[]> {
    ensureRole(user, ['ADMIN']);
    const members = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((member) => mapTeamMember(member));
  }

  async createTeamMember(
    user: UserContext,
    dto: CreateTeamMemberDTO,
  ): Promise<ApiTeamMember & { temporaryPassword?: string }> {
    ensureRole(user, ['ADMIN']);

    const existingEmail = await prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingEmail) {
      throw new ValidationError('Ja existe usuario com este e-mail.');
    }

    const temporaryPassword = dto.password ?? this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const created = await prisma.user.create({
      data: {
        organizationId: user.organizationId,
        name: dto.name,
        email: dto.email,
        role: dto.role,
        passwordHash,
        avatarUrl: dto.avatarUrl,
        active: dto.active ?? true,
      },
    });

    return {
      ...mapTeamMember(created),
      temporaryPassword: dto.password ? undefined : temporaryPassword,
    };
  }

  async updateTeamMember(
    user: UserContext,
    teamMemberId: string,
    dto: UpdateTeamMemberDTO,
  ): Promise<ApiTeamMember> {
    ensureRole(user, ['ADMIN']);

    const existing = await prisma.user.findFirst({
      where: {
        id: teamMemberId,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Membro da equipe nao encontrado.');
    }

    if (dto.email && dto.email !== existing.email) {
      const conflict = await prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });
      if (conflict) {
        throw new ValidationError('Ja existe usuario com este e-mail.');
      }
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: dto.name,
        email: dto.email,
        role: dto.role,
        avatarUrl: dto.avatarUrl,
        active: dto.active,
        passwordHash: dto.password
          ? await bcrypt.hash(dto.password, 10)
          : undefined,
      },
    });

    return mapTeamMember(updated);
  }

  async getNotificationPreferences(
    user: UserContext,
  ): Promise<ApiNotificationPreferences> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    const preferences = await this.getOrCreatePreferences(user.organizationId);
    return {
      appointmentReminders: preferences.appointmentReminders,
      paymentAlerts: preferences.paymentAlerts,
      inventoryAlerts: preferences.inventoryAlerts,
      systemAlerts: preferences.systemAlerts,
      updatedAt: preferences.updatedAt.toISOString(),
    };
  }

  async updateNotificationPreferences(
    user: UserContext,
    dto: UpdateNotificationPreferencesDTO,
  ): Promise<ApiNotificationPreferences> {
    ensureRole(user, ['ADMIN']);
    const current = await this.getOrCreatePreferences(user.organizationId);

    const updated = await prisma.notificationPreference.update({
      where: { id: current.id },
      data: {
        appointmentReminders: dto.appointmentReminders,
        paymentAlerts: dto.paymentAlerts,
        inventoryAlerts: dto.inventoryAlerts,
        systemAlerts: dto.systemAlerts,
      },
    });

    return {
      appointmentReminders: updated.appointmentReminders,
      paymentAlerts: updated.paymentAlerts,
      inventoryAlerts: updated.inventoryAlerts,
      systemAlerts: updated.systemAlerts,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getPlanInfo(user: UserContext): Promise<ApiPlanInfo> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { plan: true },
    });

    if (!organization) {
      throw new NotFoundError('Organizacao nao encontrada.');
    }

    return {
      plan: organization.plan,
      limits: planLimits[organization.plan],
    };
  }

  private async getOrCreatePreferences(organizationId: string) {
    const existing = await prisma.notificationPreference.findUnique({
      where: { organizationId },
    });

    if (existing) {
      return existing;
    }

    return prisma.notificationPreference.create({
      data: {
        organizationId,
      },
    });
  }

  private generateTemporaryPassword(): string {
    return `Tmp#${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
  }
}
