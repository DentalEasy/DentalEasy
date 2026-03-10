"use client";

import { useState } from "react";
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
  Calendar,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Separator,
} from "@/components/ui";
import { RoleGate } from "@/components/auth";
import { formatCPF, formatPhone, formatDate } from "@/lib/utils";
import { PageTransition } from "@/lib/animations";
import { NewPatientModal } from "@/components/shared";
import { useToast } from "@/components/ui/toast";
import type { Patient } from "@/types";

// Mock data
const mockPatients: Patient[] = [
  {
    id: "p1",
    organizationId: "org_01",
    name: "Maria Silva",
    email: "maria@email.com",
    phone: "17999765432",
    cpf: "12345678900",
    birthDate: "1990-05-15",
    serasaStatus: "GREEN",
    createdAt: "2025-01-15",
    updatedAt: "2026-03-01",
  },
  {
    id: "p2",
    organizationId: "org_01",
    name: "João Oliveira",
    email: "joao@email.com",
    phone: "17999654321",
    cpf: "98765432100",
    birthDate: "1985-11-20",
    serasaStatus: "YELLOW",
    createdAt: "2025-02-20",
    updatedAt: "2026-02-28",
  },
  {
    id: "p3",
    organizationId: "org_01",
    name: "Ana Costa",
    email: "ana@email.com",
    phone: "17999543210",
    cpf: "11122233344",
    birthDate: "1978-03-08",
    serasaStatus: "RED",
    createdAt: "2025-03-10",
    updatedAt: "2026-03-05",
  },
  {
    id: "p4",
    organizationId: "org_01",
    name: "Carlos Ferreira",
    email: "carlos@email.com",
    phone: "17998765432",
    cpf: "55566677788",
    birthDate: "1995-07-22",
    serasaStatus: "GREEN",
    createdAt: "2025-06-01",
    updatedAt: "2026-02-15",
  },
];

function SerasaBadge({ status }: { status: Patient["serasaStatus"] }) {
  const config = {
    GREEN: {
      variant: "serasa-green" as const,
      label: "Regular",
      icon: ShieldCheck,
    },
    YELLOW: {
      variant: "serasa-yellow" as const,
      label: "Atenção",
      icon: ShieldAlert,
    },
    RED: {
      variant: "serasa-red" as const,
      label: "Pendência",
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
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100">
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

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [serasaFilter, setSerasaFilter] = useState<string>("all");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const router = useRouter();
  const { addToast } = useToast();

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const filteredPatients = mockPatients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.cpf.includes(search.replace(/\D/g, ""));
    const matchesSerasa = serasaFilter === "all" || p.serasaStatus === serasaFilter;
    return matchesSearch && matchesSerasa;
  });

  const handleDeletePatient = (patient: Patient) => {
    setMenuOpenId(null);
    addToast({ title: "Paciente removido", description: `${patient.name} foi removido com sucesso`, variant: "success" });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Pacientes</h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              Gerencie os pacientes da sua clínica
            </p>
          </div>
          <Button onClick={() => setNewPatientOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nome ou CPF..."
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

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Status Serasa</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "Todos" },
                    { value: "GREEN", label: "Regular" },
                    { value: "YELLOW", label: "Atenção" },
                    { value: "RED", label: "Pendência" },
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

        {/* Patient List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              {filteredPatients.length} paciente{filteredPatients.length !== 1 ? "s" : ""} encontrado{filteredPatients.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {filteredPatients.length === 0 ? (
              <div className="py-8 text-center">
                <Search className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">Nenhum paciente encontrado.</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/patients/${patient.id}`)}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={patient.avatarUrl} />
                    <AvatarFallback className="text-xs bg-neutral-100 text-neutral-500">
                      {getInitials(patient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-neutral-900">
                        {patient.name}
                      </span>
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
                        Prontuário
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
                              onClick={() => { router.push(`/patients/${patient.id}`); setMenuOpenId(null); }}
                            >
                              <Eye className="h-3.5 w-3.5 text-neutral-400" />
                              Ver detalhes
                            </button>
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                              onClick={() => { addToast({ title: "Em breve", description: "Edição de paciente será disponibilizada em breve", variant: "info" }); setMenuOpenId(null); }}
                            >
                              <Edit className="h-3.5 w-3.5 text-neutral-400" />
                              Editar dados
                            </button>
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                              onClick={() => { router.push("/clinical-records"); setMenuOpenId(null); }}
                            >
                              <ClipboardList className="h-3.5 w-3.5 text-neutral-400" />
                              Ver prontuário
                            </button>
                            <div className="h-px bg-neutral-100 my-1" />
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              onClick={() => handleDeletePatient(patient)}
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

      {/* Patient Detail Modal */}
      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="max-w-lg">
          {selectedPatient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm bg-neutral-100 text-neutral-500">
                      {getInitials(selectedPatient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="block">{selectedPatient.name}</span>
                    <span className="text-xs font-normal text-neutral-400">CPF: {formatCPF(selectedPatient.cpf)}</span>
                  </div>
                </DialogTitle>
                <DialogDescription>Informações detalhadas do paciente</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Telefone</p>
                    <p className="text-sm font-medium text-neutral-900">{formatPhone(selectedPatient.phone)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">E-mail</p>
                    <p className="text-sm font-medium text-neutral-900">{selectedPatient.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Data de Nascimento</p>
                    <p className="text-sm font-medium text-neutral-900">{formatDate(selectedPatient.birthDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Status Serasa</p>
                    <SerasaBadge status={selectedPatient.serasaStatus} />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Cadastrado em</p>
                    <p className="text-sm font-medium text-neutral-900">{formatDate(selectedPatient.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Última atualização</p>
                    <p className="text-sm font-medium text-neutral-900">{formatDate(selectedPatient.updatedAt)}</p>
                  </div>
                </div>
                <Separator />
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => { setSelectedPatient(null); router.push("/clinical-records"); }}>
                    <ClipboardList className="h-4 w-4" />
                    Ver Prontuário
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => { setSelectedPatient(null); router.push("/appointments"); }}>
                    <Calendar className="h-4 w-4" />
                    Agendar Consulta
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <NewPatientModal
        open={newPatientOpen}
        onOpenChange={setNewPatientOpen}
        onSubmit={(data) => {
          addToast({ title: "Paciente cadastrado", description: `${data.name} foi adicionado com sucesso`, variant: "success" });
        }}
      />
    </PageTransition>
  );
}
