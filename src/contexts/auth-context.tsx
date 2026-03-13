"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Role, Organization } from "@/types";
import {
  authLogin,
  authMe,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  hasRole: (roles: Role | Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        setUser(null);
        setOrganization(null);
        return;
      }

      const session = await authMe();
      setUser(session.user);
      setOrganization(session.organization);
    } catch {
      clearStoredToken();
      setUser(null);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string) => {
    const session = await authLogin(email, password);
    setStoredToken(session.token);
    setUser(session.user);
    setOrganization(session.organization);
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
    setOrganization(null);
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        role: user?.role ?? null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshSession,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
