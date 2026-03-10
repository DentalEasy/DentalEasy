"use client";

import { useState } from "react";
import { Building2, Users, Bell, Settings, ChevronRight, Shield, Save, ChevronDown, DollarSign, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Input,
  Separator,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { useClinic } from "@/contexts/clinic-context";
import { useAuth } from "@/contexts/auth-context";
import { useProcedures, categoryLabels, type Procedure, type ProcedureCategory } from "@/contexts/procedures-context";
import { formatCurrency } from "@/lib/utils";
import { PageTransition } from "@/lib/animations";
import { useToast } from "@/components/ui/toast";

const settingsItems = [
  {
    id: "clinic",
    icon: Building2,
    title: "Dados da Clínica",
    description: "Nome, endereço, CNPJ e informações de contato",
    meta: (org: { name?: string } | null) => org?.name,
  },
  {
    id: "team",
    icon: Users,
    title: "Equipe & Permissões",
    description: "Gerenciar dentistas, secretárias e acessos",
    meta: () => undefined,
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notificações & WhatsApp",
    description: "Templates de mensagens e lembretes automáticos",
    meta: () => undefined,
  },
  {
    id: "procedures",
    icon: DollarSign,
    title: "Procedimentos & Valores",
    description: "Tabela de preços dos procedimentos da clínica",
    meta: () => undefined,
  },
  {
    id: "plan",
    icon: Settings,
    title: "Plano & Assinatura",
    description: "Gerenciar plano atual, faturas e limites de uso",
    meta: (org: { plan?: string } | null) => org?.plan ? `Plano: ${org.plan}` : undefined,
  },
];

function ClinicSettingsPanel({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-4 pt-4 border-t border-neutral-100 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-neutral-500 mb-1 block">Nome da Clínica</label>
          <Input defaultValue="Clínica Odonto Jales" />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 mb-1 block">CNPJ</label>
          <Input defaultValue="12.345.678/0001-90" />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 mb-1 block">Telefone</label>
          <Input defaultValue="(17) 3632-1234" />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500 mb-1 block">E-mail</label>
          <Input defaultValue="contato@odontojales.com" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-500 mb-1 block">Endereço</label>
        <Input defaultValue="Rua Sete de Setembro, 1234 - Centro, Jales/SP" />
      </div>
      <Button size="sm" className="gap-2" onClick={onSave}><Save className="h-3.5 w-3.5" />Salvar Alterações</Button>
    </div>
  );
}

function TeamSettingsPanel({ onSave }: { onSave: () => void }) {
  const members = [
    { name: "Dr. Lucas Mendes", role: "Dentista", email: "lucas@dental.com" },
    { name: "Ana Paula", role: "Secretária", email: "ana@dental.com" },
    { name: "Admin", role: "Administrador", email: "admin@dental.com" },
  ];
  return (
    <div className="space-y-3 pt-4 border-t border-neutral-100 mt-4">
      {members.map((m) => (
        <div key={m.email} className="flex items-center justify-between rounded-lg border border-neutral-100 p-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">{m.name}</p>
            <p className="text-xs text-neutral-400">{m.email}</p>
          </div>
          <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">{m.role}</span>
        </div>
      ))}
      <Button variant="outline" size="sm" className="gap-2" onClick={onSave}>
        <Users className="h-3.5 w-3.5" />Convidar Membro
      </Button>
    </div>
  );
}

function NotificationsPanel({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-3 pt-4 border-t border-neutral-100 mt-4">
      {[
        { label: "Confirmação de consulta", desc: "24h antes da consulta", enabled: true },
        { label: "Lembrete de retorno", desc: "30 dias após último atendimento", enabled: true },
        { label: "Cobrança automática", desc: "No dia do vencimento", enabled: false },
      ].map((n) => (
        <div key={n.label} className="flex items-center justify-between rounded-lg border border-neutral-100 p-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">{n.label}</p>
            <p className="text-xs text-neutral-400">{n.desc}</p>
          </div>
          <button
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${n.enabled ? "bg-neutral-900" : "bg-neutral-200"}`}
            onClick={onSave}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${n.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        </div>
      ))}
    </div>
  );
}

function PlanSettingsPanel({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-3 pt-4 border-t border-neutral-100 mt-4">
      <div className="rounded-lg border border-neutral-200 p-4 bg-neutral-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-neutral-900">Plano Profissional</span>
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">Ativo</span>
        </div>
        <p className="text-xs text-neutral-400 mb-3">Pacientes ilimitados · 5 usuários · WhatsApp automático</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-neutral-900">R$ 197<span className="text-xs font-normal text-neutral-400">/mês</span></span>
          <Button variant="outline" size="sm" onClick={onSave}>Alterar Plano</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Procedures Management Panel ───
function ProceduresPanel({ onSave }: { onSave: () => void }) {
  const { procedures, addProcedure, updateProcedure, removeProcedure, toggleProcedure, categories } = useProcedures();
  const { addToast } = useToast();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New procedure form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<ProcedureCategory>("OUTROS");
  const [newPrice, setNewPrice] = useState("");
  const [newDuration, setNewDuration] = useState("60");

  // Edit form
  const [editPrice, setEditPrice] = useState("");
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState("");

  const filteredProcedures = procedures.filter((p) => {
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group by category
  const groupedProcedures = filteredProcedures.reduce<Record<string, Procedure[]>>((acc, p) => {
    const cat = p.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const handleAdd = () => {
    if (!newName.trim() || !newPrice) {
      addToast({ title: "Preencha os campos", description: "Nome e valor são obrigatórios", variant: "warning" });
      return;
    }
    addProcedure({
      name: newName.trim(),
      category: newCategory,
      price: parseFloat(newPrice),
      duration: parseInt(newDuration) || 60,
      active: true,
    });
    addToast({ title: "Procedimento adicionado", description: `${newName} - ${formatCurrency(parseFloat(newPrice))}`, variant: "success" });
    setNewName(""); setNewPrice(""); setNewDuration("60"); setNewCategory("OUTROS"); setShowAddForm(false);
    onSave();
  };

  const handleStartEdit = (p: Procedure) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(p.price.toString());
    setEditDuration(p.duration.toString());
  };

  const handleSaveEdit = (id: string) => {
    updateProcedure(id, {
      name: editName.trim(),
      price: parseFloat(editPrice),
      duration: parseInt(editDuration) || 60,
    });
    addToast({ title: "Procedimento atualizado", description: `${editName} salvo com sucesso`, variant: "success" });
    setEditingId(null);
    onSave();
  };

  const handleRemove = (p: Procedure) => {
    removeProcedure(p.id);
    addToast({ title: "Procedimento removido", description: `${p.name} foi removido`, variant: "success" });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-neutral-100 mt-4">
      {/* Search + Filter + Add */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Buscar procedimento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select onValueChange={setFilterCategory} value={filterCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showAddForm ? "Cancelar" : "Novo"}
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Novo Procedimento</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Nome *</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Limpeza" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Categoria</label>
              <Select onValueChange={(v) => setNewCategory(v as ProcedureCategory)} value={newCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Valor (R$) *</label>
              <Input type="number" min="0" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="250.00" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Duração (min)</label>
              <Input type="number" min="5" step="5" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} placeholder="60" />
            </div>
          </div>
          <Button size="sm" className="gap-1.5" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5" />
            Adicionar Procedimento
          </Button>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-neutral-400">
        <span>{procedures.length} procedimentos cadastrados</span>
        <span>{procedures.filter(p => p.active).length} ativos</span>
      </div>

      {/* Procedures List grouped by category */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {Object.keys(groupedProcedures).length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-4">Nenhum procedimento encontrado.</p>
        ) : (
          Object.entries(groupedProcedures).map(([category, procs]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-[10px]">
                  {categoryLabels[category as ProcedureCategory]}
                </Badge>
                <span className="text-[10px] text-neutral-400">{procs.length}</span>
              </div>
              <div className="space-y-1">
                {procs.map((proc) => (
                  <div
                    key={proc.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                      proc.active ? "border-neutral-100 bg-white" : "border-neutral-100 bg-neutral-50 opacity-60"
                    }`}
                  >
                    {editingId === proc.id ? (
                      /* Edit mode */
                      <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 text-sm flex-1"
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-neutral-400">R$</span>
                            <Input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="h-8 text-sm w-24"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={editDuration}
                              onChange={(e) => setEditDuration(e.target.value)}
                              className="h-8 text-sm w-16"
                            />
                            <span className="text-xs text-neutral-400">min</span>
                          </div>
                          <Button size="icon-sm" variant="ghost" onClick={() => handleSaveEdit(proc.id)}>
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-3.5 w-3.5 text-neutral-400" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${proc.active ? "text-neutral-900" : "text-neutral-500 line-through"}`}>
                            {proc.name}
                          </span>
                          <span className="text-xs text-neutral-400 ml-2">{proc.duration}min</span>
                        </div>
                        <span className="text-sm font-semibold text-neutral-900 tabular-nums">
                          {formatCurrency(proc.price)}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors cursor-pointer ${
                              proc.active ? "bg-green-500" : "bg-neutral-200"
                            }`}
                            onClick={() => toggleProcedure(proc.id)}
                            title={proc.active ? "Desativar" : "Ativar"}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              proc.active ? "translate-x-3" : "translate-x-0.5"
                            }`} />
                          </button>
                          <Button size="icon-sm" variant="ghost" onClick={() => handleStartEdit(proc)}>
                            <Pencil className="h-3 w-3 text-neutral-400" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => handleRemove(proc)}>
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { organization } = useClinic();
  const { hasRole } = useAuth();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const { addToast } = useToast();

  if (!hasRole("ADMIN")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-100 mx-auto mb-4">
              <Shield className="h-6 w-6 text-neutral-400" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900 mb-1">
              Acesso Restrito
            </h2>
            <p className="text-sm text-neutral-400">
              Apenas administradores podem acessar as configurações da clínica.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = (section: string) => {
    addToast({ title: "Configurações salvas", description: `${section} atualizado com sucesso`, variant: "success" });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Configurações</h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            Gerencie as configurações da sua clínica
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            const metaText = item.meta(organization);
            const isExpanded = expandedCard === item.id;
            return (
              <Card key={item.title} className="cursor-pointer hover:bg-neutral-50 transition-colors">
                <CardContent className="p-4">
                  <div
                    className="flex items-start gap-3"
                    onClick={() => setExpandedCard(isExpanded ? null : item.id)}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 shrink-0">
                      <Icon className="h-4 w-4 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-neutral-900">{item.title}</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">{item.description}</p>
                      {metaText && (
                        <p className="text-xs text-primary-500 font-medium mt-1.5">{metaText}</p>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-neutral-300 shrink-0 mt-0.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>

                  {isExpanded && item.id === "clinic" && <ClinicSettingsPanel onSave={() => handleSave("Dados da Clínica")} />}
                  {isExpanded && item.id === "team" && <TeamSettingsPanel onSave={() => handleSave("Equipe & Permissões")} />}
                  {isExpanded && item.id === "notifications" && <NotificationsPanel onSave={() => handleSave("Notificações")} />}
                  {isExpanded && item.id === "procedures" && <ProceduresPanel onSave={() => handleSave("Procedimentos & Valores")} />}
                  {isExpanded && item.id === "plan" && <PlanSettingsPanel onSave={() => handleSave("Plano & Assinatura")} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
