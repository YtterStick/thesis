import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PlusCircle, Save, X } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

export default function AddMachineModal({ open, setOpen, form, setForm, onSubmit }) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const statusColorMap = {
    Available: isDarkMode ? "text-green-400" : "text-green-600",
    "In Use": isDarkMode ? "text-yellow-400" : "text-yellow-600",
    Maintenance: isDarkMode ? "text-red-400" : "text-red-600",
  };

  const isEdit = form.name || form.type || form.capacityKg;

  const inputClass = `rounded-lg border-2 transition-all ${
    isDarkMode 
      ? "bg-[#1e293b] border-[#334155] text-[#f1f5f9] placeholder-[#94a3b8]" 
      : "bg-white border-[#0B2B26] text-[#0B2B26] placeholder-gray-500"
  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2B26] focus-visible:ring-offset-2`;

  const selectTriggerClass = `rounded-lg border-2 transition-all ${
    isDarkMode 
      ? "bg-[#1e293b] border-[#334155] text-[#f1f5f9]" 
      : "bg-white border-[#0B2B26] text-[#0B2B26]"
  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2B26] focus-visible:ring-offset-2`;

  const buttonClass = `rounded-lg px-4 py-2 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2B26] focus-visible:ring-offset-2 ${
    isDarkMode 
      ? "bg-[#0f172a] hover:bg-[#1e293b] text-white" 
      : "bg-[#0B2B26] hover:bg-[#18442A] text-white"
  }`;

  // Fix: Handle modal close properly
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      {!isEdit && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm font-medium transition-colors focus:outline-none rounded-lg px-4 py-2"
          style={{
            backgroundColor: isDarkMode ? "#1e293b" : "#0f172a",
            color: "#f1f5f9",
          }}
        >
          <PlusCircle className="w-4 h-4" />
          Add Machine
        </motion.button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg w-full rounded-xl border-2 p-6 shadow-xl"
            style={{
              backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
              borderColor: isDarkMode ? "#334155" : "#0B2B26",
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}>
                {isEdit ? "Edit Machine" : "Add New Machine"}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="rounded-lg p-1 transition-colors hover:opacity-80"
                style={{
                  backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                }}
              >
                <X className="h-4 w-4" style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }} />
              </motion.button>
            </div>

            <div className="space-y-4">
              {/* Machine Type */}
              <div>
                <Label className="text-sm font-medium" style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}>
                  Machine Type
                </Label>
                <Select value={form.type} onValueChange={(val) => handleChange("type", val)}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className={`rounded-lg border-2 ${
                    isDarkMode 
                      ? "bg-[#1e293b] border-[#334155] text-[#f1f5f9]" 
                      : "bg-white border-[#0B2B26] text-[#0B2B26]"
                  }`}>
                    <SelectItem value="Washer">Washer</SelectItem>
                    <SelectItem value="Dryer">Dryer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Machine Name */}
              <div>
                <Label className="text-sm font-medium" style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}>
                  Machine Name
                </Label>
                <Input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Washer #3"
                />
              </div>

              {/* Capacity */}
              <div>
                <Label className="text-sm font-medium" style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}>
                  Capacity (kg)
                </Label>
                <Input
                  type="number"
                  className={inputClass}
                  value={form.capacityKg}
                  onChange={(e) => handleChange("capacityKg", e.target.value)}
                  placeholder="e.g. 7.5"
                />
              </div>

              {/* Status */}
              <div>
                <Label className="text-sm font-medium" style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}>
                  Status
                </Label>
                <Select value={form.status} onValueChange={(val) => handleChange("status", val)}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className={`rounded-lg border-2 ${
                    isDarkMode 
                      ? "bg-[#1e293b] border-[#334155] text-[#f1f5f9]" 
                      : "bg-white border-[#0B2B26] text-[#0B2B26]"
                  }`}>
                    <SelectItem value="Available" className={statusColorMap["Available"]}>
                      Available
                    </SelectItem>
                    <SelectItem value="In Use" className={statusColorMap["In Use"]}>
                      In Use
                    </SelectItem>
                    <SelectItem value="Maintenance" className={statusColorMap["Maintenance"]}>
                      Maintenance
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button onClick={onSubmit} className={buttonClass}>
                    <Save className="w-4 h-4" />
                    {isEdit ? "Update Machine" : "Save Machine"}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}