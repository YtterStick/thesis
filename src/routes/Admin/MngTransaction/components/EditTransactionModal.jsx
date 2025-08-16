import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-lg border border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Edit Transaction
          </DialogTitle>
          <DialogDescription className="sr-only">
            Update customer name and status fields.
          </DialogDescription>
          <DialogClose />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <Input
            placeholder="Customer name"
            value={updated.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
          />

          {Object.entries(statusOptions).map(([field, options]) => (
            <Select
              key={field}
              value={updated[field] || ""}
              onValueChange={(value) => handleChange(field, value)}
            >
              <SelectTrigger className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950">
                <SelectValue placeholder={`Select ${field}`} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                {options.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          <Button
            type="submit"
            className="w-full bg-[#0891B2] hover:bg-[#0E7490] text-white rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
          >
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

EditTransactionModal.propTypes = {
  transaction: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default EditTransactionModal;