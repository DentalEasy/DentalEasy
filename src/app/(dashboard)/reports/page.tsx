"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Stethoscope,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Activity,
  Download,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import { RoleGate } from "@/components/auth";
import { formatCurrency } from "@/lib/utils";
import { PageTransition } from "@/lib/animations";
import { useToast } from "@/components/ui/toast";

// ─── Mock Data ───
const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const revenueByMonth = [
  { month: "Out", income: 28400, expense: 6200 },
  { month: "Nov", income: 32100, expense: 7800 },
  { month: "Dez", income: 27600, expense: 5400 },
  { month: "Jan", income: 34200, expense: 8100 },
  { month: "Fev", income: 38500, expense: 7200 },
  { month: "Mar", income: 41200, expense: 9300 },
];

const procedureStats = [
  { name: "Limpeza", count: 45, revenue: 11250, percentage: 18 },
  { name: "Restauração", count: 32, revenue: 11200, percentage: 15 },
  { name: "Clareamento", count: 18, revenue: 21600, percentage: 14 },
  { name: "Canal", count: 12, revenue: 18000, percentage: 12 },
  { name: "Extração", count: 15, revenue: 6000, percentage: 8 },
  { name: "Implante", count: 6, revenue: 21000, percentage: 14 },
  { name: "Ortodontia", count: 8, revenue: 24000, percentage: 12 },
  { name: "Faceta", count: 4, revenue: 8000, percentage: 7 },
];

const dentistPerformance = [
  { name: "Dr. Lucas Mendes", patients: 85, procedures: 92, revenue: 68200, satisfaction: 4.8 },
  { name: "Dra. Camila Santos", patients: 62, procedures: 71, revenue: 52100, satisfaction: 4.9 },
  { name: "Dr. Rafael Oliveira", patients: 54, procedures: 58, revenue: 41500, satisfaction: 4.6 },
];

const patientMetrics = {
  totalActive: 342,
  newThisMonth: 28,
  returnRate: 72,
  avgTicket: 485,
  overdue: 18,
  overdueAmount: 12400,
};

const paymentMethodBreakdown = [
  { method: "PIX", count: 89, amount: 42300, percentage: 35 },
  { method: "Cartão Crédito", count: 54, amount: 36800, percentage: 30 },
  { method: "Dinheiro", count: 32, amount: 15200, percentage: 13 },
  { method: "Cartão Débito", count: 28, amount: 13600, percentage: 11 },
  { method: "Boleto", count: 22, amount: 13100, percentage: 11 },
];

const weeklyAppointments = [
  { day: "Seg", count: 12, revenue: 5800 },
  { day: "Ter", count: 15, revenue: 7200 },
  { day: "Qua", count: 18, revenue: 8900 },
  { day: "Qui", count: 14, revenue: 6400 },
  { day: "Sex", count: 16, revenue: 7800 },
  { day: "Sáb", count: 8, revenue: 4100 },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("6m");
  const { addToast } = useToast();

  const totalIncome = revenueByMonth.reduce((s, m) => s + m.income, 0);
  const totalExpense = revenueByMonth.reduce((s, m) => s + m.expense, 0);
  const profit = totalIncome - totalExpense;
  const profitMargin = ((profit / totalIncome) * 100).toFixed(1);
  const maxRevenue = Math.max(...revenueByMonth.map((m) => m.income));

  const handleExport = () => {
    addToast({ title: "Exportando relatório", description: "O download será iniciado em instantes", variant: "info" });
  };

  return (
    <RoleGate allowedRoles={["ADMIN", "DENTIST"]}>
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Relatórios</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Análise financeira e operacional da clínica</p>
            </div>
            <div className="flex items-center gap-2">
              <Select onValueChange={setPeriod} value={period}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Último mês</SelectItem>
                  <SelectItem value="3m">3 meses</SelectItem>
                  <SelectItem value="6m">6 meses</SelectItem>
                  <SelectItem value="12m">12 meses</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-1.5" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Receita Total", value: formatCurrency(totalIncome), change: "+12.4%", up: true, icon: DollarSign, color: "text-green-600" },
              { label: "Despesas", value: formatCurrency(totalExpense), change: "+3.2%", up: true, icon: TrendingDown, color: "text-red-500" },
              { label: "Lucro Líquido", value: formatCurrency(profit), change: `${profitMargin}% margem`, up: true, icon: TrendingUp, color: "text-emerald-600" },
              { label: "Pacientes Ativos", value: patientMetrics.totalActive.toString(), change: `+${patientMetrics.newThisMonth} este mês`, up: true, icon: Users, color: "text-blue-600" },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{kpi.label}</p>
                    <div className={`p-1.5 rounded-lg bg-neutral-50 ${kpi.color}`}>
                      <kpi.icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-neutral-900">{kpi.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {kpi.up ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                    <span className={`text-[11px] font-medium ${kpi.up ? "text-green-600" : "text-red-500"}`}>{kpi.change}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="financial" className="space-y-4">
            <TabsList>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
              <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
              <TabsTrigger value="team">Equipe</TabsTrigger>
              <TabsTrigger value="patients">Pacientes</TabsTrigger>
            </TabsList>

            {/* Tab: Financial */}
            <TabsContent value="financial" className="space-y-4">
              {/* Revenue Chart (CSS bars) */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Receita vs Despesas</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-end gap-3 h-48">
                    {revenueByMonth.map((m) => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col items-center gap-0.5" style={{ height: "160px" }}>
                          <div className="w-full flex items-end justify-center gap-0.5" style={{ height: "100%" }}>
                            <div
                              className="w-[45%] bg-primary-500 rounded-t-sm transition-all"
                              style={{ height: `${(m.income / maxRevenue) * 100}%` }}
                              title={`Receita: ${formatCurrency(m.income)}`}
                            />
                            <div
                              className="w-[45%] bg-red-300 rounded-t-sm transition-all"
                              style={{ height: `${(m.expense / maxRevenue) * 100}%` }}
                              title={`Despesa: ${formatCurrency(m.expense)}`}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-neutral-400">{m.month}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-3 justify-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-primary-500" />
                      <span className="text-[11px] text-neutral-500">Receita</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-red-300" />
                      <span className="text-[11px] text-neutral-500">Despesas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Formas de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-3">
                  {paymentMethodBreakdown.map((pm) => (
                    <div key={pm.method}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-neutral-700">{pm.method}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400">{pm.count} pagamentos</span>
                          <span className="text-xs font-semibold text-neutral-900">{formatCurrency(pm.amount)}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-400 rounded-full transition-all" style={{ width: `${pm.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Overdue */}
              <Card className="border-red-100 bg-red-50/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-red-600 uppercase tracking-wider">Inadimplência</p>
                      <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(patientMetrics.overdueAmount)}</p>
                      <p className="text-xs text-red-500 mt-0.5">{patientMetrics.overdue} pacientes com pagamento atrasado</p>
                    </div>
                    <div className="p-3 rounded-xl bg-red-100">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Procedures */}
            <TabsContent value="procedures" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Procedimentos Mais Realizados</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-3">
                  {procedureStats.map((proc, idx) => (
                    <div key={proc.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-neutral-400 w-5 text-right">{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-neutral-900">{proc.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-neutral-400">{proc.count} realizados</span>
                            <span className="text-sm font-semibold text-neutral-900">{formatCurrency(proc.revenue)}</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-400 rounded-full transition-all" style={{ width: `${proc.percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Weekly distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Distribuição Semanal de Atendimentos</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid grid-cols-6 gap-2">
                    {weeklyAppointments.map((d) => (
                      <div key={d.day} className="text-center">
                        <div className="h-24 flex items-end justify-center mb-1">
                          <div
                            className="w-full max-w-[40px] bg-primary-100 rounded-t-md relative group cursor-pointer hover:bg-primary-200 transition-colors"
                            style={{ height: `${(d.count / 18) * 100}%` }}
                          >
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary-600">{d.count}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-neutral-500">{d.day}</span>
                        <p className="text-[9px] text-neutral-400">{formatCurrency(d.revenue)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Team */}
            <TabsContent value="team" className="space-y-4">
              <div className="grid gap-3">
                {dentistPerformance.map((doc, idx) => (
                  <Card key={doc.name}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600 font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">{doc.name}</p>
                            <p className="text-xs text-neutral-400">{doc.patients} pacientes · {doc.procedures} procedimentos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-neutral-900">{formatCurrency(doc.revenue)}</p>
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-[11px] text-amber-500">★</span>
                            <span className="text-xs font-medium text-neutral-600">{doc.satisfaction}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="bg-neutral-50 rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-neutral-900">{doc.patients}</p>
                          <p className="text-[10px] text-neutral-400">Pacientes</p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-neutral-900">{doc.procedures}</p>
                          <p className="text-[10px] text-neutral-400">Procedimentos</p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-neutral-900">{formatCurrency(doc.revenue / doc.procedures)}</p>
                          <p className="text-[10px] text-neutral-400">Ticket Médio</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tab: Patients */}
            <TabsContent value="patients" className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: "Pacientes Ativos", value: patientMetrics.totalActive.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Novos (mês)", value: `+${patientMetrics.newThisMonth}`, icon: ArrowUpRight, color: "text-green-600", bg: "bg-green-50" },
                  { label: "Taxa de Retorno", value: `${patientMetrics.returnRate}%`, icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
                  { label: "Ticket Médio", value: formatCurrency(patientMetrics.avgTicket), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Inadimplentes", value: patientMetrics.overdue.toString(), icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
                  { label: "Valor em Atraso", value: formatCurrency(patientMetrics.overdueAmount), icon: DollarSign, color: "text-red-600", bg: "bg-red-50" },
                ].map((metric) => (
                  <Card key={metric.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${metric.bg} ${metric.color}`}>
                          <metric.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">{metric.label}</p>
                          <p className="text-lg font-bold text-neutral-900">{metric.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Retention funnel */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Funil de Retenção</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-3">
                  {[
                    { stage: "Primeira consulta", count: 342, percentage: 100 },
                    { stage: "Retorno agendado", count: 280, percentage: 82 },
                    { stage: "Retorno realizado", count: 246, percentage: 72 },
                    { stage: "Plano de tratamento", count: 198, percentage: 58 },
                    { stage: "Tratamento concluído", count: 156, percentage: 46 },
                  ].map((step) => (
                    <div key={step.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-neutral-700">{step.stage}</span>
                        <span className="text-xs text-neutral-400">{step.count} ({step.percentage}%)</span>
                      </div>
                      <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-300 rounded-full transition-all"
                          style={{ width: `${step.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    </RoleGate>
  );
}
