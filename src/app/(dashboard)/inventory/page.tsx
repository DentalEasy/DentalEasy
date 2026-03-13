"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Package,
  Pencil,
  Plus,
  Search,
  TrendingDown,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { RoleGate } from "@/components/auth";
import { PageTransition } from "@/lib/animations";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  ApiError,
  createInventoryItem,
  deleteInventoryItem,
  listInventoryItems,
  restockInventoryItem,
  updateInventoryItem,
} from "@/lib/api";
import type { InventoryItem } from "@/types";

const categoryOptions = [
  "DESCARTAVEL",
  "MATERIAL",
  "MEDICAMENTO",
  "EQUIPAMENTO",
  "LIMPEZA",
  "OUTROS",
];

export default function InventoryPage() {
  const defaultItemForm = {
    name: "",
    sku: "",
    category: "DESCARTAVEL",
    unit: "un",
    currentStock: "",
    minStock: "",
    cost: "",
    supplier: "",
  };

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRestockDialog, setShowRestockDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState(defaultItemForm);
  const [restockQuantity, setRestockQuantity] = useState("");
  const [restockCost, setRestockCost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const data = await listInventoryItems();
      setItems(data);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel carregar estoque.";
      addToast({ title: "Erro ao carregar", description: message, variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, []);

  const resetItemForm = () => {
    setEditingItemId(null);
    setNewItem(defaultItemForm);
  };

  const openCreateDialog = () => {
    resetItemForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setNewItem({
      name: item.name,
      sku: item.sku ?? "",
      category: item.category,
      unit: item.unit,
      currentStock: String(item.currentStock),
      minStock: String(item.minStock),
      cost: String(item.cost),
      supplier: item.supplier ?? "",
    });
    setShowCreateDialog(true);
  };

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          (item.sku ?? "").toLowerCase().includes(search.toLowerCase());
        const matchesCategory =
          categoryFilter === "all" || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
      }),
    [items, search, categoryFilter]
  );

  const stats = useMemo(
    () => ({
      totalItems: items.length,
      lowStock: items.filter((item) => item.lowStock).length,
      critical: items.filter((item) => item.currentStock <= 0).length,
      totalValue: items.reduce(
        (sum, item) => sum + item.currentStock * item.cost,
        0
      ),
    }),
    [items]
  );

  const handleSaveItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.unit) {
      addToast({
        title: "Dados incompletos",
        description: "Preencha os campos obrigatorios.",
        variant: "warning",
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: newItem.name,
        sku: newItem.sku || undefined,
        category: newItem.category,
        unit: newItem.unit,
        currentStock: Number(newItem.currentStock) || 0,
        minStock: Number(newItem.minStock) || 0,
        cost: Number(newItem.cost) || 0,
        supplier: newItem.supplier || undefined,
      };
      const savedItem = editingItemId
        ? await updateInventoryItem(editingItemId, payload)
        : await createInventoryItem(payload);
      setItems((current) =>
        editingItemId
          ? current.map((item) => (item.id === savedItem.id ? savedItem : item))
          : [savedItem, ...current]
      );
      setShowCreateDialog(false);
      resetItemForm();
      addToast({
        title: editingItemId ? "Item atualizado" : "Item cadastrado",
        description: editingItemId
          ? `${savedItem.name} atualizado no estoque.`
          : `${savedItem.name} adicionado ao estoque.`,
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : editingItemId
            ? "Nao foi possivel atualizar item."
            : "Nao foi possivel cadastrar item.";
      addToast({ title: "Erro", description: message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestock = async () => {
    if (!selectedItem) return;
    const quantity = Number(restockQuantity);
    if (!quantity || quantity <= 0) {
      addToast({
        title: "Quantidade invalida",
        description: "Informe uma quantidade maior que zero.",
        variant: "warning",
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await restockInventoryItem(selectedItem.id, {
        quantity,
        cost: restockCost ? Number(restockCost) : undefined,
      });
      setItems((current) =>
        current.map((item) => (item.id === result.item.id ? result.item : item))
      );
      setShowRestockDialog(false);
      setRestockQuantity("");
      setRestockCost("");
      setSelectedItem(null);
      addToast({
        title: "Estoque atualizado",
        description: `${quantity} ${result.item.unit} adicionados a ${result.item.name}.`,
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel repor estoque.";
      addToast({ title: "Erro", description: message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    try {
      await deleteInventoryItem(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      addToast({
        title: "Item removido",
        description: `${item.name} foi removido do estoque.`,
        variant: "success",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Nao foi possivel remover item.";
      addToast({ title: "Erro", description: message, variant: "error" });
    }
  };

  return (
    <RoleGate
      allowedRoles={["ADMIN", "SECRETARY"]}
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center">
            <CardContent className="p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-100 mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-neutral-400" />
              </div>
              <h2 className="text-base font-semibold text-neutral-900 mb-1">Acesso Restrito</h2>
              <p className="text-sm text-neutral-400">
                Seu perfil nao tem permissao para acessar o estoque.
              </p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Controle de Estoque</h2>
              <p className="text-sm text-neutral-400 mt-0.5">
                Materiais e insumos da clinica
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Novo Item
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-[11px] text-neutral-400 uppercase">Itens</p>
                <p className="text-xl font-bold text-neutral-900 mt-1">{stats.totalItems}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-[11px] text-neutral-400 uppercase">Estoque Baixo</p>
                <p className="text-xl font-bold text-neutral-900 mt-1">{stats.lowStock}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-[11px] text-neutral-400 uppercase">Esgotado</p>
                <p className="text-xl font-bold text-neutral-900 mt-1">{stats.critical}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-[11px] text-neutral-400 uppercase">Valor em Estoque</p>
                <p className="text-xl font-bold text-neutral-900 mt-1">
                  {formatCurrency(stats.totalValue)}
                </p>
              </CardContent>
            </Card>
          </div>

          {stats.lowStock > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700">
                {stats.lowStock} item(ns) com estoque abaixo do mínimo.
              </p>
            </div>
          )}

          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome ou SKU..."
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {isLoading ? (
              <Card>
                <CardContent className="p-6 text-sm text-neutral-400">Carregando...</CardContent>
              </Card>
            ) : filteredItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">Nenhum item encontrado.</p>
                </CardContent>
              </Card>
            ) : (
              filteredItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                        <Badge variant={item.lowStock ? "warning" : "secondary"}>
                          {item.lowStock ? "Baixo" : "Normal"}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {item.category} • {item.currentStock} {item.unit} (mín. {item.minStock})
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {formatCurrency(item.cost)}/{item.unit}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowRestockDialog(true);
                        }}
                      >
                        <TrendingDown className="h-3.5 w-3.5" />
                        Repor
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => void handleDelete(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </PageTransition>

      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            resetItemForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItemId ? "Editar Item de Estoque" : "Novo Item de Estoque"}
            </DialogTitle>
            <DialogDescription>Cadastre materiais e insumos da clínica.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={newItem.name}
              onChange={(event) =>
                setNewItem((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Nome do item"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={newItem.sku}
                onChange={(event) =>
                  setNewItem((current) => ({ ...current, sku: event.target.value }))
                }
                placeholder="SKU"
              />
              <Select
                value={newItem.category}
                onValueChange={(value) =>
                  setNewItem((current) => ({ ...current, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={newItem.currentStock}
                type="number"
                min={0}
                onChange={(event) =>
                  setNewItem((current) => ({
                    ...current,
                    currentStock: event.target.value,
                  }))
                }
                placeholder="Estoque atual"
              />
              <Input
                value={newItem.minStock}
                type="number"
                min={0}
                onChange={(event) =>
                  setNewItem((current) => ({ ...current, minStock: event.target.value }))
                }
                placeholder="Estoque mínimo"
              />
              <Input
                value={newItem.unit}
                onChange={(event) =>
                  setNewItem((current) => ({ ...current, unit: event.target.value }))
                }
                placeholder="Unidade"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={newItem.cost}
                onChange={(event) =>
                  setNewItem((current) => ({ ...current, cost: event.target.value }))
                }
                placeholder="Custo unitário"
              />
              <Input
                value={newItem.supplier}
                onChange={(event) =>
                  setNewItem((current) => ({ ...current, supplier: event.target.value }))
                }
                placeholder="Fornecedor"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSaveItem()} disabled={submitting}>
              {submitting ? "Salvando..." : editingItemId ? "Salvar Alteracoes" : "Cadastrar Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRestockDialog}
        onOpenChange={(open) => {
          setShowRestockDialog(open);
          if (!open) {
            setSelectedItem(null);
            setRestockQuantity("");
            setRestockCost("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reposição de Estoque</DialogTitle>
            <DialogDescription>{selectedItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="number"
              min={1}
              value={restockQuantity}
              onChange={(event) => setRestockQuantity(event.target.value)}
              placeholder="Quantidade"
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              value={restockCost}
              onChange={(event) => setRestockCost(event.target.value)}
              placeholder="Novo custo (opcional)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestockDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleRestock()} disabled={submitting}>
              {submitting ? "Salvando..." : "Confirmar Reposição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGate>
  );
}
