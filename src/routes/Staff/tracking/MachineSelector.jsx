import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { motion } from "framer-motion";

const MachineSelector = ({ load, options, jobs, assignMachine, disabled, isDarkMode }) => {
    // For FOLDING, COMPLETED, and DRIED status, show current machine but disable selection
    const shouldDisableSelection = ["FOLDING", "COMPLETED", "DRIED"].includes(load.status);
    const currentMachine = load.machineId ? options.find((m) => m.id === load.machineId) : null;
    
    // Display logic:
    // - For FOLDING/COMPLETED: show "Released (Machine Name)" 
    // - For DRIED: show the machine name (since it's still assigned but can't be changed)
    // - For others: show machine name or "Select machine"
    const getDisplayValue = () => {
        if ((load.status === "FOLDING" || load.status === "COMPLETED") && currentMachine) {
            return `Released (${currentMachine.name})`;
        } else if (load.status === "DRIED" && currentMachine) {
            return currentMachine.name; // Show the machine that was used for drying
        } else if (currentMachine) {
            return currentMachine.name;
        } else {
            return "Select machine";
        }
    };

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
                    {getDisplayValue()}
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
                            (l) => l.machineId === m.id && l.status !== "COMPLETED" && l !== load,
                        ),
                    );
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
                                {m.name}
                            </motion.span>
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
};

export default MachineSelector;