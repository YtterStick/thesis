import React, { useState, useRef, useEffect } from "react";
import { WashingMachine, WrenchIcon, X, Bell, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddMachineModal from "./AddMachineModal";
import { Button } from "@/components/ui/button";
import Lottie from "lottie-react";
import washingAnimation from "@/assets/lottie/washing-machine.json";
import dryerAnimation from "@/assets/lottie/dryer-machine.json";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const initialForm = {
  name: "",
  type: "",
  capacityKg: "",
  status: "Available",
};

const ALLOWED_SKEW_MS = 5000;

// Smart Rotation Plan Configuration
const MAINTENANCE_INTERVAL_DAYS = 3;
const REPEAT_AFTER_DAYS = 60;

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

// Calculate maintenance schedule based on rotation plan
const calculateMaintenanceSchedule = (machines) => {
  const now = new Date();
  const washers = machines.filter(m => m.type === "Washer").sort((a, b) => a.name.localeCompare(b.name));
  const dryers = machines.filter(m => m.type === "Dryer").sort((a, b) => a.name.localeCompare(b.name));
  
  let enhancedMachines = [...machines];
  
  // Calculate washer maintenance schedule
  washers.forEach((washer, index) => {
    const maintenanceStartDate = new Date(now);
    maintenanceStartDate.setDate(maintenanceStartDate.getDate() + (index * MAINTENANCE_INTERVAL_DAYS));
    
    const nextMaintenanceDate = new Date(maintenanceStartDate);
    nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + REPEAT_AFTER_DAYS);
    
    enhancedMachines = enhancedMachines.map(m => 
      m.id === washer.id 
        ? { 
            ...m, 
            lastMaintenance: m.lastMaintenance || maintenanceStartDate.toISOString(),
            nextMaintenance: m.nextMaintenance || nextMaintenanceDate.toISOString(),
            needsMaintenance: new Date(m.nextMaintenance || nextMaintenanceDate.toISOString()) <= now
          }
        : m
    );
  });
  
  // Calculate dryer maintenance schedule (offset from washers)
  dryers.forEach((dryer, index) => {
    const maintenanceStartDate = new Date(now);
    maintenanceStartDate.setDate(maintenanceStartDate.getDate() + (index * MAINTENANCE_INTERVAL_DAYS) + 1); // +1 day offset from washers
    
    const nextMaintenanceDate = new Date(maintenanceStartDate);
    nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + REPEAT_AFTER_DAYS);
    
    enhancedMachines = enhancedMachines.map(m => 
      m.id === dryer.id 
        ? { 
            ...m, 
            lastMaintenance: m.lastMaintenance || maintenanceStartDate.toISOString(),
            nextMaintenance: m.nextMaintenance || nextMaintenanceDate.toISOString(),
            needsMaintenance: new Date(m.nextMaintenance || nextMaintenanceDate.toISOString()) <= now
          }
        : m
    );
  });
  
  return enhancedMachines;
};

// ✅ Inline MachineCard component
function MachineCard({ machine, animationData, onEdit, onDelete, onMaintenance }) {
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
    Available: "text-green-600 dark:text-green-400",
    "In Use": "text-yellow-500 dark:text-yellow-400",
    Maintenance: "text-red-500 dark:text-red-400",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={() => onEdit(machine)}
          className="scroll-snap-align-start relative flex h-[240px] w-[200px] shrink-0 cursor-pointer flex-col items-center justify-between rounded-md bg-slate-100 p-4 shadow-md transition-transform hover:scale-105 dark:bg-slate-800"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(machine.id);
            }}
            className="absolute right-2 top-2 rounded-full p-1 text-slate-400 transition-colors hover:text-red-600"
            title="Delete machine"
          >
            <X className="h-4 w-4" />
          </button>

          {machine.needsMaintenance && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMaintenance(machine);
              }}
              className="absolute left-2 top-2 rounded-full p-1 bg-yellow-100 text-yellow-600 transition-colors hover:bg-yellow-200"
              title="Maintenance reminder"
            >
              <Bell className="h-4 w-4" />
            </button>
          )}

          <div className="relative h-[120px] w-[120px]">
            <Lottie
              lottieRef={lottieRef}
              animationData={animationData}
              loop
              className={`h-full w-full ${machine.status === "Maintenance" ? "opacity-40" : ""}`}
            />
            {machine.status === "Maintenance" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <WrenchIcon className="h-8 w-8 text-red-500" />
              </div>
            )}
          </div>

          <div className="space-y-2 text-center text-sm text-slate-700 dark:text-slate-300">
            <div className="font-semibold">{machine.name}</div>
            <div>{machine.capacityKg} kg</div>
            <div className={`text-xs italic ${statusColor[machine.status]}`}>{machine.status}</div>
            {machine.needsMaintenance && (
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                ⚠️ Needs Maintenance
              </div>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        <div>
          {machine.type === "Washer" ? "🧺" : "🔥"} Type: {machine.type}
        </div>
        <div>⚖️ Capacity: {machine.capacityKg} kg</div>
        <div className={`italic ${statusColor[machine.status]}`}>📌 Status: {machine.status}</div>
        {machine.lastMaintenance && (
          <div>🔧 Last Maintenance: {new Date(machine.lastMaintenance).toLocaleDateString()}</div>
        )}
        {machine.nextMaintenance && (
          <div>📅 Next Maintenance: {new Date(machine.nextMaintenance).toLocaleDateString()}</div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export default function MachineMainPage() {
  const [form, setForm] = useState(initialForm);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const [maintenanceReminder, setMaintenanceReminder] = useState(null);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const { toast } = useToast();

  const washerRef = useRef(null);
  const dryerRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  useEffect(() => {
    const handleWheel = (e, ref) => {
      if (ref.current && ref.current.contains(e.target)) {
        e.preventDefault();
        ref.current.scrollLeft += e.deltaY;
      }
    };

    const onWheel = (e) => {
      handleWheel(e, washerRef);
      handleWheel(e, dryerRef);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  // Check for maintenance reminders
  useEffect(() => {
    const checkMaintenanceReminders = () => {
      const now = new Date();
      const machinesNeedingMaintenance = machines.filter(machine => {
        if (!machine.nextMaintenance) return false;
        return new Date(machine.nextMaintenance) <= now;
      });

      if (machinesNeedingMaintenance.length > 0 && !showMaintenanceDialog) {
        setMaintenanceReminder(machinesNeedingMaintenance[0]);
        setShowMaintenanceDialog(true);
      }
    };

    // Check every hour for maintenance reminders
    const interval = setInterval(checkMaintenanceReminders, 60 * 60 * 1000);
    checkMaintenanceReminders(); // Check immediately on load

    return () => clearInterval(interval);
  }, [machines, showMaintenanceDialog]);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const data = await secureFetch("/machines");
        
        // Calculate maintenance schedule based on rotation plan
        const enhancedData = calculateMaintenanceSchedule(data);
        
        setMachines(enhancedData);
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
      const saved = await secureFetch(endpoint, method, {
        ...form,
        capacityKg: parseFloat(form.capacityKg),
      });

      // After saving, recalculate maintenance schedule for all machines
      const updatedMachines = await secureFetch("/machines");
      const enhancedData = calculateMaintenanceSchedule(updatedMachines);
      
      setMachines(enhancedData);

      toast({
        title: form.id ? "Machine updated" : "Machine added",
         description: "Please fill in name, type, and capacity.",
      });

      setForm(initialForm);
      setSelectedMachine(null);
      setOpen(false);
    } catch (error) {
      setError("Failed to save machine.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await secureFetch(`/machines/${id}`, "DELETE");
      
      // After deletion, recalculate maintenance schedule
      const updatedMachines = await secureFetch("/machines");
      const enhancedData = calculateMaintenanceSchedule(updatedMachines);
      
      setMachines(enhancedData);
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

  const handleMaintenance = async (machine) => {
    try {
      // Update the machine's maintenance status
      const now = new Date();
      const updatedMachine = {
        ...machine,
        lastMaintenance: now.toISOString(),
        status: "Maintenance"
      };
      
      const saved = await secureFetch(`/machines/${machine.id}`, "PUT", updatedMachine);
      
      // Calculate next maintenance date (60 days from now)
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + REPEAT_AFTER_DAYS);
      saved.nextMaintenance = nextDate.toISOString();
      saved.needsMaintenance = false;
      
      // Update the machine in the list
      setMachines((prev) => prev.map((m) => (m.id === saved.id ? saved : m)));
      
      toast({
        title: "Maintenance started",
        description: `${saved.name} is now under maintenance.`,
      });
      
      setShowMaintenanceDialog(false);
    } catch (error) {
      setError("Failed to update maintenance status.");
    }
  };

  const postponeMaintenance = () => {
    if (!maintenanceReminder) return;
    
    // Set reminder for 3 days later
    const nextReminderDate = new Date();
    nextReminderDate.setDate(nextReminderDate.getDate() + MAINTENANCE_INTERVAL_DAYS);
    
    setMachines((prev) => 
      prev.map((m) => 
        m.id === maintenanceReminder.id 
          ? { ...m, nextMaintenance: nextReminderDate.toISOString(), needsMaintenance: false }
          : m
      )
    );
    
    setShowMaintenanceDialog(false);
    
    toast({
      title: "Maintenance postponed",
      description: `Reminder set for ${nextReminderDate.toLocaleDateString()}.`,
    });
  };

  const washers = machines.filter((m) => m.type === "Washer");
  const dryers = machines.filter((m) => m.type === "Dryer");

  return (
    <div className="space-y-6 overflow-visible px-6 pb-6 pt-4 text-slate-900 dark:text-white">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WashingMachine className="h-6 w-6 text-blue-500 dark:text-white" />
          <h2 className="text-xl font-semibold">Laundry Machines</h2>
        </div>
        <AddMachineModal
          open={open}
          setOpen={(value) => {
            setOpen(value);
            if (!value) {
              setSelectedMachine(null);
              setForm(initialForm);
            }
          }}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
        />
      </div>

      {error && <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>}

      {/* Maintenance Reminder Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-500" />
              Maintenance Reminder
            </DialogTitle>
            <DialogDescription>
              {maintenanceReminder && (
                <div>
                  <p>
                    {maintenanceReminder.name} ({maintenanceReminder.type}) is due for maintenance.
                  </p>
                  <p className="mt-2 text-sm">
                    Last maintenance: {new Date(maintenanceReminder.lastMaintenance).toLocaleDateString()}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={postponeMaintenance}>
              Remind me in 3 days
            </Button>
            <Button 
              onClick={() => maintenanceReminder && handleMaintenance(maintenanceReminder)}
            >
              Start Maintenance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🧺 Washer Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-blue-500 dark:text-blue-400">Washers</h3>
        <TooltipProvider>
          <div
            ref={washerRef}
            className="overflow-x-auto scroll-smooth px-4 py-2"
          >
            <div
              className="flex flex-nowrap gap-6"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {loading ? (
                <div className="flex gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-[240px] w-[200px] animate-pulse rounded-md bg-slate-200 dark:bg-slate-800"
                    />
                  ))}
                </div>
              ) : washers.length > 0 ? (
                washers.map((machine) => (
                  <MachineCard
                    key={machine.id}
                    machine={machine}
                    animationData={washingAnimation}
                    onEdit={(m) => {
                      setSelectedMachine(m);
                      setForm({
                        id: m.id,
                        name: m.name,
                        type: m.type,
                        capacityKg: m.capacityKg.toString(),
                        status: m.status,
                      });
                      setOpen(true);
                    }}
                    onDelete={(id) => setConfirmDeleteId(id)}
                    onMaintenance={(machine) => {
                      setMaintenanceReminder(machine);
                      setShowMaintenanceDialog(true);
                    }}
                  />
                ))
              ) : (
                <p className="text-muted-foreground dark:text-slate-400">No washers added yet.</p>
              )}
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* 🔥 Dryer Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-orange-500 dark:text-orange-400">Dryers</h3>
        <TooltipProvider>
          <div
            ref={dryerRef}
            className="overflow-x-auto scroll-smooth px-4 py-2"
          >
            <div
              className="flex flex-nowrap gap-6"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {loading ? (
                <div className="flex gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-[240px] w-[200px] animate-pulse rounded-md bg-slate-200 dark:bg-slate-800"
                    />
                  ))}
                </div>
              ) : dryers.length > 0 ? (
                dryers.map((machine) => (
                  <MachineCard
                    key={machine.id}
                    machine={machine}
                    animationData={dryerAnimation}
                    onEdit={(m) => {
                      setSelectedMachine(m);
                      setForm({
                        id: m.id,
                        name: m.name,
                        type: m.type,
                        capacityKg: m.capacityKg.toString(),
                        status: m.status,
                      });
                      setOpen(true);
                    }}
                    onDelete={(id) => setConfirmDeleteId(id)}
                    onMaintenance={(machine) => {
                      setMaintenanceReminder(machine);
                      setShowMaintenanceDialog(true);
                    }}
                  />
                ))
              ) : (
                <p className="text-muted-foreground dark:text-slate-400">No dryers added yet.</p>
              )}
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* ❓ Confirm Delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-md border border-slate-300 bg-white p-6 text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <h3 className="mb-2 text-lg font-semibold">Delete Machine</h3>
            <p className="mb-4 text-sm">Are you sure you want to delete this machine?</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmDeleteId(null)}
                className="text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(confirmDeleteId)}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}