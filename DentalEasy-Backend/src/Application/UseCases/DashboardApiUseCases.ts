import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { UserContext } from '../../shared/types';
import { ensureOperationalNotifications } from './notification-events';

export interface ApiDashboardAppointment {
  id: string;
  patientId: string;
  patientName: string;
  dentistId: string;
  dentistName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  procedure?: string;
}

export interface ApiDashboardNotification {
  id: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'PAYMENT' | 'INVENTORY' | 'SYSTEM' | 'TREATMENT';
  createdAt: string;
  read: boolean;
}

export interface ApiDashboardData {
  totalPatients: number;
  appointmentsToday: number;
  pendingPayments: number;
  monthlyRevenue: number;
  lowStockItems: number;
  upcomingAppointments: ApiDashboardAppointment[];
  recentNotifications: ApiDashboardNotification[];
  weeklyRevenue: Array<{ day: string; amount: number }>;
  messagesSent: number;
  messagesDelivered: number;
}

const toAmount = (value: { toNumber(): number } | number): number =>
  typeof value === 'number' ? value : value.toNumber();

const toDateOnly = (date: Date): string => date.toISOString().split('T')[0];

const startOfDay = (value = new Date()): Date => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value = new Date()): Date => {
  const date = startOfDay(value);
  date.setDate(date.getDate() + 1);
  return date;
};

const startOfMonth = (): Date => {
  const date = new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
};

const buildWeeklyTimeline = () => {
  const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  const start = startOfDay();
  start.setDate(start.getDate() - 6);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      dateKey: toDateOnly(date),
      day: labels[date.getDay()],
    };
  });
};

export class DashboardApiUseCases {
  async getDashboard(user: UserContext): Promise<ApiDashboardData> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    await ensureOperationalNotifications(user.organizationId);

    const today = new Date();
    const [totalPatients, appointmentsToday, pendingPayments, inventoryItems] =
      await Promise.all([
        prisma.paciente.count({
          where: {
            organizationId: user.organizationId,
            active: true,
          },
        }),
        prisma.appointment.count({
          where: {
            organizationId: user.organizationId,
            date: {
              gte: startOfDay(today),
              lt: endOfDay(today),
            },
            status: {
              not: 'CANCELLED',
            },
          },
        }),
        prisma.financialRecord.count({
          where: {
            organizationId: user.organizationId,
            paymentStatus: { in: ['PENDING', 'OVERDUE'] },
          },
        }),
        prisma.inventoryItem.findMany({
          where: {
            organizationId: user.organizationId,
            active: true,
          },
          select: {
            currentStock: true,
            minStock: true,
          },
        }),
      ]);

    const lowStockItems = inventoryItems.filter(
      (item) => toAmount(item.currentStock) <= toAmount(item.minStock),
    ).length;

    const paidIncomeRecords = await prisma.financialRecord.findMany({
      where: {
        organizationId: user.organizationId,
        type: 'INCOME',
        paymentStatus: 'PAID',
        paidAt: {
          gte: startOfMonth(),
        },
      },
      select: {
        amount: true,
        paidAt: true,
      },
    });

    const monthlyRevenue = paidIncomeRecords.reduce(
      (sum, record) => sum + toAmount(record.amount),
      0,
    );

    const [upcomingAppointmentsRaw, recentNotificationsRaw] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          organizationId: user.organizationId,
          date: {
            gte: startOfDay(today),
          },
          status: {
            in: ['CONFIRMED', 'PENDING'],
          },
        },
        include: {
          patient: true,
          dentist: true,
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        take: 8,
      }),
      prisma.appNotification.findMany({
        where: {
          organizationId: user.organizationId,
          OR: [{ userId: null }, { userId: user.userId }],
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const upcomingAppointments = upcomingAppointmentsRaw.map((appointment) => ({
      id: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patient.nome,
      dentistId: appointment.dentistUserId,
      dentistName: appointment.dentist.name,
      date: toDateOnly(appointment.date),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      procedure: appointment.procedure ?? undefined,
    }));

    const recentNotifications = recentNotificationsRaw.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt.toISOString(),
      read: notification.read,
    }));

    const weeklyTimeline = buildWeeklyTimeline();
    const incomeByDay = new Map<string, number>();

    for (const record of paidIncomeRecords) {
      if (!record.paidAt) {
        continue;
      }
      const key = toDateOnly(record.paidAt);
      incomeByDay.set(key, (incomeByDay.get(key) ?? 0) + toAmount(record.amount));
    }

    const weeklyRevenue = weeklyTimeline.map((entry) => ({
      day: entry.day,
      amount: incomeByDay.get(entry.dateKey) ?? 0,
    }));

    const messagesSent = upcomingAppointments.length;
    const messagesDelivered = Math.max(messagesSent - 1, 0);

    return {
      totalPatients,
      appointmentsToday,
      pendingPayments,
      monthlyRevenue,
      lowStockItems,
      upcomingAppointments,
      recentNotifications,
      weeklyRevenue,
      messagesSent,
      messagesDelivered,
    };
  }
}
