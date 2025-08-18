import { useState, useEffect } from "react";
import {
  Plus,
  Boxes,
  PackageX,
  Package,
  Clock8,
} from "lucide-react";
import InventoryForm from "./InventoryForm";
import InventoryTable from "./InventoryTable";
import StockModal from "./StockModal";
import { Button } from "@/components/ui/button";

const ALLOWED_SKEW_MS = 5000;

const isTokenExpired = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp * 1000;
    const now = Date.now();

    console.log("🔍 Token expiration check:");
    console.log("⏳ Exp:", new Date(exp).toLocaleString());
    console.log("🕒 Now:", new Date(now).toLocaleString());

    return exp + ALLOWED_SKEW_MS < now;
  } catch (err) {
    console.warn("❌ Failed to decode token:", err);
    return true;
  }
};

const secureFetch = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem("authToken"); // ✅ consistent with backend

  if (!token || isTokenExpired(token)) {
    console.warn("⛔ Token expired. Redirecting to login.");
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
    console.error(`❌ ${method} ${endpoint} failed:`, response.status);
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
};

const MainPage = () => {
  const [items, setItems] = useState([]);
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
      const safeItems = Array.isArray(data) ? data : data.items ?? [];
      setItems(safeItems);
    } catch (error) {
      console.error("Error loading inventory:", error);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingItem) {
        await secureFetch(`/stock/${editingItem.id}`, "PUT", data);
      } else {
        await secureFetch("/stock", "POST", data);
      }
      fetchInventory();
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleDelete = async (item) => {
    try {
      await secureFetch(`/stock/${item.id}`, "DELETE");
      fetchInventory();
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
      fetchInventory();
    } catch (error) {
      console.error("Error adding stock:", error);
    } finally {
      setSelectedItem(null);
      setShowStockModal(false);
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

  return (
    <main className="relative p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Boxes className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Manage Inventory
          </h1>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 text-slate-900 dark:text-white hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Add Item</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        {[
          {
            title: "Total Items",
            icon: <Boxes size={26} />,
            value: items.length,
            growth: "+0% change today",
            color: "#3DD9B6",
            growthColor: "text-emerald-700 dark:text-[#28b99a]",
          },
          {
            title: "Out of Stock",
            icon: <PackageX size={26} />,
            value: items.filter((i) => i.quantity === 0).length,
            growth: "-0% change today",
            color: "#F87171",
            growthColor: "text-red-600 dark:text-red-400",
          },
          {
            title: "Low Stock",
            icon: <Package size={26} />,
            value: items.filter((i) => i.quantity > 0 && i.quantity < 5).length,
            growth: "+0% change today",
            color: "#FB923C",
            growthColor: "text-orange-600 dark:text-orange-400",
          },
          {
            title: "Recently Restocked",
            icon: <Clock8 size={26} />,
            value: items.filter((i) => i.restockedRecently).length || 0,
            growth: "+0% change today",
            color: "#60A5FA",
            growthColor: "text-blue-600 dark:text-blue-400",
          },
        ].map(({ title, icon, value, growth, color, growthColor }) => (
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
            <div className="card-body bg-slate-100 dark:bg-slate-950 rounded-md p-4 transition-colors">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                {value}
              </p>
              <p className={`text-xs font-medium ${growthColor}`}>
                {growth}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Inventory Table or Empty State */}
      {items.length > 0 ? (
        <InventoryTable
          items={items}
          onAddStock={openStockModal}
          onEditItem={handleEdit}
          onDeleteRequest={handleDelete}
        />
      ) : (
        <div className="flex flex-col items-center justify-center mt-12 text-center">
          <img
            src="https://www.transparenttextures.com/patterns/stardust.png"
            alt="Empty"
            className="w-32 h-32 opacity-50 mb-4"
          />
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            No inventory items yet.
          </p>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 text-slate-900 dark:text-white hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Add Your First Item</span>
          </button>
        </div>
      )}

      {/* Inventory Form */}
      {showForm && !showStockModal && (
        <InventoryForm
          item={editingItem}
          onAdd={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
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