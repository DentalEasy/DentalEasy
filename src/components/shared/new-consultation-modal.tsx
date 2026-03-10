"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Textarea,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui";
import { FormField } from "@/components/ui/form-field";
import { consultationSchema, type ConsultationFormData } from "@/lib/schemas";

const mockPatients = [
  { id: "1", name: "Maria Silva" },
  { id: "2", name: "João Santos" },
  { id: "3", name: "Ana Oliveira" },
];

const consultationTypes = [
  { value: "PROCEDURE", label: "Procedimento" },
  { value: "ANAMNESIS", label: "Anamnese" },
  { value: "NOTE", label: "Anotação" },
] as const;

interface NewConsultationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: ConsultationFormData) => void;
}

export function NewConsultationModal({ open, onOpenChange, onSubmit }: NewConsultationModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
  });

  const handleFormSubmit = (data: ConsultationFormData) => {
    onSubmit?.(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-neutral-400" />
            Novo Registro Clínico
          </DialogTitle>
          <DialogDescription>
            Adicione um registro ao prontuário do paciente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Paciente" error={errors.patientId} required>
              <Controller
                control={control}
                name="patientId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
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

            <FormField label="Tipo de registro" error={errors.type} required>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {consultationTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <FormField label="Título" error={errors.title} required>
            <Input placeholder="Ex: Restauração Molar 36" {...register("title")} />
          </FormField>

          <FormField label="Descrição detalhada" error={errors.description} required>
            <Textarea
              placeholder="Descreva o procedimento, observações clínicas, anamnese..."
              rows={5}
              {...register("description")}
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Registro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
