# DentalEasy Backend - Entrega Final

Backend HTTP do DentalEasy com arquitetura em camadas (Domains/Application/Infrastructure/Http), Prisma e PostgreSQL.

## 1. Stack

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT para autenticacao
- Zod para validacao de entrada

## 2. Caracteristicas tecnicas

- Auth: `POST /api/auth/login`, `GET /api/auth/me`
- RBAC: `ADMIN`, `SECRETARY`, `DENTIST`
- Multi-tenant: operacoes filtradas por `organizationId` do token
- Tratamento de erros centralizado em middleware HTTP
- DTOs de entrada com Zod em `src/Application/DTOs`

## 3. Estrutura principal

- `src/app.ts`: configuracao do Express e middlewares
- `src/container.ts`: injecao de dependencias/use cases
- `src/Http/routes`: rotas HTTP
- `src/Application`: DTOs e use cases
- `src/Domains`: servicos/entidades de dominio (legado + suporte)
- `src/Infrastructure`: persistencia Prisma e adaptadores externos
- `prisma/schema.prisma`: modelo de dados
- `prisma/migrations`: historico de migrations
- `prisma/seed.ts`: seed oficial para ambiente local

## 4. Setup local

### 4.1 Pre-requisitos

- Node.js 20+
- npm 10+
- PostgreSQL ativo

### 4.2 Instalacao

```bash
npm install
```

Copie ambiente:

- Linux/macOS:
```bash
cp .env.example .env
```

- Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

### 4.3 Banco e seed

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4.4 Subir servidor

```bash
npm run dev
```

Healthcheck:
- `GET /health`

## 5. Variaveis de ambiente

Obrigatorias:
- `DATABASE_URL`
- `JWT_SECRET` (>= 16 chars)

Recomendadas:
- `PORT` (padrao `3001`)
- `JWT_EXPIRES_IN` (padrao `8h`)
- `CORS_ORIGIN` (lista separada por virgula)

Referencia: [DentalEasy-Backend/.env.example](/c:/Users/guilh/OneDrive/Documentos/DentalEasy/DentalEasy-Backend/.env.example)

## 6. Scripts disponiveis

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:deploy`
- `npm run prisma:seed`
- `npm run prisma:studio`

## 7. Credenciais seed

- `admin@teste.com` / `admin`
- `dentista@teste.com` / `dentista`
- `secretaria@teste.com` / `secretaria`

## 8. Modulos e endpoints (resumo)

### Base
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users/dentists`

### Patients
- `GET /api/patients`
- `GET /api/patients/:id`
- `GET /api/patients/:id/medical-records`
- `POST /api/patients`
- `PATCH /api/patients/:id`
- `DELETE /api/patients/:id`

### Appointments
- `GET /api/appointments`
- `GET /api/appointments/:id`
- `POST /api/appointments`
- `PATCH /api/appointments/:id`
- `PATCH /api/appointments/:id/status`
- `DELETE /api/appointments/:id`

### Medical Records
- `GET /api/medical-records`
- `POST /api/medical-records`
- `PATCH /api/medical-records/:id`
- `DELETE /api/medical-records/:id`

### Prescriptions
- `GET /api/prescriptions`
- `POST /api/prescriptions`
- `GET /api/prescriptions/:id/export?format=docx`

### Financial Records
- `GET /api/financial-records`
- `GET /api/financial-records/:id`
- `POST /api/financial-records`
- `PATCH /api/financial-records/:id`
- `DELETE /api/financial-records/:id`

### Payments
- `GET /api/payments`
- `GET /api/payments/:id`
- `POST /api/payments`
- `POST /api/payments/:id/settle`
- `PATCH /api/payments/:id`
- `GET /api/payments/:id/receipt`

### Procedures
- `GET /api/procedures`
- `GET /api/procedures/:id`
- `POST /api/procedures`
- `PATCH /api/procedures/:id`
- `DELETE /api/procedures/:id`
- `PATCH /api/procedures/:id/toggle`

### Treatment Plans
- `GET /api/treatment-plans`
- `GET /api/treatment-plans/:id`
- `POST /api/treatment-plans`
- `PATCH /api/treatment-plans/:id`
- `PATCH /api/treatment-plans/:id/status`
- `DELETE /api/treatment-plans/:id`

### Inventory
- `GET /api/inventory/items`
- `GET /api/inventory/items/:id`
- `POST /api/inventory/items`
- `PATCH /api/inventory/items/:id`
- `DELETE /api/inventory/items/:id`
- `POST /api/inventory/items/:id/restock`

### Notifications
- `GET /api/notifications`
- `GET /api/notifications/:id`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:id`

### Settings
- `GET /api/settings/organization`
- `PATCH /api/settings/organization`
- `GET /api/settings/team`
- `POST /api/settings/team`
- `PATCH /api/settings/team/:id`
- `GET /api/settings/notifications`
- `PATCH /api/settings/notifications`
- `GET /api/settings/plan`

### Dashboard
- `GET /api/dashboard`

### Reports
- `GET /api/reports/financial`
- `GET /api/reports/procedures`
- `GET /api/reports/patients`
- `GET /api/reports/team`

## 9. Migrations aplicadas

- `20260311120000_auth_foundation`
- `20260311180000_stage3_core_modules`
- `20260311210000_stage4_financial_block`
- `20260312120000_stage5_support_modules`

## 10. Notas de compatibilidade e limites

- Rotas legadas em portugues foram preservadas (`/api/pacientes`, `/api/agendamento`, etc.) para compatibilidade historica.
- Integracoes externas reais ainda nao estao fechadas para producao (escopo local/seed).
- O backend atual esta pronto para execucao local e continuidade tecnica no mesmo padrao DDD.

## 11. Referencias

- README raiz: [README.md](/c:/Users/guilh/OneDrive/Documentos/DentalEasy/README.md)
- Handoff tecnico: [docs/HANDOFF_TECNICO_DENTALEASY.md](/c:/Users/guilh/OneDrive/Documentos/DentalEasy/docs/HANDOFF_TECNICO_DENTALEASY.md)
