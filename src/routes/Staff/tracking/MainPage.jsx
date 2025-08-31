import { useEffect, useState } from "react";
import { WashingMachine, ArrowRight, Check } from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

const ServiceTrackingPage = () => {
  const [records, setRecords] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("http://localhost:8080/api/laundry-tracking", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error("Failed to fetch tracking records:", err);
      }
    };

    fetchRecords();
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getRemainingTime = (record) => {
    if (!record.startedAt || !record.duration) return null;
    const end = new Date(record.startedAt).getTime() + record.duration * 60000;
    const remaining = Math.max(end - now, 0);
    return Math.floor(remaining / 60000);
  };

  const getMachineType = (record) => {
    const status = record.laundryStatus;
    if (status === "WASHING") return "washer";
    if (status === "DRYING") return "dryer";
    if (status === "UNWASHED") {
      if (record.serviceName.includes("Wash")) return "washer";
      if (record.serviceName === "Dry") return "dryer";
    }
    return null;
  };

  const getMachineStatus = (record) => {
    const type = getMachineType(record);
    if (!type) return [];
    const allMachines = records
      .filter((r) => getMachineType(r) === type)
      .map((r) => r.machine)
      .filter(Boolean);
    const uniqueMachines = [...new Set(allMachines)];
    return uniqueMachines.map((m) => ({
      name: m,
      available: !records.some(
        (r) => r.machine === m && r.startedAt && getMachineType(r) === type
      ),
    }));
  };

  const assignMachine = (id, machine) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, machine } : r))
    );
  };

  const updateDuration = (id, duration) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, duration } : r))
    );
  };

  const startAction = (id) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              laundryStatus:
                r.serviceName === "Dry"
                  ? "DRYING"
                  : r.serviceName.includes("Wash")
                  ? "WASHING"
                  : r.laundryStatus,
              startedAt: new Date().toISOString(),
              duration:
                r.duration || DEFAULT_DURATION[getMachineType(r)] || 30,
            }
          : r
      )
    );
  };

  const advanceStatus = async (id) => {
    const record = records.find((r) => r.id === id);
    const flow = SERVICE_FLOWS[record.serviceName] || [];
    const currentIndex = flow.indexOf(record.laundryStatus);
    const nextStatus =
      currentIndex < flow.length - 1
        ? flow[currentIndex + 1]
        : record.laundryStatus;

    setUpdatingId(id);
    try {
      const token = localStorage.getItem("authToken");
      await fetch(`http://localhost:8080/api/laundry-tracking/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      setRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                laundryStatus: nextStatus,
                machine: null,
                startedAt: null,
                duration: null,
              }
            : r
        )
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
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setUpdatingId(null);
    }
  };

  const expandedRecords = records.flatMap((r) =>
    Array.from({ length: r.loads }, (_, i) => ({
      ...r,
      loadIndex: i + 1,
      id: `${r.id}-load${i + 1}`,
    }))
  );

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <WashingMachine className="h-6 w-6 text-cyan-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Service Tracking
        </h1>
      </div>
      <TooltipProvider>
        <div className="overflow-x-auto rounded-md border border-slate-300 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Service</th>
                <th className="p-3 text-left">Load</th>
                <th className="p-3 text-left">Detergent</th>
                <th className="p-3 text-left">Fabric</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Machine</th>
                <th className="p-3 text-left">Duration</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {expandedRecords.map((r) => {
                const statusConfig =
                  STATUS_ICONS[r.laundryStatus] ?? STATUS_ICONS.UNWASHED;
                const isLoading = updatingId === r.id;
                const machineOptions = getMachineStatus(r);
                const remaining = getRemainingTime(r);

                return (
                  <tr
                    key={r.id}
                    className="border-b border-slate-200 dark:border-slate-700"
                  >
                    <td className="p-3 font-medium text-slate-800 dark:text-white">
                      {r.customerName}
                    </td>
                    <td className="p-3">{r.serviceName}</td>
                    <td className="p-3">Load {r.loadIndex}</td>
                    <td className="p-3">
                      {r.detergent
                        ? Math.ceil(parseInt(r.detergent) / r.loads)
                        : "—"}
                    </td>
                    <td className="p-3">
                      {r.fabric
                        ? Math.ceil(parseInt(r.fabric) / r.loads)
                        : "—"}
                    </td>
                    <td className="p-3 text-xs text-slate-500 dark:text-slate-400">
                                            {r.createdAt
                        ? new Date(r.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-12 w-12">
                            <Lottie
                              animationData={
                                isLoading ? loader : statusConfig.animation
                              }
                              loop
                              autoplay
                              className="h-full w-full"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {remaining === 0 &&
                            (r.laundryStatus === "WASHING" ||
                              r.laundryStatus === "DRYING") &&
                            "Cycle complete"}
                          {remaining > 0 &&
                            `${statusConfig.label} (${remaining} min left)`}
                          {r.laundryStatus === "FOLDING" && "Ready for pickup"}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="p-3">
                      {r.machine ? (
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {r.machine}
                        </span>
                      ) : (
                        <Select onValueChange={(val) => assignMachine(r.id, val)}>
                          <SelectTrigger className="w-[100px]">
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
                      )}
                    </td>
                    <td className="p-3">
                      {r.startedAt ? (
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {r.duration} min
                        </span>
                      ) : (
                        <Select
                          onValueChange={(val) =>
                            updateDuration(r.id, parseInt(val))
                          }
                        >
                          <SelectTrigger className="w-[80px]">
                            <SelectValue placeholder="Set" />
                          </SelectTrigger>
                          <SelectContent>
                            {[30, 35, 40, 45, 50].map((d) => (
                              <SelectItem key={d} value={d.toString()}>
                                {d} min
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="p-3">
                      {r.laundryStatus === "UNWASHED" ||
                      r.laundryStatus === "DRY_ONLY" ? (
                        <button
                          onClick={() => startAction(r.id)}
                          className="inline-flex items-center gap-1 rounded bg-cyan-600 px-3 py-1 text-white hover:bg-cyan-700"
                        >
                          Start
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : r.laundryStatus === "FOLDING" ? (
                        <button
                          onClick={() => markCompleted(r.id)}
                          className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                        >
                          Done
                          <Check className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => advanceStatus(r.id)}
                          className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700"
                        >
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TooltipProvider>
    </main>
  );
};

export default ServiceTrackingPage;