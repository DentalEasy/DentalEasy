"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  MoreHorizontal,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Eye,
  Edit,
  ClipboardList,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Skeleton,
} from "@/components/ui";
import { RoleGate } from "@/components/auth";
import { formatCPF, formatPhone } from "@/lib/utils";
import { PageTransition } from "@/lib/animations";
import { NewPatientModal } from "@/components/shared";
import { useToast } from "@/components/ui/toast";
import {
  ApiError,
  createPatient,
  deletePatient,
  listPatients,
  type UpsertPatientPayload,
} from "@/lib/api";
import type { Patient } from "@/types";
import type { PatientFormData } from "@/lib/schemas";

function SerasaBadge({ status }: { status: Patient["serasaStatus"] }) {
  const config = {
    GREEN: {
      variant: "serasa-green" as const,
      label: "Regular",
      icon: ShieldCheck,
    },
    YELLOW: {
      variant: "serasa-yellow" as const,
      label: "Atencao",
      icon: ShieldAlert,
    },
    RED: {
      variant: "serasa-red" as const,
      label: "Pendencia",
      icon: Shield,
    },
  };
  const { variant, label, icon: Icon } = config[status];
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export function PatientListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100"
        >
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

const mapFormToPayload = (data: PatientFormData): UpsertPatientPayload => ({
  name: data.name,
  email: data.email || undefined,
  phone: data.phone,
  cpf: data.cpf,
  birthDate: data.birthDate,
  address: data.address || undefined,
  allergies: data.allergies || undefined,
  medicalNotes: data.medicalNotes || undefined,
});

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [serasaFilter, setSerasaFilter] = useState<string>("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const router = useRouter();
  const { addToast } = useToast();

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const data = await listPatients();
      setPatients(data);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel carregar pacientes.";
      addToast({ title: "Erro ao carregar", description: message, variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPatients();
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const normalizedSearch = search.toLowerCase();
      const digitsSearch = search.replace(/\D/g, "");
      const matchesSearch =
        p.name.toLowerCase().includes(normalizedSearch) ||
        p.cpf.includes(digitsSearch) ||
        p.phone.includes(digitsSearch);
      const matchesSerasa =
        serasaFilter === "all" || p.serasaStatus === serasaFilter;
      return matchesSearch && matchesSerasa;
    });
  }, [patients, search, serasaFilter]);

  const handleDeletePatient = async (patient: Patient) => {
    try {
      setMenuOpenId(null);
      await deletePatient(patient.id);
      setPatients((current) => current.filter((p) => p.id !== patient.id));
      addToast({
        title: "Paciente removido",
        description: `${patient.name} foi removido com sucesso`,
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel remover paciente.";
      addToast({ title: "Erro ao remover", description: message, variant: "error" });
    }
  };

  const handleCreatePatient = async (formData: PatientFormData) => {
    try {
      const created = await createPatient(mapFormToPayload(formData));
      setPatients((current) => [created, ...current]);
      addToast({
        title: "Paciente cadastrado",
        description: `${created.name} foi adicionado com sucesso`,
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel cadastrar paciente.";
      addToast({ title: "Erro ao cadastrar", description: message, variant: "error" });
      throw err;
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Pacientes</h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              Gerencie os pacientes da sua clinica
            </p>
          </div>
          <Button onClick={() => setNewPatientOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nome, CPF ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                className="gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>

            {showFilters && (
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                  Status Serasa
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "Todos" },
                    { value: "GREEN", label: "Regular" },
                    { value: "YELLOW", label: "Atencao" },
                    { value: "RED", label: "Pendencia" },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setSerasaFilter(f.value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        serasaFilter === f.value
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              {filteredPatients.length} paciente
              {filteredPatients.length !== 1 ? "s" : ""} encontrado
              {filteredPatients.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading ? (
              <PatientListSkeleton />
            ) : filteredPatients.length === 0 ? (
              <div className="py-8 text-center">
                <Search className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">Nenhum paciente encontrado.</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 transition-colors"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={patient.avatarUrl} />
                    <AvatarFallback className="text-xs bg-neutral-100 text-neutral-500">
                      {getInitials(patient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-neutral-900">{patient.name}</span>
                      <SerasaBadge status={patient.serasaStatus} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {formatPhone(patient.phone)}
                      </span>
                      {patient.email && (
                        <span className="text-xs text-neutral-400 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {patient.email}
                        </span>
                      )}
                      <span className="text-xs text-neutral-400">
                        CPF: {formatCPF(patient.cpf)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <RoleGate allowedRoles="DENTIST">
                      <Button variant="outline" size="sm" onClick={() => router.push("/clinical-records")}>
                        Prontuario
                      </Button>
                    </RoleGate>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setMenuOpenId(menuOpenId === patient.id ? null : patient.id)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {menuOpenId === patient.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                              onClick={() => {
                                router.push(`/patients/${patient.id}`);
                                setMenuOpenId(null);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 text-neutral-400" />
                              Ver detalhes
                            </button>
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                              onClick={() => {
                                addToast({
                                  title: "Em breve",
                                  description: "Edicao de paciente sera disponibilizada em breve",
                                  variant: "info",
                                });
                                setMenuOpenId(null);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5 text-neutral-400" />
                              Editar dados
                            </button>
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                              onClick={() => {
                                router.push("/clinical-records");
                                setMenuOpenId(null);
                              }}
                            >
                              <ClipboardList className="h-3.5 w-3.5 text-neutral-400" />
                              Ver prontuario
                            </button>
                            <div className="h-px bg-neutral-100 my-1" />
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              onClick={() => void handleDeletePatient(patient)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remover paciente
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <NewPatientModal
        open={newPatientOpen}
        onOpenChange={setNewPatientOpen}
        onSubmit={handleCreatePatient}
      />
    </PageTransition>
  );
}
