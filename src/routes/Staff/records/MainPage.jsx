import { useState, useEffect } from "react";
import RecordTable from "./RecordTable.jsx";
import { PhilippinePeso, Package, Clock8, TimerOff, AlertCircle } from "lucide-react";

const MainPage = () => {
    const [records, setRecords] = useState([]);
    const [summaryData, setSummaryData] = useState({
        todayIncome: 0,
        todayLoads: 0,
        unwashedCount: 0,
        unclaimedCount: 0,
        expiredCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("authToken");

                // Fetch records for the table
                const recordsRes = await fetch("http://localhost:8080/api/records/staff", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!recordsRes.ok) throw new Error("Failed to fetch records");

                const recordsData = await recordsRes.json();

                const mapped = recordsData.map((r) => ({
                    id: r.id,
                    name: r.customerName,
                    service: r.serviceName,
                    loads: r.loads,
                    detergent: r.detergent,
                    fabric: r.fabric || "—",
                    price: r.totalPrice,
                    pickupStatus: r.pickupStatus,
                    washed: r.washed,
                    expired: r.expired,
                    createdAt: r.createdAt,
                }));

                setRecords(mapped);

                // Fetch summary data
                const summaryRes = await fetch("http://localhost:8080/api/records/staff/summary", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!summaryRes.ok) throw new Error("Failed to fetch summary data");

                const summaryData = await summaryRes.json();
                setSummaryData(summaryData);
            } catch (error) {
                console.error("❌ Data fetch error:", error);
            } finally {
                setLoading(false);
                setSummaryLoading(false);
            }
        };

        fetchData();
    }, []);

    const summaryCards = [
        {
            label: "Today's Income",
            value: `₱${summaryData.todayIncome.toFixed(2)}`,
            icon: <PhilippinePeso size={26} />,
            color: "#3DD9B6",
            tooltip: "Total income from today's transactions",
        },
        {
            label: "Today's Loads",
            value: summaryData.todayLoads,
            icon: <Package size={26} />,
            color: "#60A5FA",
            tooltip: "Total number of laundry loads today",
        },
        {
            label: "Unwashed Loads",
            value: summaryData.unwashedCount,
            icon: <Clock8 size={26} />,
            color: "#FB923C",
            tooltip: "Loads that haven't been washed yet",
        },
        {
            label: "Expired Loads",
            value: summaryData.expiredCount,
            icon: <TimerOff size={26} />,
            color: "#A78BFA",
            tooltip: "Loads that exceeded their pickup window",
        },
        {
            label: "Unclaimed Loads",
            value: summaryData.unclaimedCount,
            icon: <AlertCircle size={26} />,
            color: "#FACC15",
            tooltip: "Loads that haven't been picked up yet",
        },
    ];

    return (
        <main className="relative space-y-6 p-6">
            {/* 🧢 Header */}
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Staff Laundry Records</h1>
            </div>

            {/* 🎨 Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
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
                                {summaryLoading ? (
                                    <span className="inline-block h-6 w-20 animate-pulse rounded bg-slate-300 dark:bg-slate-700" />
                                ) : (
                                    <>{value}</>
                                )}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 📋 Record Table */}
            <div className="card">
                <div className="card-header justify-between">
                    <p className="card-title">Laundry Records</p>
                </div>
                {loading ? (
                    <div className="p-6 text-center text-slate-500 dark:text-slate-400">Loading records...</div>
                ) : (
                    <RecordTable items={records} />
                )}
            </div>
        </main>
    );
};

export default MainPage;
