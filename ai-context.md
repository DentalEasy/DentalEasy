# DentalEasy — AI Context (Fonte Central de Contexto)

> Documento de referência para IAs. Reflete o estado **real** do código em março/2026.
> Não inventar informações. Consultar sempre antes de gerar código.

---

## 1. Visão Geral do Projeto

**DentalEasy** é um sistema SaaS multi-tenant de gestão de clínicas odontológicas, construído com arquitetura DDD e REST API.

**Objetivo:** Automatizar processos clínicos e administrativos de clínicas odontológicas — pacientes, prontuários, agendamentos, financeiro, receituário, inventário e relatórios — com controle de acesso por papel (RBAC).

**Público-alvo:** Clínicas odontológicas brasileiras (suporte a CPF, Serasa, Nota Fiscal, WhatsApp).

**Status:** Backend e frontend implementados com integração funcional. Dois conjuntos de modelos coexistem no banco (legacy DDD + API moderna), em processo de unificação implícita.

---

## 2. Stack Tecnológica

### Backend
| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js + TypeScript 5 |
| Framework | Express 4 |
| ORM | Prisma 6 (client e migrations) |
| Banco de Dados | PostgreSQL |
| Autenticação | JWT manual (jsonwebtoken) com refresh token rotation |
| Hashing | bcryptjs |
| Geração de Documentos | `docx` (biblioteca, para receituário .docx) |
| Validação | Zod 3 |
| Segurança HTTP | Helmet, CORS explícito, express-rate-limit |
| Testes | Supertest + mocks manuais do Prisma |

### Frontend
| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| Estilização | Tailwind CSS 4 |
| Componentes UI | Radix UI (primitivos headless) + componentes customizados em `src/components/ui/` |
| Formulários | React Hook Form 7 + Zod 4 (via @hookform/resolvers) |
| Estado Global | React Context API (sem Redux/Zustand) |
| Gráficos | Recharts |
| Animações | Framer Motion |
| Ícones | Lucide React |
| Data | date-fns |
| Auth no frontend | Context próprio (AuthContext) + Bearer token em localStorage |

> **Atencao:** O projeto NAO usa NextAuth.js, shadcn/ui como biblioteca externa, nem Redux. Usa Radix UI direto + Context API.

---

## 3. Arquitetura do Sistema

### Padrao Geral
```
Frontend (Next.js App Router)
    -> REST API (Bearer token JWT)
Backend (Express)
    ├── Http Layer (Routes + Middlewares)
    ├── Application Layer (UseCases + DTOs)
    ├── Domain Layer (Entities + Services + Interfaces)
    └── Infrastructure Layer (Prisma Repositories + External APIs)
```

### Arquitetura DDD (Backend)
- **Bounded Contexts** (5): Paciente, Prontuario, Financeiro, Agendamento, Receituario
- Cada contexto tem: Entidades, Interface de Repositorio, Servico de Dominio
- Os repositorios concretos ficam na camada Infrastructure/Persistence (Prisma)

### Padrao de UseCases (Application Layer)
- Cada modulo de API tem seu proprio `*ApiUseCases.ts`
- UseCases orquestram repositorios + servicos de dominio
- DTOs com Zod para validacao de entrada/saida

### Injecao de Dependencia
- Manual, via `container.ts` (singletons wired manualmente)
- Sem framework de DI (NestJS, InversifyJS, etc.)

### Multi-tenancy
- **Todos** os dados sao isolados por `organizationId`
- Toda query ao banco DEVE incluir `organizationId` do usuario autenticado
- Cascade delete configurado: deletar Organization remove todos os dados relacionados

---

## 4. Estrutura de Pastas

### Backend (`DentalEasy-Backend/src/`)
```
src/
├── Domains/                    <- Bounded Contexts DDD
│   ├── Paciente/               <- Entidades + Service + IRepository
│   ├── Prontuario/
│   ├── Financeiro/
│   ├── Agendamento/
│   └── Receituario/
│
├── Application/
│   ├── DTOs/                   <- Schemas Zod para validacao
│   ├── UseCases/               <- Logica de negocio por modulo de API
│   └── Prescriptions/          <- Geracao de .docx (docx-template, serialization)
│
├── Infrastructure/
│   ├── Persistence/            <- Repositorios Prisma concretos
│   ├── ExternalApis/           <- SerasaApi, FazendaApi, WhatsAppApi
│   └── Notifications/          <- WhatsAppNotificacaoService
│
├── Http/
│   ├── middlewares/            <- auth, error, rate-limit, content-type
│   └── routes/                 <- Uma rota por modulo + index.ts
│
├── Users/                      <- Roles (ADMIN, SECRETARY, DENTIST)
├── shared/                     <- access-control, errors, jwt, password-policy
├── config/env.ts               <- Validacao de variaveis de ambiente
├── container.ts                <- DI manual
├── app.ts                      <- Setup do Express
└── server.ts                   <- Ponto de entrada

prisma/
├── schema.prisma               <- Schema completo (fonte de verdade do banco)
├── seed.ts
└── migrations/
```

### Frontend (`src/`)
```
src/
├── app/
│   ├── (dashboard)/            <- Grupo de rotas autenticadas
│   │   ├── dashboard/page.tsx
│   │   ├── patients/page.tsx
│   │   ├── patients/[id]/page.tsx
│   │   ├── appointments/page.tsx
│   │   ├── clinical-records/page.tsx
│   │   ├── prescriptions/page.tsx
│   │   ├── treatment-plans/page.tsx
│   │   ├── financial/page.tsx
│   │   ├── payments/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── reports/page.tsx
│   │   └── settings/page.tsx
│   ├── landing/page.tsx        <- Landing publica
│   └── login/page.tsx
│
├── components/
│   ├── auth/role-gate.tsx      <- Guard por papel
│   ├── layout/                 <- AppLayout, Sidebar
│   ├── shared/                 <- Modais globais, NotificationCenter
│   └── ui/                     <- Primitivos (Button, Input, Dialog, etc.)
│
├── contexts/                   <- AuthContext, ClinicContext, NotificationContext, ProceduresContext
├── lib/
│   ├── api.ts                  <- Cliente HTTP (base: localhost:3001/api, Bearer token)
│   ├── schemas.ts              <- Schemas Zod dos formularios
│   └── utils.ts                <- formatCPF, formatPhone, formatCurrency
└── types/index.ts              <- Tipos TypeScript de todas as entidades
```

---

## 5. Entidades e Relacionamentos

### Diagrama de Relacionamentos (Prisma Schema)
```
Organization
  ├── User[] (ADMIN | SECRETARY | DENTIST)
  │     └── AuthSession[]
  │
  ├── Paciente[]  <---- CPF unico por Organization
  │     ├── Prontuario (1:1)
  │     │     ├── Tratamento[]
  │     │     └── Diagnostico[]
  │     ├── Appointment[]  <- dentistUserId -> User
  │     ├── MedicalRecord[] <- dentistUserId -> User
  │     ├── Prescription[] <- dentistUserId -> User
  │     ├── TreatmentPlan[] <- createdByUserId -> User
  │     ├── FinancialRecord[] (opcional)
  │     ├── Pagamento[] (legacy)
  │     ├── Consulta[] (legacy)
  │     └── Receita[] (legacy)
  │
  ├── FinancialRecord[]
  │     └── Payment[]
  │
  ├── Procedure[]
  │     └── TreatmentPlanItem[] (via TreatmentPlan)
  │
  ├── InventoryItem[]
  │     └── InventoryMovement[]
  │
  ├── AppNotification[]
  └── NotificationPreference (1:1)
```

### Tabela de Entidades Principais
| Entidade | Tipo | Proposito |
|----------|------|-----------|
| `Organization` | Multi-tenant root | Clinica/tenant |
| `User` | Auth + RBAC | Funcionarios (Admin, Secretaria, Dentista) |
| `AuthSession` | Auth | Sessoes JWT com token rotation |
| `Paciente` | Core | Dados do paciente (CPF unico por org) |
| `Prontuario` | Legacy DDD | Prontuario clinico (1:1 com Paciente) |
| `Appointment` | API Moderna | Consultas agendadas |
| `MedicalRecord` | API Moderna | Registros clinicos (PROCEDURE, ANAMNESIS, PHOTO, NOTE) |
| `Prescription` | API Moderna | Receituario odontologico |
| `TreatmentPlan` | API Moderna | Plano de tratamento com itens |
| `Procedure` | Catalogo | Procedimentos disponiveis na clinica |
| `FinancialRecord` | Financeiro | Receitas e despesas |
| `Payment` | Financeiro | Pagamentos vinculados a FinancialRecord |
| `InventoryItem` | Estoque | Materiais/insumos |
| `AppNotification` | Notificacoes | Alertas in-app por tipo |

### Dualidade Legacy vs. Moderno
O banco possui dois conjuntos de modelos para alguns dominios:

| Dominio | Legacy (DDD original) | Moderno (API expandida) |
|---------|-----------------------|------------------------|
| Agendamento | `Consulta`, `Agenda`, `Dentista` | `Appointment` |
| Prontuario | `Prontuario`, `Tratamento`, `Diagnostico` | `MedicalRecord` |
| Receituario | `Receita` | `Prescription` |
| Financeiro | `Pagamento`, `Boleto`, `NotaFiscal` | `FinancialRecord`, `Payment` |

> **ATENCAO — Ponto Critico:** Ambos os conjuntos existem no banco e tem rotas ativas. O frontend usa os modelos modernos. Os modelos legacy estao em processo de deprecacao implicita. Ao implementar novas features, **usar sempre os modelos modernos**.

---

## 6. Regras de Negocio Centrais

### Multi-tenancy
- Toda query DEVE filtrar por `organizationId` (extraido do JWT do usuario)
- Nunca usar `organizationId` do body da requisicao — sempre do token
- `onDelete: Cascade` garante limpeza ao excluir Organization

### Unicidade
- CPF: unico por `organizationId` (`@@unique([organizationId, cpf])`)
- CRO do Dentista: unico por `organizationId` (legado)
- Evento de notificacao: unico por `organizationId + eventKey`

### Controle de Acesso (RBAC)
| Role | Pacientes | Agendamentos | Prontuario/Receituario | Financeiro | Inventario | Settings |
|------|-----------|--------------|----------------------|------------|------------|---------|
| ADMIN | total | total | total | total | total | total |
| SECRETARY | CRUD | CRUD | sem acesso | acesso | acesso | nao |
| DENTIST | leitura | proprios | total | leitura | nao | nao |

### Agendamentos
- Dentista nao pode ter consultas sobrepostas (conflito de horario)
- Validacao: `startTime < endTime`, formato ISO (HH:MM)
- Status lifecycle: `PENDING -> CONFIRMED -> COMPLETED` (ou `CANCELLED`)

### Plano de Tratamento
- Lifecycle: `DRAFT -> SENT -> APPROVED -> IN_PROGRESS -> COMPLETED` (ou `CANCELED`/`REJECTED`)
- `totalAmount` = soma dos `TreatmentPlanItem.totalPrice` com desconto aplicado
- `TreatmentPlanItem.totalPrice` = `unitPrice x quantity`

### Financeiro
- `FinancialRecord` pode existir sem paciente (despesas gerais)
- NFe status rastreado: `ISSUED | PENDING | ERROR` (campo `nfeStatus`)
- Payment suporta parcelamento via `installmentNumber` / `totalInstallments`

### Autenticacao e Seguranca
- Refresh token rotation: ao usar o refresh token, o anterior e invalidado
- Reuse detection: se token ja usado e apresentado, toda a familia de tokens e revogada
- Bloqueio de conta apos N tentativas falhas (configuravel via env `AUTH_LOGIN_MAX_ATTEMPTS_PER_ACCOUNT`)
- Respostas genericas em login/forgot-password (nao revelar se usuario existe)
- MFA: campos preparados no model `User` (`mfaEnabled`, `mfaSecretEncrypted`), nao ativado por padrao

### Receituario
- Apenas `DENTIST` e `ADMIN` podem criar/ver receitas
- Exportacao para `.docx` usando a biblioteca `docx`
- Metadados da receita armazenados como JSON no campo `metadata` (medicamentos, instrucoes, etc.)

### Inventario
- `InventoryItem.currentStock` e atualizado via `InventoryMovement` (RESTOCK ou ADJUSTMENT)
- Alerta de estoque baixo quando `currentStock < minStock`

---

## 7. Fluxos Principais

### Autenticacao
```
POST /auth/login
  -> Valida email/senha -> bcrypt compare
  -> Verifica bloqueio de conta (failedLoginAttempts / loginBlockedUntil)
  -> Gera access token (JWT, ~15min) + refresh token (JWT, ~30d)
  -> Salva hash do refresh token em AuthSession
  -> Retorna { accessToken } + cookie httpOnly (refresh token)

POST /auth/refresh
  -> Le refresh token do cookie ou body
  -> Verifica hash no banco (AuthSession)
  -> Detecta reuso (token ja invalidado = compromisso detectado -> revoga familia)
  -> Rotaciona: invalida sessao atual, cria nova
  -> Retorna novo access token + novo refresh token
```

### Cadastro de Paciente
```
Frontend (new-patient-modal.tsx)
  -> POST /api/patients
  -> authMiddleware (JWT -> UserContext)
  -> PatientsApiUseCases.createPatient(userCtx, dto)
  -> Valida CPF unico por organizacao
  -> PrismaPacienteRepository.create()
  -> Cria Prontuario vazio (1:1 automatico)
  -> Retorna Paciente criado
```

### Agendamento de Consulta
```
Frontend (new-appointment-modal.tsx)
  -> POST /api/appointments
  -> AppointmentsApiUseCases.createAppointment()
  -> assertNoScheduleConflict() <- verifica sobreposicao de horario
  -> Prisma.appointment.create()
  -> (Opcional) WhatsApp reminder se reminderSent = true
```

### Geracao de Receituario (.docx)
```
Frontend (prescriptions/page.tsx)
  -> POST /api/prescriptions <- salva no banco
  -> GET /api/prescriptions/:id/export <- gera .docx
  -> PrescriptionsApiUseCases.exportPrescription()
  -> Application/Prescriptions/docx-template.ts <- monta o documento
  -> Retorna blob .docx para download
```

### Fluxo Financeiro
```
Frontend (financial/page.tsx)
  -> POST /api/financial-records <- cria registro (receita ou despesa)
  -> POST /api/payments <- registra pagamento vinculado
  -> PATCH /api/payments/:id/settle <- efetiva o pagamento
  -> (Futuro) FazendaApi <- emite NFe
```

---

## 8. Padroes e Convencoes Existentes

### Backend
- **Rotas**: `DentalEasy-Backend/src/Http/routes/*.routes.ts` — uma por modulo, registradas em `index.ts`
- **UseCases**: `Application/UseCases/*ApiUseCases.ts` — recebem `UserContext` como 1 argumento
- **DTOs**: `Application/DTOs/*.api.dto.ts` — schemas Zod exportados + tipos TypeScript inferidos
- **Repositorios**: Interface em `Domains/*/I*Repository.ts` + implementacao em `Infrastructure/Persistence/Prisma*Repository.ts`
- **Erros**: Classes em `shared/errors.ts` — `DomainError`, `AuthenticationError`, `AuthorizationError`, `ValidationError`, `NotFoundError`, `TooManyRequestsError`
- **Resposta de erro**:
  ```json
  { "error": { "code": "ERROR_CODE", "message": "...", "details": {} } }
  ```
- **Formato de resposta OK**: nao ha envelope padrao — varia por endpoint (objeto, array, ou `{ data, meta }`)
- **Naming**: camelCase em TypeScript/JS — snake_case nunca usado

### Frontend
- **Contextos**: `src/contexts/` — usar `useAuth()`, `useClinic()`, `useNotifications()`, `useProcedures()`
- **API calls**: `src/lib/api.ts` — usar as funcoes exportadas, nunca `fetch` diretamente
- **Formularios**: React Hook Form + schema Zod em `src/lib/schemas.ts`
- **Formatacao de dados**: `formatCPF()`, `formatPhone()`, `formatCurrency()` em `src/lib/utils.ts`
- **Tipos**: definidos em `src/types/index.ts` — atualizar ao adicionar novos campos
- **Validacao visual de roles**: `<RoleGate allowedRoles={['ADMIN', 'DENTIST']}>` em `components/auth/role-gate.tsx`
- **Toast**: `useToast()` para feedback ao usuario
- **Animacoes de pagina**: `<PageTransition>` wrapper de `src/lib/animations.tsx`

### Variaveis de Ambiente (Backend)
Todas validadas em `src/config/env.ts`. As criticas:
- `DATABASE_URL` — conexao PostgreSQL
- `JWT_SECRET` — min. 32 chars, obrigatorio
- `JWT_REFRESH_SECRET` — separado do access (recomendado)
- `CORS_ORIGIN` — lista explicita de origens (sem wildcard em producao)
- `PORT` — default 3001

---

## 9. Pontos de Atencao para Futuras Features

### 1. Dualidade de Modelos no Banco
- Existem dois sistemas de agendamento: `Consulta/Agenda` (legacy DDD) e `Appointment` (moderno)
- O frontend usa apenas `Appointment`. Os modelos legacy ainda tem rotas `/api/agendamento` ativas
- **Acao necessaria**: Migrar os dados e remover rotas/modelos legacy quando oportuno
- Ate la: **novas features SEMPRE usam os modelos modernos**

### 2. Autenticacao no Frontend
- Token armazenado em **localStorage** (nao cookie) — vulneravel a XSS
- O backend usa cookie httpOnly para refresh token, mas o frontend armazena o access token em localStorage com chave `dental-saas-token`
- **Acao necessaria**: Migrar para cookie httpOnly no frontend tambem

### 3. Container de DI Manual
- `container.ts` faz o wire de todos os servicos manualmente
- Ao adicionar novo UseCase/Repository, DEVE ser registrado em `container.ts`
- **Atencao**: Esquecer de registrar no container causa erro de runtime (undefined)

### 4. Soft Delete Inconsistente
- `Paciente` e `User` tem campo `active: Boolean` para soft delete
- Outros modelos usam hard delete (Prisma cascade)
- Queries de listagem DEVEM filtrar por `active: true` onde aplicavel

### 5. Ausencia de Testes de Integracao Completos
- Testes existentes cobrem: middlewares de seguranca, auth flow, geracao de .docx
- Nao ha testes de ponta-a-ponta cobrindo fluxos completos
- Novos modulos devem ter pelo menos testes unitarios de UseCases

### 6. ProceduresContext no Frontend e Local
- `ProceduresContext` mantem o catalogo de procedimentos em memoria
- Nao ha sincronizacao automatica com o backend apos CRUD
- **Atencao**: Ao criar/editar procedimento, chamar `refreshProcedures()` do contexto

### 7. Modelos Sem Tela Frontend
- `Prontuario/Tratamento/Diagnostico` (legacy) existem no banco mas a tela usa `MedicalRecord`
- `Boleto` e `NotaFiscal` existem no banco, mas nao ha UI para gerencia-los diretamente

### 8. Notificacoes com eventKey Unico
- `AppNotification` tem constraint `@@unique([organizationId, eventKey])`
- Ao criar notificacoes programaticas, garantir `eventKey` unico e descritivo
- Exemplo: `appointment:${id}:reminder`, `inventory:${itemId}:low-stock`

---

## 10. Diretrizes para Futuras IAs

### Antes de qualquer alteracao
1. Identificar em qual camada a mudanca pertence (Domain, Application, Infrastructure, Http, Frontend)
2. Verificar se existe UseCase, DTO, Repository e rota para o modulo afetado
3. Confirmar se a feature e para modelos **modernos** (preferencia) ou legacy
4. Checar `container.ts` se for adicionar novo servico

### Seguranca — nunca violar
- Todo dado acessado deve ser filtrado por `organizationId` do usuario autenticado
- `organizationId` vem SEMPRE do JWT, nunca do body/query da requisicao
- Role checks devem usar `authorizeRoles()` middleware ou `ensureRole()` nos UseCases
- Nunca expor stack traces em producao (ja tratado em `error.middleware.ts`)

### Convencoes a manter
- Novos endpoints seguem o padrao: `GET|POST|PATCH|DELETE /api/[resource]`
- Novo modulo = novo arquivo de UseCase + DTO + rota + registro no container
- Validacao de entrada SEMPRE via Zod antes de chegar no UseCase
- Erros de negocio lancam as classes de `shared/errors.ts` (nao `new Error()` generico)
- Frontend: novos tipos em `src/types/index.ts`, novos endpoints em `src/lib/api.ts`

### O que NAO fazer
- Nao usar `organizationId` do body da requisicao
- Nao criar modelos legados novos (usar o padrao moderno)
- Nao misturar ingles/portugues em nomes de entidade dentro do mesmo contexto
- Nao acessar o Prisma client diretamente nos UseCases — sempre via repositorio
- Nao fazer queries sem `organizationId` como filtro

---

## 11. Checklist para Implementacao de Novas Features

### Backend
- [ ] Criar/atualizar schema Prisma (`prisma/schema.prisma`)
- [ ] Rodar `npx prisma migrate dev` e `npx prisma generate`
- [ ] Criar/atualizar interface de repositorio em `Domains/*/I*Repository.ts`
- [ ] Implementar repositorio concreto em `Infrastructure/Persistence/Prisma*Repository.ts`
- [ ] Criar DTOs Zod em `Application/DTOs/*.api.dto.ts`
- [ ] Criar UseCases em `Application/UseCases/*ApiUseCases.ts`
- [ ] Criar rotas em `Http/routes/*.routes.ts`
- [ ] Registrar rotas em `Http/routes/index.ts`
- [ ] Registrar servicos em `container.ts`
- [ ] Adicionar autorizacao por role nas rotas
- [ ] Garantir que todas as queries filtram por `organizationId`
- [ ] Escrever testes unitarios para UseCases criticos

### Frontend
- [ ] Adicionar tipos em `src/types/index.ts`
- [ ] Adicionar funcoes de API em `src/lib/api.ts`
- [ ] Adicionar schemas Zod em `src/lib/schemas.ts` (se houver formulario)
- [ ] Criar pagina em `src/app/(dashboard)/[feature]/page.tsx`
- [ ] Adicionar link no Sidebar com filtro de role correto
- [ ] Usar `<RoleGate>` para proteger secoes por papel
- [ ] Usar `useToast()` para feedback de sucesso/erro
- [ ] Testar com os 3 roles: ADMIN, SECRETARY, DENTIST

---

## Referencia Rapida de Arquivos Criticos

| Proposito | Caminho |
|-----------|---------|
| Schema do Banco | `DentalEasy-Backend/prisma/schema.prisma` |
| Container DI | `DentalEasy-Backend/src/container.ts` |
| Setup Express | `DentalEasy-Backend/src/app.ts` |
| Auth Middleware | `DentalEasy-Backend/src/Http/middlewares/auth.middleware.ts` |
| Erros Customizados | `DentalEasy-Backend/src/shared/errors.ts` |
| JWT Utils | `DentalEasy-Backend/src/shared/jwt.ts` |
| Env Config | `DentalEasy-Backend/src/config/env.ts` |
| Prisma Client | `DentalEasy-Backend/src/Infrastructure/Persistence/prisma-client.ts` |
| Rotas Index | `DentalEasy-Backend/src/Http/routes/index.ts` |
| API Client (FE) | `src/lib/api.ts` |
| Auth Context (FE) | `src/contexts/auth-context.tsx` |
| Tipos FE | `src/types/index.ts` |
| Schemas Zod FE | `src/lib/schemas.ts` |
