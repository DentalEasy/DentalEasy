"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from "@/components/ui";
import { PageTransition } from "@/lib/animations";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  ApiError,
  createTreatmentPlan,
  deleteTreatmentPlan,
  listPatients,
  listTreatmentPlans,
  updateTreatmentPlan,
  updateTreatmentPlanStatus,
} from "@/lib/api";
import { useProcedures } from "@/contexts/procedures-context";
import type { TreatmentPlan, TreatmentPlanStatus } from "@/types";

const statusLabel: Record<TreatmentPlanStatus, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviado",
  APPROVED: "Aprovado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  REJECTED: "Recusado",
};

const statusVariant: Record<
  TreatmentPlanStatus,
  "secondary" | "outline" | "success" | "warning" | "danger"
> = {
  DRAFT: "secondary",
  SENT: "outline",
  APPROVED: "success",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELED: "danger",
  REJECTED: "danger",
};

interface NewItemForm {
  procedureId: string;
  quantity: string;
  notes: string;
}

export default function TreatmentPlansPage() {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newPatientId, setNewPatientId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newInstallments, setNewInstallments] = useState("1");
  const [newDiscount, setNewDiscount] = useState("0");
  const [newNotes, setNewNotes] = useState("");
  const [newItems, setNewItems] = useState<NewItemForm[]>([
    { procedureId: "", quantity: "1", notes: "" },
  ]);
  const { activeProcedures } = useProcedures();
  const { addToast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [plansData, patientsData] = await Promise.all([
        listTreatmentPlans(),
        listPatients(),
      ]);
      setPlans(plansData);
      setPatients(patientsData.map((patient) => ({ id: patient.id, name: patient.name })));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel carregar planos.";
      addToast({ title: "Erro ao carregar", description: message, variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredPlans = useMemo(
    () =>
      plans.filter((plan) => {
        const matchesSearch =
          plan.patient.name.toLowerCase().includes(search.toLowerCase()) ||
          plan.title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [plans, search, statusFilter]
  );

  const totalAmount = useMemo(() => {
    return plans
      .filter((plan) => ["APPROVED", "IN_PROGRESS", "COMPLETED"].includes(plan.status))
      .reduce((sum, plan) => sum + plan.totalAmount, 0);
  }, [plans]);

  const resetNewPlanForm = () => {
    setEditingPlanId(null);
    setNewPatientId("");
    setNewTitle("");
    setNewInstallments("1");
    setNewDiscount("0");
    setNewNotes("");
    setNewItems([{ procedureId: "", quantity: "1", notes: "" }]);
  };

  const openEditPlan = (plan: TreatmentPlan) => {
    setEditingPlanId(plan.id);
    setNewPatientId(plan.patientId);
    setNewTitle(plan.title);
    setNewInstallments(String(plan.installments ?? 1));
    setNewDiscount(String(plan.discount ?? 0));
    setNewNotes(plan.notes ?? "");
    setNewItems(
      plan.items.map((item) => ({
        procedureId: item.procedureId ?? "",
        quantity: String(item.quantity),
        notes: item.notes ?? "",
      }))
    );
    setShowNewPlan(true);
  };

  const addItem = () =>
    setNewItems((current) => [
      ...current,
      { procedureId: "", quantity: "1", notes: "" },
    ]);

  const removeItem = (index: number) =>
    setNewItems((current) => current.filter((_, idx) => idx !== index));

  const updateItem = (index: number, key: keyof NewItemForm, value: string) =>
    setNewItems((current) =>
      current.map((item, idx) => (idx === index ? { ...item, [key]: value } : item))
    );

  const estimatedTotal = useMemo(() => {
    const subtotal = newItems.reduce((sum, item) => {
      const procedure = activeProcedures.find((entry) => entry.id === item.procedureId);
      if (!procedure) return sum;
      const quantity = Number(item.quantity) || 1;
      return sum + procedure.price * quantity;
    }, 0);
    const discount = Number(newDiscount) || 0;
    return Math.max(subtotal - discount, 0);
  }, [activeProcedures, newDiscount, newItems]);

  const handleSavePlan = async () => {
    const validItems = newItems.filter((item) => item.procedureId);
    if (!newPatientId || validItems.length === 0) {
      addToast({
        title: "Dados incompletos",
        description: "Selecione paciente e ao menos um procedimento.",
        variant: "warning",
      });
      return;
    }

    try {
      setCreating(true);
      const payload = {
        patientId: newPatientId,
        title: newTitle || "Plano de tratamento",
        discount: Number(newDiscount) || 0,
        installments: Number(newInstallments) || 1,
        notes: newNotes || undefined,
        items: validItems.map((item) => {
          const procedure = activeProcedures.find(
            (entry) => entry.id === item.procedureId
          );
          return {
            procedureId: item.procedureId,
            procedureName: procedure?.name,
            category: procedure?.category,
            quantity: Number(item.quantity) || 1,
            unitPrice: procedure?.price ?? 0,
            notes: item.notes || undefined,
          };
        }),
      };
      const savedPlan = editingPlanId
        ? await updateTreatmentPlan(editingPlanId, payload)
        : await createTreatmentPlan(payload);
      setPlans((current) =>
        editingPlanId
          ? current.map((plan) => (plan.id === savedPlan.id ? savedPlan : plan))
          : [savedPlan, ...current]
      );
      addToast({
        title: editingPlanId ? "Plano atualizado" : "Plano criado",
        description: editingPlanId
          ? "Plano de tratamento atualizado com sucesso."
          : "Plano de tratamento cadastrado com sucesso.",
        variant: "success",
      });
      setShowNewPlan(false);
      resetNewPlanForm();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : editingPlanId
            ? "Nao foi possivel atualizar plano."
            : "Nao foi possivel criar plano.";
      addToast({ title: "Erro", description: message, variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (
    treatmentPlanId: string,
    status: TreatmentPlanStatus
  ) => {
    try {
      const updated = await updateTreatmentPlanStatus(treatmentPlanId, status);
      setPlans((current) =>
        current.map((plan) => (plan.id === updated.id ? updated : plan))
      );
      addToast({
        title: "Status atualizado",
        description: statusLabel[status],
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel atualizar status.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  const handleDelete = async (treatmentPlanId: string) => {
    try {
      await deleteTreatmentPlan(treatmentPlanId);
      setPlans((current) => current.filter((plan) => plan.id !== treatmentPlanId));
      addToast({
        title: "Plano removido",
        description: "Plano de tratamento excluido com sucesso.",
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel remover plano.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Planos de Tratamento</h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              Gestao de planos e aprovacoes de procedimentos
            </p>
          </div>
          <Button
            onClick={() => {
              resetNewPlanForm();
              setShowNewPlan(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Plano
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] text-neutral-400 uppercase">Total</p>
              <p className="text-xl font-bold text-neutral-900 mt-1">{plans.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] text-neutral-400 uppercase">Aprovados</p>
              <p className="text-xl font-bold text-neutral-900 mt-1">
                {plans.filter((plan) => plan.status === "APPROVED").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] text-neutral-400 uppercase">Em Andamento</p>
              <p className="text-xl font-bold text-neutral-900 mt-1">
                {plans.filter((plan) => plan.status === "IN_PROGRESS").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] text-neutral-400 uppercase">Valor Ativo</p>
              <p className="text-xl font-bold text-neutral-900 mt-1">
                {formatCurrency(totalAmount)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por paciente ou titulo..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusLabel).map(([status, label]) => (
                  <SelectItem key={status} value={status}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-sm text-neutral-400">Carregando...</CardContent>
            </Card>
          ) : filteredPlans.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ClipboardCheck className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">Nenhum plano encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            filteredPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">{plan.patient.name}</CardTitle>
                      <p className="text-xs text-neutral-500 mt-0.5">{plan.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[plan.status]}>
                        {statusLabel[plan.status]}
                      </Badge>
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(plan.totalAmount)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-neutral-500">
                    <span>Itens: {plan.items.length}</span>
                    <span>Criado em: {formatDate(plan.createdAt)}</span>
                    <span>
                      Parcelas: {plan.installments ?? 1}
                    </span>
                    <span>
                      Desconto: {formatCurrency(plan.discount ?? 0)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {plan.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-2 text-sm"
                      >
                        <span className="text-neutral-700">
                          {item.procedureName} • {item.quantity}x
                        </span>
                        <span className="font-medium text-neutral-900">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Select
                      value={plan.status}
                      onValueChange={(value) =>
                        void handleStatusChange(plan.id, value as TreatmentPlanStatus)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[220px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabel).map(([status, label]) => (
                          <SelectItem key={status} value={status}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => openEditPlan(plan)}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => void handleDelete(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                    {plan.status === "APPROVED" && (
                      <Button
                        className="gap-2"
                        onClick={() => void handleStatusChange(plan.id, "IN_PROGRESS")}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Iniciar Tratamento
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog
        open={showNewPlan}
        onOpenChange={(open) => {
          if (!open) {
            resetNewPlanForm();
          }
          setShowNewPlan(open);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlanId ? "Editar Plano de Tratamento" : "Novo Plano de Tratamento"}
            </DialogTitle>
            <DialogDescription>
              Vincule paciente, procedimentos e condições de pagamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-neutral-500 mb-1">Paciente *</p>
                <Select value={newPatientId} onValueChange={setNewPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 mb-1">Título</p>
                <Input
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="Plano ortodôntico"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 mb-1">Parcelas</p>
                <Input
                  type="number"
                  min={1}
                  value={newInstallments}
                  onChange={(event) => setNewInstallments(event.target.value)}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 mb-1">Desconto (R$)</p>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newDiscount}
                  onChange={(event) => setNewDiscount(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-neutral-500 uppercase">Itens</p>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              {newItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <Select
                      value={item.procedureId}
                      onValueChange={(value) => updateItem(index, "procedureId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Procedimento" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeProcedures.map((procedure) => (
                          <SelectItem key={procedure.id} value={procedure.id}>
                            {procedure.name} - {formatCurrency(procedure.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) => updateItem(index, "quantity", event.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      value={item.notes}
                      onChange={(event) => updateItem(index, "notes", event.target.value)}
                      placeholder="Obs."
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => removeItem(index)}
                      disabled={newItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-medium text-neutral-500 mb-1">Observações</p>
              <Textarea
                value={newNotes}
                onChange={(event) => setNewNotes(event.target.value)}
                rows={3}
              />
            </div>

            <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3">
              <p className="text-xs text-neutral-500">Total estimado</p>
              <p className="text-lg font-bold text-neutral-900">
                {formatCurrency(estimatedTotal)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPlan(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSavePlan()} disabled={creating}>
              {creating ? "Salvando..." : editingPlanId ? "Salvar Alteracoes" : "Criar Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
