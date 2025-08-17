import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, X } from "lucide-react";

export default function EditServiceModal({ service, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
  });

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name || "",
        description: service.description || "",
        price: service.price?.toString() || "",
      });
    }
  }, [service]);

  if (!service) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const payload = {
      ...service,
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
    };
    onSave(payload);
  };

  const inputClass =
    "bg-white dark:bg-slate-950 text-slate-700 dark:text-muted-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

  const buttonClass =
    "bg-[#0891B2] hover:bg-[#0E7490] text-white rounded-md px-4 py-2 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-w-lg w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-md text-slate-900 dark:text-white p-6 rounded-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {service.id ? "Edit Service" : "Add New Service"}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Service Name */}
          <div>
            <Label className="text-slate-700 dark:text-muted-foreground">Service Name</Label>
            <Input
              className={inputClass}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Wash & Fold"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-slate-700 dark:text-muted-foreground">Description</Label>
            <Input
              className={inputClass}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="e.g. Includes detergent and softener"
            />
          </div>

          {/* Price with Peso Sign */}
          <div>
            <Label className="text-slate-700 dark:text-muted-foreground">Price</Label>
            <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus-within:ring-2 focus-within:ring-cyan-500 dark:focus-within:ring-cyan-400 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-slate-950">
              <span className="px-3 text-slate-500 dark:text-slate-400">₱</span>
              <Input
                type="number"
                className="flex-1 border-none bg-transparent text-slate-700 dark:text-muted-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="Price"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSubmit} className={buttonClass}>
              <Save className="w-4 h-4" />
              {service.id ? "Update Service" : "Save Service"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}