import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const EditServiceModal = ({ service, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
  });

  useEffect(() => {
    setForm({
      name: service?.name ?? "",
      description: service?.description ?? "",
      price: service?.price?.toFixed(2) ?? "",
    });
  }, [service]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    const parsedPrice = parseFloat(form.price);
    if (isNaN(parsedPrice)) return;

    const payload = {
      ...form,
      price: parsedPrice,
    };

    if (service?.id) {
      payload.id = service.id;
    }

    onSave(payload);
  };

  return (
    <Dialog open={!!service} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {service?.id ? "Edit Service" : "Add Service"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            Fill out the details below to save your service.
          </DialogDescription>
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
            type="text"
            inputMode="decimal"
            pattern="^\d+(\.\d{0,2})?$"
            placeholder="Price"
            value={form.price}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*\.?\d{0,2}$/.test(value)) {
                handleChange("price", value);
              }
            }}
            onBlur={() => {
              const formatted = parseFloat(form.price);
              if (!isNaN(formatted)) {
                handleChange("price", formatted.toFixed(2));
              }
            }}
            required
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