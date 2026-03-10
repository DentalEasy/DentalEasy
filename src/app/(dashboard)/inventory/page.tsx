"use client";

import { useState } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Box,
  TrendingDown,
  Check,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Separator,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { RoleGate } from "@/components/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageTransition } from "@/lib/animations";
import { useToast } from "@/components/ui/toast";

// ─── Types ───
type StockStatus = "OK" | "LOW" | "CRITICAL" | "OUT";
type ItemCategory = "DESCARTAVEL" | "MATERIAL" | "MEDICAMENTO" | "EQUIPAMENTO" | "LIMPEZA" | "OUTROS";

interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  currentStock: number;
  minStock: number;
  unit: string;
  unitCost: number;
  supplier?: string;
  lastRestocked?: string;
  expiresAt?: string;
}

const categoryLabels: Record<ItemCategory, string> = {
  DESCARTAVEL: "Descartável",
  MATERIAL: "Material Odontológico",
  MEDICAMENTO: "Medicamento",
  EQUIPAMENTO: "Equipamento",
  LIMPEZA: "Limpeza & Esterilização",
  OUTROS: "Outros",
};

const categoryColors: Record<ItemCategory, string> = {
  DESCARTAVEL: "bg-blue-50 text-blue-600",
  MATERIAL: "bg-purple-50 text-purple-600",
  MEDICAMENTO: "bg-green-50 text-green-600",
  EQUIPAMENTO: "bg-amber-50 text-amber-600",
  LIMPEZA: "bg-cyan-50 text-cyan-600",
  OUTROS: "bg-neutral-50 text-neutral-600",
};

function getStockStatus(current: number, min: number): StockStatus {
  if (current === 0) return "OUT";
  if (current <= min * 0.3) return "CRITICAL";
  if (current <= min) return "LOW";
  return "OK";
}

const stockStatusConfig: Record<StockStatus, { label: string; color: string }> = {
  OK: { label: "Normal", color: "bg-green-50 text-green-600" },
  LOW: { label: "Baixo", color: "bg-amber-50 text-amber-600" },
  CRITICAL: { label: "Crítico", color: "bg-red-50 text-red-600" },
  OUT: { label: "Esgotado", color: "bg-red-100 text-red-700" },
};

// ─── Mock Data ───
const initialItems: InventoryItem[] = [
  { id: "inv1", name: "Luvas de Procedimento (P)", category: "DESCARTAVEL", currentStock: 450, minStock: 200, unit: "un", unitCost: 0.45, supplier: "DentalMed", lastRestocked: "2026-03-01" },
  { id: "inv2", name: "Luvas de Procedimento (M)", category: "DESCARTAVEL", currentStock: 320, minStock: 200, unit: "un", unitCost: 0.45, supplier: "DentalMed", lastRestocked: "2026-03-01" },
  { id: "inv3", name: "Máscara Descartável", category: "DESCARTAVEL", currentStock: 180, minStock: 150, unit: "un", unitCost: 0.25, supplier: "DentalMed", lastRestocked: "2026-02-20" },
  { id: "inv4", name: "Sugador Descartável", category: "DESCARTAVEL", currentStock: 95, minStock: 100, unit: "un", unitCost: 0.12, supplier: "OdontoSupply", lastRestocked: "2026-02-15" },
  { id: "inv5", name: "Resina Composta A2", category: "MATERIAL", currentStock: 12, minStock: 8, unit: "seringa", unitCost: 85, supplier: "3M ESPE", lastRestocked: "2026-02-10", expiresAt: "2027-06-15" },
  { id: "inv6", name: "Resina Composta A3", category: "MATERIAL", currentStock: 5, minStock: 8, unit: "seringa", unitCost: 85, supplier: "3M ESPE", lastRestocked: "2026-01-20", expiresAt: "2027-06-15" },
  { id: "inv7", name: "Cimento de Ionômero de Vidro", category: "MATERIAL", currentStock: 8, minStock: 5, unit: "kit", unitCost: 120, supplier: "FGM", lastRestocked: "2026-02-05", expiresAt: "2027-03-01" },
  { id: "inv8", name: "Anestésico Lidocaína 2%", category: "MEDICAMENTO", currentStock: 30, minStock: 20, unit: "tubete", unitCost: 3.5, supplier: "DFL", lastRestocked: "2026-03-05", expiresAt: "2027-09-01" },
  { id: "inv9", name: "Anestésico Mepivacaína 3%", category: "MEDICAMENTO", currentStock: 8, minStock: 15, unit: "tubete", unitCost: 4.2, supplier: "DFL", lastRestocked: "2026-02-20", expiresAt: "2027-09-01" },
  { id: "inv10", name: "Flúor Gel Aplicação", category: "MEDICAMENTO", currentStock: 15, minStock: 10, unit: "bisnaga", unitCost: 18, supplier: "SSWhite", lastRestocked: "2026-01-15", expiresAt: "2027-01-15" },
  { id: "inv11", name: "Broca Carbide FG 330", category: "EQUIPAMENTO", currentStock: 20, minStock: 10, unit: "un", unitCost: 8.5, supplier: "KG Sorensen", lastRestocked: "2026-02-10" },
  { id: "inv12", name: "Agulha Gengival Curta", category: "DESCARTAVEL", currentStock: 0, minStock: 50, unit: "un", unitCost: 0.85, supplier: "Unoject", lastRestocked: "2026-01-10" },
  { id: "inv13", name: "Hipoclorito de Sódio 2.5%", category: "LIMPEZA", currentStock: 6, minStock: 4, unit: "litro", unitCost: 22, supplier: "Biodinâmica", lastRestocked: "2026-03-03", expiresAt: "2026-12-01" },
  { id: "inv14", name: "Autoclave Indicador Químico", category: "LIMPEZA", currentStock: 3, minStock: 5, unit: "rolo", unitCost: 32, supplier: "Cristófoli", lastRestocked: "2026-02-01" },
  { id: "inv15", name: "Algodão Hidrófilo", category: "DESCARTAVEL", currentStock: 25, minStock: 10, unit: "pacote", unitCost: 6.5, supplier: "OdontoSupply", lastRestocked: "2026-03-02" },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const { addToast } = useToast();

  // New item form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<ItemCategory>("DESCARTAVEL");
  const [newStock, setNewStock] = useState("");
  const [newMinStock, setNewMinStock] = useState("");
  const [newUnit, setNewUnit] = useState("un");
  const [newCost, setNewCost] = useState("");
  const [newSupplier, setNewSupplier] = useState("");

  const filteredItems = items.filter((it) => {
    const status = getStockStatus(it.currentStock, it.minStock);
    const matchesCategory = categoryFilter === "all" || it.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    const matchesSearch = it.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const stats = {
    totalItems: items.length,
    lowStock: items.filter((it) => getStockStatus(it.currentStock, it.minStock) === "LOW").length,
    critical: items.filter((it) => ["CRITICAL", "OUT"].includes(getStockStatus(it.currentStock, it.minStock))).length,
    totalValue: items.reduce((sum, it) => sum + it.currentStock * it.unitCost, 0),
  };

  const handleAddItem = () => {
    if (!newName.trim() || !newStock || !newMinStock) {
      addToast({ title: "Preencha os campos obrigatórios", variant: "warning" });
      return;
    }
    const item: InventoryItem = {
      id: `inv_${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      currentStock: parseInt(newStock) || 0,
      minStock: parseInt(newMinStock) || 1,
      unit: newUnit || "un",
      unitCost: parseFloat(newCost) || 0,
      supplier: newSupplier || undefined,
      lastRestocked: new Date().toISOString().split("T")[0],
    };
    setItems((prev) => [item, ...prev]);
    addToast({ title: "Item adicionado", description: `${item.name} cadastrado com sucesso`, variant: "success" });
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName(""); setNewCategory("DESCARTAVEL"); setNewStock(""); setNewMinStock("");
    setNewUnit("un"); setNewCost(""); setNewSupplier("");
  };

  const handleRestock = (id: string) => {
    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) {
      addToast({ title: "Quantidade inválida", variant: "warning" });
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, currentStock: it.currentStock + qty, lastRestocked: new Date().toISOString().split("T")[0] }
          : it
      )
    );
    const item = items.find((it) => it.id === id);
    addToast({ title: "Estoque atualizado", description: `+${qty} ${item?.unit} de ${item?.name}`, variant: "success" });
    setRestockId(null);
    setRestockQty("");
  };

  const handleRemoveItem = (id: string) => {
    const item = items.find((it) => it.id === id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    addToast({ title: "Item removido", description: `${item?.name} foi excluído`, variant: "success" });
    setMenuOpenId(null);
  };

  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Controle de Estoque</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Gerenciamento de materiais e insumos</p>
            </div>
            <Button className="gap-1.5" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" />
              Novo Item
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total de Itens", value: stats.totalItems.toString(), icon: Package, color: "text-blue-600" },
              { label: "Estoque Baixo", value: stats.lowStock.toString(), icon: TrendingDown, color: "text-amber-600" },
              { label: "Crítico/Esgotado", value: stats.critical.toString(), icon: AlertTriangle, color: "text-red-600" },
              { label: "Valor em Estoque", value: formatCurrency(stats.totalValue), icon: ShoppingCart, color: "text-emerald-600" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-xl font-bold text-neutral-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg bg-neutral-50 ${stat.color}`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alerts */}
          {stats.critical > 0 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-700">Atenção: {stats.critical} ite{stats.critical === 1 ? "m" : "ns"} em estoque crítico ou esgotado</p>
                <p className="text-[11px] text-red-500 mt-0.5">
                  {items
                    .filter((it) => ["CRITICAL", "OUT"].includes(getStockStatus(it.currentStock, it.minStock)))
                    .map((it) => it.name)
                    .join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Buscar item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select onValueChange={setCategoryFilter} value={categoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {(Object.keys(categoryLabels) as ItemCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setStatusFilter} value={statusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {(Object.keys(stockStatusConfig) as StockStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{stockStatusConfig[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-10 w-10 text-neutral-200 mx-auto mb-3" />
                  <p className="text-sm text-neutral-400">Nenhum item encontrado</p>
                </CardContent>
              </Card>
            ) : (
              filteredItems.map((item) => {
                const status = getStockStatus(item.currentStock, item.minStock);
                const stockPercentage = Math.min((item.currentStock / (item.minStock * 2)) * 100, 100);
                const isRestock = restockId === item.id;

                return (
                  <Card key={item.id} className={status === "OUT" ? "border-red-200 bg-red-50/30" : status === "CRITICAL" ? "border-red-100" : ""}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-neutral-900">{item.name}</span>
                            <Badge className={`text-[10px] ${categoryColors[item.category]}`}>
                              {categoryLabels[item.category]}
                            </Badge>
                            <Badge className={`text-[10px] ${stockStatusConfig[status].color}`}>
                              {stockStatusConfig[status].label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-neutral-400">Estoque:</span>
                              <span className={`text-xs font-semibold ${status === "OK" ? "text-neutral-900" : status === "LOW" ? "text-amber-600" : "text-red-600"}`}>
                                {item.currentStock} {item.unit}
                              </span>
                              <span className="text-xs text-neutral-300">/ mín. {item.minStock}</span>
                            </div>
                            {item.unitCost > 0 && (
                              <span className="text-xs text-neutral-400">
                                {formatCurrency(item.unitCost)}/{item.unit}
                              </span>
                            )}
                            {item.supplier && (
                              <span className="text-xs text-neutral-400 hidden sm:inline">
                                {item.supplier}
                              </span>
                            )}
                          </div>
                          {/* Stock bar */}
                          <div className="w-full max-w-[200px] h-1.5 bg-neutral-100 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                status === "OK" ? "bg-green-400" : status === "LOW" ? "bg-amber-400" : "bg-red-400"
                              }`}
                              style={{ width: `${stockPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Restock inline */}
                        {isRestock ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Input
                              className="h-8 w-20 text-xs"
                              type="number"
                              min="1"
                              placeholder="Qtd"
                              value={restockQty}
                              onChange={(e) => setRestockQty(e.target.value)}
                              autoFocus
                            />
                            <Button size="icon-sm" variant="ghost" onClick={() => handleRestock(item.id)}>
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button size="icon-sm" variant="ghost" onClick={() => { setRestockId(null); setRestockQty(""); }}>
                              <X className="h-3.5 w-3.5 text-neutral-400" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1"
                              onClick={() => setRestockId(item.id)}
                            >
                              <ArrowUpRight className="h-3 w-3" />
                              Repor
                            </Button>
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                              {menuOpenId === item.id && (
                                <div className="absolute right-0 top-8 bg-white rounded-lg border shadow-lg py-1 z-20 w-40">
                                  <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50" onClick={() => { setSelectedItem(item); setMenuOpenId(null); }}>
                                    <Eye className="h-3.5 w-3.5" /> Ver detalhes
                                  </button>
                                  <Separator className="my-1" />
                                  <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-500 hover:bg-red-50" onClick={() => handleRemoveItem(item.id)}>
                                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Detail Modal */}
          <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedItem?.name}</DialogTitle>
                <DialogDescription>Detalhes do item de estoque</DialogDescription>
              </DialogHeader>
              {selectedItem && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] text-neutral-400">Categoria</p>
                      <p className="text-sm font-medium">{categoryLabels[selectedItem.category]}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400">Status</p>
                      <Badge className={stockStatusConfig[getStockStatus(selectedItem.currentStock, selectedItem.minStock)].color}>
                        {stockStatusConfig[getStockStatus(selectedItem.currentStock, selectedItem.minStock)].label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400">Estoque Atual</p>
                      <p className="text-sm font-semibold">{selectedItem.currentStock} {selectedItem.unit}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400">Estoque Mínimo</p>
                      <p className="text-sm font-medium">{selectedItem.minStock} {selectedItem.unit}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400">Custo Unitário</p>
                      <p className="text-sm font-medium">{formatCurrency(selectedItem.unitCost)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-400">Valor Total</p>
                      <p className="text-sm font-semibold">{formatCurrency(selectedItem.currentStock * selectedItem.unitCost)}</p>
                    </div>
                    {selectedItem.supplier && (
                      <div>
                        <p className="text-[11px] text-neutral-400">Fornecedor</p>
                        <p className="text-sm font-medium">{selectedItem.supplier}</p>
                      </div>
                    )}
                    {selectedItem.lastRestocked && (
                      <div>
                        <p className="text-[11px] text-neutral-400">Última Reposição</p>
                        <p className="text-sm">{formatDate(selectedItem.lastRestocked)}</p>
                      </div>
                    )}
                    {selectedItem.expiresAt && (
                      <div className="col-span-2">
                        <p className="text-[11px] text-neutral-400">Validade</p>
                        <p className="text-sm">{formatDate(selectedItem.expiresAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedItem(null)}>Fechar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Modal */}
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Item de Estoque</DialogTitle>
                <DialogDescription>Cadastre um novo material ou insumo</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1 block">Nome do Item *</label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Resina Composta A2" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-500 mb-1 block">Categoria</label>
                    <Select onValueChange={(v) => setNewCategory(v as ItemCategory)} value={newCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(categoryLabels) as ItemCategory[]).map((cat) => (
                          <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 mb-1 block">Unidade</label>
                    <Select onValueChange={setNewUnit} value={newUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["un", "cx", "pacote", "rolo", "litro", "ml", "kg", "g", "seringa", "tubete", "bisnaga", "kit"].map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-500 mb-1 block">Estoque Atual *</label>
                    <Input type="number" min="0" value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="100" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 mb-1 block">Estoque Mínimo *</label>
                    <Input type="number" min="1" value={newMinStock} onChange={(e) => setNewMinStock(e.target.value)} placeholder="20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-500 mb-1 block">Custo Unitário (R$)</label>
                    <Input type="number" min="0" step="0.01" value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="10.50" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 mb-1 block">Fornecedor</label>
                    <Input value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} placeholder="Nome do fornecedor" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancelar</Button>
                <Button onClick={handleAddItem}>
                  <Package className="h-4 w-4 mr-1.5" />
                  Cadastrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageTransition>
    </RoleGate>
  );
}
