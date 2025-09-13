import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
    WashingMachine,
    Check,
    ArrowDown,
    ArrowUp,
    RotateCcw,
    RefreshCw,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CheckCircle,
} from "lucide-react";
import DryAgainButton from "./DryAgainButton";
import NextButton from "./NextButton";
import StartButton from "./StartButton";
import ProceedToFoldingButton from "./ProceedToFoldingButton";
import Lottie from "lottie-react";

import washingAnimation from "@/assets/lottie/washing-machine.json";
import unwashedAnimation from "@/assets/lottie/unwashed.json";
import dryingAnimation from "@/assets/lottie/dryer-machine.json";
import foldingAnimation from "@/assets/lottie/clothes.json";
import loaderAnimation from "@/assets/lottie/loader.json";
import Loader from "@/components/loader";
// Constants
const DEFAULT_DURATION = { washing: 35, drying: 40 };
const ALLOWED_SKEW_MS = 5000;
const REQUEST_TIMEOUT = 10000;
const POLLING_INTERVAL = 10000;
const ACTIVE_POLLING_INTERVAL = 5000;

// Utility functions
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

const STATUS_LABEL_COLORS = {
    UNWASHED: "text-gray-500",
    WASHING: "text-blue-500",
    WASHED: "text-green-500",
    DRYING: "text-orange-500",
    DRIED: "text-green-600",
    FOLDING: "text-orange-600",
    COMPLETED: "text-green-700",
};

const SERVICE_FLOWS = {
    Wash: ["UNWASHED", "WASHING", "WASHED", "COMPLETED"],
    Dry: ["UNWASHED", "DRYING", "DRIED", "FOLDING", "COMPLETED"],
    "Wash & Dry": ["UNWASHED", "WASHING", "WASHED", "DRYING", "DRIED", "FOLDING", "COMPLETED"],
};

const isTokenExpired = (token) => {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        return Date.now() > decoded.exp * 1000 + ALLOWED_SKEW_MS;
    } catch {
        return true;
    }
};

const maskContact = (contact) => {
    if (!contact || contact.length < 7) return contact;
    return `${contact.slice(0, 4)}****${contact.slice(-3)}`;
};

// Helper function for API calls with timeout
const fetchWithTimeout = (url, options = {}, timeout = REQUEST_TIMEOUT) => {
    const controller = new AbortController();
    const { signal } = controller;

    const token = localStorage.getItem("authToken");
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    return fetch(url, {
        ...options,
        signal,
        headers,
    })
        .then((response) => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        })
        .catch((error) => {
            clearTimeout(timeoutId);
            if (error.name === "AbortError") {
                throw new Error("Request timeout");
            }
            throw error;
        });
};

export default function ServiceTrackingPage() {
    const [jobs, setJobs] = useState([]);
    const [machines, setMachines] = useState([]);
    const [now, setNow] = useState(Date.now());
    const [loading, setLoading] = useState(true);
    const [expandedJobs, setExpandedJobs] = useState({});
    const [error, setError] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const pollRef = useRef(null);
    const clockRef = useRef(null);
    const completedTimersRef = useRef(new Set());
    const activeTimersRef = useRef(new Map());

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Check if there are any active jobs (washing or drying)
    const hasActiveJobs = useMemo(() => {
        return jobs.some((job) => job.loads.some((load) => load.status === "WASHING" || load.status === "DRYING"));
    }, [jobs]);

    // Determine polling interval based on active jobs
    const getPollingInterval = () => {
        if (!autoRefresh) return null;
        return hasActiveJobs ? ACTIVE_POLLING_INTERVAL : POLLING_INTERVAL;
    };

    // Reset to first page when jobs change
    useEffect(() => {
        setCurrentPage(1);
    }, [jobs]);

    // Calculate pagination values
    const totalItems = jobs.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentItems = jobs.slice(startIndex, endIndex);

    const handlePageChange = (newPage) => {
        setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
    };

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    };

    // Fetch jobs with better error handling
    const fetchJobs = useCallback(async () => {
        try {
            const res = await fetchWithTimeout("http://localhost:8080/api/laundry-jobs");
            if (!res.ok) {
                if (res.status === 403) {
                    throw new Error("Access forbidden - please check your permissions");
                } else if (res.status === 401) {
                    throw new Error("Unauthorized - please login again");
                } else {
                    throw new Error(`Failed to fetch jobs: ${res.status} ${res.statusText}`);
                }
            }
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
                    pending: false,
                })),
            }));

            // Merge jobs safely by loadNumber, preserving timer state
            setJobs((prev) =>
                jobsWithLoads.map((newJob) => {
                    const oldJob = prev.find((j) => j.id === newJob.id);
                    if (!oldJob) return newJob;

                    return {
                        ...newJob,
                        loads: newJob.loads.map((newLoad) => {
                            const oldLoad = oldJob.loads.find((l) => l.loadNumber === newLoad.loadNumber);
                            if (!oldLoad) return { ...newLoad, status: normalizeStatus(newLoad.status) };

                            // Check if we have a preserved timer for this load
                            const timerKey = `${newJob.id}-${newLoad.loadNumber}`;
                            const preservedStartTime = activeTimersRef.current.get(timerKey);

                            return {
                                ...newLoad,
                                status: (() => {
                                    const flow = SERVICE_FLOWS[newJob.serviceType];
                                    const oldIdx = flow.indexOf(oldLoad.status);
                                    const newIdx = flow.indexOf(normalizeStatus(newLoad.status));
                                    return oldIdx > newIdx ? oldLoad.status : normalizeStatus(newLoad.status);
                                })(),
                                machineId: oldLoad.machineId ?? newLoad.machineId,
                                duration: oldLoad.duration ?? newLoad.duration,
                                startTime: preservedStartTime || oldLoad.startTime || newLoad.startTime,
                                pending: oldLoad.pending && oldLoad.status === normalizeStatus(newLoad.status) ? false : false,
                            };
                        }),
                    };
                }),
            );
            setError(null);
            return true;
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
            setError(err.message);
            return false;
        }
    }, []);

    const fetchMachines = async () => {
        try {
            const res = await fetchWithTimeout("http://localhost:8080/api/machines");
            if (!res.ok) {
                throw new Error(`Failed to fetch machines: ${res.status} ${res.statusText}`);
            }
            const data = await res.json();
            setMachines(data);
            return true;
        } catch (err) {
            console.error("Failed to fetch machines:", err);
            return false;
        }
    };

    const fetchData = async () => {
        if (isPolling || !autoRefresh) return;

        setIsPolling(true);
        try {
            const [jobsSuccess] = await Promise.all([fetchJobs(), fetchMachines()]);

            if (jobsSuccess) {
                setLoading(false);
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError(err.message);
            setLoading(false);
        } finally {
            setIsPolling(false);
        }
    };

    // Setup polling with dynamic interval
    useEffect(() => {
        const interval = getPollingInterval();

        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }

        if (interval) {
            pollRef.current = setInterval(() => {
                fetchData();
            }, interval);
        }

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
            }
        };
    }, [autoRefresh, hasActiveJobs]);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token || isTokenExpired(token)) {
            window.location.href = "/login";
            return;
        }

        // Initial data fetch
        fetchData();

        // Set up clock for UI updates
        clockRef.current = setInterval(() => setNow(Date.now()), 1000);

        return () => {
            clearInterval(clockRef.current);
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
            prev.map((j) =>
                getJobKey(j) === jobKey
                    ? {
                          ...j,
                          loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, machineId } : l)),
                      }
                    : j,
            ),
        );

        try {
            await fetchWithTimeout(
                `http://localhost:8080/api/laundry-jobs/${job.id}/assign-machine?loadNumber=${job.loads[loadIndex].loadNumber}&machineId=${machineId}`,
                { method: "PATCH" },
            );
            // Refresh data after action
            fetchData();
        } catch (err) {
            console.error("Failed to assign machine:", err);
        }
    };

    const updateDuration = async (jobKey, loadIndex, duration) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;

        setJobs((prev) =>
            prev.map((j) =>
                getJobKey(j) === jobKey
                    ? {
                          ...j,
                          loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, duration } : l)),
                      }
                    : j,
            ),
        );

        try {
            await fetchWithTimeout(
                `http://localhost:8080/api/laundry-jobs/${job.id}/update-duration?loadNumber=${job.loads[loadIndex].loadNumber}&durationMinutes=${duration}`,
                { method: "PATCH" },
            );
            // Refresh data after action
            fetchData();
        } catch (err) {
            console.error("Failed to update duration:", err);
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
            if (load.status === "UNWASHED") status = "WASHING";
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

        // Store the timer for preservation during refreshes
        const timerKey = `${job.id}-${load.loadNumber}`;
        activeTimersRef.current.set(timerKey, startTime);

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
            await fetchWithTimeout(
                `http://localhost:8080/api/laundry-jobs/${job.id}/start-load?loadNumber=${load.loadNumber}&durationMinutes=${duration}`,
                {
                    method: "PATCH",
                },
            );
            // Refresh data after action
            fetchData();
        } catch (err) {
            console.error("Failed to start load:", err);
        }
    };

    const advanceStatus = async (jobKey, loadIndex) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;

        const load = job.loads[loadIndex];
        const flow = SERVICE_FLOWS[job.serviceType];
        const currentIndex = flow.indexOf(load.status);
        const nextStatus = currentIndex < flow.length - 1 ? flow[currentIndex + 1] : load.status;

        // Remove timer tracking if this load was running
        if (load.status === "WASHING" || load.status === "DRYING") {
            const timerKey = `${job.id}-${load.loadNumber}`;
            activeTimersRef.current.delete(timerKey);
        }

        let updatedLoad = { ...load, status: nextStatus, pending: true };
        if (nextStatus === "FOLDING" && load.machineId) {
            updatedLoad.machineId = null;
        }

        setJobs((prev) =>
            prev.map((j) =>
                getJobKey(j) === jobKey
                    ? {
                          ...j,
                          loads: j.loads.map((l, idx) => (idx === loadIndex ? updatedLoad : l)),
                      }
                    : j,
            ),
        );

        try {
            await fetchWithTimeout(
                `http://localhost:8080/api/laundry-jobs/${job.id}/advance-load?loadNumber=${load.loadNumber}&status=${nextStatus}`,
                { method: "PATCH" },
            );

            setJobs((prev) =>
                prev.map((j) =>
                    getJobKey(j) === jobKey
                        ? {
                              ...j,
                              loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, pending: false } : l)),
                          }
                        : j,
                ),
            );

            if (nextStatus === "FOLDING" && load.machineId) {
                try {
                    await fetchWithTimeout(`http://localhost:8080/api/machines/${load.machineId}/release`, {
                        method: "PATCH",
                    });
                } catch (err) {
                    console.error("Failed to release machine:", err);
                }
            }

            // Refresh data after action
            fetchData();
        } catch (err) {
            console.error("Failed to advance load status:", err);
            fetchData();
        }
    };

    const startDryingAgain = async (jobKey, loadIndex) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;
        const load = job.loads[loadIndex];

        const startTime = new Date().toISOString();

        // Store the timer for preservation during refreshes
        const timerKey = `${job.id}-${load.loadNumber}`;
        activeTimersRef.current.set(timerKey, startTime);

        setJobs((prev) =>
            prev.map((j) =>
                getJobKey(j) === jobKey
                    ? {
                          ...j,
                          loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, status: "DRYING", startTime } : l)),
                      }
                    : j,
            ),
        );

        try {
            await fetchWithTimeout(`http://localhost:8080/api/laundry-jobs/${job.id}/dry-again?loadNumber=${load.loadNumber}`, { method: "PATCH" });
            // Refresh data after action
            fetchData();
        } catch (err) {
            console.error("Failed to start drying again:", err);
        }
    };

    const getMachineTypeForStep = (status, serviceType) => {
        if (serviceType === "Wash") return "WASHER";
        if (serviceType === "Dry") return "DRYER";
        if (serviceType === "Wash & Dry") {
            if (status === "UNWASHED" || status === "WASHING") return "WASHER";
            if (status === "WASHED" || status === "DRYING") return "DRYER";
        }
        return null;
    };

    const isLoadRunning = (load) => {
        const remaining = getRemainingTime(load);
        return remaining !== null && remaining > 0 && (load.status === "WASHING" || load.status === "DRYING");
    };

    // Track completed timers and refresh data when they finish
    useEffect(() => {
        const checkCompletedTimers = () => {
            let shouldRefresh = false;
            const completedTimers = new Set();

            jobs.forEach((job) => {
                job.loads.forEach((load) => {
                    if (isLoadRunning(load)) {
                        const remaining = getRemainingTime(load);
                        const timerKey = `${getJobKey(job)}-load${load.loadNumber}`;

                        if (remaining === 0 && !completedTimersRef.current.has(timerKey)) {
                            // Timer just completed - mark for refresh
                            completedTimersRef.current.add(timerKey);
                            shouldRefresh = true;
                        } else if (remaining > 0 && completedTimersRef.current.has(timerKey)) {
                            // Timer was reset - remove from completed set
                            completedTimersRef.current.delete(timerKey);
                        }

                        completedTimers.add(timerKey);
                    }
                });
            });

            // Clean up any stale completed timer references
            completedTimersRef.current.forEach((timerKey) => {
                if (!completedTimers.has(timerKey)) {
                    completedTimersRef.current.delete(timerKey);
                }
            });

            // Refresh data if any timers completed
            if (shouldRefresh) {
                fetchData();
            }
        };

        checkCompletedTimers();
    }, [jobs, now]);

    const machineOptions = useMemo(() => {
        const byType = { WASHER: [], DRYER: [] };
        machines.forEach((m) => {
            const t = (m.type || "")?.toString().toUpperCase();
            if (t === "WASHER") byType.WASHER.push(m);
            if (t === "DRYER") byType.DRYER.push(m);
        });
        return byType;
    }, [machines]);

    const toggleAutoRefresh = () => {
        setAutoRefresh(!autoRefresh);
    };

    if (loading) {
        return (
            <main className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <Lottie
                        animationData={loaderAnimation}
                        loop
                        style={{ width: 120, height: 120 }}
                    />
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Loading service data...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
                    <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Failed to Load Data</h2>
                    <p className="mb-4 text-slate-600 dark:text-slate-400">{error}</p>
                    <Button
                        onClick={fetchData}
                        className="mx-auto flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" /> Try Again
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <WashingMachine className="h-6 w-6 text-cyan-400" />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Service Tracking</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Switch
                            id="auto-refresh"
                            checked={autoRefresh}
                            onCheckedChange={toggleAutoRefresh}
                        />
                        <label
                            htmlFor="auto-refresh"
                            className="text-sm text-slate-600 dark:text-slate-400"
                        >
                            Auto Refresh
                        </label>
                    </div>
                </div>
            </div>

            <div className="rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80">
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Fabric</TableHead>
                            <TableHead>Detergent</TableHead>
                            <TableHead>Load</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Machine</TableHead>
                            <TableHead className="text-center">Duration</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={10}
                                    className="py-16"
                                >
                                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                                        <CheckCircle className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-500" />
                                        <p className="text-lg font-medium">No laundry jobs found</p>
                                        <p className="text-sm">All jobs have been completed or no jobs are scheduled.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentItems.map((job) => {
                                const jobKey = getJobKey(job);
                                const expanded = expandedJobs[jobKey] || false;
                                const visibleLoads = expanded ? job.loads : job.loads.slice(0, 1);

                                return (
                                    <React.Fragment key={jobKey}>
                                        {visibleLoads.map((load, i) => {
                                            const statusConfig = STATUS_ICONS[load.status] || STATUS_ICONS.UNWASHED;
                                            const remaining = getRemainingTime(load);
                                            const machineType = getMachineTypeForStep(load.status, job.serviceType);
                                            const options =
                                                machineType === "WASHER"
                                                    ? machineOptions.WASHER
                                                    : machineType === "DRYER"
                                                      ? machineOptions.DRYER
                                                      : [];

                                            return (
                                                <TableRow
                                                    key={`${jobKey}-load${i + 1}`}
                                                    className="border-t border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800/50"
                                                >
                                                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                                        {job.customerName}
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">
                                                        {job.contact ? maskContact(job.contact) : "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className="border-slate-300 capitalize text-slate-700 dark:border-slate-600 dark:text-slate-300"
                                                        >
                                                            {job.serviceType?.toLowerCase() || "—"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">
                                                        {Math.ceil(job.fabricQty ?? 0)}
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">
                                                        {Math.ceil(job.detergentQty ?? 0)}
                                                    </TableCell>
                                                    <TableCell className="text-slate-700 dark:text-slate-300">Load {load.loadNumber}</TableCell>
                                                    <TableCell>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <div className="flex items-center gap-2">
                                                                        <Lottie
                                                                            animationData={statusConfig.animation}
                                                                            loop
                                                                            style={{ width: 40, height: 40 }}
                                                                        />
                                                                        <span
                                                                            className={`font-semibold ${
                                                                                STATUS_LABEL_COLORS[load.status] || "text-gray-500"
                                                                            }`}
                                                                        >
                                                                            {statusConfig.label}
                                                                        </span>
                                                                        {load.pending && (
                                                                            <Lottie
                                                                                animationData={loaderAnimation}
                                                                                loop
                                                                                style={{ width: 24, height: 24 }}
                                                                            />
                                                                        )}
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
                                                        </TooltipProvider>
                                                    </TableCell>
                                                    <TableCell>
                                                        {!["FOLDING", "COMPLETED"].includes(load.status) && (
                                                            <Select
                                                                value={load.machineId ?? ""}
                                                                onValueChange={(val) => assignMachine(jobKey, i, val)}
                                                                disabled={
                                                                    isLoadRunning(load) || load.status === "FOLDING" || load.status === "COMPLETED"
                                                                }
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
                                                                                key={`${jobKey}-${i}-${m.id}`}
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
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {isLoadRunning(load) ? (
                                                            <span className="font-semibold text-blue-600">
                                                                {remaining < 60
                                                                    ? `${remaining}s`
                                                                    : `${Math.floor(remaining / 60)}m ${(remaining % 60)
                                                                          .toString()
                                                                          .padStart(2, "0")}s`}
                                                            </span>
                                                        ) : (
                                                            !(
                                                                (job.serviceType === "Wash & Dry" || job.serviceType === "Dry") &&
                                                                (load.status === "FOLDING" || load.status === "COMPLETED")
                                                            ) && (
                                                                <Select
                                                                    value={load.duration?.toString() ?? ""}
                                                                    onValueChange={(val) => updateDuration(jobKey, i, parseInt(val))}
                                                                    disabled={load.status === "FOLDING" || load.status === "COMPLETED"}
                                                                >
                                                                    <SelectTrigger className="mx-auto w-[120px] border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-950">
                                                                        <SelectValue placeholder="Duration" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                                                                        {[1, 20, 25, 30, 35, 40, 45, 50, 60].map((d) => (
                                                                            <SelectItem
                                                                                key={`${jobKey}-${i}-${d}`}
                                                                                value={d.toString()}
                                                                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                            >
                                                                                {d} mins
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            )
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {isLoadRunning(load) ? (
                                                            <div className="flex justify-end">
                                                                <div
                                                                    style={{
                                                                        width: 40,
                                                                        height: 40,
                                                                        display: "flex",
                                                                        justifyContent: "center",
                                                                        alignItems: "center",
                                                                        overflow: "hidden",
                                                                    }}
                                                                >
                                                                    <div style={{ transform: "scale(0.5)" }}>
                                                                        <Loader />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-end gap-2">
                                                                {load.status === "DRIED" ? (
                                                                    <>
                                                                        <DryAgainButton
                                                                            onClick={() => startDryingAgain(jobKey, i)}
                                                                            disabled={load.pending}
                                                                        />
                                                                        <ProceedToFoldingButton
                                                                            onClick={() => advanceStatus(jobKey, i)}
                                                                            disabled={load.pending}
                                                                        />
                                                                    </>
                                                                ) : job.serviceType === "Wash" && load.status === "WASHED" ? (
                                                                    <Button
                                                                        onClick={() => advanceStatus(jobKey, i)}
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                        size="sm"
                                                                    >
                                                                        <Check className="mr-1 h-4 w-4" /> Done
                                                                    </Button>
                                                                ) : ["UNWASHED", "WASHED"].includes(load.status) ? (
                                                                    <StartButton
                                                                        onClick={() => startAction(jobKey, i)}
                                                                        disabled={!load.machineId || load.pending}
                                                                    />
                                                                ) : ["DRYING", "FOLDING"].includes(load.status) ? (
                                                                    <NextButton
                                                                        onClick={() => advanceStatus(jobKey, i)}
                                                                        disabled={load.pending}
                                                                    />
                                                                ) : load.status === "COMPLETED" ? (
                                                                    <span className="flex items-center gap-1 text-green-600">
                                                                        <Check className="h-4 w-4" /> Done
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}

                                        {job.loads.length > 1 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={10}
                                                    className="p-2"
                                                >
                                                    <div className="flex justify-center">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setExpandedJobs((prev) => ({
                                                                    ...prev,
                                                                    [jobKey]: !expanded,
                                                                }))
                                                            }
                                                            className="flex items-center gap-1 text-blue-600 hover:underline"
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
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                {jobs.length > 0 && (
                    <div className="flex flex-col items-center justify-between border-t border-slate-300 p-4 dark:border-slate-700 sm:flex-row">
                        <div className="mb-4 flex items-center space-x-2 sm:mb-0">
                            <p className="text-sm text-slate-600 dark:text-slate-400">Rows per page</p>
                            <select
                                className="h-8 w-16 rounded-md border border-slate-300 bg-white text-sm dark:border-slate-600 dark:bg-slate-800"
                                value={itemsPerPage}
                                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                {startIndex + 1}-{endIndex} of {totalItems}
                            </div>

                            <div className="flex space-x-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
