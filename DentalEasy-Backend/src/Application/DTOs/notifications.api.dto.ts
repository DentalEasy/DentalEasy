import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  read: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === 'true',
    ),
  type: z
    .enum(['APPOINTMENT', 'PAYMENT', 'INVENTORY', 'SYSTEM', 'TREATMENT'])
    .optional(),
});

export type ListNotificationsQueryDTO = z.infer<
  typeof listNotificationsQuerySchema
>;
