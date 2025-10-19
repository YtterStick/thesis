import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WashingMachine, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle } from "lucide-react";
import TrackingTable from "./TrackingTable";
import { fetchWithTimeout, isTokenExpired, maskContact } from "./utils";
import SkeletonLoader from "./SkeletonLoader";

const POLLING_INTERVAL = 10000;
const ACTIVE_POLLING_INTERVAL = 5000;
const TIMER_CHECK_INTERVAL = 1000; // Check timers every second

// Base URL for Render backend
const BASE_URL = "https://thesis-g0pr.onrender.com";

export default function ServiceTrackingPage() {
    const [jobs, setJobs] = useState([]);
    const [machines, setMachines] = useState([]);
    const [now, setNow] = useState(Date.now());
    const [loading, setLoading] = useState(true);
    const [expandedJobs, setExpandedJobs] = useState({});
    const [error, setError] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [smsStatus, setSmsStatus] = useState({});
    const pollRef = useRef(null);
    const clockRef = useRef(null);
    const timerCheckRef = useRef(null);
    const completedTimersRef = useRef(new Set());
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
            const res = await fetchWithTimeout(`${BASE_URL}/api/laundry-jobs`);
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
                    status:
                        l.status?.toUpperCase() === "NOT_STARTED"
                            ? "UNWASHED"
                            : l.status?.toUpperCase() === "COMPLETED"
                              ? "COMPLETED"
                              : l.status?.toUpperCase(),
                    startTime: l.startTime || null,
                    endTime: l.endTime || null,
                    pending: false,
                })),
            }));

            setJobs(jobsWithLoads);
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
            const res = await fetchWithTimeout(`${BASE_URL}/api/machines`);
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

    const fetchData = async (force = false) => {
        if ((isPolling && !force) || !autoRefresh) return;

        setIsPolling(true);
        try {
            const [jobsSuccess, machinesSuccess] = await Promise.allSettled([fetchJobs(), fetchMachines()]);

            if (jobsSuccess.status === "fulfilled" && jobsSuccess.value) {
                setLoading(false);
            } else if (jobsSuccess.status === "rejected") {
                throw new Error(jobsSuccess.reason?.message || "Failed to fetch jobs");
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError(err.message);
            setLoading(false);
        } finally {
            setIsPolling(false);
        }
    };

    // Improved timer completion detection
    // Replace the checkTimerCompletions function with this improved version:
    const checkTimerCompletions = useCallback(() => {
        let needsRefresh = false;
        const currentTime = Date.now();

        jobs.forEach((job) => {
            job.loads.forEach((load) => {
                if (load.status === "WASHING" || load.status === "DRYING") {
                    const timerKey = `${job.id}-${load.loadNumber}`;

                    if (load.startTime && load.duration) {
                        const endTime = new Date(load.startTime).getTime() + load.duration * 60000;
                        const timeRemaining = endTime - currentTime;

                        // If timer completed (with 1-second buffer) but not yet marked as completed
                        if (timeRemaining <= 1000 && !completedTimersRef.current.has(timerKey)) {
                            completedTimersRef.current.add(timerKey);
                            needsRefresh = true;
                            console.log(`Timer completed for ${job.customerName} load ${load.loadNumber}, refreshing in 1 second...`);
                        }

                        // If timer is still running but was marked as completed, remove it
                        if (timeRemaining > 1000 && completedTimersRef.current.has(timerKey)) {
                            completedTimersRef.current.delete(timerKey);
                        }
                    }
                }
            });
        });

        if (needsRefresh) {
            // Wait 1 second before refreshing to ensure backend has processed the status change
            setTimeout(() => {
                console.log("Refreshing data after timer completion...");
                fetchData(true); // Force refresh
            }, 1000);
        }
    }, [jobs]);

    // Setup polling interval
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
    }, [autoRefresh, hasActiveJobs, fetchData]);

    // Setup timer check interval (runs every second)
    useEffect(() => {
        if (timerCheckRef.current) {
            clearInterval(timerCheckRef.current);
        }

        timerCheckRef.current = setInterval(() => {
            checkTimerCompletions();
        }, TIMER_CHECK_INTERVAL);

        return () => {
            if (timerCheckRef.current) {
                clearInterval(timerCheckRef.current);
            }
        };
    }, [checkTimerCompletions]);

    // Setup clock and initial data fetch
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
            if (timerCheckRef.current) clearInterval(timerCheckRef.current);
        };
    }, []);

    const getJobKey = (job) => job.id ?? `${job.customerName}-${job.issueDate}`;

    const getRemainingTime = (load) => {
        if (!load.startTime || !load.duration) return null;
        const end = new Date(load.startTime).getTime() + load.duration * 60000;
        return Math.max(Math.floor((end - now) / 1000), 0);
    };

    // Add SMS notification function
    const sendSmsNotification = async (job, serviceType) => {
        const jobKey = getJobKey(job);
        setSmsStatus((prev) => ({ ...prev, [jobKey]: "sending" }));

        try {
            const response = await fetchWithTimeout(`${BASE_URL}/api/send-completion-sms`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    transactionId: job.id,
                    customerName: job.customerName,
                    phoneNumber: job.contact,
                    serviceType: serviceType,
                }),
            });

            if (response.ok) {
                setSmsStatus((prev) => ({ ...prev, [jobKey]: "sent" }));
                setTimeout(() => {
                    setSmsStatus((prev) => ({ ...prev, [jobKey]: null }));
                }, 3000);
            } else {
                setSmsStatus((prev) => ({ ...prev, [jobKey]: "failed" }));
            }
        } catch (error) {
            console.error("Error sending SMS:", error);
            setSmsStatus((prev) => ({ ...prev, [jobKey]: "failed" }));
        }
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
                `${BASE_URL}/api/laundry-jobs/${job.id}/assign-machine?loadNumber=${job.loads[loadIndex].loadNumber}&machineId=${machineId}`,
                { method: "PATCH" },
            );
            // Don't immediately fetch data - let polling handle it
        } catch (err) {
            console.error("Failed to assign machine:", err);
            fetchData(true); // Force refresh on error
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
                `${BASE_URL}/api/laundry-jobs/${job.id}/update-duration?loadNumber=${job.loads[loadIndex].loadNumber}&durationMinutes=${duration}`,
                { method: "PATCH" },
            );
            // Don't immediately fetch data - let polling handle it
        } catch (err) {
            console.error("Failed to update duration:", err);
            fetchData(true); // Force refresh on error
        }
    };

    const startAction = async (jobKey, loadIndex) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;
        const load = job.loads[loadIndex];

        // Determine the next status first
        let status = load.status;
        if (job.serviceType === "Wash") {
            if (load.status === "UNWASHED") status = "WASHING";
        } else if (job.serviceType === "Dry") {
            if (load.status === "UNWASHED") status = "DRYING";
        } else if (job.serviceType === "Wash & Dry") {
            if (load.status === "UNWASHED") status = "WASHING";
            else if (load.status === "WASHED") status = "DRYING";
        }

        // Get the required machine type for the NEXT step
        const requiredMachineType = getMachineTypeForStep(status, job.serviceType);

        // Check if the assigned machine matches the required type
        if (requiredMachineType) {
            const assignedMachine = machines.find((m) => m.id === load.machineId);
            const isCorrectMachineType = assignedMachine && (assignedMachine.type || "").toUpperCase() === requiredMachineType;

            if (!isCorrectMachineType) {
                const machineTypeName = requiredMachineType === "WASHER" ? "washer" : "dryer";
                return alert(`Please assign a ${machineTypeName} machine first.`);
            }
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
        // Remove from completed timers if it was there
        completedTimersRef.current.delete(timerKey);

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
                `${BASE_URL}/api/laundry-jobs/${job.id}/start-load?loadNumber=${load.loadNumber}&durationMinutes=${duration}`,
                {
                    method: "PATCH",
                },
            );
            // Don't immediately fetch data - let polling handle it
        } catch (err) {
            console.error("Failed to start load:", err);
            fetchData(true); // Force refresh on error
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
            completedTimersRef.current.delete(timerKey);
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
                `${BASE_URL}/api/laundry-jobs/${job.id}/advance-load?loadNumber=${load.loadNumber}&status=${nextStatus}`,
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
                    await fetchWithTimeout(`${BASE_URL}/api/machines/${load.machineId}/release`, {
                        method: "PATCH",
                    });
                } catch (err) {
                    console.error("Failed to release machine:", err);
                }
            }

            // Send SMS notification when job is completed
            if (nextStatus === "COMPLETED") {
                console.log("🎯 Load completed, triggering SMS for job:", job);
                sendSmsNotification(job, job.serviceType);
            }

            // Don't immediately fetch data - let polling handle it
        } catch (err) {
            console.error("Failed to advance load status:", err);
            fetchData(true); // Force refresh on error
        }
    };

    const startDryingAgain = async (jobKey, loadIndex) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;
        const load = job.loads[loadIndex];

        const startTime = new Date().toISOString();

        const timerKey = `${job.id}-${load.loadNumber}`;
        activeTimersRef.current.set(timerKey, startTime);
        completedTimersRef.current.delete(timerKey);

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
            await fetchWithTimeout(`${BASE_URL}/api/laundry-jobs/${job.id}/dry-again?loadNumber=${load.loadNumber}`, { method: "PATCH" });
            // Don't immediately fetch data - let polling handle it
        } catch (err) {
            console.error("Failed to start drying again:", err);
            fetchData(true); // Force refresh on error
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
                        onClick={() => fetchData(true)}
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
                            checked={autoRefresh}
                            onCheckedChange={toggleAutoRefresh}
                        />
                    </div>
                    <Button
                        onClick={() => fetchData(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isPolling ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
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
                    smsStatus={smsStatus}
                    sendSmsNotification={sendSmsNotification}
                />
            </TooltipProvider>

            {/* Rest of your component remains the same */}
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