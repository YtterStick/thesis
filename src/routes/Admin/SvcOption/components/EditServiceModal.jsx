import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, X, AlertCircle, Lock } from "lucide-react";

// Permanent services that cannot have their names modified
const PERMANENT_SERVICES = ["Wash & Dry", "Wash", "Dry"];

export default function EditServiceModal({ service, onClose, onSave }) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if this is a permanent service (Wash, Dry, or Wash & Dry)
  const isPermanentService = service?.name && PERMANENT_SERVICES.includes(service.name);
  const isEditing = !!service?.id;

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name || "",
        description: service.description || "",
        price: service.price?.toString() || "",
      });
    }
    setErrors({});
  }, [service]);

  if (!service) return null;

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation - only for non-permanent services
    if (!isPermanentService) {
      if (!form.name.trim()) {
        newErrors.name = "Service name is required";
      }
    }

    // Price validation
    if (!form.price || parseFloat(form.price) <= 0) {
      newErrors.price = "Valid price is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    // Don't allow name changes for permanent services (Wash, Dry, Wash & Dry)
    if (field === "name" && isPermanentService) return;
    
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...service,
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
      };
      await onSave(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="max-w-lg w-full rounded-xl border p-6 shadow-xl transition-all"
          style={{
            backgroundColor: "var(--admin-card-bg)",
            borderColor: "var(--admin-card-border)",
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--admin-text-primary)" }}>
                {isEditing ? "Edit Service" : "Add New Service"}
              </h2>
              {isPermanentService && (
                <p className="text-xs mt-1 flex items-center gap-1" 
                   style={{ color: "var(--admin-accent)" }}>
                  <Lock size={12} />
                  Permanent service - name cannot be changed
                </p>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="rounded-lg p-2 transition-all hover:opacity-80"
              style={{
                backgroundColor: "var(--admin-accent-soft)",
                color: "var(--admin-accent)",
              }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="space-y-5" onKeyPress={handleKeyPress}>
            {/* Service Name */}
            <div>
              <Label className="text-sm font-bold mb-2 block" style={{ color: "var(--admin-text-primary)" }}>
                Service Name
                {isPermanentService && (
                  <span className="ml-2 text-xs opacity-70">
                    (Locked)
                  </span>
                )}
              </Label>
              
              {isPermanentService ? (
                // Display-only field for permanent services
                <div 
                  className="flex items-center gap-2 rounded-lg border p-3 transition-all"
                  style={{
                    backgroundColor: "var(--admin-bg)",
                    borderColor: "var(--admin-card-border)",
                    color: "var(--admin-text-primary)",
                  }}
                >
                  <Lock size={16} className="opacity-50" />
                  <span className="flex-1 font-semibold">{form.name}</span>
                </div>
              ) : (
                // Editable field for custom services
                <Input
                  className="rounded-lg transition-all"
                  style={{
                    backgroundColor: "var(--admin-bg)",
                    borderColor: errors.name ? "#ef4444" : "var(--admin-card-border)",
                    color: "var(--admin-text-primary)",
                  }}
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Express Service, Premium Care"
                />
              )}
              
              {errors.name && (
                <p className="text-xs mt-1 flex items-center gap-1 text-red-500">
                  <AlertCircle size={12} />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-bold mb-2 block" style={{ color: "var(--admin-text-primary)" }}>
                Description
              </Label>
              <Input
                className="rounded-lg transition-all"
                style={{
                  backgroundColor: "var(--admin-bg)",
                  borderColor: "var(--admin-card-border)",
                  color: "var(--admin-text-primary)",
                }}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="e.g. Includes detergent and softener"
              />
            </div>

            {/* Price */}
            <div>
              <Label className="text-sm font-bold mb-2 block" style={{ color: "var(--admin-text-primary)" }}>
                Price
              </Label>
              <div 
                className="flex items-center rounded-lg border transition-all focus-within:ring-2 focus-within:ring-blue-500/20"
                style={{
                  backgroundColor: "var(--admin-bg)",
                  borderColor: errors.price ? "#ef4444" : "var(--admin-card-border)",
                }}
              >
                <span className="px-3 opacity-60" style={{ color: "var(--admin-text-primary)" }}>₱</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="flex-1 border-none bg-transparent transition-all focus-visible:outline-none focus-visible:ring-0"
                  style={{
                    color: "var(--admin-text-primary)",
                  }}
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="text-xs mt-1 flex items-center gap-1 text-red-500">
                  <AlertCircle size={12} />
                  {errors.price}
                </p>
              )}
            </div>

            {/* Save Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex justify-end pt-2"
            >
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-lg px-8 py-2 transition-all flex items-center gap-2 text-white shadow-md active:scale-95"
                style={{
                  backgroundColor: "var(--admin-accent)",
                }}
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Saving..." : (isEditing ? "Update Service" : "Save Service")}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}