import { useState } from "react";
import InventoryTable from "./InventoryTable";
import InventoryForm from "./InventoryForm";
import StockModal from "./StockModal";
import ConfirmDialog from "./components/ConfirmDialog";
import ToastMessage from "./components/ToastMessage";

const initialInventory = [
  { id: 1, name: "Plastic", quantity: 20, unit: "pcs", lastRestock: "2025-06-28" },
  { id: 2, name: "Detergent", quantity: 0, unit: "pcs", lastRestock: "2025-06-25" },
  { id: 3, name: "Fabric", quantity: 5, unit: "pcs", lastRestock: "2025-06-29" },
];

const MainPage = () => {
  const [inventory, setInventory] = useState(initialInventory);
  const [activeItem, setActiveItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const updateStock = (id, amount) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + amount,
              lastRestock: new Date().toISOString().slice(0, 10),
            }
          : item
      )
    );
  };

  const handleDeleteRequest = (item) => {
    if (item.quantity > 0) {
      setToast(`Cannot delete "${item.name}" — stock still available.`);
    } else {
      setConfirmDelete(item);
    }
  };

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <h1 className="title">Manage Inventory</h1>
        <button
          onClick={() => {
            setEditItem(null);
            setShowForm(true);
          }}
          className="btn-ghost border px-4 py-2 text-sm text-slate-900 dark:text-slate-50"
        >
          + Add Item
        </button>
      </div>

      <div className="card">
        <div className="card-header justify-between">
          <p className="card-title">Inventory List</p>
        </div>
        <InventoryTable
          items={inventory}
          onAddStock={(item) => setActiveItem(item)}
          onEditItem={(item) => {
            setEditItem(item);
            setShowForm(true);
          }}
          onDeleteRequest={handleDeleteRequest}
        />
      </div>

      {activeItem && (
        <StockModal
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onSubmit={(amount) => {
            updateStock(activeItem.id, amount);
            setActiveItem(null);
          }}
        />
      )}

      {showForm && (
        <InventoryForm
          item={editItem}
          onAdd={(newItem) => {
            if (editItem) {
              setInventory((prev) =>
                prev.map((i) => (i.id === editItem.id ? { ...i, ...newItem } : i))
              );
            } else {
              setInventory((prev) => [...prev, { ...newItem, id: prev.length + 1 }]);
            }
            setShowForm(false);
            setEditItem(null);
          }}
          onClose={() => {
            setShowForm(false);
            setEditItem(null);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${confirmDelete.name}" from inventory?`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            setInventory((prev) => prev.filter((i) => i.id !== confirmDelete.id));
            setConfirmDelete(null);
          }}
        />
      )}

      {toast && <ToastMessage message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MainPage;