"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  DollarSign,
  Plus,
  Save,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@/components/ui";
import { PageTransition } from "@/lib/animations";
import { useAuth } from "@/contexts/auth-context";
import { useClinic } from "@/contexts/clinic-context";
import {
  categoryLabels,
  useProcedures,
  type ProcedureCategory,
} from "@/contexts/procedures-context";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  ApiError,
  createTeamMember,
  getNotificationPreferences,
  getOrganizationSettings,
  getPlanInfo,
  listTeamMembers,
  updateNotificationPreferences,
  updateOrganizationSettings,
  updateTeamMember,
} from "@/lib/api";
import type { NotificationPreferences, TeamMember } from "@/types";

export default function SettingsPage() {
  const { hasRole } = useAuth();
  const { setOrganization } = useClinic();
  const { procedures, categories, addProcedure, updateProcedure, removeProcedure } =
    useProcedures();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [organizationForm, setOrganizationForm] = useState({
    name: "",
    document: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [newTeamMember, setNewTeamMember] = useState({
    name: "",
    email: "",
    role: "SECRETARY" as TeamMember["role"],
    password: "",
  });
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    appointmentReminders: true,
    paymentAlerts: true,
    inventoryAlerts: true,
    systemAlerts: true,
    updatedAt: new Date().toISOString(),
  });
  const [planInfo, setPlanInfo] = useState<{
    plan: "FREE" | "PRO" | "ENTERPRISE";
    limits: { users: number; inventoryItems: number; reportsHistoryMonths: number };
  } | null>(null);

  const [newProcedure, setNewProcedure] = useState({
    name: "",
    category: "OUTROS" as ProcedureCategory,
    price: "",
    duration: "60",
  });

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const [organization, members, notificationPrefs, plan] = await Promise.all([
        getOrganizationSettings(),
        listTeamMembers(),
        getNotificationPreferences(),
        getPlanInfo(),
      ]);

      setOrganizationForm({
        name: organization.name ?? "",
        document: organization.document ?? "",
        email: organization.email ?? "",
        phone: organization.phone ?? "",
        address: organization.address ?? "",
        city: organization.city ?? "",
        state: organization.state ?? "",
      });
      setTeam(members);
      setPreferences(notificationPrefs);
      setPlanInfo(plan);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel carregar configuracoes.";
      addToast({ title: "Erro ao carregar", description: message, variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasRole("ADMIN")) {
      void loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTeamCount = useMemo(
    () => team.filter((member) => member.active).length,
    [team]
  );

  if (!hasRole("ADMIN")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-100 mx-auto mb-4">
              <Shield className="h-6 w-6 text-neutral-400" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900 mb-1">Acesso Restrito</h2>
            <p className="text-sm text-neutral-400">
              Apenas administradores podem acessar as configuraÃ§Ãµes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const saveOrganization = async () => {
    try {
      const updated = await updateOrganizationSettings({
        name: organizationForm.name,
        document: organizationForm.document || undefined,
        email: organizationForm.email || undefined,
        phone: organizationForm.phone || undefined,
        address: organizationForm.address || undefined,
        city: organizationForm.city || undefined,
        state: organizationForm.state || undefined,
      });
      setOrganization({
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        logoUrl: updated.logoUrl,
        phone: updated.phone,
        address: updated.address,
        city: updated.city,
        state: updated.state,
        cnpj: updated.document,
        plan: updated.plan,
      });
      addToast({
        title: "Dados da clÃ­nica atualizados",
        description: "ConfiguraÃ§Ãµes salvas com sucesso.",
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel salvar dados da clinica.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  const createMember = async () => {
    const name = newTeamMember.name.trim();
    const email = newTeamMember.email.trim().toLowerCase();
    const password = newTeamMember.password.trim();

    if (!name || !email) {
      addToast({
        title: "Dados incompletos",
        description: "Nome e e-mail sÃ£o obrigatÃ³rios.",
        variant: "warning",
      });
      return;
    }

    if (password && password.length < 6) {
      addToast({
        title: "Senha invÃ¡lida",
        description: "A senha inicial deve ter ao menos 6 caracteres.",
        variant: "warning",
      });
      return;
    }

    try {
      const created = await createTeamMember({
        name,
        email,
        role: newTeamMember.role,
        password: password || undefined,
      });
      setTeam((current) => [...current, created]);
      setNewTeamMember({ name: "", email: "", role: "SECRETARY", password: "" });
      addToast({
        title: "Membro criado",
        description: "UsuÃ¡rio adicionado Ã  equipe.",
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel criar membro.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  const toggleMember = async (member: TeamMember) => {
    try {
      const updated = await updateTeamMember(member.id, { active: !member.active });
      setTeam((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry))
      );
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel atualizar membro.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  const savePreferences = async () => {
    try {
      const updated = await updateNotificationPreferences({
        appointmentReminders: preferences.appointmentReminders,
        paymentAlerts: preferences.paymentAlerts,
        inventoryAlerts: preferences.inventoryAlerts,
        systemAlerts: preferences.systemAlerts,
      });
      setPreferences(updated);
      addToast({
        title: "PreferÃªncias atualizadas",
        description: "ConfiguraÃ§Ãµes de notificaÃ§Ã£o salvas.",
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Nao foi possivel salvar preferÃªncias de notificaÃ§Ã£o.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  const createProcedureFromSettings = async () => {
    if (!newProcedure.name || !newProcedure.price) {
      addToast({
        title: "Dados incompletos",
        description: "Nome e preÃ§o sÃ£o obrigatÃ³rios.",
        variant: "warning",
      });
      return;
    }
    try {
      await addProcedure({
        name: newProcedure.name,
        category: newProcedure.category,
        price: Number(newProcedure.price),
        duration: Number(newProcedure.duration) || 60,
        active: true,
      });
      setNewProcedure({ name: "", category: "OUTROS", price: "", duration: "60" });
      addToast({
        title: "Procedimento criado",
        description: "Novo procedimento adicionado ao catÃ¡logo.",
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel criar procedimento.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  const toggleProcedureStatus = async (procedureId: string, active: boolean) => {
    try {
      await updateProcedure(procedureId, { active: !active });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel atualizar procedimento.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  const deleteProcedureFromSettings = async (procedureId: string) => {
    try {
      await removeProcedure(procedureId);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel remover procedimento.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">ConfiguraÃ§Ãµes</h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            Ajustes institucionais, equipe e catÃ¡logo
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-sm text-neutral-400">Carregando...</CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-neutral-400" />
                    Dados da ClÃ­nica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    value={organizationForm.name}
                    onChange={(event) =>
                      setOrganizationForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Nome da clÃ­nica"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={organizationForm.document}
                      onChange={(event) =>
                        setOrganizationForm((current) => ({
                          ...current,
                          document: event.target.value,
                        }))
                      }
                      placeholder="Documento/CNPJ"
                    />
                    <Input
                      value={organizationForm.phone}
                      onChange={(event) =>
                        setOrganizationForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="Telefone"
                    />
                  </div>
                  <Input
                    value={organizationForm.email}
                    onChange={(event) =>
                      setOrganizationForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="E-mail institucional"
                  />
                  <Input
                    value={organizationForm.address}
                    onChange={(event) =>
                      setOrganizationForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    placeholder="EndereÃ§o"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={organizationForm.city}
                      onChange={(event) =>
                        setOrganizationForm((current) => ({
                          ...current,
                          city: event.target.value,
                        }))
                      }
                      placeholder="Cidade"
                    />
                    <Input
                      value={organizationForm.state}
                      onChange={(event) =>
                        setOrganizationForm((current) => ({
                          ...current,
                          state: event.target.value,
                        }))
                      }
                      placeholder="UF"
                    />
                  </div>
                  <Button className="gap-2" onClick={() => void saveOrganization()}>
                    <Save className="h-4 w-4" />
                    Salvar ClÃ­nica
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-neutral-400" />
                    Equipe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-neutral-500">
                    {activeTeamCount} membro(s) ativo(s) de {team.length}
                  </p>
                  {team.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{member.name}</p>
                        <p className="text-xs text-neutral-500">
                          {member.email} â€¢ {member.role}
                        </p>
                      </div>
                      <button
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          member.active ? "bg-neutral-900" : "bg-neutral-200"
                        }`}
                        onClick={() => void toggleMember(member)}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            member.active ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                  <Separator />
                  <Input
                    value={newTeamMember.name}
                    onChange={(event) =>
                      setNewTeamMember((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Nome"
                  />
                  <Input
                    value={newTeamMember.email}
                    onChange={(event) =>
                      setNewTeamMember((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="E-mail"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={newTeamMember.role}
                      onValueChange={(value) =>
                        setNewTeamMember((current) => ({
                          ...current,
                          role: value as TeamMember["role"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="SECRETARY">SECRETARY</SelectItem>
                        <SelectItem value="DENTIST">DENTIST</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="password"
                      value={newTeamMember.password}
                      onChange={(event) =>
                        setNewTeamMember((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      placeholder="Senha inicial"
                    />
                  </div>
                  <Button variant="outline" className="gap-2" onClick={() => void createMember()}>
                    <Plus className="h-4 w-4" />
                    Adicionar Membro
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-neutral-400" />
                    PreferÃªncias de NotificaÃ§Ã£o
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      key: "appointmentReminders",
                      label: "Lembretes de consulta",
                    },
                    {
                      key: "paymentAlerts",
                      label: "Alertas financeiros",
                    },
                    {
                      key: "inventoryAlerts",
                      label: "Alertas de estoque",
                    },
                    {
                      key: "systemAlerts",
                      label: "Comunicados do sistema",
                    },
                  ].map((option) => (
                    <div
                      key={option.key}
                      className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2"
                    >
                      <span className="text-sm text-neutral-700">{option.label}</span>
                      <button
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          preferences[
                            option.key as keyof NotificationPreferences
                          ]
                            ? "bg-neutral-900"
                            : "bg-neutral-200"
                        }`}
                        onClick={() =>
                          setPreferences((current) => ({
                            ...current,
                            [option.key]:
                              !current[
                                option.key as keyof NotificationPreferences
                              ],
                          }))
                        }
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            preferences[
                              option.key as keyof NotificationPreferences
                            ]
                              ? "translate-x-4"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                  <Button className="gap-2" onClick={() => void savePreferences()}>
                    <Save className="h-4 w-4" />
                    Salvar PreferÃªncias
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-neutral-400" />
                    Plano Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Badge variant="secondary">{planInfo?.plan ?? "PRO"}</Badge>
                  <p className="text-sm text-neutral-700">
                    Limite de usuÃ¡rios: {planInfo?.limits.users ?? "-"}
                  </p>
                  <p className="text-sm text-neutral-700">
                    Limite de itens de estoque: {planInfo?.limits.inventoryItems ?? "-"}
                  </p>
                  <p className="text-sm text-neutral-700">
                    HistÃ³rico de relatÃ³rios:{" "}
                    {planInfo?.limits.reportsHistoryMonths ?? "-"} meses
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-neutral-400" />
                  Procedimentos e Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <Input
                    className="md:col-span-2"
                    value={newProcedure.name}
                    onChange={(event) =>
                      setNewProcedure((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Nome do procedimento"
                  />
                  <Select
                    value={newProcedure.category}
                    onValueChange={(value) =>
                      setNewProcedure((current) => ({
                        ...current,
                        category: value as ProcedureCategory,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {categoryLabels[category]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newProcedure.price}
                    onChange={(event) =>
                      setNewProcedure((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    placeholder="PreÃ§o"
                  />
                  <Input
                    type="number"
                    min={5}
                    value={newProcedure.duration}
                    onChange={(event) =>
                      setNewProcedure((current) => ({
                        ...current,
                        duration: event.target.value,
                      }))
                    }
                    placeholder="DuraÃ§Ã£o"
                  />
                </div>
                <Button variant="outline" className="gap-2" onClick={() => void createProcedureFromSettings()}>
                  <Plus className="h-4 w-4" />
                  Adicionar Procedimento
                </Button>
                <Separator />
                <div className="space-y-2">
                  {procedures.map((procedure) => (
                    <div
                      key={procedure.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-neutral-100 px-3 py-2 gap-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{procedure.name}</p>
                        <p className="text-xs text-neutral-500">
                          {categoryLabels[procedure.category]} â€¢{" "}
                          {formatCurrency(procedure.price)} â€¢ {procedure.duration} min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            procedure.active ? "bg-neutral-900" : "bg-neutral-200"
                          }`}
                          onClick={() =>
                            void toggleProcedureStatus(procedure.id, procedure.active)
                          }
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              procedure.active ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => void deleteProcedureFromSettings(procedure.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageTransition>
  );
}

