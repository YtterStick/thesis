import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import AdminRecordTable from "./AdminRecordTable.jsx";
import { PhilippinePeso, Package, Clock8, TimerOff, AlertCircle, Calendar } from "lucide-react";

const MainPage = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState("all");
    const [activeFilter, setActiveFilter] = useState(null);
    const [sortOrder, setSortOrder] = useState(null);

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
                    disposed: r.disposed || false,
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

    // Skeleton Loader Components
    const SkeletonCard = ({ index }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border-2 p-5 transition-all"
            style={{
                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <motion.div
                    className="rounded-lg p-2 animate-pulse"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                    }}
                >
                    <div className="h-6 w-6"></div>
                </motion.div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                    className="text-right"
                >
                    <div className="h-6 w-20 rounded animate-pulse"
                         style={{
                             backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                         }} />
                </motion.div>
            </div>
            
            <div className="flex items-center justify-between">
                <div className="h-5 w-28 rounded animate-pulse"
                     style={{
                         backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                     }} />
            </div>
        </motion.div>
    );

    const SkeletonTable = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border-2 p-5 transition-all"
            style={{
                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-32 rounded animate-pulse"
                     style={{
                         backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                     }} />
                <div className="h-4 w-24 rounded animate-pulse"
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
                    <div className="grid grid-cols-11 gap-4 p-4"
                         style={{
                             backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                         }}>
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-4 rounded animate-pulse"
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
                    <div key={rowIndex} className="grid grid-cols-11 gap-4 p-4 rounded-lg border-2"
                         style={{
                             backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                             borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                         }}>
                        {[...Array(10)].map((_, colIndex) => (
                            <div key={colIndex} 
                                 className={`h-4 rounded animate-pulse ${
                                     colIndex === 0 ? "w-4" : colIndex === 4 ? "w-16" : "w-full"
                                 }`}
                                 style={{
                                     backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                                     animationDelay: `${rowIndex * 0.1}s`
                                 }} />
                        ))}
                    </div>
                ))}
            </div>
        </motion.div>
    );

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

    // Apply filters and sorting based on active filter
    const getFilteredRecords = () => {
        let filtered = filterRecordsByTime(records);
        
        // Apply additional filters based on active filter
        switch (activeFilter) {
            case "income":
                filtered = [...filtered].sort((a, b) => {
                    return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
                });
                break;
            case "loads":
                filtered = [...filtered].sort((a, b) => {
                    return sortOrder === "asc" ? a.loads - b.loads : b.loads - a.loads;
                });
                break;
            case "expired":
                filtered = filtered.filter((r) => r.expired);
                break;
            case "unwashed":
                filtered = filtered.filter((r) => r.laundryStatus === "Not Started");
                break;
            case "unclaimed":
                filtered = filtered.filter((r) => r.pickupStatus === "UNCLAIMED");
                break;
            default:
                // No additional filter
                break;
        }
        
        return filtered;
    };

    const filteredRecords = getFilteredRecords();

    // Handle card click
    const handleCardClick = (filterType) => {
        const isSortable = filterType === "income" || filterType === "loads";
        
        // If clicking the same card that's already active
        if (activeFilter === filterType) {
            if (isSortable) {
                // For sortable cards, check if we need to toggle or deactivate
                if (sortOrder === "desc") {
                    // Switch to ascending order
                    setSortOrder("asc");
                } else {
                    // Already in ascending order, so deactivate
                    setActiveFilter(null);
                    setSortOrder(null);
                }
            } else {
                // For non-sortable cards, deactivate on second click
                setActiveFilter(null);
                setSortOrder(null);
            }
        } else {
            // Set new active filter
            setActiveFilter(filterType);
            // Set default sort order for sortable cards
            setSortOrder(isSortable ? "desc" : null);
        }
    };

    // Update the metrics calculation
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
            filterType: "income",
            active: activeFilter === "income",
            sortable: true,
        },
        {
            label: "Total Loads",
            value: totalLoads,
            icon: <Package size={26} />,
            color: "#60A5FA",
            tooltip: "Total number of laundry loads in filtered period",
            filterType: "loads",
            active: activeFilter === "loads",
            sortable: true,
        },
        {
            label: "Unwashed Loads",
            value: unwashed,
            icon: <Clock8 size={26} />,
            color: "#FB923C",
            tooltip: "Loads that haven't been washed yet",
            filterType: "unwashed",
            active: activeFilter === "unwashed",
            sortable: false,
        },
        {
            label: "Expired Loads",
            value: expired,
            icon: <TimerOff size={26} />,
            color: "#A78BFA",
            tooltip: "Loads that exceeded their pickup window",
            filterType: "expired",
            active: activeFilter === "expired",
            sortable: false,
        },
        {
            label: "Unclaimed Loads",
            value: unclaimed,
            icon: <AlertCircle size={26} />,
            color: "#FACC15",
            tooltip: "Loads that haven't been picked up yet",
            filterType: "unclaimed",
            active: activeFilter === "unclaimed",
            sortable: false,
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
                            Admin Laundry Records
                        </p>
                        <p className="text-sm" style={{ color: isDarkMode ? '#F3EDE3/70' : '#0B2B26/70' }}>
                            Manage and track all laundry transactions
                        </p>
                    </div>
                </div>

                {/* Time Filter */}
                <div className="flex items-center gap-2">
                    <Calendar
                        size={18}
                        style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}
                    />
                    <select
                        value={timeFilter}
                        onChange={(e) => {
                            setTimeFilter(e.target.value);
                            setActiveFilter(null);
                            setSortOrder(null);
                        }}
                        className="rounded-lg border-2 px-3 py-2 text-sm focus:outline-none transition-all"
                        style={{
                            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                            color: isDarkMode ? "#13151B" : "#0B2B26",
                        }}
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
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {loading ? (
                    [...Array(5)].map((_, index) => (
                        <SkeletonCard key={index} index={index} />
                    ))
                ) : (
                    summaryCards.map(({ label, value, icon, color, tooltip, filterType, active, sortable }, index) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ 
                                scale: 1.03,
                                y: -2,
                                transition: { duration: 0.2 }
                            }}
                            className={`rounded-xl border-2 p-5 transition-all cursor-pointer ${
                                active ? "ring-2 ring-offset-2" : ""
                            }`}
                            style={{
                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                ringColor: active ? color : "",
                            }}
                            title={tooltip}
                            onClick={() => handleCardClick(filterType)}
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
                                {active && sortable && (
                                    <span className="text-xs" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                        {sortOrder === "desc" ? "↓ High to Low" : "↑ Low to High"}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Record Table */}
            {loading ? (
                <SkeletonTable />
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
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
                        <div className="flex items-center gap-2">
                            {activeFilter && (
                                <span className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                    Filtered by: {summaryCards.find(card => card.filterType === activeFilter)?.label}
                                    {(activeFilter === "income" || activeFilter === "loads") && ` (${sortOrder === "desc" ? "High to Low" : "Low to High"})`}
                                </span>
                            )}
                            <span className="text-sm font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                {filteredRecords.length} records found
                            </span>
                        </div>
                    </div>
                    <AdminRecordTable
                        items={filteredRecords}
                        allItems={records}
                        activeFilter={activeFilter}
                        sortOrder={sortOrder}
                        isDarkMode={isDarkMode}
                    />
                </motion.div>
            )}
        </div>
    );
};

export default MainPage;