import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import AdminRecordTable from "./AdminRecordTable.jsx";
import { PhilippinePeso, Package, TimerOff, AlertCircle, Calendar, Filter, Droplets, Flower, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
    const [dataLoaded, setDataLoaded] = useState(false);
    const [paginationLoading, setPaginationLoading] = useState(false);

    const [timeFilter, setTimeFilter] = useState("today");
    const [selectedRange, setSelectedRange] = useState({ from: null, to: null });
    const [filteredRecordsCount, setFilteredRecordsCount] = useState(0);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(() => {
        if (typeof window !== "undefined") {
            const savedSize = localStorage.getItem("adminPageSize");
            return savedSize ? parseInt(savedSize) : 50;
        }
        return 50;
    });
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [summaryData, setSummaryData] = useState({
        totalIncome: 0,
        totalLoads: 0,
        totalFabric: 0,
        totalDetergent: 0,
        expiredCount: 0,
        unclaimedCount: 0,
        totalRecords: 0,
    });

    const [autoSearchTerm, setAutoSearchTerm] = useState("");

    const filterDropdownRef = useRef(null);

    const [activeFilters, setActiveFilters] = useState(() => {
        if (typeof window !== "undefined") {
            const savedFilters = localStorage.getItem("adminRecordFilters");
            if (savedFilters) {
                return JSON.parse(savedFilters);
            }
        }
        return {
            sortBy: "date",
            sortOrder: "desc",
            statusFilters: [],
            paymentFilters: [],
            serviceFilters: [],
        };
    });

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const searchName = urlParams.get("search") || sessionStorage.getItem("autoSearchName");

        if (searchName) {
            console.log("🔍 Auto-searching for:", searchName);
            setAutoSearchTerm(searchName);
            sessionStorage.removeItem("autoSearchName");

            if (urlParams.get("search")) {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, "", newUrl);
            }
        }
    }, [location.search]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("adminPageSize", pageSize.toString());
        }
    }, [pageSize]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("adminRecordFilters", JSON.stringify(activeFilters));
        }
    }, [activeFilters]);

    // Use ref to track initial load completion (ref changes don't trigger re-renders)
    const initialLoadDone = useRef(false);

    // Initial load - fetch everything together to prevent race conditions
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                setSummaryLoading(true);
                setDataLoaded(false);
                setPaginationLoading(true);

                console.log("🚀 Initial data loading...");

                // Fetch all data in parallel for initial load to prevent race conditions
                await Promise.all([fetchSummaryData(timeFilter), fetchRecords(currentPage, pageSize, timeFilter), fetchTotalCount(timeFilter)]);
            } catch (error) {
                console.error("❌ Error loading initial data:", error);
            } finally {
                setLoading(false);
                setSummaryLoading(false);
                setDataLoaded(true);
                setPaginationLoading(false);
                // Mark initial load as done AFTER state updates
                initialLoadDone.current = true;
            }
        };

        loadInitialData();
    }, []); // Empty dependency array - only run on mount

    // Fetch records and total count when page, pageSize, or timeFilter changes
    useEffect(() => {
        // Skip if initial load hasn't completed yet
        if (!initialLoadDone.current) return;

        const loadRecordsData = async () => {
            try {
                setLoading(true);
                setPaginationLoading(true);

                console.log(`🔄 Fetching records for page ${currentPage}, Search: ${autoSearchTerm}`);

                // Only fetch records and total count, NOT summary
                await Promise.all([fetchRecords(currentPage, pageSize, timeFilter, autoSearchTerm), fetchTotalCount(timeFilter, autoSearchTerm)]);
            } catch (error) {
                console.error("❌ Error loading records data:", error);
            } finally {
                setLoading(false);
                setPaginationLoading(false);
            }
        };

        const timeout = setTimeout(() => {
            loadRecordsData();
        }, 300); // Debounce search

        return () => clearTimeout(timeout);
    }, [currentPage, pageSize, timeFilter, autoSearchTerm]);

    // Fetch summary data only when timeFilter changes (after initial load)
    useEffect(() => {
        // Skip if initial load hasn't completed yet
        if (!initialLoadDone.current) return;

        const loadSummaryData = async () => {
            try {
                setSummaryLoading(true);
                await fetchSummaryData(timeFilter);
            } catch (error) {
                console.error("❌ Error loading summary data:", error);
            } finally {
                setSummaryLoading(false);
            }
        };

        loadSummaryData();
    }, [timeFilter]);

    useEffect(() => {
        if (timeFilter !== "today") {
            setAutoSearchTerm("");
        }
    }, [timeFilter]);

    useEffect(() => {
        const handlePointerDown = (e) => {
            if (filterDropdownRef.current?.contains(e.target)) return;
            setShowFilterDropdown(false);
        };
        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    const fetchSummaryData = async (filter = "today") => {
        try {
            console.log(`📊 Fetching summary data for: ${filter}`);

            let summary;
            if (filter === "all") {
                summary = await api.get("/admin/records/summary");
            } else {
                summary = await api.get(`/admin/records/summary/${filter}`);
            }

            setSummaryData(summary);
            console.log(`✅ Summary data loaded:`, summary);
        } catch (error) {
            console.error("❌ Summary fetch error:", error);
            setSummaryData({
                totalIncome: 0,
                totalLoads: 0,
                totalFabric: 0,
                totalDetergent: 0,
                expiredCount: 0,
                unclaimedCount: 0,
                totalRecords: 0,
            });
        }
    };

    const fetchRecords = async (page = 0, size = pageSize, filter = timeFilter, search = "") => {
        try {
            setLoading(true);
            console.log(`📥 Fetching records - Page: ${page}, Size: ${size}, Filter: ${filter}, Search: ${search}`);

            let data;
            const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
            if (filter === "all") {
                data = await api.get(`/admin/records?page=${page}&size=${size}${searchParam}`);
            } else {
                data = await api.get(`/admin/records/filtered?page=${page}&size=${size}&timeFilter=${filter}${searchParam}`);
            }

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
                issueDate: r.issueDate, // ✅ ADDED: issueDate from backend
                dueDate: r.dueDate, // ✅ ADDED: dueDate from backend
                paid: r.paid || false,
                expired: r.expired,
                disposed: r.disposed || false,
                disposedBy: r.disposedBy || "—",
                gcashReference: r.gcashReference || "—",
                claimDate: r.claimDate,
            }));

            setRecords(mapped);
            console.log(`✅ Loaded ${mapped.length} records (Page ${page + 1}, Filter: ${filter})`);
        } catch (error) {
            console.error("❌ Record fetch error:", error);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTotalCount = async (filter = timeFilter, search = "") => {
        try {
            setPaginationLoading(true);
            let count;
            const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
            if (filter === "all") {
                count = await api.get(`/admin/records/count?${searchParam.substring(1)}`);
            } else {
                count = await api.get(`/admin/records/count/filtered?timeFilter=${filter}${searchParam}`);
            }

            setTotalRecords(count);
            const calculatedPages = Math.ceil(count / pageSize);
            setTotalPages(calculatedPages);
            console.log(`📊 Total records (${filter}): ${count}, Pages: ${calculatedPages}`);
        } catch (error) {
            console.error("❌ Failed to fetch total count:", error);
            setTotalRecords(0);
            setTotalPages(0);
        } finally {
            setPaginationLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return `₱${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
    };

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

    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(0);
    };

    const firstRowCards = [
        {
            label: "Total Income",
            value: formatCurrency(summaryData.totalIncome || 0),
            icon: <PhilippinePeso size={26} />,
            color: "#3b82f6",
            tooltip: `Total income from ${timeFilter} transactions`,
            loading: summaryLoading,
        },
        {
            label: "Total Fabric",
            value: (summaryData.totalFabric || 0).toLocaleString(),
            icon: <Flower size={26} />,
            color: "#FB923C",
            tooltip: `Total fabric softener used in ${timeFilter}`,
            loading: summaryLoading,
        },
        {
            label: "Total Detergent",
            value: (summaryData.totalDetergent || 0).toLocaleString(),
            icon: <Droplets size={26} />,
            color: "#A78BFA",
            tooltip: `Total detergent used in ${timeFilter}`,
            loading: summaryLoading,
        },
    ];

    const secondRowCards = [
        {
            label: "Total Loads",
            value: (summaryData.totalLoads || 0).toLocaleString(),
            icon: <Package size={26} />,
            color: "#60A5FA",
            tooltip: `Total number of laundry loads in ${timeFilter}`,
            loading: summaryLoading,
        },
        {
            label: "Unclaimed Loads",
            value: (summaryData.unclaimedCount || 0).toLocaleString(),
            icon: <AlertCircle size={26} />,
            color: "#FACC15",
            tooltip: "Completed loads that haven't been picked up yet (excluding expired and disposed loads)",
            loading: summaryLoading,
        },
        {
            label: "Expired Loads",
            value: (summaryData.expiredCount || 0).toLocaleString(),
            icon: <TimerOff size={26} />,
            color: "#F87171",
            tooltip: "Loads that exceeded their pickup window (excluding disposed loads)",
            loading: summaryLoading,
        },
    ];

    const timeFilters = [
        { value: "today", label: "Today" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "year", label: "This Year" },
        { value: "all", label: "All Time" },
    ];

    const filterOptions = {
        sortBy: [
            { id: "date", label: "Date" },
            { id: "income", label: "Income" },
            { id: "loads", label: "Loads" },
            { id: "name", label: "Name" },
        ],
        status: [
            { id: "expired", label: "Expired Only" },
            { id: "unclaimed", label: "Unclaimed Only" },
            { id: "disposed", label: "Disposed Only" },
            { id: "completed", label: "Completed Only" },
            { id: "in-progress", label: "In Progress Only" },
        ],
        payment: [
            { id: "paid", label: "Paid Only" },
            { id: "pending", label: "Pending Only" },
            { id: "gcash", label: "GCash Only" },
            { id: "cash", label: "Cash Only" },
        ],
        service: [
            { id: "wash-dry", label: "Wash & Dry Only" },
            { id: "wash", label: "Wash Only" },
            { id: "dry", label: "Dry Only" },
        ],
    };

    const handleSortChange = (sortId) => {
        setActiveFilters((prev) => ({
            ...prev,
            sortBy: sortId,
        }));
    };

    const handleSortOrderChange = (order) => {
        setActiveFilters((prev) => ({
            ...prev,
            sortOrder: order,
        }));
    };

    const handleStatusFilterChange = (statusId) => {
        setActiveFilters((prev) => {
            const newStatusFilters = prev.statusFilters.includes(statusId)
                ? prev.statusFilters.filter((id) => id !== statusId)
                : [...prev.statusFilters, statusId];

            return { ...prev, statusFilters: newStatusFilters };
        });
    };

    const handlePaymentFilterChange = (paymentId) => {
        setActiveFilters((prev) => {
            const newPaymentFilters = prev.paymentFilters.includes(paymentId)
                ? prev.paymentFilters.filter((id) => id !== paymentId)
                : [...prev.paymentFilters, paymentId];

            return { ...prev, paymentFilters: newPaymentFilters };
        });
    };

    const handleServiceFilterChange = (serviceId) => {
        setActiveFilters((prev) => {
            const newServiceFilters = prev.serviceFilters.includes(serviceId)
                ? prev.serviceFilters.filter((id) => id !== serviceId)
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
            serviceFilters: [],
        };
        setActiveFilters(defaultFilters);
        if (typeof window !== "undefined") {
            localStorage.removeItem("adminRecordFilters");
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

    const handleFilteredCountChange = (count) => {
        setFilteredRecordsCount(count);
    };

    const SkeletonCard = () => (
        <div
            className="rounded-xl border p-5"
            style={{
                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
            }}
        >
            <div className="mb-4 flex items-center justify-between">
                <div
                    className="animate-pulse rounded-lg p-2"
                    style={{
                        backgroundColor: "var(--admin-accent-soft)",
                    }}
                >
                    <div className="h-6 w-6 opacity-0">icon</div>
                </div>
                <div className="text-right">
                    <div
                        className="h-6 w-20 animate-pulse rounded"
                        style={{
                            backgroundColor: "var(--admin-accent-soft)",
                        }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div
                    className="h-5 w-28 animate-pulse rounded"
                    style={{
                        backgroundColor: "var(--admin-accent-soft)",
                    }}
                />
            </div>
        </div>
    );

    const SkeletonTable = () => (
        <div
            className="rounded-xl border p-5 shadow-sm"
            style={{
                backgroundColor: "var(--admin-card-bg)",
                borderColor: "var(--admin-card-border)",
            }}
        >
            <div className="mb-4 flex items-center justify-between">
                <div
                    className="h-6 w-32 animate-pulse rounded"
                    style={{
                        backgroundColor: "var(--admin-accent-soft)",
                    }}
                />
                <div
                    className="h-4 w-24 animate-pulse rounded"
                    style={{
                        backgroundColor: "var(--admin-accent-soft)",
                    }}
                />
            </div>

            <div
                className="mb-4 overflow-x-auto rounded-lg border"
                style={{
                    borderColor: "var(--admin-card-border)",
                }}
            >
                <div className="min-w-full">
                    <div
                        className="grid grid-cols-12 gap-4 p-4"
                        style={{
                            backgroundColor: "var(--admin-accent-soft)",
                        }}
                    >
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="h-4 animate-pulse rounded"
                                style={{
                                    backgroundColor: "var(--admin-accent-soft)",
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {[...Array(5)].map((_, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid grid-cols-12 gap-4 rounded-lg border p-4"
                        style={{
                            backgroundColor: "var(--admin-card-bg)",
                            borderColor: "var(--admin-card-border)",
                        }}
                    >
                        {[...Array(12)].map((_, colIndex) => (
                            <div
                                key={colIndex}
                                className={`h-4 animate-pulse rounded ${colIndex === 0 ? "w-4" : colIndex === 4 ? "w-16" : "w-full"}`}
                                style={{
                                    backgroundColor: "var(--admin-accent-soft)",
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );

    const SummaryCard = ({ label, value, icon, color, tooltip, loading }) => {
        if (loading) {
            return <SkeletonCard />;
        }

        return (
            <div
                className="rounded-xl border p-5 transition-all shadow-sm hover:scale-[1.03] hover:-translate-y-0.5"
                style={{
                    backgroundColor: "var(--admin-card-bg)",
                    borderColor: "var(--admin-card-border)",
                }}
                title={tooltip}
            >
                <div className="mb-4 flex items-center justify-between">
                    <div
                        className="hover:rotate-5 rounded-lg p-2 transition-transform hover:scale-110"
                        style={{
                            backgroundColor: `${color}20`,
                            color: color,
                        }}
                    >
                        {icon}
                    </div>
                    <div className="text-right">
                        <p
                            className="text-2xl font-bold"
                            style={{ color: "var(--admin-text-primary)" }}
                        >
                            {value}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <h3
                        className="text-lg font-semibold"
                        style={{ color: "var(--admin-text-primary)" }}
                    >
                        {label}
                    </h3>
                </div>
            </div>
        );
    };

    // Loading indicator for pagination info
    const PaginationInfoLoader = () => (
        <div className="flex animate-pulse items-center gap-2">
            <Loader2
                className="h-3 w-3 animate-spin"
                style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
            />
            <span
                className="text-sm"
                style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
            >
                Calculating totals...
            </span>
        </div>
    );

    // Format the page info text
    const getPageInfoText = () => {
        if (paginationLoading) {
            return "Calculating page information...";
        }

        let text = `Page ${currentPage + 1}`;
        if (totalPages > 0) {
            text += ` of ${totalPages}`;
        }
        text += ` • Showing ${records.length} records`;
        if (totalRecords > 0) {
            text += ` of ${totalRecords.toLocaleString()} total`;
        }
        return text;
    };

    // Format the records found text
    const getRecordsFoundText = () => {
        if (paginationLoading) {
            return "Calculating...";
        }
        return `${filteredRecordsCount > 0 ? filteredRecordsCount : records.length} records found`;
    };

    return (
        <div className="space-y-5 overflow-visible px-6 pb-5 pt-4">
            {/* Header */}
            <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="rounded-lg p-2 shadow-sm transition-transform hover:scale-110"
                        style={{
                            backgroundColor: "var(--admin-accent)",
                            color: "var(--admin-card-bg)",
                        }}
                    >
                        <Package size={22} />
                    </div>
                    <div>
                        <p
                            className="text-xl font-bold"
                            style={{ color: "var(--admin-text-primary)" }}
                        >
                            Admin Laundry Records
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: "var(--admin-text-secondary)" }}
                        >
                            Manage and track all laundry transactions
                            {!summaryLoading &&
                                summaryData.totalRecords > 0 &&
                                ` • ${summaryData.totalRecords.toLocaleString()} total ${timeFilter} records`}
                            {summaryLoading && (
                                <span className="flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Loading summary...
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Page Size Selector and Filter Button */}
                <div className="flex items-center gap-2">
                    {/* Page Size Selector */}
                    <div className="flex items-center gap-2">
                        <span
                            className="text-sm"
                            style={{ color: "var(--admin-text-primary)" }}
                        >
                            Show:
                        </span>
                        <select
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                            className="rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none"
                            style={{
                                backgroundColor: "var(--admin-card-bg)",
                                borderColor: "var(--admin-card-border)",
                                color: "var(--admin-text-primary)",
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
                            style={{ color: "var(--admin-text-primary)" }}
                        />
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none"
                            style={{
                                backgroundColor: "var(--admin-card-bg)",
                                borderColor: "var(--admin-card-border)",
                                color: "var(--admin-text-primary)",
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
                    <div
                        className="relative"
                        ref={filterDropdownRef}
                    >
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                                getActiveFilterCount() > 0 ? "ring-2 ring-blue-500 ring-offset-2" : ""
                            }`}
                            style={{
                                backgroundColor: "var(--admin-card-bg)",
                                borderColor: "var(--admin-card-border)",
                                color: "var(--admin-text-primary)",
                            }}
                        >
                            <Filter size={16} />
                            <span>Filter</span>
                            {getActiveFilterCount() > 0 && (
                                <span className="ml-1 rounded-full bg-blue-500 px-2 py-1 text-xs text-white">{getActiveFilterCount()}</span>
                            )}
                        </button>

                        {/* Filter Dropdown */}
                        {showFilterDropdown && (
                            <div
                                className="absolute right-0 z-50 mt-2 w-80 rounded-lg border p-4 shadow-lg"
                                style={{
                                    backgroundColor: "var(--admin-card-bg)",
                                    borderColor: "var(--admin-card-border)",
                                }}
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <h3
                                        className="font-semibold"
                                        style={{ color: "var(--admin-text-primary)" }}
                                    >
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

                                <div className="max-h-96 space-y-6 overflow-y-auto">
                                    {/* Sort By Section */}
                                    <div>
                                        <h4
                                            className="mb-2 text-sm font-medium"
                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                        >
                                            Sort By
                                        </h4>
                                        <div className="mb-3 grid grid-cols-2 gap-2">
                                            {filterOptions.sortBy.map((option) => (
                                                <label
                                                    key={option.id}
                                                    className="flex cursor-pointer items-center space-x-2"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="sortBy"
                                                        checked={activeFilters.sortBy === option.id}
                                                        onChange={() => handleSortChange(option.id)}
                                                        className="rounded border"
                                                        style={{
                                                            borderColor: "var(--admin-card-border)",
                                                        }}
                                                    />
                                                    <span
                                                        className="text-sm"
                                                        style={{ color: "var(--admin-text-primary)" }}
                                                    >
                                                        {option.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSortOrderChange("asc")}
                                                className={`flex-1 rounded border px-2 py-1 text-sm ${
                                                    activeFilters.sortOrder === "asc"
                                                        ? "bg-blue-500 text-white"
                                                        : isDarkMode
                                                          ? "bg-slate-700 text-slate-300"
                                                          : "bg-gray-100 text-gray-700"
                                                }`}
                                            >
                                                Ascending
                                            </button>
                                            <button
                                                onClick={() => handleSortOrderChange("desc")}
                                                className={`flex-1 rounded border px-2 py-1 text-sm ${
                                                    activeFilters.sortOrder === "desc"
                                                        ? "bg-blue-500 text-white"
                                                        : isDarkMode
                                                          ? "bg-slate-700 text-slate-300"
                                                          : "bg-gray-100 text-gray-700"
                                                }`}
                                            >
                                                Descending
                                            </button>
                                        </div>
                                    </div>

                                    {/* Status Filters */}
                                    <div>
                                        <h4
                                            className="mb-2 text-sm font-medium"
                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                        >
                                            Status
                                        </h4>
                                        <div className="space-y-2">
                                            {filterOptions.status.map((option) => (
                                                <label
                                                    key={option.id}
                                                    className="flex cursor-pointer items-center space-x-2"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={activeFilters.statusFilters.includes(option.id)}
                                                        onChange={() => handleStatusFilterChange(option.id)}
                                                        className="rounded border"
                                                        style={{
                                                            borderColor: "var(--admin-card-border)",
                                                        }}
                                                    />
                                                    <span
                                                        className="text-sm"
                                                        style={{ color: "var(--admin-text-primary)" }}
                                                    >
                                                        {option.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment Filters */}
                                    <div>
                                        <h4
                                            className="mb-2 text-sm font-medium"
                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                        >
                                            Payment
                                        </h4>
                                        <div className="space-y-2">
                                            {filterOptions.payment.map((option) => (
                                                <label
                                                    key={option.id}
                                                    className="flex cursor-pointer items-center space-x-2"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={activeFilters.paymentFilters.includes(option.id)}
                                                        onChange={() => handlePaymentFilterChange(option.id)}
                                                        className="rounded border"
                                                        style={{
                                                            borderColor: "var(--admin-card-border)",
                                                        }}
                                                    />
                                                    <span
                                                        className="text-sm"
                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                    >
                                                        {option.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Service Filters */}
                                    <div>
                                        <h4
                                            className="mb-2 text-sm font-medium"
                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                        >
                                            Service Type
                                        </h4>
                                        <div className="space-y-2">
                                            {filterOptions.service.map((option) => (
                                                <label
                                                    key={option.id}
                                                    className="flex cursor-pointer items-center space-x-2"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={activeFilters.serviceFilters.includes(option.id)}
                                                        onChange={() => handleServiceFilterChange(option.id)}
                                                        className="rounded border"
                                                        style={{
                                                            borderColor: "var(--admin-card-border)",
                                                        }}
                                                    />
                                                    <span
                                                        className="text-sm"
                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                    >
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
            </div>

            {/* Summary Cards */}
            <div className="space-y-5">
                {/* First Row - Total Income, Total Fabric, Total Detergent */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {firstRowCards.map((card) => (
                        <SummaryCard
                            key={card.label}
                            {...card}
                        />
                    ))}
                </div>

                {/* Second Row - Total Loads, Unclaimed Loads, Expired Loads */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {secondRowCards.map((card) => (
                        <SummaryCard
                            key={card.label}
                            {...card}
                        />
                    ))}
                </div>
            </div>

            {/* Record Table */}
            {!dataLoaded ? (
                <SkeletonTable />
            ) : (
                <div
                    className="relative rounded-xl border p-5 transition-all shadow-sm"
                    style={{
                        backgroundColor: "var(--admin-card-bg)",
                        borderColor: "var(--admin-card-border)",
                    }}
                >
                    {loading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-slate-900/10 dark:bg-slate-900/30 backdrop-blur-[1px]">
                            <div className="flex items-center gap-3 rounded-lg border bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-950">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Updating records...</span>
                            </div>
                        </div>
                    )}
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p
                                className="text-lg font-bold"
                                style={{ color: "var(--admin-text-primary)" }}
                            >
                                Laundry Records ({timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)})
                            </p>
                            {paginationLoading ? (
                                <PaginationInfoLoader />
                            ) : (
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--admin-text-secondary)" }}
                                >
                                    {getPageInfoText()}
                                </p>
                            )}
                        </div>
                        {paginationLoading ? (
                            <PaginationInfoLoader />
                        ) : (
                            <span
                                className="text-sm font-semibold"
                                style={{ color: "var(--admin-text-primary)" }}
                            >
                                {getRecordsFoundText()}
                            </span>
                        )}
                    </div>

                    <AdminRecordTable
                        items={records}
                        allItems={records}
                        isDarkMode={isDarkMode}
                        timeFilter={timeFilter}
                        selectedRange={selectedRange}
                        onDateRangeChange={setSelectedRange}
                        onFilteredCountChange={handleFilteredCountChange}
                        onSearchChange={(val) => {
                            setAutoSearchTerm(val);
                            setCurrentPage(0); // Reset to first page on search
                        }}
                        activeFilters={activeFilters}
                        autoSearchTerm={autoSearchTerm}
                        totalRecords={totalRecords}
                        currentPage={currentPage}
                        pageSize={pageSize}
                    />

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div
                            className="mt-6 flex items-center justify-between border-t pt-4"
                            style={{ borderColor: "var(--admin-card-border)" }}
                        >
                            {paginationLoading ? (
                                <PaginationInfoLoader />
                            ) : (
                                <div
                                    className="text-sm"
                                    style={{ color: "var(--admin-text-secondary)" }}
                                >
                                    Page {currentPage + 1} of {totalPages}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={goToPrevPage}
                                    disabled={currentPage === 0 || paginationLoading}
                                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                        currentPage === 0 || paginationLoading ? "cursor-not-allowed opacity-50" : "hover:scale-105 hover:opacity-90"
                                    }`}
                                    style={{
                                        backgroundColor: "var(--admin-accent)",
                                        color: "var(--admin-card-bg)",
                                        border: `1px solid var(--admin-card-border)`,
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
                                                disabled={paginationLoading}
                                                className={`h-8 w-8 rounded text-sm font-medium transition-all ${
                                                    currentPage === pageNum ? "scale-110 ring-2 ring-blue-500" : "hover:scale-105 hover:opacity-90"
                                                } ${paginationLoading ? "cursor-not-allowed opacity-50" : ""}`}
                                                style={{
                                                    backgroundColor:
                                                        currentPage === pageNum
                                                            ? "var(--admin-accent)"
                                                            : "var(--admin-card-bg)",
                                                    color: currentPage === pageNum ? "var(--admin-card-bg)" : "var(--admin-text-primary)",
                                                    border: `1px solid var(--admin-card-border)`,
                                                }}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages - 1 || paginationLoading}
                                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                        currentPage === totalPages - 1 || paginationLoading
                                            ? "cursor-not-allowed opacity-50"
                                            : "hover:scale-105 hover:opacity-90"
                                    }`}
                                    style={{
                                        backgroundColor: "var(--admin-accent)",
                                        color: "var(--admin-card-bg)",
                                        border: `1px solid var(--admin-card-border)`,
                                    }}
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MainPage;