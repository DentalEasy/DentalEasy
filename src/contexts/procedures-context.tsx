"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createProcedure,
  deleteProcedure as deleteProcedureApi,
  listProcedures,
  toggleProcedure as toggleProcedureApi,
  updateProcedure as updateProcedureApi,
} from "@/lib/api";
import type { Procedure as ApiProcedure } from "@/types";

export type ProcedureCategory =
  | "PREVENTIVO"
  | "RESTAURADOR"
  | "ENDODONTIA"
  | "CIRURGIA"
  | "PROTESE"
  | "ORTODONTIA"
  | "ESTETICA"
  | "OUTROS";

export interface Procedure {
  id: string;
  name: string;
  category: ProcedureCategory;
  description?: string;
  price: number;
  duration: number;
  active: boolean;
}

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

interface ProceduresContextType {
  procedures: Procedure[];
  activeProcedures: Procedure[];
  isLoading: boolean;
  addProcedure: (data: Omit<Procedure, "id">) => Promise<Procedure | null>;
  updateProcedure: (
    id: string,
    data: Partial<Omit<Procedure, "id">>
  ) => Promise<Procedure | null>;
  removeProcedure: (id: string) => Promise<void>;
  toggleProcedure: (id: string) => Promise<void>;
  getProcedureByName: (name: string) => Procedure | undefined;
  getProcedureById: (id: string) => Procedure | undefined;
  refreshProcedures: () => Promise<void>;
  categories: ProcedureCategory[];
}

const ProceduresContext = createContext<ProceduresContextType | null>(null);

const categories = Object.keys(categoryLabels) as ProcedureCategory[];

const normalizeCategory = (value?: string): ProcedureCategory =>
  categories.includes(value as ProcedureCategory)
    ? (value as ProcedureCategory)
    : "OUTROS";

const mapApiProcedure = (procedure: ApiProcedure): Procedure => ({
  id: procedure.id,
  name: procedure.name,
  category: normalizeCategory(procedure.category),
  description: procedure.description,
  price: procedure.price,
  duration: procedure.durationMinutes,
  active: procedure.active,
});

export function ProceduresProvider({ children }: { children: ReactNode }) {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProcedures = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listProcedures();
      setProcedures(data.map((procedure) => mapApiProcedure(procedure)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProcedures();
  }, [refreshProcedures]);

  const activeProcedures = useMemo(
    () => procedures.filter((procedure) => procedure.active),
    [procedures]
  );

  const addProcedure = useCallback(async (data: Omit<Procedure, "id">) => {
    const created = await createProcedure({
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      durationMinutes: data.duration,
      active: data.active,
    });
    const mapped = mapApiProcedure(created);
    setProcedures((current) => [mapped, ...current]);
    return mapped;
  }, []);

  const updateProcedure = useCallback(
    async (id: string, data: Partial<Omit<Procedure, "id">>) => {
      const updated = await updateProcedureApi(id, {
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        durationMinutes: data.duration,
        active: data.active,
      });
      const mapped = mapApiProcedure(updated);
      setProcedures((current) =>
        current.map((procedure) => (procedure.id === id ? mapped : procedure))
      );
      return mapped;
    },
    []
  );

  const removeProcedure = useCallback(async (id: string) => {
    await deleteProcedureApi(id);
    setProcedures((current) =>
      current.filter((procedure) => procedure.id !== id)
    );
  }, []);

  const toggleProcedure = useCallback(
    async (id: string) => {
      const currentProcedure = procedures.find((procedure) => procedure.id === id);
      const updated = await toggleProcedureApi(
        id,
        currentProcedure ? !currentProcedure.active : undefined
      );
      const mapped = mapApiProcedure(updated);
      setProcedures((current) =>
        current.map((procedure) => (procedure.id === id ? mapped : procedure))
      );
    },
    [procedures]
  );

  const getProcedureByName = useCallback(
    (name: string) =>
      procedures.find((procedure) =>
        procedure.name.toLowerCase().includes(name.toLowerCase())
      ),
    [procedures]
  );

  const getProcedureById = useCallback(
    (id: string) => procedures.find((procedure) => procedure.id === id),
    [procedures]
  );

  return (
    <ProceduresContext.Provider
      value={{
        procedures,
        activeProcedures,
        isLoading,
        addProcedure,
        updateProcedure,
        removeProcedure,
        toggleProcedure,
        getProcedureByName,
        getProcedureById,
        refreshProcedures,
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
