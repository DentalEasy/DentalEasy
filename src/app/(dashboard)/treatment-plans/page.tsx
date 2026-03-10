"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Separator,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useProcedures, categoryLabels } from "@/contexts/procedures-context";
import { PageTransition } from "@/lib/animations";
import { useToast } from "@/components/ui/toast";

// ─── Types ───
type PlanStatus = "DRAFT" | "SENT" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

interface TreatmentPlanItem {
  id: string;
  procedureName: string;
  category: string;
  tooth?: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  notes?: string;
}

interface TreatmentPlan {
  id: string;
  patientName: string;
  patientPhone: string;
  dentistName: string;
  status: PlanStatus;
  items: TreatmentPlanItem[];
  totalAmount: number;
  installments: number;
  installmentValue: number;
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  validUntil: string;
}

// ─── Mock data ───
const mockPlans: TreatmentPlan[] = [
  {
    id: "tp1",
    patientName: "Maria Silva",
    patientPhone: "(17) 99976-5432",
    dentistName: "Dr. Lucas Mendes",
    status: "APPROVED",
    items: [
      { id: "i1", procedureName: "Limpeza", category: "PREVENTIVO", unitPrice: 250, quantity: 1, discount: 0 },
      { id: "i2", procedureName: "Restauração Resina", category: "RESTAURADOR", tooth: "16", unitPrice: 350, quantity: 3, discount: 10 },
      { id: "i3", procedureName: "Clareamento", category: "ESTETICA", unitPrice: 1200, quantity: 1, discount: 0 },
    ],
    totalAmount: 2395,
    installments: 3,
    installmentValue: 798.33,
    notes: "Paciente prefere iniciar pelo clareamento",
    createdAt: "2026-02-20",
    approvedAt: "2026-02-22",
    validUntil: "2026-04-20",
  },
  {
    id: "tp2",
    patientName: "João Oliveira",
    patientPhone: "(17) 99965-4321",
    dentistName: "Dr. Lucas Mendes",
    status: "SENT",
    items: [
      { id: "i4", procedureName: "Tratamento de Canal", category: "ENDODONTIA", tooth: "36", unitPrice: 1500, quantity: 1, discount: 0 },
      { id: "i5", procedureName: "Coroa Porcelana", category: "PROTESE", tooth: "36", unitPrice: 2500, quantity: 1, discount: 5 },
    ],
    totalAmount: 3875,
    installments: 5,
    installmentValue: 775,
    createdAt: "2026-03-01",
    validUntil: "2026-05-01",
  },
  {
    id: "tp3",
    patientName: "Ana Costa",
    patientPhone: "(17) 99954-3210",
    dentistName: "Dr. Lucas Mendes",
    status: "DRAFT",
    items: [
      { id: "i6", procedureName: "Extração Simples", category: "CIRURGIA", tooth: "38", unitPrice: 400, quantity: 1, discount: 0 },
      { id: "i7", procedureName: "Implante Dentário", category: "PROTESE", tooth: "38", unitPrice: 3500, quantity: 1, discount: 0 },
    ],
    totalAmount: 3900,
    installments: 6,
    installmentValue: 650,
    notes: "Aguardando retorno do paciente",
    createdAt: "2026-03-05",
    validUntil: "2026-05-05",
  },
  {
    id: "tp4",
    patientName: "Pedro Souza",
    patientPhone: "(17) 99943-2109",
    dentistName: "Dr. Lucas Mendes",
    status: "IN_PROGRESS",
    items: [
      { id: "i8", procedureName: "Aparelho Ortodôntico", category: "ORTODONTIA", unitPrice: 3000, quantity: 1, discount: 0 },
      { id: "i9", procedureName: "Manutenção Mensal", category: "ORTODONTIA", unitPrice: 250, quantity: 12, discount: 0 },
    ],
    totalAmount: 6000,
    installments: 12,
    installmentValue: 500,
    createdAt: "2026-01-15",
    approvedAt: "2026-01-18",
    validUntil: "2027-01-15",
  },
  {
    id: "tp5",
    patientName: "Fernanda Lima",
    patientPhone: "(17) 99932-1098",
    dentistName: "Dr. Lucas Mendes",
    status: "COMPLETED",
    items: [
      { id: "i10", procedureName: "Limpeza", category: "PREVENTIVO", unitPrice: 250, quantity: 1, discount: 0 },
      { id: "i11", procedureName: "Restauração Resina", category: "RESTAURADOR", tooth: "24", unitPrice: 350, quantity: 1, discount: 0 },
    ],
    totalAmount: 600,
    installments: 1,
    installmentValue: 600,
    createdAt: "2026-02-01",
    approvedAt: "2026-02-03",
    validUntil: "2026-04-01",
  },
  {
    id: "tp6",
    patientName: "Carlos Mendes",
    patientPhone: "(17) 99921-0987",
    dentistName: "Dr. Lucas Mendes",
    status: "REJECTED",
    items: [
      { id: "i12", procedureName: "Faceta Porcelana", category: "ESTETICA", unitPrice: 2000, quantity: 6, discount: 10 },
    ],
    totalAmount: 10800,
    installments: 10,
    installmentValue: 1080,
    notes: "Paciente optou por outra clínica",
    createdAt: "2026-02-10",
    validUntil: "2026-04-10",
  },
];

const statusConfig: Record<PlanStatus, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: "Rascunho", color: "bg-neutral-100 text-neutral-600", icon: FileText },
  SENT: { label: "Enviado", color: "bg-blue-50 text-blue-600", icon: Send },
  APPROVED: { label: "Aprovado", color: "bg-green-50 text-green-600", icon: CheckCircle2 },
  IN_PROGRESS: { label: "Em Andamento", color: "bg-amber-50 text-amber-600", icon: Clock },
  COMPLETED: { label: "Concluído", color: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  REJECTED: { label: "Recusado", color: "bg-red-50 text-red-600", icon: XCircle },
};

export default function TreatmentPlansPage() {
  const [plans, setPlans] = useState<TreatmentPlan[]>(mockPlans);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const { addToast } = useToast();
  const { activeProcedures } = useProcedures();

  // ─── New plan form state ───
  const [newPatient, setNewPatient] = useState("");
  const [newInstallments, setNewInstallments] = useState("1");
  const [newNotes, setNewNotes] = useState("");
  const [newItems, setNewItems] = useState<{ procedureId: string; tooth: string; quantity: string; discount: string }[]>([
    { procedureId: "", tooth: "", quantity: "1", discount: "0" },
  ]);

  const filtered = plans.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesSearch = p.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: plans.length,
    approved: plans.filter((p) => p.status === "APPROVED" || p.status === "IN_PROGRESS").length,
    pending: plans.filter((p) => p.status === "DRAFT" || p.status === "SENT").length,
    totalValue: plans.filter((p) => ["APPROVED", "IN_PROGRESS", "COMPLETED"].includes(p.status))
      .reduce((sum, p) => sum + p.totalAmount, 0),
  };

  const handleStatusChange = (planId: string, newStatus: PlanStatus) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, status: newStatus, ...(newStatus === "APPROVED" ? { approvedAt: new Date().toISOString().split("T")[0] } : {}) }
          : p
      )
    );
    const statusLabel = statusConfig[newStatus].label;
    addToast({ title: "Status atualizado", description: `Plano alterado para ${statusLabel}`, variant: "success" });
    setMenuOpenId(null);
  };

  const handleDeletePlan = (planId: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    addToast({ title: "Plano removido", description: "O plano de tratamento foi excluído", variant: "success" });
    setMenuOpenId(null);
  };

  const handleCreatePlan = () => {
    if (!newPatient.trim()) {
      addToast({ title: "Preencha o paciente", variant: "warning" });
      return;
    }
    const validItems = newItems.filter((ni) => ni.procedureId);
    if (validItems.length === 0) {
      addToast({ title: "Adicione pelo menos um procedimento", variant: "warning" });
      return;
    }

    const items: TreatmentPlanItem[] = validItems.map((ni, idx) => {
      const proc = activeProcedures.find((p) => p.id === ni.procedureId);
      const qty = parseInt(ni.quantity) || 1;
      const disc = parseFloat(ni.discount) || 0;
      return {
        id: `new_i_${idx}`,
        procedureName: proc?.name ?? "Procedimento",
        category: proc?.category ?? "OUTROS",
        tooth: ni.tooth || undefined,
        unitPrice: proc?.price ?? 0,
        quantity: qty,
        discount: disc,
      };
    });

    const totalAmount = items.reduce((sum, it) => {
      const subtotal = it.unitPrice * it.quantity;
      return sum + subtotal - subtotal * (it.discount / 100);
    }, 0);

    const inst = parseInt(newInstallments) || 1;
    const newPlan: TreatmentPlan = {
      id: `tp_${Date.now()}`,
      patientName: newPatient.trim(),
      patientPhone: "",
      dentistName: "Dr. Lucas Mendes",
      status: "DRAFT",
      items,
      totalAmount: Math.round(totalAmount * 100) / 100,
      installments: inst,
      installmentValue: Math.round((totalAmount / inst) * 100) / 100,
      notes: newNotes || undefined,
      createdAt: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    };

    setPlans((prev) => [newPlan, ...prev]);
    addToast({ title: "Plano criado", description: `${formatCurrency(totalAmount)} em ${inst}x`, variant: "success" });
    setShowNewPlan(false);
    setNewPatient("");
    setNewInstallments("1");
    setNewNotes("");
    setNewItems([{ procedureId: "", tooth: "", quantity: "1", discount: "0" }]);
  };

  const addNewItem = () => {
    setNewItems((prev) => [...prev, { procedureId: "", tooth: "", quantity: "1", discount: "0" }]);
  };

  const updateNewItem = (idx: number, field: string, value: string) => {
    setNewItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const removeNewItem = (idx: number) => {
    setNewItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const calcNewTotal = () => {
    return newItems.reduce((sum, ni) => {
      const proc = activeProcedures.find((p) => p.id === ni.procedureId);
      if (!proc) return sum;
      const qty = parseInt(ni.quantity) || 1;
      const disc = parseFloat(ni.discount) || 0;
      const subtotal = proc.price * qty;
      return sum + subtotal - subtotal * (disc / 100);
    }, 0);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Planos de Tratamento</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Orçamentos, aprovações e parcelamento</p>
          </div>
          <Button className="gap-1.5" onClick={() => setShowNewPlan(true)}>
            <Plus className="h-4 w-4" />
            Novo Plano
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total de Planos", value: stats.total.toString(), icon: ClipboardCheck, color: "text-blue-600" },
            { label: "Aprovados/Em Andamento", value: stats.approved.toString(), icon: CheckCircle2, color: "text-green-600" },
            { label: "Pendentes", value: stats.pending.toString(), icon: Clock, color: "text-amber-600" },
            { label: "Valor Aprovado", value: formatCurrency(stats.totalValue), icon: DollarSign, color: "text-emerald-600" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xl font-bold text-neutral-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-neutral-50 ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Buscar paciente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select onValueChange={setStatusFilter} value={statusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Plans List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ClipboardCheck className="h-10 w-10 text-neutral-200 mx-auto mb-3" />
                <p className="text-sm text-neutral-400">Nenhum plano encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((plan) => {
              const isExpanded = expandedId === plan.id;
              const StatusIcon = statusConfig[plan.status].icon;
              return (
                <Card key={plan.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Plan header row */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-neutral-900">{plan.patientName}</span>
                          <Badge className={`text-[10px] ${statusConfig[plan.status].color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[plan.status].label}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {plan.items.length} procedimento{plan.items.length !== 1 ? "s" : ""} · Criado em {formatDate(plan.createdAt)}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-neutral-900">{formatCurrency(plan.totalAmount)}</p>
                        <p className="text-[11px] text-neutral-400">{plan.installments}x de {formatCurrency(plan.installmentValue)}</p>
                      </div>

                      <div className="relative shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === plan.id ? null : plan.id); }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {menuOpenId === plan.id && (
                          <div className="absolute right-0 top-8 bg-white rounded-lg border shadow-lg py-1 z-20 w-44">
                            <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50" onClick={() => { setSelectedPlan(plan); setMenuOpenId(null); }}>
                              <Eye className="h-3.5 w-3.5" /> Ver detalhes
                            </button>
                            {plan.status === "DRAFT" && (
                              <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50" onClick={() => handleStatusChange(plan.id, "SENT")}>
                                <Send className="h-3.5 w-3.5" /> Enviar ao paciente
                              </button>
                            )}
                            {plan.status === "SENT" && (
                              <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-green-600 hover:bg-green-50" onClick={() => handleStatusChange(plan.id, "APPROVED")}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Marcar aprovado
                              </button>
                            )}
                            {plan.status === "APPROVED" && (
                              <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50" onClick={() => handleStatusChange(plan.id, "IN_PROGRESS")}>
                                <Clock className="h-3.5 w-3.5" /> Iniciar tratamento
                              </button>
                            )}
                            {plan.status === "IN_PROGRESS" && (
                              <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50" onClick={() => handleStatusChange(plan.id, "COMPLETED")}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                              </button>
                            )}
                            <Separator className="my-1" />
                            <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-500 hover:bg-red-50" onClick={() => handleDeletePlan(plan.id)}>
                              <Trash2 className="h-3.5 w-3.5" /> Excluir plano
                            </button>
                          </div>
                        )}
                      </div>

                      {isExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />}
                    </div>

                    {/* Expanded items */}
                    {isExpanded && (
                      <div className="border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 space-y-2">
                        <div className="grid grid-cols-[1fr,80px,60px,60px,100px] gap-2 text-[10px] font-medium text-neutral-400 uppercase tracking-wider px-2">
                          <span>Procedimento</span>
                          <span>Dente</span>
                          <span>Qtd</span>
                          <span>Desc.</span>
                          <span className="text-right">Subtotal</span>
                        </div>
                        {plan.items.map((item) => {
                          const subtotal = item.unitPrice * item.quantity;
                          const discountedTotal = subtotal - subtotal * (item.discount / 100);
                          return (
                            <div key={item.id} className="grid grid-cols-[1fr,80px,60px,60px,100px] gap-2 items-center bg-white rounded-md px-2 py-1.5 border border-neutral-100">
                              <div>
                                <span className="text-xs font-medium text-neutral-900">{item.procedureName}</span>
                                <span className="text-[10px] text-neutral-400 ml-1.5">{formatCurrency(item.unitPrice)}/un</span>
                              </div>
                              <span className="text-xs text-neutral-500">{item.tooth || "—"}</span>
                              <span className="text-xs text-neutral-500">{item.quantity}</span>
                              <span className="text-xs text-neutral-500">{item.discount > 0 ? `${item.discount}%` : "—"}</span>
                              <span className="text-xs font-semibold text-neutral-900 text-right">{formatCurrency(discountedTotal)}</span>
                            </div>
                          );
                        })}
                        <Separator />
                        <div className="flex items-center justify-between px-2">
                          <span className="text-xs text-neutral-500">
                            Válido até {formatDate(plan.validUntil)}
                            {plan.notes && ` · ${plan.notes}`}
                          </span>
                          <span className="text-sm font-bold text-neutral-900">
                            Total: {formatCurrency(plan.totalAmount)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Detail Modal */}
        <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Plano</DialogTitle>
              <DialogDescription>
                {selectedPlan?.patientName} — {selectedPlan && statusConfig[selectedPlan.status].label}
              </DialogDescription>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-neutral-400 mb-0.5">Paciente</p>
                    <p className="text-sm font-medium text-neutral-900">{selectedPlan.patientName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-neutral-400 mb-0.5">Dentista</p>
                    <p className="text-sm font-medium text-neutral-900">{selectedPlan.dentistName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-neutral-400 mb-0.5">Criado em</p>
                    <p className="text-sm text-neutral-700">{formatDate(selectedPlan.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-neutral-400 mb-0.5">Válido até</p>
                    <p className="text-sm text-neutral-700">{formatDate(selectedPlan.validUntil)}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Procedimentos</p>
                  {selectedPlan.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-center text-sm">
                      <span className="text-neutral-700">{it.procedureName} {it.tooth ? `(${it.tooth})` : ""} × {it.quantity}</span>
                      <span className="font-medium text-neutral-900">{formatCurrency(it.unitPrice * it.quantity * (1 - it.discount / 100))}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-neutral-500">{selectedPlan.installments}x de</p>
                    <p className="text-lg font-bold text-neutral-900">{formatCurrency(selectedPlan.installmentValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-500">Total</p>
                    <p className="text-lg font-bold text-neutral-900">{formatCurrency(selectedPlan.totalAmount)}</p>
                  </div>
                </div>
                {selectedPlan.notes && (
                  <p className="text-xs text-neutral-400 bg-neutral-50 rounded p-2">{selectedPlan.notes}</p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPlan(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Plan Modal */}
        <Dialog open={showNewPlan} onOpenChange={setShowNewPlan}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Plano de Tratamento</DialogTitle>
              <DialogDescription>
                Selecione os procedimentos e configure o parcelamento.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Paciente *</label>
                <Input value={newPatient} onChange={(e) => setNewPatient(e.target.value)} placeholder="Nome do paciente" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Procedimentos</p>
                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={addNewItem}>
                    <Plus className="h-3 w-3" /> Adicionar
                  </Button>
                </div>
                {newItems.map((ni, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr,70px,60px,60px,32px] gap-2 items-end">
                    <div>
                      {idx === 0 && <label className="text-[10px] text-neutral-400 mb-0.5 block">Procedimento</label>}
                      <Select onValueChange={(v) => updateNewItem(idx, "procedureId", v)} value={ni.procedureId}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeProcedures.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      {idx === 0 && <label className="text-[10px] text-neutral-400 mb-0.5 block">Dente</label>}
                      <Input className="h-9 text-xs" value={ni.tooth} onChange={(e) => updateNewItem(idx, "tooth", e.target.value)} placeholder="Ex: 16" />
                    </div>
                    <div>
                      {idx === 0 && <label className="text-[10px] text-neutral-400 mb-0.5 block">Qtd</label>}
                      <Input className="h-9 text-xs" type="number" min="1" value={ni.quantity} onChange={(e) => updateNewItem(idx, "quantity", e.target.value)} />
                    </div>
                    <div>
                      {idx === 0 && <label className="text-[10px] text-neutral-400 mb-0.5 block">Desc %</label>}
                      <Input className="h-9 text-xs" type="number" min="0" max="100" value={ni.discount} onChange={(e) => updateNewItem(idx, "discount", e.target.value)} />
                    </div>
                    <Button variant="ghost" size="icon-sm" className="text-neutral-400" onClick={() => removeNewItem(idx)} disabled={newItems.length === 1}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">Parcelas</label>
                  <Select onValueChange={setNewInstallments} value={newInstallments}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}x {n === 1 ? "à vista" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col justify-end">
                  <p className="text-[11px] text-neutral-400">Total estimado</p>
                  <p className="text-lg font-bold text-neutral-900">{formatCurrency(calcNewTotal())}</p>
                  {parseInt(newInstallments) > 1 && (
                    <p className="text-[10px] text-neutral-400">{newInstallments}x de {formatCurrency(calcNewTotal() / (parseInt(newInstallments) || 1))}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Observações</label>
                <Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Notas adicionais para o plano..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPlan(false)}>Cancelar</Button>
              <Button onClick={handleCreatePlan}>
                <ClipboardCheck className="h-4 w-4 mr-1.5" />
                Criar Plano
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
