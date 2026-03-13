import { Router } from 'express';
import {
  createInventoryItemSchema,
  listInventoryItemsQuerySchema,
  restockInventoryItemSchema,
  updateInventoryItemSchema,
} from '../../Application/DTOs';
import { container } from '../../container';
import { authorizeRoles } from '../middlewares/auth.middleware';
import { getUserContext } from '../utils/user-context';
import { z } from 'zod';

const router = Router();
const idParamSchema = z.object({ id: z.string().uuid() });

router.get(
  '/items',
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const query = listInventoryItemsQuerySchema.parse(req.query);
      const data = await container.inventoryApiUseCases.listInventoryItems(
        user,
        query,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/items/:id',
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const data = await container.inventoryApiUseCases.getInventoryItemById(
        user,
        id,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/items',
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const payload = createInventoryItemSchema.parse(req.body);
      const data = await container.inventoryApiUseCases.createInventoryItem(
        user,
        payload,
      );
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/items/:id',
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const payload = updateInventoryItemSchema.parse(req.body);
      const data = await container.inventoryApiUseCases.updateInventoryItem(
        user,
        id,
        payload,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/items/:id',
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      await container.inventoryApiUseCases.deleteInventoryItem(user, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/items/:id/restock',
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const payload = restockInventoryItemSchema.parse(req.body);
      const data = await container.inventoryApiUseCases.restockInventoryItem(
        user,
        id,
        payload,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

export { router as inventoryRoutes };
