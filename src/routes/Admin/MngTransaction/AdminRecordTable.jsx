import React, { useState, useEffect, useRef } from "react";
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
    "Customer",
    "Service",
    "Loads",
    "Detergent",
    "Fabric",
    "Price",
    "Date",
    "Due Date",
    "Payment",
    "GCash Ref",
    "Status",
    "Claimed At",
    "Staff",
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
            CLAIMED: {
                icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
                tooltip: "Laundry has been picked up by customer",
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
                    backgroundColor: "var(--admin-card-bg)",
                    color: "var(--admin-text-primary)",
                    borderColor: "var(--admin-card-border)",
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
    onSearchChange,
    activeFilters,
    autoSearchTerm = "",
    totalRecords = 0,
    currentPage = 0,
    pageSize = 50,
}) => {
    // Use the search term from props or local state if not provided
    const [localSearchTerm, setLocalSearchTerm] = useState(autoSearchTerm);
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
        setLocalSearchTerm(autoSearchTerm);
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

    // Helper to apply all active filters (used during export)
    const applyFilters = (data) => {
        if (!data || !Array.isArray(data)) return [];

        let result = [...data];

        // Apply Status Filters
        if (activeFilters?.statusFilters && activeFilters.statusFilters.length > 0) {
            result = result.filter((item) => {
                const status = getPickupStatus(item).toLowerCase();
                const laundryStatus = (item.laundryStatus || "").toLowerCase();
                
                return activeFilters.statusFilters.some((f) => {
                    if (f === "expired") return item.expired;
                    if (f === "unclaimed") return status === "unclaimed";
                    if (f === "disposed") return item.disposed;
                    if (f === "completed") return laundryStatus === "completed" || laundryStatus === "done";
                    if (f === "in-progress") return laundryStatus === "in progress" || laundryStatus === "washing";
                    return false;
                });
            });
        }

        // Apply Payment Filters
        if (activeFilters?.paymentFilters && activeFilters.paymentFilters.length > 0) {
            result = result.filter((item) => {
                const method = (item.paymentMethod || "").toLowerCase();
                const isPaid = item.paid;
                
                return activeFilters.paymentFilters.some((f) => {
                    if (f === "paid") return isPaid;
                    if (f === "pending") return !isPaid;
                    if (f === "gcash") return method === "gcash";
                    if (f === "cash") return method === "cash";
                    return false;
                });
            });
        }

        // Apply Service Filters
        if (activeFilters?.serviceFilters && activeFilters.serviceFilters.length > 0) {
            result = result.filter((item) => {
                const service = (item.service || item.serviceName || "").toLowerCase();
                
                return activeFilters.serviceFilters.some((f) => {
                    if (f === "wash-dry") return service.includes("wash") && service.includes("dry");
                    if (f === "wash") return service.includes("wash") && !service.includes("dry");
                    if (f === "dry") return service.includes("dry") && !service.includes("wash");
                    return false;
                });
            });
        }

        // Apply Sorting
        if (activeFilters?.sortBy) {
            result.sort((a, b) => {
                let valA, valB;
                
                switch (activeFilters.sortBy) {
                    case "income":
                        valA = a.price || a.totalPrice || 0;
                        valB = b.price || b.totalPrice || 0;
                        break;
                    case "loads":
                        valA = a.loads || 0;
                        valB = b.loads || 0;
                        break;
                    case "name":
                        valA = (a.name || a.customerName || "").toLowerCase();
                        valB = (b.name || b.customerName || "").toLowerCase();
                        break;
                    case "date":
                    default:
                        valA = new Date(a.issueDate || a.createdAt || 0).getTime();
                        valB = new Date(b.issueDate || b.createdAt || 0).getTime();
                        break;
                }
                
                if (activeFilters.sortOrder === "asc") {
                    return valA > valB ? 1 : -1;
                } else {
                    return valA < valB ? 1 : -1;
                }
            });
        }

        return result;
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

    // Server-side filtering is now used, so we display items directly
    const displayItems = items;

    // Notify parent component when filtered count changes
    useEffect(() => {
        if (onFilteredCountChange) {
            onFilteredCountChange(totalRecords);
        }
    }, [totalRecords, onFilteredCountChange]);

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

            if (exportType === "current") {
                // Use the current view data
                exportItems = displayItems;
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
                        const matchesSearch = (r.customerName || r.name || "").toLowerCase().includes(localSearchTerm.toLowerCase());
                        const matchesDate = isInRange(r.issueDate || r.createdAt);
                        return matchesSearch && matchesDate;
                    });

                    exportItems = applyFilters(filteredAllData);
                } catch (fetchError) {
                    console.error("❌ Error fetching all records for export:", fetchError);

                    // Fallback: Use current items
                    exportItems = displayItems;
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
                                className="flex h-[38px] items-center rounded-lg border px-3 transition-all shadow-sm"
                                style={{
                                    backgroundColor: "var(--admin-card-bg)",
                                    borderColor: "var(--admin-card-border)",
                                }}
                            >
                                <Search
                                    size={16}
                                    style={{ color: "var(--admin-text-secondary)" }}
                                />
                                <input
                                    type="text"
                                    value={localSearchTerm}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setLocalSearchTerm(val);
                                        if (onSearchChange) onSearchChange(val);
                                    }}
                                    placeholder={autoSearchTerm ? `Searching: ${autoSearchTerm}` : "Search by name"}
                                    className="w-full bg-transparent px-2 text-sm placeholder:text-slate-400 focus-visible:outline-none"
                                    style={{
                                        color: "var(--admin-text-primary)",
                                    }}
                                />
                                {/* SHOW AUTO SEARCH INDICATOR */}
                                {autoSearchTerm && localSearchTerm === autoSearchTerm && (
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
                                 variant="outline"
                                 className="transition-all"
                                 style={{
                                     backgroundColor: "var(--admin-card-bg)",
                                     color: "var(--admin-text-primary)",
                                     borderColor: "var(--admin-card-border)",
                                 }}
                             >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formatDateRange()}
                            </Button>
                            {showCalendar && (
                                 <div
                                     className="absolute right-0 z-50 mt-2 rounded-lg border p-2 shadow-lg"
                                     style={{
                                         backgroundColor: "var(--admin-card-bg)",
                                         borderColor: "var(--admin-card-border)",
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
                                                backgroundColor: "var(--admin-card-bg)",
                                                borderColor: "var(--admin-card-border)",
                                                color: "var(--admin-text-primary)",
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
                                     className="absolute right-0 z-50 mt-2 w-48 rounded-lg border p-2 shadow-lg"
                                     style={{
                                         backgroundColor: "var(--admin-card-bg)",
                                         borderColor: "var(--admin-card-border)",
                                     }}
                                 >
                                    <button
                                        onClick={handleExportCurrent}
                                         className="w-full rounded px-3 py-2 text-left text-sm transition-all hover:bg-opacity-20"
                                         style={{
                                             color: "var(--admin-text-primary)",
                                             backgroundColor: "var(--admin-accent-soft)",
                                         }}
                                    >
                                        Export Current View
                                        <div className="mt-1 text-xs opacity-70">{displayItems.length} records</div>
                                    </button>

                                     <div
                                         className="my-2 border-t"
                                         style={{ borderColor: "var(--admin-card-border)" }}
                                     />

                                    <button
                                        onClick={handleExportAll}
                                         className="w-full rounded px-3 py-2 text-left text-sm transition-all hover:bg-opacity-20"
                                         style={{
                                             color: "var(--admin-text-primary)",
                                             backgroundColor: "var(--admin-accent-soft)",
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
                 <div className="overflow-x-auto rounded-xl border shadow-sm"
                     style={{
                         borderColor: "var(--admin-card-border)",
                     }}
                 >
                    <table 
                        className="w-full text-left border-separate" 
                        style={{ 
                            minWidth: "1800px", 
                            borderSpacing: 0,
                        }}
                    >
                        <thead className="transition-colors" style={{ backgroundColor: "var(--admin-table-header)" }}>
                            <tr>
                                {/* Sticky Invoice Header */}
                                <th 
                                    className="sticky left-0 z-30 px-4 py-4 text-[10px] font-bold uppercase tracking-widest border-b"
                                    style={{ 
                                        backgroundColor: "var(--admin-table-header)",
                                        borderColor: "var(--admin-card-border)",
                                        minWidth: "120px"
                                    }}
                                >
                                    Invoice
                                </th>
                                {/* Sticky Customer Header */}
                                <th 
                                    className="sticky left-[120px] z-30 px-4 py-4 text-[10px] font-bold uppercase tracking-widest border-b"
                                    style={{ 
                                        backgroundColor: "var(--admin-table-header)",
                                        borderColor: "var(--admin-card-border)",
                                        borderRight: "2px solid var(--admin-card-border)",
                                        minWidth: "180px"
                                    }}
                                >
                                    Customer
                                </th>
                                {tableHeaders.slice(2).map((header) => (
                                    <th 
                                        key={header} 
                                        className="p-4 text-[10px] font-bold uppercase tracking-widest border-b" 
                                        style={{ 
                                            borderColor: "var(--admin-card-border)",
                                            color: "var(--admin-text-secondary)"
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
                                        colSpan={tableHeaders.length}
                                        className="admin-table-td p-12 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <AlertCircle
                                                className="h-8 w-8 opacity-20"
                                            />
                                            <span className="font-bold opacity-60">No records found.</span>
                                            {(localSearchTerm || localSelectedRange.from || localSelectedRange.to) && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setLocalSearchTerm("");
                                                        if (onSearchChange) onSearchChange("");
                                                        handleDateRangeChange({ from: null, to: null });
                                                    }}
                                                    className="mt-2"
                                                >
                                                    Clear all filters
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayItems.map((record) => {
                                    const gcashRef = getGcashReference(record);
                                    const pickupStatus = getPickupStatus(record);
                                    
                                    return (
                                        <tr
                                            key={record.id}
                                            className="admin-table-tr group"
                                        >
                                            {/* Sticky Invoice Cell */}
                                            <td 
                                                className="sticky left-0 z-20 p-4 font-mono transition-colors group-hover:brightness-110"
                                                style={{ 
                                                    backgroundColor: "var(--admin-card-bg)",
                                                    borderColor: "var(--admin-card-border)",
                                                    borderBottomWidth: "1px"
                                                }}
                                            >
                                                <span className="text-xs opacity-70">{record.invoiceNumber || "—"}</span>
                                            </td>
                                            {/* Sticky Customer Cell */}
                                            <td 
                                                className="sticky left-[120px] z-20 p-4 text-sm font-bold whitespace-nowrap transition-colors group-hover:brightness-110"
                                                style={{ 
                                                    backgroundColor: "var(--admin-card-bg)",
                                                    borderColor: "var(--admin-card-border)",
                                                    borderRight: "2px solid var(--admin-card-border)",
                                                    borderBottomWidth: "1px"
                                                }}
                                            >
                                                {record.name}
                                            </td>
                                            
                                            {/* Regular Columns */}
                                            <td className="admin-table-td whitespace-nowrap">
                                                {record.service}
                                            </td>
                                            <td className="admin-table-td text-center">
                                                {record.loads}
                                            </td>
                                            <td className="admin-table-td whitespace-nowrap">
                                                {record.detergent || "—"}
                                            </td>
                                            <td className="admin-table-td whitespace-nowrap">
                                                {record.fabric || "—"}
                                            </td>
                                            <td className="admin-table-td font-bold" style={{ color: "var(--admin-accent)" }}>
                                                {formatCurrency(record.price)}
                                            </td>
                                            <td className="admin-table-td text-[11px] opacity-70 whitespace-nowrap">
                                                {record.issueDate && !isNaN(new Date(record.issueDate))
                                                    ? format(new Date(record.issueDate), "MMM dd, yyyy")
                                                    : record.createdAt && !isNaN(new Date(record.createdAt))
                                                    ? format(new Date(record.createdAt), "MMM dd, yyyy")
                                                    : "—"}
                                            </td>
                                            <td className="admin-table-td text-[11px] opacity-70 whitespace-nowrap">
                                                {record.dueDate && !isNaN(new Date(record.dueDate))
                                                    ? format(new Date(record.dueDate), "MMM dd, yyyy")
                                                    : "—"}
                                            </td>
                                            <td className="admin-table-td">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge
                                                        status={record.paid ? "Paid" : "Pending"}
                                                        type="payment"
                                                        isDarkMode={isDarkMode}
                                                    />
                                                    <span className="text-[11px] font-medium uppercase">{record.paymentMethod}</span>
                                                </div>
                                            </td>
                                            <td className="admin-table-td font-mono text-[10px] opacity-70">
                                                {gcashRef}
                                            </td>
                                            <td className="admin-table-td">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge
                                                        status={pickupStatus}
                                                        type="pickup"
                                                        isDarkMode={isDarkMode}
                                                    />
                                                    <span className="text-[11px] font-medium whitespace-nowrap">{pickupStatus}</span>
                                                </div>
                                            </td>
                                            <td className="admin-table-td text-[10px] opacity-60 whitespace-nowrap">
                                                {record.claimDate && !isNaN(new Date(record.claimDate))
                                                    ? format(new Date(record.claimDate), "MMM dd, hh:mm a")
                                                    : "—"}
                                            </td>
                                            <td className="admin-table-td text-[10px] opacity-60">
                                                <div className="truncate max-w-[120px]" title={`${record.laundryProcessedBy || "—"} / ${record.claimProcessedBy || "—"}`}>
                                                    {record.laundryProcessedBy || "—"} / {record.claimProcessedBy || "—"}
                                                </div>
                                            </td>
                                            <td className="admin-table-td" onClick={(e) => e.stopPropagation()}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => handlePrint(record)}
                                                            disabled={isPrinting}
                                                            className="rounded-lg p-2 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                                                        >
                                                            <Printer
                                                                className="h-4 w-4"
                                                                style={{ color: "var(--admin-text-secondary)" }}
                                                            />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="top"
                                                        style={{
                                                            backgroundColor: "var(--admin-card-bg)",
                                                            color: "var(--admin-text-primary)",
                                                            borderColor: "var(--admin-card-border)",
                                                        }}
                                                    >
                                                        {isPrinting ? "Printing..." : "Print Receipt"}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
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