import { useEffect, useState } from "react";
import {
  WashingMachine,
  Loader2,
  CircleDot,
  Wind,
  FoldHorizontal,
} from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import Lottie from "lottie-react";
import washingAnimation from "@/assets/lottie/washing-machine.json";
import unwashedAnimation from "@/assets/lottie/unwashed.json";
import dryingAnimation from "@/assets/lottie/dryer-machine.json";
import foldingAnimation from "@/assets/lottie/clothes.json";

const STATUS_ICONS = {
  unwashed: {
    icon: (
      <div className="h-12 w-12">
        <Lottie animationData={unwashedAnimation} loop className="h-full w-full" />
      </div>
    ),
    label: "Unwashed",
  },
  washing: {
    icon: (
      <div className="h-12 w-12">
        <Lottie animationData={washingAnimation} loop className="h-full w-full" />
      </div>
    ),
    label: "Washing",
  },
  drying: {
    icon: (
      <div className="h-12 w-12">
        <Lottie animationData={dryingAnimation} loop className="h-full w-full" />
      </div>
    ),
    label: "Drying",
  },
  folding: {
    icon: (
      <div className="h-12 w-12">
        <Lottie animationData={foldingAnimation} loop className="h-full w-full" />
      </div>
    ),
    label: "Folding",
  },

};

const STATUS_OPTIONS = ["unwashed", "washing", "drying", "folding"];

const mockData = [
  {
    id: "1",
    name: "Sheena Uvero",
    service: "Wash & Dry",
    loads: 2,
    detergent: 3,
    fabric: 3,
    date: "2025-08-29T18:30:00",
    status: "washing",
  },
  {
    id: "2",
    name: "Andrei Dilag",
    service: "Dry",
    loads: 1,
    detergent: 0,
    fabric: 0,
    date: "2025-08-29T17:00:00",
    status: "drying",
  },
  {
    id: "3",
    name: "Sheyi Kulet",
    service: "Wash",
    loads: 1,
    detergent: 2,
    fabric: 3,
    date: "2025-08-29T19:00:00",
    status: "folding",
  },
];

const ServiceTrackingPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setRecords(mockData);
      setLoading(false);
    }, 500);
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await new Promise((res) => setTimeout(res, 500));
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <WashingMachine className="h-6 w-6 text-cyan-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Service Tracking
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : records.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400">
          No service records found.
        </p>
      ) : (
        <TooltipProvider>
          <div className="overflow-x-auto rounded-md border border-slate-300 dark:border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Service</th>
                  <th className="p-3 text-left">Loads</th>
                  <th className="p-3 text-left">Detergent</th>
                  <th className="p-3 text-left">Fabric</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const status = STATUS_ICONS[r.status] ?? STATUS_ICONS.unwashed;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="p-3 font-medium text-slate-800 dark:text-white">
                        {r.name}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{r.service}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{r.loads}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{r.detergent}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{r.fabric}</td>
                      <td className="p-3 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(r.date).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Tooltip>
                            <TooltipTrigger asChild>{status.icon}</TooltipTrigger>
                            <TooltipContent>{status.label}</TooltipContent>
                          </Tooltip>
                          <select
                            value={r.status}
                            onChange={(e) => handleStatusChange(r.id, e.target.value)}
                            disabled={updatingId === r.id}
                            className="rounded border px-2 py-1 text-xs bg-white dark:bg-slate-900"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                          {updatingId === r.id && (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TooltipProvider>
      )}
    </main>
  );
};

export default ServiceTrackingPage;