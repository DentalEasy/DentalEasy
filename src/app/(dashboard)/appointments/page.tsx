"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Send,
  Filter,
  CheckCircle2,
  XCircle,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Separator,
  Skeleton,
} from "@/components/ui";
import { PageTransition } from "@/lib/animations";
import { NewAppointmentModal } from "@/components/shared";
import { useToast } from "@/components/ui/toast";
import type { Appointment, AppointmentStatus, User } from "@/types";
import type { AppointmentFormData } from "@/lib/schemas";
import {
  ApiError,
  createAppointment,
  listAppointments,
  listDentists,
  listPatients,
  updateAppointmentStatus,
} from "@/lib/api";

const statusConfig: Record<
  AppointmentStatus,
  { dot: string; label: string; variant: "confirmed" | "pending" | "cancelled" | "completed" }
> = {
  CONFIRMED: { dot: "bg-success-500", label: "Confirmado", variant: "confirmed" },
  PENDING: { dot: "bg-warning-500", label: "Pendente", variant: "pending" },
  CANCELLED: { dot: "bg-danger-500", label: "Cancelado", variant: "cancelled" },
  COMPLETED: { dot: "bg-primary-500", label: "Concluido", variant: "completed" },
};

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

const toDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mapFormToAppointmentPayload = (data: AppointmentFormData) => ({
  patientId: data.patientId,
  dentistId: data.dentistId,
  date: data.date,
  startTime: data.startTime,
  endTime: data.endTime,
  procedure: data.procedure,
  notes: data.notes || undefined,
});

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [dentists, setDentists] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week">("day");
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(
    null
  );
  const { addToast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [appointmentsData, patientsData, dentistsData] = await Promise.all([
        listAppointments(),
        listPatients(),
        listDentists(),
      ]);
      setAppointments(appointmentsData);
      setPatients(patientsData.map((patient) => ({ id: patient.id, name: patient.name })));
      setDentists(dentistsData);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel carregar a agenda.";
      addToast({ title: "Erro ao carregar", description: message, variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const getWeekDates = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isSelected = (date: Date) => date.toDateString() === selectedDate.toDateString();

  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setSelectedDate(newDate);
  };

  const formatMonth = (date: Date) =>
    date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const selectedDateOnly = toDateOnly(selectedDate);
  const weekDateSet = new Set(weekDates.map((date) => toDateOnly(date)));

  const filteredSchedule = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesStatus =
        statusFilter === "all" || appointment.status === statusFilter;
      const matchesViewDate =
        view === "day"
          ? appointment.date === selectedDateOnly
          : weekDateSet.has(appointment.date);
      return matchesStatus && matchesViewDate;
    });
  }, [appointments, selectedDateOnly, statusFilter, view, weekDateSet]);

  const handleSendWhatsApp = (patientName: string) => {
    addToast({
      title: "WhatsApp enviado",
      description: `Lembrete enviado para ${patientName}`,
      variant: "success",
    });
  };

  const handleSendAllReminders = () => {
    addToast({
      title: "Lembretes enviados",
      description: `${filteredSchedule.length} lembretes foram enviados com sucesso`,
      variant: "success",
    });
  };

  const handleCreateAppointment = async (data: AppointmentFormData) => {
    try {
      const created = await createAppointment(mapFormToAppointmentPayload(data));
      setAppointments((current) => [...current, created]);
      addToast({
        title: "Consulta agendada",
        description: "Agendamento criado com sucesso",
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel criar o agendamento.";
      addToast({ title: "Erro ao agendar", description: message, variant: "error" });
      throw err;
    }
  };

  const updateStatus = async (appointment: Appointment, status: AppointmentStatus) => {
    try {
      const updated = await updateAppointmentStatus(appointment.id, status);
      setAppointments((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setSelectedAppointment(updated);
      addToast({
        title: "Status atualizado",
        description: `Consulta de ${updated.patient.name} atualizada para ${statusConfig[status].label.toLowerCase()}`,
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel atualizar o status.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Agenda</h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              Gerencie os agendamentos da clinica
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button onClick={() => setNewAppointmentOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova Consulta
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "Todos" },
                  { value: "CONFIRMED", label: "Confirmado" },
                  { value: "PENDING", label: "Pendente" },
                  { value: "CANCELLED", label: "Cancelado" },
                  { value: "COMPLETED", label: "Concluido" },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      statusFilter === f.value
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon-sm" onClick={() => navigateWeek(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-neutral-900 capitalize">
                    {formatMonth(selectedDate)}
                  </span>
                  <Button variant="ghost" size="icon-sm" onClick={() => navigateWeek(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {weekDays.map((day) => (
                    <span key={day} className="text-[10px] font-medium text-neutral-400 py-1">
                      {day}
                    </span>
                  ))}
                  {weekDates.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`h-8 w-8 rounded-full text-xs font-medium transition-colors mx-auto flex items-center justify-center cursor-pointer ${
                        isSelected(date)
                          ? "bg-neutral-900 text-white"
                          : isToday(date)
                          ? "bg-neutral-100 text-neutral-900"
                          : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Legenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(Object.entries(statusConfig) as [
                  AppointmentStatus,
                  (typeof statusConfig)[AppointmentStatus]
                ][]).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${config.dot}`} />
                    <span className="text-xs text-neutral-500">{config.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Acoes Rapidas</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleSendAllReminders}
                >
                  <Send className="h-3.5 w-3.5 text-neutral-400" />
                  Enviar Lembretes
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  {selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </CardTitle>
                <div className="flex items-center gap-0.5 bg-neutral-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setView("day")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      view === "day"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    Dia
                  </button>
                  <button
                    onClick={() => setView("week")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      view === "week"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-700"
                    }`}
                  >
                    Semana
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, idx) => (
                    <Skeleton key={idx} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredSchedule.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">Nenhum agendamento encontrado.</p>
                </div>
              ) : (
                filteredSchedule.map((item) => {
                  const config = statusConfig[item.status];
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedAppointment(item)}
                    >
                      <div className="text-center shrink-0 w-12">
                        <span className="text-sm font-medium text-neutral-900 block">
                          {item.startTime}
                        </span>
                        <span className="text-[10px] text-neutral-400">{item.endTime}</span>
                      </div>
                      <div className={`w-0.5 h-8 rounded-full ${config.dot}`} />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-neutral-100 text-neutral-500">
                          {getInitials(item.patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-neutral-900 block truncate">
                          {item.patient.name}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {item.procedure || "Consulta"}
                        </span>
                      </div>
                      <Badge variant={config.variant}>{config.label}</Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Enviar WhatsApp"
                        className="text-neutral-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendWhatsApp(item.patient.name);
                        }}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      >
        <DialogContent className="max-w-md">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm bg-neutral-100 text-neutral-500">
                      {getInitials(selectedAppointment.patient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="block">{selectedAppointment.patient.name}</span>
                    <span className="text-xs font-normal text-neutral-400">
                      {selectedAppointment.procedure || "Consulta"}
                    </span>
                  </div>
                </DialogTitle>
                <DialogDescription>Detalhes do agendamento</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Horario</p>
                    <p className="text-sm font-medium text-neutral-900">
                      {selectedAppointment.startTime} - {selectedAppointment.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Status</p>
                    <Badge variant={statusConfig[selectedAppointment.status].variant}>
                      {statusConfig[selectedAppointment.status].label}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleSendWhatsApp(selectedAppointment.patient.name)}
                  >
                    <Send className="h-4 w-4" />
                    Enviar WhatsApp
                  </Button>
                  {selectedAppointment.status === "PENDING" && (
                    <Button
                      className="gap-2"
                      onClick={() => void updateStatus(selectedAppointment, "CONFIRMED")}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Confirmar
                    </Button>
                  )}
                  {selectedAppointment.status !== "CANCELLED" && (
                    <Button
                      variant="outline"
                      className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => void updateStatus(selectedAppointment, "CANCELLED")}
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </Button>
                  )}
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <NewAppointmentModal
        open={newAppointmentOpen}
        onOpenChange={setNewAppointmentOpen}
        onSubmit={handleCreateAppointment}
        patients={patients}
        dentists={dentists.map((dentist) => ({ id: dentist.id, name: dentist.name }))}
      />
    </PageTransition>
  );
}
