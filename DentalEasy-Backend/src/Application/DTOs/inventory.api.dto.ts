import { z } from 'zod';

const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

export const listInventoryItemsQuerySchema = z.object({
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === 'true',
    ),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  lowStock: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === 'true',
    ),
});

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(2),
  sku: optionalString,
  category: z.string().trim().min(2),
  unit: z.string().trim().min(1),
  currentStock: z.coerce.number().nonnegative(),
  minStock: z.coerce.number().nonnegative(),
  cost: z.coerce.number().nonnegative(),
  supplier: optionalString,
  active: z.boolean().optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizacao.',
  });

export const restockInventoryItemSchema = z.object({
  quantity: z.coerce.number().positive(),
  cost: z.coerce.number().nonnegative().optional(),
  notes: optionalString,
  date: z.coerce.date().optional(),
});

export type ListInventoryItemsQueryDTO = z.infer<
  typeof listInventoryItemsQuerySchema
>;
export type CreateInventoryItemDTO = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemDTO = z.infer<typeof updateInventoryItemSchema>;
export type RestockInventoryItemDTO = z.infer<typeof restockInventoryItemSchema>;
