import { z } from 'zod';

export const reportsPeriodQuerySchema = z.object({
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
});

export type ReportsPeriodQueryDTO = z.infer<typeof reportsPeriodQuerySchema>;
