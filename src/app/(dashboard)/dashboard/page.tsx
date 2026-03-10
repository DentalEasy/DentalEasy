"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CalendarDays,
  DollarSign,
  Users,
  MessageCircle,
  Clock,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Skeleton,
} from "@/components/ui";
import { RoleGate } from "@/components/auth";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency } from "@/lib/utils";
import { PageTransition } from "@/lib/animations";
import { NewAppointmentModal, NewPatientModal } from "@/components/shared";
import { useToast } from "@/components/ui/toast";
import type { Appointment, DashboardStats, WhatsAppMessage } from "@/types";

// ─── Mock Data ───
const mockStats: DashboardStats = {
  appointmentsToday: 8,
  patientsTotal: 342,
  revenueToday: 3450.0,
  revenueMonth: 47800.0,
  pendingPayments: 12,
  messagesSent: 24,
  messagesDelivered: 22,
};

const mockNextAppointments: Appointment[] = [
  {
    id: "1", organizationId: "org_01", patientId: "p1", dentistId: "d1",
    patient: { id: "p1", organizationId: "org_01", name: "Maria Silva", phone: "(17) 99876-5432", cpf: "123.456.789-00", birthDate: "1990-05-15", avatarUrl: undefined, serasaStatus: "GREEN", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
    dentist: { id: "d1", name: "Dr. Lucas Mendes", email: "lucas@clinic.com", role: "DENTIST", organizationId: "org_01" },
    date: "2026-03-09", startTime: "09:00", endTime: "10:00", status: "CONFIRMED", procedure: "Limpeza",
  },
  {
    id: "2", organizationId: "org_01", patientId: "p2", dentistId: "d1",
    patient: { id: "p2", organizationId: "org_01", name: "João Oliveira", phone: "(17) 99765-4321", cpf: "987.654.321-00", birthDate: "1985-11-20", avatarUrl: undefined, serasaStatus: "YELLOW", createdAt: "2025-02-01", updatedAt: "2025-02-01" },
    dentist: { id: "d1", name: "Dr. Lucas Mendes", email: "lucas@clinic.com", role: "DENTIST", organizationId: "org_01" },
    date: "2026-03-09", startTime: "10:30", endTime: "11:30", status: "PENDING", procedure: "Restauração",
  },
  {
    id: "3", organizationId: "org_01", patientId: "p3", dentistId: "d1",
    patient: { id: "p3", organizationId: "org_01", name: "Ana Costa", phone: "(17) 99654-3210", cpf: "111.222.333-44", birthDate: "1978-03-08", avatarUrl: undefined, serasaStatus: "RED", createdAt: "2025-03-01", updatedAt: "2025-03-01" },
    dentist: { id: "d1", name: "Dr. Lucas Mendes", email: "lucas@clinic.com", role: "DENTIST", organizationId: "org_01" },
    date: "2026-03-09", startTime: "14:00", endTime: "15:00", status: "CONFIRMED", procedure: "Canal",
  },
];

const mockMessages: WhatsAppMessage[] = [
  { id: "m1", organizationId: "org_01", patientId: "p1", patient: mockNextAppointments[0].patient, message: "Lembrete de consulta amanhã às 09:00", status: "DELIVERED", sentAt: "2026-03-08T18:00:00" },
  { id: "m2", organizationId: "org_01", patientId: "p2", patient: mockNextAppointments[1].patient, message: "Confirme sua consulta para amanhã", status: "SENT", sentAt: "2026-03-08T18:05:00" },
  { id: "m3", organizationId: "org_01", patientId: "p3", patient: mockNextAppointments[2].patient, message: "Lembrete de consulta amanhã às 14:00", status: "READ", sentAt: "2026-03-08T18:10:00" },
];

const weeklyChartData = [
  { day: "Seg", receita: 1200 },
  { day: "Ter", receita: 1800 },
  { day: "Qua", receita: 2400 },
  { day: "Qui", receita: 1600 },
  { day: "Sex", receita: 3200 },
  { day: "Sáb", receita: 2800 },
  { day: "Dom", receita: 0 },
];

// ─── Status Badge ───
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "confirmed" | "pending" | "cancelled" | "completed"; label: string }> = {
    CONFIRMED: { variant: "confirmed", label: "Confirmado" },
    PENDING: { variant: "pending", label: "Pendente" },
    CANCELLED: { variant: "cancelled", label: "Cancelado" },
    COMPLETED: { variant: "completed", label: "Concluído" },
  };
  const { variant, label } = map[status] ?? { variant: "pending" as const, label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

// ─── Message Status ───
function MessageStatus({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    SENT: { color: "text-neutral-400", label: "Enviado" },
    DELIVERED: { color: "text-primary-500", label: "Entregue" },
    READ: { color: "text-success-500", label: "Lido" },
    FAILED: { color: "text-danger-500", label: "Falhou" },
  };
  const { color, label } = map[status] ?? { color: "text-neutral-400", label: status };
  return (
    <span className={`text-xs ${color}`}>{label}</span>
  );
}

// ─── Skeleton ───
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard ───
export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const stats = mockStats;
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [newPatientOpen, setNewPatientOpen] = useState(false);

  const handleSendWhatsApp = (patientName: string) => {
    addToast({ title: "WhatsApp enviado", description: `Lembrete enviado para ${patientName}`, variant: "success" });
  };

  const handleRegisterPayment = () => {
    router.push("/financial");
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Olá, {user?.name?.split(" ")[0]}
            </h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              Resumo da sua clínica hoje
            </p>
          </div>
          <Button size="default" onClick={() => setNewAppointmentOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <CalendarDays className="h-4 w-4 text-neutral-400" />
                <span className="text-xs text-success-600 font-medium flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" />3
                </span>
              </div>
              <p className="text-2xl font-bold text-neutral-900 tracking-tight">{stats.appointmentsToday}</p>
              <p className="text-xs text-neutral-400 mt-1">Consultas hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Users className="h-4 w-4 text-neutral-400" />
                <span className="text-xs text-success-600 font-medium flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" />12%
                </span>
              </div>
              <p className="text-2xl font-bold text-neutral-900 tracking-tight">{stats.patientsTotal}</p>
              <p className="text-xs text-neutral-400 mt-1">Total de pacientes</p>
            </CardContent>
          </Card>

          <RoleGate allowedRoles={["ADMIN", "DENTIST"]}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="h-4 w-4 text-neutral-400" />
                  <span className="text-xs text-success-600 font-medium flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" />8%
                  </span>
                </div>
                <p className="text-2xl font-bold text-neutral-900 tracking-tight">{formatCurrency(stats.revenueToday)}</p>
                <p className="text-xs text-neutral-400 mt-1">Receita do dia</p>
              </CardContent>
            </Card>
          </RoleGate>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <MessageCircle className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-2xl font-bold text-neutral-900 tracking-tight">{stats.messagesDelivered}/{stats.messagesSent}</p>
              <p className="text-xs text-neutral-400 mt-1">Mensagens entregues</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Appointments */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  Próximas Consultas
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-neutral-500" onClick={() => router.push("/appointments")}>
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {mockNextAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={appt.patient.avatarUrl} />
                      <AvatarFallback className="text-xs bg-neutral-100 text-neutral-500">
                        {getInitials(appt.patient.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900 truncate">
                          {appt.patient.name}
                        </span>
                        <StatusBadge status={appt.status} />
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {appt.startTime}–{appt.endTime} · {appt.procedure}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon-sm" className="text-neutral-400 shrink-0" onClick={() => handleSendWhatsApp(appt.patient.name)} title="Enviar lembrete WhatsApp">
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <Button className="w-full justify-start gap-2 h-9" variant="outline" onClick={() => setNewAppointmentOpen(true)}>
                  <Plus className="h-3.5 w-3.5 text-neutral-400" />
                  Nova Consulta
                </Button>
                <Button className="w-full justify-start gap-2 h-9" variant="outline" onClick={() => setNewPatientOpen(true)}>
                  <Users className="h-3.5 w-3.5 text-neutral-400" />
                  Cadastrar Paciente
                </Button>
                <RoleGate allowedRoles={["DENTIST", "ADMIN"]}>
                  <Button className="w-full justify-start gap-2 h-9" variant="outline" onClick={handleRegisterPayment}>
                    <DollarSign className="h-3.5 w-3.5 text-neutral-400" />
                    Registrar Pagamento
                  </Button>
                </RoleGate>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 text-neutral-400" />
                    WhatsApp
                  </CardTitle>
                  <Badge variant="secondary">{mockMessages.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {mockMessages.map((msg) => (
                  <div key={msg.id} className="flex items-center gap-2.5">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[9px] bg-neutral-100 text-neutral-400">
                        {getInitials(msg.patient.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-neutral-700 block truncate">
                        {msg.patient.name}
                      </span>
                    </div>
                    <MessageStatus status={msg.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Financial Row */}
        <RoleGate allowedRoles={["ADMIN", "DENTIST"]}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-neutral-400" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Receita do Dia</span>
                    <span className="text-sm font-medium text-neutral-900">{formatCurrency(stats.revenueToday)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Receita do Mês</span>
                    <span className="text-sm font-medium text-neutral-900">{formatCurrency(stats.revenueMonth)}</span>
                  </div>
                  <div className="h-px bg-neutral-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Pendentes</span>
                    <Badge variant="warning">{stats.pendingPayments} pagamentos</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-neutral-400" />
                  Fluxo Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={130}>
                  <AreaChart data={weeklyChartData}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0052CC" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#0052CC" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }}
                      formatter={(value) => [`R$ ${Number(value).toLocaleString("pt-BR")}`]}
                    />
                    <Area type="monotone" dataKey="receita" stroke="#0052CC" strokeWidth={1.5} fill="url(#colorReceita)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </RoleGate>
      </div>

      <NewAppointmentModal
        open={newAppointmentOpen}
        onOpenChange={setNewAppointmentOpen}
        onSubmit={(data) => {
          addToast({ title: "Agendamento criado", description: `Consulta agendada para ${data.date}`, variant: "success" });
        }}
      />
      <NewPatientModal
        open={newPatientOpen}
        onOpenChange={setNewPatientOpen}
        onSubmit={(data) => {
          addToast({ title: "Paciente cadastrado", description: `${data.name} foi adicionado com sucesso`, variant: "success" });
        }}
      />
    </PageTransition>
  );
}
