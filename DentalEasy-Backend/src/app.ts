import cors from 'cors';
import express from 'express';
import { corsOrigins } from './config/env';
import { authMiddleware } from './Http/middlewares/auth.middleware';
import { errorMiddleware } from './Http/middlewares/error.middleware';
import { authRoutes } from './Http/routes/auth.routes';
import { apiRoutes } from './Http/routes';

const app = express();

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api', authMiddleware, apiRoutes);

app.use(errorMiddleware);

export { app };
