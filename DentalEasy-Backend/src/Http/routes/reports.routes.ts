import { Router } from 'express';
import { reportsPeriodQuerySchema } from '../../Application/DTOs';
import { container } from '../../container';
import { authorizeRoles } from '../middlewares/auth.middleware';
import { getUserContext } from '../utils/user-context';

const router = Router();

router.get(
  '/financial',
  authorizeRoles(['ADMIN', 'DENTIST', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const query = reportsPeriodQuerySchema.parse(req.query);
      const data = await container.reportsApiUseCases.getFinancialReport(
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
  '/procedures',
  authorizeRoles(['ADMIN', 'DENTIST', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const query = reportsPeriodQuerySchema.parse(req.query);
      const data = await container.reportsApiUseCases.getProceduresReport(
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
  '/patients',
  authorizeRoles(['ADMIN', 'DENTIST', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const query = reportsPeriodQuerySchema.parse(req.query);
      const data = await container.reportsApiUseCases.getPatientsReport(
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
  '/team',
  authorizeRoles(['ADMIN', 'DENTIST', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const query = reportsPeriodQuerySchema.parse(req.query);
      const data = await container.reportsApiUseCases.getTeamReport(user, query);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

export { router as reportsRoutes };
