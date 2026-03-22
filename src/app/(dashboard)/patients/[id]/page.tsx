"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Mail,
  Paperclip,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  TrendingUp,
  User,
  Wallet,
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
import { PageTransition } from "@/lib/animations";
import { formatCPF, formatCurrency, formatDate, formatPhone } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { ApiError, getPatientSummary } from "@/lib/api";
import type {
  PatientSummary,
  PatientSummaryDocumentItem,
  SummarySource,
} from "@/types";

const serasaConfig = {
  GREEN: {
    label: "Regular",
    icon: ShieldCheck,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  YELLOW: {
    label: "Atencao",
    icon: ShieldAlert,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  RED: {
    label: "Pendencia",
    icon: Shield,
    color: "bg-red-50 text-red-700 border-red-200",
  },
} as const;

const statusClass: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  DRAFT: "bg-neutral-100 text-neutral-700 border-neutral-200",
  SENT: "bg-indigo-50 text-indigo-700 border-indigo-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  CANCELED: "bg-red-50 text-red-700 border-red-200",
  YELLOW: "bg-amber-50 text-amber-700 border-amber-200",
  RED: "bg-red-50 text-red-700 border-red-200",
  SETTLED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const statusLabel: Record<string, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluida",
  PENDING: "Pendente",
  CANCELLED: "Cancelada",
  PAID: "Pago",
  OVERDUE: "Atrasado",
  DRAFT: "Rascunho",
  SENT: "Enviado",
  APPROVED: "Aprovado",
  IN_PROGRESS: "Em andamento",
  REJECTED: "Rejeitado",
  CANCELED: "Cancelado",
  YELLOW: "Atencao",
  RED: "Pendencia",
  SETTLED: "Liquidado",
};

const clinicalLabel: Record<string, string> = {
  PROCEDURE: "Procedimento",
  ANAMNESIS: "Anamnese",
  PHOTO: "Foto/Anexo",
  NOTE: "Anotacao",
  LEGACY_DIAGNOSIS: "Diagnostico legado",
  LEGACY_TREATMENT: "Tratamento legado",
};

const paymentMethodLabel: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartao de credito",
  DEBIT_CARD: "Cartao de debito",
  CASH: "Dinheiro",
  BOLETO: "Boleto",
};

const documentKindLabel: Record<string, string> = {
  ATTACHMENT: "Anexo",
  PRESCRIPTION: "Receita",
  FISCAL_DOCUMENT: "Documento",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const excerpt = (value: string, size = 120) =>
  value.length <= size ? value : `${value.slice(0, size).trimEnd()}...`;

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

function SourceBadge({ source }: { source: SummarySource }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${
        source === "LEGACY"
          ? "bg-neutral-100 text-neutral-700 border-neutral-200"
          : "bg-primary-50 text-primary-700 border-primary-200"
      }`}
    >
      {source === "LEGACY" ? "Legado" : "Atual"}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-neutral-400">{message}</p>;
}

function SummaryMetric({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  hint: string;
  icon: typeof DollarSign;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="mb-2 h-4 w-4 text-neutral-400" />
        <p className="text-xs text-neutral-400">{title}</p>
        <p className="text-lg font-semibold text-neutral-900">{value}</p>
        <p className="text-xs text-neutral-400">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setNotFound(false);
        const data = await getPatientSummary(id);
        if (!active) return;
        setSummary(data);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          setSummary(null);
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : "Nao foi possivel carregar a visao consolidada do paciente."
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [id, refreshTick]);

  const recentClinical = useMemo(
    () => summary?.chart.timeline.slice(0, 5) ?? [],
    [summary]
  );
  const recentFinancial = useMemo(
    () => summary?.financial.entries.slice(0, 5) ?? [],
    [summary]
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

  if (notFound || !summary) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="mb-3 h-12 w-12 text-neutral-300" />
          <h3 className="text-lg font-semibold text-neutral-700">
            Paciente nao encontrado
          </h3>
          <Button className="mt-4" variant="outline" onClick={() => router.push("/patients")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Pacientes
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
          <h3 className="text-lg font-semibold text-neutral-700">
            Falha ao carregar o paciente
          </h3>
          <p className="mt-1 text-sm text-neutral-500">{error}</p>
          <Button className="mt-4" variant="outline" onClick={() => setRefreshTick((value) => value + 1)}>
            Tentar novamente
          </Button>
        </div>
      </PageTransition>
    );
  }

  const patient = summary.patient;
  const serasa = serasaConfig[patient.serasaStatus];
  const SerasaIcon = serasa.icon;

  const openDocument = (item: PatientSummaryDocumentItem) => {
    if (!item.url) {
      addToast({
        title: "Documento indisponivel",
        description: "Esse item nao possui arquivo associado.",
        variant: "warning",
      });
      return;
    }

    window.open(item.url, "_blank", "noopener,noreferrer");
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/patients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary-100 text-lg text-primary-700">
                  {getInitials(patient.name)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-neutral-900">
                    {patient.name}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${serasa.color}`}
                  >
                    <SerasaIcon className="h-3 w-3" />
                    {serasa.label}
                  </span>
                  <Badge variant="outline">Hub do paciente</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {formatPhone(patient.phone)}
                  </span>
                  {patient.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {patient.email}
                    </span>
                  )}
                  <span>CPF: {formatCPF(patient.cpf)}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Nasc: {formatDate(patient.birthDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push("/appointments")}>
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                Agenda
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/financial")}>
                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                Financeiro
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/clinical-records")}>
                <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                Prontuario
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <SummaryMetric
            title="Consultas"
            value={summary.indicators.appointmentsTotal}
            hint={`${summary.appointments.pendingCount} pendente(s)`}
            icon={Calendar}
          />
          <SummaryMetric
            title="Receita gerada"
            value={formatCurrency(summary.financial.totals.generatedRevenue)}
            hint="lancamentos do paciente"
            icon={TrendingUp}
          />
          <SummaryMetric
            title="Pago"
            value={formatCurrency(summary.financial.totals.totalPaid)}
            hint="recebimentos confirmados"
            icon={Wallet}
          />
          <SummaryMetric
            title="Saldo pendente"
            value={formatCurrency(summary.financial.totals.totalOutstanding)}
            hint={`${summary.indicators.overdueFinancialEntries} em atraso`}
            icon={Clock}
          />
          <SummaryMetric
            title="Lucro rastreado"
            value={formatCurrency(summary.financial.totals.trackedProfit)}
            hint="receita menos custos vinculados"
            icon={DollarSign}
          />
        </div>

        <Tabs defaultValue="summary">
          <TabsList className="bg-neutral-100 p-1">
            <TabsTrigger value="summary" className="text-xs">
              <User className="mr-1.5 h-3.5 w-3.5" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="chart" className="text-xs">
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
              Prontuario
            </TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs">
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="financial" className="text-xs">
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">
              <Paperclip className="mr-1.5 h-3.5 w-3.5" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="treatments" className="text-xs">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Tratamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Cadastro e observacoes</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div className="space-y-2 text-neutral-600">
                    <p>
                      <span className="font-medium text-neutral-900">Telefone:</span>{" "}
                      {formatPhone(patient.phone)}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-900">Email:</span>{" "}
                      {patient.email ?? "Nao informado"}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-900">Endereco:</span>{" "}
                      {patient.address ?? "Nao informado"}
                    </p>
                  </div>
                  <div className="space-y-2 text-neutral-600">
                    <p>
                      <span className="font-medium text-neutral-900">Alergias:</span>{" "}
                      {patient.allergies ?? "Nenhuma informada"}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-900">Observacoes:</span>{" "}
                      {patient.medicalNotes ?? "Nenhuma observacao importante"}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-900">Planos ativos:</span>{" "}
                      {summary.treatmentPlans.active}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Proximo contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {summary.appointments.upcoming[0] ? (
                    <>
                      <p className="font-medium text-neutral-900">
                        {summary.appointments.upcoming[0].procedure}
                      </p>
                      <p className="text-neutral-600">
                        {formatDate(summary.appointments.upcoming[0].date)} as{" "}
                        {summary.appointments.upcoming[0].startTime}
                      </p>
                      <p className="text-neutral-600">
                        Com {summary.appointments.upcoming[0].professionalName}
                      </p>
                      <StatusBadge status={summary.appointments.upcoming[0].status} />
                    </>
                  ) : (
                    <EmptyState message="Nenhuma consulta futura localizada." />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TriangleAlert className="h-4 w-4 text-neutral-400" />
                    Pendencias
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {summary.pendingItems.length === 0 ? (
                    <EmptyState message="Nenhuma pendencia relevante para este paciente." />
                  ) : (
                    summary.pendingItems.map((item) => (
                      <div key={item.id} className="rounded-lg border border-neutral-100 p-3">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                          <SourceBadge source={item.source} />
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-sm text-neutral-600">{item.description}</p>
                        {item.dueAt && (
                          <p className="mt-1 text-xs text-neutral-400">
                            Referencia: {formatDate(item.dueAt)}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Historico clinico recente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!summary.chart.clinicalAccessGranted ? (
                    <EmptyState message="Seu perfil nao possui acesso ao detalhe clinico deste paciente." />
                  ) : recentClinical.length === 0 ? (
                    <EmptyState message="Nenhum evento clinico recente localizado." />
                  ) : (
                    recentClinical.map((item) => (
                      <div
                        key={`${item.source}-${item.id}`}
                        className="rounded-lg border border-neutral-100 p-3"
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                          <SourceBadge source={item.source} />
                          {item.recordType && (
                            <Badge variant="outline" className="text-[10px]">
                              {clinicalLabel[item.recordType] ?? item.recordType}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400">
                          {formatDate(item.occurredAt)}
                          {item.professionalName ? ` - ${item.professionalName}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">{item.description}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Financeiro recente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentFinancial.length === 0 ? (
                  <EmptyState message="Nenhum registro financeiro localizado." />
                ) : (
                  recentFinancial.map((entry) => (
                    <div
                      key={`${entry.source}-${entry.id}`}
                      className="rounded-lg border border-neutral-100 p-3"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-neutral-900">
                          {entry.description}
                        </p>
                        <SourceBadge source={entry.source} />
                        {!entry.includeInTotals && (
                          <Badge variant="outline" className="text-[10px]">
                            fora dos totais
                          </Badge>
                        )}
                        <StatusBadge status={entry.status} />
                      </div>
                      <p className="text-xs text-neutral-400">
                        Vencimento: {formatDate(entry.dueDate)}
                        {entry.paymentMethod
                          ? ` - ${paymentMethodLabel[entry.paymentMethod]}`
                          : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-neutral-500">
                        <span>Valor: {formatCurrency(entry.amount)}</span>
                        <span>Pago: {formatCurrency(entry.paidAmount)}</span>
                        <span>Saldo: {formatCurrency(entry.remainingAmount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chart" className="mt-4 space-y-4">
            {!summary.chart.clinicalAccessGranted ? (
              <Card>
                <CardContent className="p-4">
                  <EmptyState message="Seu perfil nao pode visualizar os detalhes clinicos deste paciente." />
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Diagnosticos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {summary.chart.diagnoses.length === 0 ? (
                        <EmptyState message="Nenhum diagnostico registrado." />
                      ) : (
                        summary.chart.diagnoses.map((item) => (
                          <div key={item.id} className="rounded-lg border border-neutral-100 p-3">
                            <div className="mb-1 flex items-center gap-2">
                              <SourceBadge source={item.source} />
                              <Badge variant="outline" className="text-[10px]">
                                {clinicalLabel[item.recordType ?? ""] ?? item.recordType}
                              </Badge>
                            </div>
                            <p className="text-xs text-neutral-400">{formatDate(item.occurredAt)}</p>
                            <p className="mt-1 text-sm text-neutral-600">{item.description}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Tratamentos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {summary.chart.treatments.length === 0 ? (
                        <EmptyState message="Nenhum tratamento registrado no prontuario." />
                      ) : (
                        summary.chart.treatments.map((item) => (
                          <div key={item.id} className="rounded-lg border border-neutral-100 p-3">
                            <div className="mb-1 flex items-center gap-2">
                              <SourceBadge source={item.source} />
                              <Badge variant="outline" className="text-[10px]">
                                {clinicalLabel[item.recordType ?? ""] ?? item.recordType}
                              </Badge>
                            </div>
                            <p className="text-xs text-neutral-400">{formatDate(item.occurredAt)}</p>
                            <p className="mt-1 text-sm text-neutral-600">{item.description}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Linha do tempo clinica</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {summary.chart.timeline.length === 0 ? (
                      <EmptyState message="Nenhum registro clinico consolidado." />
                    ) : (
                      summary.chart.timeline.map((item) => (
                        <div
                          key={`${item.source}-${item.id}`}
                          className="rounded-lg border border-neutral-100 p-3"
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                            <SourceBadge source={item.source} />
                            {item.recordType && (
                              <Badge variant="outline" className="text-[10px]">
                                {clinicalLabel[item.recordType] ?? item.recordType}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400">
                            {formatDate(item.occurredAt)}
                            {item.professionalName ? ` - ${item.professionalName}` : ""}
                          </p>
                          <p className="mt-1 text-sm text-neutral-600">{item.description}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="appointments" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Consultas futuras</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {summary.appointments.upcoming.length === 0 ? (
                    <EmptyState message="Nenhuma consulta futura agendada." />
                  ) : (
                    summary.appointments.upcoming.map((appointment) => (
                      <div
                        key={`${appointment.source}-${appointment.id}`}
                        className="rounded-lg border border-neutral-100 p-3"
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-neutral-900">
                            {appointment.procedure}
                          </p>
                          <SourceBadge source={appointment.source} />
                          {appointment.statusOrigin === "INFERRED" && (
                            <Badge variant="outline" className="text-[10px]">
                              status inferido
                            </Badge>
                          )}
                          <StatusBadge status={appointment.status} />
                        </div>
                        <p className="text-xs text-neutral-400">
                          {formatDate(appointment.date)} as {appointment.startTime}
                          {appointment.endTime ? ` - ${appointment.endTime}` : ""} com{" "}
                          {appointment.professionalName}
                        </p>
                        {appointment.notes && (
                          <p className="mt-1 text-sm text-neutral-600">{appointment.notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Historico de consultas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {summary.appointments.past.length === 0 ? (
                    <EmptyState message="Nenhum historico de consulta registrado." />
                  ) : (
                    summary.appointments.past.map((appointment) => (
                      <div
                        key={`${appointment.source}-${appointment.id}`}
                        className="rounded-lg border border-neutral-100 p-3"
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-neutral-900">
                            {appointment.procedure}
                          </p>
                          <SourceBadge source={appointment.source} />
                          <StatusBadge status={appointment.status} />
                        </div>
                        <p className="text-xs text-neutral-400">
                          {formatDate(appointment.date)} as {appointment.startTime}
                          {appointment.endTime ? ` - ${appointment.endTime}` : ""} com{" "}
                          {appointment.professionalName}
                        </p>
                        {appointment.notes && (
                          <p className="mt-1 text-sm text-neutral-600">{appointment.notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryMetric
                title="Receita"
                value={formatCurrency(summary.financial.totals.generatedRevenue)}
                hint="vinculada ao paciente"
                icon={TrendingUp}
              />
              <SummaryMetric
                title="Custos vinculados"
                value={formatCurrency(summary.financial.totals.patientLinkedCosts)}
                hint="despesas rastreadas"
                icon={Wallet}
              />
              <SummaryMetric
                title="Pago"
                value={formatCurrency(summary.financial.totals.totalPaid)}
                hint="recebido"
                icon={DollarSign}
              />
              <SummaryMetric
                title="Em aberto"
                value={formatCurrency(summary.financial.totals.totalOutstanding)}
                hint={`${summary.financial.totals.paymentCount} pagamento(s)`}
                icon={Clock}
              />
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Lancamentos financeiros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.financial.entries.length === 0 ? (
                  <EmptyState message="Nenhum lancamento financeiro vinculado ao paciente." />
                ) : (
                  summary.financial.entries.map((entry) => (
                    <div
                      key={`${entry.source}-${entry.id}`}
                      className="rounded-lg border border-neutral-100 p-3"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-neutral-900">
                          {entry.description}
                        </p>
                        <SourceBadge source={entry.source} />
                        {!entry.includeInTotals && (
                          <Badge variant="outline" className="text-[10px]">
                            fora dos totais
                          </Badge>
                        )}
                        <StatusBadge status={entry.status} />
                      </div>
                      <p className="text-xs text-neutral-400">
                        Vencimento: {formatDate(entry.dueDate)}
                        {entry.paymentMethod
                          ? ` - ${paymentMethodLabel[entry.paymentMethod]}`
                          : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-neutral-500">
                        <span>Valor: {formatCurrency(entry.amount)}</span>
                        <span>Pago: {formatCurrency(entry.paidAmount)}</span>
                        <span>Saldo: {formatCurrency(entry.remainingAmount)}</span>
                      </div>
                      {entry.notes && (
                        <p className="mt-1 text-sm text-neutral-600">{entry.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Documentos e anexos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!summary.chart.clinicalAccessGranted ? (
                  <EmptyState message="Seu perfil nao pode visualizar documentos clinicos deste paciente." />
                ) : summary.documents.items.length === 0 ? (
                  <EmptyState message="Nenhum documento disponivel." />
                ) : (
                  summary.documents.items.map((item) => (
                    <div
                      key={`${item.source}-${item.id}`}
                      className="rounded-lg border border-neutral-100 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-neutral-900">
                              {item.title}
                            </p>
                            <SourceBadge source={item.source} />
                            <Badge variant="outline" className="text-[10px]">
                              {documentKindLabel[item.kind]}
                            </Badge>
                          </div>
                          <p className="text-xs text-neutral-400">
                            {formatDate(item.createdAt)}
                            {item.professionalName ? ` - ${item.professionalName}` : ""}
                          </p>
                          {item.contentPreview && (
                            <p className="text-sm text-neutral-600">
                              {excerpt(item.contentPreview)}
                            </p>
                          )}
                        </div>
                        {item.url && (
                          <Button variant="outline" size="sm" onClick={() => openDocument(item)}>
                            Abrir
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Receitas emitidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!summary.chart.clinicalAccessGranted ? (
                  <EmptyState message="Seu perfil nao pode visualizar receitas deste paciente." />
                ) : summary.prescriptions.items.length === 0 ? (
                  <EmptyState message="Nenhuma receita registrada." />
                ) : (
                  summary.prescriptions.items.map((item) => (
                    <div
                      key={`${item.source}-${item.id}`}
                      className="rounded-lg border border-neutral-100 p-3"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-neutral-900">Receita emitida</p>
                        <SourceBadge source={item.source} />
                      </div>
                      <p className="text-xs text-neutral-400">
                        {formatDate(item.createdAt)} - {item.professionalName}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600">{item.content}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="treatments" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Procedimentos realizados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!summary.chart.clinicalAccessGranted ? (
                    <EmptyState message="Seu perfil nao pode visualizar procedimentos realizados deste paciente." />
                  ) : summary.procedures.items.length === 0 ? (
                    <EmptyState message="Nenhum procedimento realizado foi identificado." />
                  ) : (
                    summary.procedures.items.map((procedure) => (
                      <div
                        key={`${procedure.source}-${procedure.id}`}
                        className="rounded-lg border border-neutral-100 p-3"
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-neutral-900">
                            {procedure.title}
                          </p>
                          <SourceBadge source={procedure.source} />
                        </div>
                        <p className="text-xs text-neutral-400">
                          {formatDate(procedure.occurredAt)}
                          {procedure.professionalName ? ` - ${procedure.professionalName}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">
                          {procedure.description}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Planos de tratamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summary.treatmentPlans.items.length === 0 ? (
                    <EmptyState message="Nenhum plano de tratamento vinculado ao paciente." />
                  ) : (
                    summary.treatmentPlans.items.map((plan) => (
                      <div key={plan.id} className="rounded-lg border border-neutral-100 p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {plan.title}
                            </p>
                            <p className="text-xs text-neutral-400">
                              Atualizado em {formatDate(plan.updatedAt)}
                            </p>
                          </div>
                          <StatusBadge status={plan.status} />
                        </div>
                        <div className="mb-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                          <span>Total: {formatCurrency(plan.totalAmount)}</span>
                          {plan.discount !== undefined && (
                            <span>Desconto: {formatCurrency(plan.discount)}</span>
                          )}
                          {plan.installments && <span>{plan.installments} parcela(s)</span>}
                        </div>
                        {plan.notes && (
                          <p className="mb-2 text-sm text-neutral-600">{plan.notes}</p>
                        )}
                        <div className="space-y-1 rounded-lg bg-neutral-50 p-3">
                          {plan.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-2 text-sm"
                            >
                              <div>
                                <span className="font-medium text-neutral-900">
                                  {item.procedureName}
                                </span>
                                <span className="ml-2 text-neutral-500">
                                  {item.quantity}x
                                  {item.tooth ? ` - dente ${item.tooth}` : ""}
                                  {item.category ? ` - ${item.category}` : ""}
                                </span>
                              </div>
                              <span className="font-medium text-neutral-900">
                                {formatCurrency(item.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
