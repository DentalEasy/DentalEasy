"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { FormField } from "@/components/ui/form-field";
import { appointmentSchema, type AppointmentFormData } from "@/lib/schemas";

interface SelectOption {
  id: string;
  name: string;
}

const procedures = [
  "Limpeza",
  "Restauracao",
  "Extracao",
  "Canal",
  "Clareamento",
  "Implante",
  "Ortodontia",
  "Protese",
  "Avaliacao",
  "Outro",
];

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: SelectOption[];
  dentists: SelectOption[];
  onSubmit?: (data: AppointmentFormData) => Promise<void> | void;
}

export function NewAppointmentModal({
  open,
  onOpenChange,
  patients,
  dentists,
  onSubmit,
}: NewAppointmentModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { sendWhatsApp: true },
  });

  const handleFormSubmit = async (data: AppointmentFormData) => {
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
            <CalendarDays className="h-4 w-4 text-neutral-400" />
            Novo Agendamento
          </DialogTitle>
          <DialogDescription>
            Agende uma consulta para um paciente.
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
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Dentista" error={errors.dentistId} required>
              <Controller
                control={control}
                name="dentistId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dentists.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Data" error={errors.date} required>
              <Input type="date" {...register("date")} />
            </FormField>
            <FormField label="Inicio" error={errors.startTime} required>
              <Input type="time" {...register("startTime")} />
            </FormField>
            <FormField label="Termino" error={errors.endTime} required>
              <Input type="time" {...register("endTime")} />
            </FormField>
          </div>

          <FormField label="Procedimento" error={errors.procedure} required>
            <Controller
              control={control}
              name="procedure"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o procedimento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {procedures.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Observacoes" error={errors.notes}>
            <Input placeholder="Notas adicionais..." {...register("notes")} />
          </FormField>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sendWhatsApp"
              className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500/20"
              {...register("sendWhatsApp")}
            />
            <label htmlFor="sendWhatsApp" className="text-sm text-neutral-600">
              Enviar lembrete via WhatsApp
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Agendar Consulta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
