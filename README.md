# DentalEasy

Sistema de gestao odontologica com frontend Next.js e backend Node.js/Express, com autenticacao JWT, RBAC e isolamento por organizacao.

## Stack

- Frontend: Next.js (App Router) + TypeScript + Tailwind
- Backend: Node.js + Express + TypeScript + Prisma
- Banco: PostgreSQL
- Auth: JWT (`/api/auth/login`, `/api/auth/me`)

## Estrutura do repositorio

- Frontend: `./src`
- Backend: `./DentalEasy-Backend`
- Documentacao tecnica: `./docs`

## Pre-requisitos locais

- Node.js 20+ (recomendado: 22.x)
- npm
- PostgreSQL ativo em `localhost:5432`

## Passo a passo (Windows PowerShell)

### 1. Backend

```powershell
cd DentalEasy-Backend
npm install
Copy-Item .env.example .env
```

Edite o arquivo `.env` e ajuste ao menos:

- `DATABASE_URL` com usuario/senha corretos do seu PostgreSQL.
- `JWT_SECRET` e `JWT_REFRESH_SECRET` (minimo 32 caracteres).

Exemplo de `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/dentaleasy?schema=public"
```

Se o banco `dentaleasy` ainda nao existir, crie:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE dentaleasy;"
```

Rode Prisma:

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Suba a API:

```powershell
npm run dev
```

Valide:

- Health: `http://localhost:3001/health`

### 2. Frontend

Em outro terminal, na raiz do projeto:

```powershell
npm install
```

Crie ou ajuste `.env.local` na raiz:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Suba o frontend:

```powershell
npm run dev
```

Valide:

- UI: `http://localhost:3000`

## Credenciais seed (corretas)

- `admin@teste.com` / `Admin#Dental2026`
- `dentista@teste.com` / `Dentista#Dental2026`
- `secretaria@teste.com` / `Secretaria#Dental2026`

Importante:

- O frontend pode exibir credenciais antigas em atalhos de login rapido.
- Se isso ocorrer, digite manualmente as credenciais acima.

## Erros comuns e como resolver

- `Configuracao de ambiente invalida: DATABASE_URL: Required; JWT_SECRET: Required`
  - Rode o backend dentro de `DentalEasy-Backend`.
  - Garanta que `.env` existe e foi copiado de `.env.example`.

- `P1000 Authentication failed`
  - Usuario/senha do PostgreSQL na `DATABASE_URL` estao incorretos.

- `P1003 The introspected database does not exist`
  - O banco `dentaleasy` nao existe ainda. Crie o banco e rode migrate novamente.

## Referencias

- Guia backend: [DentalEasy-Backend/README.md](DentalEasy-Backend/README.md)
- Handoff tecnico: [docs/HANDOFF_TECNICO_DENTALEASY.md](docs/HANDOFF_TECNICO_DENTALEASY.md)
