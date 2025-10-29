import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import AdminRecordTable from "./AdminRecordTable.jsx";
import { PhilippinePeso, Package, TimerOff, AlertCircle, Calendar, Filter, Droplets, Flower } from "lucide-react";
import { api } from "@/lib/api-config";

const MainPage = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState("all");
    const [selectedRange, setSelectedRange] = useState({ from: null, to: null });
    const [filteredRecordsCount, setFilteredRecordsCount] = useState(0);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const filterDropdownRef = useRef(null);

    // Load filters from localStorage on component mount
    const [activeFilters, setActiveFilters] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedFilters = localStorage.getItem('adminRecordFilters');
            if (savedFilters) {
                return JSON.parse(savedFilters);
            }
        }
        return {
            sortBy: "date", // Default to date sorting
            sortOrder: "desc", // Default to descending
            statusFilters: [],
            paymentFilters: [],
            serviceFilters: []
        };
    });

    // Save filters to localStorage whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('adminRecordFilters', JSON.stringify(activeFilters));
        }
    }, [activeFilters]);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const data = await api.get("api/admin/records");
                
                const mapped = data.map((r) => ({
                    id: r.id,
                    invoiceNumber: r.invoiceNumber,
                    name: r.customerName,
                    service: r.serviceName,
                    loads: r.loads,
                    detergent: r.detergent || "0",
                    fabric: r.fabric || "0",
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
                    gcashReference: r.gcashReference || "—",
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
                break;
        }

        return filtered;
    };

    const filteredRecords = filterRecordsByTime(records);

    // Update metrics calculation - REPLACE ONLY UNWASHED WITH FABRIC AND DETERGENT, KEEP EXPIRED
    const totalIncome = filteredRecords.reduce((acc, r) => acc + r.price, 0);
    const totalLoads = filteredRecords.reduce((acc, r) => acc + r.loads, 0);
    const totalFabric = filteredRecords.reduce((acc, r) => {
        const fabricQty = parseInt(r.fabric) || 0;
        return acc + fabricQty;
    }, 0);
    const totalDetergent = filteredRecords.reduce((acc, r) => {
        const detergentQty = parseInt(r.detergent) || 0;
        return acc + detergentQty;
    }, 0);
    const expired = filteredRecords.filter((r) => r.expired && !r.disposed).length;
    const unclaimed = filteredRecords.filter((r) => 
        r.pickupStatus === "UNCLAIMED" && 
        r.laundryStatus === "Completed" &&
        !r.expired && 
        !r.disposed
    ).length;

    // Format total income with commas
    const formatCurrency = (amount) => {
        return `₱${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    };

    // First row cards
    const firstRowCards = [
        {
            label: "Total Income",
            value: formatCurrency(totalIncome),
            icon: <PhilippinePeso size={26} />,
            color: "#3DD9B6",
            tooltip: "Total income from filtered transactions",
        },
        {
            label: "Total Fabric",
            value: totalFabric.toLocaleString(),
            icon: <Flower size={26} />,
            color: "#FB923C",
            tooltip: "Total fabric softener used",
        },
        {
            label: "Total Detergent",
            value: totalDetergent.toLocaleString(),
            icon: <Droplets size={26} />,
            color: "#A78BFA",
            tooltip: "Total detergent used",
        },
    ];

    // Second row cards
    const secondRowCards = [
        {
            label: "Total Loads",
            value: totalLoads.toLocaleString(),
            icon: <Package size={26} />,
            color: "#60A5FA",
            tooltip: "Total number of laundry loads in filtered period",
        },
        {
            label: "Unclaimed Loads",
            value: unclaimed.toLocaleString(),
            icon: <AlertCircle size={26} />,
            color: "#FACC15",
            tooltip: "Completed loads that haven't been picked up yet (excluding expired and disposed loads)",
        },
        {
            label: "Expired Loads",
            value: expired.toLocaleString(),
            icon: <TimerOff size={26} />,
            color: "#F87171",
            tooltip: "Loads that exceeded their pickup window (excluding disposed loads)",
        },
    ];

    const timeFilters = [
        { value: "today", label: "Today" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "year", label: "This Year" },
        { value: "all", label: "All Time" },
    ];

    // Filter options - UPDATED SERVICE AND PAYMENT FILTERS
    const filterOptions = {
        sortBy: [
            { id: "date", label: "Date" },
            { id: "income", label: "Income" },
            { id: "loads", label: "Loads" },
            { id: "name", label: "Name" }
        ],
        status: [
            { id: "expired", label: "Expired Only" },
            { id: "unclaimed", label: "Unclaimed Only" },
            { id: "disposed", label: "Disposed Only" },
            { id: "completed", label: "Completed Only" },
            { id: "in-progress", label: "In Progress Only" }
        ],
        payment: [
            { id: "paid", label: "Paid Only" },
            { id: "pending", label: "Pending Only" },
            { id: "gcash", label: "GCash Only" },
            { id: "cash", label: "Cash Only" }
        ],
        service: [
            { id: "wash-dry", label: "Wash & Dry Only" },
            { id: "wash", label: "Wash Only" },
            { id: "dry", label: "Dry Only" }
        ]
    };

    // Handle filter changes
    const handleSortChange = (sortId) => {
        setActiveFilters(prev => ({
            ...prev,
            sortBy: sortId
        }));
    };

    const handleSortOrderChange = (order) => {
        setActiveFilters(prev => ({
            ...prev,
            sortOrder: order
        }));
    };

    const handleStatusFilterChange = (statusId) => {
        setActiveFilters(prev => {
            const newStatusFilters = prev.statusFilters.includes(statusId)
                ? prev.statusFilters.filter(id => id !== statusId)
                : [...prev.statusFilters, statusId];
            
            return { ...prev, statusFilters: newStatusFilters };
        });
    };

    const handlePaymentFilterChange = (paymentId) => {
        setActiveFilters(prev => {
            const newPaymentFilters = prev.paymentFilters.includes(paymentId)
                ? prev.paymentFilters.filter(id => id !== paymentId)
                : [...prev.paymentFilters, paymentId];
            
            return { ...prev, paymentFilters: newPaymentFilters };
        });
    };

    const handleServiceFilterChange = (serviceId) => {
        setActiveFilters(prev => {
            const newServiceFilters = prev.serviceFilters.includes(serviceId)
                ? prev.serviceFilters.filter(id => id !== serviceId)
                : [...prev.serviceFilters, serviceId];
            
            return { ...prev, serviceFilters: newServiceFilters };
        });
    };

    const clearAllFilters = () => {
        const defaultFilters = {
            sortBy: "date",
            sortOrder: "desc",
            statusFilters: [],
            paymentFilters: [],
            serviceFilters: []
        };
        setActiveFilters(defaultFilters);
        // Also remove from localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('adminRecordFilters');
        }
    };

    const getActiveFilterCount = () => {
        let count = 0;
        // Don't count default date sorting as an active filter
        if (activeFilters.sortBy && activeFilters.sortBy !== "date") count++;
        if (activeFilters.sortOrder && activeFilters.sortOrder !== "desc") count++;
        count += activeFilters.statusFilters.length;
        count += activeFilters.paymentFilters.length;
        count += activeFilters.serviceFilters.length;
        return count;
    };

    // Handle filtered count update from AdminRecordTable
    const handleFilteredCountChange = (count) => {
        setFilteredRecordsCount(count);
    };

    // Skeleton components
    const SkeletonCard = ({ index }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border-2 p-5 transition-all"
            style={{
                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <motion.div
                    className="rounded-lg p-2 animate-pulse"
                    style={{
                        backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
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
                             backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                         }} />
                </motion.div>
            </div>
            
            <div className="flex items-center justify-between">
                <div className="h-5 w-28 rounded animate-pulse"
                     style={{
                         backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
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
                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-32 rounded animate-pulse"
                     style={{
                         backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                     }} />
                <div className="h-4 w-24 rounded animate-pulse"
                     style={{
                         backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                     }} />
            </div>

            <div className="overflow-x-auto rounded-lg border-2 mb-4"
                 style={{
                     borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                 }}>
                <div className="min-w-full">
                    <div className="grid grid-cols-11 gap-4 p-4"
                         style={{
                             backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                         }}>
                        {[...Array(11)].map((_, i) => (
                            <div key={i} className="h-4 rounded animate-pulse"
                                 style={{
                                     backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                                 }} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {[...Array(5)].map((_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-11 gap-4 p-4 rounded-lg border-2"
                         style={{
                             backgroundColor: isDarkMode ? "#334155" : "#f8fafc",
                             borderColor: isDarkMode ? "#475569" : "#e2e8f0",
                         }}>
                        {[...Array(11)].map((_, colIndex) => (
                            <div key={colIndex} 
                                 className={`h-4 rounded animate-pulse ${
                                     colIndex === 0 ? "w-4" : colIndex === 4 ? "w-16" : "w-full"
                                 }`}
                                 style={{
                                     backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                                     animationDelay: `${rowIndex * 0.1}s`
                                 }} />
                        ))}
                    </div>
                ))}
            </div>
        </motion.div>
    );

    return (
        <div 
            className="space-y-5 px-6 pb-5 pt-4 overflow-visible min-h-screen"
            style={{
                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
            }}
        >
            {/* Header - UPDATED DARK MODE COLORS */}
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
                            backgroundColor: isDarkMode ? "#1e293b" : "#0f172a",
                            color: isDarkMode ? "#f1f5f9" : "#f1f5f9",
                        }}
                    >
                        <Package size={22} />
                    </motion.div>
                    <div>
                        <p className="text-xl font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                            Admin Laundry Records
                        </p>
                        <p className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                            Manage and track all laundry transactions
                        </p>
                    </div>
                </div>

                {/* Time Filter and Filter Button - UPDATED DARK MODE COLORS */}
                <div className="flex items-center gap-2">
                    {/* Time Filter - UPDATED STYLING */}
                    <div className="flex items-center gap-2">
                        <Calendar
                            size={18}
                            style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                        />
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="rounded-lg border-2 px-3 py-2 text-sm focus:outline-none transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                color: isDarkMode ? "#f1f5f9" : "#0f172a",
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

                    {/* Filter Button - UPDATED STYLING */}
                    <div className="relative" ref={filterDropdownRef}>
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                                getActiveFilterCount() > 0 ? "ring-2 ring-offset-2 ring-blue-500" : ""
                            }`}
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                color: isDarkMode ? "#f1f5f9" : "#0f172a",
                            }}
                        >
                            <Filter size={16} />
                            <span>Filter</span>
                            {getActiveFilterCount() > 0 && (
                                <span className="ml-1 rounded-full bg-blue-500 px-2 py-1 text-xs text-white">
                                    {getActiveFilterCount()}
                                </span>
                            )}
                        </button>

                        {/* Filter Dropdown - UPDATED STYLING */}
                        {showFilterDropdown && (
                            <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border-2 p-4 shadow-lg"
                                 style={{
                                     backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                     borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                 }}>
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="font-semibold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                                        Filters
                                    </h3>
                                    {getActiveFilterCount() > 0 && (
                                        <button
                                            onClick={clearAllFilters}
                                            className="text-sm text-red-500 hover:text-red-700"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6 max-h-96 overflow-y-auto">
                                    {/* Sort By Section */}
                                    <div>
                                        <h4 className="mb-2 font-medium text-sm" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                                            Sort By
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            {filterOptions.sortBy.map((option) => (
                                                <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="sortBy"
                                                        checked={activeFilters.sortBy === option.id}
                                                        onChange={() => handleSortChange(option.id)}
                                                        className="rounded border-2"
                                                        style={{
                                                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                                        }}
                                                    />
                                                    <span className="text-sm" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                                                        {option.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSortOrderChange("asc")}
                                                className={`flex-1 text-sm py-1 px-2 rounded border ${
                                                    activeFilters.sortOrder === "asc" 
                                                        ? "bg-blue-500 text-white" 
                                                        : isDarkMode ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-700"
                                                }`}
                                            >
                                                Ascending
                                            </button>
                                            <button
                                                onClick={() => handleSortOrderChange("desc")}
                                                className={`flex-1 text-sm py-1 px-2 rounded border ${
                                                    activeFilters.sortOrder === "desc" 
                                                        ? "bg-blue-500 text-white" 
                                                        : isDarkMode ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-700"
                                                }`}
                                            >
                                                Descending
                                            </button>
                                        </div>
                                    </div>

                                    {/* Status Filters */}
                                    <div>
                                        <h4 className="mb-2 font-medium text-sm" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                                            Status
                                        </h4>
                                        <div className="space-y-2">
                                            {filterOptions.status.map((option) => (
                                                <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={activeFilters.statusFilters.includes(option.id)}
                                                        onChange={() => handleStatusFilterChange(option.id)}
                                                        className="rounded border-2"
                                                        style={{
                                                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                                        }}
                                                    />
                                                    <span className="text-sm" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                                                        {option.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment Filters */}
                                    <div>
                                        <h4 className="mb-2 font-medium text-sm" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                                            Payment
                                        </h4>
                                        <div className="space-y-2">
                                            {filterOptions.payment.map((option) => (
                                                <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={activeFilters.paymentFilters.includes(option.id)}
                                                        onChange={() => handlePaymentFilterChange(option.id)}
                                                        className="rounded border-2"
                                                        style={{
                                                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                                        }}
                                                    />
                                                    <span className="text-sm" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                                                        {option.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Service Filters */}
                                    <div>
                                        <h4 className="mb-2 font-medium text-sm" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                                            Service Type
                                        </h4>
                                        <div className="space-y-2">
                                            {filterOptions.service.map((option) => (
                                                <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={activeFilters.serviceFilters.includes(option.id)}
                                                        onChange={() => handleServiceFilterChange(option.id)}
                                                        className="rounded border-2"
                                                        style={{
                                                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                                        }}
                                                    />
                                                    <span className="text-sm" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                                                        {option.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Summary Cards - UPDATED DARK MODE COLORS */}
            <div className="space-y-5">
                {/* First Row - Total Income, Total Fabric, Total Detergent */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {loading ? (
                        [...Array(3)].map((_, index) => (
                            <SkeletonCard key={index} index={index} />
                        ))
                    ) : (
                        firstRowCards.map(({ label, value, icon, color, tooltip }, index) => (
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
                                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
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
                                        <p className="text-2xl font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                            {value}
                                        </p>
                                    </motion.div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                        {label}
                                    </h3>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Second Row - Total Loads, Unclaimed Loads, Expired Loads */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {loading ? (
                        [...Array(3)].map((_, index) => (
                            <SkeletonCard key={index} index={index + 3} />
                        ))
                    ) : (
                        secondRowCards.map(({ label, value, icon, color, tooltip }, index) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (index + 3) * 0.1 }}
                                whileHover={{ 
                                    scale: 1.03,
                                    y: -2,
                                    transition: { duration: 0.2 }
                                }}
                                className="rounded-xl border-2 p-5 transition-all"
                                style={{
                                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
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
                                        transition={{ delay: (index + 3) * 0.2 }}
                                        className="text-right"
                                    >
                                        <p className="text-2xl font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                            {value}
                                        </p>
                                    </motion.div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                        {label}
                                    </h3>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Record Table - UPDATED DARK MODE COLORS */}
            {loading ? (
                <SkeletonTable />
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border-2 p-5 transition-all"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-lg font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                            Laundry Records
                        </p>
                        <span className="text-sm font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                            {filteredRecordsCount > 0 ? filteredRecordsCount : filteredRecords.length} records found
                        </span>
                    </div>
                    <AdminRecordTable
                        items={filteredRecords}
                        allItems={records}
                        isDarkMode={isDarkMode}
                        timeFilter={timeFilter}
                        selectedRange={selectedRange}
                        onDateRangeChange={setSelectedRange}
                        onFilteredCountChange={handleFilteredCountChange}
                        activeFilters={activeFilters}
                    />
                </motion.div>
            )}
        </div>
    );
};

export default MainPage;