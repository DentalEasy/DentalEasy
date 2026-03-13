import { FinancialPaymentStatus, FinancialRecordType } from '@prisma/client';
import { ReportsPeriodQueryDTO } from '../DTOs';
import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { ValidationError } from '../../shared/errors';
import { UserContext } from '../../shared/types';

interface PeriodRange {
  from: Date;
  to: Date;
}

const toAmount = (value: { toNumber(): number } | number): number =>
  typeof value === 'number' ? value : value.toNumber();

const toDateOnly = (date: Date): string => date.toISOString().split('T')[0];

const labelsByMonth = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const labelsByWeekDay = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const parsePeriod = (query: ReportsPeriodQueryDTO): PeriodRange => {
  const to = query.to
    ? new Date(`${query.to}T23:59:59.999Z`)
    : new Date();
  const from = query.from
    ? new Date(`${query.from}T00:00:00.000Z`)
    : new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 5, 1));

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new ValidationError('Periodo informado invalido.');
  }

  if (from > to) {
    throw new ValidationError('Parametro from nao pode ser maior que to.');
  }

  return { from, to };
};

const getMonthBuckets = (from: Date, to: Date) => {
  const buckets: Array<{ key: string; month: string }> = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));

  while (cursor <= end) {
    const key = `${cursor.getUTCFullYear()}-${String(
      cursor.getUTCMonth() + 1,
    ).padStart(2, '0')}`;
    buckets.push({
      key,
      month: labelsByMonth[cursor.getUTCMonth()],
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return buckets;
};

export interface FinancialReportResponse {
  period: {
    from: string;
    to: string;
  };
  totals: {
    income: number;
    expense: number;
    profit: number;
    pending: number;
    overdueAmount: number;
  };
  revenueByMonth: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    type: FinancialRecordType;
    amount: number;
  }>;
}

export interface ProceduresReportResponse {
  topProcedures: Array<{
    name: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  weekly: Array<{
    day: string;
    count: number;
    revenue: number;
  }>;
}

export interface PatientsReportResponse {
  period: {
    from: string;
    to: string;
  };
  metrics: {
    totalActive: number;
    newPatients: number;
    returnRate: number;
    avgTicket: number;
    overdueCount: number;
    overdueAmount: number;
  };
  monthlyNewPatients: Array<{
    month: string;
    count: number;
  }>;
  retentionFunnel: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
}

export interface TeamReportResponse {
  period: {
    from: string;
    to: string;
  };
  performance: Array<{
    dentistId: string;
    name: string;
    patients: number;
    procedures: number;
    revenue: number;
    satisfaction: number;
  }>;
}

export class ReportsApiUseCases {
  async getFinancialReport(
    user: UserContext,
    query: ReportsPeriodQueryDTO,
  ): Promise<FinancialReportResponse> {
    ensureRole(user, ['ADMIN', 'DENTIST', 'SECRETARY']);
    const period = parsePeriod(query);

    const [records, payments] = await Promise.all([
      prisma.financialRecord.findMany({
        where: {
          organizationId: user.organizationId,
          createdAt: {
            gte: period.from,
            lte: period.to,
          },
        },
      }),
      prisma.payment.findMany({
        where: {
          organizationId: user.organizationId,
          status: 'SETTLED',
          paidAt: {
            gte: period.from,
            lte: period.to,
          },
        },
      }),
    ]);

    let income = 0;
    let expense = 0;
    let pending = 0;
    let overdueAmount = 0;
    const monthMap = new Map<string, { income: number; expense: number }>();
    const categoryMap = new Map<string, number>();

    for (const record of records) {
      const amount = toAmount(record.amount);
      const monthKey = `${record.createdAt.getUTCFullYear()}-${String(
        record.createdAt.getUTCMonth() + 1,
      ).padStart(2, '0')}`;
      const month = monthMap.get(monthKey) ?? { income: 0, expense: 0 };

      if (record.type === 'INCOME') {
        income += amount;
        month.income += amount;
      } else {
        expense += amount;
        month.expense += amount;
      }

      monthMap.set(monthKey, month);

      if (
        record.paymentStatus === 'PENDING' ||
        record.paymentStatus === 'OVERDUE'
      ) {
        pending += amount;
      }

      if (record.paymentStatus === 'OVERDUE') {
        overdueAmount += amount;
      }

      const category = record.category ?? 'Sem categoria';
      categoryMap.set(
        `${record.type}:${category}`,
        (categoryMap.get(`${record.type}:${category}`) ?? 0) + amount,
      );
    }

    const totalPayments = payments.reduce(
      (sum, payment) => sum + toAmount(payment.amount),
      0,
    );
    const paymentMethodsMap = new Map<
      string,
      { count: number; amount: number }
    >();
    for (const payment of payments) {
      const current = paymentMethodsMap.get(payment.method) ?? {
        count: 0,
        amount: 0,
      };
      current.count += 1;
      current.amount += toAmount(payment.amount);
      paymentMethodsMap.set(payment.method, current);
    }

    const monthBuckets = getMonthBuckets(period.from, period.to);
    const revenueByMonth = monthBuckets.map((bucket) => {
      const values = monthMap.get(bucket.key) ?? { income: 0, expense: 0 };
      return {
        month: bucket.month,
        income: values.income,
        expense: values.expense,
      };
    });

    const paymentMethods = Array.from(paymentMethodsMap.entries())
      .map(([method, values]) => ({
        method,
        count: values.count,
        amount: values.amount,
        percentage:
          totalPayments > 0
            ? Number(((values.amount / totalPayments) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([key, amount]) => {
        const [type, category] = key.split(':');
        return {
          category,
          type: type as FinancialRecordType,
          amount,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      period: {
        from: toDateOnly(period.from),
        to: toDateOnly(period.to),
      },
      totals: {
        income,
        expense,
        profit: income - expense,
        pending,
        overdueAmount,
      },
      revenueByMonth,
      paymentMethods,
      categoryBreakdown,
    };
  }

  async getProceduresReport(
    user: UserContext,
    query: ReportsPeriodQueryDTO,
  ): Promise<ProceduresReportResponse> {
    ensureRole(user, ['ADMIN', 'DENTIST', 'SECRETARY']);
    const period = parsePeriod(query);

    const [appointments, proceduresCatalog] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          organizationId: user.organizationId,
          date: {
            gte: period.from,
            lte: period.to,
          },
          status: { not: 'CANCELLED' },
          procedure: { not: null },
        },
      }),
      prisma.procedure.findMany({
        where: {
          organizationId: user.organizationId,
        },
      }),
    ]);

    const procedurePriceMap = new Map(
      proceduresCatalog.map((procedure) => [
        procedure.name.toLowerCase(),
        toAmount(procedure.price),
      ]),
    );
    const procedureMap = new Map<string, { count: number; revenue: number }>();

    for (const appointment of appointments) {
      const name = appointment.procedure?.trim();
      if (!name) {
        continue;
      }

      const key = name.toLowerCase();
      const current = procedureMap.get(key) ?? { count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += procedurePriceMap.get(key) ?? 0;
      procedureMap.set(key, current);
    }

    const totalCount = Array.from(procedureMap.values()).reduce(
      (sum, item) => sum + item.count,
      0,
    );
    const topProcedures = Array.from(procedureMap.entries())
      .map(([name, values]) => ({
        name: name
          .split(' ')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' '),
        count: values.count,
        revenue: values.revenue,
        percentage:
          totalCount > 0
            ? Number(((values.count / totalCount) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const weeklyMap = new Map<number, { count: number; revenue: number }>();
    for (const appointment of appointments) {
      const weekDay = appointment.date.getUTCDay();
      const amount =
        procedurePriceMap.get((appointment.procedure ?? '').toLowerCase()) ?? 0;
      const current = weeklyMap.get(weekDay) ?? { count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += amount;
      weeklyMap.set(weekDay, current);
    }

    const weekly = labelsByWeekDay.map((day, index) => ({
      day,
      count: weeklyMap.get(index)?.count ?? 0,
      revenue: weeklyMap.get(index)?.revenue ?? 0,
    }));

    return {
      topProcedures,
      weekly,
    };
  }

  async getPatientsReport(
    user: UserContext,
    query: ReportsPeriodQueryDTO,
  ): Promise<PatientsReportResponse> {
    ensureRole(user, ['ADMIN', 'DENTIST', 'SECRETARY']);
    const period = parsePeriod(query);

    const [
      totalActive,
      newPatients,
      overdueFinancialRecords,
      appointments,
      settledIncome,
      treatmentPlans,
      completedTreatmentPlans,
    ] = await Promise.all([
      prisma.paciente.count({
        where: {
          organizationId: user.organizationId,
          active: true,
        },
      }),
      prisma.paciente.count({
        where: {
          organizationId: user.organizationId,
          createdAt: {
            gte: period.from,
            lte: period.to,
          },
        },
      }),
      prisma.financialRecord.findMany({
        where: {
          organizationId: user.organizationId,
          type: 'INCOME',
          paymentStatus: FinancialPaymentStatus.OVERDUE,
        },
      }),
      prisma.appointment.findMany({
        where: {
          organizationId: user.organizationId,
          date: {
            gte: period.from,
            lte: period.to,
          },
          status: { not: 'CANCELLED' },
        },
        select: {
          patientId: true,
        },
      }),
      prisma.financialRecord.findMany({
        where: {
          organizationId: user.organizationId,
          type: 'INCOME',
          paymentStatus: 'PAID',
          paidAt: {
            gte: period.from,
            lte: period.to,
          },
        },
        select: {
          patientId: true,
          amount: true,
        },
      }),
      prisma.treatmentPlan.count({
        where: {
          organizationId: user.organizationId,
        },
      }),
      prisma.treatmentPlan.count({
        where: {
          organizationId: user.organizationId,
          status: 'COMPLETED',
        },
      }),
    ]);

    const overdueCount = overdueFinancialRecords.length;
    const overdueAmount = overdueFinancialRecords.reduce(
      (sum, record) => sum + toAmount(record.amount),
      0,
    );

    const patientsWithAppointments = new Set(
      appointments.map((appointment) => appointment.patientId),
    ).size;
    const returnRate =
      totalActive > 0
        ? Number(((patientsWithAppointments / totalActive) * 100).toFixed(2))
        : 0;

    const totalSettledIncome = settledIncome.reduce(
      (sum, record) => sum + toAmount(record.amount),
      0,
    );
    const paidPatients = new Set(
      settledIncome
        .map((record) => record.patientId)
        .filter((value): value is string => Boolean(value)),
    ).size;
    const avgTicket =
      paidPatients > 0
        ? Number((totalSettledIncome / paidPatients).toFixed(2))
        : 0;

    const monthlyBuckets = getMonthBuckets(period.from, period.to);
    const patientsByMonth = await prisma.paciente.groupBy({
      by: ['createdAt'],
      where: {
        organizationId: user.organizationId,
        createdAt: {
          gte: period.from,
          lte: period.to,
        },
      },
      _count: {
        _all: true,
      },
    });

    const monthlyMap = new Map<string, number>();
    for (const row of patientsByMonth) {
      const key = `${row.createdAt.getUTCFullYear()}-${String(
        row.createdAt.getUTCMonth() + 1,
      ).padStart(2, '0')}`;
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + row._count._all);
    }

    const monthlyNewPatients = monthlyBuckets.map((bucket) => ({
      month: bucket.month,
      count: monthlyMap.get(bucket.key) ?? 0,
    }));

    const retentionFunnelBase = totalActive;
    const retentionFunnel = [
      { stage: 'Primeira consulta', count: retentionFunnelBase },
      { stage: 'Retorno agendado', count: patientsWithAppointments },
      {
        stage: 'Plano de tratamento',
        count: treatmentPlans,
      },
      {
        stage: 'Tratamento concluido',
        count: completedTreatmentPlans,
      },
    ].map((entry) => ({
      ...entry,
      percentage:
        retentionFunnelBase > 0
          ? Number(((entry.count / retentionFunnelBase) * 100).toFixed(2))
          : 0,
    }));

    return {
      period: {
        from: toDateOnly(period.from),
        to: toDateOnly(period.to),
      },
      metrics: {
        totalActive,
        newPatients,
        returnRate,
        avgTicket,
        overdueCount,
        overdueAmount,
      },
      monthlyNewPatients,
      retentionFunnel,
    };
  }

  async getTeamReport(
    user: UserContext,
    query: ReportsPeriodQueryDTO,
  ): Promise<TeamReportResponse> {
    ensureRole(user, ['ADMIN', 'DENTIST', 'SECRETARY']);
    const period = parsePeriod(query);

    const dentists = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        role: 'DENTIST',
        active: true,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });

    const performance = [];
    for (const dentist of dentists) {
      const appointments = await prisma.appointment.findMany({
        where: {
          organizationId: user.organizationId,
          dentistUserId: dentist.id,
          date: {
            gte: period.from,
            lte: period.to,
          },
          status: { not: 'CANCELLED' },
        },
        select: {
          patientId: true,
          procedure: true,
        },
      });

      const proceduresCount = appointments.length;
      const patients = new Set(appointments.map((item) => item.patientId)).size;

      const revenueRecords = await prisma.financialRecord.findMany({
        where: {
          organizationId: user.organizationId,
          type: 'INCOME',
          paymentStatus: 'PAID',
          paidAt: {
            gte: period.from,
            lte: period.to,
          },
          patientId: {
            in: appointments.map((item) => item.patientId),
          },
        },
        select: {
          amount: true,
        },
      });

      const revenue = revenueRecords.reduce(
        (sum, record) => sum + toAmount(record.amount),
        0,
      );

      performance.push({
        dentistId: dentist.id,
        name: dentist.name,
        patients,
        procedures: proceduresCount,
        revenue,
        satisfaction: 4.8,
      });
    }

    performance.sort((a, b) => b.revenue - a.revenue);

    return {
      period: {
        from: toDateOnly(period.from),
        to: toDateOnly(period.to),
      },
      performance,
    };
  }
}
