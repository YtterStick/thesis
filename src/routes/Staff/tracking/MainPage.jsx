import React, { useEffect, useMemo, useRef, useState } from "react";
import { WashingMachine, Check, ArrowDown, ArrowUp } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Lottie from "lottie-react";

import washingAnimation from "@/assets/lottie/washing-machine.json";
import unwashedAnimation from "@/assets/lottie/unwashed.json";
import dryingAnimation from "@/assets/lottie/dryer-machine.json";
import foldingAnimation from "@/assets/lottie/clothes.json";
import loader from "@/assets/lottie/loader.json";

const DEFAULT_DURATION = { washing: 35, drying: 40 };
const ALLOWED_SKEW_MS = 5000;

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
  "Wash & Dry": [
    "UNWASHED",
    "WASHING",
    "WASHED",
    "DRYING",
    "DRIED",
    "FOLDING",
    "COMPLETED",
  ],
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

export default function ServiceTrackingPage() {
  const [jobs, setJobs] = useState([]);
  const [machines, setMachines] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [expandedJobs, setExpandedJobs] = useState({});
  const pollRef = useRef(null);

  // Fetch jobs
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
          pending: false,
        })),
      }));

      // merge jobs safely by loadNumber
      setJobs((prev) =>
        jobsWithLoads.map((newJob) => {
          const oldJob = prev.find((j) => j.id === newJob.id);
          if (!oldJob) return newJob;

          return {
            ...newJob,
            loads: newJob.loads.map((newLoad) => {
              const oldLoad = oldJob.loads.find(
                (l) => l.loadNumber === newLoad.loadNumber
              );
              if (!oldLoad)
                return { ...newLoad, status: normalizeStatus(newLoad.status) };

              return {
                ...newLoad,
                status: (() => {
                  const flow = SERVICE_FLOWS[newJob.serviceType];
                  const oldIdx = flow.indexOf(oldLoad.status);
                  const newIdx = flow.indexOf(normalizeStatus(newLoad.status));
                  return oldIdx > newIdx
                    ? oldLoad.status
                    : normalizeStatus(newLoad.status);
                })(),
                machineId: oldLoad.machineId ?? newLoad.machineId,
                duration: oldLoad.duration ?? newLoad.duration,
                startTime: oldLoad.startTime ?? newLoad.startTime,
                pending:
                  oldLoad.pending &&
                  oldLoad.status === normalizeStatus(newLoad.status)
                    ? false // clear pending once server caught up
                    : false,
              };
            }),
          };
        })
      );
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
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

  const getJobKey = (job) =>
    job.id ?? `${job.customerName}-${job.issueDate}`;
  const getRemainingTime = (load) => {
    if (!load.startTime || !load.duration) return null;
    const end =
      new Date(load.startTime).getTime() + load.duration * 60000;
    return Math.max(Math.floor((end - now) / 1000), 0);
  };

  const assignMachine = (jobKey, loadIndex, machineId) => {
    const job = jobs.find((j) => getJobKey(j) === jobKey);
    if (!job?.id) return;

    setJobs((prev) =>
      prev.map((j) =>
        getJobKey(j) === jobKey
          ? {
              ...j,
              loads: j.loads.map((l, idx) =>
                idx === loadIndex ? { ...l, machineId } : l
              ),
            }
          : j
      )
    );

    fetch(
      `http://localhost:8080/api/laundry-jobs/${job.id}/assign-machine?loadNumber=${job.loads[loadIndex].loadNumber}&machineId=${machineId}`,
      { method: "PATCH" }
    ).catch((err) => console.error("Failed to assign machine:", err));
  };

  const updateDuration = (jobKey, loadIndex, duration) => {
    const job = jobs.find((j) => getJobKey(j) === jobKey);
    if (!job?.id) return;

    setJobs((prev) =>
      prev.map((j) =>
        getJobKey(j) === jobKey
          ? {
              ...j,
              loads: j.loads.map((l, idx) =>
                idx === loadIndex ? { ...l, duration } : l
              ),
            }
          : j
      )
    );

    fetch(
      `http://localhost:8080/api/laundry-jobs/${job.id}/update-duration?loadNumber=${job.loads[loadIndex].loadNumber}&durationMinutes=${duration}`,
      { method: "PATCH" }
    ).catch((err) => console.error("Failed to update duration:", err));
  };

  const startAction = (jobKey, loadIndex) => {
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

    setJobs((prev) =>
      prev.map((j) =>
        getJobKey(j) === jobKey
          ? {
              ...j,
              loads: j.loads.map((l, idx) =>
                idx === loadIndex
                  ? { ...l, status, startTime, duration }
                  : l
              ),
            }
          : j
      )
    );

    fetch(
      `http://localhost:8080/api/laundry-jobs/${job.id}/start-load?loadNumber=${load.loadNumber}&durationMinutes=${duration}`,
      { method: "PATCH" }
    ).catch((err) => console.error("Failed to start load:", err));
  };

  const advanceStatus = (jobKey, loadIndex) => {
    const job = jobs.find((j) => getJobKey(j) === jobKey);
    if (!job?.id) return;

    const load = job.loads[loadIndex];
    const flow = SERVICE_FLOWS[job.serviceType];
    const currentIndex = flow.indexOf(load.status);
    const nextStatus =
      currentIndex < flow.length - 1 ? flow[currentIndex + 1] : load.status;

    // optimistic update
    setJobs((prev) =>
      prev.map((j) =>
        getJobKey(j) === jobKey
          ? {
              ...j,
              loads: j.loads.map((l, idx) =>
                idx === loadIndex
                  ? { ...l, status: nextStatus, pending: true }
                  : l
              ),
            }
          : j
      )
    );

    fetch(
      `http://localhost:8080/api/laundry-jobs/${job.id}/advance-load?loadNumber=${load.loadNumber}&status=${nextStatus}`,
      { method: "PATCH" }
    )
      .then(() => {
        // clear pending after backend confirms
        setJobs((prev) =>
          prev.map((j) =>
            getJobKey(j) === jobKey
              ? {
                  ...j,
                  loads: j.loads.map((l, idx) =>
                    idx === loadIndex ? { ...l, pending: false } : l
                  ),
                }
              : j
          )
        );
      })
      .catch((err) => console.error("Failed to advance load status:", err));
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
    return (
      remaining !== null &&
      remaining > 0 &&
      (load.status === "WASHING" || load.status === "DRYING")
    );
  };

  // auto advance when timer finishes
  useEffect(() => {
    jobs.forEach((job) => {
      job.loads.forEach((load, idx) => {
        if (isLoadRunning(load)) {
          const remaining = getRemainingTime(load);
          if (remaining === 0) {
            advanceStatus(getJobKey(job), idx);
          }
        }
      });
    });
  }, [jobs, now]);

  const machineOptions = useMemo(() => {
    const byType = { WASHER: [], DRYER: [] };
    machines.forEach((m) => {
      const t = (m.type || "").toString().toUpperCase();
      if (t === "WASHER") byType.WASHER.push(m);
      if (t === "DRYER") byType.DRYER.push(m);
    });
    return byType;
  }, [machines]);

  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center">
        <Lottie animationData={loader} loop style={{ width: 120, height: 120 }} />
      </main>
    );
  }
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
                                <th className="p-3 text-left">Contact</th>
                                <th className="p-3 text-left">Service</th>
                                <th className="p-3 text-left">Fabric</th>
                                <th className="p-3 text-left">Detergent</th>
                                <th className="p-3 text-left">Load</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Machine</th>
                                <th className="p-3 text-center">Duration</th>
                                <th className="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job) => {
                                const jobKey = getJobKey(job);
                                const expanded = expandedJobs[jobKey] || false;
                                const visibleLoads = expanded ? job.loads : job.loads.slice(0, 1);

                                return (
                                    <React.Fragment key={jobKey}>
                                        <tr>
                                            <td colSpan={10}>
                                                <div className="flex h-6 items-center justify-center rounded bg-blue-200 font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    {job.customerName}
                                                </div>
                                            </td>
                                        </tr>

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
                                                <tr
                                                    key={`${jobKey}-load${i + 1}`}
                                                    className="border-b border-slate-200 dark:border-slate-700"
                                                >
                                                    <td className="p-3 font-semibold">{job.customerName}</td>
                                                    <td className="p-3">{job.contact ? maskContact(job.contact) : "—"}</td>
                                                    <td className="p-3">{job.serviceType || "—"}</td>
                                                    <td className="p-3">{Math.ceil(job.fabricQty ?? 0)}</td>
                                                    <td className="p-3">{Math.ceil(job.detergentQty ?? 0)}</td>
                                                    <td className="p-3">Load {load.loadNumber}</td>
                                                    <td className="p-3">
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
                                                                            animationData={loader}
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
                                                    </td>

                                                    <td className="p-3">
                                                        {!(["DRIED", "FOLDING", "COMPLETED"].includes(load.status) && job.serviceType !== "Wash") && (
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
                                                    </td>

                                                    {/* Duration Column */}
                                                    <td className="p-3 text-center">
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
                                                                (load.status === "DRIED" || load.status === "FOLDING" || load.status === "COMPLETED")
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
                                                    </td>

                                                    {/* Action Column */}
                                                    <td className="p-3 text-center">
                                                        {!isLoadRunning(load) && (
                                                            <>
                                                                {job.serviceType === "Wash" && load.status === "WASHED" ? (
                                                                    <button
                                                                        onClick={() => advanceStatus(jobKey, i)}
                                                                        className="flex items-center gap-1 rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                                                                    >
                                                                        <Check className="h-4 w-4" /> Done
                                                                    </button>
                                                                ) : ["UNWASHED", "WASHED"].includes(load.status) ? (
                                                                    <button
                                                                        onClick={() => startAction(jobKey, i)}
                                                                        className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                                                                    >
                                                                        Start
                                                                    </button>
                                                                ) : ["DRYING", "DRIED", "FOLDING"].includes(load.status) ? (
                                                                    <button
                                                                        onClick={() => advanceStatus(jobKey, i)}
                                                                        className="flex items-center gap-1 rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                                                                    >
                                                                        Next
                                                                    </button>
                                                                ) : load.status === "COMPLETED" ? (
                                                                    <span className="flex items-center gap-1 text-green-600">
                                                                        <Check className="h-4 w-4" /> Done
                                                                    </span>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {job.loads.length > 1 && (
                                            <tr>
                                                <td
                                                    colSpan={10}
                                                    className="p-2"
                                                >
                                                    <div className="flex justify-center">
                                                        <button
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
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </TooltipProvider>
        </main>
    );
}
