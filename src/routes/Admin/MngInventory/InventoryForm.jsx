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
import { useToast } from "@/hooks/use-toast"; // ✅ Toast hook

const InventoryForm = ({ item, onAdd, onClose, existingItems = [] }) => {
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    unit: "pcs",
  });

  const { toast } = useToast(); // ✅ Toast instance
  const units = ["pcs", "kg", "L"];
  const isEditMode = Boolean(item);

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        quantity: item.quantity.toString(),
        unit: item.unit,
      });
    }
  }, [item]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || form.quantity === "" || isNaN(form.quantity)) return;

    const normalizedName = form.name.trim().toLowerCase();
    const isDuplicate = existingItems.some(
      (i) =>
        i.name.trim().toLowerCase() === normalizedName &&
        (!isEditMode || i.id !== item.id)
    );

    if (isDuplicate) {
      toast({
        title: "Duplicate Item",
        description: "An item with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    const result = {
      name: form.name.trim(),
      quantity: parseInt(form.quantity),
      unit: form.unit,
      ...(isEditMode ? {} : { lastRestock: new Date().toISOString() }),
    };

    onAdd(result);
    setForm({ name: "", quantity: "", unit: "pcs" });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="rounded-lg border border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {isEditMode ? "Edit Item" : "Add New Item"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEditMode
              ? "Edit the inventory item's name, quantity, and unit."
              : "Provide item name, quantity, and unit to add to inventory."}
          </DialogDescription>
          <DialogClose />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <Input
            placeholder="Item name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            className="form-input"
          />
          <Input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) => handleChange("quantity", e.target.value)}
            required
            min="0"
            step="1"
            className="form-input"
          />
          <Select
            value={form.unit}
            onValueChange={(value) => handleChange("unit", value)}
          >
            <SelectTrigger className="form-input">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
              {units.map((u) => (
                <SelectItem
                  key={u}
                  value={u}
                  className="cursor-pointer bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
                >
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="submit"
            className="w-full bg-[#3DD9B6] text-white hover:bg-[#2fc3a4] dark:bg-[#007362] dark:hover:bg-[#00564e]"
          >
            {isEditMode ? "Update Item" : "Save Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

InventoryForm.propTypes = {
  item: PropTypes.object,
  onAdd: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  existingItems: PropTypes.array,
};

export default InventoryForm;