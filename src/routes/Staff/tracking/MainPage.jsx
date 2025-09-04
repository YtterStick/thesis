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

const DEFAULT_DURATION = { washing: 35, drying: 40 };

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

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token || isTokenExpired(token)) {
      window.location.href = "/login";
      return;
    }

    const fetchJobs = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/laundry-jobs");
        const data = await res.json();
        const jobsWithLoads = data.map((job) => ({
          id: job.id ?? job.transactionId,
          ...job,
          loads: job.loadAssignments?.length
            ? job.loadAssignments.map((l) => ({
                loadNumber: l.loadNumber,
                machineId: l.machineId || null,
                duration: l.durationMinutes || null,
                status: l.status || "UNWASHED",
                startTime: l.startTime || null,
              }))
            : Array.from({ length: job.totalLoads || 1 }, (_, i) => ({
                loadNumber: i + 1,
                machineId: null,
                duration: null,
                status: "UNWASHED",
                startTime: null,
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

    fetchJobs();
    fetchMachines();
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getJobKey = (job) => job.id ?? `${job.customerName}-${job.issueDate}`;
  const getRemainingTime = (load) => {
    if (!load.startTime || !load.duration) return null;
    const end = new Date(load.startTime).getTime() + load.duration * 60000;
    return Math.max(Math.floor((end - now) / 60000), 0);
  };

  const assignMachine = async (jobKey, loadIndex, machineId) => {
    const job = jobs.find((j) => getJobKey(j) === jobKey);
    if (!job?.id) return;

    setJobs((prev) =>
      prev.map((j) =>
        getJobKey(j) === jobKey
          ? { ...j, loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, machineId } : l)) }
          : j,
      ),
    );

    try {
      await fetch(
        `http://localhost:8080/api/laundry-jobs/${job.id}/assign-machine?loadNumber=${job.loads[loadIndex].loadNumber}&machineId=${machineId}`,
        { method: "PATCH" },
      );
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
          ? { ...j, loads: j.loads.map((l, idx) => (idx === loadIndex ? { ...l, duration } : l)) }
          : j,
      ),
    );

    try {
      await fetch(
        `http://localhost:8080/api/laundry-jobs/${job.id}/update-duration?loadNumber=${job.loads[loadIndex].loadNumber}&durationMinutes=${duration}`,
        { method: "PATCH" },
      );
    } catch (err) {
      console.error("Failed to update duration:", err);
    }
  };

  const startAction = async (jobKey, loadIndex) => {
    const job = jobs.find((j) => getJobKey(j) === jobKey);
    if (!job?.id) return;

    const load = job.loads[loadIndex];
    if (!load.machineId) {
      alert("Please assign a machine before starting the load.");
      return;
    }

    const duration =
      load.duration || (job.serviceType?.toLowerCase().includes("wash") ? DEFAULT_DURATION.washing : DEFAULT_DURATION.drying);

    setJobs((prev) =>
      prev.map((j) =>
        getJobKey(j) === jobKey
          ? {
              ...j,
              loads: j.loads.map((l, idx) =>
                idx === loadIndex
                  ? { ...l, status: job.serviceType.toLowerCase().includes("wash") ? "WASHING" : "DRYING", startTime: new Date().toISOString(), duration }
                  : l,
              ),
            }
          : j,
      ),
    );

    try {
      await fetch(
        `http://localhost:8080/api/laundry-jobs/${job.id}/start-load?loadNumber=${load.loadNumber}&durationMinutes=${duration}`,
        { method: "PATCH" },
      );
    } catch (err) {
      console.error("Failed to start load:", err);
    }
  };

  const advanceStatus = async (jobKey, loadIndex) => {
    const job = jobs.find((j) => getJobKey(j) === jobKey);
    if (!job?.id) return;

    const load = job.loads[loadIndex];
    const flow = SERVICE_FLOWS[job.serviceType] || [];
    const currentIndex = flow.indexOf(load.status);
    const nextStatus = currentIndex < flow.length - 1 ? flow[currentIndex + 1] : load.status;

    setJobs((prev) =>
      prev.map((j) =>
        getJobKey(j) === jobKey
          ? {
              ...j,
              loads: j.loads.map((l, idx) =>
                idx === loadIndex
                  ? {
                      ...l,
                      status: nextStatus,
                      startTime: nextStatus === "WASHING" || nextStatus === "DRYING" ? new Date().toISOString() : l.startTime,
                    }
                  : l,
              ),
            }
          : j,
      ),
    );

    // call backend if needed to advance status
    if (nextStatus === "WASHING" || nextStatus === "DRYING") {
      try {
        await fetch(
          `http://localhost:8080/api/laundry-jobs/${job.id}/start-load?loadNumber=${load.loadNumber}&durationMinutes=${load.duration || DEFAULT_DURATION.washing}`,
          { method: "PATCH" },
        );
      } catch (err) {
        console.error("Failed to advance load status:", err);
      }
    }
  };

  const markCompleted = async (jobKey) => {
    setUpdatingId(jobKey);
    try {
      setJobs((prev) => prev.filter((j) => getJobKey(j) !== jobKey));
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
                  const loadId = `${jobKey}-load${i + 1}`;
                  const statusConfig = STATUS_ICONS[load.status] || STATUS_ICONS.UNWASHED;
                  const isLoading = updatingId === jobKey;
                  const remaining = getRemainingTime(load);

                  return (
                    <tr key={loadId} className="border-b border-slate-200 dark:border-slate-700">
                      <td className="p-3 font-semibold">{job.customerName}</td>
                      <td className="p-3">{job.serviceType || "—"}</td>
                      <td className="p-3">Load {load.loadNumber}</td>
                      <td className="p-3">{Math.ceil(job.fabricQty ?? 0)}</td>
                      <td className="p-3">{Math.ceil(job.detergentQty ?? 0)}</td>
                      <td className="p-3">
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-2">
                              <Lottie animationData={isLoading ? loader : statusConfig.animation} loop style={{ width: 40, height: 40 }} />
                              <span>{statusConfig.label}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{remaining !== null ? `${remaining} min remaining` : "Not started"}</TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="p-3">
                        <Select value={load.machineId ?? ""} onValueChange={(val) => assignMachine(jobKey, i, val)}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select machine" />
                          </SelectTrigger>
                          <SelectContent>
                            {machines
                              .filter((m) => (job.serviceType?.toLowerCase().includes("wash") ? m.type === "Washer" : m.type === "Dryer"))
                              .map((m) => (
                                <SelectItem
                                  key={`${jobKey}-${i}-${m.id}`}
                                  value={m.id}
                                  disabled={m.status !== "Available"}
                                >
                                  {`${m.name} – ${m.status}`}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select
                          value={load.duration?.toString() ?? ""}
                          onValueChange={(val) => updateDuration(jobKey, i, parseInt(val))}
                          disabled={!load.machineId} // only enabled after machine is assigned
                        >
                          <SelectTrigger className="w-[80px]">
                            <SelectValue placeholder="min" />
                          </SelectTrigger>
                          <SelectContent>
                            {[20, 30, 35, 40, 45, 50].map((min) => (
                              <SelectItem key={`${jobKey}-${i}-${min}`} value={min.toString()}>
                                {min} min
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        {load.status === "FOLDING" ? (
                          <button
                            className="flex items-center gap-1 rounded bg-green-500 px-2 py-1 text-white hover:bg-green-600"
                            onClick={() => markCompleted(jobKey)}
                            disabled={isLoading}
                          >
                            <Check className="h-4 w-4" />
                            Done
                          </button>
                        ) : load.startTime ? (
                          <button
                            className="flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                            onClick={() => advanceStatus(jobKey, i)}
                            disabled={isLoading}
                          >
                            <ArrowRight className="h-4 w-4" />
                            Next
                          </button>
                        ) : (
                          <button
                            className="flex items-center gap-1 rounded bg-cyan-500 px-2 py-1 text-white hover:bg-cyan-600"
                            onClick={() => startAction(jobKey, i)}
                            disabled={isLoading || !load.machineId} // disable start until machine assigned
                          >
                            <ArrowRight className="h-4 w-4" />
                            Start
                          </button>
                        )}
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
