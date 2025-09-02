import React, { useEffect, useState } from "react";
import { WashingMachine, ArrowRight, Check } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Lottie from "lottie-react";
import washingAnimation from "@/assets/lottie/washing-machine.json";
import unwashedAnimation from "@/assets/lottie/unwashed.json";
import dryingAnimation from "@/assets/lottie/dryer-machine.json";
import foldingAnimation from "@/assets/lottie/clothes.json";
import loader from "@/assets/lottie/loader.json";

const DEFAULT_DURATION = {
    washing: 35,
    drying: 40,
};

const STATUS_ICONS = {
    UNWASHED: { label: "Unwashed", animation: unwashedAnimation },
    WASHING: { label: "Washing", animation: washingAnimation },
    DRYING: { label: "Drying", animation: dryingAnimation },
    FOLDING: { label: "Folding", animation: foldingAnimation },
};

const SERVICE_FLOWS = {
    Wash: ["UNWASHED", "WASHING", "FOLDING"],
    Dry: ["DRY_ONLY", "DRYING", "FOLDING"],
    "Wash & Dry": ["UNWASHED", "WASHING", "DRYING", "FOLDING"],
};

const ALLOWED_SKEW_MS = 5000;

const isTokenExpired = (token) => {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        const exp = decoded.exp * 1000;
        return Date.now() > exp + ALLOWED_SKEW_MS;
    } catch {
        return true;
    }
};

export default function ServiceTrackingPage() {
    const [jobs, setJobs] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const fetchJobs = async () => {
            const token = localStorage.getItem("authToken");
            if (!token || isTokenExpired(token)) {
                window.location.href = "/login";
                return;
            }

            try {
                const res = await fetch("http://localhost:8080/api/laundry-jobs", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    console.error(`❌ HTTP ${res.status}`);
                    return;
                }

                const text = await res.text();
                const data = text ? JSON.parse(text) : [];
                setJobs(data);
            } catch (err) {
                console.error("Failed to fetch jobs:", err);
            }
        };

        fetchJobs();
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const getRemainingTime = (job) => {
        if (!job.startedAt || !job.duration) return null;
        const end = new Date(job.startedAt).getTime() + job.duration * 60000;
        return Math.max(Math.floor((end - now) / 60000), 0);
    };

    const getMachineType = (job) => {
        if (job.status === "WASHING") return "washer";
        if (job.status === "DRYING") return "dryer";
        if (job.status === "UNWASHED") {
            if (job.serviceType?.includes("Wash")) return "washer";
            if (job.serviceType === "Dry") return "dryer";
        }
        return null;
    };

    const getMachineStatus = (job) => {
        const type = getMachineType(job);
        if (!type) return [];
        const allMachines = jobs
            .filter((j) => getMachineType(j) === type)
            .map((j) => j.machine)
            .filter(Boolean);
        const uniqueMachines = [...new Set(allMachines)];
        return uniqueMachines.map((m) => ({
            name: m,
            available: !jobs.some((j) => j.machine === m && j.startedAt && getMachineType(j) === type),
        }));
    };

    const assignMachine = (id, machine) => {
        setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, machine } : j)));
    };

    const updateDuration = (id, duration) => {
        setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, duration } : j)));
    };

    const startAction = (id) => {
        setJobs((prev) =>
            prev.map((j) =>
                j.id === id
                    ? {
                          ...j,
                          status: j.serviceType === "Dry" ? "DRYING" : j.serviceType?.includes("Wash") ? "WASHING" : j.status,
                          startedAt: new Date().toISOString(),
                          duration: j.duration || DEFAULT_DURATION[getMachineType(j)] || 30,
                      }
                    : j,
            ),
        );
    };

    const advanceStatus = async (id) => {
        const token = localStorage.getItem("authToken");
        if (!token || isTokenExpired(token)) {
            window.location.href = "/login";
            return;
        }

        const job = jobs.find((j) => j.id === id);
        const flow = SERVICE_FLOWS[job.serviceType] || [];
        const currentIndex = flow.indexOf(job.status);
        const nextStatus = currentIndex < flow.length - 1 ? flow[currentIndex + 1] : job.status;

        setUpdatingId(id);
        try {
            await fetch(`http://localhost:8080/api/laundry-jobs/${id}/status`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: nextStatus }),
            });

            setJobs((prev) =>
                prev.map((j) =>
                    j.id === id
                        ? {
                              ...j,
                              status: nextStatus,
                              machine: null,
                              startedAt: null,
                              duration: null,
                          }
                        : j,
                ),
            );
        } catch (err) {
            console.error("Failed to update status:", err);
        } finally {
            setUpdatingId(null);
        }
    };

    const markCompleted = async (id) => {
        setUpdatingId(id);
        try {
            setJobs((prev) => prev.filter((j) => j.id !== id));
        } finally {
            setUpdatingId(null);
        }
    };

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
                                <th
                                    className="p-3 text-left"
                                    colSpan={2}
                                >
                                    Load
                                </th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Machine</th>
                                <th className="p-3 text-left">Duration</th>
                                <th className="p-3 text-left">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {jobs.map((job) => (
                                <React.Fragment key={job.id}>
                                    {/* Contextual header row */}
                                    <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
    <td className="p-3 font-semibold" colSpan={6}>
        Customer: {job.customerName} &nbsp;|&nbsp; 
        Detergent: {Math.ceil(job.detergentQty ?? 0)} &nbsp;|&nbsp; 
        Fabric: {Math.ceil(job.fabricQty ?? 0)} &nbsp;|&nbsp; 
        Date: {job.issueDate ? new Date(job.issueDate).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric"
        }) : "Invalid Date"}
    </td>
</tr>

                                    {/* Load-level rows */}
                                    {Array.from({ length: job.loads }, (_, i) => {
                                        const loadId = `${job.id}-load${i + 1}`;
                                        const statusConfig = STATUS_ICONS[job.status] ?? STATUS_ICONS.UNWASHED;
                                        const isLoading = updatingId === loadId;
                                        const machineOptions = getMachineStatus(job);
                                        const remaining = getRemainingTime(job);

                                        return (
                                            <tr
                                                key={loadId}
                                                className="border-b border-slate-200 dark:border-slate-700"
                                            >
                                                <td
                                                    className="p-3"
                                                    colSpan={2}
                                                >
                                                    Load {i + 1}
                                                </td>

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
                                                            {remaining !== null ? `${remaining} min remaining` : "Not started"}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </td>

                                                <td className="p-3">
                                                    <Select
                                                        value={job.machine ?? ""}
                                                        onValueChange={(val) => assignMachine(loadId, val)}
                                                    >
                                                        <SelectTrigger className="w-[120px]">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {machineOptions.map((m) => (
                                                                <SelectItem
                                                                    key={m.name}
                                                                    value={m.name}
                                                                    disabled={!m.available}
                                                                >
                                                                    {m.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>

                                                <td className="p-3">
                                                    <Select
                                                        value={job.duration?.toString() ?? ""}
                                                        onValueChange={(val) => updateDuration(loadId, parseInt(val))}
                                                    >
                                                        <SelectTrigger className="w-[80px]">
                                                            <SelectValue placeholder="min" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {[20, 30, 35, 40, 45, 50].map((min) => (
                                                                <SelectItem
                                                                    key={min}
                                                                    value={min.toString()}
                                                                >
                                                                    {min} min
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>

                                                <td className="p-3">
                                                    {job.status === "FOLDING" ? (
                                                        <button
                                                            className="flex items-center gap-1 rounded bg-green-500 px-2 py-1 text-white hover:bg-green-600"
                                                            onClick={() => markCompleted(loadId)}
                                                            disabled={isLoading}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                            Done
                                                        </button>
                                                    ) : job.startedAt ? (
                                                        <button
                                                            className="flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                                                            onClick={() => advanceStatus(loadId)}
                                                            disabled={isLoading}
                                                        >
                                                            <ArrowRight className="h-4 w-4" />
                                                            Next
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="flex items-center gap-1 rounded bg-cyan-500 px-2 py-1 text-white hover:bg-cyan-600"
                                                            onClick={() => startAction(loadId)}
                                                            disabled={isLoading}
                                                        >
                                                            <ArrowRight className="h-4 w-4" />
                                                            Start
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </TooltipProvider>
        </main>
    );
}
