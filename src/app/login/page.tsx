"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Users,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, Button, Input } from "@/components/ui";
import type { User, Role } from "@/types";

// ─── Mock credentials ───
interface MockCredential {
  email: string;
  password: string;
  user: User;
  label: string;
  description: string;
  icon: typeof Shield;
  color: string;
}

const MOCK_CREDENTIALS: MockCredential[] = [
  {
    email: "admin@teste.com",
    password: "admin",
    user: {
      id: "user_admin",
      name: "Dr. Lucas Mendes",
      email: "admin@teste.com",
      role: "ADMIN",
      avatarUrl: undefined,
      organizationId: "org_01",
    },
    label: "Administrador",
    description: "Acesso total: gestão, estoque, configurações, relatórios",
    icon: Shield,
    color: "bg-red-50 text-red-600 border-red-200",
  },
  {
    email: "dentista@teste.com",
    password: "dentista",
    user: {
      id: "user_dentist",
      name: "Dra. Camila Santos",
      email: "dentista@teste.com",
      role: "DENTIST",
      avatarUrl: undefined,
      organizationId: "org_01",
    },
    label: "Dentista",
    description: "Prontuário, receitas, agenda, relatórios",
    icon: UserCheck,
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  {
    email: "secretaria@teste.com",
    password: "secretaria",
    user: {
      id: "user_secretary",
      name: "Ana Beatriz Lima",
      email: "secretaria@teste.com",
      role: "SECRETARY",
      avatarUrl: undefined,
      organizationId: "org_01",
    },
    label: "Secretária",
    description: "Agenda, cadastro, financeiro básico",
    icon: Users,
    color: "bg-green-50 text-green-600 border-green-200",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Preencha e-mail e senha");
      return;
    }

    setIsLoading(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    const cred = MOCK_CREDENTIALS.find(
      (c) => c.email === email.toLowerCase().trim() && c.password === password
    );

    if (!cred) {
      setError("E-mail ou senha inválidos");
      setIsLoading(false);
      return;
    }

    // Store user in localStorage so auth-context can pick it up
    localStorage.setItem("dental-saas-user", JSON.stringify(cred.user));
    router.push("/dashboard");
  };

  const handleQuickLogin = async (cred: MockCredential) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError("");
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 400));

    localStorage.setItem("dental-saas-user", JSON.stringify(cred.user));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary-500 text-white mb-4">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900">DentalSaaS</h1>
          <p className="text-sm text-neutral-400 mt-1">Sistema de Gestão Odontológica</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1.5 block">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="pl-9 pr-9"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-md px-3 py-2">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Access - Test Accounts */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px bg-neutral-200 flex-1" />
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Acesso rápido</span>
            <div className="h-px bg-neutral-200 flex-1" />
          </div>

          <div className="space-y-2">
            {MOCK_CREDENTIALS.map((cred) => {
              const Icon = cred.icon;
              return (
                <button
                  key={cred.email}
                  onClick={() => handleQuickLogin(cred)}
                  disabled={isLoading}
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-sm cursor-pointer disabled:opacity-50 ${cred.color}`}
                >
                  <div className="p-1.5 rounded-md bg-white/80">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{cred.label}</span>
                    </div>
                    <p className="text-[11px] opacity-70 truncate">{cred.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-mono opacity-60">{cred.email}</p>
                    <p className="text-[10px] font-mono opacity-60">senha: {cred.password}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-neutral-300">
          Ambiente de demonstração · Dados fictícios
        </p>
      </div>
    </div>
  );
}
