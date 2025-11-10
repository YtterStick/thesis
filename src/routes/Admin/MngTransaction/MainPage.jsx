import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import AdminRecordTable from "./AdminRecordTable.jsx";
import { PhilippinePeso, Package, TimerOff, AlertCircle, Calendar, Filter, Droplets, Flower, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api-config";
import { useNavigate, useLocation } from "react-router-dom";

const MainPage = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const navigate = useNavigate();
    const location = useLocation();
    
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState("today");
    const [selectedRange, setSelectedRange] = useState({ from: null, to: null });
    const [filteredRecordsCount, setFilteredRecordsCount] = useState(0);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    
    // PAGINATION STATE
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    
    // SUMMARY STATE
    const [summaryData, setSummaryData] = useState({
        totalIncome: 0,
        totalLoads: 0,
        totalFabric: 0,
        totalDetergent: 0,
        expiredCount: 0,
        unclaimedCount: 0,
        totalRecords: 0
    });
    
    // AUTO SEARCH STATE
    const [autoSearchTerm, setAutoSearchTerm] = useState("");

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
            sortBy: "date",
            sortOrder: "desc",
            statusFilters: [],
            paymentFilters: [],
            serviceFilters: []
        };
    });

    // AUTO SEARCH EFFECT
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const searchName = urlParams.get('search') || sessionStorage.getItem('autoSearchName');
        
        if (searchName) {
            console.log("🔍 Auto-searching for:", searchName);
            setAutoSearchTerm(searchName);
            sessionStorage.removeItem('autoSearchName');
            
            if (urlParams.get('search')) {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }
    }, [location.search]);

    // Save filters to localStorage whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('adminRecordFilters', JSON.stringify(activeFilters));
        }
    }, [activeFilters]);

    // FETCH SUMMARY DATA
    const fetchSummaryData = async (timeFilter = "all") => {
        try {
            setSummaryLoading(true);
            console.log(`📊 Fetching summary data for: ${timeFilter}`);
            
            let summary;
            if (timeFilter === "all") {
                summary = await api.get("/admin/records/summary");
            } else {
                summary = await api.get(`/admin/records/summary/${timeFilter}`);
            }
            
            setSummaryData(summary);
            console.log(`✅ Summary data loaded:`, summary);
            
        } catch (error) {
            console.error("❌ Summary fetch error:", error);
        } finally {
            setSummaryLoading(false);
        }
    };

    // FETCH RECORDS WITH PAGINATION
    const fetchRecords = async (page = 0, size = pageSize) => {
        try {
            setLoading(true);
            console.log(`📥 Fetching records - Page: ${page}, Size: ${size}`);
            
            const data = await api.get(`/admin/records?page=${page}&size=${size}`);
            
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
            console.log(`✅ Loaded ${mapped.length} records (Page ${page + 1})`);
            
        } catch (error) {
            console.error("❌ Record fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    // FETCH TOTAL COUNT
    const fetchTotalCount = async () => {
        try {
            const count = await api.get("/admin/records/count");
            setTotalRecords(count);
            const calculatedPages = Math.ceil(count / pageSize);
            setTotalPages(calculatedPages);
            console.log(`📊 Total records: ${count}, Pages: ${calculatedPages}`);
        } catch (error) {
            console.error("❌ Failed to fetch total count:", error);
        }
    };

    // Load data on component mount
    useEffect(() => {
        fetchSummaryData(timeFilter);
        fetchRecords(currentPage, pageSize);
        fetchTotalCount();
    }, []);

    // Load records when page or page size changes
    useEffect(() => {
        fetchRecords(currentPage, pageSize);
    }, [currentPage, pageSize]);

    // Load summary when time filter changes
    useEffect(() => {
        fetchSummaryData(timeFilter);
    }, [timeFilter]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handlePointerDown = (e) => {
            if (filterDropdownRef.current?.contains(e.target)) return;
            setShowFilterDropdown(false);
        };
        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    // Format total income with commas
    const formatCurrency = (amount) => {
        return `₱${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    };

    // PAGINATION FUNCTIONS
    const goToPage = (page) => {
        if (page >= 0 && page < totalPages) {
            setCurrentPage(page);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    // First row cards - USING SUMMARY DATA
    const firstRowCards = [
        {
            label: "Total Income",
            value: formatCurrency(summaryData.totalIncome || 0),
            icon: <PhilippinePeso size={26} />,
            color: "#3DD9B6",
            tooltip: `Total income from ${timeFilter} transactions`,
            loading: summaryLoading
        },
        {
            label: "Total Fabric",
            value: (summaryData.totalFabric || 0).toLocaleString(),
            icon: <Flower size={26} />,
            color: "#FB923C",
            tooltip: `Total fabric softener used in ${timeFilter}`,
            loading: summaryLoading
        },
        {
            label: "Total Detergent",
            value: (summaryData.totalDetergent || 0).toLocaleString(),
            icon: <Droplets size={26} />,
            color: "#A78BFA",
            tooltip: `Total detergent used in ${timeFilter}`,
            loading: summaryLoading
        },
    ];

    // Second row cards - USING SUMMARY DATA
    const secondRowCards = [
        {
            label: "Total Loads",
            value: (summaryData.totalLoads || 0).toLocaleString(),
            icon: <Package size={26} />,
            color: "#60A5FA",
            tooltip: `Total number of laundry loads in ${timeFilter}`,
            loading: summaryLoading
        },
        {
            label: "Unclaimed Loads",
            value: (summaryData.unclaimedCount || 0).toLocaleString(),
            icon: <AlertCircle size={26} />,
            color: "#FACC15",
            tooltip: "Completed loads that haven't been picked up yet (excluding expired and disposed loads)",
            loading: summaryLoading
        },
        {
            label: "Expired Loads",
            value: (summaryData.expiredCount || 0).toLocaleString(),
            icon: <TimerOff size={26} />,
            color: "#F87171",
            tooltip: "Loads that exceeded their pickup window (excluding disposed loads)",
            loading: summaryLoading
        },
    ];

    const timeFilters = [
        { value: "today", label: "Today" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "year", label: "This Year" },
        { value: "all", label: "All Time" },
    ];

    // Filter options
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
        if (typeof window !== 'undefined') {
            localStorage.removeItem('adminRecordFilters');
        }
    };

    const getActiveFilterCount = () => {
        let count = 0;
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

    // Card component that handles loading state
    const SummaryCard = ({ label, value, icon, color, tooltip, loading }) => {
        if (loading) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
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
                        <div className="h-6 w-20 rounded animate-pulse"
                             style={{
                                 backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                             }} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="h-5 w-28 rounded animate-pulse"
                             style={{
                                 backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                             }} />
                    </div>
                </motion.div>
            );
        }

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
        );
    };

    return (
        <div 
            className="space-y-5 px-6 pb-5 pt-4 overflow-visible min-h-screen"
            style={{
                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
            }}
        >
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
                            {summaryData.totalRecords > 0 && ` • ${summaryData.totalRecords.toLocaleString()} total records`}
                        </p>
                    </div>
                </div>

                {/* Page Size Selector and Filter Button */}
                <div className="flex items-center gap-2">
                    {/* Page Size Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                            Show:
                        </span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                const newSize = parseInt(e.target.value);
                                setPageSize(newSize);
                                setCurrentPage(0);
                                fetchRecords(0, newSize);
                                fetchTotalCount();
                            }}
                            className="rounded-lg border-2 px-3 py-2 text-sm focus:outline-none transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                color: isDarkMode ? "#f1f5f9" : "#0f172a",
                            }}
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                        </select>
                    </div>

                    {/* Time Filter */}
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

                    {/* Filter Button */}
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

                        {/* Filter Dropdown */}
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

            {/* Summary Cards */}
            <div className="space-y-5">
                {/* First Row - Total Income, Total Fabric, Total Detergent */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {firstRowCards.map((card, index) => (
                        <SummaryCard key={card.label} {...card} index={index} />
                    ))}
                </div>

                {/* Second Row - Total Loads, Unclaimed Loads, Expired Loads */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {secondRowCards.map((card, index) => (
                        <SummaryCard key={card.label} {...card} index={index + 3} />
                    ))}
                </div>
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
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-lg font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                Laundry Records
                            </p>
                            <p className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                                Page {currentPage + 1} of {totalPages} • Showing {records.length} records
                                {totalRecords > 0 && ` of ${totalRecords.toLocaleString()} total`}
                            </p>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                            {filteredRecordsCount > 0 ? filteredRecordsCount : records.length} records found
                        </span>
                    </div>
                    
                    <AdminRecordTable
                        items={records}
                        allItems={records}
                        isDarkMode={isDarkMode}
                        timeFilter={timeFilter}
                        selectedRange={selectedRange}
                        onDateRangeChange={setSelectedRange}
                        onFilteredCountChange={handleFilteredCountChange}
                        activeFilters={activeFilters}
                        autoSearchTerm={autoSearchTerm}
                    />

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: isDarkMode ? '#334155' : '#cbd5e1' }}>
                            <div className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                                Page {currentPage + 1} of {totalPages}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={goToPrevPage}
                                    disabled={currentPage === 0}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                        currentPage === 0
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:scale-105 hover:opacity-90'
                                    }`}
                                    style={{
                                        backgroundColor: isDarkMode ? "#334155" : "#0f172a",
                                        color: "#f1f5f9",
                                        border: `2px solid ${isDarkMode ? "#475569" : "#0f172a"}`,
                                    }}
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = index;
                                        } else if (currentPage < 3) {
                                            pageNum = index;
                                        } else if (currentPage > totalPages - 4) {
                                            pageNum = totalPages - 5 + index;
                                        } else {
                                            pageNum = currentPage - 2 + index;
                                        }

                                        if (pageNum >= totalPages) return null;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => goToPage(pageNum)}
                                                className={`w-8 h-8 rounded text-sm font-medium transition-all ${
                                                    currentPage === pageNum
                                                        ? 'scale-110 ring-2 ring-blue-500'
                                                        : 'hover:scale-105 hover:opacity-90'
                                                }`}
                                                style={{
                                                    backgroundColor: currentPage === pageNum
                                                        ? isDarkMode ? "#3DD9B6" : "#0891B2"
                                                        : isDarkMode ? "#334155" : "#f1f5f9",
                                                    color: currentPage === pageNum
                                                        ? "#ffffff"
                                                        : isDarkMode ? "#f1f5f9" : "#0f172a",
                                                    border: `1px solid ${isDarkMode ? "#475569" : "#cbd5e1"}`,
                                                }}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages - 1}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                        currentPage === totalPages - 1
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:scale-105 hover:opacity-90'
                                    }`}
                                    style={{
                                        backgroundColor: isDarkMode ? "#334155" : "#0f172a",
                                        color: "#f1f5f9",
                                        border: `2px solid ${isDarkMode ? "#475569" : "#0f172a"}`,
                                    }}
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default MainPage;