import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";

export default function EditServiceModal({ service, onClose, onSave }) {
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

  const handleSubmit = () => {
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

  const isEdit = !!service?.id;

  return (
    <Dialog open={!!service} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-md text-slate-900 dark:text-white">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Service" : "Add New Service"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service Name */}
          <div>
            <Label className="text-slate-700 dark:text-muted-foreground">Service Name</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Fold & Press"
              className="bg-white dark:bg-slate-950 text-slate-700 dark:text-muted-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-slate-700 dark:text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Optional service details"
              rows={3}
              className="bg-white dark:bg-slate-950 text-slate-700 dark:text-muted-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
            />
          </div>

          {/* Price with Peso Sign */}
          <div>
            <Label className="text-slate-700 dark:text-muted-foreground">Price</Label>
            <div className="flex items-center border border-slate-300 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 focus-within:ring-2 focus-within:ring-cyan-500 dark:focus-within:ring-cyan-400 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-slate-950">
              <span className="px-3 text-slate-500 dark:text-slate-400">₱</span>
              <Input
                type="text"
                inputMode="decimal"
                pattern="^\d+(\.\d{0,2})?$"
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
                placeholder="e.g. 49.99"
                className="flex-1 border-none bg-transparent text-slate-700 dark:text-muted-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              className="bg-[#0891B2] hover:bg-[#0E7490] text-white rounded-md px-4 py-2 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
            >
              <Save className="w-4 h-4" />
              {isEdit ? "Update Service" : "Save Service"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}