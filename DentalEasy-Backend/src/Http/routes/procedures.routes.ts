import { Router } from 'express';
import {
  createProcedureSchema,
  listProceduresQuerySchema,
  toggleProcedureSchema,
  updateProcedureSchema,
} from '../../Application/DTOs';
import { container } from '../../container';
import { authorizeRoles } from '../middlewares/auth.middleware';
import { getUserContext } from '../utils/user-context';
import { z } from 'zod';

const router = Router();
const idParamSchema = z.object({ id: z.string().uuid() });

router.get(
  '/',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const query = listProceduresQuerySchema.parse(req.query);
      const data = await container.proceduresApiUseCases.listProcedures(
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
  '/:id',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const data = await container.proceduresApiUseCases.getProcedureById(user, id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const payload = createProcedureSchema.parse(req.body);
      const data = await container.proceduresApiUseCases.createProcedure(
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
  '/:id',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const payload = updateProcedureSchema.parse(req.body);
      const data = await container.proceduresApiUseCases.updateProcedure(
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

router.patch(
  '/:id/toggle',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const payload = toggleProcedureSchema.parse(req.body);
      const data = await container.proceduresApiUseCases.toggleProcedure(
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
  '/:id',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      await container.proceduresApiUseCases.deleteProcedure(user, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export { router as proceduresRoutes };
