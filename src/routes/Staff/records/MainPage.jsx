import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import RecordTable from "./RecordTable.jsx";
import { PhilippinePeso, Package, Clock8, TimerOff, AlertCircle, Calendar } from "lucide-react";

const MainPage = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    const [records, setRecords] = useState([]);
    const [summaryData, setSummaryData] = useState({
        todayIncome: 0,
        todayLoads: 0,
        unwashedCount: 0,
        unclaimedCount: 0,
        expiredCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("authToken");

                const [recordsRes, summaryRes] = await Promise.all([
                    fetch("http://localhost:8080/api/records/staff", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }),
                    fetch("http://localhost:8080/api/records/staff/summary", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    })
                ]);

                if (!recordsRes.ok) throw new Error("Failed to fetch records");
                if (!summaryRes.ok) throw new Error("Failed to fetch summary data");

                const [recordsData, summaryData] = await Promise.all([
                    recordsRes.json(),
                    summaryRes.json()
                ]);

                // Make sure to include the id field for the print functionality
                const mapped = recordsData.map((r) => ({
                    id: r.id, // This is crucial for the print API call
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
                setSummaryData(summaryData);
                setDataLoaded(true);
            } catch (error) {
                console.error("❌ Data fetch error:", error);
            } finally {
                // Small delay to ensure smooth transition
                setTimeout(() => {
                    setLoading(false);
                }, 300);
            }
        };

        fetchData();
    }, []);

    // Stable Skeleton Loader Components
    const SkeletonCard = () => (
        <div
            className="rounded-xl border-2 p-5"
            style={{
                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div
                    className="rounded-lg p-2"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                    }}
                >
                    <div className="h-6 w-6"></div>
                </div>
                <div className="text-right">
                    <div className="h-6 w-20 rounded"
                         style={{
                             backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                         }} />
                </div>
            </div>
            
            <div className="flex items-center justify-between">
                <div className="h-5 w-28 rounded"
                     style={{
                         backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                     }} />
            </div>
        </div>
    );

    const SkeletonTable = () => (
        <div
            className="rounded-xl border-2 p-5"
            style={{
                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-32 rounded"
                     style={{
                         backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                     }} />
                <div className="h-4 w-24 rounded"
                     style={{
                         backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                     }} />
            </div>

            {/* Table Header Skeleton */}
            <div className="overflow-x-auto rounded-lg border-2 mb-4"
                 style={{
                     borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                 }}>
                <div className="min-w-full">
                    <div className="grid grid-cols-9 gap-4 p-4"
                         style={{
                             backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                         }}>
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className="h-4 rounded"
                                 style={{
                                     backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                                 }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Rows Skeleton */}
            <div className="space-y-3">
                {[...Array(5)].map((_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-9 gap-4 p-4 rounded-lg border-2"
                         style={{
                             backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                             borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                         }}>
                        {[...Array(9)].map((_, colIndex) => (
                            <div key={colIndex} 
                                 className={`h-4 rounded ${
                                     colIndex === 0 ? "w-4" : colIndex === 4 ? "w-16" : "w-full"
                                 }`}
                                 style={{
                                     backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                                 }} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );

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
        <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-3"
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
                        <Package size={22} />
                    </motion.div>
                    <div>
                        <p className="text-xl font-bold" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
                            Staff Laundry Records
                        </p>
                        <p className="text-sm" style={{ color: isDarkMode ? '#F3EDE3/70' : '#0B2B26/70' }}>
                            Manage and track all laundry transactions
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <AnimatePresence mode="wait">
                    {loading ? (
                        [...Array(5)].map((_, index) => (
                            <motion.div
                                key={`skeleton-${index}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <SkeletonCard />
                            </motion.div>
                        ))
                    ) : (
                        summaryCards.map(({ label, value, icon, color, tooltip }, index) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                whileHover={{ 
                                    scale: 1.03,
                                    y: -2,
                                    transition: { duration: 0.2 }
                                }}
                                className="rounded-xl border-2 p-5 transition-all cursor-pointer"
                                style={{
                                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                }}
                                title={tooltip}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        className="rounded-lg p-2"
                                        style={{
                                            backgroundColor: `${color}20`,
                                            color: color,
                                        }}
                                    >
                                        {icon}
                                    </motion.div>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: index * 0.2 }}
                                        className="text-right"
                                    >
                                        <p className="text-2xl font-bold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                            {value}
                                        </p>
                                    </motion.div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                        {label}
                                    </h3>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Record Table */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="skeleton-table"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <SkeletonTable />
                    </motion.div>
                ) : (
                    <motion.div
                        key="data-table"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-xl border-2 p-5 transition-all"
                        style={{
                            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-lg font-bold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                Laundry Records
                            </p>
                            <span className="text-sm font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                {records.length} records found
                            </span>
                        </div>
                        <RecordTable
                            items={records}
                            isDarkMode={isDarkMode}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MainPage;