import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, AlertCircle, CheckCircle2, Printer, CalendarIcon, Download, Clock8, ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import PrintableReceipt from "@/components/PrintableReceipt";
import { api } from "@/lib/api-config";

const tableHeaders = [
    "Invoice",
    "Name",
    "Service",
    "Loads",
    "Detergent",
    "Fabric",
    "Price",
    "Date",
    "Payment",
    "GCash Ref",
    "Laundry Status",
    "Pickup Status",
    "Actions",
];

// Custom Status Badge Component with Tooltips
const StatusBadge = ({ status, type = "pickup", isDarkMode }) => {
    const getStatusConfig = () => {
        const configs = {
            // Payment Status
            "Paid": { 
                icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, 
                tooltip: "Payment has been completed successfully",
                color: "green"
            },
            "Pending": { 
                icon: <Clock8 className="h-4 w-4 text-yellow-500" />, 
                tooltip: "Payment is awaiting confirmation",
                color: "yellow"
            },
            "Unpaid": { 
                icon: <AlertCircle className="h-4 w-4 text-red-500" />, 
                tooltip: "Payment has not been made",
                color: "red"
            },

            // Laundry Status
            "Completed": { 
                icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, 
                tooltip: "Laundry service has been completed",
                color: "green"
            },
            "In Progress": { 
                icon: <Clock8 className="h-4 w-4 text-blue-500" />, 
                tooltip: "Laundry is currently being processed",
                color: "blue"
            },
            "Washing": { 
                icon: <Clock8 className="h-4 w-4 text-blue-500" />, 
                tooltip: "Laundry is being washed",
                color: "blue"
            },
            "Done": { 
                icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, 
                tooltip: "Laundry process is finished",
                color: "green"
            },
            "Not Started": { 
                icon: <Clock8 className="h-4 w-4 text-gray-500" />, 
                tooltip: "Laundry service has not started yet",
                color: "gray"
            },

            // Pickup Status
            "Claimed": { 
                icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, 
                tooltip: "Laundry has been picked up by customer",
                color: "green"
            },
            "COMPLETED": { 
                icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, 
                tooltip: "Laundry has been completed and picked up",
                color: "green"
            },
            "UNCLAIMED": { 
                icon: <AlertCircle className="h-4 w-4 text-orange-500" />, 
                tooltip: "Laundry is ready but not yet claimed",
                color: "orange"
            },
            "Unclaimed": { 
                icon: <AlertCircle className="h-4 w-4 text-orange-500" />, 
                tooltip: "Laundry is ready but not yet claimed",
                color: "orange"
            },
            "Expired": { 
                icon: <AlertCircle className="h-4 w-4 text-red-500" />, 
                tooltip: "Laundry pickup time has expired",
                color: "red"
            },
            "Disposed": { 
                icon: <AlertCircle className="h-4 w-4 text-gray-500" />, 
                tooltip: "Laundry has been disposed",
                color: "gray"
            }
        };

        return configs[status] || { 
            icon: <AlertCircle className="h-4 w-4 text-gray-500" />, 
            tooltip: status,
            color: "gray"
        };
    };

    const { icon, tooltip } = getStatusConfig();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center cursor-help">
                    {icon}
                </span>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                style={{
                    backgroundColor: isDarkMode ? "#0B2B26" : "#FFFFFF",
                    color: isDarkMode ? "#F3EDE3" : "#0B2B26",
                    borderColor: isDarkMode ? "#1C3F3A" : "#0B2B26",
                }}
            >
                <div className="font-medium text-sm">{status}</div>
                <div className="text-xs opacity-80 mt-1">{tooltip}</div>
            </TooltipContent>
        </Tooltip>
    );
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
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [localSelectedRange, setLocalSelectedRange] = useState(selectedRange || { from: null, to: null });
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [printData, setPrintData] = useState(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const rowsPerPage = 10;
    const calendarRef = useRef(null);

    // Sync local state with props
    useEffect(() => {
        if (selectedRange) {
            setLocalSelectedRange(selectedRange);
        }
    }, [selectedRange]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, localSelectedRange, activeFilters]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handlePointerDown = (e) => {
            if (calendarRef.current?.contains(e.target)) return;
            setShowCalendar(false);
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

    const isInRange = (dateStr) => {
        if (!dateStr) return false;

        const created = new Date(dateStr);
        if (isNaN(created.getTime())) return false;

        created.setHours(0, 0, 0, 0);

        const range = localSelectedRange || {};
        const from = range.from ? new Date(range.from) : null;
        const to = range.to ? new Date(range.to) : null;

        if (from) from.setHours(0, 0, 0, 0);
        if (to) to.setHours(23, 59, 59, 999);

        if (from && to) {
            return created >= from && created <= to;
        }
        if (from) {
            return created >= from;
        }
        if (to) {
            return created <= to;
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

        // Apply payment filters - UPDATED FOR PAID/PENDING
        if (activeFilters.paymentFilters.length > 0) {
            filtered = filtered.filter((record) => {
                if (activeFilters.paymentFilters.includes("paid") && record.paid) return true;
                if (activeFilters.paymentFilters.includes("pending") && !record.paid) return true; // Changed from unpaid to pending
                if (activeFilters.paymentFilters.includes("gcash") && record.paymentMethod === "GCash") return true;
                if (activeFilters.paymentFilters.includes("cash") && record.paymentMethod === "Cash") return true;
                return false;
            });
        }

        // Apply service filters - UPDATED SERVICE TYPES
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
                        valueA = new Date(a.createdAt);
                        valueB = new Date(b.createdAt);
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

    const filtered = items.filter((r) => r.name?.toLowerCase().includes(searchTerm.toLowerCase()) && isInRange(r.createdAt));

    const filteredWithActive = applyFilters(filtered);

    // Calculate records count based on date range and search
    const getFilteredRecordsCount = () => {
        return filteredWithActive.length;
    };

    // Notify parent component when filtered count changes
    useEffect(() => {
        if (onFilteredCountChange) {
            const count = getFilteredRecordsCount();
            onFilteredCountChange(count);
        }
    }, [searchTerm, localSelectedRange, activeFilters, items, onFilteredCountChange]);

    const totalPages = Math.ceil(filteredWithActive.length / rowsPerPage);
    const paginated = filteredWithActive.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handlePrint = async (record) => {
        try {
            setIsPrinting(true);
            
            // Use the api utility instead of direct fetch
            const invoiceData = await api.get(`api/transactions/${record.id}/service-invoice`);
            
            console.log("📄 Invoice data:", invoiceData);
            setPrintData(invoiceData);
            setShowPrintModal(true);
        } catch (error) {
            console.error("❌ Error printing receipt:", error);
            alert("Failed to print receipt. Please try again.");
        } finally {
            setIsPrinting(false);
        }
    };

    const handleExport = () => {
        // Use the filtered items that match the date range
        const exportItems = items.filter((r) => r.name?.toLowerCase().includes(searchTerm.toLowerCase()) && isInRange(r.createdAt));

        // Apply active filters to export data as well
        const filteredExportItems = applyFilters(exportItems);

        // Prepare data with updated columns
        const dataToExport = filteredExportItems.map((item) => ({
            "Invoice Number": item.invoiceNumber || "—",
            "Customer Name": item.name,
            Service: item.service,
            Loads: item.loads,
            Detergent: item.detergent,
            Fabric: item.fabric || "—",
            Price: `₱${item.price.toFixed(2)}`,
            Date: item.createdAt ? format(new Date(item.createdAt), "MMM dd, yyyy") : "—",
            "Payment Method": item.paymentMethod || "—",
            "GCash Reference": item.gcashReference || "—",
            "Payment Status": item.paid ? "Paid" : "Pending", // Updated to show Pending instead of Unpaid
            "Laundry Status": item.laundryStatus,
            "Pickup Status": item.disposed ? "Disposed" : item.expired ? "Expired" : item.pickupStatus,
        }));

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        // Set optimized column widths
        const colWidths = [
            { wch: 16 }, // Invoice Number
            { wch: 20 }, // Customer Name
            { wch: 15 }, // Service
            { wch: 8 }, // Loads
            { wch: 15 }, // Detergent
            { wch: 12 }, // Fabric
            { wch: 12 }, // Price
            { wch: 12 }, // Date
            { wch: 15 }, // Payment Method
            { wch: 20 }, // GCash Reference
            { wch: 12 }, // Payment Status
            { wch: 15 }, // Laundry Status
            { wch: 12 }, // Pickup Status
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

        // Style data rows
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell = XLSX.utils.encode_cell({ c: C, r: R });
                if (worksheet[cell]) {
                    const isEvenRow = R % 2 === 0;
                    worksheet[cell].s = {
                        fill: {
                            fgColor: { rgb: isEvenRow ? "F8FAFC" : "FFFFFF" },
                        },
                        border: {
                            top: { style: "thin", color: { rgb: "E2E8F0" } },
                            left: { style: "thin", color: { rgb: "E2E8F0" } },
                            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                            right: { style: "thin", color: { rgb: "E2E8F0" } },
                        },
                        alignment: { horizontal: "left" },
                    };

                    // Status column formatting
                    if (C === 10) {
                        // Payment Status column
                        if (worksheet[cell].v === "Paid") {
                            worksheet[cell].s.font = { color: { rgb: "059669" }, bold: true };
                        } else if (worksheet[cell].v === "Pending") {
                            worksheet[cell].s.font = { color: { rgb: "D97706" }, bold: true }; // Orange color for Pending
                        }
                    }
                }
            }
        }

        // Add auto-filter
        worksheet["!autofilter"] = { ref: XLSX.utils.encode_range(range) };
        worksheet["!freeze"] = { x: 0, y: 1 };

        XLSX.utils.book_append_sheet(workbook, worksheet, "Laundry Records");

        // Calculate statistics for summary
        const totalIncome = filteredExportItems.reduce((acc, item) => acc + item.price, 0);
        const totalLoads = filteredExportItems.reduce((acc, item) => acc + item.loads, 0);
        const paidCount = filteredExportItems.filter((item) => item.paid).length;
        const pendingCount = filteredExportItems.filter((item) => !item.paid).length;
        const expiredCount = filteredExportItems.filter((item) => item.expired && !item.disposed).length;
        const disposedCount = filteredExportItems.filter((item) => item.disposed).length;

        // Create summary sheet
        const summaryData = [
            ["LAUNDRY BUSINESS SUMMARY REPORT"],
            [""],
            [
                "Report Generated:",
                new Date().toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            ],
            [
                "Date Range:",
                localSelectedRange.from && localSelectedRange.to
                    ? `${format(localSelectedRange.from, "MMM dd, yyyy")} - ${format(localSelectedRange.to, "MMM dd, yyyy")}`
                    : "All records",
            ],
            ["Total Records Exported:", filteredExportItems.length],
            [""],
            ["FINANCIAL SUMMARY"],
            ["Total Revenue:", `₱${totalIncome.toFixed(2)}`],
            ["Average Transaction Value:", `₱${filteredExportItems.length > 0 ? (totalIncome / filteredExportItems.length).toFixed(2) : "0.00"}`],
            ["Paid Transactions:", paidCount],
            ["Pending Transactions:", pendingCount],
            ["Payment Success Rate:", `${filteredExportItems.length > 0 ? ((paidCount / filteredExportItems.length) * 100).toFixed(1) : "0"}%`],
            [""],
            ["OPERATIONAL SUMMARY"],
            ["Total Loads Processed:", totalLoads],
            ["Average Loads per Transaction:", filteredExportItems.length > 0 ? (totalLoads / filteredExportItems.length).toFixed(1) : "0"],
            ["Expired Records:", expiredCount],
            ["Disposed Records:", disposedCount],
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet["!cols"] = [{ wch: 35 }, { wch: 30 }];

        // Style summary sheet
        if (summarySheet["A1"]) {
            summarySheet["A1"].s = {
                font: { bold: true, sz: 16, color: { rgb: "0B2B26" } },
                fill: { fgColor: { rgb: "E0EAE8" } },
                alignment: { horizontal: "center" },
            };
            summarySheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
        }

        XLSX.utils.book_append_sheet(workbook, summarySheet, "Business Summary");

        // Generate filename with date range
        let filename = `laundry-records`;
        if (localSelectedRange.from && localSelectedRange.to) {
            const fromStr = format(localSelectedRange.from, "yyyy-MM-dd");
            const toStr = format(localSelectedRange.to, "yyyy-MM-dd");
            filename += `_${fromStr}_to_${toStr}`;
        }
        filename += `_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;

        // Export the file
        XLSX.writeFile(workbook, filename);
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
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
                                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                }}
                            >
                                <Search
                                    size={16}
                                    style={{ color: isDarkMode ? "#6B7280" : "#0B2B26" }}
                                />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Search by name"
                                    className="w-full bg-transparent px-2 text-sm placeholder:text-slate-400 focus-visible:outline-none"
                                    style={{
                                        color: isDarkMode ? "#13151B" : "#0B2B26",
                                    }}
                                />
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
                                    backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                    color: "#F3EDE3",
                                }}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formatDateRange()}
                            </Button>
                            {showCalendar && (
                                <div
                                    className="absolute right-0 z-50 mt-2 rounded-lg border-2 p-2 shadow-lg"
                                    style={{
                                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                    }}
                                >
                                    <Calendar
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
                                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                                color: isDarkMode ? "#13151B" : "#0B2B26",
                                            }}
                                        >
                                            Clear Date Filter
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Export Button */}
                        <Button
                            onClick={handleExport}
                            className="transition-all"
                            style={{
                                backgroundColor: "#10B981",
                                color: "#FFFFFF",
                            }}
                            disabled={items.length === 0}
                        >
                            <Download className="mr-2 h-4 w-4" /> Export
                        </Button>
                    </div>
                </div>

                {/* Table with horizontal scrolling */}
                <div className="overflow-x-auto">
                    <div
                        className="rounded-lg border-2 min-w-max"
                        style={{
                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        }}
                    >
                        <table className="min-w-full table-auto text-sm">
                            <thead
                                style={{
                                    backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                                }}
                            >
                                <tr>
                                    <th className="w-10 px-2 py-2"></th>
                                    {tableHeaders.map((header) => (
                                        <th
                                            key={header}
                                            className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap"
                                            style={{
                                                color: isDarkMode ? "#13151B" : "#0B2B26",
                                            }}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={tableHeaders.length + 1}
                                            className="px-4 py-6 text-center text-sm"
                                            style={{
                                                color: isDarkMode ? "#6B7280" : "#0B2B26/70",
                                            }}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertCircle
                                                    style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}
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
                                                            color: isDarkMode ? "#13151B" : "#0B2B26",
                                                        }}
                                                    >
                                                        Clear all filters
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((record) => {
                                        const isExpanded = expandedRows.has(record.id);

                                        return (
                                            <>
                                                <tr
                                                    key={record.id}
                                                    className="border-t transition-all hover:opacity-90"
                                                    style={{
                                                        borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                                                        backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                                    }}
                                                >
                                                    <td className="px-2 py-2">
                                                        <button
                                                            onClick={() => toggleRowExpansion(record.id)}
                                                            className="rounded p-1 transition-all hover:opacity-80"
                                                            style={{
                                                                backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                                                            }}
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronUp
                                                                    className="h-4 w-4"
                                                                    style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                                                />
                                                            ) : (
                                                                <ChevronDown
                                                                    className="h-4 w-4"
                                                                    style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                                                />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 font-mono text-xs whitespace-nowrap"
                                                        style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                                    >
                                                        {record.invoiceNumber || "—"}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 font-medium whitespace-nowrap"
                                                        style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                                    >
                                                        {record.name}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 whitespace-nowrap"
                                                        style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                                    >
                                                        {record.service}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 whitespace-nowrap"
                                                        style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                                    >
                                                        {record.loads}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 whitespace-nowrap"
                                                        style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                                    >
                                                        {record.detergent}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 whitespace-nowrap"
                                                        style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                                    >
                                                        {record.fabric}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 font-semibold whitespace-nowrap"
                                                        style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                                    >
                                                        ₱{record.price.toFixed(2)}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 whitespace-nowrap"
                                                        style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                                    >
                                                        {record.createdAt && !isNaN(new Date(record.createdAt))
                                                            ? format(new Date(record.createdAt), "MMM dd, yyyy")
                                                            : "—"}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <span style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>{record.paymentMethod}</span>
                                                            <StatusBadge status={record.paid ? "Paid" : "Pending"} type="payment" isDarkMode={isDarkMode} />
                                                        </div>
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 font-mono text-xs whitespace-nowrap"
                                                        style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                                    >
                                                        {record.gcashReference}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <span style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>{record.laundryStatus}</span>
                                                            <StatusBadge status={record.laundryStatus} type="laundry" isDarkMode={isDarkMode} />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <span style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                                                                {record.disposed ? "Disposed" : record.expired ? "Expired" : record.pickupStatus}
                                                            </span>
                                                            <StatusBadge 
                                                                status={record.disposed ? "Disposed" : record.expired ? "Expired" : record.pickupStatus} 
                                                                type="pickup" 
                                                                isDarkMode={isDarkMode} 
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    onClick={() => handlePrint(record)}
                                                                    disabled={isPrinting}
                                                                    className="rounded-lg p-2 transition-all hover:opacity-80 disabled:opacity-50"
                                                                    style={{
                                                                        backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                                                                    }}
                                                                >
                                                                    <Printer
                                                                        className="h-4 w-4"
                                                                        style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                                                    />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent
                                                                side="top"
                                                                style={{
                                                                    backgroundColor: isDarkMode ? "#0B2B26" : "#FFFFFF",
                                                                    color: isDarkMode ? "#F3EDE3" : "#0B2B26",
                                                                    borderColor: isDarkMode ? "#1C3F3A" : "#0B2B26",
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
                                                            backgroundColor: isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(243, 237, 227, 0.9)",
                                                        }}
                                                    >
                                                        <td
                                                            colSpan={tableHeaders.length + 1}
                                                            className="px-4 py-3"
                                                        >
                                                            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                                                                <div>
                                                                    <span
                                                                        className="font-medium"
                                                                        style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}
                                                                    >
                                                                        Laundry Processed By:
                                                                    </span>
                                                                    <p style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                                                                        {record.laundryProcessedBy || "—"}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <span
                                                                        className="font-medium"
                                                                        style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}
                                                                    >
                                                                        Claim Processed By:
                                                                    </span>
                                                                    <p style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                                                                        {record.claimProcessedBy || "—"}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <span
                                                                        className="font-medium"
                                                                        style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}
                                                                    >
                                                                        Disposed By:
                                                                    </span>
                                                                    <p style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                                                                        {record.disposedBy || "—"}
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`rounded px-3 py-1 transition-colors ${
                                currentPage === 1 ? "cursor-not-allowed opacity-50" : "hover:opacity-80"
                            }`}
                            style={{
                                backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                color: "#F3EDE3",
                            }}
                        >
                            Prev
                        </button>

                        <span
                            className="font-medium"
                            style={{ color: isDarkMode ? "#0B2B26" : "#0B2B26" }}
                        >
                            Page <span style={{ color: isDarkMode ? "#3DD9B6" : "#0891B2" }}>{currentPage}</span> of{" "}
                            <span style={{ color: isDarkMode ? "#3DD9B6" : "#0891B2" }}>{totalPages}</span>
                        </span>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`rounded px-3 py-1 transition-colors ${
                                currentPage === totalPages ? "cursor-not-allowed opacity-50" : "hover:opacity-80"
                            }`}
                            style={{
                                backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                color: "#F3EDE3",
                            }}
                        >
                            Next
                        </button>
                    </div>
                )}

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