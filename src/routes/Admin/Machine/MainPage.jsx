import React, { useState, useRef, useEffect } from "react";
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

const initialForm = {
  name: "",
  type: "",
  capacityKg: "",
  status: "Available",
};

const ALLOWED_SKEW_MS = 5000;

const isTokenExpired = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp * 1000;
    const now = Date.now();
    return exp + ALLOWED_SKEW_MS < now;
  } catch (err) {
    console.warn("❌ Failed to decode token:", err);
    return true;
  }
};

const secureFetch = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem("authToken");

  if (!token || isTokenExpired(token)) {
    window.location.href = "/login";
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`http://localhost:8080/api${endpoint}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} - ${errorText}`);
  }

  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (err) {
      console.warn("Expected JSON but failed to parse:", err);
      return null;
    }
  }

  return null;
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
      ? "bg-[#F3EDE3] border-[#2A524C] text-[#13151B] placeholder-[#6B7280]" 
      : "bg-white border-[#0B2B26] text-[#0B2B26] placeholder-gray-500"
  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2B26] focus-visible:ring-offset-2`;

  const selectTriggerClass = `rounded-lg border-2 transition-all ${
    isDarkMode 
      ? "bg-[#F3EDE3] border-[#2A524C] text-[#13151B]" 
      : "bg-white border-[#0B2B26] text-[#0B2B26]"
  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2B26] focus-visible:ring-offset-2`;

  const buttonClass = `rounded-lg px-4 py-2 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2B26] focus-visible:ring-offset-2 ${
    isDarkMode 
      ? "bg-[#18442AF5] hover:bg-[#1E524A] text-white" 
      : "bg-[#0B2B26] hover:bg-[#18442A] text-white"
  }`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full rounded-xl border-2 p-6 shadow-xl"
        style={{
          backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
          borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
          color: isDarkMode ? "#13151B" : "#0B2B26",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isEdit ? "Edit Machine" : "Add New Machine"}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1 transition-colors hover:opacity-80"
            style={{
              backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
            }}
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>

        <div className="space-y-4">
          {/* Machine Type */}
          <div>
            <Label className="text-sm font-medium" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
              Machine Type
            </Label>
            <Select value={form.type} onValueChange={(val) => handleChange("type", val)}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className={`rounded-lg border-2 ${
                isDarkMode 
                  ? "bg-[#F3EDE3] border-[#2A524C] text-[#13151B]" 
                  : "bg-white border-[#0B2B26] text-[#0B2B26]"
              }`}>
                <SelectItem value="Washer">Washer</SelectItem>
                <SelectItem value="Dryer">Dryer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Machine Name */}
          <div>
            <Label className="text-sm font-medium" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
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
            <Label className="text-sm font-medium" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
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
            <Label className="text-sm font-medium" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
              Status
            </Label>
            <Select value={form.status} onValueChange={(val) => handleChange("status", val)}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className={`rounded-lg border-2 ${
                isDarkMode 
                  ? "bg-[#F3EDE3] border-[#2A524C] text-[#13151B]" 
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
    <div
      onClick={() => onEdit(machine)}
      className="relative flex h-[200px] cursor-pointer flex-col items-center justify-between rounded-lg border-2 p-4 shadow-sm transition-all hover:scale-105 hover:shadow-md"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(machine.id);
        }}
        className="absolute right-2 top-2 rounded-full p-1 transition-colors hover:bg-red-100"
        style={{ 
          color: isDarkMode ? "#13151B" : "#0B2B26",
          backgroundColor: isDarkMode ? "rgba(255,255,255,0.9)" : "transparent"
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
            <WrenchIcon className="h-6 w-6" style={{ color: isDarkMode ? "#EF4444" : "#DC2626" }} />
          </div>
        )}
      </div>

      <div className="space-y-1 text-center">
        <div className="font-semibold text-sm" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
          {machine.name}
        </div>
        <div className="text-xs" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
          {machine.capacityKg} kg
        </div>
        <div className={`text-xs italic ${statusColor[machine.status]}`}>
          {machine.status}
        </div>
      </div>
    </div>
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
    <div
      onClick={() => onEdit(machine)}
      className="flex items-center justify-between rounded-lg border-2 p-4 transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
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
              <WrenchIcon className="h-4 w-4" style={{ color: isDarkMode ? "#EF4444" : "#DC2626" }} />
            </div>
          )}
        </div>
        <div>
          <div className="font-semibold" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
            {machine.name}
          </div>
          <div className="text-sm" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
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
          color: isDarkMode ? "#13151B" : "#0B2B26",
        }}
        title="Delete machine"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ open, onOpenChange, onConfirm, machineId }) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-sm w-full rounded-xl border-2 p-6 shadow-xl"
        style={{
          backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
          borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
        }}
      >
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <X className="h-6 w-6 text-red-600" />
          </div>
          
          <h3 
            className="mb-2 text-lg font-semibold"
            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
          >
            Delete Machine
          </h3>
          <p 
            className="mb-6 text-sm"
            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
          >
            Are you sure you want to delete this machine? This action cannot be undone.
          </p>
          
          <div className="flex justify-center gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-4 py-2 transition-colors border-2"
              style={{
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                color: isDarkMode ? "#13151B" : "#0B2B26",
                backgroundColor: 'transparent',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(machineId)}
              className="rounded-lg px-4 py-2 transition-colors"
              style={{
                backgroundColor: isDarkMode ? "#DC2626" : "#DC2626",
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
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const data = await secureFetch("/machines");
        setMachines(data);
      } catch (err) {
        setError("Failed to load machines. Make sure you're logged in.");
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

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

    const method = form.id ? "PUT" : "POST";
    const endpoint = form.id ? `/machines/${form.id}` : "/machines";

    try {
      await secureFetch(endpoint, method, {
        ...form,
        capacityKg: parseFloat(form.capacityKg),
      });

      const updatedMachines = await secureFetch("/machines");
      setMachines(updatedMachines);

      toast({
        title: form.id ? "Machine updated" : "Machine added",
        description: "Your machine has been saved successfully.",
      });

      setForm(initialForm);
      setSelectedMachine(null);
      setModalOpen(false);
    } catch (error) {
      setError("Failed to save machine.");
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
      await secureFetch(`/machines/${id}`, "DELETE");

      const updatedMachines = await secureFetch("/machines");
      setMachines(updatedMachines);
      setConfirmDeleteId(null);

      toast({
        title: "Machine deleted",
        description: "The machine has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting machine:", error);
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
      className="h-[200px] animate-pulse rounded-lg"
      style={{ backgroundColor: isDarkMode ? "#F3EDE3" : "#E0EAE8" }}
    />
  );

  const SkeletonListItem = () => (
    <div className="h-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
  );

  return (
    <div className="min-h-screen px-6 pb-6 pt-4 text-slate-900 dark:text-white">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg p-2"
            style={{
              backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
              color: "#F3EDE3",
            }}
          >
            <WashingMachine size={22} />
          </motion.div>
          <div>
            <p className="text-xl font-bold">Laundry Machines</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage and monitor your washing machines and dryers
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border-2 p-1" style={{ borderColor: isDarkMode ? "#2A524C" : "#0B2B26" }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-2 transition-colors ${
                viewMode === 'grid' 
                  ? isDarkMode ? "bg-[#18442AF5] text-white" : "bg-[#0B2B26] text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md p-2 transition-colors ${
                viewMode === 'list' 
                  ? isDarkMode ? "bg-[#18442AF5] text-white" : "bg-[#0B2B26] text-white"
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
                backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                color: "#F3EDE3",
              }}
            >
              <PlusCircle className="w-4 h-4" />
              Add Machine
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {error && <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>}

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
                className="flex h-32 items-center justify-center rounded-lg border-2 border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800"
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
                className="flex h-32 items-center justify-center rounded-lg border-2 border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800"
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
              <div className="flex h-20 items-center justify-center rounded-lg border-2 border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800">
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
              <div className="flex h-20 items-center justify-center rounded-lg border-2 border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800">
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