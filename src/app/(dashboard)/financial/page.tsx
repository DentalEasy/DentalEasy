"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Download,
  FileText,
  Filter,
  MoreHorizontal,
  Printer,
  Receipt,
  Send,
  Trash2,
  TrendingDown,
  TrendingUp,
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
  Separator,
} from "@/components/ui";
import { RoleGate } from "@/components/auth";
import { useClinic } from "@/contexts/clinic-context";
import { PageTransition } from "@/lib/animations";
import {
  ApiError,
  createPayment,
  deleteFinancialRecord,
  getPaymentReceipt,
  listFinancialRecords,
  listPayments,
  updateFinancialRecord,
} from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { FinancialRecord } from "@/types";

const paymentMethodLabels: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartao Credito",
  DEBIT_CARD: "Cartao Debito",
  CASH: "Dinheiro",
  BOLETO: "Boleto",
};

const statusVariant: Record<
  FinancialRecord["paymentStatus"],
  "paid" | "pending" | "overdue" | "cancelled"
> = {
  PAID: "paid",
  PENDING: "pending",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
};

const statusLabel: Record<FinancialRecord["paymentStatus"], string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  OVERDUE: "Atrasado",
  CANCELLED: "Cancelado",
};

const recordOwner = (record: FinancialRecord) =>
  record.patient?.name ?? (record.type === "EXPENSE" ? "Despesa interna" : "Sem paciente");

export default function FinancialPage() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
  const [receiptRecord, setReceiptRecord] = useState<FinancialRecord | null>(null);
  const { addToast } = useToast();
  const { organization } = useClinic();

  const loadRecords = async () => {
    try {
      setIsLoading(true);
      setRecords(await listFinancialRecords());
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel carregar o financeiro.";
      addToast({ title: "Erro ao carregar", description: message, variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const matchesStatus = statusFilter === "all" || record.paymentStatus === statusFilter;
        const matchesType = typeFilter === "all" || record.type === typeFilter;
        return matchesStatus && matchesType;
      }),
    [records, statusFilter, typeFilter]
  );

  const income = filteredRecords
    .filter((record) => record.type === "INCOME" && record.paymentStatus === "PAID")
    .reduce((sum, record) => sum + record.amount, 0);
  const pending = filteredRecords
    .filter((record) => ["PENDING", "OVERDUE"].includes(record.paymentStatus))
    .reduce((sum, record) => sum + (record.remainingAmount ?? record.amount), 0);
  const expenses = filteredRecords
    .filter((record) => record.type === "EXPENSE")
    .reduce((sum, record) => sum + record.amount, 0);

  const handleEmitNfe = async (record: FinancialRecord) => {
    try {
      const updated = await updateFinancialRecord(record.id, { nfeStatus: "ISSUED" });
      setRecords((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      addToast({ title: "NF-e emitida", description: recordOwner(record), variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Falha ao emitir NF-e.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  const handleMarkAsPaid = async (record: FinancialRecord) => {
    const remainingAmount = record.remainingAmount ?? record.amount;
    if (record.paymentStatus === "PAID" || remainingAmount <= 0) return;
    try {
      await createPayment({
        financialRecordId: record.id,
        amount: remainingAmount,
        method: record.paymentMethod ?? "PIX",
        status: "SETTLED",
        paidAt: new Date().toISOString(),
        receivedFrom: record.patient?.name,
      });
      await loadRecords();
      setSelectedRecord(null);
      addToast({
        title: "Pagamento registrado",
        description: `${formatCurrency(remainingAmount)} recebido.`,
        variant: "success",
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Falha ao registrar baixa.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  const handleDelete = async (record: FinancialRecord) => {
    try {
      await deleteFinancialRecord(record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      addToast({ title: "Registro removido", description: record.description, variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Falha ao remover registro.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  const handlePrintReceipt = async () => {
    if (!receiptRecord) return;
    let receiptPayload: Awaited<ReturnType<typeof getPaymentReceipt>> | null = null;
    try {
      const payments = await listPayments({
        financialRecordId: receiptRecord.id,
        status: "SETTLED",
      });
      if (payments.length) {
        receiptPayload = await getPaymentReceipt(payments[0].id);
      }
    } catch {
      receiptPayload = null;
    }

    const printWindow = window.open("", "_blank", "width=780,height=600");
    if (!printWindow) return;
    const today = new Date().toLocaleDateString("pt-BR");
    const organizationName = receiptPayload?.organization.name ?? organization?.name ?? "Clinica";
    const organizationCnpj =
      receiptPayload?.organization.cnpj ?? organization?.cnpj ?? "00.000.000/0001-00";
    const ownerName = receiptPayload?.payer ?? receiptRecord.patient?.name ?? "Nao informado";
    const paymentMethod =
      receiptPayload?.payment.method ?? receiptRecord.paymentMethod ?? undefined;
    const receiptNumber = receiptPayload?.receiptNumber ?? "N/A";

    printWindow.document.write(`<html><body style="font-family:Arial;padding:24px">
      <h2>${organizationName}</h2>
      <p>CNPJ: ${organizationCnpj}</p>
      <hr/>
      <h3>Recibo</h3>
      <p>Paciente/Pagador: ${ownerName}</p>
      <p>Descricao: ${receiptRecord.description}</p>
      <p>Valor: ${formatCurrency(receiptRecord.amount)}</p>
      <p>Metodo: ${paymentMethod ? paymentMethodLabels[paymentMethod] : "-"}</p>
      <p>Numero: ${receiptNumber}</p>
      <p>Data: ${today}</p>
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 200);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Financeiro</h2>
            <p className="text-sm text-neutral-400">Controle o fluxo de caixa e pagamentos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button variant={showFilters ? "default" : "outline"} className="gap-2" onClick={() => setShowFilters((prev) => !prev)}>
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {["all", "PAID", "PENDING", "OVERDUE", "CANCELLED"].map((value) => (
                    <button
                      key={value}
                      onClick={() => setStatusFilter(value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        statusFilter === value
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {value === "all" ? "Todos" : statusLabel[value as FinancialRecord["paymentStatus"]]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Tipo</p>
                <div className="flex flex-wrap gap-2">
                  {["all", "INCOME", "EXPENSE"].map((value) => (
                    <button
                      key={value}
                      onClick={() => setTypeFilter(value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        typeFilter === value
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {value === "all" ? "Todos" : value === "INCOME" ? "Receita" : "Despesa"}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-5"><TrendingUp className="h-4 w-4 text-neutral-400 mb-2" /><p className="text-2xl font-bold">{formatCurrency(income)}</p><p className="text-xs text-neutral-400">Receita recebida</p></CardContent></Card>
          <Card><CardContent className="p-5"><AlertTriangle className="h-4 w-4 text-neutral-400 mb-2" /><p className="text-2xl font-bold">{formatCurrency(pending)}</p><p className="text-xs text-neutral-400">Pendente / Atrasado</p></CardContent></Card>
          <Card><CardContent className="p-5"><TrendingDown className="h-4 w-4 text-neutral-400 mb-2" /><p className="text-2xl font-bold">{formatCurrency(expenses)}</p><p className="text-xs text-neutral-400">Despesas</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-neutral-400" />Movimentacoes</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-sm text-neutral-400">Carregando...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-neutral-100"><th className="text-left py-2 px-3">Paciente</th><th className="text-left py-2 px-3">Descricao</th><th className="text-left py-2 px-3">Valor</th><th className="text-left py-2 px-3">Pagamento</th><th className="text-left py-2 px-3">Status</th><th className="text-left py-2 px-3">Vencimento</th><th className="text-left py-2 px-3">NF-e</th><th></th></tr></thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer" onClick={() => setSelectedRecord(record)}>
                        <td className="py-2 px-3 font-medium">{recordOwner(record)}</td>
                        <td className="py-2 px-3">{record.description}</td>
                        <td className="py-2 px-3">{formatCurrency(record.amount)}</td>
                        <td className="py-2 px-3">{record.paymentMethod ? paymentMethodLabels[record.paymentMethod] : "-"}</td>
                        <td className="py-2 px-3"><Badge variant={statusVariant[record.paymentStatus]}>{statusLabel[record.paymentStatus]}</Badge></td>
                        <td className="py-2 px-3">{formatDate(record.dueDate)}</td>
                        <td className="py-2 px-3"><RoleGate allowedRoles={["ADMIN", "DENTIST"]}>{record.nfeStatus === "ISSUED" ? <Badge variant="success">Emitida</Badge> : <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); void handleEmitNfe(record); }}><FileText className="h-3 w-3" />Emitir</Button>}</RoleGate></td>
                        <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="relative">
                            <Button variant="ghost" size="icon-sm" onClick={() => setMenuOpenId(menuOpenId === record.id ? null : record.id)}><MoreHorizontal className="h-4 w-4" /></Button>
                            {menuOpenId === record.id && <div className="absolute right-0 top-full z-50 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 min-w-[170px]">
                              <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50" onClick={() => { setSelectedRecord(record); setMenuOpenId(null); }}>Ver detalhes</button>
                              {record.paymentStatus !== "PAID" && record.paymentStatus !== "CANCELLED" && <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50" onClick={() => void handleMarkAsPaid(record)}>Marcar como pago</button>}
                              {record.type === "INCOME" && record.paymentStatus !== "PAID" && <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50" onClick={() => addToast({ title: "Cobranca enviada", description: recordOwner(record), variant: "success" })}><Send className="inline h-3.5 w-3.5 mr-1" />Enviar cobranca</button>}
                              {record.paymentStatus === "PAID" && <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50" onClick={() => setReceiptRecord(record)}><Receipt className="inline h-3.5 w-3.5 mr-1" />Gerar recibo</button>}
                              <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => void handleDelete(record)}><Trash2 className="inline h-3.5 w-3.5 mr-1" />Remover</button>
                            </div>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent>
          {selectedRecord && <>
            <DialogHeader><DialogTitle>{selectedRecord.description}</DialogTitle><DialogDescription>Detalhes do registro financeiro</DialogDescription></DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p><strong>Paciente:</strong> {recordOwner(selectedRecord)}</p>
              <p><strong>Valor:</strong> {formatCurrency(selectedRecord.amount)}</p>
              <p><strong>Status:</strong> {statusLabel[selectedRecord.paymentStatus]}</p>
              <p><strong>Vencimento:</strong> {formatDate(selectedRecord.dueDate)}</p>
            </div>
            <Separator />
            <DialogFooter>
              {selectedRecord.paymentStatus !== "PAID" && selectedRecord.paymentStatus !== "CANCELLED" && <Button className="gap-2" onClick={() => void handleMarkAsPaid(selectedRecord)}><CheckCircle2 className="h-4 w-4" />Marcar como Pago</Button>}
            </DialogFooter>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!receiptRecord} onOpenChange={(open) => !open && setReceiptRecord(null)}>
        <DialogContent>
          {receiptRecord && <>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary-500" />Recibo</DialogTitle><DialogDescription>Previa de impressao</DialogDescription></DialogHeader>
            <div className="text-sm space-y-1">
              <p><strong>Paciente:</strong> {receiptRecord.patient?.name ?? "Nao informado"}</p>
              <p><strong>Valor:</strong> {formatCurrency(receiptRecord.amount)}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReceiptRecord(null)}>Fechar</Button>
              <Button className="gap-2" onClick={handlePrintReceipt}><Printer className="h-4 w-4" />Imprimir</Button>
            </DialogFooter>
          </>}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
