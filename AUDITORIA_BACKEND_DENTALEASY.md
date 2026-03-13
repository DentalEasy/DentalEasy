# AUDITORIA_BACKEND_DENTALEASY

## 1. Resumo executivo

### Visao geral do estado atual
- O frontend esta funcional visualmente, mas praticamente todos os modulos usam mocks e estado local (sem consumo real de API).
- O backend existe em estrutura DDD (Domains/Application/Infrastructure/Http), com alguns endpoints reais para 5 contextos: pacientes, agendamento, financeiro, prontuario e receituario.
- A integracao frontend-backend ainda nao comecou de fato: nao ha camada de cliente HTTP no frontend e os contratos nao batem.

### Principais riscos
- Autenticacao insegura no backend: identidade e role sao aceitas por headers (`x-user-id`, `x-organization-id`, `x-user-role`) sem JWT/sessao real.
- Divergencia forte de contratos: frontend espera objetos em ingles e shape flat; backend usa nomes em portugues e em varios casos responde classes com `props`.
- RBAC inconsistente entre UI e backend (ex.: ADMIN permitido na UI para receituario/prontuario, mas backend bloqueia em varios fluxos).
- Cobertura parcial do DDD e da UI: faltam modulos inteiros (tratamento, estoque, notificacoes, relatorios, configuracoes completas).

### Conclusao de viabilidade
- A continuacao do backend e viavel, reaproveitando a base existente.
- Porem, antes de implementar features grandes, e obrigatorio alinhar fundacao de autenticacao/tenant/RBAC e padronizar contratos de API.

## 2. Estrutura encontrada

### Frontend (estado real)
Arquivos-chave:
- `src/types/index.ts`
- `src/lib/schemas.ts`
- `src/contexts/auth-context.tsx`
- `src/contexts/clinic-context.tsx`
- `src/contexts/procedures-context.tsx`
- `src/contexts/notification-context.tsx`
- paginas em `src/app/(dashboard)/*`

O que existe:
- Modulos/telas: dashboard, patients, appointments, clinical-records, financial, payments, prescriptions, reports, inventory, settings, treatment-plans, paciente detalhado (`patients/[id]`).
- Controle de acesso no frontend por role (`RoleGate`) e filtro de menu na sidebar.
- Protecao de rota do dashboard via `AuthGate` client-side.

Estado de dados:
- Sem chamadas HTTP no frontend para backend.
- Login mockado em `src/app/login/page.tsx` (credenciais fixas).
- Sessao local via `localStorage` (`dental-saas-user`) em `auth-context`.
- Organizacao mock fixa em `clinic-context`.
- Procedimentos e notificacoes 100% locais em contextos.
- Quase todas as paginas usam arrays `mock*` e actions locais.

### Backend (estado real)
Arquivos-chave:
- `DentalEasy-Backend/src/app.ts`
- `DentalEasy-Backend/src/container.ts`
- `DentalEasy-Backend/src/Http/routes/*`
- `DentalEasy-Backend/src/Application/*`
- `DentalEasy-Backend/src/Domains/*`
- `DentalEasy-Backend/src/Infrastructure/*`
- `DentalEasy-Backend/prisma/schema.prisma`

O que esta implementado de verdade:
- Endpoints:
  - `GET/POST /api/pacientes`
  - `GET/POST /api/agendamento/consultas`
  - `GET/POST /api/financeiro/pagamentos`
  - `POST /api/prontuario/tratamentos`
  - `POST /api/prontuario/diagnosticos`
  - `GET/POST /api/receituario/receitas`
- Regras de role no dominio (services) e isolamento por `organizationId` em varias consultas.
- Repositorios Prisma funcionais para os contextos implementados.

Partes em esqueleto/parcial:
- Sem autenticacao real (somente headers confiados).
- Integracoes externas sao stubs (`WhatsAppApi`, `SerasaApi`, `FazendaApi`).
- Notificacao de consulta envia para telefone fixo `00000000000`.
- Nao ha endpoints de update/delete para quase nenhum modulo.
- Nao ha modulo de treatment plans, inventory, notifications, reports, procedures, settings.

### DDD documentado
Arquivos:
- `ddd_clinica_context.readme.md`
- `DentalEasy-Backend/ddd_clinica_context.readme.md`

Bounded contexts definidos:
1. Pacientes
2. Prontuario
3. Financeiro
4. Agendamento
5. Receituario

Regras centrais do documento:
- Multi-tenant por clinica.
- RBAC com `ADMIN`, `SECRETARY`, `DENTIST`.
- Integracoes Serasa/Fazenda/WhatsApp.
- Fluxos com seguranca e isolamento organizacional.

## 3. Gaps entre frontend e backend (por modulo)

- `dashboard`
  - UI espera stats agregados, proximas consultas, mensagens WhatsApp e acoes rapidas.
  - Backend nao possui endpoint de stats/dashboard nem feed de mensagens.
- `patients`
  - UI precisa listagem, detalhe, criacao, edicao, remocao, filtro por CPF/nome, dados extras de paciente.
  - Backend tem apenas listar/criar e contrato diferente.
- `appointments`
  - UI precisa status (`CONFIRMED/PENDING/CANCELLED/COMPLETED`), janela de horario, procedimento, lembretes e alteracao de status.
  - Backend possui consulta com `dataHora` unico, sem status e sem update/cancelamento.
- `clinical-records`
  - UI precisa registros tipados (`PROCEDURE/ANAMNESIS/NOTE/PHOTO`) com titulo, descricao, anexos e listagem.
  - Backend so cria tratamento/diagnostico e nao tem endpoint de consulta de historico no formato da UI.
- `financial`
  - UI precisa `FinancialRecord` (descricao, tipo receita/despesa, paymentMethod, dueDate, paidAt, nfeStatus, lembretes, recibo).
  - Backend modela `Pagamento` + `Boleto`/`NotaFiscal`, sem varios campos da UI.
- `payments`
  - UI precisa cobrancas pendentes por paciente, desconto, split de pagamento, parcelas por metodo e protocolo de recibo.
  - Backend nao possui esse fluxo transacional.
- `prescriptions`
  - UI espera criacao/lista/exportacao DOCX/PDF.
  - Backend so cria/lista receita; sem exportacao.
- `reports`
  - UI espera KPIs e agregacoes financeiras/operacionais.
  - Backend nao possui endpoints de relatorios.
- `inventory`
  - UI completa de estoque (categorias, estoque minimo, reposicao, status).
  - Backend sem models/endpoints de estoque.
- `settings`
  - UI espera dados clinica, equipe/permissoes, notificacoes, tabela de procedimentos e plano.
  - Backend sem endpoints de configuracao, equipe e procedimentos.
- `treatment-plans`
  - UI espera ciclo completo de plano com itens, status e parcelamento.
  - Backend nao possui dominio/endpoint.
- `procedures`
  - UI usa contexto local com catalogo e CRUD em memoria.
  - Backend nao possui entidade/endpoint de procedimento.
- `notifications`
  - UI usa centro de notificacoes local com leitura/remocao.
  - Backend nao possui notificacoes persistidas.

## 4. Gaps entre backend e ddd_clinica_context.readme.md

### Contexto Pacientes
- Coberto parcialmente: entidade, service, repositorio e rotas basicas.
- Faltam casos de uso de manutencao (editar/remover/detalhar) e extensoes usadas pela UI.

### Contexto Prontuario
- Coberto parcialmente: tratamento e diagnostico.
- Faltam leitura estruturada do prontuario, tipos de registro da UI, anexos e exportacao.
- Documento diz que dentista cria/edita; UI tambem permite ADMIN em algumas telas, gerando decisao pendente de regra oficial.

### Contexto Financeiro
- Coberto parcialmente: pagamento com boleto/nota fiscal.
- Faltam recursos operacionais do frontend (despesas, metodos de pagamento ricos, inadimplencia detalhada, cobrancas e recibos completos).

### Contexto Agendamento
- Coberto parcialmente: criar/listar consulta.
- Faltam status de consulta, remarcacao/cancelamento, e consistencia com fluxo de lembrete real.
- Integracao WhatsApp e stub.

### Contexto Receituario
- Coberto parcialmente: criar/listar com role DENTIST.
- Faltam exportacoes (docx/pdf) e validacoes complementares de negocio.

### Requisitos transversais do documento
- Multi-tenant: presente no schema e em varias queries, mas autenticacao por header invalida garantia de seguranca.
- RBAC: papeis existem, mas matriz de permissao diverge da UI em pontos criticos.
- Integracoes externas: presentes apenas como placeholders.

## 5. Contratos incompativeis

| Contrato esperado na UI | Backend atual | Impacto | Acao recomendada |
|---|---|---|---|
| `User` (`id,name,email,role,avatarUrl?,organizationId`) | `User` no Prisma sem endpoint de auth/perfil; sem `avatarUrl`; sem login real | UI nao consegue autenticar com backend real | Criar auth (`/auth/login`, `/auth/refresh`, `/auth/me`) e contrato de usuario da sessao |
| `Organization` (`name,slug,logoUrl,phone,address,city,state,cnpj,plan`) | `Organization` com `nome`, `createdAt`, `updatedAt` | Tela de settings/clinic sem dados necessarios | Expandir schema e endpoints de organizacao |
| `Patient` (ingles, flat, `serasaStatus`, timestamps string) | `Paciente` (portugues), payload de criacao com `contato{}`; resposta em classe (`props`) | Quebra de serializacao/parse no frontend | Padronizar DTO de API (response flat, camelCase, sem wrapper `props`) |
| `Appointment` (date/start/end/status/procedure + `patient` e `dentist`) | `Consulta` (`dataHora`, sem status/procedure, sem expand de relacoes) | Agenda do frontend nao mapeia campos | Criar DTO de agendamento aderente ao frontend e endpoints de update status |
| `MedicalRecord` (`type,title,description,attachments,dentist`) | `Prontuario` com `tratamentos`/`diagnosticos` | Modulo de prontuario nao integra | Criar contrato de registro clinico com tipo e anexos |
| `Prescription` (`content`, paciente/dentista) | `Receita` (`conteudo`) sem exportacao | Tela de receituario parcial | Padronizar campos e adicionar exportacao |
| `FinancialRecord` (descricao,tipo,status,method,dueDate,paidAt,nfeStatus) | `Pagamento` com `valor,status,boleto,notaFiscal` | Financeiro/pagamentos nao conectam | Redesenhar DTO financeiro e manter `Boleto/NotaFiscal` como subrecursos |
| `Procedure` (catalogo com `category,price,duration,active`) | Inexistente no backend | Settings/treatment plans ficam locais | Criar dominio e CRUD de procedimentos por organizacao |
| `TreatmentPlan` (itens,status,parcelamento,total) | Inexistente no backend | Modulo inteiro sem persistencia | Criar contexto de plano de tratamento |
| `Notification` (`type,title,description,time,read`) | Inexistente no backend | Notification center nao sincroniza | Criar notificacao persistente + endpoints de leitura/remocao |

Observacao geral de nomenclatura:
- Frontend padrao em ingles (`patient`, `appointment`, `organization`).
- Backend atual com nomes de dominio em portugues (`paciente`, `consulta`, `nome`, `dataNascimento`, `conteudo`).
- Necessaria decisao arquitetural de padrao unico de contrato publico.

## 6. Endpoints faltantes ou incompletos (por modulo)

- Autenticacao/usuario/tenant
  - Faltando: login, refresh, logout, perfil (`me`), resolucao de tenant por token.
- Dashboard
  - Faltando: KPIs agregados, proximas consultas, status de mensagens.
- Pacientes
  - Incompleto: existe `GET/POST`; faltam `GET by id`, `PATCH`, `DELETE`, busca/filtros server-side, dados complementares.
- Appointments
  - Incompleto: existe `GET/POST`; faltam `PATCH status`, remarcacao, cancelamento, lembrete.
- Clinical records
  - Faltando: listagem/consulta por paciente e endpoints de anexos.
  - Incompleto: apenas `POST tratamentos` e `POST diagnosticos`.
- Financial
  - Incompleto: existe `GET/POST pagamentos`; faltam operacoes de cobranca, baixa, emissao nfe integrada, despesas.
- Payments
  - Faltando: recebimento com split, desconto e protocolo/recibo persistido.
- Prescriptions
  - Incompleto: existe `GET/POST`; faltam exportacao DOCX/PDF e detalhamento.
- Reports
  - Faltando: endpoints de agregacao.
- Inventory
  - Faltando: CRUD de itens, reposicao e alertas.
- Settings
  - Faltando: endpoints de organizacao, equipe, permissoes, configuracoes de notificacao.
- Treatment plans
  - Faltando: CRUD e transicoes de status.
- Procedures
  - Faltando: CRUD de catalogo e ativacao/desativacao.
- Notifications
  - Faltando: listar, marcar como lida, remover, contador nao lidas.

## 7. Modelos/entidades faltantes ou incompletos (por dominio)

- Identidade e Organizacao
  - Faltam campos de organizacao esperados pela UI (`slug`, `logoUrl`, contato/endereco, `plan`).
  - Faltam modelos/fluxos de autenticacao (credencial, token, sessao/refresh).
- Paciente
  - Incompleto para UI: `serasaStatus`, `avatarUrl`, historico medico basico (`allergies`, `medicalNotes`) e documentos.
- Agendamento
  - Incompleto para UI: status, janela de horario (inicio/fim), procedimento, historico de mudanca.
- Prontuario/registro clinico
  - Incompleto para UI: tipagem de registro (`PROCEDURE/ANAMNESIS/NOTE/PHOTO`), titulo, anexos, relacao direta com dentista responsavel.
- Financeiro
  - Incompleto para UI: descricao, tipo receita/despesa, metodo de pagamento, vencimento, pagamento parcial, inadimplencia detalhada.
- Procedimentos
  - Ausente: entidade de catalogo com categoria, valor, duracao, ativo.
- Planos de tratamento
  - Ausente: `TreatmentPlan` e `TreatmentPlanItem` com status e parcelamento.
- Estoque
  - Ausente: item de estoque, lote/validade, historico de reposicao.
- Notificacoes
  - Ausente: notificacao por organizacao/usuario com estado de leitura.

## 8. Plano tecnico de implementacao em fases

### Fase 1: Fundacao/autenticacao
Objetivo: fechar risco de seguranca e padronizar contrato base.
- Implementar autenticacao real (JWT + refresh ou sessao) e endpoint `me`.
- Derivar `userId`, `organizationId` e `role` do token (nao do body/header livre).
- Definir padrao de DTO publico (camelCase, sem wrapper `props`).
- Ajustar middleware de erros para codigos corretos (`401/403/404/422/500`).
- Expandir `Organization` para campos usados na UI.

### Fase 2: Modulos centrais
Objetivo: tornar operacionais os fluxos principais da clinica.
- Pacientes: listar/criar/detalhar/editar/remover + busca.
- Agendamento: criar/listar/atualizar status/remarcar/cancelar + lembrete.
- Prontuario: leitura e criacao de registros clinicos aderentes a UI.
- Receituario: criar/listar/detalhar + exportacao.

### Fase 3: Modulos de suporte
Objetivo: cobrir dominios hoje inexistentes no backend.
- Procedimentos (catalogo da clinica).
- Planos de tratamento (itens, status, parcelamento).
- Financeiro avancado + fluxo de recebimento (payments) com split/desconto/recibo.
- Inventario basico.
- Notificacoes persistidas.

### Fase 4: Integracao frontend
Objetivo: remover mocks gradualmente sem quebrar UX.
- Criar camada de cliente API tipada no frontend.
- Migrar cada pagina/contexto por modulo (toggle gradual).
- Substituir `localStorage` de auth por sessao real.
- Trocar `clinic-context`, `procedures-context` e `notification-context` para dados remotos.

### Fase 5: Finalizacao
Objetivo: confiabilidade e prontidao para producao.
- Relatorios agregados.
- Testes de contrato (frontend-backend), RBAC e isolamento tenant.
- Observabilidade basica (logs estruturados, correlacao de request).
- Hardening de validacoes e politicas de erro.

## 9. Ordem recomendada de execucao

1. Definir contrato de API padrao (nomenclatura e formato de response).
2. Implementar autenticacao real e contexto de tenant por token.
3. Fechar matriz RBAC unica (documento + frontend + backend).
4. Alinhar modulo de pacientes (base para varios outros modulos).
5. Alinhar agendamento (impacta dashboard e notificacoes).
6. Alinhar prontuario e receituario (fluxo clinico principal).
7. Evoluir financeiro/pagamentos (fluxo administrativo principal).
8. Implementar procedimentos e treatment plans.
9. Implementar inventory e notifications persistidas.
10. Implementar reports e concluir migracao completa do frontend sem mocks.

Dependencias principais:
- (1)+(2)+(3) sao pre-requisitos para qualquer modulo sensivel.
- Pacientes e agendamento desbloqueiam dashboard e parte de financeiro.
- Procedimentos desbloqueiam treatment plans e partes de settings.

## 10. Riscos e decisoes arquiteturais

- Decisao 1: idioma e naming do contrato publico (`pt-BR` vs `en-US`).
- Decisao 2: estrategia de autenticacao (integrar com NextAuth do frontend ou JWT proprio no backend).
- Decisao 3: fonte unica de verdade para RBAC (matriz formal versionada).
- Decisao 4: modelo de prontuario (manter agregado atual ou migrar para `MedicalRecord` tipado).
- Decisao 5: modelagem financeira unica para atender `financial` e `payments` sem duplicacao.
- Decisao 6: estrategia de migracao de mocks para API (por modulo, com rollback facil).
- Decisao 7: estrategia de migracao de banco (Prisma migrations incrementais sem quebra).
- Decisao 8: nivel minimo de testes obrigatorios antes de liberar cada fase.

---

## Evidencias principais usadas nesta auditoria
- Frontend: `src/types/index.ts`, `src/lib/schemas.ts`, `src/contexts/*`, `src/app/login/page.tsx`, `src/app/(dashboard)/*`, `src/components/shared/*`, `src/components/layout/sidebar.tsx`, `src/components/auth/role-gate.tsx`.
- Backend: `DentalEasy-Backend/prisma/schema.prisma`, `DentalEasy-Backend/src/Http/routes/*`, `DentalEasy-Backend/src/Application/*`, `DentalEasy-Backend/src/Domains/*`, `DentalEasy-Backend/src/Infrastructure/*`, `DentalEasy-Backend/src/shared/*`.
- Documentacao DDD: `ddd_clinica_context.readme.md` e `DentalEasy-Backend/ddd_clinica_context.readme.md`.
