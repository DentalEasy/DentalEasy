import { Prisma } from '@prisma/client';
import {
  CreateInventoryItemDTO,
  ListInventoryItemsQueryDTO,
  RestockInventoryItemDTO,
  UpdateInventoryItemDTO,
} from '../DTOs';
import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { NotFoundError } from '../../shared/errors';
import { UserContext } from '../../shared/types';
import { createNotification } from './notification-events';

export interface ApiInventoryItem {
  id: string;
  organizationId: string;
  name: string;
  sku?: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  cost: number;
  supplier?: string;
  active: boolean;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiInventoryMovement {
  id: string;
  inventoryItemId: string;
  type: 'RESTOCK' | 'ADJUSTMENT';
  quantity: number;
  cost?: number;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface ApiInventoryRestockResponse {
  item: ApiInventoryItem;
  movement: ApiInventoryMovement;
}

const toAmount = (value: { toNumber(): number } | number): number =>
  typeof value === 'number' ? value : value.toNumber();

const mapInventoryItem = (record: {
  id: string;
  organizationId: string;
  name: string;
  sku: string | null;
  category: string;
  unit: string;
  currentStock: { toNumber(): number } | number;
  minStock: { toNumber(): number } | number;
  cost: { toNumber(): number } | number;
  supplier: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ApiInventoryItem => {
  const currentStock = toAmount(record.currentStock);
  const minStock = toAmount(record.minStock);
  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    sku: record.sku ?? undefined,
    category: record.category,
    unit: record.unit,
    currentStock,
    minStock,
    cost: toAmount(record.cost),
    supplier: record.supplier ?? undefined,
    active: record.active,
    lowStock: currentStock <= minStock,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
};

const mapMovement = (record: {
  id: string;
  inventoryItemId: string;
  type: 'RESTOCK' | 'ADJUSTMENT';
  quantity: { toNumber(): number } | number;
  cost: { toNumber(): number } | number | null;
  notes: string | null;
  date: Date;
  createdAt: Date;
}): ApiInventoryMovement => ({
  id: record.id,
  inventoryItemId: record.inventoryItemId,
  type: record.type,
  quantity: toAmount(record.quantity),
  cost: record.cost == null ? undefined : toAmount(record.cost),
  notes: record.notes ?? undefined,
  date: record.date.toISOString(),
  createdAt: record.createdAt.toISOString(),
});

export class InventoryApiUseCases {
  async listInventoryItems(
    user: UserContext,
    query: ListInventoryItemsQueryDTO,
  ): Promise<ApiInventoryItem[]> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    const where: Prisma.InventoryItemWhereInput = {
      organizationId: user.organizationId,
    };

    if (query.active !== undefined) {
      where.active = query.active;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const records = await prisma.inventoryItem.findMany({
      where,
      orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }],
    });

    const mapped = records.map((record) => mapInventoryItem(record));
    if (query.lowStock) {
      return mapped.filter((item) => item.lowStock);
    }

    return mapped;
  }

  async getInventoryItemById(
    user: UserContext,
    inventoryItemId: string,
  ): Promise<ApiInventoryItem> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);
    const record = await this.findInventoryItemOrThrow(
      user.organizationId,
      inventoryItemId,
    );
    return mapInventoryItem(record);
  }

  async createInventoryItem(
    user: UserContext,
    dto: CreateInventoryItemDTO,
  ): Promise<ApiInventoryItem> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    const created = await prisma.inventoryItem.create({
      data: {
        organizationId: user.organizationId,
        name: dto.name,
        sku: dto.sku,
        category: dto.category,
        unit: dto.unit,
        currentStock: dto.currentStock,
        minStock: dto.minStock,
        cost: dto.cost,
        supplier: dto.supplier,
        active: dto.active ?? true,
      },
    });

    const mapped = mapInventoryItem(created);
    await this.syncLowStockNotification(mapped);
    return mapped;
  }

  async updateInventoryItem(
    user: UserContext,
    inventoryItemId: string,
    dto: UpdateInventoryItemDTO,
  ): Promise<ApiInventoryItem> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);
    const existing = await this.findInventoryItemOrThrow(
      user.organizationId,
      inventoryItemId,
    );

    const updated = await prisma.inventoryItem.update({
      where: { id: existing.id },
      data: {
        name: dto.name,
        sku: dto.sku,
        category: dto.category,
        unit: dto.unit,
        currentStock: dto.currentStock,
        minStock: dto.minStock,
        cost: dto.cost,
        supplier: dto.supplier,
        active: dto.active,
      },
    });

    const mapped = mapInventoryItem(updated);
    await this.syncLowStockNotification(mapped);
    return mapped;
  }

  async deleteInventoryItem(
    user: UserContext,
    inventoryItemId: string,
  ): Promise<void> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);
    const existing = await this.findInventoryItemOrThrow(
      user.organizationId,
      inventoryItemId,
    );
    await prisma.inventoryItem.delete({ where: { id: existing.id } });
  }

  async restockInventoryItem(
    user: UserContext,
    inventoryItemId: string,
    dto: RestockInventoryItemDTO,
  ): Promise<ApiInventoryRestockResponse> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);
    const existing = await this.findInventoryItemOrThrow(
      user.organizationId,
      inventoryItemId,
    );

    const nextStock = toAmount(existing.currentStock) + dto.quantity;
    const [updatedItem, movement] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: existing.id },
        data: {
          currentStock: nextStock,
          cost: dto.cost,
        },
      }),
      prisma.inventoryMovement.create({
        data: {
          organizationId: user.organizationId,
          inventoryItemId: existing.id,
          type: 'RESTOCK',
          quantity: dto.quantity,
          cost: dto.cost,
          notes: dto.notes,
          date: dto.date,
        },
      }),
    ]);

    const mappedItem = mapInventoryItem(updatedItem);
    await createNotification({
      organizationId: user.organizationId,
      type: 'INVENTORY',
      title: 'Reposicao de estoque',
      message: `${updatedItem.name}: +${dto.quantity} ${updatedItem.unit}.`,
      eventKey: `inventory-restock:${movement.id}`,
      link: '/inventory',
      metadata: {
        inventoryItemId: updatedItem.id,
        movementId: movement.id,
      },
    });
    await this.syncLowStockNotification(mappedItem);

    return {
      item: mappedItem,
      movement: mapMovement(movement),
    };
  }

  private async syncLowStockNotification(item: ApiInventoryItem): Promise<void> {
    if (!item.lowStock || !item.active) {
      return;
    }

    await createNotification({
      organizationId: item.organizationId,
      type: 'INVENTORY',
      title: 'Estoque baixo',
      message: `${item.name}: ${item.currentStock} ${item.unit} (minimo ${item.minStock}).`,
      eventKey: `inventory-low:${item.id}`,
      link: '/inventory',
      metadata: {
        inventoryItemId: item.id,
      },
    });
  }

  private async findInventoryItemOrThrow(
    organizationId: string,
    inventoryItemId: string,
  ) {
    const record = await prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        organizationId,
      },
    });

    if (!record) {
      throw new NotFoundError('Item de estoque nao encontrado.');
    }

    return record;
  }
}
