import React, { useState, useRef, useEffect, useCallback } from "react";
import { WashingMachine, WrenchIcon, X, PlusCircle, Save, Grid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Lottie from "lottie-react";
import washingAnimation from "@/assets/lottie/washing-machine.json";
import dryerAnimation from "@/assets/lottie/dryer-machine.json";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { api } from "@/lib/api-config";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Initialize cache properly
const initializeCache = () => {
  try {
    const stored = localStorage.getItem('machinesCache');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        console.log("📦 Initializing machines from stored cache");
        return parsed;
      } else {
        console.log("🗑️ Stored machines cache expired");
      }
    }
  } catch (error) {
    console.warn('Failed to load machines cache from storage:', error);
  }
  return null;
};

// Global cache instances
let machinesCache = initializeCache();
let cacheTimestamp = machinesCache?.timestamp || null;

// Save cache to localStorage for persistence
const saveCacheToStorage = (data) => {
  try {
    localStorage.setItem('machinesCache', JSON.stringify({
      data: data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to save machines cache to storage:', error);
  }
};

const initialForm = {
  name: "",
  type: "",
  capacityKg: "",
  status: "Available",
};

function MachineModal({ open, onOpenChange, form, onFormChange, onSubmit, isEdit }) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const handleChange = (field, value) => {
    onFormChange((prev) => ({ ...prev, [field]: value }));
  };

  const statusColorMap = {
    Available: isDarkMode ? "text-green-400" : "text-green-600",
    "In Use": isDarkMode ? "text-yellow-400" : "text-yellow-600",
    Maintenance: isDarkMode ? "text-red-400" : "text-red-600",
  };

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

  if (!open) return null;

  return (
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
            onClick={() => onOpenChange(false)}
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
  );
}

function MachineCard({ machine, animationData, onEdit, onDelete }) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  const lottieRef = useRef();

  useEffect(() => {
    if (lottieRef.current) {
      if (machine.status === "In Use") {
        lottieRef.current.play();
      } else {
        lottieRef.current.stop();
      }
    }
  }, [machine.status]);

  const statusColor = {
    Available: isDarkMode ? "text-green-400" : "text-green-600",
    "In Use": isDarkMode ? "text-yellow-400" : "text-yellow-600",
    Maintenance: isDarkMode ? "text-red-400" : "text-red-600",
  };

  return (
    <motion.div
      whileHover={{ 
        scale: 1.03,
        y: -2,
        transition: { duration: 0.2 }
      }}
      onClick={() => onEdit(machine)}
      className="relative flex h-[200px] cursor-pointer flex-col items-center justify-between rounded-xl border-2 p-4 shadow-sm transition-all hover:shadow-md"
      style={{
        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
        borderColor: isDarkMode ? "#334155" : "#0B2B26",
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(machine.id);
        }}
        className="absolute right-2 top-2 rounded-full p-1 transition-colors hover:bg-red-100"
        style={{ 
          color: isDarkMode ? "#f1f5f9" : "#0B2B26",
          backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "transparent"
        }}
        title="Delete machine"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative h-[80px] w-[80px]">
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop
          className={`h-full w-full ${machine.status === "Maintenance" ? "opacity-40" : ""}`}
        />
        {machine.status === "Maintenance" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <WrenchIcon className="h-6 w-6" style={{ color: isDarkMode ? "#F87171" : "#DC2626" }} />
          </div>
        )}
      </div>

      <div className="space-y-1 text-center">
        <div className="font-semibold text-sm" style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}>
          {machine.name}
        </div>
        <div className="text-xs" style={{ color: isDarkMode ? "#cbd5e1" : "#0B2B26" }}>
          {machine.capacityKg} kg
        </div>
        <div className={`text-xs italic ${statusColor[machine.status]}`}>
          {machine.status}
        </div>
      </div>
    </motion.div>
  );
}

// List Item Component for List View
function MachineListItem({ machine, animationData, onEdit, onDelete }) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  const lottieRef = useRef();

  useEffect(() => {
    if (lottieRef.current) {
      if (machine.status === "In Use") {
        lottieRef.current.play();
      } else {
        lottieRef.current.stop();
      }
    }
  }, [machine.status]);

  const statusColor = {
    Available: isDarkMode ? "text-green-400" : "text-green-600",
    "In Use": isDarkMode ? "text-yellow-400" : "text-yellow-600",
    Maintenance: isDarkMode ? "text-red-400" : "text-red-600",
  };

  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      onClick={() => onEdit(machine)}
      className="flex items-center justify-between rounded-xl border-2 p-4 transition-all hover:shadow-md cursor-pointer"
      style={{
        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
        borderColor: isDarkMode ? "#334155" : "#0B2B26",
      }}
    >
      <div className="flex items-center gap-4">
        <div className="relative h-12 w-12">
          <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            loop={machine.status === "In Use"}
            className={`h-full w-full ${machine.status === "Maintenance" ? "opacity-40" : ""}`}
          />
          {machine.status === "Maintenance" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <WrenchIcon className="h-4 w-4" style={{ color: isDarkMode ? "#F87171" : "#DC2626" }} />
            </div>
          )}
        </div>
        <div>
          <div className="font-semibold" style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}>
            {machine.name}
          </div>
          <div className="text-sm" style={{ color: isDarkMode ? "#cbd5e1" : "#0B2B26" }}>
            {machine.capacityKg} kg • <span className={`italic ${statusColor[machine.status]}`}>{machine.status}</span>
          </div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(machine.id);
        }}
        className="rounded-full p-2 transition-colors hover:bg-red-100"
        style={{ 
          color: isDarkMode ? "#f1f5f9" : "#0B2B26",
          backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "transparent"
        }}
        title="Delete machine"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ open, onOpenChange, onConfirm, machineId }) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-sm w-full rounded-xl border-2 p-6 shadow-xl"
        style={{
          backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
          borderColor: isDarkMode ? "#334155" : "#0B2B26",
        }}
      >
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <X className="h-6 w-6 text-red-600" />
          </div>
          
          <h3 
            className="mb-2 text-lg font-semibold"
            style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}
          >
            Delete Machine
          </h3>
          <p 
            className="mb-6 text-sm"
            style={{ color: isDarkMode ? "#cbd5e1" : "#0B2B26" }}
          >
            Are you sure you want to delete this machine? This action cannot be undone.
          </p>
          
          <div className="flex justify-center gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-4 py-2 transition-colors border-2"
              style={{
                borderColor: isDarkMode ? "#334155" : "#0B2B26",
                color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                backgroundColor: 'transparent',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(machineId)}
              className="rounded-lg px-4 py-2 transition-colors"
              style={{
                backgroundColor: "#DC2626",
                color: "#FFFFFF",
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function MachineMainPage() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  const [form, setForm] = useState(initialForm);
  const [machines, setMachines] = useState(() => {
    if (machinesCache && machinesCache.data) {
      console.log("🎯 Initializing machines state with cached data");
      return machinesCache.data;
    }
    return [];
  });
  const [loading, setLoading] = useState(!machinesCache);
  const [initialLoad, setInitialLoad] = useState(!machinesCache);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState(null);
  
  // Load view mode from localStorage or default to 'grid'
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('machineViewMode') || 'grid';
    }
    return 'grid';
  });
  
  const { toast } = useToast();

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('machineViewMode', viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
  }, [modalOpen]);

  // Function to check if data has actually changed
  const hasDataChanged = (newData, oldData) => {
    if (!oldData) return true;
    return JSON.stringify(newData) !== JSON.stringify(oldData);
  };

  const fetchMachines = useCallback(async (forceRefresh = false) => {
    try {
      const now = Date.now();
      
      // Check cache first unless forced refresh
      if (!forceRefresh && machinesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log("📦 Using cached machines data");
        
        // Always update with cached data to ensure UI is populated
        setMachines(machinesCache.data);
        setLoading(false);
        setInitialLoad(false);
        return;
      }

      await fetchFreshMachines();
    } catch (err) {
      console.error("❌ Error fetching machines:", err.message);
      
      // On error, keep cached data if available
      if (machinesCache) {
        console.log("⚠️ Fetch failed, falling back to cached machines data");
        setMachines(machinesCache.data);
        setError("Failed to refresh machines. Showing cached data.");
      } else {
        setError("Failed to load machines. Make sure you're logged in.");
      }
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  // Separate function for actual API call using the api utility
  const fetchFreshMachines = async () => {
    console.log("🔄 Fetching fresh machines data");
    setLoading(true);

    try {
      // Use the api utility instead of direct fetch
      const data = await api.get("api/machines");
      const newMachines = data || [];
      
      const currentTime = Date.now();

      // Only update state and cache if data has actually changed
      if (!machinesCache || hasDataChanged(newMachines, machinesCache.data)) {
        console.log("🔄 Machines data updated with fresh data");
        
        // Update cache
        machinesCache = {
          data: newMachines,
          timestamp: currentTime
        };
        cacheTimestamp = currentTime;
        
        // Persist to localStorage
        saveCacheToStorage(newMachines);
        
        setMachines(newMachines);
        setError(null);
      } else {
        console.log("✅ No changes in machines data, updating timestamp only");
        // Just update the timestamp to extend cache life
        cacheTimestamp = currentTime;
        machinesCache.timestamp = currentTime;
        saveCacheToStorage(machinesCache.data);
      }

      setLoading(false);
      setInitialLoad(false);
    } catch (error) {
      console.error("❌ Error in fetchFreshMachines:", error);
      setLoading(false);
      setInitialLoad(false);
      throw error;
    }
  };

  useEffect(() => {
    // Always show cached data immediately if available
    if (machinesCache) {
      console.log("🚀 Showing cached machines data immediately");
      setMachines(machinesCache.data);
      setLoading(false);
      setInitialLoad(false);
    }
    
    // Then fetch fresh data
    fetchMachines();
  }, [fetchMachines]);

  const handleSubmit = async () => {
    if (!form.name || !form.type || !form.capacityKg) {
      toast({
        title: "Missing required fields",
        description: "Please fill in name, type, and capacity.",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(form.capacityKg) <= 0) {
      toast({
        title: "Invalid capacity",
        description: "Capacity must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    try {
      let saved;
      if (form.id) {
        // Use the api utility for PUT request
        saved = await api.put(`api/machines/${form.id}`, {
          ...form,
          capacityKg: parseFloat(form.capacityKg),
        });
      } else {
        // Use the api utility for POST request
        saved = await api.post("api/machines", {
          ...form,
          capacityKg: parseFloat(form.capacityKg),
        });
      }

      // Update local state and cache
      const updatedMachines = form.id 
        ? machines.map(m => m.id === saved.id ? saved : m)
        : [...machines, saved];
      
      setMachines(updatedMachines);
      
      // Update cache
      machinesCache = {
        data: updatedMachines,
        timestamp: Date.now()
      };
      cacheTimestamp = Date.now();
      saveCacheToStorage(updatedMachines);

      toast({
        title: form.id ? "Machine updated" : "Machine added",
        description: "Your machine has been saved successfully.",
      });

      setForm(initialForm);
      setSelectedMachine(null);
      setModalOpen(false);
    } catch (error) {
      console.error("❌ Error saving machine:", error);
      setError("Failed to save machine.");
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddMachine = () => {
    setForm(initialForm);
    setSelectedMachine(null);
    setModalOpen(true);
  };

  const handleEdit = (machine) => {
    setSelectedMachine(machine);
    setForm({
      id: machine.id,
      name: machine.name,
      type: machine.type,
      capacityKg: machine.capacityKg.toString(),
      status: machine.status,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      // Use the api utility for DELETE request
      await api.delete(`api/machines/${id}`);

      // Update local state and cache
      const updatedMachines = machines.filter(m => m.id !== id);
      setMachines(updatedMachines);
      
      // Update cache
      machinesCache = {
        data: updatedMachines,
        timestamp: Date.now()
      };
      cacheTimestamp = Date.now();
      saveCacheToStorage(updatedMachines);
      
      setConfirmDeleteId(null);

      toast({
        title: "Machine deleted",
        description: "The machine has been removed successfully.",
      });
    } catch (error) {
      console.error("❌ Error deleting machine:", error);
      setError("Failed to delete machine.");
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const washers = machines.filter((m) => m.type === "Washer");
  const dryers = machines.filter((m) => m.type === "Dryer");

  const SkeletonCard = () => (
    <div
      className="h-[200px] animate-pulse rounded-xl"
      style={{ backgroundColor: isDarkMode ? "#334155" : "#f1f5f9" }}
    />
  );

  const SkeletonListItem = () => (
    <div className="h-16 animate-pulse rounded-xl" 
         style={{ backgroundColor: isDarkMode ? "#334155" : "#f1f5f9" }} />
  );

  // Show skeleton loader only during initial load AND when no cached data is available
  if (initialLoad && !machinesCache) {
    return (
      <div className="space-y-6 px-6 pb-5 pt-4 overflow-visible" style={{
        backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
      }}>
        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg animate-pulse"
                 style={{
                   backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                 }}></div>
            <div className="space-y-2">
              <div className="h-6 w-44 rounded-lg animate-pulse"
                   style={{
                     backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                   }}></div>
              <div className="h-4 w-56 rounded animate-pulse"
                   style={{
                     backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                   }}></div>
            </div>
          </div>
          <div className="h-10 w-40 rounded-lg animate-pulse"
               style={{
                 backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
               }}></div>
        </motion.div>

        {/* Content Skeleton */}
        <div className="space-y-8">
          {[...Array(2)].map((_, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <div className="h-6 w-32 rounded animate-pulse"
                   style={{
                     backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                   }}></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 pb-5 pt-4 overflow-visible" style={{
      backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
    }}>
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg p-2"
            style={{
              backgroundColor: isDarkMode ? "#1e293b" : "#0f172a",
              color: "#f1f5f9",
            }}
          >
            <WashingMachine size={22} />
          </motion.div>
          <div>
            <p className="text-xl font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
              Laundry Machines
            </p>
            <p className="text-sm" style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}>
              Manage and monitor your washing machines and dryers
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border-2 p-1" style={{ 
            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
            backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
          }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-2 transition-colors ${
                viewMode === 'grid' 
                  ? isDarkMode ? "bg-[#0f172a] text-white" : "bg-[#0B2B26] text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md p-2 transition-colors ${
                viewMode === 'list' 
                  ? isDarkMode ? "bg-[#0f172a] text-white" : "bg-[#0B2B26] text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              onClick={handleAddMachine}
              className="flex items-center gap-2 text-sm font-medium transition-all duration-200 focus:outline-none rounded-lg px-4 py-2"
              style={{
                backgroundColor: isDarkMode ? "#1e293b" : "#0f172a",
                color: "#f1f5f9",
              }}
            >
              <PlusCircle className="w-4 h-4" />
              Add Machine
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border-2 p-4 transition-all"
          style={{
            backgroundColor: isDarkMode ? "rgba(254, 226, 226, 0.1)" : "#FEF2F2",
            borderColor: isDarkMode ? "#F87171" : "#EF4444",
          }}
        >
          <p className="text-sm font-medium" style={{ color: isDarkMode ? "#F87171" : "#DC2626" }}>
            {error}
          </p>
        </motion.div>
      )}

      {/* Combined Machines Grid View */}
      {viewMode === 'grid' && (
        <div className="space-y-8">
          {/* Washers Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <h3 className="text-lg font-semibold text-blue-500 dark:text-blue-400">
                  Washers
                </h3>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                  {washers.length} machine{washers.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : washers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {washers.map((machine) => (
                  <MachineCard
                    key={machine.id}
                    machine={machine}
                    animationData={washingAnimation}
                    onEdit={handleEdit}
                    onDelete={(id) => setConfirmDeleteId(id)}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-32 items-center justify-center rounded-xl border-2"
                style={{
                  borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                  backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                }}
              >
                <p className="text-muted-foreground">No washers added yet.</p>
              </motion.div>
            )}
          </motion.div>

          {/* Dryers Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <h3 className="text-lg font-semibold text-orange-500 dark:text-orange-400">
                  Dryers
                </h3>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                  {dryers.length} machine{dryers.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : dryers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {dryers.map((machine) => (
                  <MachineCard
                    key={machine.id}
                    machine={machine}
                    animationData={dryerAnimation}
                    onEdit={handleEdit}
                    onDelete={(id) => setConfirmDeleteId(id)}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-32 items-center justify-center rounded-xl border-2"
                style={{
                  borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                  backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                }}
              >
                <p className="text-muted-foreground">No dryers added yet.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Washers List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <h3 className="text-lg font-semibold text-blue-500 dark:text-blue-400">
                Washers ({washers.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <SkeletonListItem key={i} />
                ))}
              </div>
            ) : washers.length > 0 ? (
              <div className="space-y-2">
                {washers.map((machine) => (
                  <MachineListItem
                    key={machine.id}
                    machine={machine}
                    animationData={washingAnimation}
                    onEdit={handleEdit}
                    onDelete={(id) => setConfirmDeleteId(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-20 items-center justify-center rounded-xl border-2"
                   style={{
                     borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                     backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                   }}>
                <p className="text-muted-foreground">No washers added yet.</p>
              </div>
            )}
          </motion.div>

          {/* Dryers List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <h3 className="text-lg font-semibold text-orange-500 dark:text-orange-400">
                Dryers ({dryers.length})
              </h3>
            </div>
            
            {dryers.length > 0 ? (
              <div className="space-y-2">
                {dryers.map((machine) => (
                  <MachineListItem
                    key={machine.id}
                    machine={machine}
                    animationData={dryerAnimation}
                    onEdit={handleEdit}
                    onDelete={(id) => setConfirmDeleteId(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-20 items-center justify-center rounded-xl border-2"
                   style={{
                     borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                     backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                   }}>
                <p className="text-muted-foreground">No dryers added yet.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Unified Machine Modal */}
      <MachineModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        form={form}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        isEdit={!!form.id}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={!!confirmDeleteId}
        onOpenChange={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        machineId={confirmDeleteId}
      />
    </div>
  );
}