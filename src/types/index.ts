// ============================================
// DentalSaaS - Types & Interfaces
// ============================================

export type Role = "ADMIN" | "SECRETARY" | "DENTIST";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  cnpj?: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
}

export interface Patient {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone: string;
  cpf: string;
  birthDate: string;
  avatarUrl?: string;
  serasaStatus: "GREEN" | "YELLOW" | "RED";
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | "CONFIRMED"
  | "PENDING"
  | "CANCELLED"
  | "COMPLETED";

export interface Appointment {
  id: string;
  organizationId: string;
  patientId: string;
  dentistId: string;
  patient: Patient;
  dentist: User;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  procedure?: string;
  notes?: string;
}

export interface FinancialRecord {
  id: string;
  organizationId: string;
  patientId: string;
  patient: Patient;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  paymentStatus: "PAID" | "PENDING" | "OVERDUE";
  paymentMethod?: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH" | "BOLETO";
  dueDate: string;
  paidAt?: string;
  nfeStatus?: "ISSUED" | "PENDING" | "ERROR";
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  organizationId: string;
  patientId: string;
  dentistId: string;
  dentist: User;
  type: "PROCEDURE" | "ANAMNESIS" | "PHOTO" | "NOTE";
  title: string;
  description: string;
  attachments?: string[];
  createdAt: string;
}

export interface Prescription {
  id: string;
  organizationId: string;
  patientId: string;
  dentistId: string;
  patient: Patient;
  dentist: User;
  content: string;
  createdAt: string;
}

export interface WhatsAppMessage {
  id: string;
  organizationId: string;
  patientId: string;
  patient: Patient;
  message: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  sentAt: string;
}

export interface DashboardStats {
  appointmentsToday: number;
  patientsTotal: number;
  revenueToday: number;
  revenueMonth: number;
  pendingPayments: number;
  messagesSent: number;
  messagesDelivered: number;
}
