import type {
  AppNotification,
  Appointment,
  AppointmentStatus,
  DashboardData,
  FinancialRecord,
  FinancialReport,
  InventoryItem,
  InventoryMovement,
  MedicalRecord,
  NotificationPreferences,
  Organization,
  OrganizationSettings,
  PatientsReport,
  PlanInfo,
  Payment,
  PaymentReceipt,
  Patient,
  PatientSummary,
  Prescription,
  Procedure,
  ProceduresReport,
  TeamMember,
  TeamReport,
  TreatmentPlan,
  TreatmentPlanStatus,
  User,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api";

const TOKEN_STORAGE_KEY = "dental-saas-token";

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export interface AuthSessionResponse {
  token: string;
  role: User["role"];
  user: User;
  organization: Organization;
}

export interface AuthMeResponse {
  role: User["role"];
  user: User;
  organization: Organization;
}

const isBrowser = () => typeof window !== "undefined";

export const getStoredToken = (): string | null => {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const setStoredToken = (token: string): void => {
  if (!isBrowser()) return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearStoredToken = (): void => {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

const handleUnauthorized = () => {
  clearStoredToken();
  if (!isBrowser()) return;
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith("/login")) {
    window.location.replace("/login");
  }
};

async function request<T>(
  path: string,
  init?: RequestInit,
  auth = false
): Promise<T> {
  const headers = new Headers(init?.headers);

  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const responseData = (await response.json().catch(() => null)) as
    | ApiErrorPayload
    | T
    | null;

  if (auth && response.status === 401) {
    handleUnauthorized();
  }

  if (!response.ok) {
    const message =
      (responseData as ApiErrorPayload | null)?.error?.message ??
      (responseData as ApiErrorPayload | null)?.message ??
      "Erro inesperado na requisicao.";
    const code = (responseData as ApiErrorPayload | null)?.error?.code;
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return responseData as T;
}

async function requestBlob(
  path: string,
  init?: RequestInit,
  auth = false
): Promise<Blob> {
  const headers = new Headers(init?.headers);

  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (auth && response.status === 401) {
    handleUnauthorized();
  }

  if (!response.ok) {
    let message = "Erro inesperado na requisicao.";
    let code: string | undefined;

    try {
      const payload = (await response.json()) as ApiErrorPayload;
      message = payload.error?.message ?? payload.message ?? message;
      code = payload.error?.code;
    } catch {
      // noop
    }

    throw new ApiError(message, response.status, code);
  }

  return response.blob();
}

const queryString = (params?: object) => {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      search.set(key, String(value));
    }
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
};

export const authLogin = (email: string, password: string) =>
  request<AuthSessionResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    false
  );

export const authMe = () => request<AuthMeResponse>("/auth/me", undefined, true);

export const listDentists = () => request<User[]>("/users/dentists", undefined, true);

export interface ListPatientsParams {
  search?: string;
  serasaStatus?: Patient["serasaStatus"];
  active?: boolean;
}

export interface UpsertPatientPayload {
  name: string;
  email?: string;
  phone: string;
  cpf: string;
  birthDate: string;
  avatarUrl?: string;
  serasaStatus?: Patient["serasaStatus"];
  address?: string;
  allergies?: string;
  medicalNotes?: string;
  active?: boolean;
}

export const listPatients = (params?: ListPatientsParams) =>
  request<Patient[]>(`/patients${queryString(params)}`, undefined, true);

export const getPatientById = (id: string) =>
  request<Patient>(`/patients/${id}`, undefined, true);

export const getPatientSummary = (id: string) =>
  request<PatientSummary>(`/patients/${id}/summary`, undefined, true);

export const createPatient = (payload: UpsertPatientPayload) =>
  request<Patient>(
    "/patients",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );

export const updatePatient = (id: string, payload: Partial<UpsertPatientPayload>) =>
  request<Patient>(
    `/patients/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true
  );

export const deletePatient = (id: string) =>
  request<void>(
    `/patients/${id}`,
    {
      method: "DELETE",
    },
    true
  );

export interface ListAppointmentsParams {
  date?: string;
  dentistId?: string;
  status?: AppointmentStatus;
  patientId?: string;
}

export interface UpsertAppointmentPayload {
  patientId: string;
  dentistId: string;
  date: string;
  startTime: string;
  endTime: string;
  title?: string;
  procedure?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export const listAppointments = (params?: ListAppointmentsParams) =>
  request<Appointment[]>(
    `/appointments${queryString(params as Record<string, unknown>)}`,
    undefined,
    true
  );

export const createAppointment = (payload: UpsertAppointmentPayload) =>
  request<Appointment>(
    "/appointments",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );

export const updateAppointment = (
  id: string,
  payload: Partial<UpsertAppointmentPayload>
) =>
  request<Appointment>(
    `/appointments/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true
  );

export const updateAppointmentStatus = (id: string, status: AppointmentStatus) =>
  request<Appointment>(
    `/appointments/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    true
  );

export const deleteAppointment = (id: string) =>
  request<void>(
    `/appointments/${id}`,
    {
      method: "DELETE",
    },
    true
  );

export interface ListMedicalRecordsParams {
  patientId?: string;
  type?: MedicalRecord["type"];
}

export interface UpsertMedicalRecordPayload {
  patientId: string;
  type: MedicalRecord["type"];
  title: string;
  description: string;
  attachments?: string[];
}

export const listMedicalRecords = (params?: ListMedicalRecordsParams) =>
  request<MedicalRecord[]>(
    `/medical-records${queryString(params as Record<string, unknown>)}`,
    undefined,
    true
  );

export const listPatientMedicalRecords = (patientId: string) =>
  request<MedicalRecord[]>(`/patients/${patientId}/medical-records`, undefined, true);

export const createMedicalRecord = (payload: UpsertMedicalRecordPayload) =>
  request<MedicalRecord>(
    "/medical-records",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );

export const updateMedicalRecord = (
  id: string,
  payload: Partial<UpsertMedicalRecordPayload>
) =>
  request<MedicalRecord>(
    `/medical-records/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true
  );

export const deleteMedicalRecord = (id: string) =>
  request<void>(
    `/medical-records/${id}`,
    {
      method: "DELETE",
    },
    true
  );

export interface CreatePrescriptionPayload {
  patientId: string;
  scope?: Prescription["details"]["scope"];
  category?: Prescription["details"]["category"];
  title?: string;
  content?: string;
  medications?: Prescription["details"]["medications"];
  additionalInstructions?: string;
  observations?: string;
  supplementarySection?: Prescription["details"]["supplementarySection"];
  requiresTwoCopies?: boolean;
  includePatientAddress?: boolean;
  controlledCategory?: string;
  issuePlace?: string;
  professionalOverride?: Prescription["details"]["professionalOverride"];
}

export const listPrescriptions = (patientId?: string) =>
  request<Prescription[]>(
    `/prescriptions${queryString({ patientId })}`,
    undefined,
    true
  );

export const createPrescription = (payload: CreatePrescriptionPayload) =>
  request<Prescription>(
    "/prescriptions",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );

export const exportPrescriptionDocx = (id: string) =>
  requestBlob(`/prescriptions/${id}/export?format=docx`, undefined, true);

export interface ListFinancialRecordsParams {
  type?: FinancialRecord["type"];
  paymentStatus?: FinancialRecord["paymentStatus"];
  category?: string;
  patientId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  periodFrom?: string;
  periodTo?: string;
}

export interface UpsertFinancialRecordPayload {
  description: string;
  amount: number;
  type: FinancialRecord["type"];
  category?: string;
  paymentStatus?: FinancialRecord["paymentStatus"];
  paymentMethod?: FinancialRecord["paymentMethod"];
  dueDate: string;
  paidAt?: string;
  patientId?: string;
  notes?: string;
  invoiceNumber?: string;
  fiscalDocumentRef?: string;
  nfeStatus?: FinancialRecord["nfeStatus"];
}

export const listFinancialRecords = (params?: ListFinancialRecordsParams) =>
  request<FinancialRecord[]>(
    `/financial-records${queryString(params as Record<string, unknown>)}`,
    undefined,
    true
  );

export const getFinancialRecordById = (id: string) =>
  request<FinancialRecord>(`/financial-records/${id}`, undefined, true);

export const createFinancialRecord = (payload: UpsertFinancialRecordPayload) =>
  request<FinancialRecord>(
    "/financial-records",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );

export const updateFinancialRecord = (
  id: string,
  payload: Partial<UpsertFinancialRecordPayload>
) =>
  request<FinancialRecord>(
    `/financial-records/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true
  );

export const deleteFinancialRecord = (id: string) =>
  request<void>(
    `/financial-records/${id}`,
    {
      method: "DELETE",
    },
    true
  );

export interface ListPaymentsParams {
  financialRecordId?: string;
  patientId?: string;
  status?: Payment["status"];
  method?: Payment["method"];
}

export interface CreatePaymentPayload {
  financialRecordId: string;
  amount: number;
  method: Payment["method"];
  status?: Payment["status"];
  paidAt?: string;
  receivedFrom?: string;
  paidTo?: string;
  notes?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  receiptNumber?: string;
}

export interface SettlePaymentPayload {
  paidAt?: string;
  notes?: string;
}

export interface UpdatePaymentPayload {
  amount?: number;
  method?: Payment["method"];
  status?: Payment["status"];
  paidAt?: string;
  receivedFrom?: string;
  paidTo?: string;
  notes?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  receiptNumber?: string;
}

export const listPayments = (params?: ListPaymentsParams) =>
  request<Payment[]>(
    `/payments${queryString(params as Record<string, unknown>)}`,
    undefined,
    true
  );

export const getPaymentById = (id: string) =>
  request<Payment>(`/payments/${id}`, undefined, true);

export const createPayment = (payload: CreatePaymentPayload) =>
  request<Payment>(
    "/payments",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );

export const settlePayment = (id: string, payload: SettlePaymentPayload) =>
  request<Payment>(
    `/payments/${id}/settle`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );

export const updatePayment = (id: string, payload: UpdatePaymentPayload) =>
  request<Payment>(
    `/payments/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true
  );

export const getPaymentReceipt = (id: string) =>
  request<PaymentReceipt>(`/payments/${id}/receipt`, undefined, true);

export interface ListProceduresParams {
  active?: boolean;
  search?: string;
  category?: string;
}

export interface UpsertProcedurePayload {
  name: string;
  description?: string;
  category?: string;
  price: number;
  durationMinutes: number;
  active?: boolean;
}

export const listProcedures = (params?: ListProceduresParams) =>
  request<Procedure[]>(
    `/procedures${queryString(params as Record<string, unknown>)}`,
    undefined,
    true
  );

export const getProcedureById = (id: string) =>
  request<Procedure>(`/procedures/${id}`, undefined, true);

export const createProcedure = (payload: UpsertProcedurePayload) =>
  request<Procedure>(
    "/procedures",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );

export const updateProcedure = (
  id: string,
  payload: Partial<UpsertProcedurePayload>
) =>
  request<Procedure>(
    `/procedures/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true
  );

export const toggleProcedure = (id: string, active?: boolean) =>
  request<Procedure>(
    `/procedures/${id}/toggle`,
    {
      method: "PATCH",
      body: JSON.stringify({ active }),
    },
    true
  );

export const deleteProcedure = (id: string) =>
  request<void>(
    `/procedures/${id}`,
    {
      method: "DELETE",
    },
    true
  );

export interface ListTreatmentPlansParams {
  status?: TreatmentPlanStatus;
  patientId?: string;
  search?: string;
}

export interface TreatmentPlanItemPayload {
  procedureId?: string;
  procedureName?: string;
  category?: string;
  tooth?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface UpsertTreatmentPlanPayload {
  patientId: string;
  title?: string;
  status?: TreatmentPlanStatus;
  discount?: number;
  notes?: string;
  installments?: number;
  items: TreatmentPlanItemPayload[];
}

export const listTreatmentPlans = (params?: ListTreatmentPlansParams) =>
  request<TreatmentPlan[]>(
    `/treatment-plans${queryString(params as Record<string, unknown>)}`,
    undefined,
    true
  );

export const getTreatmentPlanById = (id: string) =>
  request<TreatmentPlan>(`/treatment-plans/${id}`, undefined, true);

export const createTreatmentPlan = (payload: UpsertTreatmentPlanPayload) =>
  request<TreatmentPlan>(
    "/treatment-plans",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );

export const updateTreatmentPlan = (
  id: string,
  payload: Partial<UpsertTreatmentPlanPayload>
) =>
  request<TreatmentPlan>(
    `/treatment-plans/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true
  );

export const updateTreatmentPlanStatus = (
  id: string,
  status: TreatmentPlanStatus
) =>
  request<TreatmentPlan>(
    `/treatment-plans/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    true
  );

export const deleteTreatmentPlan = (id: string) =>
  request<void>(
    `/treatment-plans/${id}`,
    {
      method: "DELETE",
    },
    true
  );

export interface ListInventoryItemsParams {
  active?: boolean;
  search?: string;
  category?: string;
  lowStock?: boolean;
}

export interface UpsertInventoryItemPayload {
  name: string;
  sku?: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  cost: number;
  supplier?: string;
  active?: boolean;
}

export interface RestockInventoryItemPayload {
  quantity: number;
  cost?: number;
  notes?: string;
  date?: string;
}

export const listInventoryItems = (params?: ListInventoryItemsParams) =>
  request<InventoryItem[]>(
    `/inventory/items${queryString(params as Record<string, unknown>)}`,
    undefined,
    true
  );

export const getInventoryItemById = (id: string) =>
  request<InventoryItem>(`/inventory/items/${id}`, undefined, true);

export const createInventoryItem = (payload: UpsertInventoryItemPayload) =>
  request<InventoryItem>(
    "/inventory/items",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );

export const updateInventoryItem = (
  id: string,
  payload: Partial<UpsertInventoryItemPayload>
) =>
  request<InventoryItem>(
    `/inventory/items/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true
  );

export const deleteInventoryItem = (id: string) =>
  request<void>(
    `/inventory/items/${id}`,
    {
      method: "DELETE",
    },
    true
  );

export const restockInventoryItem = (
  id: string,
  payload: RestockInventoryItemPayload
) =>
  request<{ item: InventoryItem; movement: InventoryMovement }>(
    `/inventory/items/${id}/restock`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );

export interface ListNotificationsParams {
  read?: boolean;
  type?: AppNotification["type"];
}

export const listNotifications = (params?: ListNotificationsParams) =>
  request<AppNotification[]>(
    `/notifications${queryString(params as Record<string, unknown>)}`,
    undefined,
    true
  );

export const getNotificationById = (id: string) =>
  request<AppNotification>(`/notifications/${id}`, undefined, true);

export const markNotificationAsRead = (id: string) =>
  request<AppNotification>(
    `/notifications/${id}/read`,
    {
      method: "PATCH",
    },
    true
  );

export const markAllNotificationsAsRead = () =>
  request<{ updatedCount: number }>(
    "/notifications/read-all",
    {
      method: "PATCH",
    },
    true
  );

export const deleteNotification = (id: string) =>
  request<void>(
    `/notifications/${id}`,
    {
      method: "DELETE",
    },
    true
  );

export interface UpdateOrganizationSettingsPayload {
  name?: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  logoUrl?: string;
}

export interface CreateTeamMemberPayload {
  name: string;
  email: string;
  role: TeamMember["role"];
  password?: string;
  avatarUrl?: string;
  active?: boolean;
}

export interface UpdateTeamMemberPayload {
  name?: string;
  email?: string;
  role?: TeamMember["role"];
  password?: string;
  avatarUrl?: string;
  active?: boolean;
}

export const getOrganizationSettings = () =>
  request<OrganizationSettings>("/settings/organization", undefined, true);

export const updateOrganizationSettings = (
  payload: UpdateOrganizationSettingsPayload
) =>
  request<OrganizationSettings>(
    "/settings/organization",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true
  );

export const listTeamMembers = () =>
  request<TeamMember[]>("/settings/team", undefined, true);

export const createTeamMember = (payload: CreateTeamMemberPayload) =>
  request<TeamMember>(
    "/settings/team",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );

export const updateTeamMember = (
  id: string,
  payload: UpdateTeamMemberPayload
) =>
  request<TeamMember>(
    `/settings/team/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true
  );

export const getNotificationPreferences = () =>
  request<NotificationPreferences>("/settings/notifications", undefined, true);

export const updateNotificationPreferences = (
  payload: Partial<NotificationPreferences>
) =>
  request<NotificationPreferences>(
    "/settings/notifications",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true
  );

export const getPlanInfo = () =>
  request<PlanInfo>("/settings/plan", undefined, true);

export const getDashboard = () =>
  request<DashboardData>("/dashboard", undefined, true);

export interface ReportsPeriodParams {
  from?: string;
  to?: string;
}

export const getFinancialReport = (params?: ReportsPeriodParams) =>
  request<FinancialReport>(
    `/reports/financial${queryString(params as Record<string, unknown>)}`,
    undefined,
    true
  );

export const getProceduresReport = (params?: ReportsPeriodParams) =>
  request<ProceduresReport>(
    `/reports/procedures${queryString(params as Record<string, unknown>)}`,
    undefined,
    true
  );

export const getPatientsReport = (params?: ReportsPeriodParams) =>
  request<PatientsReport>(
    `/reports/patients${queryString(params as Record<string, unknown>)}`,
    undefined,
    true
  );

export const getTeamReport = (params?: ReportsPeriodParams) =>
  request<TeamReport>(
    `/reports/team${queryString(params as Record<string, unknown>)}`,
    undefined,
    true
  );
