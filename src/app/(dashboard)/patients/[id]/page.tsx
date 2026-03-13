"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Mail,
  Paperclip,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  User,
  Upload,
  XCircle,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { RoleGate } from "@/components/auth";
import { PageTransition } from "@/lib/animations";
import { formatCPF, formatCurrency, formatDate, formatPhone } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import {
  ApiError,
  getPatientById,
  listAppointments,
  listFinancialRecords,
  listPatientMedicalRecords,
  listTreatmentPlans,
} from "@/lib/api";
import type {
  AppointmentStatus,
  FinancialRecord,
  MedicalRecord,
  Patient,
  TreatmentPlanStatus,
} from "@/types";

type SummaryAppointment = {
  id: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  procedure: string;
  dentist: string;
};

type SummaryFinancial = {
  id: string;
  date: string;
  amount: number;
  description: string;
  method: string;
  status: FinancialRecord["paymentStatus"];
  type: FinancialRecord["type"];
};

type SummaryRecord = {
  id: string;
  date: string;
  title: string;
  description: string;
  typeLabel: string;
  dentist: string;
  attachments: string[];
};

type SummaryPlan = {
  id: string;
  title: string;
  status: TreatmentPlanStatus;
  totalAmount: number;
  itemsCount: number;
};

type PatientDocument = {
  id: string;
  name: string;
  type: "odontograma" | "radiografia" | "exame" | "receita" | "outro";
  uploadedAt: string;
  uploadedBy: string;
  notes: string;
  url?: string;
};

const paymentMethodLabel: Record<NonNullable<FinancialRecord["paymentMethod"]>, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartao de credito",
  DEBIT_CARD: "Cartao de debito",
  CASH: "Dinheiro",
  BOLETO: "Boleto",
};

const recordTypeLabel: Record<MedicalRecord["type"], string> = {
  PROCEDURE: "Procedimento",
  ANAMNESIS: "Anamnese",
  PHOTO: "Foto/Anexo",
  NOTE: "Anotacao",
};

const DOC_LABEL: Record<PatientDocument["type"], string> = {
  odontograma: "Odontograma",
  radiografia: "Radiografia",
  exame: "Exame",
  receita: "Receita",
  outro: "Outro",
};

const DOC_COLOR: Record<PatientDocument["type"], string> = {
  odontograma: "bg-violet-50 text-violet-700 border-violet-200",
  radiografia: "bg-blue-50 text-blue-700 border-blue-200",
  exame: "bg-emerald-50 text-emerald-700 border-emerald-200",
  receita: "bg-amber-50 text-amber-700 border-amber-200",
  outro: "bg-neutral-50 text-neutral-600 border-neutral-200",
};

const statusClass: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  CANCELED: "bg-red-50 text-red-700 border-red-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DRAFT: "bg-neutral-100 text-neutral-700 border-neutral-200",
  SENT: "bg-indigo-50 text-indigo-700 border-indigo-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const statusLabel: Record<string, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluida",
  PENDING: "Pendente",
  CANCELLED: "Cancelada",
  CANCELED: "Cancelada",
  PAID: "Pago",
  OVERDUE: "Vencido",
  IN_PROGRESS: "Em andamento",
  APPROVED: "Aprovado",
  DRAFT: "Rascunho",
  SENT: "Enviado",
  REJECTED: "Rejeitado",
};

const serasaConfig = {
  GREEN: { label: "Regular", icon: ShieldCheck, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  YELLOW: { label: "Atencao", icon: ShieldAlert, color: "bg-amber-50 text-amber-700 border-amber-200" },
  RED: { label: "Pendencia", icon: Shield, color: "bg-red-50 text-red-700 border-red-200" },
} as const;

const toTimestamp = (date: string, time: string) => {
  const value = new Date(`${date}T${time}:00`).getTime();
  return Number.isNaN(value) ? 0 : value;
};

const getFileName = (value: string) => {
  const last = value.split("/").pop() ?? value;
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
};

const inferDocType = (name: string): PatientDocument["type"] => {
  const lower = name.toLowerCase();
  if (lower.includes("odont")) return "odontograma";
  if (lower.includes("radio") || lower.endsWith(".dcm")) return "radiografia";
  if (lower.includes("receita") || lower.includes("prescricao")) return "receita";
  if (lower.includes("exame") || lower.includes("laborat")) return "exame";
  return "outro";
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
        statusClass[status] ?? "bg-neutral-50 text-neutral-600 border-neutral-200"
      }`}
    >
      {statusLabel[status] ?? status}
    </span>
  );
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { role } = useAuth();
  const { addToast } = useToast();

  const canViewRecords = role === "ADMIN" || role === "DENTIST";

  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<SummaryAppointment[]>([]);
  const [financials, setFinancials] = useState<SummaryFinancial[]>([]);
  const [records, setRecords] = useState<SummaryRecord[]>([]);
  const [plans, setPlans] = useState<SummaryPlan[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [docFilter, setDocFilter] = useState<string>("all");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setNotFound(false);
        setError(null);

        const recordsRequest = canViewRecords ? listPatientMedicalRecords(id) : Promise.resolve([]);
        const [patientData, appointmentsData, financialData, plansData, recordsData] = await Promise.all([
          getPatientById(id),
          listAppointments({ patientId: id }),
          listFinancialRecords({ patientId: id }),
          listTreatmentPlans({ patientId: id }),
          recordsRequest,
        ]);

        if (!active) return;

        const mappedAppointments: SummaryAppointment[] = appointmentsData
          .map((item) => ({
            id: item.id,
            date: item.date,
            time: item.startTime,
            status: item.status,
            procedure: item.procedure ?? "Consulta",
            dentist: item.dentist.name,
          }))
          .sort((a, b) => toTimestamp(b.date, b.time) - toTimestamp(a.date, a.time));

        const mappedFinancials: SummaryFinancial[] = financialData
          .map((item) => ({
            id: item.id,
            date: item.paidAt ?? item.dueDate,
            amount: item.amount,
            description: item.description,
            method: item.paymentMethod ? paymentMethodLabel[item.paymentMethod] : "-",
            status: item.paymentStatus,
            type: item.type,
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const mappedRecords: SummaryRecord[] = (recordsData as MedicalRecord[])
          .map((item) => ({
            id: item.id,
            date: item.createdAt,
            title: item.title,
            description: item.description,
            typeLabel: recordTypeLabel[item.type],
            dentist: item.dentist.name,
            attachments: item.attachments ?? [],
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const mappedPlans: SummaryPlan[] = plansData.map((item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          totalAmount: item.totalAmount,
          itemsCount: item.items.length,
        }));

        const mappedDocs: PatientDocument[] = mappedRecords.flatMap((record) =>
          record.attachments.map((path, index) => {
            const name = getFileName(path);
            return {
              id: `${record.id}-${index}`,
              name,
              type: inferDocType(name),
              uploadedAt: record.date,
              uploadedBy: record.dentist,
              notes: record.title,
              url: path,
            };
          })
        );

        setPatient(patientData);
        setAppointments(mappedAppointments);
        setFinancials(mappedFinancials);
        setRecords(mappedRecords);
        setPlans(mappedPlans);
        setDocuments(mappedDocs);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          setPatient(null);
          return;
        }
        setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar os dados do paciente.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [id, canViewRecords, refreshTick]);

  const initials = useMemo(() => {
    if (!patient) return "--";
    return patient.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [patient]);

  const totalPaid = useMemo(
    () => financials.filter((f) => f.type === "INCOME" && f.status === "PAID").reduce((sum, f) => sum + f.amount, 0),
    [financials]
  );
  const totalPending = useMemo(
    () =>
      financials
        .filter((f) => f.type === "INCOME" && (f.status === "PENDING" || f.status === "OVERDUE"))
        .reduce((sum, f) => sum + f.amount, 0),
    [financials]
  );

  const nextAppointment = useMemo(() => {
    const list = appointments
      .filter((item) => item.status === "CONFIRMED" || item.status === "PENDING")
      .sort((a, b) => toTimestamp(a.date, a.time) - toTimestamp(b.date, b.time));
    return list.find((item) => toTimestamp(item.date, item.time) >= Date.now()) ?? list[0];
  }, [appointments]);

  const activePlans = useMemo(
    () => plans.filter((plan) => !["COMPLETED", "CANCELED", "REJECTED"].includes(plan.status)).length,
    [plans]
  );

  const filteredDocs = useMemo(
    () => documents.filter((doc) => docFilter === "all" || doc.type === docFilter),
    [documents, docFilter]
  );

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageTransition>
    );
  }

  if (notFound || !patient) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="mb-3 h-12 w-12 text-neutral-300" />
          <h3 className="text-lg font-semibold text-neutral-700">Paciente nao encontrado</h3>
          <Button className="mt-4" variant="outline" onClick={() => router.push("/patients")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Pacientes
          </Button>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="mb-3 h-12 w-12 text-red-300" />
          <h3 className="text-lg font-semibold text-neutral-700">Falha ao carregar paciente</h3>
          <p className="mt-1 text-sm text-neutral-500">{error}</p>
          <Button className="mt-4" variant="outline" onClick={() => setRefreshTick((v) => v + 1)}>
            Tentar novamente
          </Button>
        </div>
      </PageTransition>
    );
  }

  const serasa = serasaConfig[patient.serasaStatus];
  const SerasaIcon = serasa.icon;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/patients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary-100 text-lg text-primary-700">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-neutral-900">{patient.name}</h2>
                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${serasa.color}`}>
                  <SerasaIcon className="h-3 w-3" /> {serasa.label}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{formatPhone(patient.phone)}</span>
                {patient.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{patient.email}</span>}
                <span>CPF: {formatCPF(patient.cpf)}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Nasc: {formatDate(patient.birthDate)}</span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push("/appointments")}>
                <Calendar className="mr-1.5 h-3.5 w-3.5" /> Agendar
              </Button>
              <RoleGate allowedRoles={["ADMIN", "DENTIST"]}>
                <Button variant="outline" size="sm" onClick={() => router.push("/clinical-records")}>
                  <ClipboardList className="mr-1.5 h-3.5 w-3.5" /> Prontuario
                </Button>
              </RoleGate>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-xs text-neutral-400">Consultas</p><p className="text-lg font-semibold">{appointments.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-neutral-400">Total Pago</p><p className="text-lg font-semibold">{formatCurrency(totalPaid)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-neutral-400">Pendente</p><p className="text-lg font-semibold">{formatCurrency(totalPending)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-neutral-400">Planos Ativos</p><p className="text-lg font-semibold">{activePlans}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="resumo">
          <TabsList className="bg-neutral-100 p-1">
            <TabsTrigger value="resumo" className="text-xs"><User className="mr-1.5 h-3.5 w-3.5" />Resumo</TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs"><Paperclip className="mr-1.5 h-3.5 w-3.5" />Documentos</TabsTrigger>
            <TabsTrigger value="prontuario" className="text-xs"><ClipboardList className="mr-1.5 h-3.5 w-3.5" />Prontuario</TabsTrigger>
            <TabsTrigger value="financeiro" className="text-xs"><CreditCard className="mr-1.5 h-3.5 w-3.5" />Financeiro</TabsTrigger>
            <TabsTrigger value="tratamentos" className="text-xs"><FileText className="mr-1.5 h-3.5 w-3.5" />Tratamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="mt-4 space-y-4">
            <Card><CardContent className="p-4"><p className="text-sm">Proxima consulta: {nextAppointment ? `${formatDate(nextAppointment.date)} as ${nextAppointment.time} - ${nextAppointment.procedure}` : "nenhuma"}</p></CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Historico de Consultas</CardTitle></CardHeader><CardContent className="space-y-1">{appointments.length === 0 ? <p className="text-sm text-neutral-400">Sem historico.</p> : appointments.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-neutral-50"><div><p className="text-sm font-medium">{item.procedure}</p><p className="text-xs text-neutral-400">{formatDate(item.date)} as {item.time} - {item.dentist}</p></div><StatusBadge status={item.status} /></div>)}</CardContent></Card>
          </TabsContent>

          <TabsContent value="documentos" className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">{["all", "odontograma", "radiografia", "exame", "receita", "outro"].map((filter) => <button key={filter} onClick={() => setDocFilter(filter)} className={`rounded-md px-2.5 py-1 text-xs font-medium ${docFilter === filter ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>{filter === "all" ? "Todos" : DOC_LABEL[filter as PatientDocument["type"]]}</button>)}</div>
              <Button variant="outline" size="sm" onClick={() => addToast({ title: "Upload indisponivel", description: "Upload direto ainda nao foi integrado.", variant: "info" })}><Upload className="mr-1.5 h-3.5 w-3.5" />Anexar Documento</Button>
            </div>
            <Card><CardContent className="p-4 space-y-2">{filteredDocs.length === 0 ? <p className="text-sm text-neutral-400">Nenhum documento anexado.</p> : filteredDocs.map((doc) => <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3"><FileText className="h-4 w-4 text-red-500" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{doc.name}</p><p className="text-xs text-neutral-400">{formatDate(doc.uploadedAt)} - {doc.uploadedBy}</p></div><Badge className={`${DOC_COLOR[doc.type]} text-[10px]`}>{DOC_LABEL[doc.type]}</Badge><button className="h-8 w-8 rounded-md text-neutral-500 hover:bg-neutral-100" onClick={() => doc.url ? window.open(doc.url, "_blank", "noopener,noreferrer") : addToast({ title: "Arquivo indisponivel", variant: "warning" })}><Eye className="mx-auto h-4 w-4" /></button><button className="h-8 w-8 rounded-md text-neutral-500 hover:bg-neutral-100" onClick={() => doc.url ? window.open(doc.url, "_blank", "noopener,noreferrer") : addToast({ title: "Arquivo indisponivel", variant: "warning" })}><Download className="mx-auto h-4 w-4" /></button></div>)}</CardContent></Card>
          </TabsContent>

          <TabsContent value="prontuario" className="mt-4">
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Prontuario Clinico</CardTitle></CardHeader><CardContent className="space-y-2">{!canViewRecords ? <p className="text-sm text-neutral-400">Seu perfil nao pode visualizar registros clinicos.</p> : records.length === 0 ? <p className="text-sm text-neutral-400">Nenhum registro encontrado.</p> : records.map((record) => <div key={record.id} className="rounded-lg border border-neutral-100 p-3"><div className="mb-1 flex items-center justify-between"><p className="text-sm font-medium">{record.title}</p><span className="text-[10px] text-neutral-500">{record.typeLabel}</span></div><p className="text-xs text-neutral-400">{formatDate(record.date)} - {record.dentist}</p><p className="mt-1 text-sm text-neutral-600">{record.description}</p></div>)}</CardContent></Card>
          </TabsContent>

          <TabsContent value="financeiro" className="mt-4">
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Historico Financeiro</CardTitle></CardHeader><CardContent className="space-y-1">{financials.length === 0 ? <p className="text-sm text-neutral-400">Nenhum registro financeiro.</p> : financials.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-neutral-50"><div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.status === "PAID" ? "bg-emerald-50" : item.status === "OVERDUE" ? "bg-red-50" : "bg-amber-50"}`}>{item.status === "PAID" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : item.status === "OVERDUE" ? <XCircle className="h-4 w-4 text-red-500" /> : <Clock className="h-4 w-4 text-amber-500" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.description}</p><p className="text-xs text-neutral-400">{formatDate(item.date)} {item.method !== "-" && `- ${item.method}`}</p></div><div className="text-right"><p className="text-sm font-semibold">{formatCurrency(item.amount)}</p><StatusBadge status={item.status} /></div></div>)}</CardContent></Card>
          </TabsContent>

          <TabsContent value="tratamentos" className="mt-4">
            <Card><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm">Planos de Tratamento</CardTitle><Button variant="outline" size="sm" onClick={() => router.push("/treatment-plans")}>Ver Todos</Button></div></CardHeader><CardContent className="space-y-2">{plans.length === 0 ? <p className="text-sm text-neutral-400">Nenhum plano encontrado.</p> : plans.map((plan) => <div key={plan.id} className="rounded-lg border border-neutral-100 p-3"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium">{plan.title}</p><StatusBadge status={plan.status} /></div><p className="text-sm font-semibold">{formatCurrency(plan.totalAmount)}</p><p className="text-xs text-neutral-400">{plan.itemsCount} procedimento(s)</p></div>)}</CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
