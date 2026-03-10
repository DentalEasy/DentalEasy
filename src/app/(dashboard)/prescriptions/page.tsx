"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  Download,
  Printer,
  Search,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Textarea,
  Avatar,
  AvatarFallback,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { FormField } from "@/components/ui/form-field";
import { useAuth } from "@/contexts/auth-context";
import { formatDate } from "@/lib/utils";
import { PageTransition } from "@/lib/animations";
import { useToast } from "@/components/ui/toast";
import { prescriptionSchema, type PrescriptionFormData } from "@/lib/schemas";

interface PrescriptionItem {
  id: string;
  patientName: string;
  content: string;
  createdAt: string;
}

const mockPrescriptions: PrescriptionItem[] = [
  {
    id: "rx1",
    patientName: "Maria Silva",
    content: "Amoxicilina 500mg — Tomar 1 cápsula de 8 em 8 horas por 7 dias.\nIbuprofeno 600mg — Tomar 1 comprimido de 12 em 12 horas por 3 dias se houver dor.",
    createdAt: "2026-03-08",
  },
  {
    id: "rx2",
    patientName: "João Oliveira",
    content: "Nimesulida 100mg — Tomar 1 comprimido de 12 em 12 horas por 5 dias.\nClorexidina 0,12% — Bochechar 3x ao dia por 7 dias.",
    createdAt: "2026-03-07",
  },
];

const mockPatients = [
  { id: "1", name: "Maria Silva" },
  { id: "2", name: "João Oliveira" },
  { id: "3", name: "Ana Costa" },
];

function PrescriptionEditor() {
  const { addToast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
  });

  const onSubmit = (data: PrescriptionFormData) => {
    addToast({ title: "Receita salva", description: "A receita foi salva com sucesso", variant: "success" });
    reset();
  };

  const handleExportDocx = () => {
    const content = getValues("content");
    const patientId = getValues("patientId");
    if (!content || !patientId) {
      addToast({ title: "Preencha o formulário", description: "Selecione um paciente e preencha a prescrição antes de exportar", variant: "warning" });
      return;
    }
    const patientName = mockPatients.find((p) => p.id === patientId)?.name || "Paciente";
    addToast({ title: "DOCX exportado", description: `Receita de ${patientName} exportada como DOCX`, variant: "success" });
  };

  const handleExportPdf = () => {
    const content = getValues("content");
    const patientId = getValues("patientId");
    if (!content || !patientId) {
      addToast({ title: "Preencha o formulário", description: "Selecione um paciente e preencha a prescrição antes de exportar", variant: "warning" });
      return;
    }
    const patientName = mockPatients.find((p) => p.id === patientId)?.name || "Paciente";
    addToast({ title: "PDF exportado", description: `Receita de ${patientName} exportada como PDF`, variant: "success" });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Nova Receita</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Paciente" error={errors.patientId} required>
            <Controller
              control={control}
              name="patientId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPatients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label="Prescrição" error={errors.content} required>
            <Textarea
              placeholder="Digite a prescrição médica..."
              rows={6}
              {...register("content")}
            />
          </FormField>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button type="submit" className="gap-2 w-full sm:w-auto" disabled={isSubmitting}>
              <FileText className="h-4 w-4" />
              {isSubmitting ? "Salvando..." : "Salvar Receita"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="gap-2 flex-1 sm:flex-initial" onClick={handleExportDocx}>
                <Download className="h-4 w-4" />
                <span className="hidden xs:inline">Exportar</span> DOCX
              </Button>
              <Button type="button" variant="outline" className="gap-2 flex-1 sm:flex-initial" onClick={handleExportPdf}>
                <Printer className="h-4 w-4" />
                <span className="hidden xs:inline">Exportar</span> PDF
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function PrescriptionsPage() {
  const { hasRole } = useAuth();

  if (!hasRole(["DENTIST", "ADMIN"])) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-100 mx-auto mb-4">
              <FileText className="h-6 w-6 text-neutral-400" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900 mb-1">
              Acesso Restrito
            </h2>
            <p className="text-sm text-neutral-400">
              O módulo de Receituário é exclusivo para dentistas.
              Contate o administrador se precisar de acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { addToast } = useToast();

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const handleExportRx = (patientName: string, format: "DOCX" | "PDF") => {
    addToast({ title: `${format} exportado`, description: `Receita de ${patientName} exportada como ${format}`, variant: "success" });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Receituário</h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            Emita e gerencie prescrições médicas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Editor */}
          <PrescriptionEditor />

          {/* Recent Prescriptions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-neutral-400" />
                Receitas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockPrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="rounded-lg border border-neutral-100 p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[9px] bg-neutral-100 text-neutral-500">
                        {getInitials(rx.patientName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-neutral-900 block">
                        {rx.patientName}
                      </span>
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(rx.createdAt)}
                      </span>
                    </div>
                    <Badge variant="secondary">Receita</Badge>
                  </div>
                  <pre className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-md whitespace-pre-wrap font-sans leading-relaxed">
                    {rx.content}
                  </pre>
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => handleExportRx(rx.patientName, "DOCX")}>
                      <Download className="h-3 w-3" />
                      DOCX
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => handleExportRx(rx.patientName, "PDF")}>
                      <Printer className="h-3 w-3" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
