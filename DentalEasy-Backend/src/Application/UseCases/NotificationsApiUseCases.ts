import { NotificationType, Prisma } from '@prisma/client';
import { ListNotificationsQueryDTO } from '../DTOs';
import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { NotFoundError } from '../../shared/errors';
import { UserContext } from '../../shared/types';
import { ensureOperationalNotifications } from './notification-events';

export interface ApiNotification {
  id: string;
  organizationId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  metadata?: Prisma.JsonValue;
  link?: string;
}

const mapNotification = (record: {
  id: string;
  organizationId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  metadata: Prisma.JsonValue | null;
  link: string | null;
}): ApiNotification => ({
  id: record.id,
  organizationId: record.organizationId,
  title: record.title,
  message: record.message,
  type: record.type,
  read: record.read,
  createdAt: record.createdAt.toISOString(),
  metadata: record.metadata ?? undefined,
  link: record.link ?? undefined,
});

export class NotificationsApiUseCases {
  async listNotifications(
    user: UserContext,
    query: ListNotificationsQueryDTO,
  ): Promise<ApiNotification[]> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    await ensureOperationalNotifications(user.organizationId);

    const where: Prisma.AppNotificationWhereInput = {
      organizationId: user.organizationId,
      OR: [{ userId: null }, { userId: user.userId }],
    };

    if (query.read !== undefined) {
      where.read = query.read;
    }

    if (query.type) {
      where.type = query.type;
    }

    const records = await prisma.appNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => mapNotification(record));
  }

  async getNotificationById(
    user: UserContext,
    notificationId: string,
  ): Promise<ApiNotification> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    const record = await this.findNotificationOrThrow(user, notificationId);
    return mapNotification(record);
  }

  async markAsRead(
    user: UserContext,
    notificationId: string,
  ): Promise<ApiNotification> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    const existing = await this.findNotificationOrThrow(user, notificationId);

    const updated = await prisma.appNotification.update({
      where: { id: existing.id },
      data: { read: true },
    });

    return mapNotification(updated);
  }

  async markAllAsRead(user: UserContext): Promise<{ updatedCount: number }> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    const result = await prisma.appNotification.updateMany({
      where: {
        organizationId: user.organizationId,
        OR: [{ userId: null }, { userId: user.userId }],
        read: false,
      },
      data: {
        read: true,
      },
    });

    return {
      updatedCount: result.count,
    };
  }

  async deleteNotification(user: UserContext, notificationId: string): Promise<void> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    const existing = await this.findNotificationOrThrow(user, notificationId);
    await prisma.appNotification.delete({ where: { id: existing.id } });
  }

  private async findNotificationOrThrow(
    user: UserContext,
    notificationId: string,
  ) {
    const record = await prisma.appNotification.findFirst({
      where: {
        id: notificationId,
        organizationId: user.organizationId,
        OR: [{ userId: null }, { userId: user.userId }],
      },
    });

    if (!record) {
      throw new NotFoundError('Notificacao nao encontrada.');
    }

    return record;
  }
}
