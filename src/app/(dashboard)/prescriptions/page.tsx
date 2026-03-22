"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Download,
  FileText,
  Plus,
  Printer,
  Search,
  Trash2,
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import {
  ApiError,
  createPrescription,
  exportPrescriptionDocx,
  listPatients,
  listPrescriptions,
} from "@/lib/api";
import { PageTransition } from "@/lib/animations";
import {
  prescriptionSchema,
  type PrescriptionFormData,
  type PrescriptionFormValues,
} from "@/lib/schemas";
import { formatDate } from "@/lib/utils";
import type { Patient, Prescription } from "@/types";

interface PrescriptionEditorProps {
  patients: Pick<Patient, "id" | "name">[];
  onCreate: (data: PrescriptionFormData) => Promise<void>;
}

const emptyMedication = {
  name: "",
  dcb: "",
  pharmaceuticalForm: "",
  concentration: "",
  dosage: "",
  administrationRoute: "",
  treatmentDuration: "",
  quantity: "",
  additionalInstructions: "",
};

const defaultFormValues: PrescriptionFormValues = {
  patientId: "",
  scope: "ODONTOLOGICAL",
  category: "SIMPLE",
  title: "",
  content: "",
  medications: [emptyMedication],
  additionalInstructions: "",
  observations: "",
  supplementarySection: {
    additionalGuidance: "",
    observations: "",
    rest: "",
    diet: "",
    adverseReactions: "",
    notes: "",
  },
  requiresTwoCopies: false,
  includePatientAddress: false,
  controlledCategory: "",
  issuePlace: "",
  professionalOverride: {
    displayName: "",
    councilLabel: "",
    specialty: "",
    email: "",
    phone: "",
    signatureLabel: "",
  },
};

const CheckboxField = ({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  label: string;
  hint: string;
}) => (
  <label className="flex items-start gap-3 rounded-lg border border-neutral-200 px-3 py-2 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-900"
    />
    <span className="space-y-0.5">
      <span className="block text-sm font-medium text-neutral-900">{label}</span>
      <span className="block text-xs text-neutral-500">{hint}</span>
    </span>
  </label>
);

function PrescriptionEditor({ patients, onCreate }: PrescriptionEditorProps) {
  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PrescriptionFormValues, undefined, PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medications",
  });

  const category = watch("category");
  const watchedMedications = watch("medications") ?? [];

  const onSubmit = async (data: PrescriptionFormData) => {
    const medications = data.medications.filter(
      (medication) => medication.name.trim().length > 0
    );

    await onCreate({
      ...data,
      medications,
      requiresTwoCopies: data.requiresTwoCopies || data.category === "CONTROLLED",
      controlledCategory:
        data.category === "CONTROLLED" ? data.controlledCategory : undefined,
    });

    reset(defaultFormValues);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Nova Receita</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-3">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="Categoria">
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIMPLE">Receita simples</SelectItem>
                      <SelectItem value="ANTIBIOTIC">Antibiotico</SelectItem>
                      <SelectItem value="CONTROLLED">Controlado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Titulo do modelo">
              <Input
                placeholder="Ex: Receituario odontologico"
                {...register("title")}
              />
            </FormField>

            <FormField
              label="Cidade da emissao"
              error={errors.issuePlace}
            >
              <Input placeholder="Ex: Sao Paulo" {...register("issuePlace")} />
            </FormField>
          </div>

          {category === "CONTROLLED" ? (
            <FormField
              label="Categoria de controle"
              error={errors.controlledCategory}
            >
              <Input
                placeholder="Ex: B1, B2 ou controle especial"
                {...register("controlledCategory")}
              />
            </FormField>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Controller
              control={control}
              name="requiresTwoCopies"
              render={({ field }) => (
                <CheckboxField
                  checked={Boolean(field.value)}
                  onChange={field.onChange}
                  label="Emitir em duas vias"
                  hint="Duplica o layout do DOCX e marca o documento para fluxo especial."
                />
              )}
            />
            <Controller
              control={control}
              name="includePatientAddress"
              render={({ field }) => (
                <CheckboxField
                  checked={Boolean(field.value)}
                  onChange={field.onChange}
                  label="Incluir endereco do paciente"
                  hint="Mostra o endereco na area de identificacao quando necessario."
                />
              )}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-neutral-200 p-4 bg-neutral-50/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Medicamentos estruturados
                </p>
                <p className="text-xs text-neutral-500">
                  Use estes campos para o receituario odontologico padronizado.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => append({ ...emptyMedication })}
              >
                <Plus className="h-4 w-4" />
                Medicamento
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-neutral-900">
                      Medicamento {index + 1}
                    </p>
                    {fields.length > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      label="Nome do medicamento"
                      error={errors.medications?.[index]?.name}
                    >
                      <Input
                        placeholder="Ex: Amoxicilina"
                        {...register(`medications.${index}.name`)}
                      />
                    </FormField>
                    <FormField label="DCB">
                      <Input
                        placeholder="Denominacao comum brasileira"
                        {...register(`medications.${index}.dcb`)}
                      />
                    </FormField>
                    <FormField label="Forma farmaceutica">
                      <Input
                        placeholder="Ex: Capsulas"
                        {...register(`medications.${index}.pharmaceuticalForm`)}
                      />
                    </FormField>
                    <FormField label="Concentracao">
                      <Input
                        placeholder="Ex: 500 mg"
                        {...register(`medications.${index}.concentration`)}
                      />
                    </FormField>
                    <FormField label="Via de administracao">
                      <Input
                        placeholder="Ex: Oral"
                        {...register(`medications.${index}.administrationRoute`)}
                      />
                    </FormField>
                    <FormField label="Duracao">
                      <Input
                        placeholder="Ex: 7 dias"
                        {...register(`medications.${index}.treatmentDuration`)}
                      />
                    </FormField>
                    <FormField label="Quantidade">
                      <Input
                        placeholder="Ex: 21 capsulas"
                        {...register(`medications.${index}.quantity`)}
                      />
                    </FormField>
                    <FormField label="Posologia">
                      <Textarea
                        rows={3}
                        placeholder="Ex: Tomar 1 capsula de 8/8h apos as refeicoes."
                        {...register(`medications.${index}.dosage`)}
                      />
                    </FormField>
                  </div>

                  <FormField label="Orientacoes adicionais">
                    <Textarea
                      rows={2}
                      placeholder="Observacoes especificas deste medicamento."
                      {...register(`medications.${index}.additionalInstructions`)}
                    />
                  </FormField>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                label="Prescricao livre"
                error={errors.content}
                required={
                  !watchedMedications.some(
                    (item) => (item?.name ?? "").trim().length > 0
                  )
                }
              >
              <Textarea
                rows={5}
                placeholder="Use para trechos livres ou para receitas legadas."
                {...register("content")}
              />
            </FormField>

            <div className="space-y-3">
              <FormField label="Orientacoes gerais">
                <Textarea
                  rows={2}
                  placeholder="Ex: Ingerir bastante agua durante o tratamento."
                  {...register("additionalInstructions")}
                />
              </FormField>
              <FormField label="Observacoes">
                <Textarea
                  rows={2}
                  placeholder="Ex: Reavaliar em 5 dias."
                  {...register("observations")}
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Orientacoes complementares">
              <Textarea
                rows={2}
                placeholder="Orientacoes extras para o verso ou secao complementar."
                {...register("supplementarySection.additionalGuidance")}
              />
            </FormField>
            <FormField label="Observacoes clinicas">
              <Textarea
                rows={2}
                placeholder="Observacoes complementares do quadro clinico."
                {...register("supplementarySection.observations")}
              />
            </FormField>
            <FormField label="Repouso">
              <Textarea rows={2} {...register("supplementarySection.rest")} />
            </FormField>
            <FormField label="Dieta">
              <Textarea rows={2} {...register("supplementarySection.diet")} />
            </FormField>
            <FormField label="Reacoes adversas">
              <Textarea
                rows={2}
                {...register("supplementarySection.adverseReactions")}
              />
            </FormField>
            <FormField label="Anotacoes extras">
              <Textarea rows={2} {...register("supplementarySection.notes")} />
            </FormField>
          </div>

          <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Dados profissionais opcionais
              </p>
              <p className="text-xs text-neutral-500">
                Use somente quando precisar sobrescrever os dados padrao da clinica.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="Nome exibido">
                <Input {...register("professionalOverride.displayName")} />
              </FormField>
              <FormField label="Conselho profissional">
                <Input
                  placeholder="Ex: CRO-SP 12345"
                  {...register("professionalOverride.councilLabel")}
                />
              </FormField>
              <FormField label="Especialidade">
                <Input {...register("professionalOverride.specialty")} />
              </FormField>
              <FormField label="Telefone">
                <Input {...register("professionalOverride.phone")} />
              </FormField>
              <FormField label="E-mail">
                <Input {...register("professionalOverride.email")} />
              </FormField>
              <FormField label="Rotulo da assinatura">
                <Input
                  placeholder="Ex: Assinatura e carimbo"
                  {...register("professionalOverride.signatureLabel")}
                />
              </FormField>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              type="submit"
              className="gap-2 w-full sm:w-auto"
              disabled={isSubmitting}
            >
              <FileText className="h-4 w-4" />
              {isSubmitting ? "Salvando..." : "Salvar Receita"}
            </Button>
            <Button type="button" variant="outline" className="gap-2" disabled>
              <Download className="h-4 w-4" />
              DOCX disponivel apos salvar
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

const getPrescriptionBadgeLabel = (prescription: Prescription) => {
  if (prescription.details.category === "CONTROLLED") {
    return prescription.details.controlledCategory
      ? `Controlado ${prescription.details.controlledCategory}`
      : "Controlado";
  }
  if (prescription.details.category === "ANTIBIOTIC") {
    return "Antibiotico";
  }
  return "Odonto";
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
            <h2 className="text-base font-semibold text-neutral-900 mb-1">
              Acesso Restrito
            </h2>
            <p className="text-sm text-neutral-400">
              O modulo de receituario e exclusivo para dentistas e administradores.
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
      .map((chunk) => chunk[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const handleCreatePrescription = async (data: PrescriptionFormData) => {
    try {
      const created = await createPrescription(data);
      setPrescriptions((current) => [created, ...current]);
      addToast({
        title: "Receita salva",
        description: "A receita foi salva com sucesso.",
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
        description: `Receita de ${prescription.patient.name} exportada com sucesso.`,
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
            Gere prescricoes profissionais com layout odontologico em DOCX.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr,0.95fr] gap-4">
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
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="h-20 animate-pulse bg-neutral-100 rounded-md" />
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
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px] bg-neutral-100 text-neutral-500">
                          {getInitials(prescription.patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-neutral-900 block">
                          {prescription.patient.name}
                        </span>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(prescription.createdAt)}
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary">
                            {getPrescriptionBadgeLabel(prescription)}
                          </Badge>
                          {prescription.details.requiresTwoCopies ? (
                            <Badge variant="secondary">2 vias</Badge>
                          ) : null}
                          {prescription.details.medications.length > 0 ? (
                            <Badge variant="secondary">
                              {prescription.details.medications.length} item(ns)
                            </Badge>
                          ) : null}
                        </div>
                      </div>
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
                            description:
                              "A arquitetura ja ficou preparada para PDF e assinatura digital.",
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
