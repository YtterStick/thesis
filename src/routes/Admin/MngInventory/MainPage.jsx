import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Plus, Boxes, PackageX, Package, Clock8 } from "lucide-react";
import InventoryForm from "./InventoryForm";
import InventoryTable from "./InventoryTable";
import StockModal from "./StockModal";

const ALLOWED_SKEW_MS = 5000;

const isTokenExpired = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp * 1000;
    const now = Date.now();
    return exp + ALLOWED_SKEW_MS < now;
  } catch (err) {
    console.warn("❌ Failed to decode token:", err);
    return true;
  }
};

const secureFetch = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem("authToken");

  if (!token || isTokenExpired(token)) {
    window.location.href = "/login";
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`http://localhost:8080/api${endpoint}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} - ${errorText}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (err) {
      console.warn("Expected JSON but failed to parse:", err);
      return null;
    }
  }

  return null;
};

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
      const data = await secureFetch("/stock");
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
        await secureFetch(`/stock/${editingItem.id}`, "PUT", data);
      } else {
        await secureFetch("/stock", "POST", data);
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
      await secureFetch(`/stock/${item.id}`, "DELETE");
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
      await secureFetch(`/stock/${selectedItem.id}/restock?amount=${amount}`, "PUT");
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

  // Skeleton Loader Components
  const SkeletonCard = ({ index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl border-2 p-5 transition-all"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      }}
    >
      <div className="flex items-center gap-x-3 mb-4">
        <div className="w-fit rounded-lg p-2 animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}>
          <div className="h-6 w-6"></div>
        </div>
        <div className="h-5 w-28 rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
      <div className="rounded-lg p-3 animate-pulse"
           style={{
             backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3"
           }}>
        <div className="h-8 w-32 rounded"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
    </motion.div>
  );

  const summaryCards = [
    {
      title: "Total Items",
      icon: <Boxes size={26} />,
      value: items.length,
      color: "#3DD9B6",
      description: "Total inventory items",
    },
    {
      title: "Out of Stock",
      icon: <PackageX size={26} />,
      value: out,
      color: "#F87171",
      description: "Items that need restocking",
    },
    {
      title: "Low Stock",
      icon: <Package size={26} />,
      value: low,
      color: "#FB923C",
      description: "Items below threshold",
    },
    {
      title: "Adequate Stock",
      icon: <Clock8 size={26} />,
      value: adequate,
      color: "#60A5FA",
      description: "Items well stocked",
    },
  ];

  return (
    <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-3"
      >
        <div className="flex items-center gap-3">
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
              Manage Inventory
            </p>
            <p className="text-sm" style={{ color: isDarkMode ? '#F3EDE3/70' : '#0B2B26/70' }}>
              Track and manage your inventory items
            </p>
          </div>
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
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, index) => (
            <SkeletonCard key={index} index={index} />
          ))
        ) : (
          summaryCards.map(({ title, icon, value, color, description }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.03,
                y: -2,
                transition: { duration: 0.2 }
              }}
              className="rounded-xl border-2 p-5 transition-all cursor-pointer"
              style={{
                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="rounded-lg p-2"
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                  }}
                >
                  {icon}
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="text-right"
                >
                  <p className="text-2xl font-bold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                    {value}
                  </p>
                </motion.div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                  {title}
                </h3>
                <p className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/80' }}>
                  {description}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Inventory Table */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 p-5 transition-all"
          style={{
            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
          }}
        >
          <div className="h-64 animate-pulse rounded-lg"
               style={{
                 backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3"
               }}></div>
        </motion.div>
      ) : items.length > 0 ? (
        <InventoryTable
          items={items}
          onAddStock={openStockModal}
          onEditItem={handleEdit}
          onDeleteRequest={handleDelete}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 p-8 text-center transition-all"
          style={{
            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
          }}
        >
          <div className="flex flex-col items-center justify-center">
            <Boxes className="mb-4 h-16 w-16 opacity-50" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/50' }} />
            <p className="mb-2 text-lg font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
              No inventory items yet.
            </p>
            <p className="mb-4 text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
              Start by adding your first inventory item.
            </p>
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
        </motion.div>
      )}

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