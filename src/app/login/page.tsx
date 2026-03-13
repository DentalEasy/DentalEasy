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
import { ApiError, authLogin, setStoredToken } from "@/lib/api";

interface QuickCredential {
  email: string;
  password: string;
  label: string;
  description: string;
  icon: typeof Shield;
  color: string;
}

const QUICK_CREDENTIALS: QuickCredential[] = [
  {
    email: "admin@teste.com",
    password: "admin",
    label: "Administrador",
    description: "Acesso total: gestao, estoque, configuracoes, relatorios",
    icon: Shield,
    color: "bg-red-50 text-red-600 border-red-200",
  },
  {
    email: "dentista@teste.com",
    password: "dentista",
    label: "Dentista",
    description: "Prontuario, receitas, agenda, relatorios",
    icon: UserCheck,
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  {
    email: "secretaria@teste.com",
    password: "secretaria",
    label: "Secretaria",
    description: "Agenda, cadastro, financeiro basico",
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

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    if (!loginEmail || !loginPassword) {
      setError("Preencha e-mail e senha");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const session = await authLogin(loginEmail.toLowerCase().trim(), loginPassword);
      setStoredToken(session.token);
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Nao foi possivel entrar. Tente novamente.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await doLogin(email, password);
  };

  const handleQuickLogin = async (cred: QuickCredential) => {
    setEmail(cred.email);
    setPassword(cred.password);
    await doLogin(cred.email, cred.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary-500 text-white mb-4">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900">DentalSaaS</h1>
          <p className="text-sm text-neutral-400 mt-1">Sistema de Gestao Odontologica</p>
        </div>

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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
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
                    placeholder="******"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="pl-9 pr-9"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-md px-3 py-2">{error}</p>
              )}

              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
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

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px bg-neutral-200 flex-1" />
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              Acesso rapido
            </span>
            <div className="h-px bg-neutral-200 flex-1" />
          </div>

          <div className="space-y-2">
            {QUICK_CREDENTIALS.map((cred) => {
              const Icon = cred.icon;
              return (
                <button
                  key={cred.email}
                  onClick={() => void handleQuickLogin(cred)}
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

        <p className="text-center text-[11px] text-neutral-300">
          Ambiente de demonstracao - dados de desenvolvimento
        </p>
      </div>
    </div>
  );
}
