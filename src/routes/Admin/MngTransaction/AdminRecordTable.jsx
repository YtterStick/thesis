import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, AlertCircle, CheckCircle2, Printer, CalendarIcon, Download, Clock8, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import PrintableReceipt from "@/components/PrintableReceipt";
import { api } from "@/lib/api-config";

// Updated table headers - ADDED Due Date column
const tableHeaders = [
    "Invoice",
    "Name",
    "Service",
    "Loads",
    "Detergent",
    "Fabric",
    "Price",
    "Date", // ✅ This will now display issueDate instead of createdAt
    "Due Date", // ✅ ADDED: New column for dueDate
    "Payment",
    "GCash Ref",
    "Pickup Status",
    "Claimed Date",
    "Actions",
];

// Custom Status Badge Component with Tooltips
const StatusBadge = ({ status, type = "pickup", isDarkMode }) => {
    const getStatusConfig = () => {
        const configs = {
            // Payment Status
            Paid: {
                icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
                tooltip: "Payment has been completed successfully",
                color: "green",
            },
            Pending: {
                icon: <Clock8 className="h-4 w-4 text-yellow-500" />,
                tooltip: "Payment is awaiting confirmation",
                color: "yellow",
            },
            Unpaid: {
                icon: <AlertCircle className="h-4 w-4 text-red-500" />,
                tooltip: "Payment has not been made",
                color: "red",
            },

            // Laundry Status
            Completed: {
                icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
                tooltip: "Laundry service has been completed",
                color: "green",
            },
            "In Progress": {
                icon: <Clock8 className="h-4 w-4 text-blue-500" />,
                tooltip: "Laundry is currently being processed",
                color: "blue",
            },
            Washing: {
                icon: <Clock8 className="h-4 w-4 text-blue-500" />,
                tooltip: "Laundry is being washed",
                color: "blue",
            },
            Done: {
                icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
                tooltip: "Laundry process is finished",
                color: "green",
            },
            "Not Started": {
                icon: <Clock8 className="h-4 w-4 text-gray-500" />,
                tooltip: "Laundry service has not started yet",
                color: "gray",
            },

            // Pickup Status - CHANGED "Expired" TO "Past Due"
            Claimed: {
                icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
                tooltip: "Laundry has been picked up by customer",
                color: "green",
            },
            COMPLETED: {
                icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
                tooltip: "Laundry has been completed and picked up",
                color: "green",
            },
            UNCLAIMED: {
                icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
                tooltip: "Laundry is ready but not yet claimed",
                color: "orange",
            },
            Unclaimed: {
                icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
                tooltip: "Laundry is ready but not yet claimed",
                color: "orange",
            },
            "Past Due": {
                icon: <AlertCircle className="h-4 w-4 text-red-500" />,
                tooltip: "Laundry pickup time has expired",
                color: "red",
            },
            Disposed: {
                icon: <AlertCircle className="h-4 w-4 text-gray-500" />,
                tooltip: "Laundry has been disposed",
                color: "gray",
            },
        };

        return (
            configs[status] || {
                icon: <AlertCircle className="h-4 w-4 text-gray-500" />,
                tooltip: status,
                color: "gray",
            }
        );
    };

    const { icon, tooltip } = getStatusConfig();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-flex cursor-help items-center justify-center">{icon}</span>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                style={{
                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                    color: isDarkMode ? "#f1f5f9" : "#0f172a",
                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                }}
            >
                <div className="text-sm font-medium">{status}</div>
                <div className="mt-1 text-xs opacity-80">{tooltip}</div>
            </TooltipContent>
        </Tooltip>
    );
};

// Helper function to format time in normal clock format (1:00am, 2:30pm)
const formatTimeNormal = (date) => {
    if (!date || isNaN(new Date(date))) return "—";
    
    return format(new Date(date), "MMM dd, yyyy 'at' h:mm a");
};

const AdminRecordTable = ({
    items = [],
    allItems = [],
    isDarkMode,
    timeFilter,
    selectedRange,
    onDateRangeChange,
    onFilteredCountChange,
    activeFilters,
    autoSearchTerm = "",
    totalRecords = 0,
    currentPage = 0,
    pageSize = 50,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [localSelectedRange, setLocalSelectedRange] = useState(selectedRange || { from: null, to: null });
    const [showCalendar, setShowCalendar] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [printData, setPrintData] = useState(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [allGcashReferences, setAllGcashReferences] = useState({});
    const [stableItems, setStableItems] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);

    const calendarRef = useRef(null);
    const exportDropdownRef = useRef(null);

    // Stabilize items to prevent flickering
    useEffect(() => {
        if (items && items.length > 0) {
            setStableItems(items);
        }
    }, [items]);

    // ADD AUTO SEARCH EFFECT
    useEffect(() => {
        if (autoSearchTerm) {
            console.log("🎯 Applying auto-search:", autoSearchTerm);
            setSearchTerm(autoSearchTerm);
        }
    }, [autoSearchTerm]);

    // Format currency with commas
    const formatCurrency = (amount) => {
        try {
            const safeAmount = Number(amount) || 0;
            return `₱${safeAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
        } catch (error) {
            console.warn("Error formatting currency:", amount, error);
            return "₱0.00";
        }
    };

    // Fetch ALL GCash references once when component loads
    useEffect(() => {
        const fetchAllGcashReferences = async () => {
            try {
                console.log("🔄 Fetching ALL GCash references...");

                const pendingGcashData = await api.get("/transactions/pending-gcash");
                console.log("📦 Received GCash data:", pendingGcashData);

                const referencesMap = {};

                pendingGcashData.forEach((transaction) => {
                    if (transaction.invoiceNumber && transaction.gcashReference) {
                        referencesMap[transaction.invoiceNumber] = transaction.gcashReference;
                    }
                });

                setAllGcashReferences(referencesMap);
            } catch (error) {
                console.error("❌ Error fetching GCash references:", error);
            }
        };

        fetchAllGcashReferences();
    }, []);

    // Sync local state with props
    useEffect(() => {
        if (selectedRange) {
            setLocalSelectedRange(selectedRange);
        }
    }, [selectedRange]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handlePointerDown = (e) => {
            if (calendarRef.current?.contains(e.target)) return;
            if (exportDropdownRef.current?.contains(e.target)) return;
            setShowCalendar(false);
            setShowExportDropdown(false);
        };
        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    const toggleRowExpansion = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // ✅ UPDATED: Use issueDate instead of createdAt for date filtering
    const isInRange = (dateStr) => {
        if (!dateStr) return false;

        const issueDate = new Date(dateStr);
        if (isNaN(issueDate.getTime())) return false;

        issueDate.setHours(0, 0, 0, 0);

        const range = localSelectedRange || {};
        const from = range.from ? new Date(range.from) : null;
        const to = range.to ? new Date(range.to) : null;

        if (from) from.setHours(0, 0, 0, 0);
        if (to) to.setHours(23, 59, 59, 999);

        if (from && to) {
            return issueDate >= from && issueDate <= to;
        }
        if (from) {
            return issueDate >= from;
        }
        if (to) {
            return issueDate <= to;
        }
        return true;
    };

    const formatDateRange = () => {
        if (!localSelectedRange) return "Date Range";

        if (localSelectedRange.from && localSelectedRange.to) {
            return `${format(localSelectedRange.from, "MMM dd, yyyy")} - ${format(localSelectedRange.to, "MMM dd, yyyy")}`;
        }
        if (localSelectedRange.from) {
            return `From ${format(localSelectedRange.from, "MMM dd, yyyy")}`;
        }
        if (localSelectedRange.to) {
            return `Until ${format(localSelectedRange.to, "MMM dd, yyyy")}`;
        }
        return "Date Range";
    };

    // Helper function to get GCash reference
    const getGcashReference = (record) => {
        if (record.paymentMethod === "GCash") {
            if (record.invoiceNumber && allGcashReferences[record.invoiceNumber]) {
                return allGcashReferences[record.invoiceNumber];
            }
            if (record.gcashReference && record.gcashReference !== "—") {
                return record.gcashReference;
            }
            return "Pending";
        }
        return "—";
    };

    // Helper function to get pickup status - CHANGED "Expired" TO "Past Due"
    const getPickupStatus = (record) => {
        if (record.disposed) return "Disposed";
        if (record.expired) return "Past Due";
        return record.pickupStatus;
    };

    // Apply filters
    const applyFilters = (records) => {
        let filtered = [...records];

        // Apply status filters
        if (activeFilters.statusFilters.length > 0) {
            filtered = filtered.filter((record) => {
                if (activeFilters.statusFilters.includes("expired") && record.expired && !record.disposed) return true;
                if (
                    activeFilters.statusFilters.includes("unclaimed") &&
                    record.pickupStatus === "UNCLAIMED" &&
                    record.laundryStatus === "Completed" &&
                    !record.expired &&
                    !record.disposed
                )
                    return true;
                if (activeFilters.statusFilters.includes("disposed") && record.disposed) return true;
                if (activeFilters.statusFilters.includes("completed") && record.laundryStatus === "Completed") return true;
                if (
                    activeFilters.statusFilters.includes("in-progress") &&
                    record.laundryStatus !== "Completed" &&
                    !record.expired &&
                    !record.disposed
                )
                    return true;
                return false;
            });
        }

        // Apply payment filters
        if (activeFilters.paymentFilters.length > 0) {
            filtered = filtered.filter((record) => {
                if (activeFilters.paymentFilters.includes("paid") && record.paid) return true;
                if (activeFilters.paymentFilters.includes("pending") && !record.paid) return true;
                if (activeFilters.paymentFilters.includes("gcash") && record.paymentMethod === "GCash") return true;
                if (activeFilters.paymentFilters.includes("cash") && record.paymentMethod === "Cash") return true;
                return false;
            });
        }

        // Apply service filters
        if (activeFilters.serviceFilters.length > 0) {
            filtered = filtered.filter((record) => {
                const serviceLower = record.service?.toLowerCase() || "";
                if (activeFilters.serviceFilters.includes("wash-dry") && serviceLower.includes("wash & dry")) return true;
                if (activeFilters.serviceFilters.includes("wash") && serviceLower.includes("wash") && !serviceLower.includes("dry")) return true;
                if (activeFilters.serviceFilters.includes("dry") && serviceLower.includes("dry") && !serviceLower.includes("wash")) return true;
                return false;
            });
        }

        // Apply sorting
        if (activeFilters.sortBy) {
            filtered.sort((a, b) => {
                const field = activeFilters.sortBy;
                const order = activeFilters.sortOrder;

                let valueA, valueB;

                switch (field) {
                    case "income":
                        valueA = a.price;
                        valueB = b.price;
                        break;
                    case "loads":
                        valueA = a.loads;
                        valueB = b.loads;
                        break;
                    case "date":
                        // ✅ UPDATED: Use issueDate instead of createdAt for sorting
                        valueA = new Date(a.issueDate || a.createdAt);
                        valueB = new Date(b.issueDate || b.createdAt);
                        break;
                    case "name":
                        valueA = a.name?.toLowerCase() || "";
                        valueB = b.name?.toLowerCase() || "";
                        break;
                    default:
                        return 0;
                }

                if (valueA instanceof Date && valueB instanceof Date) {
                    return order === "asc" ? valueA - valueB : valueB - valueA;
                }

                if (typeof valueA === "string" && typeof valueB === "string") {
                    return order === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
                }

                return order === "asc" ? valueA - valueB : valueB - valueA;
            });
        }

        return filtered;
    };

    // FIXED: Use stable items for filtering to prevent flickering
    // ✅ UPDATED: Use issueDate instead of createdAt for filtering
    const filtered = stableItems.filter((r) => r.name?.toLowerCase().includes(searchTerm.toLowerCase()) && isInRange(r.issueDate || r.createdAt));
    const filteredWithActive = applyFilters(filtered);

    // FIXED: Ensure we always have data to display
    const displayItems = filteredWithActive.length > 0 ? filteredWithActive : filtered.length > 0 ? filtered : stableItems;

    // Calculate records count based on date range and search
    const getFilteredRecordsCount = () => {
        return displayItems.length;
    };

    // Notify parent component when filtered count changes
    useEffect(() => {
        if (onFilteredCountChange) {
            const count = getFilteredRecordsCount();
            onFilteredCountChange(count);
        }
    }, [searchTerm, localSelectedRange, activeFilters, stableItems, onFilteredCountChange]);

    const handlePrint = async (record) => {
        try {
            setIsPrinting(true);
            const invoiceData = await api.get(`/transactions/${record.id}/service-invoice`);
            setPrintData(invoiceData);
            setShowPrintModal(true);
        } catch (error) {
            console.error("❌ Error printing receipt:", error);
            alert("Failed to print receipt. Please try again.");
        } finally {
            setIsPrinting(false);
        }
    };

    // Export current page data
    const handleExportCurrent = async () => {
        await handleExport("current");
    };

    // Export all data
    const handleExportAll = async () => {
        await handleExport("all");
    };

    // UPDATED: Handle export with option
    const handleExport = async (exportType = "current") => {
        try {
            setIsExporting(true);
            setShowExportDropdown(false);

            let exportItems = [];
            let exportTitle = "";

            if (exportType === "current") {
                // Use the current view data
                exportItems = displayItems;
                exportTitle = `Current View (${exportItems.length} records)`;
            } else {
                // Export ALL records for the current time filter
                console.log(`📊 Exporting ALL records for time filter: ${timeFilter}`);

                try {
                    let allData = [];
                    const largePageSize = 10000;

                    if (timeFilter === "all") {
                        const response = await api.get(`/admin/records?page=0&size=${largePageSize}`);
                        allData = response;
                    } else {
                        const response = await api.get(`/admin/records/filtered?page=0&size=${largePageSize}&timeFilter=${timeFilter}`);
                        allData = response;
                    }

                    console.log(`📦 Received ${allData.length} records for export`);

                    // Apply the same client-side filters and search
                    // ✅ UPDATED: Use issueDate instead of createdAt for filtering
                    let filteredAllData = allData.filter((r) => {
                        const matchesSearch = r.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesDate = isInRange(r.issueDate || r.createdAt);
                        return matchesSearch && matchesDate;
                    });

                    exportItems = applyFilters(filteredAllData);
                    exportTitle = `All ${timeFilter} Records (${exportItems.length} records)`;
                } catch (fetchError) {
                    console.error("❌ Error fetching all records for export:", fetchError);

                    // Fallback: Use current items
                    exportItems = displayItems;
                    exportTitle = `Current View Only (Failed to load all records)`;

                    alert("Could not load all records. Exporting current view only.");
                }
            }

            // Check if we have data to export
            if (exportItems.length === 0) {
                alert("No records found to export.");
                setIsExporting(false);
                return;
            }

            console.log(`📊 Preparing to export ${exportItems.length} records`);

            // FIXED: Add data validation and safe property access
            const dataToExport = exportItems.map((item) => {
                // Safe currency formatting with fallback
                const safePrice = item.price || item.totalPrice || 0;
                const formattedPrice = formatCurrency(safePrice);

                // Safe date formatting with fallback
                let formattedIssueDate = "—";
                let formattedDueDate = "—";
                let formattedClaimDate = "—";
                try {
                    // ✅ UPDATED: Use issueDate instead of createdAt for Date column
                    if (item.issueDate && !isNaN(new Date(item.issueDate))) {
                        formattedIssueDate = format(new Date(item.issueDate), "MMM dd, yyyy");
                    } else if (item.createdAt && !isNaN(new Date(item.createdAt))) {
                        formattedIssueDate = format(new Date(item.createdAt), "MMM dd, yyyy");
                    }
                    // ✅ ADDED: Due Date formatting
                    if (item.dueDate && !isNaN(new Date(item.dueDate))) {
                        formattedDueDate = format(new Date(item.dueDate), "MMM dd, yyyy");
                    }
                    if (item.claimDate && !isNaN(new Date(item.claimDate))) {
                        formattedClaimDate = formatTimeNormal(item.claimDate);
                    }
                } catch (dateError) {
                    console.warn("Invalid date format for item:", item.id, item.issueDate, item.dueDate);
                }

                return {
                    "Invoice Number": item.invoiceNumber || "—",
                    "Customer Name": item.name || item.customerName || "—",
                    Service: item.service || item.serviceName || "—",
                    Loads: item.loads || item.serviceQuantity || 0,
                    Detergent: item.detergent || "0",
                    Fabric: item.fabric || "0",
                    Price: formattedPrice,
                    "Date": formattedIssueDate, // ✅ CHANGED: Now shows issueDate
                    "Due Date": formattedDueDate, // ✅ ADDED: New column
                    "Claimed Date": formattedClaimDate,
                    "Payment Method": item.paymentMethod || "—",
                    "GCash Reference": getGcashReference(item),
                    "Payment Status": item.paid ? "Paid" : "Pending",
                    "Pickup Status": getPickupStatus(item),
                };
            });

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);

            const colWidths = [
                { wch: 16 },
                { wch: 20 },
                { wch: 15 },
                { wch: 8 },
                { wch: 15 },
                { wch: 12 },
                { wch: 15 },
                { wch: 12 }, // Date column (issueDate)
                { wch: 12 }, // Due Date column
                { wch: 15 }, // Claimed Date column
                { wch: 20 },
                { wch: 12 },
                { wch: 18 },
                { wch: 15 },
            ];
            worksheet["!cols"] = colWidths;

            // Add header styling
            const range = XLSX.utils.decode_range(worksheet["!ref"]);
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: 0 };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (worksheet[cell_ref]) {
                    worksheet[cell_ref].s = {
                        font: { bold: true, color: { rgb: "FFFFFF" } },
                        fill: { fgColor: { rgb: "0B2B26" } },
                        alignment: { horizontal: "center" },
                        border: {
                            top: { style: "thin", color: { rgb: "1C3F3A" } },
                            left: { style: "thin", color: { rgb: "1C3F3A" } },
                            bottom: { style: "thin", color: { rgb: "1C3F3A" } },
                            right: { style: "thin", color: { rgb: "1C3F3A" } },
                        },
                    };
                }
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, "Laundry Records");

            // Generate filename
            let filename = `laundry-records-${exportType === "current" ? "current-view" : `all-${timeFilter}`}`;
            if (localSelectedRange.from && localSelectedRange.to) {
                const fromStr = format(localSelectedRange.from, "yyyy-MM-dd");
                const toStr = format(localSelectedRange.to, "yyyy-MM-dd");
                filename += `_${fromStr}_to_${toStr}`;
            }
            filename += `_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;

            XLSX.writeFile(workbook, filename);

            console.log(`✅ Exported ${exportItems.length} records (${exportType})`);
        } catch (error) {
            console.error("❌ Export error:", error);
            alert("Failed to export data. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const clearDateFilter = () => {
        const newRange = { from: null, to: null };
        setLocalSelectedRange(newRange);
        if (onDateRangeChange) {
            onDateRangeChange(newRange);
        }
    };

    const handleDateRangeChange = (range) => {
        const newRange = range || { from: null, to: null };
        setLocalSelectedRange(newRange);
        if (onDateRangeChange) {
            onDateRangeChange(newRange);
        }
    };

    const closePrintModal = () => {
        setShowPrintModal(false);
        setPrintData(null);
    };

    // Loading state for table
    if (tableLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading records...</span>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                {/* Search + Calendar + Export */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="w-full max-w-xs flex-1">
                        <div className="relative w-full max-w-xs">
                            <div
                                className="flex h-[38px] items-center rounded-lg border-2 px-3 transition-all"
                                style={{
                                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                }}
                            >
                                <Search
                                    size={16}
                                    style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}
                                />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={autoSearchTerm ? `Searching: ${autoSearchTerm}` : "Search by name"}
                                    className="w-full bg-transparent px-2 text-sm placeholder:text-slate-400 focus-visible:outline-none"
                                    style={{
                                        color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                    }}
                                />
                                {/* SHOW AUTO SEARCH INDICATOR */}
                                {autoSearchTerm && searchTerm === autoSearchTerm && (
                                    <div className="flex items-center">
                                        <div
                                            className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-500"
                                            title="Auto-searching"
                                        />
                                        <span
                                            className="text-xs font-medium text-green-500"
                                            style={{ color: "#10B981" }}
                                        >
                                            Auto
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Calendar */}
                        <div
                            className="relative"
                            ref={calendarRef}
                        >
                            <Button
                                onClick={() => setShowCalendar((p) => !p)}
                                className="transition-all"
                                style={{
                                    backgroundColor: isDarkMode ? "#0f172a" : "#0f172a",
                                    color: "#f1f5f9",
                                    border: `2px solid ${isDarkMode ? "#0f172a" : "#0f172a"}`,
                                }}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formatDateRange()}
                            </Button>
                            {showCalendar && (
                                <div
                                    className="absolute right-0 z-50 mt-2 rounded-lg border-2 p-2 shadow-lg"
                                    style={{
                                        backgroundColor: isDarkMode ? "#0f172a" : "#FFFFFF",
                                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                    }}
                                >
                                    <Calendar
                                        isDarkMode={isDarkMode}
                                        mode="range"
                                        selected={localSelectedRange}
                                        onSelect={handleDateRangeChange}
                                        className="max-w-[350px] text-xs [&_button]:h-7 [&_button]:w-7 [&_button]:text-[11px] [&_td]:p-1 [&_thead_th]:text-[11px]"
                                    />
                                    {(localSelectedRange.from || localSelectedRange.to) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={clearDateFilter}
                                            className="mt-2 w-full transition-all"
                                            style={{
                                                backgroundColor: isDarkMode ? "#334155" : "#f8fafc",
                                                borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                                                color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                            }}
                                        >
                                            Clear Date Filter
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Export Button with Dropdown */}
                        <div
                            className="relative"
                            ref={exportDropdownRef}
                        >
                            <Button
                                onClick={() => setShowExportDropdown(!showExportDropdown)}
                                className="transition-all"
                                style={{
                                    backgroundColor: "#10B981",
                                    color: "#FFFFFF",
                                    border: "2px solid #10B981",
                                }}
                                disabled={isExporting}
                            >
                                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                {isExporting ? "Exporting..." : "Export"}
                            </Button>

                            {/* Export Dropdown */}
                            {showExportDropdown && (
                                <div
                                    className="absolute right-0 z-50 mt-2 w-48 rounded-lg border-2 p-2 shadow-lg"
                                    style={{
                                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                    }}
                                >
                                    <button
                                        onClick={handleExportCurrent}
                                        className="w-full rounded px-3 py-2 text-left text-sm transition-all hover:bg-opacity-20"
                                        style={{
                                            color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                            backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                        }}
                                    >
                                        Export Current View
                                        <div className="mt-1 text-xs opacity-70">{displayItems.length} records</div>
                                    </button>

                                    <div
                                        className="my-2 border-t"
                                        style={{ borderColor: isDarkMode ? "#334155" : "#cbd5e1" }}
                                    />

                                    <button
                                        onClick={handleExportAll}
                                        className="w-full rounded px-3 py-2 text-left text-sm transition-all hover:bg-opacity-20"
                                        style={{
                                            color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                            backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                        }}
                                    >
                                        Export All {timeFilter} Records
                                        <div className="mt-1 text-xs opacity-70">{totalRecords.toLocaleString()} total records</div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <div
                        className="min-w-max rounded-lg border-2"
                        style={{
                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                        }}
                    >
                        <table className="min-w-full table-auto text-sm">
                            <thead
                                style={{
                                    backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                                }}
                            >
                                <tr>
                                    <th className="w-10 px-2 py-2"></th>
                                    {tableHeaders.map((header) => (
                                        <th
                                            key={header}
                                            className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium"
                                            style={{
                                                color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                            }}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {displayItems.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={tableHeaders.length + 1}
                                            className="px-4 py-6 text-center text-sm"
                                            style={{
                                                color: isDarkMode ? "#94a3b8" : "#475569",
                                            }}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertCircle
                                                    style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}
                                                    className="h-5 w-5"
                                                />
                                                <span>No records found.</span>
                                                {(searchTerm || localSelectedRange.from || localSelectedRange.to) && (
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setSearchTerm("");
                                                            handleDateRangeChange({ from: null, to: null });
                                                        }}
                                                        className="transition-all"
                                                        style={{
                                                            backgroundColor: isDarkMode ? "#334155" : "#f8fafc",
                                                            color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                                            border: `1px solid ${isDarkMode ? "#475569" : "#cbd5e1"}`,
                                                        }}
                                                    >
                                                        Clear all filters
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    displayItems.map((record) => {
                                        const isExpanded = expandedRows.has(record.id);
                                        const gcashRef = getGcashReference(record);
                                        const pickupStatus = getPickupStatus(record);

                                        return (
                                            <>
                                                <tr
                                                    key={record.id}
                                                    className="border-t transition-all hover:opacity-90"
                                                    style={{
                                                        borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                                                        backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "#f8fafc",
                                                    }}
                                                >
                                                    <td className="px-2 py-2">
                                                        <button
                                                            onClick={() => toggleRowExpansion(record.id)}
                                                            className="rounded p-1 transition-all hover:opacity-80"
                                                            style={{
                                                                backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                                            }}
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronUp
                                                                    className="h-4 w-4"
                                                                    style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                                />
                                                            ) : (
                                                                <ChevronDown
                                                                    className="h-4 w-4"
                                                                    style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                                />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td
                                                        className="whitespace-nowrap px-3 py-2 font-mono text-xs"
                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                    >
                                                        {record.invoiceNumber || "—"}
                                                    </td>
                                                    <td
                                                        className="whitespace-nowrap px-3 py-2 font-medium"
                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                    >
                                                        {record.name}
                                                    </td>
                                                    <td
                                                        className="whitespace-nowrap px-3 py-2"
                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                    >
                                                        {record.service}
                                                    </td>
                                                    <td
                                                        className="whitespace-nowrap px-3 py-2"
                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                    >
                                                        {record.loads}
                                                    </td>
                                                    <td
                                                        className="whitespace-nowrap px-3 py-2"
                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                    >
                                                        {record.detergent}
                                                    </td>
                                                    <td
                                                        className="whitespace-nowrap px-3 py-2"
                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                    >
                                                        {record.fabric}
                                                    </td>
                                                    <td
                                                        className="whitespace-nowrap px-3 py-2 font-semibold"
                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                    >
                                                        {formatCurrency(record.price)}
                                                    </td>
                                                    {/* ✅ UPDATED: Display issueDate instead of createdAt for Date column */}
                                                    <td
                                                        className="whitespace-nowrap px-3 py-2"
                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                    >
                                                        {record.issueDate && !isNaN(new Date(record.issueDate))
                                                            ? format(new Date(record.issueDate), "MMM dd, yyyy")
                                                            : record.createdAt && !isNaN(new Date(record.createdAt))
                                                            ? format(new Date(record.createdAt), "MMM dd, yyyy")
                                                            : "—"}
                                                    </td>
                                                    {/* ✅ ADDED: New Due Date column */}
                                                    <td
                                                        className="whitespace-nowrap px-3 py-2"
                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                    >
                                                        {record.dueDate && !isNaN(new Date(record.dueDate))
                                                            ? format(new Date(record.dueDate), "MMM dd, yyyy")
                                                            : "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <span style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>{record.paymentMethod}</span>
                                                            <StatusBadge
                                                                status={record.paid ? "Paid" : "Pending"}
                                                                type="payment"
                                                                isDarkMode={isDarkMode}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td
                                                        className="whitespace-nowrap px-3 py-2 font-mono text-xs"
                                                        style={{
                                                            color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                                            fontFamily: "monospace",
                                                        }}
                                                    >
                                                        {gcashRef}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <span style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>{pickupStatus}</span>
                                                            <StatusBadge
                                                                status={pickupStatus}
                                                                type="pickup"
                                                                isDarkMode={isDarkMode}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td
                                                        className="whitespace-nowrap px-3 py-2 text-xs"
                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                    >
                                                        {record.claimDate && !isNaN(new Date(record.claimDate))
                                                            ? formatTimeNormal(record.claimDate)
                                                            : "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    onClick={() => handlePrint(record)}
                                                                    disabled={isPrinting}
                                                                    className="rounded-lg p-2 transition-all hover:opacity-80 disabled:opacity-50"
                                                                    style={{
                                                                        backgroundColor: isDarkMode
                                                                            ? "rgba(51, 65, 85, 0.3)"
                                                                            : "rgba(11, 43, 38, 0.1)",
                                                                    }}
                                                                >
                                                                    <Printer
                                                                        className="h-4 w-4"
                                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                                    />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent
                                                                side="top"
                                                                style={{
                                                                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                                                    color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                                                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                                                }}
                                                            >
                                                                {isPrinting ? "Printing..." : "Print Receipt"}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr
                                                        className="transition-all"
                                                        style={{
                                                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(248, 250, 252, 0.9)",
                                                        }}
                                                    >
                                                        <td
                                                            colSpan={tableHeaders.length + 1}
                                                            className="px-4 py-3"
                                                        >
                                                            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                                                                <div>
                                                                    <span
                                                                        className="font-medium"
                                                                        style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}
                                                                    >
                                                                        Laundry Processed By:
                                                                    </span>
                                                                    <p style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                                                        {record.laundryProcessedBy || "—"}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <span
                                                                        className="font-medium"
                                                                        style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}
                                                                    >
                                                                        Claim Processed By:
                                                                    </span>
                                                                    <p style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                                                        {record.claimProcessedBy || "—"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Print Modal */}
                {showPrintModal && printData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="mx-auto w-full max-w-sm">
                            <PrintableReceipt
                                invoiceData={printData}
                                onClose={closePrintModal}
                            />
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
};

export default AdminRecordTable;