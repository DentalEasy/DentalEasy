"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Shield,
  Users,
  TrendingUp,
  MessageCircle,
  FileText,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import {
  ScrollReveal,
  AnimatedCounter,
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  staggerContainer,
  staggerContainerSlow,
} from "@/lib/animations";
import { cn } from "@/lib/utils";

// ─── Landing Button ───
function LandingButton({
  children,
  variant = "primary",
  size = "default",
  className,
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "lg";
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 cursor-pointer",
        variant === "primary" && "bg-neutral-900 text-white hover:bg-neutral-800",
        variant === "secondary" && "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50",
        variant === "ghost" && "text-neutral-500 hover:text-neutral-900",
        size === "default" && "h-10 px-5 text-sm",
        size === "lg" && "h-12 px-7 text-sm",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ─── Feature Card ───
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CalendarDays;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all duration-200 hover:shadow-md hover:border-neutral-300">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 transition-colors group-hover:bg-neutral-900 group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1.5">{title}</h3>
      <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Testimonial Card ───
function TestimonialCard({
  quote,
  name,
  role,
  clinic,
}: {
  quote: string;
  name: string;
  role: string;
  clinic: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 h-full flex flex-col">
      <p className="text-sm text-neutral-600 leading-relaxed flex-1">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-5 pt-4 border-t border-neutral-100">
        <p className="text-sm font-medium text-neutral-900">{name}</p>
        <p className="text-xs text-neutral-400 mt-0.5">
          {role}, {clinic}
        </p>
      </div>
    </div>
  );
}

// ─── Pricing Card ───
function PricingCard({
  name,
  price,
  description,
  features,
  highlighted = false,
  cta,
  onCtaClick,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  onCtaClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border p-8 h-full flex flex-col",
        highlighted
          ? "border-neutral-900 bg-white shadow-lg"
          : "border-neutral-200 bg-white"
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-6">
          <span className="inline-flex items-center rounded-md bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-white">
            Popular
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-neutral-900">{name}</h3>
        <p className="text-sm text-neutral-400 mt-0.5">{description}</p>
      </div>
      <div className="mb-6">
        <span className="text-3xl font-bold text-neutral-900 tracking-tight">{price}</span>
        <span className="text-sm text-neutral-400">/mês</span>
      </div>
      <ul className="space-y-2.5 mb-8 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-neutral-600">
            <CheckCircle2 className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>
      <LandingButton
        variant={highlighted ? "primary" : "secondary"}
        className="w-full"
        onClick={onCtaClick}
      >
        {cta}
      </LandingButton>
    </div>
  );
}

// ━━━━━━ LANDING PAGE ━━━━━━
export default function LandingPage() {
  const previewRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToPreview = () => {
    previewRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ══ NAV ══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-500 text-white">
              <Stethoscope className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold text-neutral-900">DentalSaaS</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              Preços
            </a>
            <a href="#testimonials" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
              Depoimentos
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <LandingButton variant="ghost">Entrar</LandingButton>
            </Link>
            <Link href="/dashboard">
              <LandingButton variant="primary">
                Começar Grátis
              </LandingButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-2xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp} className="mb-5">
              <span className="inline-flex items-center rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                Gestão Odontológica Moderna
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.1]"
            >
              Sua clínica,{" "}
              <span className="text-primary-500">simplificada</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-5 text-base md:text-lg text-neutral-500 leading-relaxed max-w-lg mx-auto"
            >
              Agenda, prontuário, financeiro e WhatsApp automático.
              Tudo em uma plataforma feita para dentistas.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link href="/dashboard">
                <LandingButton variant="primary" size="lg">
                  Começar Gratuitamente
                  <ArrowRight className="h-4 w-4" />
                </LandingButton>
              </Link>
              <LandingButton variant="secondary" size="lg" onClick={scrollToPreview}>
                Ver Demo
              </LandingButton>
            </motion.div>

            <motion.p
              variants={fadeInUp}
              className="mt-6 text-xs text-neutral-400"
            >
              Sem cartão de crédito · Setup em 5 minutos · +200 clínicas ativas
            </motion.p>
          </motion.div>

          {/* Dashboard Preview */}
          <ScrollReveal className="mt-16">
            <div ref={previewRef} className="relative max-w-3xl mx-auto">
              <div className="rounded-xl border border-neutral-200 bg-white shadow-xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-neutral-100">
                  <div className="h-2 w-2 rounded-full bg-neutral-200" />
                  <div className="h-2 w-2 rounded-full bg-neutral-200" />
                  <div className="h-2 w-2 rounded-full bg-neutral-200" />
                  <div className="flex-1 flex justify-center">
                    <div className="h-5 w-52 rounded bg-neutral-50 flex items-center justify-center">
                      <span className="text-[10px] text-neutral-400">app.dentalsaas.com.br</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-neutral-50">
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Consultas", value: "8" },
                      { label: "Pacientes", value: "342" },
                      { label: "Receita", value: "R$ 3.450" },
                      { label: "Mensagens", value: "22/24" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg border border-neutral-200 bg-white p-3">
                        <span className="text-[10px] text-neutral-400 block">{stat.label}</span>
                        <span className="text-sm font-semibold text-neutral-900 block mt-0.5">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 rounded-lg border border-neutral-200 bg-white p-3 h-24">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-2 mb-1.5">
                          <div className="h-5 w-5 rounded-full bg-neutral-100" />
                          <div className="h-2 flex-1 bg-neutral-50 rounded" />
                          <div className="h-4 w-14 bg-neutral-50 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white p-3 h-24">
                      <div className="h-2 w-12 bg-neutral-100 rounded mb-2" />
                      {[1, 2].map((i) => (
                        <div key={i} className="h-5 bg-neutral-50 rounded mb-1.5" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="py-12 border-y border-neutral-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 200, suffix: "+", label: "Clínicas ativas" },
              { value: 15000, suffix: "+", label: "Pacientes gerenciados" },
              { value: 98, suffix: "%", label: "Satisfação" },
              { value: 50000, suffix: "+", label: "Consultas agendadas" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-neutral-900">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-neutral-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" className="py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal className="text-center max-w-xl mx-auto mb-12">
            <p className="text-xs font-medium text-primary-500 uppercase tracking-wider mb-3">Recursos</p>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              Tudo para sua clínica.{" "}
              <span className="text-neutral-400">Nada a mais.</span>
            </h2>
          </ScrollReveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainerSlow}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {[
              { icon: CalendarDays, title: "Agenda Inteligente", description: "Calendário visual com cores por status, lembretes automáticos via WhatsApp e gestão de horários." },
              { icon: Users, title: "Prontuário Digital", description: "Timeline completa do paciente com histórico, anamnese, fotos e documentos em um só lugar." },
              { icon: TrendingUp, title: "Financeiro Integrado", description: "Fluxo de caixa em tempo real, controle de recebíveis, emissão de NF-e e relatórios." },
              { icon: MessageCircle, title: "WhatsApp Automático", description: "Confirmação de consultas, lembretes e cobranças enviados automaticamente." },
              { icon: FileText, title: "Receituário Digital", description: "Prescrições com exportação em DOCX e PDF. Modelos personalizáveis." },
              { icon: Shield, title: "Segurança & RBAC", description: "Controle de acesso por cargo. Dados isolados por clínica com criptografia." },
            ].map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ MULTI-TENANT ══ */}
      <section className="py-20 md:py-24 bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal variants={fadeInLeft}>
              <p className="text-xs font-medium text-primary-500 uppercase tracking-wider mb-3">Multi-tenant</p>
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
                Uma plataforma.
                <br />
                Múltiplas clínicas.
              </h2>
              <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
                Cada clínica opera em seu próprio ambiente isolado com dados seguros
                e controle total. Ideal para redes e franquias.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Isolamento total de dados por clínica",
                  "Painel admin para gestão multi-unidade",
                  "Permissões por cargo: Admin, Dentista, Secretária",
                  "Conformidade LGPD",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-neutral-600">
                    <CheckCircle2 className="h-4 w-4 text-neutral-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <LandingButton variant="primary" onClick={() => scrollToSection("features")}>
                  Saiba Mais
                  <ChevronRight className="h-3.5 w-3.5" />
                </LandingButton>
              </div>
            </ScrollReveal>

            <ScrollReveal variants={fadeInRight}>
              <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
                {[
                  { name: "Clínica Odonto Jales", city: "Jales — SP", active: true },
                  { name: "OdontoVida Campinas", city: "Campinas — SP", active: true },
                  { name: "Sorriso Perfeito", city: "São Paulo — SP", active: false },
                ].map((clinic) => (
                  <div
                    key={clinic.name}
                    className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100">
                      <Stethoscope className="h-4 w-4 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{clinic.name}</p>
                      <p className="text-xs text-neutral-400">{clinic.city}</p>
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      clinic.active ? "text-success-600" : "text-warning-600"
                    )}>
                      {clinic.active ? "Ativo" : "Trial"}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section id="testimonials" className="py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal className="text-center max-w-xl mx-auto mb-12">
            <p className="text-xs font-medium text-primary-500 uppercase tracking-wider mb-3">Depoimentos</p>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              Quem usa, recomenda
            </h2>
          </ScrollReveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainerSlow}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              {
                quote: "Reduziu meu tempo com papelada em 70%. A agenda inteligente mudou a rotina da minha clínica.",
                name: "Dra. Camila Ferreira",
                role: "Dentista",
                clinic: "OdontoVida",
              },
              {
                quote: "O controle financeiro é incrível. Hoje sei exatamente quanto cada procedimento gera de receita.",
                name: "Dr. Rafael Santos",
                role: "Administrador",
                clinic: "Sorrir Odontologia",
              },
              {
                quote: "Os lembretes por WhatsApp reduziram faltas em 40%. ROI se pagou no primeiro mês.",
                name: "Ana Paula Lima",
                role: "Secretária",
                clinic: "DentalCare",
              },
            ].map((t) => (
              <motion.div key={t.name} variants={fadeInUp}>
                <TestimonialCard {...t} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="py-20 md:py-24 bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal className="text-center max-w-xl mx-auto mb-12">
            <p className="text-xs font-medium text-primary-500 uppercase tracking-wider mb-3">Preços</p>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              Simples e transparente
            </h2>
            <p className="mt-3 text-sm text-neutral-500">
              Sem surpresas. Sem taxas escondidas. Cancele quando quiser.
            </p>
          </ScrollReveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainerSlow}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto"
          >
            <motion.div variants={fadeInUp}>
              <PricingCard
                name="Starter"
                price="R$ 97"
                description="Para clínicas iniciantes"
                features={["Até 100 pacientes", "Agenda inteligente", "1 usuário", "Suporte por e-mail"]}
                cta="Começar Grátis"
                onCtaClick={() => router.push("/dashboard")}
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <PricingCard
                name="Profissional"
                price="R$ 197"
                description="Para clínicas em crescimento"
                features={["Pacientes ilimitados", "Agenda + Financeiro", "5 usuários", "WhatsApp automático", "Prontuário digital", "Suporte prioritário"]}
                highlighted
                cta="Começar Agora"
                onCtaClick={() => router.push("/dashboard")}
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <PricingCard
                name="Enterprise"
                price="R$ 397"
                description="Para redes e franquias"
                features={["Tudo do Profissional", "Multi-clínica", "Usuários ilimitados", "API de integração", "NF-e automática", "Gerente dedicado"]}
                cta="Falar com Vendas"
                onCtaClick={() => router.push("/dashboard")}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              Pronto para simplificar sua clínica?
            </h2>
            <p className="mt-4 text-sm text-neutral-500 max-w-md mx-auto">
              Comece gratuitamente e veja resultados na primeira semana.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link href="/dashboard">
                <LandingButton variant="primary" size="lg">
                  Começar Gratuitamente
                  <ArrowRight className="h-4 w-4" />
                </LandingButton>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-neutral-100 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-500 text-white">
                  <Stethoscope className="h-3 w-3" />
                </div>
                <span className="text-sm font-semibold text-neutral-900">DentalSaaS</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                A plataforma de gestão odontológica mais moderna do Brasil.
              </p>
            </div>
            {[
              { title: "Produto", links: [
                { label: "Recursos", action: () => scrollToSection("features") },
                { label: "Preços", action: () => scrollToSection("pricing") },
                { label: "Integrações", action: () => scrollToSection("features") },
                { label: "Changelog", action: () => scrollToSection("features") },
              ]},
              { title: "Empresa", links: [
                { label: "Sobre", action: () => scrollToSection("testimonials") },
                { label: "Blog", action: () => scrollToSection("features") },
                { label: "Carreiras", action: () => scrollToSection("testimonials") },
                { label: "Contato", action: () => scrollToSection("pricing") },
              ]},
              { title: "Legal", links: [
                { label: "Privacidade", action: () => scrollToSection("features") },
                { label: "Termos", action: () => scrollToSection("features") },
                { label: "LGPD", action: () => scrollToSection("features") },
                { label: "SLA", action: () => scrollToSection("pricing") },
              ]},
            ].map((group) => (
              <div key={group.title}>
                <h4 className="text-xs font-semibold text-neutral-900 mb-3">{group.title}</h4>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={link.action}
                        className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-400">
              © 2026 DentalSaaS. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
