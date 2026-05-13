import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { 
  Plus, Boxes, PackageX, Package, Clock8, Calendar, 
  TrendingUp, Trash2, Layers, Clock, AlertTriangle, 
  XCircle, PlusCircle, Edit, Info
} from "lucide-react";
import InventoryForm from "./InventoryForm";
import StockModal from "./StockModal";
import StockHistoryModal from "./StockHistoryModal";
import InventoryTable from "./InventoryTable";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const getStockStatusCounts = (items) => {
  let out = 0, low = 0, adequate = 0, full = 0;
  for (const item of items) {
    const q = item.quantity ?? 0;
    const lowT = item.lowStockThreshold ?? 0;
    const adequateT = item.adequateStockThreshold ?? 0;
    if (q === 0) out++;
    else if (q <= lowT) low++;
    else if (q <= adequateT) adequate++;
    else full++;
  }
  return { out, low, adequate, full };
};

const getStatusIcon = (quantity, low, adequate) => {
  if (quantity === 0) {
    return {
      icon: <XCircle className="h-4 w-4" />,
      label: "Out of Stock",
      color: "#ef4444",
      bgColor: "rgba(239, 68, 68, 0.1)",
      borderColor: "rgba(239, 68, 68, 0.2)",
    };
  }
  if (quantity <= low) {
    return {
      icon: <AlertTriangle className="h-4 w-4" />,
      label: "Low",
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.1)",
      borderColor: "rgba(245, 158, 11, 0.2)",
    };
  }
  if (quantity <= adequate) {
    return {
      icon: <Clock className="h-4 w-4" />,
      label: "Normal",
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.1)",
      borderColor: "rgba(59, 130, 246, 0.2)",
    };
  }
  return {
    icon: <Layers className="h-4 w-4" />,
    label: "Full",
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.2)",
  };
};

const MainPage = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addingStock, setAddingStock] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const data = await api.get("/stock");
      setItems(Array.isArray(data) ? data : (data.items ?? []));
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast({ title: "Error", description: "Failed to load inventory items", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    if (saving) return;
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/stock/${editingItem.id}`, { ...data, id: editingItem.id });
        toast({ title: "Success", description: "Item updated successfully" });
      } else {
        await api.post("/stock", data);
        toast({ title: "Success", description: "Item added successfully" });
      }
      setShowForm(false);
      setEditingItem(null);
      await fetchInventory();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save item", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async (item) => {
    if (deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/stock/${item.id}`);
      toast({ title: "Success", description: `"${item.name}" deleted` });
      setShowDeleteModal(false);
      await fetchInventory();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleAddStock = async (amount, mode = "ADD", notes = "") => {
    if (addingStock) return;
    setAddingStock(true);
    try {
      if (mode === "ADD") {
        await api.put(`/stock/${selectedItem.id}/restock?amount=${amount}`);
        toast({ title: "Success", description: `Restocked ${selectedItem.name}` });
      } else {
        await api.put(`/stock/${selectedItem.id}/deduct?amount=${amount}&notes=${encodeURIComponent(notes)}`);
        toast({ title: "Success", description: `Deducted stock from ${selectedItem.name}` });
      }
      setShowStockModal(false);
      await fetchInventory();
    } catch (error) {
      toast({ title: "Error", description: `Failed to ${mode.toLowerCase()} stock`, variant: "destructive" });
    } finally {
      setAddingStock(false);
    }
  };

  const handleViewHistory = (item) => {
    setSelectedHistoryItem(item);
    setShowHistoryModal(true);
  };

  const { out, low, adequate, full } = getStockStatusCounts(items);
  const summaryCards = [
    { title: "Total Items", icon: <Package size={20} />, value: items.length, color: "var(--admin-accent)" },
    { title: "Full", icon: <Layers size={20} />, value: full, color: "#10b981" },
    { title: "Normal", icon: <Boxes size={20} />, value: adequate, color: "#3b82f6" },
    { title: "Low", icon: <PackageX size={20} />, value: low, color: "#f59e0b" },
    { title: "Out of Stock", icon: <Clock8 size={20} />, value: out, color: "#ef4444" },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 px-6 pb-6 pt-4" style={{ backgroundColor: "var(--admin-bg)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg p-2 shadow-sm" style={{ backgroundColor: "var(--admin-accent)", color: "var(--admin-card-bg)" }}>
          <Boxes size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--admin-text-primary)" }}>Supply Monitoring</h1>
          <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>Manage inventory levels</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards.map((card, i) => (
          <Card key={i} className="border shadow-sm" style={{ backgroundColor: "var(--admin-card-bg)", borderColor: "var(--admin-card-border)" }}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--admin-text-secondary)" }}>{card.title}</p>
                <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
              </div>
              <div className="rounded-lg p-2" style={{ backgroundColor: card.color + '15', color: card.color }}>{card.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      <InventoryTable 
        items={items}
        onAddStock={(item) => { setSelectedItem(item); setShowStockModal(true); }}
        onEditItem={(item) => { setEditingItem(item); setShowForm(true); }}
        onDeleteRequest={(item) => { setItemToDelete(item); setShowDeleteModal(true); }}
        onViewHistory={handleViewHistory}
      />

      <AnimatePresence>
        {showForm && <InventoryForm item={editingItem} onAdd={handleSave} onClose={() => { setShowForm(false); setEditingItem(null); }} existingItems={items} loading={saving} />}
        {showStockModal && selectedItem && <StockModal item={selectedItem} onClose={() => setShowStockModal(false)} onSubmit={handleAddStock} loading={addingStock} />}
        {showHistoryModal && selectedHistoryItem && <StockHistoryModal item={selectedHistoryItem} onClose={() => setShowHistoryModal(false)} />}
        {showDeleteModal && itemToDelete && <DeleteConfirmationModal item={itemToDelete} onConfirm={handleDeleteConfirm} onCancel={() => setShowDeleteModal(false)} loading={deleting} />}
      </AnimatePresence>
    </div>
  );
};

export default MainPage;