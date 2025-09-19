import { useState, useEffect } from "react";
import AdminRecordTable from "./AdminRecordTable.jsx";
import { PhilippinePeso, Package, Clock8, TimerOff, AlertCircle, Calendar } from "lucide-react";

const MainPage = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState("all");

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const res = await fetch("http://localhost:8080/api/admin/records", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!res.ok) throw new Error("Failed to fetch records");

                const data = await res.json();

                const mapped = data.map((r) => ({
                    id: r.id,
                    name: r.customerName,
                    service: r.serviceName,
                    loads: r.loads,
                    detergent: r.detergent,
                    fabric: r.fabric || "—",
                    price: r.totalPrice,
                    paymentMethod: r.paymentMethod || "—",
                    pickupStatus: r.pickupStatus,
                    laundryStatus: r.laundryStatus,
                    laundryProcessedBy: r.laundryProcessedBy || "—",
                    claimProcessedBy: r.claimProcessedBy || "—",
                    createdAt: r.createdAt,
                    paid: r.paid || false,
                    expired: r.expired,
                    disposed: r.disposed || false, // Add this line
                    disposedBy: r.disposedBy || "—",
                    gcashVerified: r.gcashVerified || false,
                }));
                setRecords(mapped);
            } catch (error) {
                console.error("❌ Record fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, []);

    // Filter records based on time filter
    const filterRecordsByTime = (records) => {
        const now = new Date();
        let filtered = [...records];

        switch (timeFilter) {
            case "today":
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                filtered = records.filter((r) => new Date(r.createdAt) >= todayStart);
                break;
            case "week":
                const weekStart = new Date(now);
                // Adjust to start from Monday (1) instead of Sunday (0)
                const dayOfWeek = now.getDay();
                const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                weekStart.setDate(now.getDate() + diffToMonday);
                weekStart.setHours(0, 0, 0, 0);
                filtered = records.filter((r) => new Date(r.createdAt) >= weekStart);
                break;
            case "month":
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                filtered = records.filter((r) => new Date(r.createdAt) >= monthStart);
                break;
            case "year":
                const yearStart = new Date(now.getFullYear(), 0, 1);
                filtered = records.filter((r) => new Date(r.createdAt) >= yearStart);
                break;
            case "all":
            default:
                // No filter needed
                break;
        }

        return filtered;
    };

    const filteredRecords = filterRecordsByTime(records);

    // Update the metrics calculation in MainPage.jsx
    const totalIncome = filteredRecords.reduce((acc, r) => acc + r.price, 0);
    const totalLoads = filteredRecords.reduce((acc, r) => acc + r.loads, 0);
    const unwashed = filteredRecords.filter((r) => r.laundryStatus === "Not Started").length;
    const expired = filteredRecords.filter((r) => r.expired).length;
    const unclaimed = filteredRecords.filter((r) => r.pickupStatus === "UNCLAIMED").length;

    const summaryCards = [
        {
            label: "Total Income",
            value: `₱${totalIncome.toFixed(2)}`,
            icon: <PhilippinePeso size={26} />,
            color: "#3DD9B6",
            tooltip: "Total income from filtered transactions",
        },
        {
            label: "Total Loads",
            value: totalLoads,
            icon: <Package size={26} />,
            color: "#60A5FA",
            tooltip: "Total number of laundry loads in filtered period",
        },
        {
            label: "Unwashed Loads",
            value: unwashed,
            icon: <Clock8 size={26} />,
            color: "#FB923C",
            tooltip: "Loads that haven't been washed yet",
        },
        {
            label: "Expired Loads",
            value: expired,
            icon: <TimerOff size={26} />,
            color: "#A78BFA",
            tooltip: "Loads that exceeded their pickup window",
        },
        {
            label: "Unclaimed Loads",
            value: unclaimed,
            icon: <AlertCircle size={26} />,
            color: "#FACC15",
            tooltip: "Loads that haven't been picked up yet",
        },
    ];

    const timeFilters = [
        { value: "today", label: "Today" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "year", label: "This Year" },
        { value: "all", label: "All Time" },
    ];

    return (
        <main className="relative space-y-6 p-6">
            {/* Header */}
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Admin Laundry Records</h1>

                {/* Time Filter */}
                <div className="flex items-center gap-2">
                    <Calendar
                        size={18}
                        className="text-slate-600 dark:text-slate-400"
                    />
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                        {timeFilters.map((filter) => (
                            <option
                                key={filter.value}
                                value={filter.value}
                            >
                                {filter.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {summaryCards.map(({ label, value, icon, color, tooltip }) => (
                    <div
                        key={label}
                        className="card"
                        title={tooltip}
                    >
                        <div className="card-header flex items-center gap-x-3">
                            <div
                                className="w-fit rounded-lg p-2"
                                style={{
                                    backgroundColor: `${color}33`,
                                    color: color,
                                }}
                            >
                                {icon}
                            </div>
                            <p className="card-title">{label}</p>
                        </div>
                        <div className="card-body rounded-md bg-slate-100 p-4 transition-colors dark:bg-slate-950">
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                                {loading ? (
                                    <span className="inline-block h-6 w-20 animate-pulse rounded bg-slate-300 dark:bg-slate-700" />
                                ) : (
                                    <>{value}</>
                                )}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Record Table */}
            <div className="card">
                <div className="card-header justify-between">
                    <p className="card-title">Laundry Records</p>
                    <span className="text-sm text-slate-500">{filteredRecords.length} records found</span>
                </div>
                {loading ? (
                    <div className="p-6 text-center text-slate-500 dark:text-slate-400">Loading records...</div>
                ) : (
                    <AdminRecordTable
                        items={filteredRecords}
                        allItems={records}
                    />
                )}
            </div>
        </main>
    );
};

export default MainPage;
