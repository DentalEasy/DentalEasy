"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ─── Types ───
export interface Procedure {
  id: string;
  name: string;
  category: ProcedureCategory;
  price: number;
  duration: number; // minutes
  active: boolean;
}

export type ProcedureCategory =
  | "PREVENTIVO"
  | "RESTAURADOR"
  | "ENDODONTIA"
  | "CIRURGIA"
  | "PROTESE"
  | "ORTODONTIA"
  | "ESTETICA"
  | "OUTROS";

export const categoryLabels: Record<ProcedureCategory, string> = {
  PREVENTIVO: "Preventivo",
  RESTAURADOR: "Restaurador",
  ENDODONTIA: "Endodontia",
  CIRURGIA: "Cirurgia",
  PROTESE: "Prótese",
  ORTODONTIA: "Ortodontia",
  ESTETICA: "Estética",
  OUTROS: "Outros",
};

// ─── Default procedures for a dental clinic ───
const DEFAULT_PROCEDURES: Procedure[] = [
  // Preventivo
  { id: "proc-01", name: "Limpeza (Profilaxia)", category: "PREVENTIVO", price: 250, duration: 60, active: true },
  { id: "proc-02", name: "Aplicação de Flúor", category: "PREVENTIVO", price: 80, duration: 30, active: true },
  { id: "proc-03", name: "Raspagem Periodontal", category: "PREVENTIVO", price: 350, duration: 60, active: true },
  // Restaurador
  { id: "proc-04", name: "Restauração Simples (Resina)", category: "RESTAURADOR", price: 200, duration: 45, active: true },
  { id: "proc-05", name: "Restauração Composta", category: "RESTAURADOR", price: 350, duration: 60, active: true },
  { id: "proc-06", name: "Bloco/Inlay/Onlay", category: "RESTAURADOR", price: 800, duration: 90, active: true },
  // Endodontia
  { id: "proc-07", name: "Tratamento de Canal (Unirradicular)", category: "ENDODONTIA", price: 800, duration: 90, active: true },
  { id: "proc-08", name: "Tratamento de Canal (Multirradicular)", category: "ENDODONTIA", price: 1200, duration: 120, active: true },
  { id: "proc-09", name: "Retratamento de Canal", category: "ENDODONTIA", price: 1500, duration: 120, active: true },
  // Cirurgia
  { id: "proc-10", name: "Extração Simples", category: "CIRURGIA", price: 300, duration: 45, active: true },
  { id: "proc-11", name: "Extração de Siso", category: "CIRURGIA", price: 600, duration: 90, active: true },
  { id: "proc-12", name: "Implante Dentário (Unitário)", category: "CIRURGIA", price: 3500, duration: 120, active: true },
  // Prótese
  { id: "proc-13", name: "Coroa de Porcelana", category: "PROTESE", price: 1800, duration: 90, active: true },
  { id: "proc-14", name: "Prótese Total", category: "PROTESE", price: 2500, duration: 60, active: true },
  { id: "proc-15", name: "Prótese Parcial Removível", category: "PROTESE", price: 1500, duration: 60, active: true },
  // Ortodontia
  { id: "proc-16", name: "Aparelho Ortodôntico (Instalação)", category: "ORTODONTIA", price: 2000, duration: 90, active: true },
  { id: "proc-17", name: "Manutenção Ortodôntica (Mensal)", category: "ORTODONTIA", price: 250, duration: 30, active: true },
  // Estética
  { id: "proc-18", name: "Clareamento (Consultório)", category: "ESTETICA", price: 1200, duration: 90, active: true },
  { id: "proc-19", name: "Clareamento (Caseiro + Moldeira)", category: "ESTETICA", price: 600, duration: 30, active: true },
  { id: "proc-20", name: "Faceta de Porcelana (Unitária)", category: "ESTETICA", price: 2500, duration: 90, active: true },
  { id: "proc-21", name: "Lente de Contato Dental", category: "ESTETICA", price: 3000, duration: 90, active: true },
  // Outros
  { id: "proc-22", name: "Consulta / Avaliação", category: "OUTROS", price: 150, duration: 30, active: true },
  { id: "proc-23", name: "Raio-X Periapical", category: "OUTROS", price: 50, duration: 15, active: true },
  { id: "proc-24", name: "Raio-X Panorâmico", category: "OUTROS", price: 120, duration: 15, active: true },
];

// ─── Context ───
interface ProceduresContextType {
  procedures: Procedure[];
  activeProcedures: Procedure[];
  addProcedure: (data: Omit<Procedure, "id">) => void;
  updateProcedure: (id: string, data: Partial<Omit<Procedure, "id">>) => void;
  removeProcedure: (id: string) => void;
  toggleProcedure: (id: string) => void;
  getProcedureByName: (name: string) => Procedure | undefined;
  getProcedureById: (id: string) => Procedure | undefined;
  categories: ProcedureCategory[];
}

const ProceduresContext = createContext<ProceduresContextType | null>(null);

export function ProceduresProvider({ children }: { children: ReactNode }) {
  const [procedures, setProcedures] = useState<Procedure[]>(DEFAULT_PROCEDURES);

  const activeProcedures = procedures.filter((p) => p.active);

  const addProcedure = useCallback((data: Omit<Procedure, "id">) => {
    const id = `proc-${Date.now()}`;
    setProcedures((prev) => [...prev, { ...data, id }]);
  }, []);

  const updateProcedure = useCallback((id: string, data: Partial<Omit<Procedure, "id">>) => {
    setProcedures((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  }, []);

  const removeProcedure = useCallback((id: string) => {
    setProcedures((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const toggleProcedure = useCallback((id: string) => {
    setProcedures((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  }, []);

  const getProcedureByName = useCallback(
    (name: string) => procedures.find((p) => p.name.toLowerCase().includes(name.toLowerCase())),
    [procedures]
  );

  const getProcedureById = useCallback(
    (id: string) => procedures.find((p) => p.id === id),
    [procedures]
  );

  const categories = Object.keys(categoryLabels) as ProcedureCategory[];

  return (
    <ProceduresContext.Provider
      value={{
        procedures,
        activeProcedures,
        addProcedure,
        updateProcedure,
        removeProcedure,
        toggleProcedure,
        getProcedureByName,
        getProcedureById,
        categories,
      }}
    >
      {children}
    </ProceduresContext.Provider>
  );
}

export function useProcedures() {
  const context = useContext(ProceduresContext);
  if (!context) {
    throw new Error("useProcedures must be used within a ProceduresProvider");
  }
  return context;
}
