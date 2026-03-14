import { z } from 'zod';

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const optionalString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().min(1).optional());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL e obrigatoria.'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres.'),
  JWT_REFRESH_SECRET: optionalString,
  JWT_ISSUER: optionalString,
  JWT_AUDIENCE: optionalString,
  JWT_ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(10).max(15).default(15),
  JWT_REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(60).default(30),
  REFRESH_TOKEN_HASH_PEPPER: z.string().default(''),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(120).default(30),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000,http://127.0.0.1:3000'),
  CORS_CREDENTIALS: booleanFromEnv.default(true),
  CORS_ALLOW_NO_ORIGIN: booleanFromEnv.default(true),
  BODY_SIZE_LIMIT: z.string().default('1mb'),
  TRUST_PROXY: z.string().default('false'),
  AUTH_LOGIN_MAX_ATTEMPTS_PER_ACCOUNT: z.coerce.number().int().min(3).max(20).default(5),
  AUTH_LOGIN_BLOCK_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
  AUTH_REQUIRE_MFA_FOR_ADMIN: booleanFromEnv.default(false),
  AUTH_VALIDATE_SESSION_ON_REQUEST: booleanFromEnv.default(false),
  AUTH_REFRESH_COOKIE_ENABLED: booleanFromEnv.default(true),
  AUTH_EXPOSE_REFRESH_TOKEN_IN_BODY: booleanFromEnv.default(false),
  AUTH_REFRESH_COOKIE_NAME: z.string().min(4).default('de_refresh_token'),
  AUTH_REFRESH_COOKIE_SECURE: booleanFromEnv.default(true),
  AUTH_REFRESH_COOKIE_SAMESITE: z
    .enum(['strict', 'lax', 'none'])
    .default('lax'),
  AUTH_REFRESH_COOKIE_DOMAIN: optionalString,
  RATE_LIMIT_LOGIN_WINDOW_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
  RATE_LIMIT_LOGIN_MAX_REQUESTS: z.coerce.number().int().min(3).max(30).default(10),
  RATE_LIMIT_REFRESH_WINDOW_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
  RATE_LIMIT_REFRESH_MAX_REQUESTS: z.coerce.number().int().min(5).max(120).default(30),
  RATE_LIMIT_FORGOT_WINDOW_MINUTES: z.coerce.number().int().min(5).max(180).default(60),
  RATE_LIMIT_FORGOT_MAX_REQUESTS: z.coerce.number().int().min(1).max(20).default(5),
  RATE_LIMIT_RESET_WINDOW_MINUTES: z.coerce.number().int().min(5).max(180).default(60),
  RATE_LIMIT_RESET_MAX_REQUESTS: z.coerce.number().int().min(1).max(30).default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const messages = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Configuracao de ambiente invalida: ${messages}`);
}

const parseCorsOrigins = (origins: string): string[] => {
  const parsedOrigins = origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (parsedOrigins.length === 0) {
    throw new Error('CORS_ORIGIN deve informar ao menos uma origem confiavel.');
  }

  if (parsedOrigins.includes('*')) {
    throw new Error('CORS_ORIGIN nao permite wildcard ("*").');
  }

  for (const origin of parsedOrigins) {
    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      throw new Error(`Origem CORS invalida: "${origin}". Use formato http(s)://host`);
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`Origem CORS invalida: "${origin}". Apenas http/https sao permitidos.`);
    }
  }

  return parsedOrigins;
};

const parseTrustProxy = (value: string): string | number | boolean => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }
  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  return value;
};

export const env = {
  ...parsed.data,
  JWT_REFRESH_SECRET: parsed.data.JWT_REFRESH_SECRET ?? parsed.data.JWT_SECRET,
  JWT_ACCESS_TOKEN_EXPIRES_IN: `${parsed.data.JWT_ACCESS_TOKEN_TTL_MINUTES}m`,
  JWT_REFRESH_TOKEN_EXPIRES_IN: `${parsed.data.JWT_REFRESH_TOKEN_TTL_DAYS}d`,
  AUTH_REFRESH_COOKIE_SECURE:
    parsed.data.NODE_ENV === 'production'
      ? parsed.data.AUTH_REFRESH_COOKIE_SECURE
      : false,
};

export const corsOrigins = parseCorsOrigins(env.CORS_ORIGIN);
export const trustProxy = parseTrustProxy(env.TRUST_PROXY);

if (
  env.AUTH_REFRESH_COOKIE_SAMESITE === 'none' &&
  !env.AUTH_REFRESH_COOKIE_SECURE
) {
  throw new Error(
    'AUTH_REFRESH_COOKIE_SAMESITE=none exige AUTH_REFRESH_COOKIE_SECURE=true.',
  );
}
