import React from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, CheckCircle, Package } from "lucide-react";
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
    getJobUrgency,
    getMachineTypeForStep,
    isLoadRunning,
    maskContact,
    isDarkMode,
    globalLoading,
    pendingRequests,
}) => {

    const getVisibleLoads = (job, expanded) => {
        const visibleLoads = job.loads.filter((load) => load.status !== "COMPLETED");
        // If all loads are completed, show the last one so the row doesn't disappear instantly
        if (visibleLoads.length === 0 && job.loads.length > 0) {
            return [job.loads[job.loads.length - 1]];
        }
        return expanded ? visibleLoads : visibleLoads.slice(0, 1);
    };

    const shouldShowMachineSelector = (loadStatus) => {
        return !["FOLDING", "COMPLETED"].includes(loadStatus);
    };

    return (
        <div className="rounded-xl border shadow-sm overflow-hidden" style={{
            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
            borderColor: isDarkMode ? "#334155" : "#e2e8f0",
        }}>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead style={{ backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "#f8fafc" }}>
                        <tr>
                            {["Name", "Service", "Fabric", "Detergent", "Load", "Status", "Machine", "Action"].map((header) => (
                                <th key={header} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {jobs.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <Package className="h-10 w-10 opacity-20" />
                                        <span className="font-medium">No active laundry jobs</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            jobs.map((job) => {
                                const jobKey = getJobKey(job);
                                const expanded = expandedJobs[jobKey] || false;
                                const visibleLoads = getVisibleLoads(job, expanded);

                                if (visibleLoads.length === 0) return null;

                                return (
                                    <React.Fragment key={jobKey}>
                                        {visibleLoads.map((load, i) => {
                                            const originalIndex = job.loads.findIndex(
                                                (l) => l.loadNumber === load.loadNumber && l.status === load.status
                                            );
                                            const normalizedServiceType = job.serviceType?.replace(" Only", "") || job.serviceType;
                                            const machineType = getMachineTypeForStep(load.status, normalizedServiceType);
                                            const options = machineType === "WASHER" ? machines.WASHER : machineType === "DRYER" ? machines.DRYER : [];

                                            return (
                                                <tr key={`${jobKey}-load${load.loadNumber}`} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-slate-900" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                                                        {job.customerName}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-700 uppercase">
                                                            {normalizedServiceType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600" style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}>
                                                        {job.fabricQty}kg
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600" style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}>
                                                        {job.detergentQty}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-slate-500">
                                                        #{load.loadNumber}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StatusIndicator load={load} isDarkMode={isDarkMode} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {shouldShowMachineSelector(load.status) ? (
                                                            <MachineSelector
                                                                load={load}
                                                                options={options}
                                                                jobs={jobs}
                                                                assignMachine={(machineId) => assignMachine(jobKey, originalIndex, machineId)}
                                                                disabled={isLoadRunning(load) || globalLoading}
                                                                isDarkMode={isDarkMode}
                                                                job={job}
                                                                pendingRequests={pendingRequests}
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-emerald-600 font-medium italic">Released</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
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
                                                            globalLoading={globalLoading}
                                                            pendingRequests={pendingRequests}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {visibleLoads.length > 1 && (
                                            <tr className="bg-slate-50/30">
                                                <td colSpan={8} className="px-4 py-1 text-center">
                                                    <button
                                                        onClick={() => setExpandedJobs((prev) => ({ ...prev, [jobKey]: !expanded }))}
                                                        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 mx-auto"
                                                    >
                                                        {expanded ? (
                                                            <>Less <ArrowUp className="h-3 w-3" /></>
                                                        ) : (
                                                            <>More Loads ({visibleLoads.length - 1}) <ArrowDown className="h-3 w-3" /></>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TrackingTable;