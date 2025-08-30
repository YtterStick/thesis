import { useEffect, useState } from "react";
import { WashingMachine, ArrowRight, Check } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Lottie from "lottie-react";
import washingAnimation from "@/assets/lottie/washing-machine.json";
import unwashedAnimation from "@/assets/lottie/unwashed.json";
import dryingAnimation from "@/assets/lottie/dryer-machine.json";
import foldingAnimation from "@/assets/lottie/clothes.json";
import loader from "@/assets/lottie/loader.json";

const STATUS_FLOW = ["unwashed", "washing", "drying", "folding"];
const STATUS_DURATION = {
    washing: 35 * 60 * 1000,
    drying: 40 * 60 * 1000,
};

const STATUS_ICONS = {
    unwashed: { label: "Unwashed", animation: unwashedAnimation },
    washing: { label: "Washing", animation: washingAnimation },
    drying: { label: "Drying", animation: dryingAnimation },
    folding: { label: "Folding", animation: foldingAnimation },
};

const machines = {
    washing: ["Washer A", "Washer B"],
    drying: ["Dryer A", "Dryer B"],
};

const mockData = [
    {
        id: "1",
        name: "Sheena Uvero",
        service: "Wash & Dry",
        loads: 2,
        detergent: 3,
        fabric: 3,
        date: "2025-08-30T18:30:00",
        status: "washing",
        machine: "Washer A",
        startedAt: "2025-08-30T18:45:00",
    },
    {
        id: "2",
        name: "Andrei Dilag",
        service: "Dry",
        loads: 1,
        detergent: 0,
        fabric: 0,
        date: "2025-08-30T17:00:00",
        status: "unwashed",
        machine: "Dryer A",
        startedAt: "2025-08-30T18:50:00",
    },
    {
        id: "3",
        name: "Sheyi Kulet",
        service: "Wash",
        loads: 1,
        detergent: 2,
        fabric: 3,
        date: "2025-08-30T19:00:00",
        status: "folding",
        machine: null,
        startedAt: null,
    },
];

const ServiceTrackingPage = () => {
    const [records, setRecords] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        setRecords(mockData);
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const getRemainingTime = (status, startedAt) => {
        if (!startedAt || !STATUS_DURATION[status]) return null;
        const end = new Date(startedAt).getTime() + STATUS_DURATION[status];
        const remaining = Math.max(end - now, 0);
        return Math.ceil(remaining / 60000);
    };

    const getMachineStatus = (type) => {
        if (!machines[type]) return [];

        return machines[type].map((m) => {
            const record = records.find((r) => r.status === type && r.machine === m && r.startedAt);

            if (!record) return { name: m, available: true };

            const remaining = getRemainingTime(type, record.startedAt);
            return {
                name: m,
                available: false,
                remaining,
            };
        });
    };

    const assignMachine = (id, machine) => {
        setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, machine, startedAt: new Date().toISOString() } : r)));
    };

    const advanceStatus = async (id) => {
        setUpdatingId(id);
        try {
            await new Promise((res) => setTimeout(res, 500));
            setRecords((prev) =>
                prev.map((r) => {
                    if (r.id !== id) return r;
                    const currentIndex = STATUS_FLOW.indexOf(r.status);
                    const nextStatus = currentIndex < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIndex + 1] : r.status;
                    return {
                        ...r,
                        status: nextStatus,
                        machine: null,
                        startedAt: null,
                    };
                }),
            );
        } catch (err) {
            console.error("Failed to advance status:", err);
        } finally {
            setUpdatingId(null);
        }
    };

    const markCompleted = async (id) => {
        setUpdatingId(id);
        try {
            await new Promise((res) => setTimeout(res, 500));
            setRecords((prev) => prev.filter((r) => r.id !== id));
        } catch (err) {
            console.error("Failed to mark as completed:", err);
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
                        <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <tr>
                                <th className="p-3 text-left">Customer</th>
                                <th className="p-3 text-left">Service</th>
                                <th className="p-3 text-left">Loads</th>
                                <th className="p-3 text-left">Detergent</th>
                                <th className="p-3 text-left">Fabric</th>
                                <th className="p-3 text-left">Date</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Machine</th>
                                <th className="p-3 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r) => {
                                const statusConfig = STATUS_ICONS[r.status] ?? STATUS_ICONS.unwashed;
                                const isLoading = updatingId === r.id;
                                const machineOptions = getMachineStatus(r.status);
                                const remaining = getRemainingTime(r.status, r.startedAt);

                                return (
                                    <tr
                                        key={r.id}
                                        className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                                    >
                                        <td className="p-3 font-medium text-slate-800 dark:text-white">{r.name}</td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300">{r.service}</td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300">{r.loads}</td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300">{r.detergent}</td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300">{r.fabric}</td>
                                        <td className="p-3 text-xs text-slate-500 dark:text-slate-400">{new Date(r.date).toLocaleString()}</td>
                                        <td className="p-3">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="h-12 w-12">
                                                        <Lottie
                                                            animationData={isLoading ? loader : statusConfig.animation}
                                                            loop
                                                            autoplay
                                                            className="h-full w-full"
                                                        />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>{statusConfig.label}</TooltipContent>
                                            </Tooltip>
                                        </td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300">
                                            {r.machine ? (remaining ? `${r.machine} (${remaining} mins left)` : r.machine) : "—"}
                                        </td>
                                        <td className="p-3">
                                            {r.status === "folding" ? (
                                                <button
                                                    onClick={() => markCompleted(r.id)}
                                                    disabled={isLoading}
                                                    className="flex items-center gap-1 rounded bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600 disabled:opacity-50"
                                                >
                                                    <Check className="h-4 w-4" />
                                                    {isLoading ? "Completing..." : "Mark as Completed"}
                                                </button>
                                            ) : r.machine ? (
                                                <button
                                                    onClick={() => advanceStatus(r.id)}
                                                    disabled={isLoading}
                                                    className="flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
                                                >
                                                    <ArrowRight className="h-4 w-4" />
                                                    {isLoading ? "Updating..." : "Next Step"}
                                                </button>
                                            ) : (
                                                <Select onValueChange={(val) => assignMachine(r.id, val)}>
                                                    <SelectTrigger
                                                        id={`machine-${r.id}`}
                                                        className="border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                                    >
                                                        <SelectValue placeholder={`Select ${r.status === "washing" ? "Washer" : "Dryer"}`} />
                                                    </SelectTrigger>
                                                    <SelectContent className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
                                                        {machineOptions.map((m) => (
                                                            <SelectItem
                                                                key={m.name}
                                                                value={m.name}
                                                                disabled={!m.available}
                                                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                                            >
                                                                {m.available ? `${m.name} – Available` : `${m.name} – ${m.remaining} mins left`}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
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
