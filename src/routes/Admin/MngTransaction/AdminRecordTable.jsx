import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, AlertCircle, CheckCircle2, Printer, CalendarIcon, Download, Clock8, ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import PrintableReceipt from "@/components/PrintableReceipt";

const tableHeaders = ["Name", "Service", "Loads", "Detergent", "Price", "Date", "Payment", "Laundry Status", "Pickup Status", "Actions"];

const renderStatusBadge = (status, type = "pickup", isDarkMode) => {
    const iconMap = {
        Expired: <AlertCircle className="h-4 w-4 text-red-500" />,
        Disposed: <AlertCircle className="h-4 w-4 text-gray-500" />,
        Unclaimed: <AlertCircle className="h-4 w-4 text-orange-500" />,
        Washing: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
        Done: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        Claimed: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        Pending: <Clock8 className="h-4 w-4 text-yellow-500" />,
        Paid: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        Unpaid: <AlertCircle className="h-4 w-4 text-red-500" />,
        "Not Started": <Clock8 className="h-4 w-4 text-gray-500" />,
        UNCLAIMED: <AlertCircle className="h-4 w-4 text-orange-500" />,
    };

    const icon = iconMap[status] || null;

    return icon ? (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center">{icon}</span>
            </TooltipTrigger>
            <TooltipContent 
                side="top"
                style={{
                    backgroundColor: isDarkMode ? '#0B2B26' : '#FFFFFF',
                    color: isDarkMode ? '#F3EDE3' : '#0B2B26',
                    borderColor: isDarkMode ? '#1C3F3A' : '#0B2B26',
                }}
            >
                <div className="font-medium">{status}</div>
            </TooltipContent>
        </Tooltip>
    ) : null;
};

const AdminRecordTable = ({ items = [], allItems = [], activeFilter, sortOrder, isDarkMode }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRange, setSelectedRange] = useState({ from: null, to: null });
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [tableSortOrder, setTableSortOrder] = useState("desc");
    const [tableSortField, setTableSortField] = useState("createdAt");
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [printData, setPrintData] = useState(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const rowsPerPage = 10;
    const calendarRef = useRef(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedRange, activeFilter]);

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
        const from = selectedRange?.from ? new Date(selectedRange.from) : null;
        const to = selectedRange?.to ? new Date(selectedRange.to) : null;
        if (from && to) return created >= from && created <= to;
        if (from) return created >= from;
        if (to) return created <= to;
        return true;
    };

    const shouldHighlight = (item, index) => {
        switch (activeFilter) {
            case "income":
                const sortedByPrice = [...items].sort((a, b) => (sortOrder === "asc" ? a.price - b.price : b.price - a.price));
                return sortedByPrice.indexOf(item) < 10;
            case "loads":
                const sortedByLoads = [...items].sort((a, b) => (sortOrder === "asc" ? a.loads - b.loads : b.loads - a.loads));
                return sortedByLoads.indexOf(item) < 10;
            case "expired":
                // FIX: Only highlight expired records that are not disposed
                return item.expired && !item.disposed;
            case "unwashed":
                // FIX: Highlight records that have at least one unwashed load and not disposed
                return item.unwashedLoadsCount > 0 && 
                       !item.disposed;
            case "unclaimed":
                // FIX: Only highlight unclaimed records where laundry is completed, not expired, and not disposed
                return item.pickupStatus === "UNCLAIMED" && 
                       item.laundryStatus === "Completed" &&
                       !item.expired && 
                       !item.disposed;
            default:
                return false;
        }
    };

    const filtered = items.filter((r) => r.name?.toLowerCase().includes(searchTerm.toLowerCase()) && isInRange(r.createdAt));

    const sorted = [...filtered].sort((a, b) => {
        if (activeFilter === "income") {
            return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
        } else if (activeFilter === "loads") {
            return sortOrder === "asc" ? a.loads - b.loads : b.loads - a.loads;
        }

        const valueA = a[tableSortField];
        const valueB = b[tableSortField];

        if (tableSortField === "createdAt") {
            const dateA = new Date(valueA);
            const dateB = new Date(valueB);
            return tableSortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }

        if (typeof valueA === "string" && typeof valueB === "string") {
            return tableSortOrder === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }

        return tableSortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });

    const totalPages = Math.ceil(sorted.length / rowsPerPage);
    const paginated = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handlePrint = async (record) => {
        try {
            setIsPrinting(true);
            console.log("🖨️ Printing receipt for:", record);

            const token = localStorage.getItem("authToken");
            const response = await fetch(`http://localhost:8080/api/transactions/${record.id}/service-invoice`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch invoice: ${response.status}`);
            }

            const invoiceData = await response.json();
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
        const dataToExport = allItems.map((item) => ({
            "Customer Name": item.name,
            Service: item.service,
            Loads: item.loads,
            Detergent: item.detergent,
            Fabric: item.fabric,
            Price: item.price,
            Date: item.createdAt ? format(new Date(item.createdAt), "MMM dd, yyyy") : "—",
            "Payment Method": item.paymentMethod,
            "Payment Status": item.paymentMethod === "GCash" && !item.gcashVerified ? "Pending" : item.paid ? "Paid" : "Unpaid",
            "Pickup Status": item.pickupStatus,
            "Laundry Status": item.laundryStatus,
            "Laundry Processed By": item.laundryProcessedBy || "—",
            "Claim Processed By": item.claimProcessedBy || "—",
            "Disposed By": item.disposedBy || "—",
            "GCash Verified": item.paymentMethod === "GCash" ? (item.gcashVerified ? "Yes" : "No") : "N/A",
            Expired: item.expired ? "Yes" : "No",
            Disposed: item.disposed ? "Yes" : "No",
            "Unwashed Loads Count": item.unwashedLoadsCount || 0,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laundry Records");
        const dateStr = format(new Date(), "yyyy-MM-dd");
        XLSX.writeFile(workbook, `laundry-records-${dateStr}.xlsx`);
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handleSort = (field) => {
        if (tableSortField === field) {
            setTableSortOrder(tableSortOrder === "asc" ? "desc" : "asc");
        } else {
            setTableSortField(field);
            setTableSortOrder("desc");
        }
    };

    const clearDateFilter = () => {
        setSelectedRange({ from: null, to: null });
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
                            <div className="flex h-[38px] items-center rounded-lg border-2 px-3 transition-all"
                                 style={{
                                     backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                     borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                 }}>
                                <Search
                                    size={16}
                                    style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}
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
                                        color: isDarkMode ? '#13151B' : '#0B2B26',
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
                                {selectedRange.from || selectedRange.to ? "Filtered" : "Date Range"}
                            </Button>
                            {showCalendar && (
                                <div className="absolute right-0 z-50 mt-2 rounded-lg border-2 p-2 shadow-lg"
                                     style={{
                                         backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                         borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                     }}>
                                    <Calendar
                                        mode="range"
                                        selected={selectedRange}
                                        onSelect={setSelectedRange}
                                        className="max-w-[350px] text-xs [&_button]:h-7 [&_button]:w-7 [&_button]:text-[11px] [&_td]:p-1 [&_thead_th]:text-[11px]"
                                    />
                                    {(selectedRange.from || selectedRange.to) && (
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
                                            Clear Filter
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
                            disabled={allItems.length === 0}
                        >
                            <Download className="mr-2 h-4 w-4" /> Export
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border-2"
                     style={{
                         borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                     }}>
                    <table className="min-w-full table-auto text-sm">
                        <thead style={{
                            backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                        }}>
                            <tr>
                                <th className="w-10 px-2 py-2"></th>
                                {tableHeaders.map((header) => {
                                    const fieldMap = {
                                        Name: "name",
                                        Service: "service",
                                        Loads: "loads",
                                        Detergent: "detergent",
                                        Price: "price",
                                        Date: "createdAt",
                                        Payment: "paymentMethod",
                                        "Laundry Status": "laundryStatus",
                                        "Pickup Status": "pickupStatus",
                                    };

                                    const field = fieldMap[header];
                                    const isSortable = !!field;

                                    return (
                                        <th
                                            key={header}
                                            className={`px-3 py-2 text-left text-xs font-medium ${
                                                isSortable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
                                            }`}
                                            style={{
                                                color: isDarkMode ? '#13151B' : '#0B2B26',
                                            }}
                                            onClick={isSortable ? () => handleSort(field) : undefined}
                                        >
                                            <div className="flex items-center">
                                                {header}
                                                {isSortable && tableSortField === field && (
                                                    <span className="ml-1" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                        {tableSortOrder === "asc" ? "↑" : "↓"}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={tableHeaders.length + 1}
                                        className="px-4 py-6 text-center text-sm"
                                        style={{
                                            color: isDarkMode ? '#6B7280' : '#0B2B26/70',
                                        }}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }} className="h-5 w-5" />
                                            <span>No records found.</span>
                                            {(searchTerm || selectedRange.from || selectedRange.to) && (
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSearchTerm("");
                                                        setSelectedRange({ from: null, to: null });
                                                    }}
                                                    className="transition-all"
                                                    style={{
                                                        color: isDarkMode ? '#13151B' : '#0B2B26',
                                                    }}
                                                >
                                                    Clear filters
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((record, idx) => {
                                    const isExpanded = expandedRows.has(record.id);
                                    const shouldHighlightRow = shouldHighlight(record, idx);

                                    return (
                                        <>
                                            <tr
                                                key={record.id}
                                                className={`border-t transition-all ${
                                                    shouldHighlightRow ? "bg-yellow-100 dark:bg-yellow-900/30" : "hover:opacity-90"
                                                }`}
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
                                                            <ChevronUp className="h-4 w-4" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }} />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }} />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-2 font-medium" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                    {record.name}
                                                </td>
                                                <td className="px-3 py-2" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                    {record.service}
                                                </td>
                                                <td className="px-3 py-2" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                    {record.loads}
                                                </td>
                                                <td className="px-3 py-2" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                    {record.detergent}
                                                </td>
                                                <td className="px-3 py-2 font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                    ₱{record.price.toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                    {record.createdAt && !isNaN(new Date(record.createdAt))
                                                        ? format(new Date(record.createdAt), "MMM dd, yyyy")
                                                        : "—"}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                            {record.paymentMethod}
                                                        </span>
                                                        {renderStatusBadge(
                                                            record.paymentMethod === "GCash" && !record.gcashVerified
                                                                ? "Pending"
                                                                : record.paid
                                                                  ? "Paid"
                                                                  : "Unpaid",
                                                            "payment",
                                                            isDarkMode
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                            {record.laundryStatus}
                                                        </span>
                                                        {renderStatusBadge(record.laundryStatus, "laundry", isDarkMode)}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                            {record.disposed ? "Disposed" : record.expired ? "Expired" : record.pickupStatus}
                                                        </span>
                                                        {renderStatusBadge(
                                                            record.disposed ? "Disposed" : record.expired ? "Expired" : record.pickupStatus,
                                                            "pickup",
                                                            isDarkMode
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">
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
                                                                <Printer className="h-4 w-4" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }} />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent 
                                                            side="top"
                                                            style={{
                                                                backgroundColor: isDarkMode ? '#0B2B26' : '#FFFFFF',
                                                                color: isDarkMode ? '#F3EDE3' : '#0B2B26',
                                                                borderColor: isDarkMode ? '#1C3F3A' : '#0B2B26',
                                                            }}
                                                        >
                                                            {isPrinting ? "Printing..." : "Print Receipt"}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr
                                                    className={`transition-all ${shouldHighlightRow ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
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
                                                                <span className="font-medium" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                                                    Laundry Processed By:
                                                                </span>
                                                                <p style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                                    {record.laundryProcessedBy || "—"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                                                    Claim Processed By:
                                                                </span>
                                                                <p style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                                    {record.claimProcessedBy || "—"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                                                    Disposed By:
                                                                </span>
                                                                <p style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                                    {record.disposedBy || "—"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                                                    Unwashed Loads:
                                                                </span>
                                                                <p style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                                    {record.unwashedLoadsCount || 0} of {record.loads} loads
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`rounded px-3 py-1 transition-colors ${
                                currentPage === 1
                                    ? "cursor-not-allowed opacity-50"
                                    : "hover:opacity-80"
                            }`}
                            style={{
                                backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                color: "#F3EDE3",
                            }}
                        >
                            Prev
                        </button>

                        <span className="font-medium" style={{ color: isDarkMode ? '#0B2B26' : '#0B2B26' }}>
                            Page <span style={{ color: isDarkMode ? '#3DD9B6' : '#0891B2' }}>{currentPage}</span> of{" "}
                            <span style={{ color: isDarkMode ? '#3DD9B6' : '#0891B2' }}>{totalPages}</span>
                        </span>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`rounded px-3 py-1 transition-colors ${
                                currentPage === totalPages
                                    ? "cursor-not-allowed opacity-50"
                                    : "hover:opacity-80"
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