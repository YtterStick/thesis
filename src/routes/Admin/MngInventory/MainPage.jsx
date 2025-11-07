import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Plus, Boxes, PackageX, Package, Clock8, Calendar, TrendingUp, Trash2, Layers, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import InventoryForm from "./InventoryForm";
import StockModal from "./StockModal";
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
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";

const getStockStatusCounts = (items) => {
  let out = 0, low = 0, adequate = 0, full = 0;

  for (const item of items) {
    const q = item.quantity ?? 0;
    const lowT = item.lowStockThreshold ?? 0;
    const adequateT = item.adequateStockThreshold ?? 0;

    if (q === 0) {
      out++;
    } else if (q <= lowT) {
      low++;
    } else if (q <= adequateT) {
      adequate++;
    } else {
      full++; // Quantity is above adequate threshold
    }
  }

  return { out, low, adequate, full };
};

const getStatusIcon = (quantity, low, adequate) => {
  if (quantity === 0) {
    return {
      icon: <XCircle className="h-4 w-4" />,
      label: "Out of Stock",
      color: "text-red-500",
      labelColor: "text-red-600",
      darkLabelColor: "text-red-400",
      bgColor: "bg-red-100",
      darkBgColor: "bg-red-900/30",
      borderColor: "border-red-200",
      darkBorderColor: "border-red-800",
    };
  }
  if (quantity <= low) {
    return {
      icon: <AlertTriangle className="h-4 w-4" />,
      label: "Low Stock",
      color: "text-orange-500",
      labelColor: "text-orange-600",
      darkLabelColor: "text-orange-400",
      bgColor: "bg-orange-100",
      darkBgColor: "bg-orange-900/30",
      borderColor: "border-orange-200",
      darkBorderColor: "border-orange-800",
    };
  }
  if (quantity <= adequate) {
    return {
      icon: <Clock className="h-4 w-4" />,
      label: "Adequate Stock",
      color: "text-blue-500",
      labelColor: "text-blue-600",
      darkLabelColor: "text-blue-400",
      bgColor: "bg-blue-100",
      darkBgColor: "bg-blue-900/30",
      borderColor: "border-blue-200",
      darkBorderColor: "border-blue-800",
    };
  }
  return {
    icon: <Layers className="h-4 w-4" />,
    label: "Full Stock",
    color: "text-green-600",
    labelColor: "text-green-600",
    darkLabelColor: "text-green-400",
    bgColor: "bg-green-100",
    darkBgColor: "bg-green-900/30",
    borderColor: "border-green-200",
    darkBorderColor: "border-green-800",
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
  const [saving, setSaving] = useState(false);
  const [addingStock, setAddingStock] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const data = await api.get("api/stock");
      const safeItems = Array.isArray(data) ? data : (data.items ?? []);
      setItems(safeItems);
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    if (saving) return;
    
    setSaving(true);
    try {
      if (editingItem) {
        const updateData = {
          ...data,
          id: editingItem.id
        };
        await api.put(`api/stock/${editingItem.id}`, updateData);
        toast({
          title: "Success",
          description: "Item updated successfully",
        });
      } else {
        await api.post("api/stock", data);
        toast({
          title: "Success",
          description: "Item added successfully",
        });
      }
      setShowForm(false);
      setEditingItem(null);
      await fetchInventory();
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (item) => {
    if (deleting) return;
    
    setDeleting(true);
    try {
      await api.delete(`api/stock/${item.id}`);
      toast({
        title: "Success",
        description: `"${item.name}" has been deleted successfully`,
      });
      setShowDeleteModal(false);
      setItemToDelete(null);
      await fetchInventory();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleAddStock = async (amount) => {
    if (addingStock) return;
    
    setAddingStock(true);
    try {
      await api.put(`api/stock/${selectedItem.id}/restock?amount=${amount}`);
      toast({
        title: "Success",
        description: `Added ${amount} stock to ${selectedItem.name}`,
      });
      setSelectedItem(null);
      setShowStockModal(false);
      await fetchInventory();
    } catch (error) {
      console.error("Error adding stock:", error);
      toast({
        title: "Error",
        description: "Failed to add stock",
        variant: "destructive",
      });
    } finally {
      setAddingStock(false);
    }
  };

  const openStockModal = (item) => {
    setSelectedItem(item);
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    setSelectedItem(null);
    setShowStockModal(false);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const openAddForm = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const { out, low, adequate, full } = getStockStatusCounts(items);
  const totalItems = items.length;

  // Skeleton Loader Components
  const SkeletonCard = () => (
    <Card className="rounded-xl border-2 animate-pulse" style={{
      backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
      borderColor: isDarkMode ? "#334155" : "#cbd5e1",
    }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="rounded-lg p-2 bg-slate-200 dark:bg-slate-700">
            <div className="h-5 w-5"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const summaryCards = [
    {
      title: "Total Items",
      icon: <Package size={20} />,
      value: totalItems,
      color: isDarkMode ? "#3DD9B6" : "#0B2B26",
      description: "All inventory items"
    },
    {
      title: "Full Stock",
      icon: <Layers size={20} />,
      value: full,
      color: "#059669", // Green
      description: "Above adequate threshold"
    },
    {
      title: "Adequate",
      icon: <Boxes size={20} />,
      value: adequate,
      color: "#3B82F6", // Blue
      description: "Within adequate range"
    },
    {
      title: "Low Stock",
      icon: <PackageX size={20} />,
      value: low,
      color: "#D97706", // Amber
      description: "Below low threshold"
    },
    {
      title: "Out of Stock",
      icon: <Clock8 size={20} />,
      value: out,
      color: "#DC2626", // Red
      description: "Zero quantity"
    },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "Never restocked";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible" style={{
      backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-3"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="rounded-lg p-2"
          style={{
            backgroundColor: isDarkMode ? "#1e293b" : "#0f172a",
            color: "#f1f5f9",
          }}
        >
          <Boxes size={22} />
        </motion.div>
        <div>
          <p className="text-xl font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
            Supply Monitoring
          </p>
          <p className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
            Track and manage inventory supplies
          </p>
        </div>
      </motion.div>

      {/* Summary Cards - Updated to 5 columns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {loading ? (
          [...Array(5)].map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : (
          summaryCards.map(({ title, icon, value, color, description }, index) => (
            <motion.div
              key={title}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="rounded-xl border-2 transition-all hover:shadow-lg cursor-help" style={{
                      backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                      borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium mb-1" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                              {title}
                            </p>
                            <p className="text-2xl font-bold" style={{ color }}>
                              {value}
                            </p>
                          </div>
                          <div 
                            className="rounded-lg p-2"
                            style={{
                              backgroundColor: `${color}20`,
                              color: color,
                            }}
                          >
                            {icon}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Inventory Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="rounded-xl border-2 transition-all" style={{
          backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
          borderColor: isDarkMode ? "#334155" : "#cbd5e1",
        }}>
          <CardHeader className="rounded-t-xl p-6" style={{
            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
          }}>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="text-lg font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                  Inventory Items
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                  {totalItems} supply item{totalItems !== 1 ? 's' : ''} in inventory
                </CardDescription>
              </div>
              
              {!loading && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openAddForm}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isDarkMode ? "#0f172a" : "#0f172a",
                    color: "#f1f5f9",
                  }}
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span className="text-sm font-medium">Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span className="text-sm font-medium">Add Item</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="animate-pulse p-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                      <div>
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : items.length > 0 ? (
              <TooltipProvider>
                <div className="rounded-lg border-2 shadow-sm" style={{
                  borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                        backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                      }}>
                        <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Supply Item</th>
                        <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Quantity</th>
                        <th className="p-4 text-center font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Status</th>
                        <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Price</th>
                        <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Last Restock</th>
                        <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Restock Qty</th>
                        <th className="p-4 text-right font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const status = getStatusIcon(
                          item.quantity,
                          item.lowStockThreshold ?? 0,
                          item.adequateStockThreshold ?? 0,
                        );

                        return (
                          <tr
                            key={item._id || item.id}
                            className="border-t transition-all hover:opacity-90"
                            style={{
                              borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                              backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "#f8fafc",
                            }}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-lg p-2" style={{
                                  backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                }}>
                                  <Package className="h-4 w-4" style={{ color: isDarkMode ? '#3DD9B6' : '#0B2B26' }} />
                                </div>
                                <div>
                                  <p className="font-medium" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                    {item.name}
                                  </p>
                                  {item.category && (
                                    <p className="text-xs" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                                      {item.category}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                  {item.quantity}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="rounded-lg border-2 capitalize"
                                  style={{
                                    borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                                    color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                    backgroundColor: isDarkMode
                                      ? "rgba(51, 65, 85, 0.3)"
                                      : "rgba(243, 237, 227, 0.9)",
                                  }}
                                >
                                  {item.unit || "units"}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      className="flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-1 transition-all"
                                      style={{
                                        backgroundColor: isDarkMode ? status.darkBgColor : status.bgColor,
                                        borderColor: isDarkMode ? status.darkBorderColor : status.borderColor,
                                      }}
                                    >
                                      <span className={isDarkMode ? status.color : status.color}>
                                        {status.icon}
                                      </span>
                                      <span className={isDarkMode ? status.darkLabelColor : status.labelColor}>
                                        {status.label}
                                      </span>
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Current stock level: {item.quantity} {item.unit}
                                    </p>
                                    {item.lowStockThreshold && (
                                      <p>Low stock threshold: {item.lowStockThreshold}</p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                            <td className="p-4" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                              ₱{item.price?.toFixed(2) ?? "—"}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }} />
                                <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                  {formatDate(item.lastRestock)}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              {item.lastRestockAmount != null ? (
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                  <span className="font-semibold text-green-600">
                                    +{item.lastRestockAmount}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>—</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                {/* Add Stock Button */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => openStockModal(item)}
                                      disabled={saving || addingStock}
                                      className="rounded-lg p-2 transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                      style={{
                                        backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                      }}
                                    >
                                      <Plus className="h-4 w-4" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }} />
                                    </motion.button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Add Stock</p>
                                  </TooltipContent>
                                </Tooltip>

                                {/* Edit Button */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleEdit(item)}
                                      disabled={saving}
                                      className="rounded-lg p-2 transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                      style={{
                                        backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                      }}
                                    >
                                      <Package className="h-4 w-4" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }} />
                                    </motion.button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Item</p>
                                  </TooltipContent>
                                </Tooltip>

                                {/* Delete Button */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleDeleteClick(item)}
                                      disabled={saving || deleting}
                                      className="rounded-lg p-2 transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                      style={{
                                        backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(239, 68, 68, 0.1)",
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" style={{ color: isDarkMode ? '#ef4444' : '#dc2626' }} />
                                    </motion.button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete Item</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TooltipProvider>
            ) : (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center justify-center" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                  <PackageX className="mb-4 h-12 w-12" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }} />
                  <p className="text-lg font-medium">No supplies found</p>
                  <p className="text-sm mb-4">Inventory items will appear here once added</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openAddForm}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: isDarkMode ? "#1e293b" : "#0f172a",
                      color: "#f1f5f9",
                    }}
                  >
                    {saving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span className="text-sm font-medium">Adding...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        <span className="text-sm font-medium">Add Your First Item</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Inventory Form Modal */}
      {showForm && (
        <InventoryForm
          item={editingItem}
          onAdd={handleSave}
          onClose={closeForm}
          existingItems={items}
          loading={saving}
        />
      )}

      {/* Stock Modal */}
      {showStockModal && selectedItem && (
        <StockModal
          item={selectedItem}
          onClose={closeStockModal}
          onSubmit={handleAddStock}
          loading={addingStock}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <DeleteConfirmationModal
          item={itemToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default MainPage;