import { UserRole } from '../../shared/types';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  organizationId: string;
}

export interface ApiPatient {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone: string;
  cpf: string;
  birthDate: string;
  avatarUrl?: string;
  serasaStatus: 'GREEN' | 'YELLOW' | 'RED';
  address?: string;
  allergies?: string;
  medicalNotes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ApiFinancialRecordType = 'INCOME' | 'EXPENSE';

export type ApiFinancialPaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';

export type ApiFinancialPaymentMethod =
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CASH'
  | 'BOLETO';

export interface ApiFinancialRecord {
  id: string;
  organizationId: string;
  description: string;
  amount: number;
  type: ApiFinancialRecordType;
  category?: string;
  paymentStatus: ApiFinancialPaymentStatus;
  paymentMethod?: ApiFinancialPaymentMethod;
  dueDate: string;
  paidAt?: string;
  patientId?: string;
  patient?: ApiPatient;
  notes?: string;
  invoiceNumber?: string;
  fiscalDocumentRef?: string;
  nfeStatus?: 'ISSUED' | 'PENDING' | 'ERROR';
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
}

export type ApiPaymentStatus = 'PENDING' | 'SETTLED' | 'CANCELLED';

export interface ApiPayment {
  id: string;
  organizationId: string;
  financialRecordId: string;
  amount: number;
  method: ApiFinancialPaymentMethod;
  status: ApiPaymentStatus;
  paidAt?: string;
  receivedFrom?: string;
  paidTo?: string;
  notes?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  receiptNumber?: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
  financialRecord?: ApiFinancialRecord;
}

export const toISODate = (date: Date): string => date.toISOString().split('T')[0];

export const toAmount = (value: { toNumber(): number } | number): number =>
  typeof value === 'number' ? value : value.toNumber();

export const mapUser = (user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  organizationId: string;
}): ApiUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl ?? undefined,
  organizationId: user.organizationId,
});

export const mapPatient = (patient: {
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
}): ApiPatient => ({
  id: patient.id,
  organizationId: patient.organizationId,
  name: patient.nome,
  email: patient.email ?? undefined,
  phone: patient.telefone,
  cpf: patient.cpf,
  birthDate: toISODate(patient.dataNascimento),
  avatarUrl: patient.avatarUrl ?? undefined,
  serasaStatus: patient.serasaStatus,
  address: patient.endereco ?? undefined,
  allergies: patient.alergias ?? undefined,
  medicalNotes: patient.observacoesMedicas ?? undefined,
  active: patient.active,
  createdAt: patient.createdAt.toISOString(),
  updatedAt: patient.updatedAt.toISOString(),
});
