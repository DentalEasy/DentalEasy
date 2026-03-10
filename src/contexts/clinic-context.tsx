"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Organization } from "@/types";

interface ClinicContextType {
  organization: Organization | null;
  setOrganization: (org: Organization) => void;
  organizationId: string | null;
  isLoading: boolean;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

// Organização mock para desenvolvimento
const MOCK_ORGANIZATION: Organization = {
  id: "org_01",
  name: "Clínica Odonto Jales",
  slug: "odonto-jales",
  logoUrl: undefined,
  phone: "(17) 99999-9999",
  address: "Rua São Paulo, 1234",
  city: "Jales",
  state: "SP",
  cnpj: "12.345.678/0001-90",
  plan: "PRO",
};

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganizationState] = useState<Organization | null>(
    MOCK_ORGANIZATION
  );
  const [isLoading] = useState(false);

  const setOrganization = useCallback((org: Organization) => {
    setOrganizationState(org);
  }, []);

  return (
    <ClinicContext.Provider
      value={{
        organization,
        setOrganization,
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
