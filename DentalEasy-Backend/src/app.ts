import cors, { CorsOptions } from 'cors';
import express from 'express';
import helmet from 'helmet';
import { corsOrigins, env, trustProxy } from './config/env';
import { authMiddleware } from './Http/middlewares/auth.middleware';
import { requireJsonContentType } from './Http/middlewares/content-type.middleware';
import { errorMiddleware } from './Http/middlewares/error.middleware';
import { authRoutes } from './Http/routes/auth.routes';
import { apiRoutes } from './Http/routes';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', trustProxy);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

const corsConfiguration: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, env.CORS_ALLOW_NO_ORIGIN);
      return;
    }

    callback(null, corsOrigins.includes(origin));
  },
  credentials: env.CORS_CREDENTIALS,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  maxAge: 600,
  optionsSuccessStatus: 204,
};

app.use(
  cors(corsConfiguration),
);
app.options('*', cors(corsConfiguration));

app.use(requireJsonContentType);
app.use(express.json({ limit: env.BODY_SIZE_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.BODY_SIZE_LIMIT }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api', authMiddleware, apiRoutes);

app.use(errorMiddleware);

export { app };
