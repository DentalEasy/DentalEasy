"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  DollarSign,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  FileText,
  Percent,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Clock,
  AlertTriangle,
  User,
  ArrowLeft,
  Copy,
  Printer,
  Hash,
  CalendarDays,
  Trash2,
  Plus,
  Minus,
  SplitSquareHorizontal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Separator,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { formatCurrency, formatDate, formatCPF } from "@/lib/utils";
import { PageTransition } from "@/lib/animations";
import { useToast } from "@/components/ui/toast";
import { useClinic } from "@/contexts/clinic-context";
import type { Patient } from "@/types";
import {
  ApiError,
  createPayment,
  listFinancialRecords,
  listPatients,
} from "@/lib/api";

// ─── Types ───
interface PendingCharge {
  id: string;
  description: string;
  procedureDate: string;
  dueDate: string;
  amount: number;
  status: "PENDING" | "OVERDUE" | "PARTIAL";
  paidAmount: number;
}

type PaymentMethodType = "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH" | "BOLETO";

interface PaymentSplit {
  id: string;
  method: PaymentMethodType;
  amount: number;
  installments: number;
}

type PatientWithCharges = Patient & { pendingCharges: PendingCharge[] };

// ─── Config de metodos ───
const PAYMENT_METHODS: { value: PaymentMethodType; label: string; icon: typeof CreditCard; color: string }[] = [
  { value: "PIX", label: "PIX", icon: QrCode, color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" },
  { value: "CREDIT_CARD", label: "Crédito", icon: CreditCard, color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { value: "DEBIT_CARD", label: "Débito", icon: CreditCard, color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
  { value: "CASH", label: "Dinheiro", icon: Banknote, color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
  { value: "BOLETO", label: "Boleto", icon: FileText, color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
];

const METHOD_LABELS: Record<PaymentMethodType, string> = {
  PIX: "PIX", CREDIT_CARD: "Cartão de Crédito", DEBIT_CARD: "Cartão de Débito", CASH: "Dinheiro", BOLETO: "Boleto",
};

export default function PaymentsPage() {
  // ─── State ───
  const [patients, setPatients] = useState<PatientWithCharges[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientWithCharges | null>(null);
  const [selectedCharges, setSelectedCharges] = useState<Set<string>>(new Set());
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([
    { id: "s1", method: "PIX", amount: 0, installments: 1 },
  ]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedPaymentId, setCompletedPaymentId] = useState<string | null>(null);
  const [observations, setObservations] = useState("");

  const { addToast } = useToast();
  const { organization } = useClinic();

  const loadData = async () => {
    try {
      setIsLoadingData(true);
      const [patientsData, financialRecordsData] = await Promise.all([
        listPatients(),
        listFinancialRecords({ type: "INCOME" }),
      ]);

      const pendingByPatient = new Map<string, PendingCharge[]>();
      for (const record of financialRecordsData) {
        if (!record.patientId || record.paymentStatus === "CANCELLED") continue;
        const remainingAmount = Math.max(record.remainingAmount ?? record.amount, 0);
        if (remainingAmount <= 0.009) continue;

        const charge: PendingCharge = {
          id: record.id,
          description: record.description,
          procedureDate: record.createdAt,
          dueDate: record.dueDate,
          amount: record.amount,
          status:
            record.paymentStatus === "OVERDUE"
              ? "OVERDUE"
              : (record.paidAmount ?? 0) > 0
              ? "PARTIAL"
              : "PENDING",
          paidAmount: record.paidAmount ?? 0,
        };

        const current = pendingByPatient.get(record.patientId) ?? [];
        current.push(charge);
        pendingByPatient.set(record.patientId, current);
      }

      const nextPatients: PatientWithCharges[] = patientsData
        .map((patient) => ({
          ...patient,
          pendingCharges: (pendingByPatient.get(patient.id) ?? []).sort((a, b) =>
            a.dueDate.localeCompare(b.dueDate)
          ),
        }))
        .filter((patient) => patient.pendingCharges.length > 0);

      setPatients(nextPatients);
      setSelectedPatient((current) =>
        current ? nextPatients.find((patient) => patient.id === current.id) ?? null : null
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Nao foi possivel carregar pendencias financeiras.";
      addToast({ title: "Erro ao carregar", description: message, variant: "error" });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // ─── Derived ───
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.cpf.includes(q.replace(/\D/g, "")) ||
        p.phone.includes(q.replace(/\D/g, ""))
    );
  }, [searchQuery, patients]);

  const subtotal = useMemo(() => {
    if (!selectedPatient) return 0;
    return selectedPatient.pendingCharges
      .filter((c) => selectedCharges.has(c.id))
      .reduce((sum, c) => sum + (c.amount - c.paidAmount), 0);
  }, [selectedPatient, selectedCharges]);

  const discountAmount = useMemo(() => {
    if (!discountValue || Number(discountValue) <= 0) return 0;
    const v = Number(discountValue);
    return discountType === "percent" ? (subtotal * Math.min(v, 100)) / 100 : Math.min(v, subtotal);
  }, [subtotal, discountValue, discountType]);

  const total = Math.max(subtotal - discountAmount, 0);

  const totalSplitAmount = paymentSplits.reduce((sum, s) => sum + s.amount, 0);
  const splitRemaining = total - totalSplitAmount;
  const isSplitValid = Math.abs(splitRemaining) < 0.01 && total > 0;

  // ─── Handlers ───
  const handleSelectPatient = (patient: PatientWithCharges) => {
    setSelectedPatient(patient);
    setSearchQuery("");
    setSelectedCharges(new Set());
    setDiscountValue("");
    setPaymentSplits([{ id: "s1", method: "PIX", amount: 0, installments: 1 }]);
    setObservations("");
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setSelectedCharges(new Set());
    setDiscountValue("");
    setPaymentSplits([{ id: "s1", method: "PIX", amount: 0, installments: 1 }]);
    setObservations("");
  };

  const toggleCharge = (chargeId: string) => {
    setSelectedCharges((prev) => {
      const next = new Set(prev);
      if (next.has(chargeId)) next.delete(chargeId);
      else next.add(chargeId);
      return next;
    });
  };

  const selectAllCharges = () => {
    if (!selectedPatient) return;
    if (selectedCharges.size === selectedPatient.pendingCharges.length) {
      setSelectedCharges(new Set());
    } else {
      setSelectedCharges(new Set(selectedPatient.pendingCharges.map((c) => c.id)));
    }
  };

  const addSplit = () => {
    setPaymentSplits((prev) => [
      ...prev,
      { id: `s${Date.now()}`, method: "PIX", amount: 0, installments: 1 },
    ]);
  };

  const removeSplit = (id: string) => {
    if (paymentSplits.length <= 1) return;
    setPaymentSplits((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSplit = (id: string, changes: Partial<PaymentSplit>) => {
    setPaymentSplits((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...changes } : s))
    );
  };

  const autoDistribute = () => {
    if (paymentSplits.length === 0) return;
    const each = Math.floor((total / paymentSplits.length) * 100) / 100;
    const remainder = total - each * paymentSplits.length;
    setPaymentSplits((prev) =>
      prev.map((s, i) => ({
        ...s,
        amount: i === 0 ? +(each + remainder).toFixed(2) : each,
      }))
    );
  };

  const handleConfirmPayment = async () => {
    if (!selectedPatient || !isSplitValid || selectedCharges.size === 0) return;

    const selectedChargeItems = selectedPatient.pendingCharges.filter((charge) =>
      selectedCharges.has(charge.id)
    );
    if (!selectedChargeItems.length) return;

    const activeSplits = paymentSplits
      .filter((split) => split.amount > 0)
      .map((split) => ({ ...split, remaining: Number(split.amount.toFixed(2)) }));

    if (!activeSplits.length) {
      addToast({
        title: "Forma de pagamento invalida",
        description: "Informe ao menos uma forma de pagamento.",
        variant: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      let remainingDiscount = Number(discountAmount.toFixed(2));
      const targetAmounts = selectedChargeItems.map((charge, index) => {
        const outstanding = Number((charge.amount - charge.paidAmount).toFixed(2));
        let proportionalDiscount = 0;

        if (remainingDiscount > 0 && subtotal > 0) {
          proportionalDiscount =
            index === selectedChargeItems.length - 1
              ? remainingDiscount
              : Number(((discountAmount * outstanding) / subtotal).toFixed(2));
          proportionalDiscount = Math.min(proportionalDiscount, remainingDiscount, outstanding);
          remainingDiscount = Number((remainingDiscount - proportionalDiscount).toFixed(2));
        }

        return {
          charge,
          target: Number(Math.max(outstanding - proportionalDiscount, 0).toFixed(2)),
        };
      });

      const createdIds: string[] = [];
      for (const target of targetAmounts) {
        let chargeRemaining = target.target;
        for (const split of activeSplits) {
          if (chargeRemaining <= 0.009) break;
          if (split.remaining <= 0.009) continue;

          const allocatedAmount = Number(
            Math.min(split.remaining, chargeRemaining).toFixed(2)
          );
          if (allocatedAmount <= 0.009) continue;

          const installmentEnabled =
            split.method === "CREDIT_CARD" && split.installments > 1;

          const created = await createPayment({
            financialRecordId: target.charge.id,
            amount: allocatedAmount,
            method: split.method,
            status: "SETTLED",
            paidAt: new Date().toISOString(),
            receivedFrom: selectedPatient.name,
            notes: observations || undefined,
            installmentNumber: installmentEnabled ? 1 : undefined,
            totalInstallments: installmentEnabled ? split.installments : undefined,
          });

          createdIds.push(created.receiptNumber ?? created.id);
          split.remaining = Number((split.remaining - allocatedAmount).toFixed(2));
          chargeRemaining = Number((chargeRemaining - allocatedAmount).toFixed(2));
        }

        if (chargeRemaining > 0.009) {
          throw new Error("Nao foi possivel distribuir o valor para todos os lancamentos.");
        }
      }

      const paymentId = createdIds[0] ?? `PAY-${Date.now().toString(36).toUpperCase()}`;
      setCompletedPaymentId(paymentId);
      setShowConfirmation(false);
      setShowReceipt(true);
      addToast({
        title: "Pagamento registrado!",
        description: `${formatCurrency(total)} recebido de ${selectedPatient.name}`,
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Nao foi possivel registrar o recebimento.";
      addToast({ title: "Erro no recebimento", description: message, variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!selectedPatient) return;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const clinicName = organization?.name ?? "Clínica Odontológica";
    const clinicPhone = organization?.phone ?? "(17) 3000-0000";
    const clinicAddress = organization?.address
      ? `${organization.address} - ${organization.city}/${organization.state}`
      : "Jales/SP";
    const clinicCnpj = organization?.cnpj ?? "00.000.000/0001-00";
    const today = new Date().toLocaleDateString("pt-BR");

    const chargesList = selectedPatient.pendingCharges
      .filter((c) => selectedCharges.has(c.id))
      .map(
        (c) =>
          `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${c.description}</td><td style="padding:6px 8px;text-align:right;border-bottom:1px solid #eee">R$ ${(c.amount - c.paidAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>`
      )
      .join("");

    const paymentsList = paymentSplits
      .filter((s) => s.amount > 0)
      .map(
        (s) =>
          `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${METHOD_LABELS[s.method]}${s.installments > 1 ? ` (${s.installments}x)` : ""}</td><td style="padding:6px 8px;text-align:right;border-bottom:1px solid #eee">R$ ${s.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>`
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Recibo - ${selectedPatient.name}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1a1a1a;max-width:700px;margin:0 auto}
        .header{text-align:center;border-bottom:2px solid #0052CC;padding-bottom:16px;margin-bottom:24px}
        .header h1{font-size:20px;color:#0052CC;margin-bottom:4px}
        .header p{font-size:12px;color:#666}
        .title{text-align:center;font-size:18px;font-weight:700;letter-spacing:2px;margin-bottom:8px;color:#333}
        .pay-id{text-align:center;font-size:11px;color:#888;margin-bottom:24px}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
        .info-item label{display:block;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
        .info-item p{font-size:14px;font-weight:500}
        table{width:100%;border-collapse:collapse;margin-bottom:16px}
        th{text-align:left;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.5px;padding:8px;border-bottom:2px solid #eee}
        th:last-child{text-align:right}
        .totals{border-top:2px solid #0052CC;padding-top:12px;margin-top:4px}
        .totals .row{display:flex;justify-content:space-between;padding:4px 8px;font-size:14px}
        .totals .row.total{font-weight:700;font-size:18px;color:#0052CC;margin-top:4px}
        .signature{margin-top:60px;display:flex;justify-content:space-between}
        .signature .sig-line{width:45%;text-align:center}
        .signature .sig-line hr{border:none;border-top:1px solid #333;margin-bottom:6px}
        .signature .sig-line p{font-size:11px;color:#666}
        .footer{margin-top:40px;text-align:center;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:12px}
        @media print{body{padding:20px}}
      </style></head><body>
        <div class="header">
          <h1>${clinicName}</h1>
          <p>${clinicAddress} · ${clinicPhone}</p>
          <p>CNPJ: ${clinicCnpj}</p>
        </div>
        <div class="title">RECIBO DE PAGAMENTO</div>
        <div class="pay-id">${completedPaymentId}</div>
        <div class="info-grid">
          <div class="info-item"><label>Paciente</label><p>${selectedPatient.name}</p></div>
          <div class="info-item"><label>CPF</label><p>${selectedPatient.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</p></div>
          <div class="info-item"><label>Data</label><p>${today}</p></div>
          <div class="info-item"><label>Protocolo</label><p>${completedPaymentId}</p></div>
        </div>
        <h3 style="font-size:12px;color:#666;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Procedimentos</h3>
        <table><thead><tr><th>Descrição</th><th>Valor</th></tr></thead><tbody>${chargesList}</tbody></table>
        <h3 style="font-size:12px;color:#666;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Formas de Pagamento</h3>
        <table><thead><tr><th>Método</th><th>Valor</th></tr></thead><tbody>${paymentsList}</tbody></table>
        <div class="totals">
          <div class="row"><span>Subtotal</span><span>R$ ${subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
          ${discountAmount > 0 ? `<div class="row" style="color:#16a34a"><span>Desconto</span><span>- R$ ${discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>` : ""}
          <div class="row total"><span>Total Pago</span><span>R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
        </div>
        ${observations ? `<div style="margin-top:20px;padding:12px;background:#f9fafb;border-radius:6px;font-size:12px;color:#666"><strong>Observações:</strong> ${observations}</div>` : ""}
        <div class="signature">
          <div class="sig-line"><hr /><p>${clinicName}</p></div>
          <div class="sig-line"><hr /><p>${selectedPatient.name}</p></div>
        </div>
        <div class="footer">Documento gerado em ${today} · ${clinicName}</div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
    addToast({ title: "Recibo gerado", description: "Pronto para impressão", variant: "success" });
  };

  const handleNewPayment = () => {
    setShowReceipt(false);
    setShowConfirmation(false);
    setCompletedPaymentId(null);
    handleClearPatient();
    void loadData();
  };

  // ─── Render ───
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary-500" />
              Receber Pagamento
            </h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              Registre o recebimento de pagamentos dos pacientes
            </p>
          </div>
        </div>

        {/* ═══ STEP 1: Select Patient ═══ */}
        {!selectedPatient && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-neutral-400" />
                Selecionar Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Buscar por nome, CPF ou telefone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Results */}
              {searchQuery.trim() && (
                <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100 max-h-[400px] overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum paciente encontrado</p>
                    </div>
                  ) : (
                    searchResults.map((patient) => {
                      const totalPending = patient.pendingCharges.reduce(
                        (sum, c) => sum + (c.amount - c.paidAmount),
                        0
                      );
                      const hasOverdue = patient.pendingCharges.some((c) => c.status === "OVERDUE");

                      return (
                        <button
                          key={patient.id}
                          onClick={() => handleSelectPatient(patient)}
                          className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary-600">
                                {patient.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{patient.name}</p>
                              <p className="text-xs text-neutral-400">
                                CPF: {formatCPF(patient.cpf)} · {patient.pendingCharges.length} pendência{patient.pendingCharges.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-neutral-900">{formatCurrency(totalPending)}</p>
                              {hasOverdue && (
                                <Badge variant="overdue" className="text-[10px]">Atrasado</Badge>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-300" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Quick Access - Patients with overdue */}
              {!searchQuery.trim() && (
                <div>
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
                    Pacientes com pendências
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {isLoadingData && (
                      <div className="col-span-full text-sm text-neutral-400">
                        Carregando pendencias...
                      </div>
                    )}
                    {patients
                      .filter((p) => p.pendingCharges.length > 0)
                      .sort((a, b) => {
                        const aOverdue = a.pendingCharges.some((c) => c.status === "OVERDUE");
                        const bOverdue = b.pendingCharges.some((c) => c.status === "OVERDUE");
                        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
                        return 0;
                      })
                      .map((patient) => {
                        const totalPending = patient.pendingCharges.reduce(
                          (sum, c) => sum + (c.amount - c.paidAmount),
                          0
                        );
                        const hasOverdue = patient.pendingCharges.some((c) => c.status === "OVERDUE");

                        return (
                          <button
                            key={patient.id}
                            onClick={() => handleSelectPatient(patient)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer text-left ${
                              hasOverdue
                                ? "border-red-200 bg-red-50/50 hover:bg-red-50"
                                : "border-neutral-200 bg-white hover:bg-neutral-50"
                            }`}
                          >
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                              hasOverdue ? "bg-red-100" : "bg-primary-50"
                            }`}>
                              <span className={`text-xs font-semibold ${hasOverdue ? "text-red-600" : "text-primary-600"}`}>
                                {patient.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900 truncate">{patient.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-neutral-700">{formatCurrency(totalPending)}</span>
                                {hasOverdue && (
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    {!isLoadingData && patients.length === 0 && (
                      <div className="col-span-full text-sm text-neutral-400">
                        Nenhuma pendencia financeira encontrada.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ═══ STEP 2: Checkout ═══ */}
        {selectedPatient && !showReceipt && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Charges + Payment Method */}
            <div className="lg:col-span-2 space-y-6">
              {/* Patient Header */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleClearPatient}
                        className="h-8 w-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4 text-neutral-500" />
                      </button>
                      <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-600">
                          {selectedPatient.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{selectedPatient.name}</p>
                        <p className="text-xs text-neutral-400">
                          CPF: {formatCPF(selectedPatient.cpf)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        selectedPatient.serasaStatus === "GREEN"
                          ? "success"
                          : selectedPatient.serasaStatus === "YELLOW"
                          ? "pending"
                          : "overdue"
                      }
                    >
                      {selectedPatient.serasaStatus === "GREEN"
                        ? "Adimplente"
                        : selectedPatient.serasaStatus === "YELLOW"
                        ? "Atenção"
                        : "Inadimplente"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Charges */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="h-4 w-4 text-neutral-400" />
                      Cobranças Pendentes
                    </CardTitle>
                    <button
                      onClick={selectAllCharges}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
                    >
                      {selectedCharges.size === selectedPatient.pendingCharges.length
                        ? "Desmarcar todos"
                        : "Selecionar todos"}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedPatient.pendingCharges.map((charge) => {
                    const remaining = charge.amount - charge.paidAmount;
                    const isSelected = selectedCharges.has(charge.id);
                    return (
                      <button
                        key={charge.id}
                        onClick={() => toggleCharge(charge.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer text-left ${
                          isSelected
                            ? "border-primary-300 bg-primary-50/50 ring-1 ring-primary-200"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <div
                          className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-primary-500 border-primary-500"
                              : "border-neutral-300"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {charge.description}
                            </p>
                            {charge.status === "OVERDUE" && (
                              <Badge variant="overdue" className="text-[10px] shrink-0">Atrasado</Badge>
                            )}
                            {charge.paidAmount > 0 && (
                              <Badge variant="pending" className="text-[10px] shrink-0">Parcial</Badge>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            Procedimento em {formatDate(charge.procedureDate)} · Vence em {formatDate(charge.dueDate)}
                            {charge.paidAmount > 0 && (
                              <span> · Já pago: {formatCurrency(charge.paidAmount)}</span>
                            )}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-neutral-900 shrink-0">
                          {formatCurrency(remaining)}
                        </p>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Payment Method */}
              {selectedCharges.size > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CreditCard className="h-4 w-4 text-neutral-400" />
                        Forma de Pagamento
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {paymentSplits.length > 1 && (
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={autoDistribute}>
                            <SplitSquareHorizontal className="h-3 w-3" />
                            Distribuir
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addSplit}>
                          <Plus className="h-3 w-3" />
                          Dividir
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {paymentSplits.map((split, index) => (
                      <div
                        key={split.id}
                        className={`space-y-3 ${
                          paymentSplits.length > 1
                            ? "p-4 border border-neutral-200 rounded-lg relative"
                            : ""
                        }`}
                      >
                        {paymentSplits.length > 1 && (
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                              Pagamento {index + 1}
                            </p>
                            <button
                              onClick={() => removeSplit(split.id)}
                              className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Method buttons */}
                        <div className="grid grid-cols-5 gap-2">
                          {PAYMENT_METHODS.map((method) => {
                            const Icon = method.icon;
                            const isActive = split.method === method.value;
                            return (
                              <button
                                key={method.value}
                                onClick={() => updateSplit(split.id, { method: method.value, installments: 1 })}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                                  isActive
                                    ? method.color + " border-current ring-1 ring-current/20"
                                    : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50"
                                }`}
                              >
                                <Icon className="h-5 w-5" />
                                {method.label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Amount */}
                          <div className="flex-1">
                            <Label className="text-xs text-neutral-400">Valor</Label>
                            <div className="relative mt-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">R$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={split.amount || ""}
                                onChange={(e) =>
                                  updateSplit(split.id, { amount: Number(e.target.value) || 0 })
                                }
                                className="pl-10"
                                placeholder="0,00"
                              />
                            </div>
                          </div>

                          {/* Installments (credit card only) */}
                          {split.method === "CREDIT_CARD" && (
                            <div className="w-32">
                              <Label className="text-xs text-neutral-400">Parcelas</Label>
                              <Select
                                value={String(split.installments)}
                                onValueChange={(v) => updateSplit(split.id, { installments: Number(v) })}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                                    <SelectItem key={n} value={String(n)}>
                                      {n}x {n === 1 ? "à vista" : `de ${formatCurrency(split.amount / n)}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Split balance indicator */}
                    {total > 0 && (
                      <div
                        className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                          isSplitValid
                            ? "bg-green-50 text-green-700"
                            : splitRemaining > 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span>
                          {isSplitValid
                            ? "Valores conferem"
                            : splitRemaining > 0
                            ? `Faltam ${formatCurrency(splitRemaining)}`
                            : `Excede em ${formatCurrency(Math.abs(splitRemaining))}`}
                        </span>
                        {isSplitValid ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Observations */}
              {selectedCharges.size > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <Label className="text-xs text-neutral-400">Observações (opcional)</Label>
                    <Input
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Observações sobre o pagamento..."
                      className="mt-1.5"
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Summary */}
            <div className="space-y-4">
              <Card className="sticky top-6">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="h-4 w-4 text-neutral-400" />
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selected items */}
                  {selectedCharges.size === 0 ? (
                    <div className="py-6 text-center text-neutral-400">
                      <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Selecione os itens para cobrar</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {selectedPatient.pendingCharges
                          .filter((c) => selectedCharges.has(c.id))
                          .map((charge) => (
                            <div key={charge.id} className="flex items-center justify-between text-sm">
                              <span className="text-neutral-600 truncate mr-2">{charge.description}</span>
                              <span className="font-medium text-neutral-900 shrink-0">
                                {formatCurrency(charge.amount - charge.paidAmount)}
                              </span>
                            </div>
                          ))}
                      </div>

                      <Separator />

                      {/* Subtotal */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">Subtotal</span>
                        <span className="font-medium text-neutral-900">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>

                      {/* Discount */}
                      <div>
                        <Label className="text-xs text-neutral-400 mb-1.5 block">Desconto</Label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max={discountType === "percent" ? 100 : subtotal}
                              value={discountValue}
                              onChange={(e) => setDiscountValue(e.target.value)}
                              placeholder="0"
                              className="pr-10"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                              {discountType === "percent" ? "%" : "R$"}
                            </span>
                          </div>
                          <button
                            onClick={() => setDiscountType(discountType === "percent" ? "fixed" : "percent")}
                            className="h-9 w-9 shrink-0 rounded-lg border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors cursor-pointer"
                            title={discountType === "percent" ? "Trocar para valor fixo" : "Trocar para porcentagem"}
                          >
                            {discountType === "percent" ? (
                              <Percent className="h-3.5 w-3.5 text-neutral-500" />
                            ) : (
                              <DollarSign className="h-3.5 w-3.5 text-neutral-500" />
                            )}
                          </button>
                        </div>
                        {discountAmount > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            − {formatCurrency(discountAmount)} de desconto
                          </p>
                        )}
                      </div>

                      <Separator />

                      {/* Total */}
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-neutral-900">Total</span>
                        <span className="text-xl font-bold text-primary-600">
                          {formatCurrency(total)}
                        </span>
                      </div>

                      {/* Payment method summary */}
                      {paymentSplits.some((s) => s.amount > 0) && (
                        <div className="space-y-1">
                          {paymentSplits
                            .filter((s) => s.amount > 0)
                            .map((s) => (
                              <div key={s.id} className="flex items-center justify-between text-xs text-neutral-500">
                                <span>
                                  {METHOD_LABELS[s.method]}
                                  {s.installments > 1 ? ` ${s.installments}x` : ""}
                                </span>
                                <span>{formatCurrency(s.amount)}</span>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Confirm Button */}
                      <Button
                        className="w-full gap-2 h-11"
                        disabled={!isSplitValid || isSubmitting || isLoadingData}
                        onClick={() => setShowConfirmation(true)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isSubmitting ? "Processando..." : "Confirmar Recebimento"}
                      </Button>

                      {!isSplitValid && selectedCharges.size > 0 && (
                        <p className="text-[11px] text-center text-neutral-400">
                          Preencha a forma de pagamento com o valor correto
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Receipt ═══ */}
        {showReceipt && selectedPatient && (
          <Card>
            <CardContent className="p-8 max-w-lg mx-auto text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Pagamento Registrado!</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Protocolo: {completedPaymentId}
                </p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Paciente</span>
                  <span className="font-medium text-neutral-900">{selectedPatient.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Valor</span>
                  <span className="font-bold text-primary-600">{formatCurrency(total)}</span>
                </div>
                {paymentSplits.filter((s) => s.amount > 0).map((s) => (
                  <div key={s.id} className="flex justify-between text-xs text-neutral-400">
                    <span>{METHOD_LABELS[s.method]}{s.installments > 1 ? ` (${s.installments}x)` : ""}</span>
                    <span>{formatCurrency(s.amount)}</span>
                  </div>
                ))}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Desconto aplicado</span>
                    <span>− {formatCurrency(discountAmount)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 justify-center">
                <Button variant="outline" className="gap-2" onClick={handlePrintReceipt}>
                  <Printer className="h-4 w-4" />
                  Imprimir Recibo
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => {
                  navigator.clipboard.writeText(completedPaymentId ?? "");
                  addToast({ title: "Copiado!", description: "Protocolo copiado para a área de transferência", variant: "info" });
                }}>
                  <Copy className="h-4 w-4" />
                  Copiar Protocolo
                </Button>
              </div>
              <Button className="gap-2" onClick={handleNewPayment}>
                <Plus className="h-4 w-4" />
                Novo Recebimento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Confirmation Dialog ─── */}
      <Dialog open={showConfirmation} onOpenChange={(open) => !open && setShowConfirmation(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
            <DialogDescription>
              Confira os dados antes de registrar o pagamento
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Paciente</span>
                <span className="font-medium">{selectedPatient.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Itens</span>
                <span className="font-medium">{selectedCharges.size} cobrança{selectedCharges.size !== 1 ? "s" : ""}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto</span>
                  <span>− {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <Separator />
              {paymentSplits.filter((s) => s.amount > 0).map((s) => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-neutral-500">{METHOD_LABELS[s.method]}{s.installments > 1 ? ` (${s.installments}x)` : ""}</span>
                  <span className="font-medium">{formatCurrency(s.amount)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-neutral-900">Total</span>
                <span className="text-xl font-bold text-primary-600">{formatCurrency(total)}</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>Cancelar</Button>
            <Button
              className="gap-2"
              disabled={isSubmitting}
              onClick={() => void handleConfirmPayment()}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? "Confirmando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}


