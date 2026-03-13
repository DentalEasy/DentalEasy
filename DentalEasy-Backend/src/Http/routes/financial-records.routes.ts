import { Router } from 'express';
import {
  createFinancialRecordSchema,
  listFinancialRecordsQuerySchema,
  updateFinancialRecordSchema,
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
      const query = listFinancialRecordsQuerySchema.parse(req.query);
      const data = await container.financialRecordsApiUseCases.listFinancialRecords(
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
      const data = await container.financialRecordsApiUseCases.getFinancialRecordById(
        user,
        id,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.post('/', authorizeRoles(['ADMIN', 'SECRETARY']), async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const payload = createFinancialRecordSchema.parse(req.body);
    const data = await container.financialRecordsApiUseCases.createFinancialRecord(
      user,
      payload,
    );
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:id',
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const payload = updateFinancialRecordSchema.parse(req.body);
      const data = await container.financialRecordsApiUseCases.updateFinancialRecord(
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
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      await container.financialRecordsApiUseCases.deleteFinancialRecord(user, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export { router as financialRecordsRoutes };
