# README.md

# Sistema de Gestão de Clínicas Odontológicas (DDD)

## Visão Geral do Projeto

Este projeto é um **sistema web de gestão de clínicas odontológicas**, estruturado seguindo **Domain-Driven Design (DDD)**. O objetivo é **automatizar processos clínicos e administrativos**, garantindo **segurança, rastreabilidade e controle de permissões**.

O sistema suporta múltiplas clínicas, com **usuários restritos a cada clínica**, contemplando módulos críticos como:
- Cadastro de pacientes
- Prontuário médico/odontológico
- Financeiro e emissão de notas fiscais
- Agendamento de consultas
- Receituário odontológico

O README é estruturado como referência completa para o agente Codex, garantindo que ele **consulte o contexto antes de gerar código** e evite problemas de segurança ou alucinação.

---

## Tecnologias do Projeto

**Backend:** Node.js, Express, TypeScript

**Frontend:** Next.js (App Router), Tailwind CSS, Shadcn/ui

**Banco de Dados:** PostgreSQL com Prisma ORM

**Autenticação:** NextAuth.js com RBAC (Role-Based Access Control)

**Estilo e UI:** Moderno Profissional (Bento Grid), Fonte Inter, Azul Primário #0052CC

---

## Contextos Limitados (Bounded Contexts)

### 1. Contexto de Pacientes
- **Entidades principais:** `Paciente`, `ContatoPaciente`
- **Agregados:** `Paciente` (contendo dados pessoais e referência ao prontuário)
- **Serviços de Domínio:** `PacienteService`
- **Regras de Negócio:**
  - Garantir unicidade de CPF
  - Apenas usuários autorizados podem modificar dados

### 2. Contexto de Prontuário Médico
- **Entidades principais:** `Prontuario`, `Tratamento`, `Diagnostico`
- **Agregados:** `Prontuario`
- **Serviços de Domínio:** `ProntuarioService`
- **Regras de Negócio:**
  - Somente dentistas podem criar ou editar entradas
  - Exportação segura para formatos estruturados (CSV, JSON, PDF opcional)

### 3. Contexto Financeiro
- **Entidades principais:** `Pagamento`, `Boleto`, `NotaFiscal`
- **Agregados:** `Pagamento`
- **Serviços de Domínio:** `FinanceService`
- **Integrações Externas:** Serasa API (opcional), API da Fazenda
- **Regras de Negócio:** Secretárias podem acessar pagamentos, mas não podem modificar receituário

### 4. Contexto de Agendamento
- **Entidades principais:** `Consulta`, `Agenda`
- **Agregados:** `Agenda`
- **Serviços de Domínio:** `AgendamentoService`, `NotificacaoService`
- **Regras de Negócio:**
  - Alertas automáticos para pacientes
  - Consultas vinculadas a dentistas específicos

### 5. Contexto de Receituário Odontológico
- **Entidades principais:** `Receita`, `Dentista`
- **Agregados:** `Receita`
- **Serviços de Domínio:** `ReceituarioService`
- **Regras de Negócio:**
  - Apenas dentistas podem acessar ou criar receitas
  - Exportação para `.docx`
  - Secretárias não têm acesso

---

## Diagramas de Domínio (Conceituais)

**Paciente - Prontuário:**
```
Paciente 1 --- 1 Prontuario
Prontuario 1 --- * Tratamento
Prontuario 1 --- * Diagnostico
```

**Financeiro - Paciente:**
```
Paciente 1 --- * Pagamento
Pagamento 1 --- 1 Boleto
Pagamento 1 --- 0..1 NotaFiscal
```

**Agenda - Consulta - Dentista:**
```
Dentista 1 --- * Consulta
Agenda 1 --- * Consulta
Consulta 1 --- 1 Paciente
```

**Receituário - Dentista:**
```
Dentista 1 --- * Receita
Receita 1 --- 1 Paciente
```

---

## Estrutura de Pastas Recomendada (DDD)

``` /src
/Domains
  /Paciente
    Paciente.ts
    ContatoPaciente.ts
    IPacienteRepository.ts
    PacienteService.ts
  /Prontuario
    Prontuario.ts
    Tratamento.ts
    Diagnostico.ts
    IProntuarioRepository.ts
    ProntuarioService.ts
  /Financeiro
    Pagamento.ts
    Boleto.ts
    NotaFiscal.ts
    IPagamentoRepository.ts
    FinanceService.ts
  /Agendamento
    Consulta.ts
    Agenda.ts
    IAgendaRepository.ts
    AgendamentoService.ts
    NotificacaoService.ts
  /Receituario
    Receita.ts
    Dentista.ts
    IReceitaRepository.ts
    ReceituarioService.ts
/Infrastructure
  /Persistence
    Repositórios concretos
  /ExternalApis
    SerasaApi.ts
    FazendaApi.ts
    WhatsAppApi.ts
/Application
  Casos de uso, DTOs, interfaces de serviço
/Users
  Admin, Secretaria, Dentista
```

---

## Permissões e Regras de Acesso

| Usuário        | Permissões                                                                                  |
|----------------|---------------------------------------------------------------------------------------------|
| Admin Clínica  | Acesso total a todos os módulos da clínica                                                  |
| Secretária     | Cadastro de pacientes, agendamento e financeiro. **Não acessa receituário**                |
| Dentista       | Acesso exclusivo ao prontuário e receituário. Pode criar, consultar e exportar receitas     |

- Cada ação deve **respeitar o papel do usuário**
- Consultas e modificações são **limitadas à clínica logada**

---

## Integrações Externas

- Serasa API: consulta opcional de CPF para contratos de longo prazo
- API da Fazenda: emissão de nota fiscal eletrônica
- WhatsApp API: envio de alertas e lembretes de consultas

---

## Boas Práticas para o Agente Codex

1. Validar o **contexto do domínio** antes de gerar código.
2. **Não acessar dados fora do contexto da clínica**.
3. Respeitar **permissões e papéis**.
4. Gerar código modular e consistente com DDD.
5. Evitar alterações que possam comprometer a segurança ou integridade dos dados.
6. Seguir rigorosamente agregados, entidades e serviços de domínio para cada contexto.

---

## Fluxos de Dados Recomendados

**Cadastro de Paciente:**
```
Front-end (Next.js) -> PacienteService -> PacienteRepository (Prisma) -> PostgreSQL
```

**Registro de Consulta:**
```
Front-end -> AgendamentoService -> AgendaRepository -> PostgreSQL -> NotificacaoService -> WhatsApp API
```

**Criação de Receita:**
```
Dentista -> ReceituarioService -> ReceitaRepository -> PostgreSQL -> Exportar .docx
```

**Processamento Financeiro:**
```
Front-end -> FinanceService -> PagamentoRepository -> PostgreSQL -> (Fazenda API / Serasa API)
```

