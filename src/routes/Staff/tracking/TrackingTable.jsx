import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ArrowDown, ArrowUp, CheckCircle, Clock } from "lucide-react";
import MachineSelector from "./MachineSelector";
import StatusIndicator from "./StatusIndicator";
import ActionButtons from "./ActionButtons";

const TrackingTable = ({
    jobs,
    expandedJobs,
    setExpandedJobs,
    machines,
    now,
    assignMachine,
    updateDuration,
    startAction,
    advanceStatus,
    startDryingAgain,
    getJobKey,
    getRemainingTime,
    getMachineTypeForStep,
    isLoadRunning,
    maskContact,
    isDarkMode,
    globalLoading,
    pendingRequests,
    getJobUrgency,
    allMachines = [],
}) => {
    const [completingLoads, setCompletingLoads] = useState({});
    const [localDurations, setLocalDurations] = useState({});

    // Helper function to format duration for display
    const formatDurationForDisplay = (duration) => {
        if (!duration && duration !== 0) return "";
        
        if (duration < 1) {
            // For values less than 1 minute, show as seconds
            const seconds = Math.round(duration * 60);
            return `${seconds}s`;
        } else {
            const minutes = Math.floor(duration);
            const seconds = Math.round((duration - minutes) * 60);
            
            if (seconds > 0) {
                return `${minutes}m ${seconds}s`;
            }
            return `${minutes}m`;
        }
    };

    // Helper function to parse display value back to minutes
    const parseDisplayToMinutes = (displayValue) => {
        if (!displayValue) return null;
        
        // Check if it's in seconds format (e.g., "10s")
        if (displayValue.toLowerCase().endsWith('s')) {
            const seconds = parseFloat(displayValue);
            return isNaN(seconds) ? null : seconds / 60;
        }
        
        // Otherwise treat as decimal minutes
        return parseFloat(displayValue);
    };

    // Add urgency badge component
    const UrgencyBadge = ({ urgency }) => {
        if (!urgency) return null;

        const getUrgencyColor = (totalSeconds) => {
            if (totalSeconds < 300) return "#EF4444"; // red for < 5 min
            if (totalSeconds < 900) return "#F59E0B"; // amber for < 15 min
            return "#10B981"; // green for > 15 min
        };

        const formatTime = (urgency) => {
            if (urgency.minutes > 0) {
                return `${urgency.minutes}m ${urgency.seconds}s`;
            }
            return `${urgency.seconds}s`;
        };

        return (
            <div
                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                style={{
                    backgroundColor: `${getUrgencyColor(urgency.totalSeconds)}20`,
                    color: getUrgencyColor(urgency.totalSeconds),
                    border: `1px solid ${getUrgencyColor(urgency.totalSeconds)}40`,
                }}
            >
                <div
                    className="h-2 w-2 animate-pulse rounded-full"
                    style={{ backgroundColor: getUrgencyColor(urgency.totalSeconds) }}
                />
                {formatTime(urgency)}
            </div>
        );
    };

    const handleCompletionAnimation = (jobKey, loadIndex) => {
        const completionKey = `${jobKey}-${loadIndex}`;
        setCompletingLoads((prev) => ({
            ...prev,
            [completionKey]: true,
        }));

        setTimeout(() => {
            setCompletingLoads((prev) => {
                const newState = { ...prev };
                delete newState[completionKey];
                return newState;
            });
        }, 5000);
    };

    const isLoadCompleting = (jobKey, loadIndex) => {
        return completingLoads[`${jobKey}-${loadIndex}`];
    };

    const getVisibleLoads = (job, expanded) => {
        const jobKey = getJobKey(job);

        const visibleLoads = job.loads.filter((load) => {
            const loadIndex = job.loads.findIndex((l) => l.loadNumber === load.loadNumber && l.status === load.status);
            const isCompleting = isLoadCompleting(jobKey, loadIndex);

            return load.status !== "COMPLETED" || isCompleting;
        });

        return expanded ? visibleLoads : visibleLoads.slice(0, 1);
    };

    // Helper function to determine if machine selector should be shown
    const shouldShowMachineSelector = (loadStatus) => {
        return !["FOLDING", "COMPLETED"].includes(loadStatus);
    };

    // Get machine type for duration display
    const getMachineTypeForDuration = (load) => {
        if (!load?.machineId) return null;
        const machine = allMachines.find((m) => m.id === load.machineId);
        return machine?.type?.toUpperCase();
    };

    // Get default duration based on machine type
    const getDefaultDuration = (machineType) => {
        if (machineType === "WASHER") return 35;
        if (machineType === "DRYER") return 40;
        return null;
    };

    // Format duration for display in input field
    const formatDurationForInput = (duration) => {
        if (!duration && duration !== 0) return "";
        
        // For input field, show the raw decimal value
        // This allows precise entry like 0.10 for 6 seconds
        return duration.toString();
    };

    // Get local duration value for a specific load
    const getLocalDuration = (jobKey, loadIndex) => {
        const key = `${jobKey}-${loadIndex}`;
        // If we have a local value, use it. Otherwise use the actual duration from props
        if (localDurations[key] !== undefined) {
            return localDurations[key];
        }
        
        const job = jobs.find(j => getJobKey(j) === jobKey);
        if (job && job.loads[loadIndex]) {
            const actualDuration = job.loads[loadIndex].duration;
            if (actualDuration !== null && actualDuration !== undefined) {
                return formatDurationForInput(actualDuration);
            }
        }
        
        return "";
    };

    // Set local duration value for a specific load
    const setLocalDuration = (jobKey, loadIndex, value) => {
        const key = `${jobKey}-${loadIndex}`;
        setLocalDurations(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Handle duration input change
    const handleDurationChange = (jobKey, loadIndex, value) => {
        // Allow empty input, numbers, and decimal points
        if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
            setLocalDuration(jobKey, loadIndex, value);
        }
    };

    // Handle duration input blur
    const handleDurationBlur = (jobKey, loadIndex, load) => {
        const localValue = getLocalDuration(jobKey, loadIndex);
        const value = localValue.trim();
        
        if (value === "") {
            // Clear duration if input is empty
            updateDuration(jobKey, loadIndex, null);
            return;
        }
        
        // Parse the final value as decimal minutes
        const numValue = parseFloat(value);
        
        // Validate the value
        if (!isNaN(numValue)) {
            let finalValue = numValue;
            
            // Store exactly as entered, treating it as decimal minutes
            // 0.10 means 0.10 minutes = 6 seconds
            // 0.50 means 0.50 minutes = 30 seconds
            
            // Ensure minimum value of 0.01 minutes (about 0.6 seconds)
            if (finalValue < 0.01) {
                finalValue = 0.01;
            }
            
            // Ensure maximum value of 60 minutes
            if (finalValue > 60) {
                finalValue = 60;
            }
            
            // Update with the final validated value (in minutes)
            updateDuration(jobKey, loadIndex, finalValue);
            
            // For display, keep the original format
            setLocalDuration(jobKey, loadIndex, finalValue.toString());
        } else {
            // If invalid, revert to the actual duration
            const job = jobs.find(j => getJobKey(j) === jobKey);
            if (job && job.loads[loadIndex]) {
                const actualDuration = job.loads[loadIndex].duration;
                setLocalDuration(jobKey, loadIndex, formatDurationForInput(actualDuration));
            }
        }
    };

    // Handle duration input focus
    const handleDurationFocus = (e) => {
        // Select all text when input is focused
        e.target.select();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border-2 transition-all"
            style={{
                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
            }}
        >
            <div
                className="overflow-x-auto rounded-lg border-2"
                style={{
                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                }}
            >
                <table className="min-w-full table-auto text-sm">
                    <thead
                        style={{
                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                        }}
                    >
                        <tr>
                            {["Urgency", "Name", "Contact", "Service", "Fabric", "Detergent", "Load", "Status", "Machine", "Duration", "Action"].map(
                                (header) => (
                                    <th
                                        key={header}
                                        className="px-3 py-2 text-left text-xs font-medium"
                                        style={{
                                            color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                        }}
                                    >
                                        {header}
                                    </th>
                                ),
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {jobs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={11}
                                        className="px-4 py-16 text-center text-sm"
                                        style={{
                                            color: isDarkMode ? "#94a3b8" : "#475569",
                                        }}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <CheckCircle
                                                style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}
                                                className="h-12 w-12"
                                            />
                                            <span>No laundry jobs found</span>
                                            <p className="text-sm">All jobs have been completed or no jobs are scheduled.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                jobs.map((job) => {
                                    const jobKey = getJobKey(job);
                                    const expanded = expandedJobs[jobKey] || false;
                                    const visibleLoads = getVisibleLoads(job, expanded);
                                    const urgency = getJobUrgency(job);

                                    if (visibleLoads.length === 0) return null;

                                    return (
                                        <React.Fragment key={jobKey}>
                                            {visibleLoads.map((load, i) => {
                                                const originalIndex = job.loads.findIndex(
                                                    (l) => l.loadNumber === load.loadNumber && l.status === load.status,
                                                );

                                                const isCompleting = isLoadCompleting(jobKey, originalIndex);

                                                const normalizedServiceType = job.serviceType?.replace(" Only", "") || job.serviceType;
                                                const machineType = getMachineTypeForStep(load.status, normalizedServiceType);
                                                const options =
                                                    machineType === "WASHER" ? machines.WASHER : machineType === "DRYER" ? machines.DRYER : [];

                                                // Get machine type for duration display
                                                const currentMachineType = getMachineTypeForDuration(load);
                                                const defaultDuration = getDefaultDuration(currentMachineType);

                                                const localDurationValue = getLocalDuration(jobKey, originalIndex);

                                                return (
                                                    <motion.tr
                                                        key={`${jobKey}-load${load.loadNumber}`}
                                                        initial={false}
                                                        animate={{
                                                            scale: 1,
                                                            backgroundColor: isCompleting
                                                                ? isDarkMode
                                                                    ? "rgba(16, 185, 129, 0.2)"
                                                                    : "rgba(16, 185, 129, 0.1)"
                                                                : isDarkMode
                                                                  ? "rgba(30, 41, 59, 0.5)"
                                                                  : "#f8fafc",
                                                            borderColor: isCompleting ? "#10B981" : isDarkMode ? "#334155" : "#e2e8f0",
                                                        }}
                                                        exit={{
                                                            scale: 0.9,
                                                            opacity: 0,
                                                            transition: { duration: 0.3 },
                                                        }}
                                                        transition={{
                                                            duration: 0.5,
                                                            ease: "easeOut",
                                                        }}
                                                        className="border-t transition-all hover:opacity-90"
                                                        style={{
                                                            borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                                                        }}
                                                    >
                                                        {/* Urgency Column */}
                                                        <td className="px-3 py-2">
                                                            <UrgencyBadge urgency={urgency} />
                                                        </td>

                                                        <td
                                                            className="px-3 py-2 font-medium"
                                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                        >
                                                            {job.customerName}
                                                        </td>
                                                        <td
                                                            className="px-3 py-2"
                                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                        >
                                                            {job.contact ? maskContact(job.contact) : "—"}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <Badge
                                                                className="capitalize"
                                                                style={{
                                                                    backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                                                    color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                                                    borderColor: isDarkMode ? "#475569" : "#0f172a",
                                                                }}
                                                            >
                                                                {normalizedServiceType?.toLowerCase() || "—"}
                                                            </Badge>
                                                        </td>
                                                        <td
                                                            className="px-3 py-2"
                                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                        >
                                                            {Math.ceil(job.fabricQty ?? 0)}
                                                        </td>
                                                        <td
                                                            className="px-3 py-2"
                                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                        >
                                                            {Math.ceil(job.detergentQty ?? 0)}
                                                        </td>
                                                        <td
                                                            className="px-3 py-2"
                                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                        >
                                                            Load {load.loadNumber}
                                                        </td>
                                                        <td className="p-2">
                                                            <StatusIndicator
                                                                load={load}
                                                                now={now}
                                                                getRemainingTime={getRemainingTime}
                                                                isDarkMode={isDarkMode}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            {shouldShowMachineSelector(load.status) && (
                                                                <MachineSelector
                                                                    load={load}
                                                                    options={options}
                                                                    jobs={jobs}
                                                                    assignMachine={(machineId) => assignMachine(jobKey, originalIndex, machineId)}
                                                                    disabled={
                                                                        isLoadRunning(load) ||
                                                                        load.status === "FOLDING" ||
                                                                        load.status === "COMPLETED" ||
                                                                        globalLoading
                                                                    }
                                                                    isDarkMode={isDarkMode}
                                                                    job={job}
                                                                    pendingRequests={pendingRequests}
                                                                />
                                                            )}
                                                            {!shouldShowMachineSelector(load.status) && (
                                                                <div className="flex w-[160px] items-center gap-1 text-xs text-green-600">
                                                                    <CheckCircle className="h-3 w-3" />
                                                                    Machine released
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            {isLoadRunning(load) ? (
                                                                <span
                                                                    className="font-semibold"
                                                                    style={{ color: "#0891B2" }}
                                                                >
                                                                    {(() => {
                                                                        const remaining = getRemainingTime(load);
                                                                        return remaining < 60
                                                                            ? `${remaining}s`
                                                                            : `${Math.floor(remaining / 60)}m ${(remaining % 60)
                                                                                  .toString()
                                                                                  .padStart(2, "0")}s`;
                                                                    })()}
                                                                </span>
                                                            ) : (
                                                                !(
                                                                    (normalizedServiceType === "Wash & Dry" || normalizedServiceType === "Dry") &&
                                                                    (load.status === "FOLDING" || load.status === "COMPLETED")
                                                                ) && (
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <div className="relative">
                                                                            <input
                                                                                type="text"
                                                                                value={localDurationValue}
                                                                                onChange={(e) => handleDurationChange(jobKey, originalIndex, e.target.value)}
                                                                                onBlur={() => handleDurationBlur(jobKey, originalIndex, load)}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        e.target.blur();
                                                                                    }
                                                                                }}
                                                                                onFocus={handleDurationFocus}
                                                                                disabled={
                                                                                    load.status === "FOLDING" ||
                                                                                    load.status === "COMPLETED" ||
                                                                                    globalLoading
                                                                                }
                                                                                placeholder="0.00"
                                                                                className="w-[140px] rounded-md border-2 px-3 py-2 text-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                style={{
                                                                                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                                                                    borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                                                                                    color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                                                                    opacity: (
                                                                                        load.status === "FOLDING" ||
                                                                                        load.status === "COMPLETED" ||
                                                                                        globalLoading
                                                                                    ) ? 0.7 : 1,
                                                                                }}
                                                                            />
                                                                            <span 
                                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                                                                                style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
                                                                            >
                                                                                mins
                                                                            </span>
                                                                        </div>

                                                                        {/* Show auto-selected duration info */}
                                                                        {load.machineId && !load.duration && (
                                                                            <span className="text-xs text-blue-500">
                                                                                {(() => {
                                                                                    const machine = allMachines.find((m) => m.id === load.machineId);
                                                                                    if (machine?.type?.toUpperCase() === "WASHER")
                                                                                        return "Washer default: 35 mins";
                                                                                    if (machine?.type?.toUpperCase() === "DRYER")
                                                                                        return "Dryer default: 40 mins";
                                                                                    return "Enter duration";
                                                                                })()}
                                                                            </span>
                                                                        )}
                                                                        {load.machineId && load.duration && (
                                                                            <span className="text-xs text-green-500">
                                                                                {(() => {
                                                                                    const machine = allMachines.find((m) => m.id === load.machineId);
                                                                                    if (!machine) {
                                                                                        // Use the new consistent display function
                                                                                        return formatDurationForDisplay(load.duration);
                                                                                    }

                                                                                    const machineType = machine.type?.toUpperCase();
                                                                                    const isWasherDefault =
                                                                                        machineType === "WASHER" && load.duration === 35;
                                                                                    const isDryerDefault =
                                                                                        machineType === "DRYER" && load.duration === 40;

                                                                                    if (isWasherDefault) return "Washer default";
                                                                                    if (isDryerDefault) return "Dryer default";
                                                                                    
                                                                                    // Use the new consistent display function
                                                                                    return formatDurationForDisplay(load.duration);
                                                                                })()}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )
                                                            )}
                                                        </td>
                                                        <td className="p-2 text-right">
                                                            <ActionButtons
                                                                load={load}
                                                                job={job}
                                                                jobKey={jobKey}
                                                                loadIndex={originalIndex}
                                                                isLoadRunning={isLoadRunning}
                                                                startAction={startAction}
                                                                advanceStatus={advanceStatus}
                                                                startDryingAgain={startDryingAgain}
                                                                getMachineTypeForStep={getMachineTypeForStep}
                                                                machines={machines}
                                                                isDarkMode={isDarkMode}
                                                                onCompletion={handleCompletionAnimation}
                                                                globalLoading={globalLoading}
                                                                pendingRequests={pendingRequests}
                                                            />
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}

                                            {job.loads.length > 1 && (
                                                <tr>
                                                    <td
                                                        colSpan={11}
                                                        className="p-2"
                                                    >
                                                        <div className="flex justify-center">
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() =>
                                                                    setExpandedJobs((prev) => ({
                                                                        ...prev,
                                                                        [jobKey]: !expanded,
                                                                    }))
                                                                }
                                                                className="flex items-center gap-1 rounded-lg px-3 py-1 transition-all"
                                                                style={{
                                                                    backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                                                    color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                                                }}
                                                            >
                                                                {expanded ? (
                                                                    <>
                                                                        See less <ArrowUp className="h-4 w-4" />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        See more <ArrowDown className="h-4 w-4" />
                                                                    </>
                                                                )}
                                                            </motion.button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default TrackingTable;