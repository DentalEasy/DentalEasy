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
  address?: string;
  allergies?: string;
  medicalNotes?: string;
  active: boolean;
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
  title?: string;
  procedure?: string;
  notes?: string;
  reminderSent?: boolean;
}

export interface FinancialRecord {
  id: string;
  organizationId: string;
  patientId?: string;
  patient?: Patient;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category?: string;
  paymentStatus: "PAID" | "PENDING" | "OVERDUE" | "CANCELLED";
  paymentMethod?: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH" | "BOLETO";
  dueDate: string;
  paidAt?: string;
  notes?: string;
  invoiceNumber?: string;
  fiscalDocumentRef?: string;
  nfeStatus?: "ISSUED" | "PENDING" | "ERROR";
  paidAmount?: number;
  remainingAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  organizationId: string;
  financialRecordId: string;
  amount: number;
  method: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH" | "BOLETO";
  status: "PENDING" | "SETTLED" | "CANCELLED";
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
  financialRecord?: FinancialRecord;
}

export interface PaymentReceipt {
  organization: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    cnpj?: string;
  };
  payment: Payment;
  financialRecord: FinancialRecord;
  issuedAt: string;
  receiptNumber: string;
  beneficiary?: string;
  payer?: string;
}

export interface Procedure {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  durationMinutes: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TreatmentPlanStatus =
  | "DRAFT"
  | "SENT"
  | "APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "REJECTED";

export interface TreatmentPlanItem {
  id: string;
  procedureId?: string;
  procedureName: string;
  category?: string;
  tooth?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface TreatmentPlan {
  id: string;
  organizationId: string;
  patientId: string;
  patient: {
    id: string;
    name: string;
    phone: string;
  };
  title: string;
  status: TreatmentPlanStatus;
  discount?: number;
  totalAmount: number;
  notes?: string;
  installments?: number;
  items: TreatmentPlanItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  organizationId: string;
  name: string;
  sku?: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  cost: number;
  supplier?: string;
  active: boolean;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  type: "RESTOCK" | "ADJUSTMENT";
  quantity: number;
  cost?: number;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  organizationId: string;
  title: string;
  message: string;
  type: "APPOINTMENT" | "PAYMENT" | "INVENTORY" | "SYSTEM" | "TREATMENT";
  read: boolean;
  createdAt: string;
  metadata?: unknown;
  link?: string;
}

export interface NotificationPreferences {
  appointmentReminders: boolean;
  paymentAlerts: boolean;
  inventoryAlerts: boolean;
  systemAlerts: boolean;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  temporaryPassword?: string;
}

export interface OrganizationSettings {
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
  plan: "FREE" | "PRO" | "ENTERPRISE";
}

export interface PlanInfo {
  plan: "FREE" | "PRO" | "ENTERPRISE";
  limits: {
    users: number;
    inventoryItems: number;
    reportsHistoryMonths: number;
  };
}

export interface DashboardData {
  totalPatients: number;
  appointmentsToday: number;
  pendingPayments: number;
  monthlyRevenue: number;
  lowStockItems: number;
  upcomingAppointments: Array<{
    id: string;
    patientId: string;
    patientName: string;
    dentistId: string;
    dentistName: string;
    date: string;
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    procedure?: string;
  }>;
  recentNotifications: Array<{
    id: string;
    title: string;
    message: string;
    type: AppNotification["type"];
    createdAt: string;
    read: boolean;
  }>;
  weeklyRevenue: Array<{
    day: string;
    amount: number;
  }>;
  messagesSent: number;
  messagesDelivered: number;
}

export interface FinancialReport {
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
    type: FinancialRecord["type"];
    amount: number;
  }>;
}

export interface ProceduresReport {
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

export interface PatientsReport {
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

export interface TeamReport {
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

export type PrescriptionScope = "ODONTOLOGICAL";

export type PrescriptionCategory = "SIMPLE" | "ANTIBIOTIC" | "CONTROLLED";

export interface PrescriptionMedication {
  name: string;
  dcb?: string;
  pharmaceuticalForm?: string;
  concentration?: string;
  dosage?: string;
  administrationRoute?: string;
  treatmentDuration?: string;
  quantity?: string;
  additionalInstructions?: string;
}

export interface PrescriptionSupplementarySection {
  additionalGuidance?: string;
  observations?: string;
  rest?: string;
  diet?: string;
  adverseReactions?: string;
  notes?: string;
}

export interface PrescriptionProfessionalOverride {
  displayName?: string;
  councilLabel?: string;
  specialty?: string;
  email?: string;
  phone?: string;
  signatureLabel?: string;
}

export interface PrescriptionDetails {
  version: 1;
  scope: PrescriptionScope;
  category: PrescriptionCategory;
  template: "BRAZIL_CLINIC_A5";
  title: string;
  content?: string;
  medications: PrescriptionMedication[];
  additionalInstructions?: string;
  observations?: string;
  supplementarySection?: PrescriptionSupplementarySection;
  requiresTwoCopies: boolean;
  includePatientAddress: boolean;
  controlledCategory?: string;
  issuePlace?: string;
  professionalOverride?: PrescriptionProfessionalOverride;
  legacyContentLines?: string[];
}

export interface Prescription {
  id: string;
  organizationId: string;
  patientId: string;
  dentistId: string;
  patient: Patient;
  dentist: User;
  content: string;
  details: PrescriptionDetails;
  createdAt: string;
  updatedAt: string;
}

export type SummarySource = "MODERN" | "LEGACY";

export interface PatientSummaryClinicalItem {
  id: string;
  source: SummarySource;
  category: "DIAGNOSIS" | "TREATMENT" | "RECORD";
  title: string;
  description: string;
  occurredAt: string;
  professionalName?: string;
  recordType?: MedicalRecord["type"] | "LEGACY_DIAGNOSIS" | "LEGACY_TREATMENT";
  attachments?: string[];
}

export interface PatientSummaryProcedureItem {
  id: string;
  source: SummarySource;
  title: string;
  description: string;
  occurredAt: string;
  professionalName?: string;
}

export interface PatientSummaryAppointmentItem {
  id: string;
  source: SummarySource;
  status: AppointmentStatus;
  statusOrigin: "EXPLICIT" | "INFERRED";
  date: string;
  startTime: string;
  endTime?: string;
  startsAt: string;
  procedure: string;
  notes?: string;
  professionalName: string;
}

export interface PatientSummaryPrescriptionItem {
  id: string;
  source: SummarySource;
  createdAt: string;
  content: string;
  professionalName: string;
}

export interface PatientSummaryDocumentItem {
  id: string;
  source: SummarySource;
  kind: "ATTACHMENT" | "PRESCRIPTION" | "FISCAL_DOCUMENT";
  title: string;
  createdAt: string;
  professionalName?: string;
  url?: string;
  contentPreview?: string;
}

export interface PatientSummaryTreatmentPlanItem {
  id: string;
  procedureId?: string;
  procedureName: string;
  category?: string;
  tooth?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface PatientSummaryTreatmentPlan {
  id: string;
  title: string;
  status: TreatmentPlanStatus;
  discount?: number;
  totalAmount: number;
  notes?: string;
  installments?: number;
  createdAt: string;
  updatedAt: string;
  items: PatientSummaryTreatmentPlanItem[];
}

export interface PatientSummaryFinancialEntry {
  id: string;
  source: SummarySource;
  includeInTotals: boolean;
  description: string;
  type: FinancialRecord["type"];
  status: FinancialRecord["paymentStatus"];
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: FinancialRecord["paymentMethod"];
  notes?: string;
  invoiceNumber?: string;
  fiscalDocumentRef?: string;
  receiptNumber?: string;
  barcode?: string;
  nfeStatus?: FinancialRecord["nfeStatus"];
}

export interface PatientSummaryPaymentItem {
  id: string;
  source: SummarySource;
  description: string;
  amount: number;
  status: Payment["status"];
  method?: Payment["method"];
  paidAt?: string;
  createdAt: string;
  notes?: string;
  receiptNumber?: string;
}

export interface PatientSummaryPendingItem {
  id: string;
  source: SummarySource;
  kind: "APPOINTMENT" | "FINANCIAL" | "TREATMENT_PLAN" | "ALERT";
  title: string;
  description: string;
  status: string;
  dueAt?: string;
}

export interface PatientSummary {
  patient: Patient;
  chart: {
    id?: string;
    clinicalAccessGranted: boolean;
    diagnoses: PatientSummaryClinicalItem[];
    treatments: PatientSummaryClinicalItem[];
    records: PatientSummaryClinicalItem[];
    timeline: PatientSummaryClinicalItem[];
  };
  appointments: {
    total: number;
    upcoming: PatientSummaryAppointmentItem[];
    past: PatientSummaryAppointmentItem[];
    pendingCount: number;
    nextAppointmentAt?: string;
    lastAppointmentAt?: string;
  };
  procedures: {
    totalPerformed: number;
    items: PatientSummaryProcedureItem[];
  };
  prescriptions: {
    total: number;
    items: PatientSummaryPrescriptionItem[];
  };
  documents: {
    total: number;
    items: PatientSummaryDocumentItem[];
  };
  treatmentPlans: {
    total: number;
    active: number;
    items: PatientSummaryTreatmentPlan[];
  };
  financial: {
    entries: PatientSummaryFinancialEntry[];
    payments: PatientSummaryPaymentItem[];
    totals: {
      generatedRevenue: number;
      patientLinkedCosts: number;
      trackedProfit: number;
      totalPaid: number;
      totalPending: number;
      totalOverdue: number;
      totalOutstanding: number;
      entryCount: number;
      paymentCount: number;
    };
  };
  pendingItems: PatientSummaryPendingItem[];
  indicators: {
    appointmentsTotal: number;
    upcomingAppointments: number;
    completedAppointments: number;
    totalClinicalEntries: number;
    totalDocuments: number;
    totalProcedures: number;
    activeTreatmentPlans: number;
    prescriptionsIssued: number;
    pendingFinancialEntries: number;
    overdueFinancialEntries: number;
    nextAppointmentAt?: string;
    lastAppointmentAt?: string;
    lastClinicalEntryAt?: string;
    lastPaymentAt?: string;
  };
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
