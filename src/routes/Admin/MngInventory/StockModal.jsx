import { useState } from "react";
import PropTypes from "prop-types";

const StockModal = ({ item, onClose, onSubmit }) => {
  const [amount, setAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = parseInt(amount, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onSubmit(parsed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
      <div className="card w-full max-w-sm">
        <p className="card-title mb-2">Add Stock</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {item.name} stock:{" "}
            <strong className="text-slate-900 dark:text-white">
              {item.quantity}
            </strong>
          </p>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            Unit price:{" "}
            <strong className="text-slate-900 dark:text-white">
              ₱{item.price?.toFixed(2) ?? "—"}
            </strong>
          </p>

          <input
            type="number"
            min={1}
            placeholder="Enter amount to add"
            className="form-input border border-slate-300 bg-slate-100 text-slate-800 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="mt-2 flex justify-end gap-x-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#008B76] px-4 py-2 text-sm font-medium text-white hover:bg-[#007362] dark:bg-[#007362] dark:hover:bg-[#00564e]"
            >
              Add Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

StockModal.propTypes = {
  item: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default StockModal;