import cors from 'cors';
import express from 'express';
import { authMiddleware } from './Http/middlewares/auth.middleware';
import { errorMiddleware } from './Http/middlewares/error.middleware';
import { apiRoutes } from './Http/routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', authMiddleware, apiRoutes);

app.use(errorMiddleware);

export { app };
