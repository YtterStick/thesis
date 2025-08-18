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
import { useToast } from "@/hooks/use-toast";

const InventoryForm = ({ item, onAdd, onClose, existingItems = [] }) => {
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    unit: "pcs",
    price: "",
  });

  const { toast } = useToast();
  const units = ["pcs", "kg", "L"];
  const isEditMode = Boolean(item);

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        quantity: item.quantity.toString(),
        unit: item.unit,
        price: item.price?.toString() ?? "",
      });
    }
  }, [item]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { name, quantity, unit, price } = form;

    if (!name || quantity === "" || price === "" || isNaN(quantity) || isNaN(price)) return;

    const normalizedName = name.trim().toLowerCase();
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
      name: name.trim(),
      quantity: parseInt(quantity),
      unit,
      price: parseFloat(price),
      ...(isEditMode ? {} : { lastRestock: new Date().toISOString() }),
    };

    onAdd(result);
    setForm({ name: "", quantity: "", unit: "pcs", price: "" });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
      <DialogContent className="z-50 rounded-lg border border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEditMode ? "Edit Item" : "Add New Item"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEditMode
              ? "Edit the inventory item's name, quantity, unit, and price."
              : "Provide item name, quantity, unit, and price to add to inventory."}
          </DialogDescription>
          <DialogClose />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <Input
            placeholder="Item name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
          />
          <Input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) => handleChange("quantity", e.target.value)}
            required
            min="0"
            step="1"
            className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
          />

          {/* Price Input with Peso Sign */}
          <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 focus-within:ring-2 focus-within:ring-cyan-500 dark:focus-within:ring-cyan-400 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-slate-950">
            <span className="px-3 text-slate-500 dark:text-slate-400">₱</span>
            <Input
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
              required
              min="0"
              step="0.01"
              className="flex-1 border-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none"
            />
          </div>

          <Select
            value={form.unit}
            onValueChange={(value) => handleChange("unit", value)}
          >
            <SelectTrigger className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
              {units.map((u) => (
                <SelectItem
                  key={u}
                  value={u}
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="submit"
            className="w-full bg-[#0891B2] hover:bg-[#0E7490] text-white rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
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