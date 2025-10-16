import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, X, AlertCircle, Lock } from "lucide-react";

// Permanent services that cannot be modified
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

  const isPermanentService = PERMANENT_SERVICES.includes(service?.name);
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
      } else {
        const name = form.name.trim();
        const normalized = name.toLowerCase();
        
        // Prevent variations of Wash and Dry
        if (normalized === "washes" || normalized === "washs") {
          newErrors.name = "Service name must be exactly 'Wash'";
        } else if (normalized === "drys" || normalized === "dries") {
          newErrors.name = "Service name must be exactly 'Dry'";
        } else if (normalized === "wash" && name !== "Wash") {
          newErrors.name = "Service name must be exactly 'Wash'";
        } else if (normalized === "dry" && name !== "Dry") {
          newErrors.name = "Service name must be exactly 'Dry'";
        }
        
        // Prevent any variations containing wash/dry
        if ((normalized.includes("wash") || normalized.includes("dry")) && 
            !PERMANENT_SERVICES.map(s => s.toLowerCase()).includes(normalized)) {
          newErrors.name = "Service name cannot contain variations of 'Wash' or 'Dry'";
        }
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
    // Don't allow name changes for permanent services
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
          className="max-w-lg w-full rounded-xl border-2 p-6 shadow-xl transition-all"
          style={{
            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                {isEditing ? "Edit Service" : "Add New Service"}
              </h2>
              {isPermanentService && (
                <p className="text-xs mt-1 flex items-center gap-1" 
                   style={{ color: isDarkMode ? '#0891B2' : '#0E7490' }}>
                  <Lock size={12} />
                  Permanent service - name cannot be changed
                </p>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="rounded-lg p-1 transition-colors hover:opacity-80"
              style={{
                backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
              }}
            >
              <X className="w-5 h-5" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }} />
            </motion.button>
          </div>

          <div className="space-y-5" onKeyPress={handleKeyPress}>
            {/* Service Name */}
            <div>
              <Label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                Service Name
                {isPermanentService && (
                  <span className="ml-2 text-xs" style={{ color: isDarkMode ? '#0891B2' : '#0E7490' }}>
                    (Locked)
                  </span>
                )}
              </Label>
              
              {isPermanentService ? (
                // Display-only field for permanent services
                <div 
                  className="flex items-center gap-2 rounded-lg border-2 p-2 transition-all"
                  style={{
                    backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    color: isDarkMode ? "#13151B" : "#0B2B26",
                  }}
                >
                  <Lock size={16} style={{ color: isDarkMode ? '#6B7280' : '#6B7280' }} />
                  <span className="flex-1">{form.name}</span>
                </div>
              ) : (
                // Editable field for custom services
                <Input
                  className="rounded-lg border-2 transition-all"
                  style={{
                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                    borderColor: errors.name 
                      ? (isDarkMode ? "#F87171" : "#EF4444")
                      : (isDarkMode ? "#2A524C" : "#0B2B26"),
                    color: isDarkMode ? "#13151B" : "#0B2B26",
                  }}
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Express Service, Premium Care"
                />
              )}
              
              {errors.name && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: isDarkMode ? '#F87171' : '#EF4444' }}>
                  <AlertCircle size={12} />
                  {errors.name}
                </p>
              )}
              {!isEditing && !isPermanentService && (
                <p className="text-xs mt-1" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                  Note: Cannot use names containing "Wash", "Dry", or their variations
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                Description
              </Label>
              <Input
                className="rounded-lg border-2 transition-all"
                style={{
                  backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                  borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                  color: isDarkMode ? "#13151B" : "#0B2B26",
                }}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="e.g. Includes detergent and softener"
              />
            </div>

            {/* Price with Peso Sign */}
            <div>
              <Label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                Price
              </Label>
              <div 
                className="flex items-center rounded-lg border-2 transition-all focus-within:ring-2 focus-within:ring-offset-2"
                style={{
                  backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                  borderColor: errors.price 
                    ? (isDarkMode ? "#F87171" : "#EF4444")
                    : (isDarkMode ? "#2A524C" : "#0B2B26"),
                }}
              >
                <span className="px-3" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>₱</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="flex-1 border-none bg-transparent transition-all focus-visible:outline-none focus-visible:ring-0"
                  style={{
                    color: isDarkMode ? "#13151B" : "#0B2B26",
                  }}
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: isDarkMode ? '#F87171' : '#EF4444' }}>
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
                className="rounded-lg px-4 py-2 transition-all flex items-center gap-2"
                style={{
                  backgroundColor: isSubmitting 
                    ? (isDarkMode ? "#6B7280" : "#9CA3AF") 
                    : (isDarkMode ? "#18442AF5" : "#0B2B26"),
                  color: "#F3EDE3",
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