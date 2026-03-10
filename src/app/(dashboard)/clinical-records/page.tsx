"use client";

import { useState } from "react";
import {
  ClipboardList,
  Search,
  Plus,
  Filter,
  Calendar,
  FileText,
  Stethoscope,
  MessageSquare,
  ChevronRight,
  Paperclip,
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Separator,
} from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { formatDate } from "@/lib/utils";
import { PageTransition } from "@/lib/animations";
import { NewConsultationModal } from "@/components/shared";
import { useToast } from "@/components/ui/toast";
import type { MedicalRecord } from "@/types";

// ─── Mock Data ───
const mockRecords: (MedicalRecord & { patientName: string })[] = [
  {
    id: "mr1",
    organizationId: "org_01",
    patientId: "p1",
    dentistId: "d1",
    dentist: { id: "d1", name: "Dr. Lucas Mendes", email: "lucas@dental.com", role: "DENTIST", organizationId: "org_01" },
    type: "PROCEDURE",
    title: "Restauração Molar 36",
    description: "Restauração em resina composta no dente 36 face oclusal. Anestesia infiltrativa aplicada. Sem intercorrências.",
    attachments: ["foto_antes.jpg", "raio_x.png"],
    createdAt: "2026-03-08",
    patientName: "Maria Silva",
  },
  {
    id: "mr2",
    organizationId: "org_01",
    patientId: "p2",
    dentistId: "d1",
    dentist: { id: "d1", name: "Dr. Lucas Mendes", email: "lucas@dental.com", role: "DENTIST", organizationId: "org_01" },
    type: "ANAMNESIS",
    title: "Anamnese Inicial",
    description: "Paciente relata dor ao mastigar no lado direito há 2 semanas. Sem alergias conhecidas. Sem uso de medicamentos contínuos. Pressão arterial: 120/80.",
    createdAt: "2026-03-07",
    patientName: "João Santos",
  },
  {
    id: "mr3",
    organizationId: "org_01",
    patientId: "p1",
    dentistId: "d1",
    dentist: { id: "d1", name: "Dr. Lucas Mendes", email: "lucas@dental.com", role: "DENTIST", organizationId: "org_01" },
    type: "NOTE",
    title: "Acompanhamento pós-operatório",
    description: "Paciente retornou para reavaliação. Restauração em bom estado. Sensibilidade ao frio reduziu. Próximo retorno em 30 dias.",
    createdAt: "2026-03-06",
    patientName: "Maria Silva",
  },
  {
    id: "mr4",
    organizationId: "org_01",
    patientId: "p3",
    dentistId: "d1",
    dentist: { id: "d1", name: "Dr. Lucas Mendes", email: "lucas@dental.com", role: "DENTIST", organizationId: "org_01" },
    type: "PROCEDURE",
    title: "Limpeza e profilaxia",
    description: "Remoção de tártaro supra e subgengival. Aplicação de flúor. Orientações de higiene oral reforçadas.",
    createdAt: "2026-03-05",
    patientName: "Ana Oliveira",
  },
];

const typeConfig: Record<MedicalRecord["type"], { icon: typeof Stethoscope; label: string; color: string }> = {
  PROCEDURE: { icon: Stethoscope, label: "Procedimento", color: "bg-primary-50 text-primary-600" },
  ANAMNESIS: { icon: ClipboardList, label: "Anamnese", color: "bg-success-50 text-success-600" },
  PHOTO: { icon: Paperclip, label: "Foto/Anexo", color: "bg-warning-50 text-warning-600" },
  NOTE: { icon: MessageSquare, label: "Anotação", color: "bg-neutral-100 text-neutral-600" },
};

export default function ClinicalRecordsPage() {
  const { hasRole } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [newConsultationOpen, setNewConsultationOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<(MedicalRecord & { patientName: string }) | null>(null);
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const { addToast } = useToast();

  // RBAC gate — only DENTIST and ADMIN
  if (!hasRole(["DENTIST", "ADMIN"])) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-100 mx-auto mb-4">
              <ClipboardList className="h-6 w-6 text-neutral-400" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900 mb-1">Acesso Restrito</h2>
            <p className="text-sm text-neutral-400">
              O módulo de Prontuário Clínico é exclusivo para dentistas e administradores.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const filteredRecords = mockRecords.filter((r) => {
    const matchesSearch =
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "all" || r.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Group records by patient
  const patientGroups = filteredRecords.reduce<Record<string, typeof filteredRecords>>((acc, r) => {
    if (!acc[r.patientId]) acc[r.patientId] = [];
    acc[r.patientId].push(r);
    return acc;
  }, {});

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Prontuário Clínico</h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              Registros médicos e históricos dos pacientes
            </p>
          </div>
          <Button onClick={() => setNewConsultationOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Registro
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
                  placeholder="Buscar por paciente ou procedimento..."
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
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Período</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "Todo período" },
                    { value: "week", label: "Última semana" },
                    { value: "month", label: "Último mês" },
                    { value: "quarter", label: "Último trimestre" },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setDateFilter(f.value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        dateFilter === f.value
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

        {/* Tabs for filtering by type */}
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="PROCEDURE">Procedimentos</TabsTrigger>
            <TabsTrigger value="ANAMNESIS">Anamnese</TabsTrigger>
            <TabsTrigger value="NOTE">Anotações</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedType} className="mt-4">
            {Object.keys(patientGroups).length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ClipboardList className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm text-neutral-400">Nenhum registro encontrado.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {Object.entries(patientGroups).map(([patientId, records]) => (
                  <Card key={patientId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-neutral-100 text-neutral-500">
                            {getInitials(records[0].patientName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-sm">{records[0].patientName}</CardTitle>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {records.length} registro{records.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => setExpandedPatient(expandedPatient === patientId ? null : patientId)}
                        >
                          {expandedPatient === patientId ? "Recolher" : "Ver Prontuário Completo"}
                          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expandedPatient === patientId ? "rotate-90" : ""}`} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(expandedPatient === patientId ? records : records.slice(0, 2)).map((record) => {
                        const config = typeConfig[record.type];
                        const Icon = config.icon;
                        return (
                          <div
                            key={record.id}
                            className="flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-neutral-50 transition-colors cursor-pointer border border-neutral-100"
                            onClick={() => setSelectedRecord(record)}
                          >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${config.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-neutral-900">
                                  {record.title}
                                </span>
                                <Badge variant="secondary" className="text-[10px]">
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                                {record.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(record.createdAt)}
                                </span>
                                <span className="text-[11px] text-neutral-400">
                                  Por {record.dentist.name}
                                </span>
                                {record.attachments && record.attachments.length > 0 && (
                                  <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                                    <Paperclip className="h-3 w-3" />
                                    {record.attachments.length} anexo{record.attachments.length !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Procedimentos", value: mockRecords.filter((r) => r.type === "PROCEDURE").length, icon: Stethoscope },
            { label: "Anamneses", value: mockRecords.filter((r) => r.type === "ANAMNESIS").length, icon: ClipboardList },
            { label: "Anotações", value: mockRecords.filter((r) => r.type === "NOTE").length, icon: MessageSquare },
            { label: "Total de Registros", value: mockRecords.length, icon: FileText },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                    <stat.icon className="h-4 w-4 text-neutral-500" />
                  </div>
                  <div>
                    <span className="text-xl font-semibold text-neutral-900 block">{stat.value}</span>
                    <span className="text-xs text-neutral-400">{stat.label}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Record Detail Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-lg">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${typeConfig[selectedRecord.type].color}`}>
                    {(() => { const Icon = typeConfig[selectedRecord.type].icon; return <Icon className="h-4 w-4" />; })()}
                  </div>
                  <div>
                    <span className="block">{selectedRecord.title}</span>
                    <span className="text-xs font-normal text-neutral-400">{selectedRecord.patientName}</span>
                  </div>
                </DialogTitle>
                <DialogDescription>Registro clínico detalhado</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-neutral-50 rounded-lg p-4">
                  <p className="text-sm text-neutral-600 leading-relaxed">{selectedRecord.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Tipo</p>
                    <Badge variant="secondary">{typeConfig[selectedRecord.type].label}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Data</p>
                    <p className="text-sm font-medium text-neutral-900">{formatDate(selectedRecord.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Profissional</p>
                    <p className="text-sm font-medium text-neutral-900">{selectedRecord.dentist.name}</p>
                  </div>
                  {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                    <div>
                      <p className="text-xs text-neutral-400 mb-1">Anexos</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedRecord.attachments.map((att) => (
                          <Badge key={att} variant="secondary" className="text-[10px]">
                            <Paperclip className="h-2.5 w-2.5 mr-1" />
                            {att}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Separator />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedRecord(null)}>Fechar</Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Consultation Modal */}
      <NewConsultationModal
        open={newConsultationOpen}
        onOpenChange={setNewConsultationOpen}
        onSubmit={(data) => {
          addToast({ title: "Registro criado", description: "Novo registro clínico adicionado com sucesso", variant: "success" });
        }}
      />
    </PageTransition>
  );
}
