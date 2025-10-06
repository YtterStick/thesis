import { useState, useEffect } from "react";
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
      // Close modal immediately before fetching
      setShowForm(false);
      setEditingItem(null);
      // Then refresh data
      await fetchInventory();
    } catch (error) {
      console.error("Error saving item:", error);
      // Keep modal open on error so user can fix and retry
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
      // Close modal immediately before fetching
      setSelectedItem(null);
      setShowStockModal(false);
      // Then refresh data
      await fetchInventory();
    } catch (error) {
      console.error("Error adding stock:", error);
      // Keep modal open on error
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

  return (
    <main className="relative p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Boxes className="h-6 w-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Manage Inventory</h1>
        </div>
        {!loading && items.length > 0 && (
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 text-slate-900 transition-colors hover:text-cyan-500 dark:text-white dark:hover:text-cyan-400"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Add Item</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[
          {
            title: "Total Items",
            icon: <Boxes size={26} />,
            value: items.length,
            color: "#3DD9B6",
          },
          {
            title: "Out of Stock",
            icon: <PackageX size={26} />,
            value: out,
            color: "#F87171",
          },
          {
            title: "Low Stock",
            icon: <Package size={26} />,
            value: low,
            color: "#FB923C",
          },
          {
            title: "Adequate Stock",
            icon: <Clock8 size={26} />,
            value: adequate,
            color: "#60A5FA",
          },
        ].map(({ title, icon, value, color }) => (
          <div key={title} className="card">
            <div className="card-header flex items-center gap-x-3">
              <div
                className="w-fit rounded-lg p-2"
                style={{
                  backgroundColor: `${color}33`,
                  color: color,
                }}
              >
                {icon}
              </div>
              <p className="card-title">{title}</p>
            </div>
            <div className="card-body rounded-md bg-slate-100 p-4 transition-colors dark:bg-slate-950">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[160px] animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <InventoryTable
          items={items}
          onAddStock={openStockModal}
          onEditItem={handleEdit}
          onDeleteRequest={handleDelete}
        />
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <img
            src="https://www.transparenttextures.com/patterns/stardust.png"
            alt="Empty"
            className="mb-4 h-32 w-32 opacity-50"
          />
          <p className="mb-2 text-slate-500 dark:text-slate-400">No inventory items yet.</p>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 text-slate-900 transition-colors hover:text-cyan-500 dark:text-white dark:hover:text-cyan-400"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Add Your First Item</span>
          </button>
        </div>
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
    </main>
  );
};

export default MainPage;