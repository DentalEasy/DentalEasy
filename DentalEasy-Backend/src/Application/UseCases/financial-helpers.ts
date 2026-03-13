import {
  FinancialPaymentMethod,
  FinancialPaymentStatus,
  PaymentStatus,
} from '@prisma/client';
import { prisma } from '../../Infrastructure/Persistence';
import {
  ApiFinancialRecord,
  mapPatient,
  toAmount,
  toISODate,
} from './shared-contracts';

type DecimalLike = { toNumber(): number } | number;

interface FinancialRecordMapperInput {
  id: string;
  organizationId: string;
  description: string;
  amount: DecimalLike;
  type: 'INCOME' | 'EXPENSE';
  category: string | null;
  paymentStatus: FinancialPaymentStatus;
  paymentMethod: FinancialPaymentMethod | null;
  dueDate: Date;
  paidAt: Date | null;
  patientId: string | null;
  notes: string | null;
  invoiceNumber: string | null;
  fiscalDocumentRef: string | null;
  nfeStatus: 'ISSUED' | 'PENDING' | 'ERROR' | null;
  createdAt: Date;
  updatedAt: Date;
  patient?: {
    id: string;
    organizationId: string;
    nome: string;
    email: string | null;
    telefone: string;
    cpf: string;
    dataNascimento: Date;
    avatarUrl: string | null;
    serasaStatus: 'GREEN' | 'YELLOW' | 'RED';
    endereco: string | null;
    alergias: string | null;
    observacoesMedicas: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  payments?: Array<{
    amount: DecimalLike;
    status: PaymentStatus;
    paidAt: Date | null;
    method: FinancialPaymentMethod;
  }>;
}

const todayStart = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const calculatePaidAmount = (
  payments: Array<{ amount: DecimalLike; status: PaymentStatus }>,
): number =>
  payments
    .filter((payment) => payment.status === 'SETTLED')
    .reduce((sum, payment) => sum + toAmount(payment.amount), 0);

export const resolveFinancialStatus = (
  currentStatus: FinancialPaymentStatus,
  dueDate: Date,
  amount: number,
  paidAmount: number,
): FinancialPaymentStatus => {
  if (currentStatus === 'CANCELLED' && paidAmount <= 0) {
    return 'CANCELLED';
  }

  if (paidAmount >= amount && amount > 0) {
    return 'PAID';
  }

  if (dueDate < todayStart()) {
    return 'OVERDUE';
  }

  return 'PENDING';
};

export const mapFinancialRecord = (
  record: FinancialRecordMapperInput,
): ApiFinancialRecord => {
  const amount = toAmount(record.amount);
  const paidAmount = calculatePaidAmount(record.payments ?? []);
  const remainingAmount = Math.max(amount - paidAmount, 0);

  return {
    id: record.id,
    organizationId: record.organizationId,
    description: record.description,
    amount,
    type: record.type,
    category: record.category ?? undefined,
    paymentStatus: record.paymentStatus,
    paymentMethod: record.paymentMethod ?? undefined,
    dueDate: toISODate(record.dueDate),
    paidAt: record.paidAt ? record.paidAt.toISOString() : undefined,
    patientId: record.patientId ?? undefined,
    patient: record.patient ? mapPatient(record.patient) : undefined,
    notes: record.notes ?? undefined,
    invoiceNumber: record.invoiceNumber ?? undefined,
    fiscalDocumentRef: record.fiscalDocumentRef ?? undefined,
    nfeStatus: record.nfeStatus ?? undefined,
    paidAmount,
    remainingAmount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
};

export const syncFinancialRecordStatus = async (
  organizationId: string,
  financialRecordId: string,
) => {
  const record = await prisma.financialRecord.findFirst({
    where: {
      id: financialRecordId,
      organizationId,
    },
    include: {
      payments: true,
    },
  });

  if (!record) {
    return null;
  }

  const amount = toAmount(record.amount);
  const paidAmount = calculatePaidAmount(record.payments);
  const nextStatus = resolveFinancialStatus(
    record.paymentStatus,
    record.dueDate,
    amount,
    paidAmount,
  );

  const latestSettledPayment = record.payments
    .filter((payment) => payment.status === 'SETTLED' && payment.paidAt)
    .sort((a, b) => {
      const dateA = a.paidAt ? a.paidAt.getTime() : 0;
      const dateB = b.paidAt ? b.paidAt.getTime() : 0;
      return dateB - dateA;
    })[0];

  return prisma.financialRecord.update({
    where: { id: record.id },
    data: {
      paymentStatus: nextStatus,
      paidAt: nextStatus === 'PAID' ? latestSettledPayment?.paidAt ?? new Date() : null,
      paymentMethod:
        nextStatus === 'PAID'
          ? latestSettledPayment?.method ?? record.paymentMethod
          : record.paymentMethod,
    },
    include: {
      patient: true,
      payments: true,
    },
  });
};

export const refreshOverdueFinancialRecords = async (
  organizationId: string,
): Promise<void> => {
  await prisma.financialRecord.updateMany({
    where: {
      organizationId,
      paymentStatus: 'PENDING',
      dueDate: { lt: todayStart() },
    },
    data: {
      paymentStatus: 'OVERDUE',
    },
  });
};
