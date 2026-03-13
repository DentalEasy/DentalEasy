import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

export const listAppointmentsQuerySchema = z.object({
  date: z.string().trim().optional(),
  dentistId: z.string().uuid().optional(),
  status: z.enum(['CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED']).optional(),
  patientId: z.string().uuid().optional(),
});

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  dentistId: z.string().uuid(),
  title: optionalString,
  procedure: optionalString,
  notes: optionalString,
  date: z.coerce.date(),
  startTime: z.string().trim().regex(timeRegex, 'Horario de inicio invalido.'),
  endTime: z.string().trim().regex(timeRegex, 'Horario de termino invalido.'),
  status: z.enum(['CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED']).optional(),
});

export const updateAppointmentSchema = createAppointmentSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizacao.',
  });

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED']),
});

export type ListAppointmentsQueryDTO = z.infer<typeof listAppointmentsQuerySchema>;
export type CreateAppointmentDTO = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentDTO = z.infer<typeof updateAppointmentSchema>;
export type UpdateAppointmentStatusDTO = z.infer<
  typeof updateAppointmentStatusSchema
>;
