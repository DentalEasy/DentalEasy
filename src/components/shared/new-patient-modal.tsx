"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Textarea,
} from "@/components/ui";
import { FormField } from "@/components/ui/form-field";
import { patientSchema, type PatientFormData } from "@/lib/schemas";

interface NewPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: PatientFormData) => Promise<void> | void;
}

export function NewPatientModal({ open, onOpenChange, onSubmit }: NewPatientModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const handleFormSubmit = async (data: PatientFormData) => {
    try {
      await onSubmit?.(data);
      reset();
      onOpenChange(false);
    } catch {
      // parent handles error feedback
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-neutral-400" />
            Novo Paciente
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar um novo paciente na clínica.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Nome completo" error={errors.name} required>
              <Input placeholder="Maria Silva" {...register("name")} />
            </FormField>
            <FormField label="CPF" error={errors.cpf} required>
              <Input placeholder="123.456.789-00" {...register("cpf")} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Telefone" error={errors.phone} required>
              <Input placeholder="(17) 99999-9999" {...register("phone")} />
            </FormField>
            <FormField label="Data de nascimento" error={errors.birthDate} required>
              <Input type="date" {...register("birthDate")} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="E-mail" error={errors.email}>
              <Input type="email" placeholder="maria@email.com" {...register("email")} />
            </FormField>
            <FormField label="Endereço" error={errors.address}>
              <Input placeholder="Rua, número, bairro" {...register("address")} />
            </FormField>
          </div>

          {/* Medical Info */}
          <div className="border-t border-neutral-100 pt-4">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Informações Médicas</p>
            <div className="space-y-4">
              <FormField label="Alergias conhecidas" error={errors.allergies}>
                <Input placeholder="Ex: Penicilina, Dipirona..." {...register("allergies")} />
              </FormField>
              <FormField label="Observações médicas" error={errors.medicalNotes}>
                <Textarea
                  placeholder="Histórico relevante, condições pré-existentes..."
                  rows={3}
                  {...register("medicalNotes")}
                />
              </FormField>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Cadastrar Paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
