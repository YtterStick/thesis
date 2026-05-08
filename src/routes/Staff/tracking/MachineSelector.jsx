import React, { useState, useCallback } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertTriangle, Loader2 } from "lucide-react";

const MachineSelector = ({ load, options, jobs, assignMachine, disabled, isDarkMode, job, pendingRequests = new Set() }) => {
    const [localLoading, setLocalLoading] = useState(false);
    
    const safeJob = job || {};
    const normalizedServiceType = safeJob.serviceType?.replace(" Only", "") || safeJob.serviceType || "Wash & Dry";
    const requiredMachineType = getMachineTypeForStep(load?.status, normalizedServiceType);
    
    const shouldDisableSelection = ["FOLDING", "COMPLETED"].includes(load?.status);
    
    // Ensure we are comparing IDs correctly (convert to string for Select component)
    const currentMachineId = load?.machineId ? String(load.machineId) : "";
    
    const currentMachine = load?.machineId ? 
        (options.find((m) => String(m.id) === currentMachineId) || 
         { id: load.machineId, name: `Machine ${load.machineId}`, type: "UNKNOWN" }) 
        : null;
    
    const isWrongMachineType = currentMachine && requiredMachineType && 
        currentMachine.type?.toUpperCase() !== requiredMachineType;

    const requestId = load ? `assign-machine-${job?.id}-${load.loadNumber}` : '';
    const isMachineLoading = pendingRequests.has(requestId) || localLoading;

    const handleMachineAssign = useCallback(async (val) => {
        if (!val || isMachineLoading || shouldDisableSelection || disabled || val === currentMachineId) return;
        setLocalLoading(true);
        try {
            await assignMachine(val);
        } catch (error) {
            console.error("Failed to assign machine:", error);
        } finally {
            setLocalLoading(false);
        }
    }, [isMachineLoading, shouldDisableSelection, disabled, currentMachineId, assignMachine]);

    const getDisplayValue = () => {
        if (!load) return "Select";
        if (isMachineLoading) return "Assigning...";
        if (isWrongMachineType) return "Wrong Type";
        if (shouldDisableSelection) return "Released";
        return currentMachine ? currentMachine.name : "Select";
    };

    const availableMachines = (options || []).filter(machine => {
        if (!machine) return false;
        
        // Always include the currently assigned machine so it can be shown in the trigger
        if (String(machine.id) === currentMachineId) return true;

        if ((machine.status || "").toLowerCase() !== "available") return false;
        const assignedElsewhere = jobs?.some((j) =>
            j?.loads?.some((l) => String(l?.machineId) === String(machine.id) && l?.status !== "COMPLETED" && l !== load)
        );
        if (assignedElsewhere) return false;
        if (requiredMachineType && machine.type?.toUpperCase() !== requiredMachineType) return false;
        return true;
    });

    if (!load) return <div className="text-xs text-gray-400">No data</div>;

    return (
        <div className="flex flex-col gap-1">
            <Select
                value={currentMachineId}
                onValueChange={handleMachineAssign}
                disabled={disabled || shouldDisableSelection || isMachineLoading}
            >
                <SelectTrigger 
                    className="w-[140px] h-9 text-xs font-medium"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isWrongMachineType ? '#ef4444' : (isDarkMode ? "#475569" : "#cbd5e1"),
                        color: isDarkMode ? "#f1f5f9" : "#0f172a",
                    }}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {isMachineLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                        <span className="truncate">{getDisplayValue()}</span>
                    </div>
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF" }}>
                    {availableMachines.length === 0 && !currentMachineId ? (
                        <div className="px-2 py-1.5 text-xs text-gray-500">
                            No {requiredMachineType?.toLowerCase() || 'machines'}
                        </div>
                    ) : (
                        availableMachines.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)} className="text-xs">
                                {m.name} {String(m.id) === currentMachineId ? "(Current)" : ""}
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
            
            {isWrongMachineType && !isMachineLoading && (
                <span className="text-[10px] text-red-500 font-bold uppercase">Need {requiredMachineType?.toLowerCase()}</span>
            )}
        </div>
    );
};

const getMachineTypeForStep = (status, serviceType) => {
    if (!status) return null;
    const normalizedServiceType = serviceType?.replace(" Only", "") || serviceType;
    if (normalizedServiceType === "Wash") {
        if (status === "UNWASHED" || status === "WASHING") return "WASHER";
    } else if (normalizedServiceType === "Dry") {
        if (status === "UNWASHED" || status === "DRYING" || status === "DRIED") return "DRYER";
    } else if (normalizedServiceType === "Wash & Dry") {
        if (status === "UNWASHED" || status === "WASHING") return "WASHER";
        if (status === "WASHED" || status === "DRYING" || status === "DRIED") return "DRYER";
    }
    return null;
};

export default MachineSelector;