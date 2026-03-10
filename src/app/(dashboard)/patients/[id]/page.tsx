"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  ClipboardList,
  ShieldCheck,
  ShieldAlert,
  Shield,
  User,
  Paperclip,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Upload,
  Eye,
  Trash2,
  MessageSquare,
  Download,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Separator,
  Input,
  Textarea,
} from "@/components/ui";
import { formatCPF, formatPhone, formatDate, formatCurrency } from "@/lib/utils";
import { PageTransition } from "@/lib/animations";
import { RoleGate } from "@/components/auth";
import { useToast } from "@/components/ui/toast";
import type { Patient } from "@/types";

// ─── Shared mock patients (same as patients page) ───
const mockPatients: Patient[] = [
  {
    id: "p1",
    organizationId: "org_01",
    name: "Maria Silva",
    email: "maria@email.com",
    phone: "17999765432",
    cpf: "12345678900",
    birthDate: "1990-05-15",
    serasaStatus: "GREEN",
    createdAt: "2025-01-15",
    updatedAt: "2026-03-01",
  },
  {
    id: "p2",
    organizationId: "org_01",
    name: "João Oliveira",
    email: "joao@email.com",
    phone: "17999654321",
    cpf: "98765432100",
    birthDate: "1985-11-20",
    serasaStatus: "YELLOW",
    createdAt: "2025-02-20",
    updatedAt: "2026-02-28",
  },
  {
    id: "p3",
    organizationId: "org_01",
    name: "Ana Costa",
    email: "ana@email.com",
    phone: "17999543210",
    cpf: "11122233344",
    birthDate: "1978-03-08",
    serasaStatus: "RED",
    createdAt: "2025-03-10",
    updatedAt: "2026-03-05",
  },
  {
    id: "p4",
    organizationId: "org_01",
    name: "Carlos Ferreira",
    email: "carlos@email.com",
    phone: "17998765432",
    cpf: "55566677788",
    birthDate: "1995-07-22",
    serasaStatus: "GREEN",
    createdAt: "2025-06-01",
    updatedAt: "2026-02-15",
  },
];

// ─── Mock extra data per patient ───
const mockAppointments = [
  { id: "a1", patientId: "p1", date: "2026-03-10", time: "09:00", procedure: "Limpeza Profilática", status: "CONFIRMED" as const, dentist: "Dr. Roberto Lima" },
  { id: "a2", patientId: "p1", date: "2026-02-15", time: "14:30", procedure: "Restauração Classe II", status: "COMPLETED" as const, dentist: "Dr. Roberto Lima" },
  { id: "a3", patientId: "p1", date: "2026-01-20", time: "10:00", procedure: "Consulta de Avaliação", status: "COMPLETED" as const, dentist: "Dra. Ana Souza" },
  { id: "a4", patientId: "p2", date: "2026-03-12", time: "11:00", procedure: "Canal Radicular", status: "PENDING" as const, dentist: "Dra. Ana Souza" },
  { id: "a5", patientId: "p2", date: "2026-02-28", time: "16:00", procedure: "Extração Simples", status: "COMPLETED" as const, dentist: "Dr. Roberto Lima" },
  { id: "a6", patientId: "p3", date: "2026-03-08", time: "08:30", procedure: "Coroa Cerâmica", status: "CONFIRMED" as const, dentist: "Dra. Ana Souza" },
  { id: "a7", patientId: "p4", date: "2026-03-15", time: "15:00", procedure: "Clareamento a Laser", status: "PENDING" as const, dentist: "Dr. Roberto Lima" },
];

const mockFinancials = [
  { id: "f1", patientId: "p1", description: "Limpeza Profilática", amount: 250, status: "PAID" as const, date: "2026-02-15", method: "PIX" },
  { id: "f2", patientId: "p1", description: "Restauração Classe II", amount: 450, status: "PAID" as const, date: "2026-01-20", method: "Cartão Crédito" },
  { id: "f3", patientId: "p1", description: "Consulta - Avaliação", amount: 150, status: "PENDING" as const, date: "2026-03-10", method: "—" },
  { id: "f4", patientId: "p2", description: "Canal Radicular", amount: 1200, status: "PENDING" as const, date: "2026-03-12", method: "—" },
  { id: "f5", patientId: "p2", description: "Extração Simples", amount: 350, status: "PAID" as const, date: "2026-02-28", method: "Débito" },
  { id: "f6", patientId: "p3", description: "Coroa Cerâmica", amount: 2800, status: "OVERDUE" as const, date: "2026-02-01", method: "—" },
  { id: "f7", patientId: "p4", description: "Clareamento a Laser", amount: 1500, status: "PENDING" as const, date: "2026-03-15", method: "—" },
];

const mockClinicalRecords = [
  { id: "r1", patientId: "p1", date: "2026-02-15", type: "Procedimento", title: "Restauração Classe II - Dente 36", dentist: "Dr. Roberto Lima", description: "Restauração em resina composta do dente 36, face ocluso-distal. Paciente sem queixas." },
  { id: "r2", patientId: "p1", date: "2026-01-20", type: "Anamnese", title: "Anamnese inicial", dentist: "Dra. Ana Souza", description: "Paciente relata sensibilidade ao frio no dente 36. Sem alergias medicamentosas. Não fumante." },
  { id: "r3", patientId: "p2", date: "2026-02-28", type: "Procedimento", title: "Extração - Dente 38", dentist: "Dr. Roberto Lima", description: "Extração simples do terceiro molar inferior esquerdo. Sem complicações." },
  { id: "r4", patientId: "p3", date: "2026-02-20", type: "Procedimento", title: "Preparo para coroa - Dente 14", dentist: "Dra. Ana Souza", description: "Preparo do dente 14 para coroa cerâmica total. Moldagem de trabalho realizada." },
];

const mockTreatmentPlans = [
  { id: "tp1", patientId: "p1", name: "Reabilitação Oral", status: "IN_PROGRESS" as const, procedures: 4, completed: 2, totalValue: 3200 },
  { id: "tp2", patientId: "p2", name: "Tratamento Endodôntico", status: "PENDING" as const, procedures: 2, completed: 0, totalValue: 1800 },
  { id: "tp3", patientId: "p3", name: "Prótese Fixa", status: "IN_PROGRESS" as const, procedures: 3, completed: 1, totalValue: 5200 },
  { id: "tp4", patientId: "p4", name: "Estética Dental", status: "PENDING" as const, procedures: 2, completed: 0, totalValue: 2500 },
];

// ─── Helpers ───
function SerasaBadge({ status }: { status: Patient["serasaStatus"] }) {
  const config = {
    GREEN: { label: "Regular", icon: ShieldCheck, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    YELLOW: { label: "Atenção", icon: ShieldAlert, color: "bg-amber-50 text-amber-700 border-amber-200" },
    RED: { label: "Pendência", icon: Shield, color: "bg-red-50 text-red-700 border-red-200" },
  };
  const { label, icon: Icon, color } = config[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    OVERDUE: "bg-red-50 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    CONFIRMED: "Confirmada",
    COMPLETED: "Concluída",
    PENDING: "Pendente",
    CANCELLED: "Cancelada",
    IN_PROGRESS: "Em andamento",
    PAID: "Pago",
    OVERDUE: "Vencido",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md border ${config[status] ?? "bg-neutral-50 text-neutral-600 border-neutral-200"}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ─── Document types ───
interface PatientDocument {
  id: string;
  name: string;
  type: "odontograma" | "radiografia" | "exame" | "receita" | "outro";
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  notes: string;
}

const DOC_TYPE_LABELS: Record<PatientDocument["type"], string> = {
  odontograma: "Odontograma",
  radiografia: "Radiografia",
  exame: "Exame",
  receita: "Receita",
  outro: "Outro",
};

const DOC_TYPE_COLORS: Record<PatientDocument["type"], string> = {
  odontograma: "bg-violet-50 text-violet-700 border-violet-200",
  radiografia: "bg-blue-50 text-blue-700 border-blue-200",
  exame: "bg-emerald-50 text-emerald-700 border-emerald-200",
  receita: "bg-amber-50 text-amber-700 border-amber-200",
  outro: "bg-neutral-50 text-neutral-600 border-neutral-200",
};

const mockDocuments: PatientDocument[] = [
  { id: "d1", name: "Odontograma_Maria_Silva.pdf", type: "odontograma", fileSize: "1.2 MB", uploadedAt: "2026-02-15", uploadedBy: "Dr. Roberto Lima", notes: "Odontograma inicial. Cárie no dente 36 face oclusal. Restauração antiga no 16." },
  { id: "d2", name: "Radiografia_Panoramica.pdf", type: "radiografia", fileSize: "3.8 MB", uploadedAt: "2026-01-20", uploadedBy: "Dra. Ana Souza", notes: "Radiografia panorâmica para avaliação geral. Terceiros molares sem indicação de extração." },
  { id: "d3", name: "Hemograma_Completo.pdf", type: "exame", fileSize: "450 KB", uploadedAt: "2026-01-10", uploadedBy: "Dra. Ana Souza", notes: "" },
  { id: "d4", name: "Periapical_Dente_36.pdf", type: "radiografia", fileSize: "890 KB", uploadedAt: "2026-02-20", uploadedBy: "Dr. Roberto Lima", notes: "Radiografia periapical pré-restauração. Sem comprometimento pulpar." },
];

// ─── Main Component ───
export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  // ─── Documents state ───
  const [documents, setDocuments] = useState<PatientDocument[]>(
    mockDocuments.filter((_, i) => {
      // Give different patients different documents for variety
      if (id === "p1") return true;
      if (id === "p2") return i < 2;
      if (id === "p3") return i % 2 === 0;
      return i < 1;
    })
  );
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState<PatientDocument["type"]>("odontograma");
  const [uploadNotes, setUploadNotes] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [docFilter, setDocFilter] = useState<string>("all");

  const patient = mockPatients.find((p) => p.id === id);
  const patientAppointments = mockAppointments.filter((a) => a.patientId === id);
  const patientFinancials = mockFinancials.filter((f) => f.patientId === id);
  const patientRecords = mockClinicalRecords.filter((r) => r.patientId === id);
  const patientPlans = mockTreatmentPlans.filter((tp) => tp.patientId === id);

  if (!patient) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-neutral-300 mb-3" />
          <h3 className="text-lg font-semibold text-neutral-700">Paciente não encontrado</h3>
          <p className="text-sm text-neutral-400 mt-1">O paciente solicitado não existe no sistema.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/patients")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Pacientes
          </Button>
        </div>
      </PageTransition>
    );
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const totalPaid = patientFinancials.filter((f) => f.status === "PAID").reduce((s, f) => s + f.amount, 0);
  const totalPending = patientFinancials.filter((f) => f.status === "PENDING" || f.status === "OVERDUE").reduce((s, f) => s + f.amount, 0);
  const nextAppointment = patientAppointments.find((a) => a.status === "CONFIRMED" || a.status === "PENDING");

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ─── Header ─── */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/patients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg bg-primary-100 text-primary-700">
                {getInitials(patient.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-semibold text-neutral-900">{patient.name}</h2>
                <SerasaBadge status={patient.serasaStatus} />
              </div>
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                <span className="text-xs text-neutral-400 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {formatPhone(patient.phone)}
                </span>
                {patient.email && (
                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {patient.email}
                  </span>
                )}
                <span className="text-xs text-neutral-400">
                  CPF: {formatCPF(patient.cpf)}
                </span>
                <span className="text-xs text-neutral-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Nasc: {formatDate(patient.birthDate)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => router.push("/appointments")}>
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Agendar
              </Button>
              <RoleGate allowedRoles="DENTIST">
                <Button variant="outline" size="sm" onClick={() => router.push("/clinical-records")}>
                  <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                  Prontuário
                </Button>
              </RoleGate>
            </div>
          </div>
        </div>

        {/* ─── Quick Stats ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Consultas</p>
                  <p className="text-lg font-semibold text-neutral-900">{patientAppointments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Total Pago</p>
                  <p className="text-lg font-semibold text-neutral-900">{formatCurrency(totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Pendente</p>
                  <p className="text-lg font-semibold text-neutral-900">{formatCurrency(totalPending)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Planos Ativos</p>
                  <p className="text-lg font-semibold text-neutral-900">{patientPlans.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Tabs ─── */}
        <Tabs defaultValue="resumo">
          <TabsList className="bg-neutral-100 p-1">
            <TabsTrigger value="resumo" className="text-xs">
              <User className="h-3.5 w-3.5 mr-1.5" /> Resumo
            </TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs">
              <Paperclip className="h-3.5 w-3.5 mr-1.5" /> Documentos
            </TabsTrigger>
            <TabsTrigger value="prontuario" className="text-xs">
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Prontuário
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="text-xs">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="tratamentos" className="text-xs">
              <FileText className="h-3.5 w-3.5 mr-1.5" /> Tratamentos
            </TabsTrigger>
          </TabsList>

          {/* ─── Resumo Tab ─── */}
          <TabsContent value="resumo" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Dados Pessoais */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Nome completo</p>
                      <p className="text-sm font-medium text-neutral-800 mt-0.5">{patient.name}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 uppercase tracking-wider">CPF</p>
                      <p className="text-sm font-medium text-neutral-800 mt-0.5">{formatCPF(patient.cpf)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Telefone</p>
                      <p className="text-sm font-medium text-neutral-800 mt-0.5">{formatPhone(patient.phone)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 uppercase tracking-wider">E-mail</p>
                      <p className="text-sm font-medium text-neutral-800 mt-0.5">{patient.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Nascimento</p>
                      <p className="text-sm font-medium text-neutral-800 mt-0.5">{formatDate(patient.birthDate)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Cadastro</p>
                      <p className="text-sm font-medium text-neutral-800 mt-0.5">{formatDate(patient.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Próxima Consulta */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Próxima Consulta</CardTitle>
                </CardHeader>
                <CardContent>
                  {nextAppointment ? (
                    <div className="flex items-start gap-3 p-3 bg-primary-50 rounded-lg border border-primary-100">
                      <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                        <Calendar className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{nextAppointment.procedure}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {formatDate(nextAppointment.date)} às {nextAppointment.time}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">{nextAppointment.dentist}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Calendar className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm text-neutral-400">Nenhuma consulta agendada</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Últimas Consultas */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Histórico de Consultas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {patientAppointments.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-4">Sem histórico de consultas.</p>
                  ) : (
                    patientAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                          <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800">{apt.procedure}</p>
                          <p className="text-xs text-neutral-400">
                            {formatDate(apt.date)} às {apt.time} — {apt.dentist}
                          </p>
                        </div>
                        <StatusBadge status={apt.status} />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Documentos Tab ─── */}
          <TabsContent value="documentos" className="mt-4">
            <div className="space-y-4">
              {/* Actions bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {["all", "odontograma", "radiografia", "exame", "receita", "outro"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setDocFilter(f)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        docFilter === f
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {f === "all" ? "Todos" : DOC_TYPE_LABELS[f as PatientDocument["type"]]}
                    </button>
                  ))}
                </div>
                <Button size="sm" onClick={() => setShowUploadForm(!showUploadForm)}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Anexar Documento
                </Button>
              </div>

              {/* Upload Form */}
              {showUploadForm && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-semibold text-neutral-700">Novo Documento</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-neutral-400 uppercase tracking-wider">Arquivo</label>
                        <div className="mt-1 border-2 border-dashed border-neutral-200 rounded-lg p-4 text-center hover:border-primary-300 hover:bg-primary-50/30 transition-colors cursor-pointer">
                          <Upload className="h-6 w-6 text-neutral-400 mx-auto mb-1" />
                          <p className="text-xs text-neutral-500">Clique ou arraste o PDF aqui</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">PDF, JPG, PNG — Máx 10MB</p>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setUploadName(file.name);
                            }}
                          />
                          {uploadName && (
                            <p className="text-xs font-medium text-primary-600 mt-2">{uploadName}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] text-neutral-400 uppercase tracking-wider">Tipo</label>
                          <select
                            value={uploadType}
                            onChange={(e) => setUploadType(e.target.value as PatientDocument["type"])}
                            className="mt-1 w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-neutral-400 uppercase tracking-wider">Anotações</label>
                          <Textarea
                            value={uploadNotes}
                            onChange={(e) => setUploadNotes(e.target.value)}
                            placeholder="Observações sobre o documento..."
                            className="mt-1 h-20 resize-none text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => { setShowUploadForm(false); setUploadName(""); setUploadNotes(""); }}>
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!uploadName) {
                            addToast({ title: "Selecione um arquivo", description: "Escolha um arquivo para anexar", variant: "warning" });
                            return;
                          }
                          const newDoc: PatientDocument = {
                            id: `d${Date.now()}`,
                            name: uploadName,
                            type: uploadType,
                            fileSize: "—",
                            uploadedAt: new Date().toISOString().split("T")[0],
                            uploadedBy: "Você",
                            notes: uploadNotes,
                          };
                          setDocuments([newDoc, ...documents]);
                          setShowUploadForm(false);
                          setUploadName("");
                          setUploadNotes("");
                          addToast({ title: "Documento anexado", description: `${newDoc.name} adicionado com sucesso`, variant: "success" });
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Anexar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Document List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    {(() => {
                      const filtered = documents.filter((d) => docFilter === "all" || d.type === docFilter);
                      return `${filtered.length} documento${filtered.length !== 1 ? "s" : ""}`;
                    })()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {documents.filter((d) => docFilter === "all" || d.type === docFilter).length === 0 ? (
                    <div className="text-center py-8">
                      <Paperclip className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm text-neutral-400">Nenhum documento anexado.</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Clique em &quot;Anexar Documento&quot; para adicionar.</p>
                    </div>
                  ) : (
                    documents
                      .filter((d) => docFilter === "all" || d.type === docFilter)
                      .map((doc) => (
                        <div key={doc.id} className="border border-neutral-100 rounded-lg p-4 hover:border-neutral-200 transition-colors">
                          <div className="flex items-start gap-3">
                            {/* File icon */}
                            <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5 text-red-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-neutral-800 truncate">{doc.name}</p>
                                <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${DOC_TYPE_COLORS[doc.type]}`}>
                                  {DOC_TYPE_LABELS[doc.type]}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-400 mt-0.5">
                                {doc.fileSize} • Enviado em {formatDate(doc.uploadedAt)} por {doc.uploadedBy}
                              </p>

                              {/* Notes */}
                              {editingNoteId === doc.id ? (
                                <div className="mt-2 space-y-2">
                                  <Textarea
                                    value={editNoteText}
                                    onChange={(e) => setEditNoteText(e.target.value)}
                                    className="h-20 resize-none text-sm"
                                    placeholder="Adicionar anotação..."
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setDocuments(documents.map((d) =>
                                          d.id === doc.id ? { ...d, notes: editNoteText } : d
                                        ));
                                        setEditingNoteId(null);
                                        addToast({ title: "Anotação salva", description: "A anotação foi atualizada", variant: "success" });
                                      }}
                                    >
                                      Salvar
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                doc.notes && (
                                  <div className="mt-2 p-2.5 bg-neutral-50 rounded-md border border-neutral-100">
                                    <div className="flex items-start gap-1.5">
                                      <MessageSquare className="h-3 w-3 text-neutral-400 mt-0.5 shrink-0" />
                                      <p className="text-xs text-neutral-600 leading-relaxed">{doc.notes}</p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => addToast({ title: "Visualizar", description: `Abrindo ${doc.name}...`, variant: "info" })}
                                className="h-8 w-8 flex items-center justify-center rounded-md text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => addToast({ title: "Download", description: `Baixando ${doc.name}...`, variant: "info" })}
                                className="h-8 w-8 flex items-center justify-center rounded-md text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNoteId(doc.id);
                                  setEditNoteText(doc.notes);
                                }}
                                className="h-8 w-8 flex items-center justify-center rounded-md text-neutral-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Anotar"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDocuments(documents.filter((d) => d.id !== doc.id));
                                  addToast({ title: "Documento removido", description: `${doc.name} foi excluído`, variant: "success" });
                                }}
                                className="h-8 w-8 flex items-center justify-center rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Prontuário Tab ─── */}
          <TabsContent value="prontuario" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Prontuário Clínico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patientRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardList className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-400">Nenhum registro clínico encontrado.</p>
                  </div>
                ) : (
                  patientRecords.map((rec) => (
                    <div key={rec.id} className="border border-neutral-100 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-neutral-800">{rec.title}</h4>
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-neutral-100 text-neutral-600">
                              {rec.type}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {formatDate(rec.date)} — {rec.dentist}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-600 leading-relaxed">{rec.description}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Financeiro Tab ─── */}
          <TabsContent value="financeiro" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Histórico Financeiro</CardTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400">
                      Pago: <strong className="text-emerald-600">{formatCurrency(totalPaid)}</strong>
                    </span>
                    <span className="text-xs text-neutral-400">
                      Pendente: <strong className="text-amber-600">{formatCurrency(totalPending)}</strong>
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {patientFinancials.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm text-neutral-400">Nenhum registro financeiro.</p>
                    </div>
                  ) : (
                    patientFinancials.map((fin) => (
                      <div
                        key={fin.id}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 transition-colors"
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          fin.status === "PAID" ? "bg-emerald-50" : fin.status === "OVERDUE" ? "bg-red-50" : "bg-amber-50"
                        }`}>
                          {fin.status === "PAID" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : fin.status === "OVERDUE" ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800">{fin.description}</p>
                          <p className="text-xs text-neutral-400">
                            {formatDate(fin.date)} {fin.method !== "—" && `• ${fin.method}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-neutral-900">{formatCurrency(fin.amount)}</p>
                          <StatusBadge status={fin.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tratamentos Tab ─── */}
          <TabsContent value="tratamentos" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Planos de Tratamento</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/treatment-plans")}
                  >
                    Ver Todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {patientPlans.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-400">Nenhum plano de tratamento encontrado.</p>
                  </div>
                ) : (
                  patientPlans.map((plan) => (
                    <div key={plan.id} className="border border-neutral-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-medium text-neutral-800">{plan.name}</h4>
                          <StatusBadge status={plan.status} />
                        </div>
                        <p className="text-sm font-semibold text-neutral-900">{formatCurrency(plan.totalValue)}</p>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-1.5">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${plan.procedures > 0 ? (plan.completed / plan.procedures) * 100 : 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-neutral-400 mt-1.5">
                        {plan.completed} de {plan.procedures} procedimentos concluídos
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
