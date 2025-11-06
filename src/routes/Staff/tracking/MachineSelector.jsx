import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle } from "lucide-react";

const MachineSelector = ({ load, options, jobs, assignMachine, disabled, isDarkMode, job }) => {
    // Safe access with defaults
    const safeJob = job || {};
    const normalizedServiceType = safeJob.serviceType?.replace(" Only", "") || safeJob.serviceType || "Wash & Dry";
    const requiredMachineType = getMachineTypeForStep(load?.status, normalizedServiceType);
    
    const shouldDisableSelection = ["FOLDING", "COMPLETED", "DRIED"].includes(load?.status);
    const currentMachine = load?.machineId ? options.find((m) => m.id === load.machineId) : null;
    
    // Check if current machine is correct type
    const isWrongMachineType = currentMachine && requiredMachineType && 
        currentMachine.type?.toUpperCase() !== requiredMachineType;

    const getDisplayValue = () => {
        if (!load) return "Select machine";
        
        if (isWrongMachineType) {
            return `Wrong Type (${currentMachine?.name || 'Unknown'})`;
        } else if ((load.status === "FOLDING" || load.status === "COMPLETED") && currentMachine) {
            return `Unassigned (was ${currentMachine.name})`;
        } else if (load.status === "FOLDING" || load.status === "COMPLETED") {
            return "Unassigned"; // Show "Unassigned" when machine is completely removed
        } else if ((load.status === "WASHED" || load.status === "DRIED") && currentMachine) {
            return currentMachine.name; // Show machine name for intermediate states
        } else if (currentMachine) {
            return currentMachine.name;
        } else {
            return "Select machine";
        }
    };

    const getAvailableMachines = () => {
        if (!options || !Array.isArray(options)) return [];
        
        return options.filter(machine => {
            if (!machine) return false;

            // Check if machine is available
            if ((machine.status || "").toLowerCase() !== "available") {
                return false;
            }

            // Check if machine is assigned elsewhere
            const assignedElsewhere = jobs?.some((j) =>
                j?.loads?.some(
                    (l) => l?.machineId === machine.id && 
                    l?.status !== "COMPLETED" && 
                    l !== load,
                ),
            );

            if (assignedElsewhere) {
                return false;
            }

            // Check if machine type matches requirement
            if (requiredMachineType && machine.type?.toUpperCase() !== requiredMachineType) {
                return false;
            }

            return true;
        });
    };

    const availableMachines = getAvailableMachines();

    // If load is undefined, don't render the selector
    if (!load) {
        return (
            <div className="w-[160px] text-sm text-gray-500">
                No load data
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <Select
                value={load.machineId ?? ""}
                onValueChange={shouldDisableSelection ? undefined : assignMachine}
                disabled={disabled || shouldDisableSelection}
            >
                <SelectTrigger 
                    className={`w-[160px] transition-all ${
                        isWrongMachineType ? 'border-red-500' : 
                        (load.status === "FOLDING" || load.status === "COMPLETED") ? 'border-green-500' : ''
                    }`}
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isWrongMachineType ? '#ef4444' : 
                                   (load.status === "FOLDING" || load.status === "COMPLETED") ? '#10B981' : 
                                   (isDarkMode ? "#475569" : "#cbd5e1"),
                        color: isDarkMode ? "#f1f5f9" : "#0f172a",
                        opacity: shouldDisableSelection ? 0.7 : 1,
                    }}
                >
                    <SelectValue placeholder="Select machine">
                        <div className="flex items-center gap-2">
                            {(load.status === "FOLDING" || load.status === "COMPLETED") && (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                            {isWrongMachineType && (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                            )}
                            <span>{getDisplayValue()}</span>
                        </div>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent 
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                        color: isDarkMode ? "#f1f5f9" : "#0f172a",
                    }}
                >
                    {availableMachines.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">
                            No available {requiredMachineType?.toLowerCase() || 'machines'}
                        </div>
                    ) : (
                        availableMachines.map((m) => {
                            const isCorrectType = !requiredMachineType || m.type?.toUpperCase() === requiredMachineType;
                            
                            return (
                                <SelectItem
                                    key={m.id}
                                    value={m.id}
                                    disabled={false}
                                    className="cursor-pointer transition-colors"
                                    style={{
                                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                    }}
                                >
                                    <motion.span
                                        whileHover={shouldDisableSelection ? {} : { scale: 1.02 }}
                                        className="block"
                                    >
                                        {m.name}
                                    </motion.span>
                                </SelectItem>
                            );
                        })
                    )}
                </SelectContent>
            </Select>
            {isWrongMachineType && (
                <span className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Need {requiredMachineType?.toLowerCase()} for {load.status.toLowerCase()}
                </span>
            )}
            {(load.status === "FOLDING" || load.status === "COMPLETED") && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Machine unassigned - available for other loads
                </span>
            )}
            {!isWrongMachineType && requiredMachineType && !currentMachine && 
             load.status !== "FOLDING" && load.status !== "COMPLETED" && (
                <span className="text-xs text-blue-500">
                    Select a {requiredMachineType.toLowerCase()}
                </span>
            )}
        </div>
    );
};

// Helper function to determine required machine type
const getMachineTypeForStep = (status, serviceType) => {
    if (!status) return null;
    
    const normalizedServiceType = serviceType?.replace(" Only", "") || serviceType;

    // For Wash service: only need washer for washing
    if (normalizedServiceType === "Wash") {
        if (status === "UNWASHED" || status === "WASHING") return "WASHER";
        return null; // No machine needed for WASHED or COMPLETED
    }
    
    // For Dry service: only need dryer for drying
    if (normalizedServiceType === "Dry") {
        if (status === "UNWASHED" || status === "DRYING") return "DRYER";
        return null; // No machine needed for DRIED, FOLDING or COMPLETED
    }
    
    // For Wash & Dry service: washer for washing, dryer for drying
    if (normalizedServiceType === "Wash & Dry") {
        if (status === "UNWASHED" || status === "WASHING") return "WASHER";
        if (status === "WASHED" || status === "DRYING") return "DRYER";
    }
    
    return null;
};

export default MachineSelector;