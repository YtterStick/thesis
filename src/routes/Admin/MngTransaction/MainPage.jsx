import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import AdminRecordTable from "./AdminRecordTable.jsx";
import { PhilippinePeso, Package, Clock8, TimerOff, AlertCircle, Calendar, Filter } from "lucide-react";
import { api } from "@/lib/api-config"; // Import the api utility

const MainPage = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState("all");
    const [activeFilter, setActiveFilter] = useState(null);
    const [sortOrder, setSortOrder] = useState(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const filterDropdownRef = useRef(null);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                // Use the api utility instead of direct fetch
                const data = await api.get("api/admin/records");
                
                const mapped = data.map((r) => ({
                    id: r.id,
                    invoiceNumber: r.invoiceNumber, // Add invoice number
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
                    unwashedLoadsCount: r.unwashedLoadsCount || 0,
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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handlePointerDown = (e) => {
            if (filterDropdownRef.current?.contains(e.target)) return;
            setShowFilterDropdown(false);
        };
        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
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
                // FIX: Only show expired records that are not disposed
                filtered = filtered.filter((r) => r.expired && !r.disposed);
                break;
            case "unwashed":
                // FIX: Show records that have at least one unwashed load and not disposed
                filtered = filtered.filter((r) => 
                    r.unwashedLoadsCount > 0 && 
                    !r.disposed
                );
                break;
            case "unclaimed":
                // FIX: Only show unclaimed records where laundry is completed, not expired, and not disposed
                filtered = filtered.filter((r) => 
                    r.pickupStatus === "UNCLAIMED" && 
                    r.laundryStatus === "Completed" &&
                    !r.expired && 
                    !r.disposed
                );
                break;
            default:
                // No additional filter
                break;
        }
        
        return filtered;
    };

    const filteredRecords = getFilteredRecords();

    // Handle filter selection
    const handleFilterSelect = (filterType) => {
        const isSortable = filterType === "income" || filterType === "loads";
        
        // If selecting the same filter that's already active
        if (activeFilter === filterType) {
            if (isSortable) {
                // For sortable filters, check if we need to toggle or deactivate
                if (sortOrder === "desc") {
                    // Switch to ascending order
                    setSortOrder("asc");
                } else {
                    // Already in ascending order, so deactivate
                    setActiveFilter(null);
                    setSortOrder(null);
                }
            } else {
                // For non-sortable filters, deactivate on second click
                setActiveFilter(null);
                setSortOrder(null);
            }
        } else {
            // Set new active filter
            setActiveFilter(filterType);
            // Set default sort order for sortable filters
            setSortOrder(isSortable ? "desc" : null);
        }
        
        setShowFilterDropdown(false);
    };

    // Clear all filters
    const clearFilters = () => {
        setActiveFilter(null);
        setSortOrder(null);
        setShowFilterDropdown(false);
    };

    // Update the metrics calculation - FIXED VERSION
    const totalIncome = filteredRecords.reduce((acc, r) => acc + r.price, 0);
    const totalLoads = filteredRecords.reduce((acc, r) => acc + r.loads, 0);

    // FIX: Unwashed loads should sum the individual unwashed loads count from each transaction
    const unwashed = filteredRecords.reduce((acc, r) => acc + (r.unwashedLoadsCount || 0), 0);

    // FIX: Expired loads should only count if NOT disposed
    const expired = filteredRecords.filter((r) => 
        r.expired && 
        !r.disposed
    ).length;

    // FIX: Unclaimed loads should only count if laundry is completed, not expired, and not disposed
    const unclaimed = filteredRecords.filter((r) => 
        r.pickupStatus === "UNCLAIMED" && 
        r.laundryStatus === "Completed" &&
        !r.expired && 
        !r.disposed
    ).length;

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
            tooltip: "Individual loads that are not yet completed (excluding disposed loads)",
        },
        {
            label: "Expired Loads",
            value: expired,
            icon: <TimerOff size={26} />,
            color: "#A78BFA",
            tooltip: "Loads that exceeded their pickup window (excluding disposed loads)",
        },
        {
            label: "Unclaimed Loads",
            value: unclaimed,
            icon: <AlertCircle size={26} />,
            color: "#FACC15",
            tooltip: "Completed loads that haven't been picked up yet (excluding expired and disposed loads)",
        },
    ];

    const filterOptions = [
        {
            label: "Sort by Income",
            value: "income",
            sortable: true,
            description: "Sort transactions by price"
        },
        {
            label: "Sort by Loads",
            value: "loads",
            sortable: true,
            description: "Sort transactions by number of loads"
        },
        {
            label: "Show Expired Only",
            value: "expired",
            sortable: false,
            description: "Show only expired records"
        },
        {
            label: "Show Unwashed Only",
            value: "unwashed",
            sortable: false,
            description: "Show only unwashed records"
        },
        {
            label: "Show Unclaimed Only",
            value: "unclaimed",
            sortable: false,
            description: "Show only unclaimed records"
        },
    ];

    const timeFilters = [
        { value: "today", label: "Today" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "year", label: "This Year" },
        { value: "all", label: "All Time" },
    ];

    const getActiveFilterLabel = () => {
        if (!activeFilter) return "No filter";
        const filter = filterOptions.find(f => f.value === activeFilter);
        if (!filter) return "No filter";
        
        if (filter.sortable) {
            return `${filter.label} (${sortOrder === "desc" ? "High to Low" : "Low to High"})`;
        }
        return filter.label;
    };

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

                {/* Time Filter and Filter Button */}
                <div className="flex items-center gap-2">
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

                    {/* Filter Button */}
                    <div className="relative" ref={filterDropdownRef}>
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                                activeFilter ? "ring-2 ring-offset-2" : ""
                            }`}
                            style={{
                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                color: isDarkMode ? "#13151B" : "#0B2B26",
                                ringColor: activeFilter ? "#3DD9B6" : "",
                            }}
                        >
                            <Filter size={16} />
                            <span>Filter</span>
                            {activeFilter && (
                                <span className="ml-1 text-xs opacity-70">
                                    ({getActiveFilterLabel()})
                                </span>
                            )}
                        </button>

                        {/* Filter Dropdown */}
                        {showFilterDropdown && (
                            <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border-2 p-2 shadow-lg"
                                 style={{
                                     backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                     borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                 }}>
                                <div className="space-y-1">
                                    {filterOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleFilterSelect(option.value)}
                                            className={`flex w-full items-start justify-between rounded p-2 text-left text-sm transition-all ${
                                                activeFilter === option.value 
                                                    ? "bg-opacity-20" 
                                                    : "hover:bg-opacity-10"
                                            }`}
                                            style={{
                                                backgroundColor: activeFilter === option.value 
                                                    ? `${option.value === "income" ? "#3DD9B6" : option.value === "loads" ? "#60A5FA" : option.value === "expired" ? "#A78BFA" : option.value === "unwashed" ? "#FB923C" : "#FACC15"}20`
                                                    : "transparent",
                                                color: isDarkMode ? "#13151B" : "#0B2B26",
                                            }}
                                        >
                                            <div>
                                                <div className="font-medium">{option.label}</div>
                                                <div className="text-xs opacity-70">{option.description}</div>
                                            </div>
                                            {activeFilter === option.value && option.sortable && (
                                                <span className="text-xs" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                                    {sortOrder === "desc" ? "↓" : "↑"}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                    
                                    {activeFilter && (
                                        <button
                                            onClick={clearFilters}
                                            className="w-full rounded border border-red-300 p-2 text-sm text-red-600 transition-all hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {loading ? (
                    [...Array(5)].map((_, index) => (
                        <SkeletonCard key={index} index={index} />
                    ))
                ) : (
                    summaryCards.map(({ label, value, icon, color, tooltip }, index) => (
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
                            className="rounded-xl border-2 p-5 transition-all"
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
                                    Filtered by: {getActiveFilterLabel()}
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