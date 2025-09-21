import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
    WashingMachine,
    RefreshCw,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CheckCircle,
} from "lucide-react";
import TrackingTable from "./TrackingTable";
import { fetchWithTimeout, isTokenExpired, maskContact } from "./utils";
import SkeletonLoader from "./SkeletonLoader";

const POLLING_INTERVAL = 10000;
const ACTIVE_POLLING_INTERVAL = 5000;

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
    const completedTimersRef = useRef(new Set()); // Fixed: Added this line
    const activeTimersRef = useRef(new Map());

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const hasActiveJobs = useMemo(() => {
        return jobs.some((job) => job.loads.some((load) => load.status === "WASHING" || load.status === "DRYING"));
    }, [jobs]);

    const getPollingInterval = () => {
        if (!autoRefresh) return null;
        return hasActiveJobs ? ACTIVE_POLLING_INTERVAL : POLLING_INTERVAL;
    };

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

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages > 0 ? totalPages : 1);
        }
    }, [jobs, currentPage, totalPages]);

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
                    status: l.status?.toUpperCase() === "NOT_STARTED" ? "UNWASHED" : l.status?.toUpperCase() === "COMPLETED" ? "COMPLETED" : l.status?.toUpperCase(),
                    startTime: l.startTime || null,
                    endTime: l.endTime || null,
                    pending: false,
                })),
            }));

            setJobs((prev) =>
                jobsWithLoads.map((newJob) => {
                    const oldJob = prev.find((j) => j.id === newJob.id);
                    if (!oldJob) return newJob;

                    return {
                        ...newJob,
                        loads: newJob.loads.map((newLoad) => {
                            const oldLoad = oldJob.loads.find((l) => l.loadNumber === newLoad.loadNumber);
                            if (!oldLoad) return { ...newLoad };

                            const timerKey = `${newJob.id}-${newLoad.loadNumber}`;
                            const preservedStartTime = activeTimersRef.current.get(timerKey);

                            const flow = SERVICE_FLOWS[newJob.serviceType] || ["UNWASHED", "COMPLETED"];
                            const oldIdx = flow.indexOf(oldLoad.status);
                            const newIdx = flow.indexOf(newLoad.status);

                            const shouldUseOldStatus = oldIdx > newIdx && oldIdx !== -1 && newIdx !== -1;

                            return {
                                ...newLoad,
                                status: shouldUseOldStatus ? oldLoad.status : newLoad.status,
                                machineId: oldLoad.machineId ?? newLoad.machineId,
                                duration: oldLoad.duration ?? newLoad.duration,
                                startTime: preservedStartTime || oldLoad.startTime || newLoad.startTime,
                                pending: oldLoad.pending && oldLoad.status === newLoad.status ? false : false,
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

        fetchData();

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
            fetchData();
        } catch (err) {
            console.error("Failed to start load:", err);
        }
    };

    const advanceStatus = async (jobKey, loadIndex) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;

        const load = job.loads[loadIndex];
        const flow = SERVICE_FLOWS[job.serviceType] || ["UNWASHED", "COMPLETED"];
        const currentIndex = flow.indexOf(load.status);
        const nextStatus = currentIndex < flow.length - 1 ? flow[currentIndex + 1] : load.status;

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
                            completedTimersRef.current.add(timerKey);
                            shouldRefresh = true;
                        } else if (remaining > 0 && completedTimersRef.current.has(timerKey)) {
                            completedTimersRef.current.delete(timerKey);
                        }

                        completedTimers.add(timerKey);
                    }
                });
            });

            completedTimersRef.current.forEach((timerKey) => {
                if (!completedTimers.has(timerKey)) {
                    completedTimersRef.current.delete(timerKey);
                }
            });

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
        return <SkeletonLoader />;
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
            </div>

            <TooltipProvider>
                <TrackingTable
                    jobs={currentItems}
                    expandedJobs={expandedJobs}
                    setExpandedJobs={setExpandedJobs}
                    machines={machineOptions}
                    now={now}
                    assignMachine={assignMachine}
                    updateDuration={updateDuration}
                    startAction={startAction}
                    advanceStatus={advanceStatus}
                    startDryingAgain={startDryingAgain}
                    getJobKey={getJobKey}
                    getRemainingTime={getRemainingTime}
                    getMachineTypeForStep={getMachineTypeForStep}
                    isLoadRunning={isLoadRunning}
                    maskContact={maskContact}
                />
            </TooltipProvider>

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
        </main>
    );
}

const DEFAULT_DURATION = { washing: 35, drying: 40 };
const SERVICE_FLOWS = {
    Wash: ["UNWASHED", "WASHING", "WASHED", "COMPLETED"],
    Dry: ["UNWASHED", "DRYING", "DRIED", "FOLDING", "COMPLETED"],
    "Wash & Dry": ["UNWASHED", "WASHING", "WASHED", "DRYING", "DRIED", "FOLDING", "COMPLETED"],
};