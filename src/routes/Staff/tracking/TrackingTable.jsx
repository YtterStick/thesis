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
    startAction,
    advanceStatus,
    startDryingAgain,
    getJobKey,
    getMachineTypeForStep,
    isLoadRunning,
    maskContact,
    isDarkMode,
    globalLoading,
    pendingRequests,
    allMachines = [],
}) => {
    const [completingLoads, setCompletingLoads] = useState({});

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
                            {["Name", "Contact", "Service", "Fabric", "Detergent", "Load", "Status", "Machine", "Action"].map(
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
                                        colSpan={9}
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
                                                        colSpan={9}
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