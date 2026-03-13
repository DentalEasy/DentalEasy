"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  DollarSign,
  Download,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { RoleGate } from "@/components/auth";
import { PageTransition } from "@/lib/animations";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  ApiError,
  getFinancialReport,
  getPatientsReport,
  getProceduresReport,
  getTeamReport,
} from "@/lib/api";
import type {
  FinancialReport,
  PatientsReport,
  ProceduresReport,
  TeamReport,
} from "@/types";

const periodMap: Record<string, { months: number }> = {
  "1m": { months: 1 },
  "3m": { months: 3 },
  "6m": { months: 6 },
  "12m": { months: 12 },
};

const formatPeriod = (period: string) => {
  const now = new Date();
  const months = periodMap[period]?.months ?? 6;
  const from = new Date(now);
  from.setMonth(from.getMonth() - (months - 1));
  from.setDate(1);
  return {
    from: from.toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
  };
};

export default function ReportsPage() {
  const [period, setPeriod] = useState("6m");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [proceduresReport, setProceduresReport] = useState<ProceduresReport | null>(null);
  const [patientsReport, setPatientsReport] = useState<PatientsReport | null>(null);
  const [teamReport, setTeamReport] = useState<TeamReport | null>(null);
  const { addToast } = useToast();

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const params = formatPeriod(period);
      const [financial, procedures, patients, team] = await Promise.all([
        getFinancialReport(params),
        getProceduresReport(params),
        getPatientsReport(params),
        getTeamReport(params),
      ]);
      setFinancialReport(financial);
      setProceduresReport(procedures);
      setPatientsReport(patients);
      setTeamReport(team);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel carregar relatorios.";
      setLoadError(message);
      addToast({ title: "Erro ao carregar", description: message, variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, [period]);

  const hasReportData =
    !!financialReport && !!proceduresReport && !!patientsReport && !!teamReport;

  const kpis = useMemo(() => {
    if (!financialReport || !patientsReport) return null;
    return {
      income: financialReport.totals.income,
      expense: financialReport.totals.expense,
      profit: financialReport.totals.profit,
      totalActive: patientsReport.metrics.totalActive,
    };
  }, [financialReport, patientsReport]);

  return (
    <RoleGate
      allowedRoles={["ADMIN", "DENTIST", "SECRETARY"]}
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center">
            <CardContent className="p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-100 mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-neutral-400" />
              </div>
              <h2 className="text-base font-semibold text-neutral-900 mb-1">Acesso Restrito</h2>
              <p className="text-sm text-neutral-400">
                Seu perfil nao tem permissao para acessar relatorios.
              </p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Relatorios</h2>
              <p className="text-sm text-neutral-400 mt-0.5">
                Indicadores financeiros, clinicos e operacionais
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Ultimo mes</SelectItem>
                  <SelectItem value="3m">3 meses</SelectItem>
                  <SelectItem value="6m">6 meses</SelectItem>
                  <SelectItem value="12m">12 meses</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() =>
                  addToast({
                    title: "Exportacao em andamento",
                    description: "A exportacao avancada sera ampliada na proxima etapa.",
                    variant: "info",
                  })
                }
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-sm text-neutral-400">Carregando...</CardContent>
            </Card>
          ) : !hasReportData || !kpis ? (
            <Card>
              <CardContent className="p-6 space-y-3">
                <p className="text-sm text-neutral-500">
                  {loadError ?? "Nao foi possivel montar os relatorios com os dados atuais."}
                </p>
                <Button variant="outline" onClick={() => void loadReports()}>
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <DollarSign className="h-4 w-4 text-neutral-400 mb-2" />
                    <p className="text-xl font-bold text-neutral-900">
                      {formatCurrency(kpis.income)}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">Receita total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <TrendingDown className="h-4 w-4 text-neutral-400 mb-2" />
                    <p className="text-xl font-bold text-neutral-900">
                      {formatCurrency(kpis.expense)}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">Despesas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <TrendingUp className="h-4 w-4 text-neutral-400 mb-2" />
                    <p className="text-xl font-bold text-neutral-900">
                      {formatCurrency(kpis.profit)}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">Lucro</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <Users className="h-4 w-4 text-neutral-400 mb-2" />
                    <p className="text-xl font-bold text-neutral-900">{kpis.totalActive}</p>
                    <p className="text-xs text-neutral-400 mt-1">Pacientes ativos</p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="financial" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="financial">Financeiro</TabsTrigger>
                  <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
                  <TabsTrigger value="patients">Pacientes</TabsTrigger>
                  <TabsTrigger value="team">Equipe</TabsTrigger>
                </TabsList>

                <TabsContent value="financial" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-neutral-400" />
                        Receitas x Despesas por mes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {financialReport.revenueByMonth.map((entry) => (
                        <div
                          key={entry.month}
                          className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-neutral-900">{entry.month}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-green-600">{formatCurrency(entry.income)}</span>
                            <span className="text-red-500">{formatCurrency(entry.expense)}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Formas de pagamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {financialReport.paymentMethods.map((entry) => (
                        <div
                          key={entry.method}
                          className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-neutral-900">{entry.method}</span>
                          <span className="text-neutral-600">
                            {entry.count} - {formatCurrency(entry.amount)} ({entry.percentage}%)
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="procedures" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Procedimentos mais realizados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {proceduresReport.topProcedures.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-neutral-900">{entry.name}</span>
                          <span className="text-neutral-600">
                            {entry.count} - {formatCurrency(entry.revenue)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="patients" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Metricas de pacientes</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      <MetricCard label="Novos pacientes" value={patientsReport.metrics.newPatients} />
                      <MetricCard label="Taxa de retorno" value={`${patientsReport.metrics.returnRate}%`} />
                      <MetricCard label="Ticket medio" value={formatCurrency(patientsReport.metrics.avgTicket)} />
                      <MetricCard label="Inadimplencia" value={formatCurrency(patientsReport.metrics.overdueAmount)} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Desempenho da equipe</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {teamReport.performance.map((entry) => (
                        <div
                          key={entry.dentistId}
                          className="rounded-md border border-neutral-100 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-neutral-900">{entry.name}</p>
                            <Badge variant="secondary">{entry.satisfaction.toFixed(1)} *</Badge>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">
                            {entry.patients} pacientes - {entry.procedures} atendimentos - {formatCurrency(entry.revenue)}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </PageTransition>
    </RoleGate>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-100 px-3 py-2">
      <p className="text-[11px] text-neutral-400 uppercase">{label}</p>
      <p className="text-base font-semibold text-neutral-900 mt-1">{value}</p>
    </div>
  );
}
