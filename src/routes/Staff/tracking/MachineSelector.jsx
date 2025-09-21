import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const MachineSelector = ({ load, options, jobs, assignMachine, disabled }) => {
    return (
        <Select
            value={load.machineId ?? ""}
            onValueChange={assignMachine}
            disabled={disabled}
        >
            <SelectTrigger className="w-[160px] border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-950">
                <SelectValue placeholder="Select machine">
                    {load.machineId
                        ? options.find((m) => m.id === load.machineId)?.name || "Select machine"
                        : "Select machine"}
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
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
                                assignedElsewhere
                            }
                            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {m.name}
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
};

export default MachineSelector;