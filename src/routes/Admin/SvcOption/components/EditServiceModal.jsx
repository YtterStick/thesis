import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const EditServiceModal = ({ service, onClose, onSave }) => {
  const [form, setForm] = useState({ name: "", description: "", price: "" });

  useEffect(() => {
    setForm(service || { name: "", description: "", price: "" });
  }, [service]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    const parsedPrice = parseFloat(form.price);
    if (isNaN(parsedPrice)) return;
    onSave({ ...form, price: parsedPrice, id: service?.id || Date.now() });
  };

  return (
    <Dialog open={!!service} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {service?.id ? "Edit Service" : "Add Service"}
          </DialogTitle>
          <DialogClose />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input
            placeholder="Service name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            className="form-input"
          />
          <Textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
            className="form-input"
          />
          <Input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => handleChange("price", e.target.value)}
            required
            min="0"
            step="0.01"
            className="form-input"
          />
          <Button
            type="submit"
            className="w-full bg-[#3DD9B6] text-white hover:bg-[#2fc3a4] dark:bg-[#007362] dark:hover:bg-[#00564e]"
          >
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditServiceModal;