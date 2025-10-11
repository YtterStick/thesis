import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Switch } from "@/components/ui/switch";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WashingMachine, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle, Package } from "lucide-react";
import TrackingTable from "./TrackingTable";
import SkeletonLoader from "./SkeletonLoader";
import { fetchWithTimeout, isTokenExpired, maskContact } from "./utils";

const POLLING_INTERVAL = 10000;
const ACTIVE_POLLING_INTERVAL = 5000;
const TIMER_CHECK_INTERVAL = 1000;

export default function ServiceTrackingPage() {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

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

    // Setup timer check interval
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

    const sendSmsNotification = async (job, serviceType) => {
        const jobKey = getJobKey(job);
        setSmsStatus((prev) => ({ ...prev, [jobKey]: "sending" }));

        try {
            const response = await fetchWithTimeout("http://localhost:8080/api/send-completion-sms", {
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
                `http://localhost:8080/api/laundry-jobs/${job.id}/assign-machine?loadNumber=${job.loads[loadIndex].loadNumber}&machineId=${machineId}`,
                { method: "PATCH" },
            );
        } catch (err) {
            console.error("Failed to assign machine:", err);
            fetchData(true);
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
        } catch (err) {
            console.error("Failed to update duration:", err);
            fetchData(true);
        }
    };

    const startAction = async (jobKey, loadIndex) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;
        const load = job.loads[loadIndex];

        // Normalize service type - treat "Wash Only" as "Wash" and "Dry Only" as "Dry"
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

        // Get the required machine type for the NEXT step
        const requiredMachineType = getMachineTypeForStep(status, normalizedServiceType);

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
                `http://localhost:8080/api/laundry-jobs/${job.id}/start-load?loadNumber=${load.loadNumber}&durationMinutes=${duration}`,
                {
                    method: "PATCH",
                },
            );
        } catch (err) {
            console.error("Failed to start load:", err);
            fetchData(true);
        }
    };

    const advanceStatus = async (jobKey, loadIndex) => {
        const job = jobs.find((j) => getJobKey(j) === jobKey);
        if (!job?.id) return;

        const load = job.loads[loadIndex];

        // Normalize service type - treat "Wash Only" as "Wash" and "Dry Only" as "Dry"
        const normalizedServiceType = job.serviceType?.replace(" Only", "") || job.serviceType;

        // Get the appropriate flow based on normalized service type
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

            // Send SMS notification when job is completed
            if (nextStatus === "COMPLETED") {
                sendSmsNotification(job, normalizedServiceType);
            }
        } catch (err) {
            console.error("Failed to advance load status:", err);
            fetchData(true);
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
            await fetchWithTimeout(`http://localhost:8080/api/laundry-jobs/${job.id}/dry-again?loadNumber=${load.loadNumber}`, { method: "PATCH" });
        } catch (err) {
            console.error("Failed to start drying again:", err);
            fetchData(true);
        }
    };

    const getMachineTypeForStep = (status, serviceType) => {
        // Normalize service type - treat "Wash Only" as "Wash" and "Dry Only" as "Dry"
        const normalizedServiceType = serviceType?.replace(" Only", "") || serviceType;

        if (normalizedServiceType === "Wash") return "WASHER";
        if (normalizedServiceType === "Dry") return "DRYER";
        if (normalizedServiceType === "Wash & Dry") {
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
            <div className="space-y-5 overflow-visible px-6 pb-5 pt-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-3"
                >
                    <WashingMachine
                        size={22}
                        style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}
                    />
                    <p
                        className="text-xl font-bold"
                        style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}
                    >
                        Service Tracking
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-52 items-center justify-center rounded-xl border-2 p-6"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                >
                    <div className="text-center">
                        <AlertCircle
                            className="mx-auto mb-3 h-14 w-14"
                            style={{ color: "#F87171" }}
                        />
                        <p
                            className="mb-1 text-base font-semibold"
                            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                        >
                            Failed to load tracking data
                        </p>
                        <p
                            className="mb-4 text-sm"
                            style={{ color: isDarkMode ? "#6B7280" : "#0B2B26" }}
                        >
                            {error}
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fetchData(true)}
                            className="mx-auto flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                color: "#F3EDE3",
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
        <div className="space-y-5 overflow-visible px-6 pb-5 pt-4">
            {/* Header */}
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
                            backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                            color: "#F3EDE3",
                        }}
                    >
                        <WashingMachine size={22} />
                    </motion.div>
                    <div>
                        <p
                            className="text-xl font-bold"
                            style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}
                        >
                            Service Tracking
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: isDarkMode ? "#F3EDE3/70" : "#0B2B26/70" }}
                        >
                            Track and manage laundry service progress
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={autoRefresh}
                            onCheckedChange={toggleAutoRefresh}
                        />
                        <span
                            className="text-sm"
                            style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}
                        >
                            Auto-refresh
                        </span>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fetchData(true)}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all"
                        style={{
                            backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                            color: "#F3EDE3",
                        }}
                    >
                        <RefreshCw className={`h-4 w-4 ${isPolling ? "animate-spin" : ""}`} />
                        Refresh
                    </motion.button>
                </div>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Total Jobs",
                        value: jobs.length,
                        color: "#3DD9B6",
                        description: "Active laundry jobs",
                    },
                    {
                        label: "Active Loads",
                        value: jobs.reduce(
                            (acc, job) => acc + job.loads.filter((load) => load.status === "WASHING" || load.status === "DRYING").length,
                            0,
                        ),
                        color: "#60A5FA",
                        description: "Currently processing",
                    },
                    {
                        label: "Pending",
                        value: jobs.reduce((acc, job) => acc + job.loads.filter((load) => load.status === "UNWASHED").length, 0),
                        color: "#FB923C",
                        description: "Waiting to start",
                    },
                    {
                        label: "Completed Today",
                        value: jobs.reduce((acc, job) => acc + job.loads.filter((load) => load.status === "COMPLETED").length, 0),
                        color: "#10B981",
                        description: "Finished loads",
                    },
                ].map(({ label, value, color, description }, index) => (
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
                            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
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
                                <Package size={26} />
                            </motion.div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.2 }}
                                className="text-right"
                            >
                                <p
                                    className="text-2xl font-bold"
                                    style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                >
                                    {value}
                                </p>
                            </motion.div>
                        </div>

                        <div>
                            <h3
                                className="mb-2 text-lg font-semibold"
                                style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                            >
                                {label}
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/80" }}
                            >
                                {description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Tracking Table */}
            <TooltipProvider>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <TrackingTable
                        jobs={currentItems}
                        expandedJobs={expandedJobs}
                        setExpandedJobs={setExpandedJobs}
                        machines={machineOptions}
                        now={now}
                        assignMachine={assignMachine}
                        updateDuration={updateDuration}
                        startAction={startAction}
                        advanceStatus={advanceStatus} // Make sure this is passed correctly
                        startDryingAgain={startDryingAgain}
                        getJobKey={getJobKey}
                        getRemainingTime={getRemainingTime}
                        getMachineTypeForStep={getMachineTypeForStep}
                        isLoadRunning={isLoadRunning}
                        maskContact={maskContact}
                        smsStatus={smsStatus}
                        sendSmsNotification={sendSmsNotification}
                        isDarkMode={isDarkMode}
                    />
                </motion.div>
            </TooltipProvider>

            {/* Pagination */}
            {jobs.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-t p-4 sm:flex-row"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                >
                    <div className="mb-4 flex items-center space-x-2 sm:mb-0">
                        <p
                            className="text-sm"
                            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                        >
                            Rows per page
                        </p>
                        <select
                            className="h-8 rounded-md border-2 text-sm transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                color: isDarkMode ? "#13151B" : "#0B2B26",
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

                    <div className="flex items-center space-x-2">
                        <div
                            className="text-sm font-medium"
                            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
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
                                    backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                    color: "#F3EDE3",
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
                                    backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                    color: "#F3EDE3",
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
                                    backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                    color: "#F3EDE3",
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
                                    backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                    color: "#F3EDE3",
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
