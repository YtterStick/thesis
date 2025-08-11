import { useState, useEffect } from "react";
import axios from "axios";
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

const MainPage = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);

  const getAxiosWithAuth = () => {
    const token = localStorage.getItem("token");
    return axios.create({
      baseURL: "http://localhost:8080/api",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await getAxiosWithAuth().get("/stock");
      const safeItems = Array.isArray(response.data)
        ? response.data
        : response.data.items ?? [];
      setItems(safeItems);
    } catch (error) {
      console.error("Error loading inventory:", error);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingItem) {
        await getAxiosWithAuth().put(`/stock/${editingItem.id}`, data);
      } else {
        await getAxiosWithAuth().post("/stock", data);
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
      await getAxiosWithAuth().delete(`/stock/${item.id}`);
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
      await getAxiosWithAuth().put(`/stock/${selectedItem.id}/restock?amount=${amount}`);
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
          <Boxes className="w-6 h-6 text-[#3DD9B6]" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Manage Inventory
          </h1>
        </div>
        {items.length > 0 && (
          <Button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="bg-[#3DD9B6] text-white hover:bg-[#2fc3a4] dark:bg-[#007362] dark:hover:bg-[#00564e] shadow-md transition-transform hover:scale-105"
          >
            <Plus size={16} className="mr-2" />
            Add Item
          </Button>
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
            darkColor: "#007362",
            growthColor: "text-emerald-700 dark:text-[#28b99a]",
          },
          {
            title: "Out of Stock",
            icon: <PackageX size={26} />,
            value: items.filter((i) => i.quantity === 0).length,
            growth: "-0% change today",
            color: "#F87171",
            darkColor: "#DC2626",
            growthColor: "text-red-600 dark:text-red-400",
          },
          {
            title: "Low Stock",
            icon: <Package size={26} />,
            value: items.filter((i) => i.quantity > 0 && i.quantity < 5).length,
            growth: "+0% change today",
            color: "#FB923C",
            darkColor: "#EA580C",
            growthColor: "text-orange-600 dark:text-orange-400",
          },
          {
            title: "Recently Restocked",
            icon: <Clock8 size={26} />,
            value: items.filter((i) => i.restockedRecently).length || 0,
            growth: "+0% change today",
            color: "#60A5FA",
            darkColor: "#2563EB",
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
            <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950 rounded-md p-4">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 transition-colors">
                {value}
              </p>
              <p className={`text-xs font-medium transition-colors ${growthColor}`}>
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
          <Button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="bg-[#3DD9B6] text-white hover:bg-[#2fc3a4] dark:bg-[#007362] dark:hover:bg-[#00564e]"
          >
            <Plus size={16} className="mr-2" />
            Add Your First Item
          </Button>
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