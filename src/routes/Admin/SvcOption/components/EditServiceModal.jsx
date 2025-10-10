import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, X } from "lucide-react";

export default function EditServiceModal({ service, onClose, onSave }) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
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
            <h2 className="text-xl font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
              {service.id ? "Edit Service" : "Add New Service"}
            </h2>
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

          <div className="space-y-5">
            {/* Service Name */}
            <div>
              <Label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                Service Name
              </Label>
              <Input
                className="rounded-lg border-2 transition-all"
                style={{
                  backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                  borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                  color: isDarkMode ? "#13151B" : "#0B2B26",
                }}
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Wash & Fold"
              />
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
                  borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                  focusWithin: {
                    ringColor: '#0891B2',
                    ringOffsetColor: isDarkMode ? '#F3EDE3' : '#FFFFFF'
                  }
                }}
              >
                <span className="px-3" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>₱</span>
                <Input
                  type="number"
                  className="flex-1 border-none bg-transparent transition-all focus-visible:outline-none focus-visible:ring-0"
                  style={{
                    color: isDarkMode ? "#13151B" : "#0B2B26",
                  }}
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="Price"
                />
              </div>
            </div>

            {/* Save Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex justify-end pt-2"
            >
              <Button 
                onClick={handleSubmit}
                className="rounded-lg px-4 py-2 transition-all flex items-center gap-2"
                style={{
                  backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                  color: "#F3EDE3",
                }}
              >
                <Save className="w-4 h-4" />
                {service.id ? "Update Service" : "Save Service"}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}