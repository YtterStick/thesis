import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const InventoryForm = ({ onAdd, onClose, item }) => {
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "pcs",
  });

  const units = ["pcs", "kg", "L"];
  const isEditMode = Boolean(item);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        quantity: item.quantity.toString(),
        unit: item.unit,
      });
    }
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.quantity === "" || isNaN(formData.quantity)) return;

    const result = {
      name: formData.name.trim(),
      quantity: parseInt(formData.quantity),
      unit: formData.unit,
      lastRestock: new Date().toISOString().slice(0, 10),
    };

    onAdd(result);
    setFormData({ name: "", quantity: "", unit: "pcs" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
      <div className="card w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <p className="card-title">{isEditMode ? "Edit Item" : "Add New Item"}</p>
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-3">
          <input
            type="text"
            placeholder="Item Name"
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <input
            type="number"
            min={0}
            placeholder="Quantity"
            className="form-input"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />

          <select
            className="form-input bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          >
            {units.map((u) => (
              <option
                key={u}
                value={u}
                className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-50"
              >
                {u}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="mt-2 rounded-lg bg-[#008B76] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#007362] dark:bg-[#007362] dark:hover:bg-[#00564e]"
          >
            {isEditMode ? "Update Item" : "Save Item"}
          </button>
        </form>
      </div>
    </div>
  );
};

InventoryForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.object,
};

export default InventoryForm;