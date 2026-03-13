# Handoff Tecnico - DentalEasy

Documento de transicao tecnica para continuidade do projeto apos a entrega final.

## 1. Estado atual do projeto

O sistema esta integrado frontend/backend com dados reais para os modulos principais:

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

A base esta estabilizada para uso local com seed e RBAC.

## 2. Onde esta cada parte

### Frontend

- App Router: `src/app`
- Telas do dashboard: `src/app/(dashboard)`
- Contextos globais: `src/contexts`
  - `auth-context.tsx`
  - `clinic-context.tsx`
  - `procedures-context.tsx`
  - `notification-context.tsx`
- Camada HTTP: `src/lib/api.ts`
- Tipos compartilhados da UI: `src/types/index.ts`

### Backend

- Bootstrap HTTP: `DentalEasy-Backend/src/app.ts`
- Container DI/use cases: `DentalEasy-Backend/src/container.ts`
- Rotas: `DentalEasy-Backend/src/Http/routes`
- Middlewares auth/erro: `DentalEasy-Backend/src/Http/middlewares`
- DTOs de entrada: `DentalEasy-Backend/src/Application/DTOs`
- Use cases de API: `DentalEasy-Backend/src/Application/UseCases`
- Dominio: `DentalEasy-Backend/src/Domains`
- Prisma: `DentalEasy-Backend/prisma/schema.prisma`
- Seed: `DentalEasy-Backend/prisma/seed.ts`

## 3. Arquitetura e decisoes que devem ser preservadas

1. Backend orientado a use cases e DTOs.
2. Validacao de entrada via Zod em DTOs.
3. Autenticacao JWT com contexto de usuario no request.
4. RBAC em dois niveis:
- middleware de rota (`authorizeRoles`)
- reforco nos use cases (`ensureRole`)
5. Isolamento multi-tenant por `organizationId` vindo do token.
6. Frontend com camada HTTP centralizada (`src/lib/api.ts`) sem `fetch` espalhado.
7. Contextos do frontend apenas para estado global legitimo (sessao, clinica, procedimentos e notificacoes).

## 4. Como adicionar um novo modulo sem quebrar padrao

1. Modelar dados no Prisma (`schema.prisma`).
2. Criar migration.
3. Criar DTOs de entrada em `src/Application/DTOs`.
4. Criar use case em `src/Application/UseCases`.
5. Criar rotas em `src/Http/routes` com:
- parse Zod
- `authorizeRoles`
- `getUserContext`
6. Registrar no `routes/index.ts` e no `container.ts`.
7. Expor cliente no frontend em `src/lib/api.ts`.
8. Consumir na tela/contexto com loading/error/empty state.
9. Garantir filtros por `organizationId` em toda query sensivel.

## 5. Checklist tecnico de validacao local (obrigatorio antes de merge)

1. `npm install` (frontend e backend)
2. `npm run prisma:generate`
3. `npm run prisma:migrate`
4. `npm run prisma:seed`
5. `npm run dev` no backend e frontend
6. Login com:
- `admin@teste.com` / `admin`
- `dentista@teste.com` / `dentista`
- `secretaria@teste.com` / `secretaria`
7. Validar `GET /api/auth/me`
8. Validar dashboard com dados reais
9. Validar operacoes principais por modulo
10. Validar restricoes por role
11. Validar isolamento por organizacao
12. Rodar build:
- frontend: `npm run build`
- backend: `npm run build`

## 6. Pontos de atencao conhecidos

1. Integracoes externas (fiscal/whatsapp/serasa) estao simplificadas para ambiente local.
2. Exportacao completa de relatorios ainda pode ser expandida.
3. Upload dedicado de documentos clinicos ainda pode ser aprofundado.
4. Rotas legadas em portugues foram mantidas por compatibilidade.

## 7. Continuidade recomendada (proximos passos tecnicos)

1. Aumentar cobertura de testes automatizados (use cases + contratos API).
2. Completar observabilidade (logs estruturados, tracing e metricas).
3. Endurecer politicas de seguranca para ambiente produtivo (rate limit, hardening de headers, secrets management).
4. Finalizar integracoes externas reais quando o ambiente de producao estiver definido.

## 8. Referencias

- README raiz: [README.md](/c:/Users/guilh/OneDrive/Documentos/DentalEasy/README.md)
- README backend: [DentalEasy-Backend/README.md](/c:/Users/guilh/OneDrive/Documentos/DentalEasy/DentalEasy-Backend/README.md)
- Contexto DDD raiz: [ddd_clinica_context.readme.md](/c:/Users/guilh/OneDrive/Documentos/DentalEasy/ddd_clinica_context.readme.md)
- Contexto DDD backend: [DentalEasy-Backend/ddd_clinica_context.readme.md](/c:/Users/guilh/OneDrive/Documentos/DentalEasy/DentalEasy-Backend/ddd_clinica_context.readme.md)


