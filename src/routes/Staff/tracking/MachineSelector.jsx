import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { motion } from "framer-motion";

const MachineSelector = ({ load, options, jobs, assignMachine, disabled, isDarkMode }) => {
    // For FOLDING and COMPLETED status, show current machine but disable selection
    const shouldDisableSelection = ["FOLDING", "COMPLETED", "DRIED"].includes(load.status);
    const currentMachine = load.machineId ? options.find((m) => m.id === load.machineId) : null;
    
    // Debug current machine status
    console.log("🔧 MachineSelector Debug:", {
        loadStatus: load.status,
        machineId: load.machineId,
        currentMachine: currentMachine,
        machineStatus: currentMachine?.status,
        options: options
    });
    
    // If status is FOLDING or COMPLETED and there's a machine assigned, show it as released
    const displayValue = (load.status === "FOLDING" || load.status === "COMPLETED") && currentMachine 
        ? `Released (${currentMachine.name})` 
        : currentMachine 
            ? `${currentMachine.name} - ${currentMachine.status || 'Unknown'}`
            : "Select machine";

    return (
        <Select
            value={load.machineId ?? ""}
            onValueChange={shouldDisableSelection ? undefined : assignMachine}
            disabled={disabled || shouldDisableSelection}
        >
            <SelectTrigger 
                className="w-[160px] transition-all"
                style={{
                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                    borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                    color: isDarkMode ? "#f1f5f9" : "#0f172a",
                    opacity: shouldDisableSelection ? 0.7 : 1,
                }}
            >
                <SelectValue placeholder="Select machine">
                    {displayValue}
                </SelectValue>
            </SelectTrigger>
            <SelectContent 
                className="transition-all"
                style={{
                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                    borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                    color: isDarkMode ? "#f1f5f9" : "#0f172a",
                }}
            >
                {options.map((m) => {
                    const assignedElsewhere = jobs.some((j) =>
                        j.loads.some(
                            (l) => l.machineId === m.id && 
                                  l.status !== "COMPLETED" && 
                                  l !== load &&
                                  (l.status === "WASHING" || l.status === "DRYING"),
                        ),
                    );
                    
                    console.log(`🔧 Machine ${m.name}: status=${m.status}, assignedElsewhere=${assignedElsewhere}`);
                    
                    return (
                        <SelectItem
                            key={m.id}
                            value={m.id}
                            disabled={
                                (m.status || "").toLowerCase() !== "available" ||
                                assignedElsewhere ||
                                shouldDisableSelection
                            }
                            className="cursor-pointer transition-colors"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                            }}
                        >
                            <motion.span
                                whileHover={shouldDisableSelection ? {} : { scale: 1.02 }}
                                className="block"
                            >
                                {m.name} - {m.status || 'Available'}
                            </motion.span>
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
};

export default MachineSelector;