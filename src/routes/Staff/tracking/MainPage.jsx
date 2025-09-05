import React, { useEffect, useMemo, useRef, useState } from "react";
import { WashingMachine, ArrowRight, Check } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Lottie from "lottie-react";
import washingAnimation from "@/assets/lottie/washing-machine.json";
import unwashedAnimation from "@/assets/lottie/unwashed.json";
import dryingAnimation from "@/assets/lottie/dryer-machine.json";
import foldingAnimation from "@/assets/lottie/clothes.json";
import loader from "@/assets/lottie/loader.json";

const DEFAULT_DURATION = { washing: 35, drying: 40 };

const normalizeStatus = (raw) => {
    if (!raw) return "UNWASHED";
    const s = raw.toUpperCase();
    if (s === "NOT_STARTED") return "UNWASHED";
    if (s === "COMPLETED") return "COMPLETED";
    return s;
};

const STATUS_ICONS = {
    UNWASHED: { label: "Not Started", animation: unwashedAnimation },
    WASHING: { label: "Washing", animation: washingAnimation },
    WASHED: { label: "Washed", animation: washingAnimation },
    DRYING: { label: "Drying", animation: dryingAnimation },
    DRIED: { label: "Dried", animation: dryingAnimation },
    FOLDING: { label: "Folding", animation: foldingAnimation },
    COMPLETED: { label: "Completed", animation: foldingAnimation },
};

const SERVICE_FLOWS = {
    Wash: ["UNWASHED", "WASHING", "WASHED", "COMPLETED"],
    Dry: ["UNWASHED", "DRYING", "DRIED", "FOLDING", "COMPLETED"],
    "Wash & Dry": ["UNWASHED", "WASHING", "WASHED", "DRYING", "DRIED", "FOLDING", "COMPLETED"],
};

const ALLOWED_SKEW_MS = 5000;
const isTokenExpired = (token) => {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        return Date.now() > decoded.exp * 1000 + ALLOWED_SKEW_MS;
    } catch {
        return true;
    }
};

export default function ServiceTrackingPage() {
    const [jobs, setJobs] = useState([]);
    const [machines, setMachines] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);
    const [now, setNow] = useState(Date.now());
    const pollRef = useRef(null);

    const fetchJobs = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/laundry-jobs");
            const data = await res.json();

            const jobsWithLoads = data.map((job) => ({
                id: job.id ?? job.transactionId,
                ...job,
                loads: (job.loadAssignments?.length
                    ? job.loadAssignments
                    : Array.from({ length: job.totalLoads || 1 }, (_, i) => ({
                          loadNumber: i + 1,
                          machineId: null,
                          durationMinutes: null,
                          status: "NOT_STARTED",
                          startTime: null,
                          endTime: null,
                      }))
                ).map((l) => ({
                    loadNumber: l.loadNumber,
                    machineId: l.machineId || null,
                    duration: l.durationMinutes || null,
                    status: normalizeStatus(l.status),
                    startTime: l.startTime || null,
                    endTime: l.endTime || null,
                })),
            }));

            setJobs(jobsWithLoads);
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
        }
    };

    const fetchMachines = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/machines");
            const data = await res.json();
            setMachines(data);
        } catch (err) {
            console.error("Failed to fetch machines:", err);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token || isTokenExpired(token)) window.location.href = "/login";

        fetchJobs();
        fetchMachines();

        const clock = setInterval(() => setNow(Date.now()), 1000);
        pollRef.current = setInterval(() => {
            fetchJobs();
            fetchMachines();
        }, 5000);

        return () => {
            clearInterval(clock);
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const getJobKey = (job) => job.id ?? `${job.customerName}-${job.issueDate}`;
    const getRemainingTime = (load) => {
        if (!load.startTime || !load.duration) return null;
        const end = new Date(load.startTime).getTime() + load.duration * 60000;
        return Math.max(Math.floor((end - now) / 1000), 0);
    };

    const assignMachine = async (jobKey, loadIndex, machineId) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;

        setJobs((prev) =>
            prev.map((j) => (getJobKey(j) === jobKey ? { ...j, loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, machineId } : l)) } : j)),
        );

        try {
            await fetch(
                `http://localhost:8080/api/laundry-jobs/${job.id}/assign-machine?loadNumber=${job.loads[loadIndex].loadNumber}&machineId=${machineId}`,
                { method: "PATCH" },
            );
        } catch (err) {
            console.error("Failed to assign machine:", err);
        } finally {
            await fetchJobs();
            await fetchMachines();
        }
    };

    const updateDuration = async (jobKey, loadIndex, duration) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;

        setJobs((prev) =>
            prev.map((j) => (getJobKey(j) === jobKey ? { ...j, loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, duration } : l)) } : j)),
        );

        try {
            await fetch(
                `http://localhost:8080/api/laundry-jobs/${job.id}/update-duration?loadNumber=${job.loads[loadIndex].loadNumber}&durationMinutes=${duration}`,
                { method: "PATCH" },
            );
        } catch (err) {
            console.error("Failed to update duration:", err);
        } finally {
            await fetchJobs();
        }
    };

    const startAction = async (jobKey, loadIndex) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;

        const load = job.loads[loadIndex];
        if (!load.machineId) return alert("Please assign a machine first.");

        let status = load.status;

        if (job.serviceType === "Wash") {
            if (load.status === "UNWASHED") status = "WASHING";
        } else if (job.serviceType === "Dry") {
            if (load.status === "UNWASHED") status = "DRYING";
        } else if (job.serviceType === "Wash & Dry") {
            if (load.status === "UNWASHED")
                status = "WASHING";
            else if (load.status === "WASHED") status = "DRYING";
        }

        const duration =
            load.duration && load.duration > 0
                ? load.duration
                : status === "WASHING"
                  ? DEFAULT_DURATION.washing
                  : status === "DRYING"
                    ? DEFAULT_DURATION.drying
                    : null;

        const startTime = new Date().toISOString();
        setJobs((prev) =>
            prev.map((j) =>
                getJobKey(j) === jobKey
                    ? {
                          ...j,
                          loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, status, startTime, duration } : l)),
                      }
                    : j,
            ),
        );

        try {
            await fetch(`http://localhost:8080/api/laundry-jobs/${job.id}/start-load?loadNumber=${load.loadNumber}&durationMinutes=${duration}`, {
                method: "PATCH",
            });
        } catch (err) {
            console.error("Failed to start load:", err);
        } finally {
            await fetchJobs();
            await fetchMachines();
        }
    };

    const advanceStatus = async (jobKey, loadIndex) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;

        const load = job.loads[loadIndex];
        const flow = SERVICE_FLOWS[job.serviceType];
        const currentIndex = flow.indexOf(load.status);
        const nextStatus = currentIndex < flow.length - 1 ? flow[currentIndex + 1] : load.status;

        setJobs((prev) =>
            prev.map((j) =>
                getJobKey(j) === jobKey ? { ...j, loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, status: nextStatus } : l)) } : j,
            ),
        );

        try {
            await fetch(`http://localhost:8080/api/laundry-jobs/${job.id}/advance-load?loadNumber=${load.loadNumber}&status=${nextStatus}`, {
                method: "PATCH",
            });
        } catch (err) {
            console.error("Failed to advance load status:", err);
        } finally {
            await fetchJobs();
            await fetchMachines();
        }
    };

    const markCompleted = async (jobKey, loadNumber) => {
        setUpdatingId(jobKey);
        try {
            await fetch(`http://localhost:8080/api/laundry-jobs/${jobKey}/advance-load?loadNumber=${loadNumber}&status=COMPLETED`, {
                method: "PATCH",
            });

            setJobs((prevJobs) =>
                prevJobs.map((job) => (getJobKey(job) === jobKey ? { ...job, loads: job.loads.filter((l) => l.loadNumber !== loadNumber) } : job)),
            );
        } catch (e) {
            console.error("Failed to mark load completed:", e);
        } finally {
            setUpdatingId(null);
        }
    };

    const getMachineTypeForStep = (status, serviceType) => {
        if (serviceType === "Wash") return "WASHER";
        if (serviceType === "Dry") return "DRYER";
        if (serviceType === "Wash & Dry") {
            if (status === "UNWASHED" || status === "WASHING") return "WASHER";
            if (status === "WASHED" || status === "DRYING" || status === "DRIED") return "DRYER";
        }
        return null;
    };

    const isLoadRunning = (load) => {
        const remaining = getRemainingTime(load);
        return remaining !== null && remaining > 0 && (load.status === "WASHING" || load.status === "DRYING");
    };

    const machineOptions = useMemo(() => {
        const byType = { WASHER: [], DRYER: [] };
        machines.forEach((m) => {
            const t = (m.type || "").toString().toUpperCase();
            if (t === "WASHER") byType.WASHER.push(m);
            if (t === "DRYER") byType.DRYER.push(m);
        });
        return byType;
    }, [machines]);

    return (
        <main className="p-6">
            <div className="mb-6 flex items-center gap-2">
                <WashingMachine className="h-6 w-6 text-cyan-400" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Service Tracking</h1>
            </div>
            <TooltipProvider>
                <div className="overflow-x-auto rounded-md border border-slate-300 dark:border-slate-700">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-left">Service</th>
                                <th className="p-3 text-left">Load</th>
                                <th className="p-3 text-left">Fabric</th>
                                <th className="p-3 text-left">Detergent</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Machine</th>
                                <th className="p-3 text-left">Duration</th>
                                <th className="p-3 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.flatMap((job) =>
                                job.loads.map((load, i) => {
                                    const jobKey = getJobKey(job);
                                    const statusConfig = STATUS_ICONS[load.status] || STATUS_ICONS.UNWASHED;
                                    const isLoading = updatingId === jobKey;
                                    const remaining = getRemainingTime(load);
                                    const machineType = getMachineTypeForStep(load.status, job.serviceType);
                                    const options =
                                        machineType === "WASHER" ? machineOptions.WASHER : machineType === "DRYER" ? machineOptions.DRYER : [];

                                    return (
                                        <tr
                                            key={`${jobKey}-load${i + 1}`}
                                            className="border-b border-slate-200 dark:border-slate-700"
                                        >
                                            <td className="p-3 font-semibold">{job.customerName}</td>
                                            <td className="p-3">{job.serviceType || "—"}</td>
                                            <td className="p-3">Load {load.loadNumber}</td>
                                            <td className="p-3">{Math.ceil(job.fabricQty ?? 0)}</td>
                                            <td className="p-3">{Math.ceil(job.detergentQty ?? 0)}</td>
                                            <td className="p-3">
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <div className="flex items-center gap-2">
                                                            <Lottie
                                                                animationData={isLoading ? loader : statusConfig.animation}
                                                                loop
                                                                style={{ width: 40, height: 40 }}
                                                            />
                                                            <span>{statusConfig.label}</span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {remaining !== null && remaining > 0
                                                            ? `${Math.ceil(remaining / 60)} min remaining`
                                                            : load.status === "COMPLETED"
                                                              ? "Complete"
                                                              : "Idle"}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </td>
                                            <td className="p-3">
                                                <Select
                                                    value={load.machineId ?? ""}
                                                    onValueChange={(val) => assignMachine(jobKey, i, val)}
                                                    disabled={
                                                        isLoadRunning(load) ||
                                                        load.status === "WASHED" ||
                                                        load.status === "DRIED" ||
                                                        load.status === "FOLDING"
                                                    }
                                                >
                                                    <SelectTrigger className="w-[160px]">
                                                        <SelectValue placeholder="Select machine" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {options.map((m) => (
                                                            <SelectItem
                                                                key={`${jobKey}-${i}-${m.id}`}
                                                                value={m.id}
                                                                disabled={(m.status || "").toLowerCase() !== "available"}
                                                            >
                                                                {m.name} {/* removed -status */}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="p-3">
                                                <Select
                                                    value={load.machineId ? (load.duration?.toString() ?? "") : ""}
                                                    onValueChange={(val) => updateDuration(jobKey, i, parseInt(val))}
                                                    disabled={
                                                        !load.machineId ||
                                                        isLoadRunning(load) ||
                                                        load.status === "WASHED" ||
                                                        load.status === "DRIED" ||
                                                        load.status === "FOLDING"
                                                    }
                                                >
                                                    <SelectTrigger className="w-[90px]">
                                                        <SelectValue placeholder="min" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[1, 20, 30, 35, 40, 45, 50].map((min) => (
                                                            <SelectItem
                                                                key={`${jobKey}-${i}-${min}`}
                                                                value={min.toString()}
                                                            >
                                                                {min} min
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="p-3">
                                                {(() => {
                                                    if (
                                                        (job.serviceType === "Wash" && load.status === "WASHED") ||
                                                        (job.serviceType === "Dry" && load.status === "FOLDING") ||
                                                        (job.serviceType === "Wash & Dry" && load.status === "FOLDING")
                                                    ) {
                                                        return (
                                                            <button
                                                                className="flex items-center gap-1 rounded bg-green-500 px-2 py-1 text-white hover:bg-green-600"
                                                                onClick={() => markCompleted(jobKey, load.loadNumber)}
                                                                disabled={isLoading}
                                                            >
                                                                <Check className="h-4 w-4" /> Done
                                                            </button>
                                                        );
                                                    }

                                                    if (isLoadRunning(load)) {
                                                        return (
                                                            <button
                                                                className="flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-white"
                                                                disabled
                                                            >
                                                                <ArrowRight className="h-4 w-4" /> {Math.ceil(remaining / 60)} min
                                                            </button>
                                                        );
                                                    }

                                                    // Next buttons
                                                    if (
                                                        (job.serviceType === "Wash" && load.status === "WASHED") ||
                                                        (job.serviceType === "Dry" && (load.status === "DRIED" || load.status === "FOLDING")) ||
                                                        (job.serviceType === "Wash & Dry" && (load.status === "WASHED" || load.status === "DRIED"))
                                                    ) {
                                                        return (
                                                            <button
                                                                className="flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                                                                onClick={() => advanceStatus(jobKey, i)}
                                                                disabled={isLoading}
                                                            >
                                                                <ArrowRight className="h-4 w-4" /> Next
                                                            </button>
                                                        );
                                                    }

                                                    return (
                                                        <button
                                                            className="flex items-center gap-1 rounded bg-cyan-500 px-2 py-1 text-white hover:bg-cyan-600"
                                                            onClick={() => startAction(jobKey, i)}
                                                            disabled={isLoading || !load.machineId}
                                                        >
                                                            <ArrowRight className="h-4 w-4" /> Start
                                                        </button>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    );
                                }),
                            )}
                        </tbody>
                    </table>
                </div>
            </TooltipProvider>
        </main>
    );
}
