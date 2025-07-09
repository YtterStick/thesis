import { useState, useEffect } from "react";
import { Listbox } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

const statusOptions = {
  paymentStatus: ["Paid", "Unpaid"],
  laundryStatus: ["Pending", "Washing", "Done"],
  pickupStatus: ["Unclaimed", "Claimed", "Expired"],
};

const EditTransactionModal = ({ transaction, isOpen, onClose, onSave }) => {
  const [updated, setUpdated] = useState(() => transaction || {});

  useEffect(() => {
    setUpdated(transaction || {});
  }, [transaction, isOpen]);

  const handleChange = (field, value) => {
    setUpdated((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(updated);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
      <div className="card w-full max-w-md">
        {/* Header with animated close button */}
        <div className="mb-4 flex items-center justify-between">
          <p className="card-title">Edit Transaction</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="group p-1 transition-transform duration-300 ease-in-out hover:rotate-90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-red-600 transition-colors duration-200 group-hover:text-red-400 dark:text-red-400 dark:group-hover:text-red-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form content */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-3">
          <input
            type="text"
            placeholder="Customer name"
            className="form-input"
            value={updated.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />

          {Object.entries(statusOptions).map(([field, options]) => (
            <Listbox
              key={field}
              value={updated[field] || ""}
              onChange={(val) => handleChange(field, val)}
            >
              <div className="relative">
                <Listbox.Button className="form-input pr-10 text-left leading-[1.25rem]">
                  {updated[field] || `Select ${field}`}
                </Listbox.Button>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  size={16}
                />
                <Listbox.Options className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                  {options.map((option) => (
                    <Listbox.Option
                      key={option}
                      value={option}
                      className="cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {option}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          ))}

          <button
            type="submit"
            className="mt-2 rounded-lg bg-[#008B76] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#007362] dark:bg-[#007362] dark:hover:bg-[#00564e]"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;