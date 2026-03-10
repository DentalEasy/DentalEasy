# Regras do Projeto: DentalSaaS

## Stack Tecnológica
- Framework: Next.js (App Router), Tailwind CSS, Shadcn/ui.
- Banco de Dados: PostgreSQL com Prisma ORM.
- Autenticação: NextAuth.js com RBAC (Role-Based Access Control).
- Estilo: Moderno Profissional (Bento Grid), Fonte Inter, Azul Primário #0052CC.

## Regras de Negócio Fundamentais (Multi-tenant)
- Toda tabela (exceto a de Clinics/Organizations) DEVE ter uma coluna `organization_id`.
- O isolamento de dados por clínica é obrigatório e inegociável.
- Níveis de Acesso:
  - 'ADMIN': Gestão total da clínica.
  - 'SECRETARY': Agenda, Cadastro, Financeiro Básico (Sem acesso a Prontuário/Receita).
  - 'DENTIST': Acesso total, incluindo Prontuário e Emissão de Receitas (.docx).

## Padrões de Código
- Use TypeScript estrito.
- Componentes React funcionais com 'use client' ou Server Components conforme necessário.
- Ícones: Lucide-react.