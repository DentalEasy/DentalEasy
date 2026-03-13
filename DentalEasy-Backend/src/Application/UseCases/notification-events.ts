import { AppointmentStatus, NotificationType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '../../Infrastructure/Persistence';

interface CreateNotificationInput {
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  eventKey?: string;
  userId?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

const toMetadata = (
  value?: Record<string, unknown>,
): Prisma.InputJsonValue | undefined =>
  value as Prisma.InputJsonValue | undefined;

const toISODate = (date: Date): string => date.toISOString().split('T')[0];

const startOfToday = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfTomorrow = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 2);
  return date;
};

export const createNotification = async (
  input: CreateNotificationInput,
): Promise<void> => {
  const eventKey = input.eventKey ?? crypto.randomUUID();

  await prisma.appNotification.upsert({
    where: {
      organizationId_eventKey: {
        organizationId: input.organizationId,
        eventKey,
      },
    },
    update: {
      title: input.title,
      message: input.message,
      type: input.type,
      link: input.link,
      metadata: toMetadata(input.metadata),
      userId: input.userId,
    },
    create: {
      organizationId: input.organizationId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      metadata: toMetadata(input.metadata),
      userId: input.userId,
      eventKey,
    },
  });
};

export const ensureOperationalNotifications = async (
  organizationId: string,
): Promise<void> => {
  const [upcomingAppointments, overdueFinancialRecords, lowStockItems] =
    await Promise.all([
      prisma.appointment.findMany({
        where: {
          organizationId,
          date: {
            gte: startOfToday(),
            lt: endOfTomorrow(),
          },
          status: {
            in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
          },
        },
        include: {
          patient: true,
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        take: 12,
      }),
      prisma.financialRecord.findMany({
        where: {
          organizationId,
          paymentStatus: 'OVERDUE',
        },
        include: {
          patient: true,
        },
        orderBy: { dueDate: 'asc' },
        take: 12,
      }),
      prisma.inventoryItem.findMany({
        where: {
          organizationId,
          active: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
    ]);

  for (const appointment of upcomingAppointments) {
    const dateLabel = toISODate(appointment.date);
    await createNotification({
      organizationId,
      type: 'APPOINTMENT',
      title: 'Consulta proxima',
      message: `${appointment.patient.nome} em ${dateLabel} as ${appointment.startTime}.`,
      eventKey: `appointment-upcoming:${appointment.id}`,
      link: `/appointments?date=${dateLabel}`,
      metadata: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
      },
    });
  }

  for (const record of overdueFinancialRecords) {
    const patientName = record.patient?.nome ?? 'Paciente nao identificado';
    await createNotification({
      organizationId,
      type: 'PAYMENT',
      title: 'Pagamento vencido',
      message: `${patientName}: ${record.description} venceu em ${toISODate(
        record.dueDate,
      )}.`,
      eventKey: `financial-overdue:${record.id}`,
      link: '/financial',
      metadata: {
        financialRecordId: record.id,
        patientId: record.patientId,
      },
    });
  }

  for (const item of lowStockItems) {
    const currentStock = Number(item.currentStock);
    const minStock = Number(item.minStock);
    if (currentStock > minStock) {
      continue;
    }

    await createNotification({
      organizationId,
      type: 'INVENTORY',
      title: 'Estoque baixo',
      message: `${item.name}: ${currentStock} ${item.unit} (minimo ${minStock}).`,
      eventKey: `inventory-low:${item.id}`,
      link: '/inventory',
      metadata: {
        inventoryItemId: item.id,
      },
    });
  }
};
