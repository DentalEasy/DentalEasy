"use client";

import type { Role } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import type { ReactNode } from "react";

interface RoleGateProps {
  /** Roles permitidas para ver este conteúdo */
  allowedRoles: Role | Role[];
  children: ReactNode;
  /** Conteúdo alternativo quando o usuário não tem permissão */
  fallback?: ReactNode;
}

/**
 * Componente de controle de acesso por Role.
 * Oculta o children se o usuário não tem a role necessária.
 */
export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { hasRole } = useAuth();

  if (!hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleBlockedProps {
  /** Roles que NÃO podem ver este conteúdo */
  blockedRoles: Role | Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Inverso do RoleGate: oculta para as roles especificadas.
 */
export function RoleBlocked({ blockedRoles, children, fallback = null }: RoleBlockedProps) {
  const { hasRole } = useAuth();

  if (hasRole(blockedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
