"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  DollarSign,
  MessageCircle,
  Plus,
  Users,
  Clock,
  Bell,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
} from "@/components/ui";
import { RoleGate } from "@/components/auth";
import { useToast } from "@/components/ui/toast";
import { NewAppointmentModal, NewPatientModal } from "@/components/shared";
import { PageTransition } from "@/lib/animations";
import { formatCurrency } from "@/lib/utils";
import type { AppointmentFormData, PatientFormData } from "@/lib/schemas";
import {
  ApiError,
  createAppointment,
  createPatient,
  getDashboard,
  listDentists,
  listPatients,
  type UpsertPatientPayload,
} from "@/lib/api";
import type { DashboardData, User } from "@/types";

const mapPatientPayload = (data: PatientFormData): UpsertPatientPayload => ({
  name: data.name,
  email: data.email || undefined,
  phone: data.phone,
  cpf: data.cpf,
  birthDate: data.birthDate,
  address: data.address || undefined,
  allergies: data.allergies || undefined,
  medicalNotes: data.medicalNotes || undefined,
});

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);
  const [dentists, setDentists] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const { addToast } = useToast();

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [dashboardData, patientsData, dentistsData] = await Promise.all([
        getDashboard(),
        listPatients(),
        listDentists(),
      ]);
      setDashboard(dashboardData);
      setPatients(patientsData.map((patient) => ({ id: patient.id, name: patient.name })));
      setDentists(dentistsData);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel carregar o dashboard.";
      setLoadError(message);
      addToast({ title: "Erro ao carregar", description: message, variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const nextAppointments = useMemo(
    () => dashboard?.upcomingAppointments.slice(0, 6) ?? [],
    [dashboard]
  );
  const recentNotifications = useMemo(
    () => dashboard?.recentNotifications.slice(0, 6) ?? [],
    [dashboard]
  );

  const handleCreateAppointment = async (data: AppointmentFormData) => {
    try {
      await createAppointment({
        patientId: data.patientId,
        dentistId: data.dentistId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        procedure: data.procedure,
        notes: data.notes || undefined,
      });
      addToast({
        title: "Agendamento criado",
        description: "Consulta registrada com sucesso.",
        variant: "success",
      });
      await loadDashboard();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel criar agendamento.";
      addToast({ title: "Erro", description: message, variant: "error" });
      throw err;
    }
  };

  const handleCreatePatient = async (data: PatientFormData) => {
    try {
      await createPatient(mapPatientPayload(data));
      addToast({
        title: "Paciente cadastrado",
        description: `${data.name} foi adicionado com sucesso.`,
        variant: "success",
      });
      await loadDashboard();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel cadastrar paciente.";
      addToast({ title: "Erro", description: message, variant: "error" });
      throw err;
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Dashboard</h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              Visao geral operacional da clinica
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setNewAppointmentOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo Agendamento
            </Button>
            <Button variant="outline" onClick={() => setNewPatientOpen(true)}>
              <Users className="h-4 w-4" />
              Novo Paciente
            </Button>
          </div>
        </div>

        {isLoading && !dashboard ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, idx) => (
              <Card key={idx}>
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-14" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !dashboard ? (
          <Card>
            <CardContent className="p-6 space-y-3">
              <p className="text-sm text-neutral-500">
                {loadError ?? "Nao foi possivel carregar dados do dashboard."}
              </p>
              <Button variant="outline" onClick={() => void loadDashboard()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {loadError && (
              <Card>
                <CardContent className="p-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                  Alguns dados podem estar desatualizados: {loadError}
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-5">
                  <CalendarDays className="h-4 w-4 text-neutral-400 mb-2" />
                  <p className="text-2xl font-bold text-neutral-900">
                    {dashboard.appointmentsToday}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">Consultas hoje</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <Users className="h-4 w-4 text-neutral-400 mb-2" />
                  <p className="text-2xl font-bold text-neutral-900">
                    {dashboard.totalPatients}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">Pacientes ativos</p>
                </CardContent>
              </Card>
              <RoleGate allowedRoles={["ADMIN", "DENTIST", "SECRETARY"]}>
                <Card>
                  <CardContent className="p-5">
                    <DollarSign className="h-4 w-4 text-neutral-400 mb-2" />
                    <p className="text-2xl font-bold text-neutral-900">
                      {formatCurrency(dashboard.monthlyRevenue)}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">Receita do mes</p>
                  </CardContent>
                </Card>
              </RoleGate>
              <Card>
                <CardContent className="p-5">
                  <MessageCircle className="h-4 w-4 text-neutral-400 mb-2" />
                  <p className="text-2xl font-bold text-neutral-900">
                    {dashboard.messagesDelivered}/{dashboard.messagesSent}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">Lembretes entregues</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-neutral-400" />
                    Proximas consultas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {nextAppointments.length === 0 ? (
                    <p className="text-sm text-neutral-400">Sem consultas futuras cadastradas.</p>
                  ) : (
                    nextAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {appointment.patientName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {appointment.date} • {appointment.startTime} - {appointment.endTime}
                          </p>
                        </div>
                        <Badge variant="secondary">{appointment.status}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-neutral-400" />
                    Notificacoes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentNotifications.length === 0 ? (
                    <p className="text-sm text-neutral-400">Sem notificacoes recentes.</p>
                  ) : (
                    recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="rounded-lg border border-neutral-100 px-3 py-2"
                      >
                        <p className="text-sm font-medium text-neutral-900">
                          {notification.title}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {notification.message}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      <NewAppointmentModal
        open={newAppointmentOpen}
        onOpenChange={setNewAppointmentOpen}
        patients={patients}
        dentists={dentists.map((dentist) => ({ id: dentist.id, name: dentist.name }))}
        onSubmit={handleCreateAppointment}
      />
      <NewPatientModal
        open={newPatientOpen}
        onOpenChange={setNewPatientOpen}
        onSubmit={handleCreatePatient}
      />
    </PageTransition>
  );
}
