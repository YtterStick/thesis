import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Plus, Boxes, PackageX, Package, Clock8, Calendar, TrendingUp } from "lucide-react";
import InventoryForm from "./InventoryForm";
import InventoryTable from "./InventoryTable";
import StockModal from "./StockModal";
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
import { api } from "@/lib/api-config"; // Import the api utility

const getStockStatusCounts = (items) => {
  let out = 0, low = 0, adequate = 0;

  for (const item of items) {
    const q = item.quantity ?? 0;
    const lowT = item.lowStockThreshold ?? 0;
    const adequateT = item.adequateStockThreshold ?? 0;

    if (q === 0) out++;
    else if (q <= lowT) low++;
    else if (q <= adequateT) adequate++;
  }

  return { out, low, adequate };
};

const MainPage = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      // Use the api utility instead of secureFetch
      const data = await api.get("api/stock");
      const safeItems = Array.isArray(data) ? data : (data.items ?? []);
      setItems(safeItems);
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingItem) {
        // Use api utility for PUT request
        await api.put(`api/stock/${editingItem.id}`, data);
      } else {
        // Use api utility for POST request
        await api.post("api/stock", data);
      }
      setShowForm(false);
      setEditingItem(null);
      await fetchInventory();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleDelete = async (item) => {
    try {
      // Use api utility for DELETE request
      await api.delete(`api/stock/${item.id}`);
      await fetchInventory();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleAddStock = async (amount) => {
    try {
      // Use api utility for PUT request
      await api.put(`api/stock/${selectedItem.id}/restock?amount=${amount}`);
      setSelectedItem(null);
      setShowStockModal(false);
      await fetchInventory();
    } catch (error) {
      console.error("Error adding stock:", error);
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

  const { out, low, adequate } = getStockStatusCounts(items);
  const totalItems = items.length;

  // Skeleton Loader Components
  const SkeletonCard = () => (
    <Card className="rounded-xl border-2 animate-pulse" style={{
      backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
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
      color: isDarkMode ? "#18442AF5" : "#0B2B26",
    },
    {
      title: "Well Stocked",
      icon: <Boxes size={20} />,
      value: adequate,
      color: "#059669",
    },
    {
      title: "Low Stock",
      icon: <PackageX size={20} />,
      value: low,
      color: "#D97706",
    },
    {
      title: "Out of Stock",
      icon: <Clock8 size={20} />,
      value: out,
      color: "#DC2626",
    },
  ];

  return (
    <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
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
            backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
            color: "#F3EDE3",
          }}
        >
          <Boxes size={22} />
        </motion.div>
        <div>
          <p className="text-xl font-bold" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
            Supply Monitoring
          </p>
          <p className="text-sm" style={{ color: isDarkMode ? '#F3EDE3/70' : '#0B2B26/70' }}>
            Track and manage inventory supplies
          </p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {loading ? (
          [...Array(4)].map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : (
          summaryCards.map(({ title, icon, value, color }, index) => (
            <motion.div
              key={title}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="rounded-xl border-2 transition-all hover:shadow-lg" style={{
                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
              }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                        {title}
                      </p>
                      <p className="text-2xl font-bold mt-1" style={{ color }}>
                        {value}
                      </p>
                    </div>
                    <div 
                      className="rounded-lg p-2"
                      style={{
                        backgroundColor: title === "Total Items" 
                          ? (isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)")
                          : `${color}20`,
                        color: title === "Total Items" 
                          ? (isDarkMode ? "#18442AF5" : "#0B2B26")
                          : color,
                      }}
                    >
                      {icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
          backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
          borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
        }}>
          <CardHeader className="rounded-t-xl p-6" style={{
            backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
          }}>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="text-lg font-bold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                  Inventory Items
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                  {totalItems} supply item{totalItems !== 1 ? 's' : ''} in inventory
                </CardDescription>
              </div>
              
              {!loading && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openAddForm}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
                  style={{
                    backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                    color: "#F3EDE3",
                  }}
                >
                  <Plus size={18} />
                  <span className="text-sm font-medium">Add Item</span>
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
                  borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                      }}>
                        <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Supply Item</th>
                        <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Quantity</th>
                        <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Price</th>
                        <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Last Restock</th>
                        <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Restock Qty</th>
                        <th className="p-4 text-right font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
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
                          <tr
                            key={item._id || item.id}
                            className="border-t transition-all hover:opacity-90"
                            style={{
                              borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                              backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                            }}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-lg p-2" style={{
                                  backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                                }}>
                                  <Package className="h-4 w-4" style={{ color: isDarkMode ? '#18442AF5' : '#0B2B26' }} />
                                </div>
                                <div>
                                  <p className="font-medium" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                    {item.name}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                  {item.quantity}
                                </span>
                                <span style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                  {item.unit}
                                </span>
                              </div>
                            </td>
                            <td className="p-4" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                              ₱{item.price?.toFixed(2) ?? "—"}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }} />
                                <span style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
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
                                <span style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>—</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => openStockModal(item)}
                                      className="rounded-lg p-2 transition-colors hover:opacity-80"
                                      style={{
                                        backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                                      }}
                                    >
                                      <Plus className="h-4 w-4" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }} />
                                    </motion.button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Add Stock</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleEdit(item)}
                                      className="rounded-lg p-2 transition-colors hover:opacity-80"
                                      style={{
                                        backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                                      }}
                                    >
                                      <Package className="h-4 w-4" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }} />
                                    </motion.button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Item</p>
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
                <div className="flex flex-col items-center justify-center" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                  <PackageX className="mb-4 h-12 w-12" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/50' }} />
                  <p className="text-lg font-medium">No supplies found</p>
                  <p className="text-sm mb-4">Inventory items will appear here once added</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openAddForm}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
                    style={{
                      backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                      color: "#F3EDE3",
                    }}
                  >
                    <Plus size={18} />
                    <span className="text-sm font-medium">Add Your First Item</span>
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
        />
      )}

      {/* Stock Modal */}
      {showStockModal && selectedItem && (
        <StockModal
          item={selectedItem}
          onClose={closeStockModal}
          onSubmit={handleAddStock}
        />
      )}
    </div>
  );
};

export default MainPage;