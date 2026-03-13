"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Organization } from "@/types";
import { useAuth } from "./auth-context";
import { getOrganizationSettings } from "@/lib/api";

interface ClinicContextType {
  organization: Organization | null;
  setOrganization: (org: Organization) => void;
  refreshOrganization: () => Promise<void>;
  organizationId: string | null;
  isLoading: boolean;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const { organization: authenticatedOrganization } = useAuth();
  const [organization, setOrganizationState] = useState<Organization | null>(
    authenticatedOrganization
  );
  const [isLoading, setIsLoading] = useState(true);

  const refreshOrganization = useCallback(async () => {
    if (!authenticatedOrganization) {
      setOrganizationState(null);
      setIsLoading(false);
      return;
    }

    setOrganizationState(authenticatedOrganization);
    setIsLoading(true);
    try {
      const settings = await getOrganizationSettings();
      setOrganizationState({
        id: settings.id,
        name: settings.name,
        slug: settings.slug,
        logoUrl: settings.logoUrl,
        phone: settings.phone,
        address: settings.address,
        city: settings.city,
        state: settings.state,
        cnpj: settings.document,
        plan: settings.plan,
      });
    } catch {
      setOrganizationState(authenticatedOrganization);
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedOrganization]);

  useEffect(() => {
    void refreshOrganization();
  }, [refreshOrganization]);

  const setOrganization = useCallback((org: Organization) => {
    setOrganizationState(org);
  }, []);

  return (
    <ClinicContext.Provider
      value={{
        organization,
        setOrganization,
        refreshOrganization,
        organizationId: organization?.id ?? null,
        isLoading,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error("useClinic must be used within a ClinicProvider");
  }
  return context;
}
