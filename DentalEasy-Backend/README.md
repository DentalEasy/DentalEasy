# DentalEasy Backend

Backend HTTP em Node.js + Express + TypeScript com Prisma/PostgreSQL para o contexto clínico do DentalEasy.

## Stack

- Node.js + Express
- TypeScript
- Prisma ORM + PostgreSQL
- JWT (access + refresh)
- Zod para validação

## Hardening implementado

- `helmet` ativo no bootstrap.
- `x-powered-by` desabilitado.
- CORS com allowlist explícita (`CORS_ORIGIN`), sem wildcard.
- Limite de payload em `express.json`/`urlencoded` (`BODY_SIZE_LIMIT`, padrão `1mb`).
- Validação de `Content-Type` JSON para rotas com body (retorna `415` quando inválido).
- Error handler com resposta segura em produção (sem stacktrace na resposta).
- Rate limit em rotas públicas sensíveis:
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
- Desaceleração progressiva no login.

## Autenticação

### Rotas principais

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions/:sessionId`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

### Política atual

- Access token curto (`JWT_ACCESS_TOKEN_TTL_MINUTES`, 10–15 min).
- Refresh token rotativo com hash em banco (`AuthSession.refreshTokenHash`).
- Reuso de refresh token detecta comprometimento e revoga a família de sessão.
- Logout revoga sessão no backend.
- Reset de senha revoga sessões ativas.
- Proteção adicional de brute force por conta:
  - `User.failedLoginAttempts`
  - `User.loginBlockedUntil`

## MFA (fundação)

Campos preparados no usuário:

- `mfaEnabled`
- `mfaSecretEncrypted`
- `mfaBackupCodesHash`
- `mfaEnrolledAt`

Feature flag:

- `AUTH_REQUIRE_MFA_FOR_ADMIN`

Quando habilitada, login de perfil administrativo exige segunda etapa (hook preparado; ver seção de limitações).

## Setup local

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Healthcheck:

- `GET /health`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm run test`
- `npm run start`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:deploy`
- `npm run prisma:seed`
- `npm run prisma:studio`

## Variáveis de ambiente

Use `.env.example` como referência. Principais grupos:

- Infra: `PORT`, `NODE_ENV`, `DATABASE_URL`, `TRUST_PROXY`
- JWT: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TOKEN_TTL_MINUTES`, `JWT_REFRESH_TOKEN_TTL_DAYS`, `JWT_ISSUER`, `JWT_AUDIENCE`
- Auth: `BCRYPT_ROUNDS`, `REFRESH_TOKEN_HASH_PEPPER`, `PASSWORD_RESET_TOKEN_TTL_MINUTES`
- CORS: `CORS_ORIGIN`, `CORS_CREDENTIALS`, `CORS_ALLOW_NO_ORIGIN`
- Cookie de refresh: `AUTH_REFRESH_COOKIE_*`
- Rate limit: `RATE_LIMIT_*`

## Seed local (credenciais)

- `admin@teste.com` / `Admin#Dental2026`
- `dentista@teste.com` / `Dentista#Dental2026`
- `secretaria@teste.com` / `Secretaria#Dental2026`

## Migration de segurança

Nova migration:

- `20260314143000_auth_hardening`

Inclui:

- tabela `AuthSession`
- tabela `PasswordResetToken`
- novos campos de segurança em `User` (MFA + brute-force)

## Limitações atuais importantes

- Rate limit usa store em memória (`express-rate-limit` padrão). Em múltiplas instâncias, usar store compartilhado (Redis) é recomendado para produção.
- MFA completo (TOTP + validação de segunda etapa) ainda não está implementado; apenas a fundação e o ponto de extensão foram preparados.
- Access token não é invalidado instantaneamente em toda request. A mitigação atual é: TTL curto + revogação server-side de sessões de refresh.
