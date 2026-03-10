"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertTriangle,
  MoreHorizontal,
  Download,
  Filter,
  ArrowUpRight,
  Eye,
  Send,
  Trash2,
  CheckCircle2,
  Printer,
  Receipt,
} from "lucide-react";
import { useClinic } from "@/contexts/clinic-context";
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
  Separator,
} from "@/components/ui";
import { RoleGate } from "@/components/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageTransition } from "@/lib/animations";
import { useToast } from "@/components/ui/toast";
import type { FinancialRecord } from "@/types";

// ─── Mock data ───
const mockRecords: FinancialRecord[] = [
  {
    id: "f1", organizationId: "org_01", patientId: "p1",
    patient: { id: "p1", organizationId: "org_01", name: "Maria Silva", phone: "17999765432", cpf: "12345678900", birthDate: "1990-05-15", serasaStatus: "GREEN", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
    description: "Limpeza", amount: 250, type: "INCOME", paymentStatus: "PAID", paymentMethod: "PIX", dueDate: "2026-03-09", paidAt: "2026-03-09", nfeStatus: "ISSUED", createdAt: "2026-03-09",
  },
  {
    id: "f2", organizationId: "org_01", patientId: "p2",
    patient: { id: "p2", organizationId: "org_01", name: "João Oliveira", phone: "17999654321", cpf: "98765432100", birthDate: "1985-11-20", serasaStatus: "YELLOW", createdAt: "2025-02-01", updatedAt: "2025-02-01" },
    description: "Restauração (3 dentes)", amount: 1200, type: "INCOME", paymentStatus: "PENDING", paymentMethod: "CREDIT_CARD", dueDate: "2026-03-15", nfeStatus: "PENDING", createdAt: "2026-03-05",
  },
  {
    id: "f3", organizationId: "org_01", patientId: "p3",
    patient: { id: "p3", organizationId: "org_01", name: "Ana Costa", phone: "17999543210", cpf: "11122233344", birthDate: "1978-03-08", serasaStatus: "RED", createdAt: "2025-03-01", updatedAt: "2025-03-01" },
    description: "Canal + Coroa", amount: 2800, type: "INCOME", paymentStatus: "OVERDUE", dueDate: "2026-02-20", nfeStatus: "PENDING", createdAt: "2026-02-01",
  },
  {
    id: "f4", organizationId: "org_01", patientId: "p1",
    patient: { id: "p1", organizationId: "org_01", name: "Maria Silva", phone: "17999765432", cpf: "12345678900", birthDate: "1990-05-15", serasaStatus: "GREEN", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
    description: "Material Descartável", amount: 480, type: "EXPENSE", paymentStatus: "PAID", paymentMethod: "BOLETO", dueDate: "2026-03-05", paidAt: "2026-03-04", createdAt: "2026-03-01",
  },
];

const paymentMethodLabels: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão Crédito",
  DEBIT_CARD: "Cartão Débito",
  CASH: "Dinheiro",
  BOLETO: "Boleto",
};

export default function FinancialPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
  const [receiptRecord, setReceiptRecord] = useState<FinancialRecord | null>(null);
  const { addToast } = useToast();
  const { organization } = useClinic();

  const filteredRecords = mockRecords.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.paymentStatus === statusFilter;
    const matchesType = typeFilter === "all" || r.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const income = filteredRecords
    .filter((r) => r.type === "INCOME" && r.paymentStatus === "PAID")
    .reduce((acc, r) => acc + r.amount, 0);

  const pending = filteredRecords
    .filter((r) => r.paymentStatus === "PENDING" || r.paymentStatus === "OVERDUE")
    .reduce((acc, r) => acc + r.amount, 0);

  const expenses = filteredRecords
    .filter((r) => r.type === "EXPENSE")
    .reduce((acc, r) => acc + r.amount, 0);

  const handleExport = () => {
    addToast({ title: "Relatório exportado", description: "O relatório financeiro foi baixado com sucesso", variant: "success" });
  };

  const handleEmitNfe = (record: FinancialRecord) => {
    addToast({ title: "NF-e emitida", description: `NF-e emitida para ${record.patient.name} - ${record.description}`, variant: "success" });
  };

  const handleMarkAsPaid = (record: FinancialRecord) => {
    setSelectedRecord(null);
    addToast({ title: "Pagamento registrado", description: `${formatCurrency(record.amount)} de ${record.patient.name} marcado como pago`, variant: "success" });
  };

  const handleSendReminder = (record: FinancialRecord) => {
    setSelectedRecord(null);
    addToast({ title: "Cobrança enviada", description: `Lembrete de pagamento enviado para ${record.patient.name}`, variant: "success" });
  };

  const handleDeleteRecord = (record: FinancialRecord) => {
    setMenuOpenId(null);
    addToast({ title: "Registro removido", description: `Registro de ${record.patient.name} removido`, variant: "success" });
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow || !receiptRecord) return;
    const r = receiptRecord;
    const clinicName = organization?.name ?? "Clínica Odontológica";
    const clinicPhone = organization?.phone ?? "(17) 3000-0000";
    const clinicAddress = organization?.address ? `${organization.address} - ${organization.city}/${organization.state}` : "Jales/SP";
    const clinicCnpj = organization?.cnpj ?? "00.000.000/0001-00";
    const today = new Date().toLocaleDateString("pt-BR");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Recibo - ${r.patient.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; max-width: 700px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #0052CC; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 20px; color: #0052CC; margin-bottom: 4px; }
        .header p { font-size: 12px; color: #666; }
        .title { text-align: center; font-size: 18px; font-weight: 700; letter-spacing: 2px; margin-bottom: 24px; color: #333; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
        .info-item label { display: block; font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .info-item p { font-size: 14px; font-weight: 500; }
        .amount-box { background: #f5f7fa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
        .amount-box .label { font-size: 12px; color: #666; margin-bottom: 4px; }
        .amount-box .value { font-size: 28px; font-weight: 700; color: #0052CC; }
        .amount-box .extenso { font-size: 11px; color: #888; margin-top: 4px; font-style: italic; }
        .signature { margin-top: 60px; display: flex; justify-content: space-between; }
        .signature .sig-line { width: 45%; text-align: center; }
        .signature .sig-line hr { border: none; border-top: 1px solid #333; margin-bottom: 6px; }
        .signature .sig-line p { font-size: 11px; color: #666; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <div class="header">
          <h1>${clinicName}</h1>
          <p>${clinicAddress} · ${clinicPhone}</p>
          <p>CNPJ: ${clinicCnpj}</p>
        </div>
        <div class="title">RECIBO</div>
        <div class="info-grid">
          <div class="info-item"><label>Paciente</label><p>${r.patient.name}</p></div>
          <div class="info-item"><label>CPF</label><p>${r.patient.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</p></div>
          <div class="info-item"><label>Procedimento</label><p>${r.description}</p></div>
          <div class="info-item"><label>Forma de Pagamento</label><p>${r.paymentMethod ? paymentMethodLabels[r.paymentMethod] : "—"}</p></div>
          <div class="info-item"><label>Data de Emissão</label><p>${today}</p></div>
          <div class="info-item"><label>Data de Pagamento</label><p>${r.paidAt ? new Date(r.paidAt).toLocaleDateString("pt-BR") : today}</p></div>
        </div>
        <div class="amount-box">
          <div class="label">Valor Recebido</div>
          <div class="value">R$ ${r.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="signature">
          <div class="sig-line"><hr /><p>${clinicName}</p></div>
          <div class="sig-line"><hr /><p>${r.patient.name}</p></div>
        </div>
        <div class="footer">Documento gerado em ${today} · ${clinicName}</div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
    addToast({ title: "Recibo gerado", description: `Recibo de ${r.patient.name} pronto para impressão`, variant: "success" });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Financeiro</h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              Controle o fluxo de caixa e pagamentos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button
              variant={showFilters ? "default" : "outline"}
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "Todos" },
                      { value: "PAID", label: "Pago" },
                      { value: "PENDING", label: "Pendente" },
                      { value: "OVERDUE", label: "Atrasado" },
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
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Tipo</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "Todos" },
                      { value: "INCOME", label: "Receita" },
                      { value: "EXPENSE", label: "Despesa" },
                    ].map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setTypeFilter(f.value)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          typeFilter === f.value
                            ? "bg-neutral-900 text-white"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="h-4 w-4 text-neutral-400" />
                <span className="text-xs text-success-600 font-medium flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" />12%
                </span>
              </div>
              <p className="text-2xl font-bold text-neutral-900 tracking-tight">{formatCurrency(income)}</p>
              <p className="text-xs text-neutral-400 mt-1">Receita recebida</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <AlertTriangle className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-2xl font-bold text-neutral-900 tracking-tight">{formatCurrency(pending)}</p>
              <p className="text-xs text-neutral-400 mt-1">Pendente / Atrasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <TrendingDown className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-2xl font-bold text-neutral-900 tracking-tight">{formatCurrency(expenses)}</p>
              <p className="text-xs text-neutral-400 mt-1">Despesas</p>
            </CardContent>
          </Card>
        </div>

        {/* Records Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-neutral-400" />
              Movimentações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Paciente</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Descrição</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Valor</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Pagamento</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">Vencimento</th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-neutral-400 uppercase tracking-wider">NF-e</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td className="py-2.5 px-3 font-medium text-neutral-900">
                        {record.patient.name}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-500">
                        {record.description}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`font-medium ${record.type === "INCOME" ? "text-success-600" : "text-danger-600"}`}>
                          {record.type === "EXPENSE" ? "- " : ""}
                          {formatCurrency(record.amount)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-500">
                        {record.paymentMethod ? paymentMethodLabels[record.paymentMethod] : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            record.paymentStatus === "PAID" ? "paid"
                              : record.paymentStatus === "PENDING" ? "pending"
                              : "overdue"
                          }
                        >
                          {record.paymentStatus === "PAID" ? "Pago" : record.paymentStatus === "PENDING" ? "Pendente" : "Atrasado"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-500">
                        {formatDate(record.dueDate)}
                      </td>
                      <td className="py-2.5 px-3">
                        <RoleGate allowedRoles={["ADMIN", "DENTIST"]}>
                          {record.nfeStatus === "ISSUED" ? (
                            <Badge variant="success">Emitida</Badge>
                          ) : (
                            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); handleEmitNfe(record); }}>
                              <FileText className="h-3 w-3" />
                              Emitir
                            </Button>
                          )}
                        </RoleGate>
                      </td>
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <Button variant="ghost" size="icon-sm" onClick={() => setMenuOpenId(menuOpenId === record.id ? null : record.id)}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                          {menuOpenId === record.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                                  onClick={() => { setSelectedRecord(record); setMenuOpenId(null); }}
                                >
                                  <Eye className="h-3.5 w-3.5 text-neutral-400" />
                                  Ver detalhes
                                </button>
                                {record.paymentStatus !== "PAID" && (
                                  <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                                    onClick={() => handleMarkAsPaid(record)}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 text-neutral-400" />
                                    Marcar como pago
                                  </button>
                                )}
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                                  onClick={() => { handleSendReminder(record); setMenuOpenId(null); }}
                                >
                                  <Send className="h-3.5 w-3.5 text-neutral-400" />
                                  Enviar cobrança
                                </button>
                                {record.paymentStatus === "PAID" && (
                                  <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                                    onClick={() => { setReceiptRecord(record); setMenuOpenId(null); }}
                                  >
                                    <Receipt className="h-3.5 w-3.5 text-neutral-400" />
                                    Gerar Recibo
                                  </button>
                                )}
                                <div className="h-px bg-neutral-100 my-1" />
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  onClick={() => handleDeleteRecord(record)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Remover
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Record Detail Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-md">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRecord.description}</DialogTitle>
                <DialogDescription>Detalhes da movimentação financeira</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Paciente</p>
                    <p className="text-sm font-medium text-neutral-900">{selectedRecord.patient.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Valor</p>
                    <p className={`text-sm font-medium ${selectedRecord.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                      {selectedRecord.type === "EXPENSE" ? "- " : ""}{formatCurrency(selectedRecord.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Pagamento</p>
                    <p className="text-sm font-medium text-neutral-900">{selectedRecord.paymentMethod ? paymentMethodLabels[selectedRecord.paymentMethod] : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Status</p>
                    <Badge variant={selectedRecord.paymentStatus === "PAID" ? "paid" : selectedRecord.paymentStatus === "PENDING" ? "pending" : "overdue"}>
                      {selectedRecord.paymentStatus === "PAID" ? "Pago" : selectedRecord.paymentStatus === "PENDING" ? "Pendente" : "Atrasado"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Vencimento</p>
                    <p className="text-sm font-medium text-neutral-900">{formatDate(selectedRecord.dueDate)}</p>
                  </div>
                  {selectedRecord.paidAt && (
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">Pago em</p>
                      <p className="text-sm font-medium text-neutral-900">{formatDate(selectedRecord.paidAt)}</p>
                    </div>
                  )}
                </div>
                <Separator />
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  {selectedRecord.paymentStatus === "PAID" && (
                    <Button variant="outline" className="gap-2" onClick={() => { setReceiptRecord(selectedRecord); setSelectedRecord(null); }}>
                      <Receipt className="h-4 w-4" />
                      Gerar Recibo
                    </Button>
                  )}
                  {selectedRecord.paymentStatus !== "PAID" && (
                    <Button className="gap-2" onClick={() => handleMarkAsPaid(selectedRecord)}>
                      <CheckCircle2 className="h-4 w-4" />
                      Marcar como Pago
                    </Button>
                  )}
                  {selectedRecord.paymentStatus !== "PAID" && (
                    <Button variant="outline" className="gap-2" onClick={() => handleSendReminder(selectedRecord)}>
                      <Send className="h-4 w-4" />
                      Enviar Cobrança
                    </Button>
                  )}
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Receipt Preview Modal */}
      <Dialog open={!!receiptRecord} onOpenChange={(open) => !open && setReceiptRecord(null)}>
        <DialogContent className="max-w-md">
          {receiptRecord && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary-500" />
                  Recibo de Pagamento
                </DialogTitle>
                <DialogDescription>Prévia do recibo para impressão</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                  <div className="text-center mb-3">
                    <p className="text-sm font-bold text-neutral-900">{organization?.name ?? "Clínica Odontológica"}</p>
                    <p className="text-[10px] text-neutral-400">CNPJ: {organization?.cnpj ?? "00.000.000/0001-00"}</p>
                  </div>
                  <Separator className="mb-3" />
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div>
                      <span className="text-neutral-400">Paciente</span>
                      <p className="font-medium text-neutral-900">{receiptRecord.patient.name}</p>
                    </div>
                    <div>
                      <span className="text-neutral-400">CPF</span>
                      <p className="font-medium text-neutral-900">{receiptRecord.patient.cpf}</p>
                    </div>
                    <div>
                      <span className="text-neutral-400">Procedimento</span>
                      <p className="font-medium text-neutral-900">{receiptRecord.description}</p>
                    </div>
                    <div>
                      <span className="text-neutral-400">Pagamento</span>
                      <p className="font-medium text-neutral-900">{receiptRecord.paymentMethod ? paymentMethodLabels[receiptRecord.paymentMethod] : "—"}</p>
                    </div>
                  </div>
                  <div className="mt-3 bg-white rounded-md border p-3 text-center">
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Valor Recebido</p>
                    <p className="text-xl font-bold text-primary-600">{formatCurrency(receiptRecord.amount)}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReceiptRecord(null)}>Fechar</Button>
                <Button className="gap-2" onClick={handlePrintReceipt}>
                  <Printer className="h-4 w-4" />
                  Imprimir Recibo
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
