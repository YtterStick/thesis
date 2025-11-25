import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
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
    Package,
    Clock,
} from "lucide-react";
import TrackingTable from "./TrackingTable";
import SkeletonLoader from "./SkeletonLoader";
import { maskContact } from "./utils";
import { api } from "@/lib/api-config";
import { useLocation } from "react-router-dom";

const TIMER_CHECK_INTERVAL = 1000;

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="flex min-h-screen items-center justify-center"
                    style={{
                        backgroundColor: this.props.isDarkMode ? "#0f172a" : "#f8fafc",
                    }}
                >
                    <div className="max-w-md p-8 text-center">
                        <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
                        <h2
                            className="mb-2 text-2xl font-bold"
                            style={{ color: this.props.isDarkMode ? "#f1f5f9" : "#0f172a" }}
                        >
                            Something went wrong
                        </h2>
                        <p
                            className="mb-4"
                            style={{ color: this.props.isDarkMode ? "#cbd5e1" : "#475569" }}
                        >
                            {this.state.error?.message || "An unexpected error occurred"}
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="rounded-lg bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

function ServiceTrackingContent() {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const location = useLocation();

    const [jobs, setJobs] = useState(globalCache.jobs || []);
    const [machines, setMachines] = useState(globalCache.machines || []);
    const [now, setNow] = useState(Date.now());
    const [loading, setLoading] = useState(!globalCache.jobs);
    const [expandedJobs, setExpandedJobs] = useState({});
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [smsStatus, setSmsStatus] = useState({});
    const [completedTodayCount, setCompletedTodayCount] = useState(globalCache.completedTodayCount || 0);

    const [globalLoading, setGlobalLoading] = useState(false);
    const [pendingRequests, setPendingRequests] = useState(new Set());

    const clockRef = useRef(null);
    const timerCheckRef = useRef(null);
    const completedTimersRef = useRef(new Set());
    const activeTimersRef = useRef(new Map());
    const requestQueueRef = useRef([]);
    const isProcessingRef = useRef(false);
    const lastNavigationTimeRef = useRef(Date.now());

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Add sorting state
    const [sortConfig, setSortConfig] = useState({
        key: "timeRemaining", // default sort by time remaining
        direction: "asc", // asc = soonest first
    });

    // FIXED: More accurate getRemainingTime function
    const getRemainingTime = useCallback((load) => {
        if (!load?.startTime || !load?.duration) return null;
        
        const start = new Date(load.startTime).getTime();
        const durationMs = load.duration * 60 * 1000; // Convert minutes to milliseconds
        const end = start + durationMs;
        const currentTime = Date.now();
        const remaining = Math.max(Math.floor((end - currentTime) / 1000), 0);
        
        return remaining;
    }, []);

    // Auto-sorting function
    const getSortedJobs = useCallback(
        (jobsToSort) => {
            if (!jobsToSort || jobsToSort.length === 0) return jobsToSort;

            return [...jobsToSort].sort((a, b) => {
                // Get the most urgent load for each job (lowest remaining time)
                const getMostUrgentLoad = (job) => {
                    if (!job.loads || job.loads.length === 0) return null;

                    return job.loads.reduce((mostUrgent, load) => {
                        if (load.status === "WASHING" || load.status === "DRYING") {
                            const remaining = getRemainingTime(load);
                            if (remaining !== null && remaining > 0) {
                                if (!mostUrgent || remaining < mostUrgent.remaining) {
                                    return { load, remaining };
                                }
                            }
                        }
                        return mostUrgent;
                    }, null);
                };

                const aUrgent = getMostUrgentLoad(a);
                const bUrgent = getMostUrgentLoad(b);

                // Jobs with running loads come first
                if (aUrgent && !bUrgent) return -1;
                if (!aUrgent && bUrgent) return 1;

                // Both have running loads - sort by remaining time
                if (aUrgent && bUrgent) {
                    return sortConfig.direction === "asc" ? aUrgent.remaining - bUrgent.remaining : bUrgent.remaining - aUrgent.remaining;
                }

                // Neither have running loads - maintain original order
                return 0;
            });
        },
        [sortConfig.direction, getRemainingTime],
    );

    // Apply sorting to jobs
    const sortedJobs = useMemo(() => {
        return getSortedJobs(jobs);
    }, [jobs, getSortedJobs]);

    // Update all references from 'jobs' to 'sortedJobs'
    const totalItems = sortedJobs.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentItems = sortedJobs.slice(startIndex, endIndex);

    // Add a function to get job urgency for display
    const getJobUrgency = (job) => {
        if (!job.loads || job.loads.length === 0) return null;

        let minRemaining = Infinity;
        let hasRunningLoads = false;

        job.loads.forEach((load) => {
            if (load.status === "WASHING" || load.status === "DRYING") {
                const remaining = getRemainingTime(load);
                if (remaining !== null && remaining > 0) {
                    hasRunningLoads = true;
                    minRemaining = Math.min(minRemaining, remaining);
                }
            }
        });

        if (!hasRunningLoads) return null;

        return {
            minutes: Math.floor(minRemaining / 60),
            seconds: minRemaining % 60,
            totalSeconds: minRemaining,
        };
    };

    const isComingFromTransaction = useMemo(() => {
        return (
            location.state?.fromTransaction ||
            document.referrer?.includes("/staff/transactions/new") ||
            location.state?.newJobCreated ||
            sessionStorage.getItem("shouldRefreshTracking")
        );
    }, [location]);

    // Add this function to update cache after important actions
    const updateCacheAfterAction = async () => {
        console.log("🔄 Updating cache after important action...");
        // Invalidate cache and force refresh in background
        globalCache.jobs = null;
        globalCache.lastFetchTime = null;

        // Refresh in background without blocking UI
        setTimeout(async () => {
            try {
                await fetchData(true);
                console.log("✅ Cache updated after action");
            } catch (error) {
                console.error("❌ Failed to update cache after action:", error);
            }
        }, 100);
    };

    const processQueue = useCallback(async () => {
        if (isProcessingRef.current || requestQueueRef.current.length === 0) return;

        isProcessingRef.current = true;
        setGlobalLoading(true);

        while (requestQueueRef.current.length > 0) {
            const request = requestQueueRef.current[0];
            try {
                await request.fn();
                requestQueueRef.current.shift();
            } catch (error) {
                console.error("Queue request failed:", error);
                requestQueueRef.current.shift();
            }
        }

        isProcessingRef.current = false;
        setGlobalLoading(false);
    }, []);

    const addToQueue = useCallback(
        (requestId, fn) => {
            return new Promise((resolve, reject) => {
                const request = {
                    id: requestId,
                    fn: async () => {
                        try {
                            setPendingRequests((prev) => new Set([...prev, requestId]));
                            const result = await fn();
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        } finally {
                            setPendingRequests((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(requestId);
                                return newSet;
                            });
                        }
                    },
                };

                requestQueueRef.current.push(request);
                processQueue();
            });
        },
        [processQueue],
    );

    const apiCallWithRetry = async (apiCall, maxRetries = 3, requestId = null) => {
        const executeCall = async (attempt = 0) => {
            try {
                if (requestId) {
                    setPendingRequests((prev) => new Set([...prev, requestId]));
                }

                const result = await apiCall();
                return result;
            } catch (error) {
                console.warn(`API call attempt ${attempt + 1} failed:`, error);

                if (attempt >= maxRetries - 1) {
                    throw error;
                }

                await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
                return executeCall(attempt + 1);
            } finally {
                if (requestId) {
                    setPendingRequests((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(requestId);
                        return newSet;
                    });
                }
            }
        };

        return executeCall();
    };

    const fetchCompletedTodayCount = useCallback(async () => {
        try {
            const count = await api.get("/laundry-jobs/completed-today-count");
            setCompletedTodayCount(count);
            globalCache.completedTodayCount = count;
            return count;
        } catch (err) {
            console.error("Failed to fetch completed today count:", err);
            setCompletedTodayCount(0);
            return 0;
        }
    }, []);

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

    const fetchJobs = useCallback(
        async (forceRefresh = false) => {
            if (
                globalCache.jobs &&
                !forceRefresh &&
                globalCache.lastFetchTime &&
                Date.now() - globalCache.lastFetchTime < globalCache.CACHE_DURATION
            ) {
                console.log("📦 Using cached jobs data");
                setJobs(globalCache.jobs);
                setError(null);
                return true;
            }

            try {
                const data = await api.get("/laundry-jobs");

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

                // Apply sorting immediately after fetching
                const sortedJobsWithLoads = getSortedJobs(jobsWithLoads);

                setJobs(sortedJobsWithLoads);
                globalCache.jobs = sortedJobsWithLoads;
                globalCache.lastFetchTime = Date.now();
                setError(null);
                return true;
            } catch (err) {
                console.error("Failed to fetch jobs:", err);
                setError(err.message);
                return false;
            }
        },
        [getSortedJobs],
    );

    const fetchMachines = async (forceRefresh = false) => {
        if (
            globalCache.machines &&
            !forceRefresh &&
            globalCache.lastFetchTime &&
            Date.now() - globalCache.lastFetchTime < globalCache.CACHE_DURATION
        ) {
            console.log("📦 Using cached machines data");
            setMachines(globalCache.machines);
            return true;
        }

        try {
            const data = await api.get("/machines");
            console.log("📦 Machines API Response:", data);
            setMachines(data);
            globalCache.machines = data;
            globalCache.lastFetchTime = Date.now();
            return true;
        } catch (err) {
            console.error("Failed to fetch machines:", err);
            return false;
        }
    };

    const fetchData = async (forceRefresh = false) => {
        setIsRefreshing(true);
        try {
            if (globalCache.jobs && !forceRefresh) {
                console.log("🚀 Using cached data, updating in background");
                setLoading(false);

                setTimeout(() => {
                    Promise.allSettled([fetchJobs(true), fetchMachines(true), fetchCompletedTodayCount()]).then(
                        ([jobsResult, machinesResult, completedResult]) => {
                            console.log("✅ Background data update completed");
                        },
                    );
                }, 1000);
            } else {
                const jobsSuccess = await fetchJobs(forceRefresh);

                if (jobsSuccess) {
                    setLoading(false);
                } else {
                    throw new Error("Failed to fetch jobs");
                }

                Promise.allSettled([fetchMachines(forceRefresh), fetchCompletedTodayCount()]).then(([machinesResult, completedCountResult]) => {
                    if (machinesResult.status === "fulfilled") {
                        console.log("✅ Machines loaded");
                    }
                    if (completedCountResult.status === "fulfilled") {
                        console.log("✅ Completed count loaded");
                    }
                });
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError(err.message);
            setLoading(false);
        } finally {
            setIsRefreshing(false);
        }
    };

    const fetchInitialData = async () => {
        const now = Date.now();

        if (sessionStorage.getItem("shouldRefreshTracking")) {
            console.log("🔄 Coming from transaction page - refreshing data");
            sessionStorage.removeItem("shouldRefreshTracking");
            setLoading(true);
            await fetchData(true);
            return;
        }

        if (isComingFromTransaction) {
            console.log("🔄 Coming from transaction page - refreshing data");
            setLoading(true);
            await fetchData(true);
            return;
        }

        if (globalCache.jobs && globalCache.lastFetchTime && now - globalCache.lastFetchTime < globalCache.CACHE_DURATION) {
            console.log("📦 Using cached data for instant load");
            setLoading(false);

            setTimeout(() => {
                fetchData(false);
            }, 500);
        } else {
            console.log("🔄 No valid cache - loading fresh data");
            setLoading(true);
            await fetchData(false);
        }
    };

    const clearCache = () => {
        globalCache.jobs = null;
        globalCache.machines = null;
        globalCache.completedTodayCount = null;
        globalCache.lastFetchTime = null;
        console.log("🗑️ Cache cleared");
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                const timeSinceLastNav = Date.now() - lastNavigationTimeRef.current;
                if (timeSinceLastNav > 30000) {
                    console.log("🔄 Page visible after 30s - refreshing data");
                    fetchData(false);
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        lastNavigationTimeRef.current = Date.now();
    }, [location]);

    const checkTimerCompletions = useCallback(() => {
        let needsRefresh = false;
        const currentTime = Date.now();

        jobs.forEach((job) => {
            job.loads?.forEach((load) => {
                if (load.status === "WASHING" || load.status === "DRYING") {
                    const timerKey = `${job.id}-${load.loadNumber}`;

                    if (load.startTime && load.duration) {
                        const endTime = new Date(load.startTime).getTime() + load.duration * 60000;
                        const timeRemaining = endTime - currentTime;

                        if (timeRemaining <= 1000 && !completedTimersRef.current.has(timerKey)) {
                            completedTimersRef.current.add(timerKey);
                            needsRefresh = true;
                        }

                        if (timeRemaining > 1000 && completedTimersRef.current.has(timerKey)) {
                            completedTimersRef.current.delete(timerKey);
                        }
                    }
                }
            });
        });

        if (needsRefresh) {
            setTimeout(() => {
                fetchData(true);
            }, 1000);
        }
    }, [jobs]);

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

    // FIXED: More precise timer interval
    useEffect(() => {
        const timerInterval = setInterval(() => {
            setNow(Date.now());
        }, 1000); // Update every second

        return () => clearInterval(timerInterval);
    }, []);

    useEffect(() => {
        fetchInitialData();

        clockRef.current = setInterval(() => setNow(Date.now()), 1000);

        return () => {
            clearInterval(clockRef.current);
            if (timerCheckRef.current) clearInterval(timerCheckRef.current);
        };
    }, [isComingFromTransaction]);

    const getJobKey = (job) => job.id ?? `${job.customerName}-${job.issueDate}`;

    const sendSmsNotification = async (job, serviceType) => {
        const jobKey = getJobKey(job);
        setSmsStatus((prev) => ({ ...prev, [jobKey]: "sending" }));

        try {
            await api.post("/send-completion-sms", {
                transactionId: job.id,
                customerName: job.customerName,
                phoneNumber: job.contact,
                serviceType: serviceType,
            });

            setSmsStatus((prev) => ({ ...prev, [jobKey]: "sent" }));
            setTimeout(() => {
                setSmsStatus((prev) => ({ ...prev, [jobKey]: null }));
            }, 3000);
        } catch (error) {
            console.error("Error sending SMS:", error);
            setSmsStatus((prev) => ({ ...prev, [jobKey]: "failed" }));
        }
    };

    // UPDATED: Simplified updateDuration without loading state
    const updateDuration = async (jobKey, loadIndex, duration, machineId = null) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;

        // If machineId is provided, auto-set duration based on machine type
        let finalDuration = duration;
        if (machineId && !duration) {
            const machine = machines.find((m) => m.id === machineId);
            if (machine) {
                if (machine.type?.toUpperCase() === "WASHER") {
                    finalDuration = 35; // 35 minutes for washers
                } else if (machine.type?.toUpperCase() === "DRYER") {
                    finalDuration = 40; // 40 minutes for dryers
                }
            }
        }

        // Update local state immediately for responsive UI
        setJobs((prev) =>
            prev.map((j) =>
                getJobKey(j) === jobKey
                    ? {
                          ...j,
                          loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, duration: finalDuration } : l)),
                      }
                    : j,
            ),
        );

        // Make API call in background without showing loading state
        try {
            await api.patch(`/laundry-jobs/${job.id}/update-duration?loadNumber=${job.loads[loadIndex].loadNumber}&durationMinutes=${finalDuration}`);
            console.log("✅ Duration updated successfully");
        } catch (err) {
            console.error("Failed to update duration:", err);
            // Revert local state if API call fails
            setJobs((prev) =>
                prev.map((j) =>
                    getJobKey(j) === jobKey
                        ? {
                              ...j,
                              loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, duration: job.loads[loadIndex].duration } : l)),
                          }
                        : j,
                ),
            );
        }
    };

    const assignMachine = async (jobKey, loadIndex, machineId) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;

        const requestId = `assign-machine-${job.id}-${job.loads[loadIndex].loadNumber}`;

        return addToQueue(requestId, async () => {
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
                await apiCallWithRetry(() =>
                    api.patch(`/laundry-jobs/${job.id}/assign-machine?loadNumber=${job.loads[loadIndex].loadNumber}&machineId=${machineId}`),
                );

                // AUTO-SET DEFAULT DURATION WHEN MACHINE IS ASSIGNED (NON-BLOCKING)
                if (machineId) {
                    const machine = machines.find((m) => m.id === machineId);
                    if (machine) {
                        let defaultDuration = null;
                        if (machine.type?.toUpperCase() === "WASHER") {
                            defaultDuration = 35;
                        } else if (machine.type?.toUpperCase() === "DRYER") {
                            defaultDuration = 40;
                        }

                        // Only set default if no duration is already set
                        const currentLoad = job.loads[loadIndex];
                        if (defaultDuration && (!currentLoad.duration || currentLoad.duration === 0)) {
                            // Set duration locally immediately for instant UI update
                            setJobs((prev) =>
                                prev.map((j) =>
                                    getJobKey(j) === jobKey
                                        ? {
                                              ...j,
                                              loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, duration: defaultDuration } : l)),
                                          }
                                        : j,
                                ),
                            );

                            // Update duration in background without blocking
                            setTimeout(async () => {
                                try {
                                    await api.patch(
                                        `/laundry-jobs/${job.id}/update-duration?loadNumber=${job.loads[loadIndex].loadNumber}&durationMinutes=${defaultDuration}`,
                                    );
                                    console.log("✅ Default duration set in background");
                                } catch (err) {
                                    console.error("Failed to set default duration:", err);
                                    // Revert local state if API call fails
                                    setJobs((prev) =>
                                        prev.map((j) =>
                                            getJobKey(j) === jobKey
                                                ? {
                                                      ...j,
                                                      loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, duration: null } : l)),
                                                  }
                                                : j,
                                        ),
                                    );
                                }
                            }, 100);
                        }
                    }
                }

                return { success: true };
            } catch (err) {
                console.error("Failed to assign machine:", err);
                // Revert local state if API call fails
                setJobs((prev) =>
                    prev.map((j) =>
                        getJobKey(j) === jobKey
                            ? {
                                  ...j,
                                  loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, machineId: null } : l)),
                              }
                            : j,
                    ),
                );
                throw err;
            }
        });
    };

    const checkAndFixMachineSync = async (jobKey, loadIndex) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;

        const load = job.loads[loadIndex];
        const normalizedServiceType = job.serviceType?.replace(" Only", "") || job.serviceType;
        const requiredMachineType = getMachineTypeForStep(load?.status, normalizedServiceType);

        const currentMachine = load?.machineId ? machines.find((m) => m.id === load.machineId) : null;

        if (currentMachine && requiredMachineType && currentMachine.type?.toUpperCase() !== requiredMachineType) {
            console.log(`Fixing wrong machine type: ${currentMachine.type} for status ${load.status}`);
            await assignMachine(jobKey, loadIndex, null);
        }
    };

    const startAction = async (jobKey, loadIndex) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;
        const load = job.loads[loadIndex];

        if (load?.pending || isLoadRunning(load) || globalLoading) {
            console.log("Start action prevented: load is pending, running, or global loading");
            return;
        }

        const requestId = `start-${job.id}-${load.loadNumber}`;

        return addToQueue(requestId, async () => {
            await checkAndFixMachineSync(jobKey, loadIndex);

            const normalizedServiceType = job.serviceType?.replace(" Only", "") || job.serviceType;
            let status = load.status;

            if (normalizedServiceType === "Wash") {
                if (load.status === "UNWASHED") status = "WASHING";
            } else if (normalizedServiceType === "Dry") {
                if (load.status === "UNWASHED") status = "DRYING";
            } else if (normalizedServiceType === "Wash & Dry") {
                if (load.status === "UNWASHED") status = "WASHING";
                else if (load.status === "WASHED") status = "DRYING";
            }

            const requiredMachineType = getMachineTypeForStep(status, normalizedServiceType);

            if (requiredMachineType) {
                const assignedMachine = machines.find((m) => m.id === load.machineId);
                const isCorrectMachineType = assignedMachine && (assignedMachine.type || "").toUpperCase() === requiredMachineType;

                if (!isCorrectMachineType) {
                    const machineTypeName = requiredMachineType === "WASHER" ? "washer" : "dryer";
                    throw new Error(`Please assign a ${machineTypeName} machine first.`);
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

            setJobs((prev) =>
                prev.map((j) =>
                    getJobKey(j) === jobKey
                        ? {
                              ...j,
                              loads: j.loads.map((l, idx) =>
                                  idx === loadIndex
                                      ? {
                                            ...l,
                                            pending: true,
                                        }
                                      : l,
                              ),
                          }
                        : j,
                ),
            );

            try {
                const startTime = new Date().toISOString();

                const timerKey = `${job.id}-${load.loadNumber}`;
                activeTimersRef.current.set(timerKey, startTime);
                completedTimersRef.current.delete(timerKey);

                await apiCallWithRetry(() =>
                    api.patch(`/laundry-jobs/${job.id}/start-load?loadNumber=${load.loadNumber}&durationMinutes=${duration}`),
                );

                setJobs((prev) =>
                    prev.map((j) =>
                        getJobKey(j) === jobKey
                            ? {
                                  ...j,
                                  loads: j.loads.map((l, idx) =>
                                      idx === loadIndex
                                          ? {
                                                ...l,
                                                status,
                                                startTime,
                                                duration,
                                                pending: false,
                                            }
                                          : l,
                                  ),
                              }
                            : j,
                    ),
                );

                // 🔄 ONLY refresh cache for important actions (Start)
                updateCacheAfterAction();

                return { success: true };
            } catch (err) {
                console.error("Failed to start load:", err);

                setJobs((prev) =>
                    prev.map((j) =>
                        getJobKey(j) === jobKey
                            ? {
                                  ...j,
                                  loads: j.loads.map((l, idx) =>
                                      idx === loadIndex
                                          ? {
                                                ...l,
                                                pending: false,
                                            }
                                          : l,
                                  ),
                              }
                            : j,
                    ),
                );
                throw err;
            }
        });
    };

    const advanceStatus = async (jobKey, loadIndex) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;

        const requestId = `advance-${job.id}-${job.loads[loadIndex].loadNumber}`;

        return addToQueue(requestId, async () => {
            const load = job.loads[loadIndex];
            const normalizedServiceType = job.serviceType?.replace(" Only", "") || job.serviceType;

            let flow;
            if (normalizedServiceType === "Wash") {
                flow = SERVICE_FLOWS.Wash;
            } else if (normalizedServiceType === "Dry") {
                flow = SERVICE_FLOWS.Dry;
            } else if (normalizedServiceType === "Wash & Dry") {
                flow = SERVICE_FLOWS["Wash & Dry"];
            } else {
                flow = ["UNWASHED", "COMPLETED"];
            }

            const currentIndex = flow.indexOf(load.status);
            const nextStatus = currentIndex < flow.length - 1 ? flow[currentIndex + 1] : load.status;

            const currentMachineId = load.machineId;

            if (load.status === "WASHING" || load.status === "DRYING") {
                const timerKey = `${job.id}-${load.loadNumber}`;
                activeTimersRef.current.delete(timerKey);
                completedTimersRef.current.delete(timerKey);
            }

            let updatedLoad = { ...load, status: nextStatus, pending: true };

            let shouldReleaseMachine = false;

            // FIXED: Release machine when moving to FOLDING or COMPLETED
            if (normalizedServiceType === "Wash") {
                if (load.status === "WASHING" && nextStatus === "WASHED") {
                    shouldReleaseMachine = true;
                }
            } else if (normalizedServiceType === "Dry") {
                if (load.status === "DRYING" && nextStatus === "DRIED") {
                    shouldReleaseMachine = false; // Keep machine for DRIED status
                } else if (load.status === "DRIED" && (nextStatus === "FOLDING" || nextStatus === "COMPLETED")) {
                    shouldReleaseMachine = true; // Release machine when moving to FOLDING or COMPLETED
                } else if (load.status === "DRYING" && (nextStatus === "FOLDING" || nextStatus === "COMPLETED")) {
                    shouldReleaseMachine = true; // Also handle direct transitions
                }
            } else if (normalizedServiceType === "Wash & Dry") {
                if (load.status === "WASHING" && nextStatus === "WASHED") {
                    shouldReleaseMachine = true; // Release washer when washing is done
                } else if (load.status === "DRYING" && nextStatus === "DRIED") {
                    shouldReleaseMachine = false; // Keep dryer for DRIED status
                } else if (load.status === "DRIED" && (nextStatus === "FOLDING" || nextStatus === "COMPLETED")) {
                    shouldReleaseMachine = true; // Release dryer when moving to FOLDING or COMPLETED
                } else if (load.status === "DRYING" && (nextStatus === "FOLDING" || nextStatus === "COMPLETED")) {
                    shouldReleaseMachine = true; // Also handle direct transitions
                }
            }

            // FIXED: Always release machine when moving to FOLDING or COMPLETED
            shouldReleaseMachine = shouldReleaseMachine || nextStatus === "FOLDING" || nextStatus === "COMPLETED";

            if (shouldReleaseMachine) {
                updatedLoad.machineId = null;
                console.log(`🔄 Releasing machine for load ${load.loadNumber} when moving from ${load.status} to ${nextStatus}`);
            } else {
                updatedLoad.machineId = currentMachineId;
                console.log(`🔒 Keeping machine assigned for load ${load.loadNumber} when moving from ${load.status} to ${nextStatus}`);
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
                await apiCallWithRetry(() => api.patch(`/laundry-jobs/${job.id}/advance-load?loadNumber=${load.loadNumber}&status=${nextStatus}`));

                if (shouldReleaseMachine && currentMachineId) {
                    try {
                        await apiCallWithRetry(() => api.patch(`/laundry-jobs/${job.id}/release-machine?loadNumber=${load.loadNumber}`));
                        console.log(
                            `✅ Machine ${currentMachineId} RELEASED for load ${load.loadNumber} when moving from ${load.status} to ${nextStatus}`,
                        );
                    } catch (releaseError) {
                        console.error("Failed to release machine:", releaseError);
                    }
                }

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

                // 🔄 ONLY refresh cache for important actions (Advance Status)
                updateCacheAfterAction();

                return { success: true };
            } catch (err) {
                console.error("Failed to advance load status:", err);
                setJobs((prev) =>
                    prev.map((j) =>
                        getJobKey(j) === jobKey
                            ? {
                                  ...j,
                                  loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, pending: false, machineId: currentMachineId } : l)),
                              }
                            : j,
                    ),
                );
                throw err;
            }
        });
    };

    const startDryingAgain = async (jobKey, loadIndex) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;
        const load = job.loads[loadIndex];

        if (load?.pending || globalLoading || load.status !== "DRIED") {
            console.log("Dry again prevented: load is pending, global loading, or not in DRIED status");
            return;
        }

        const requestId = `dry-again-${job.id}-${load.loadNumber}`;

        return addToQueue(requestId, async () => {
            setJobs((prev) =>
                prev.map((j) =>
                    getJobKey(j) === jobKey
                        ? {
                              ...j,
                              loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, pending: true, status: "DRYING" } : l)),
                          }
                        : j,
                ),
            );

            try {
                const startTime = new Date().toISOString();

                const timerKey = `${job.id}-${load.loadNumber}`;
                activeTimersRef.current.set(timerKey, startTime);
                completedTimersRef.current.delete(timerKey);

                await apiCallWithRetry(() => api.patch(`/laundry-jobs/${job.id}/dry-again?loadNumber=${load.loadNumber}`));

                setJobs((prev) =>
                    prev.map((j) =>
                        getJobKey(j) === jobKey
                            ? {
                                  ...j,
                                  loads: j.loads.map((l, idx) =>
                                      idx === loadIndex
                                          ? {
                                                ...l,
                                                status: "DRYING",
                                                startTime,
                                                pending: false,
                                                machineId: load.machineId,
                                                duration: load.duration || DEFAULT_DURATION.drying,
                                            }
                                          : l,
                                  ),
                              }
                            : j,
                    ),
                );

                console.log("✅ Dry Again successful:", { jobKey, loadNumber: load.loadNumber });

                // 🔄 ONLY refresh cache for important actions (Dry Again)
                updateCacheAfterAction();

                return { success: true };
            } catch (err) {
                console.error("❌ Failed to start drying again:", err);

                setJobs((prev) =>
                    prev.map((j) =>
                        getJobKey(j) === jobKey
                            ? {
                                  ...j,
                                  loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, pending: false, status: "DRIED" } : l)),
                              }
                            : j,
                    ),
                );

                console.log("⚠️ Dry Again failed - state reverted. Manual refresh may be needed.");
                throw err;
            }
        });
    };

    const getMachineTypeForStep = (status, serviceType) => {
        if (!status) return null;

        const normalizedServiceType = serviceType?.replace(" Only", "") || serviceType;

        if (normalizedServiceType === "Wash") {
            if (status === "UNWASHED" || status === "WASHING") return "WASHER";
            return null;
        }

        if (normalizedServiceType === "Dry") {
            if (status === "UNWASHED" || status === "DRYING" || status === "DRIED") return "DRYER";
            return null;
        }

        if (normalizedServiceType === "Wash & Dry") {
            if (status === "UNWASHED" || status === "WASHING") return "WASHER";
            if (status === "WASHED" || status === "DRYING" || status === "DRIED") return "DRYER";
        }

        return null;
    };

    const isLoadRunning = (load) => {
        const remaining = getRemainingTime(load);
        return remaining !== null && remaining > 0 && (load?.status === "WASHING" || load?.status === "DRYING");
    };

    const machineOptions = useMemo(() => {
        const byType = { WASHER: [], DRYER: [] };
        machines.forEach((m) => {
            const t = (m.type || "")?.toString().toUpperCase();
            if (t === "WASHER") byType.WASHER.push(m);
            if (t === "DRYER") byType.DRYER.push(m);
        });

        console.log("🔄 Machine Options:", {
            totalMachines: machines.length,
            washers: byType.WASHER.length,
            dryers: byType.DRYER.length,
            washerNames: byType.WASHER.map((w) => w.name),
            dryerNames: byType.DRYER.map((d) => d.name),
        });

        return byType;
    }, [machines]);

    const handleRefresh = () => {
        clearCache();
        fetchData(true);
    };

    if (loading) {
        return <SkeletonLoader />;
    }

    if (error) {
        return (
            <div
                className="min-h-screen space-y-5 overflow-visible px-6 pb-5 pt-4"
                style={{
                    backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-3"
                >
                    <WashingMachine
                        size={22}
                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                    />
                    <p
                        className="text-xl font-bold"
                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                    >
                        Service Tracking
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-52 items-center justify-center rounded-xl border-2 p-6"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}
                >
                    <div className="text-center">
                        <AlertCircle
                            className="mx-auto mb-3 h-14 w-14"
                            style={{ color: "#F87171" }}
                        />
                        <p
                            className="mb-1 text-base font-semibold"
                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                        >
                            Failed to load tracking data
                        </p>
                        <p
                            className="mb-4 text-sm"
                            style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                        >
                            {error}
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRefresh()}
                            className="mx-auto flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#0f172a" : "#0f172a",
                                color: "#f1f5f9",
                            }}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen space-y-5 overflow-visible px-6 pb-5 pt-4"
            style={{
                backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div className="flex items-center gap-3">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="rounded-lg p-2"
                        style={{
                            backgroundColor: isDarkMode ? "#1e293b" : "#0f172a",
                            color: isDarkMode ? "#f1f5f9" : "#f1f5f9",
                        }}
                    >
                        <WashingMachine size={22} />
                    </motion.div>
                    <div>
                        <p
                            className="text-xl font-bold"
                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                        >
                            Service Tracking
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                        >
                            Track and manage laundry service progress
                            {globalCache.lastFetchTime && (
                                <span className="ml-2 text-xs opacity-70">
                                    (Updated {Math.round((Date.now() - globalCache.lastFetchTime) / 1000)}s ago)
                                </span>
                            )}
                        </p>
                </div>
                </div>

                <div className="flex items-center gap-4">
                    {globalLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 text-sm"
                            style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                        >
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Processing...
                        </motion.div>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRefresh()}
                        disabled={globalLoading}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all disabled:opacity-50"
                        style={{
                            backgroundColor: isDarkMode ? "#0f172a" : "#0f172a",
                            color: "#f1f5f9",
                        }}
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </motion.button>
                </div>
            </motion.div>

            {/* Updated Dashboard Stats with Urgent Jobs */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
                {[
                    {
                        label: "Total Jobs",
                        value: jobs.length,
                        color: "#3DD9B6",
                        description: "Active laundry jobs",
                        icon: Package,
                    },
                    {
                        label: "Active Loads",
                        value: jobs.reduce(
                            (acc, job) => acc + (job.loads?.filter((load) => load.status === "WASHING" || load.status === "DRYING").length || 0),
                            0,
                        ),
                        color: "#60A5FA",
                        description: "Currently processing",
                        icon: WashingMachine,
                    },
                    {
                        label: "Urgent",
                        value: jobs.reduce((acc, job) => {
                            const urgency = getJobUrgency(job);
                            return acc + (urgency && urgency.totalSeconds < 300 ? 1 : 0);
                        }, 0),
                        color: "#EF4444",
                        description: "Less than 5 min remaining",
                        icon: Clock,
                    },
                    {
                        label: "Pending",
                        value: jobs.reduce((acc, job) => acc + (job.loads?.filter((load) => load.status === "UNWASHED").length || 0), 0),
                        color: "#FB923C",
                        description: "Waiting to start",
                        icon: AlertCircle,
                    },
                    {
                        label: "Completed Today",
                        value: completedTodayCount,
                        color: "#10B981",
                        description: "Finished loads today",
                        icon: CheckCircle,
                    },
                ].map(({ label, value, color, description, icon: Icon }, index) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{
                            scale: 1.03,
                            y: -2,
                            transition: { duration: 0.2 },
                        }}
                        className="cursor-pointer rounded-xl border-2 p-5 transition-all"
                        style={{
                            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                        }}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                className="rounded-lg p-2"
                                style={{
                                    backgroundColor: `${color}20`,
                                    color: color,
                                }}
                            >
                                <Icon size={26} />
                            </motion.div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.2 }}
                                className="text-right"
                            >
                                <p
                                    className="text-2xl font-bold"
                                    style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                >
                                    {value}
                                </p>
                            </motion.div>
                        </div>

                        <div>
                            <h3
                                className="mb-2 text-lg font-semibold"
                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                            >
                                {label}
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                            >
                                {description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <TooltipProvider>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <ErrorBoundary isDarkMode={isDarkMode}>
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
                            isDarkMode={isDarkMode}
                            globalLoading={globalLoading}
                            pendingRequests={pendingRequests}
                            getJobUrgency={getJobUrgency}
                            allMachines={machines} // Pass all machines for duration calculation
                        />
                    </ErrorBoundary>
                </motion.div>
            </TooltipProvider>

            {jobs.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-t p-4 sm:flex-row"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}
                >
                    <div className="mb-4 flex items-center space-x-2 sm:mb-0">
                        <p
                            className="text-sm"
                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                        >
                            Rows per page
                        </p>
                        <select
                            className="h-8 rounded-md border-2 text-sm transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                color: isDarkMode ? "#f1f5f9" : "#0f172a",
                            }}
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(e.target.value)}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>

                    <div className="space-x=2 flex items-center">
                        <div
                            className="text-sm font-medium"
                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                        >
                            {startIndex + 1}-{endIndex} of {totalItems}
                        </div>

                        <div className="flex space-x-1">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                                className="rounded-lg p-2 transition-all disabled:opacity-50"
                                style={{
                                    backgroundColor: isDarkMode ? "#0f172a" : "#0f172a",
                                    color: "#f1f5f9",
                                }}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="rounded-lg p-2 transition-all disabled:opacity-50"
                                style={{
                                    backgroundColor: isDarkMode ? "#0f172a" : "#0f172a",
                                    color: "#f1f5f9",
                                }}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="rounded-lg p-2 transition-all disabled:opacity-50"
                                style={{
                                    backgroundColor: isDarkMode ? "#0f172a" : "#0f172a",
                                    color: "#f1f5f9",
                                }}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                                className="rounded-lg p-2 transition-all disabled:opacity-50"
                                style={{
                                    backgroundColor: isDarkMode ? "#0f172a" : "#0f172a",
                                    color: "#f1f5f9",
                                }}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

const DEFAULT_DURATION = { washing: 35, drying: 40 };
const SERVICE_FLOWS = {
    Wash: ["UNWASHED", "WASHING", "WASHED", "COMPLETED"],
    Dry: ["UNWASHED", "DRYING", "DRIED", "FOLDING", "COMPLETED"],
    "Wash & Dry": ["UNWASHED", "WASHING", "WASHED", "DRYING", "DRIED", "FOLDING", "COMPLETED"],
};

// Cache store outside component to persist between navigations
const globalCache = {
    jobs: null,
    machines: null,
    completedTodayCount: null,
    lastFetchTime: null,
    CACHE_DURATION: 2 * 60 * 1000, // 2 minutes cache
};

export default function ServiceTrackingPage() {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    return (
        <ErrorBoundary isDarkMode={isDarkMode}>
            <ServiceTrackingContent />
        </ErrorBoundary>
    );
}