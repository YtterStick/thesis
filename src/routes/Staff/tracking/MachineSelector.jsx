import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { motion } from "framer-motion";

const MachineSelector = ({ load, options, jobs, assignMachine, disabled, isDarkMode }) => {
    // For DRIED status, show current machine but disable selection
    // Machine will only be released when advancing to FOLDING
    const isDriedStatus = load.status === "DRIED";
    const currentMachine = load.machineId ? options.find((m) => m.id === load.machineId) : null;
    
    return (
        <Select
            value={load.machineId ?? ""}
            onValueChange={isDriedStatus ? undefined : assignMachine} // Disable changes for DRIED status
            disabled={disabled || isDriedStatus} // Disable selector for DRIED status
        >
            <SelectTrigger className="w-[160px] transition-all"
                style={{
                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    color: isDarkMode ? "#13151B" : "#0B2B26",
                    opacity: isDriedStatus ? 0.7 : 1, // Slightly dim when disabled
                }}
            >
                <SelectValue placeholder="Select machine">
                    {currentMachine 
                        ? currentMachine.name
                        : "Select machine"}
                </SelectValue>
            </SelectTrigger>
            <SelectContent 
                className="transition-all"
                style={{
                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    color: isDarkMode ? "#13151B" : "#0B2B26",
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
                                isDriedStatus // Disable all options for DRIED status
                            }
                            className="cursor-pointer transition-colors"
                            style={{
                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                            }}
                        >
                            <motion.span
                                whileHover={isDriedStatus ? {} : { scale: 1.02 }} // No hover effect when disabled
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