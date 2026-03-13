# DentalEasy - Entrega Final

Sistema de gestao odontologica com frontend Next.js e backend Node.js/Express, com autenticacao JWT, RBAC e isolamento multi-tenant por organizacao.

## 1. Visao geral

- Frontend: Next.js (App Router) + TypeScript + Tailwind + componentes UI locais
- Backend: Node.js + Express + TypeScript + Prisma
- Banco: PostgreSQL
- Autenticacao: JWT (`/api/auth/login`, `/api/auth/me`)
- Autorizacao: RBAC (`ADMIN`, `SECRETARY`, `DENTIST`)
- Tenant: todas as operacoes de negocio filtradas por `organizationId`

Contexto DDD de referencia:
- [ddd_clinica_context.readme.md](/c:/Users/guilh/OneDrive/Documentos/DentalEasy/ddd_clinica_context.readme.md)
- [DentalEasy-Backend/ddd_clinica_context.readme.md](/c:/Users/guilh/OneDrive/Documentos/DentalEasy/DentalEasy-Backend/ddd_clinica_context.readme.md)

## 2. Estrutura do repositorio

- Frontend: `./src`
- Backend: `./DentalEasy-Backend`
- Auditoria tecnica historica: `./AUDITORIA_BACKEND_DENTALEASY.md`
- Handoff tecnico final: `./docs/HANDOFF_TECNICO_DENTALEASY.md`

## 3. Setup rapido (ordem correta)

### 3.1 Backend

```bash
cd DentalEasy-Backend
npm install
```

Copie o arquivo de ambiente:

- Linux/macOS:
```bash
cp .env.example .env
```

- Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

Aplique migrations e seed:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Suba a API:

```bash
npm run dev
```

API/health:
- `http://localhost:3001/health`

### 3.2 Frontend

Em outro terminal, na raiz:

```bash
npm install
```

Crie `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Suba o frontend:

```bash
npm run dev
```

UI:
- `http://localhost:3000`

## 4. Contas seed

- `admin@teste.com` / `admin`
- `dentista@teste.com` / `dentista`
- `secretaria@teste.com` / `secretaria`

## 5. Modulos implementados

- auth
- patients
- appointments
- clinical-records
- prescriptions
- financial-records
- payments
- procedures
- treatment-plans
- inventory
- notifications
- settings
- dashboard
- reports

## 6. Checklist final de validacao local

1. Banco PostgreSQL acessivel pelo `DATABASE_URL`
2. `npm run prisma:migrate` executado no backend
3. `npm run prisma:seed` executado no backend
4. Backend inicia sem erro (`npm run dev` em `DentalEasy-Backend`)
5. Frontend inicia sem erro (`npm run dev` na raiz)
6. Login funciona para as 3 contas seed
7. `GET /api/auth/me` retorna sessao valida com token
8. Dashboard carrega dados reais
9. Modulos principais executam CRUD/acoes esperadas
10. RBAC coerente entre frontend e backend
11. Isolamento multi-tenant por `organizationId` ativo nas consultas

## 7. Limites conhecidos (nao bloqueantes para execucao local)

- Integracoes externas reais (fiscal/whatsapp/serasa) nao estao integradas de ponta a ponta; ha comportamento simplificado para ambiente local.
- Exportacao de relatorios no frontend esta sinalizada, sem pipeline completo de arquivo nesta entrega.
- Upload de documentos clinicos direto no detalhe do paciente ainda nao foi expandido para fluxo dedicado de armazenamento.
- Rotas legadas em portugues foram mantidas no backend por compatibilidade com etapas anteriores.

## 8. Referencias de operacao

- Guia backend detalhado: [DentalEasy-Backend/README.md](/c:/Users/guilh/OneDrive/Documentos/DentalEasy/DentalEasy-Backend/README.md)
- Handoff tecnico: [docs/HANDOFF_TECNICO_DENTALEASY.md](/c:/Users/guilh/OneDrive/Documentos/DentalEasy/docs/HANDOFF_TECNICO_DENTALEASY.md)
- Resumo de entrega: [docs/ENTREGA_FINAL_DENTALEASY.md](/c:/Users/guilh/OneDrive/Documentos/DentalEasy/docs/ENTREGA_FINAL_DENTALEASY.md)
