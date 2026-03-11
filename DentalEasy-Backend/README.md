# DentalEasy Backend (DDD)

Backend Node.js + Express + TypeScript estruturado por Domain-Driven Design e multi-tenant por clinica.

## Estrutura

- `src/Domains`: entidades, agregados, contratos de repositorio e servicos de dominio.
- `src/Application`: DTOs e casos de uso.
- `src/Infrastructure`: repositorios Prisma e adapters externos (Serasa, Fazenda, WhatsApp).
- `src/Http`: rotas HTTP, middlewares de autenticacao e tratamento de erros.
- `src/Users`: papeis de acesso (`ADMIN`, `SECRETARY`, `DENTIST`).
- `prisma/schema.prisma`: modelo de dados PostgreSQL com isolamento por `organizationId`.

## Regras aplicadas

- Isolamento por clinica em todas as operacoes de dominio.
- `organizationId` presente em todos os modelos de dominio (exceto `Organization`).
- RBAC:
  - `ADMIN`: acesso total da clinica.
  - `SECRETARY`: pacientes, agendamento e financeiro.
  - `DENTIST`: prontuario e receituario.

## Executar

1. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`.
2. Instale dependencias:
   - `npm install`
3. Gere cliente Prisma:
   - `npm run prisma:generate`
4. Rode migracao:
   - `npm run prisma:migrate`
5. Inicie em desenvolvimento:
   - `npm run dev`

## Rotas principais

Base: `/api` (autenticacao por headers)

Headers obrigatorios:
- `x-user-id`
- `x-organization-id`
- `x-user-role` (`ADMIN`, `SECRETARY`, `DENTIST`)

Endpoints:
- `GET /api/pacientes`
- `POST /api/pacientes`
- `GET /api/agendamento/consultas`
- `POST /api/agendamento/consultas`
- `GET /api/financeiro/pagamentos`
- `POST /api/financeiro/pagamentos`
- `POST /api/prontuario/tratamentos`
- `POST /api/prontuario/diagnosticos`
- `GET /api/receituario/receitas`
- `POST /api/receituario/receitas`

## Observacao

Neste ambiente atual, o comando `npm` nao esta disponivel, entao nao foi possivel executar build/runtime aqui. A estrutura de codigo foi criada e validada por analise estatica local do editor.
