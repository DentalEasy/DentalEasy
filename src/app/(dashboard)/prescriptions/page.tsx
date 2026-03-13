"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { Patient, Prescription } from "@/types";
import {
  ApiError,
  createPrescription,
  exportPrescriptionDocx,
  listPatients,
  listPrescriptions,
} from "@/lib/api";

interface PrescriptionEditorProps {
  patients: Pick<Patient, "id" | "name">[];
  onCreate: (data: PrescriptionFormData) => Promise<void>;
}

function PrescriptionEditor({ patients, onCreate }: PrescriptionEditorProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
  });

  const onSubmit = async (data: PrescriptionFormData) => {
    await onCreate(data);
    reset();
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
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label="Prescricao" error={errors.content} required>
            <Textarea
              placeholder="Digite a prescricao medica..."
              rows={6}
              {...register("content")}
            />
          </FormField>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button type="submit" className="gap-2 w-full sm:w-auto" disabled={isSubmitting}>
              <FileText className="h-4 w-4" />
              {isSubmitting ? "Salvando..." : "Salvar Receita"}
            </Button>
            <Button type="button" variant="outline" className="gap-2" disabled>
              <Download className="h-4 w-4" />
              Exportacao apos salvar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export default function PrescriptionsPage() {
  const { hasRole } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Pick<Patient, "id" | "name">[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const { addToast } = useToast();

  if (!hasRole(["DENTIST", "ADMIN"])) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-100 mx-auto mb-4">
              <FileText className="h-6 w-6 text-neutral-400" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900 mb-1">Acesso Restrito</h2>
            <p className="text-sm text-neutral-400">
              O modulo de Receituario e exclusivo para dentistas e administradores.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [prescriptionsData, patientsData] = await Promise.all([
        listPrescriptions(),
        listPatients(),
      ]);
      setPrescriptions(prescriptionsData);
      setPatients(patientsData.map((patient) => ({ id: patient.id, name: patient.name })));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel carregar receituario.";
      addToast({ title: "Erro ao carregar", description: message, variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((prescription) =>
      prescription.patient.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [prescriptions, search]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const handleCreatePrescription = async (data: PrescriptionFormData) => {
    try {
      const created = await createPrescription(data);
      setPrescriptions((current) => [created, ...current]);
      addToast({
        title: "Receita salva",
        description: "A receita foi salva com sucesso",
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel salvar a receita.";
      addToast({ title: "Erro", description: message, variant: "error" });
      throw err;
    }
  };

  const handleExportDocx = async (prescription: Prescription) => {
    try {
      setExportingId(prescription.id);
      const blob = await exportPrescriptionDocx(prescription.id);
      downloadBlob(blob, `receita-${prescription.patient.name}-${prescription.id}.docx`);
      addToast({
        title: "DOCX exportado",
        description: `Receita de ${prescription.patient.name} exportada com sucesso`,
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel exportar DOCX.";
      addToast({ title: "Erro", description: message, variant: "error" });
    } finally {
      setExportingId(null);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Receituario</h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            Emita e gerencie prescricoes medicas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PrescriptionEditor patients={patients} onCreate={handleCreatePrescription} />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-neutral-400" />
                Receitas Recentes
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  className="pl-10"
                  placeholder="Buscar por paciente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="h-14 animate-pulse bg-neutral-100 rounded-md" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredPrescriptions.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">Nenhuma receita encontrada.</p>
                </div>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="rounded-lg border border-neutral-100 p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[9px] bg-neutral-100 text-neutral-500">
                          {getInitials(prescription.patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-neutral-900 block">
                          {prescription.patient.name}
                        </span>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(prescription.createdAt)}
                        </span>
                      </div>
                      <Badge variant="secondary">Receita</Badge>
                    </div>
                    <pre className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-md whitespace-pre-wrap font-sans leading-relaxed">
                      {prescription.content}
                    </pre>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        disabled={exportingId === prescription.id}
                        onClick={() => void handleExportDocx(prescription)}
                      >
                        <Download className="h-3 w-3" />
                        {exportingId === prescription.id ? "Exportando..." : "DOCX"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() =>
                          addToast({
                            title: "PDF em breve",
                            description: "Exportacao PDF sera disponibilizada na proxima etapa.",
                            variant: "info",
                          })
                        }
                      >
                        <Printer className="h-3 w-3" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
