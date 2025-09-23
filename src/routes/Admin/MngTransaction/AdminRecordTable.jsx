import { useState, useEffect, useRef } from "react";
import { Search, AlertCircle, CheckCircle2, Printer, CalendarIcon, Download, Clock8, ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import PrintableReceipt from "./PrintableReceipt";

const tableHeaders = ["Name", "Service", "Loads", "Detergent", "Price", "Date", "Payment", "Laundry Status", "Pickup Status", "Actions"];

const renderStatusBadge = (status, type = "pickup") => {
    const iconMap = {
        Expired: <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />,
        Disposed: <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />,
        Unclaimed: <AlertCircle className="h-4 w-4 text-orange-500 dark:text-orange-400" />,
        Washing: <CheckCircle2 className="h-4 w-4 text-blue-500 dark:text-blue-400" />,
        Done: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />,
        Claimed: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />,
        Pending: <Clock8 className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />,
        Paid: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />,
        Unpaid: <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />,
        "Not Started": <Clock8 className="h-4 w-4 text-gray-500 dark:text-gray-400" />,
        UNCLAIMED: <AlertCircle className="h-4 w-4 text-orange-500 dark:text-orange-400" />,
    };

    const icon = iconMap[status] || null;

    return icon ? (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center">{icon}</span>
            </TooltipTrigger>
            <TooltipContent side="top">
                <div className="font-medium">{status}</div>
            </TooltipContent>
        </Tooltip>
    ) : null;
};

const AdminRecordTable = ({ items = [], allItems = [], activeFilter, sortOrder }) => {
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
                return item.expired;
            case "unwashed":
                return item.laundryStatus === "Not Started";
            case "unclaimed":
                return item.pickupStatus === "UNCLAIMED";
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

    const handlePrintNow = () => {
        window.print();
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                {/* Search + Calendar + Export */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="w-full max-w-xs flex-1">
                        <div className="relative w-full max-w-xs">
                            <div className="flex h-[38px] items-center rounded-md border border-slate-300 bg-white px-3 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:ring-offset-2 focus-within:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-cyan-400 dark:focus-within:ring-offset-slate-950">
                                <Search
                                    size={16}
                                    className="text-slate-400 dark:text-slate-500"
                                />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Search by name"
                                    className="w-full bg-transparent px-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none dark:text-white dark:placeholder:text-slate-500"
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
                                className="bg-[#0891B2] text-white hover:bg-[#0E7490]"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedRange.from || selectedRange.to ? "Filtered" : "Date Range"}
                            </Button>
                            {showCalendar && (
                                <div className="absolute right-0 z-50 mt-2 rounded-md border bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
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
                                            className="mt-2 w-full"
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
                            className="bg-green-600 text-white hover:bg-green-700"
                            disabled={allItems.length === 0}
                        >
                            <Download className="mr-2 h-4 w-4" /> Export
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-md border border-slate-300 dark:border-slate-700">
                    <table className="min-w-full table-auto text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800">
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
                                            className={`px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 ${
                                                isSortable ? "cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" : ""
                                            }`}
                                            onClick={isSortable ? () => handleSort(field) : undefined}
                                        >
                                            <div className="flex items-center">
                                                {header}
                                                {isSortable && tableSortField === field && (
                                                    <span className="ml-1">{tableSortOrder === "asc" ? "↑" : "↓"}</span>
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
                                        className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-slate-400" />
                                            <span>No records found.</span>
                                            {(searchTerm || selectedRange.from || selectedRange.to) && (
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSearchTerm("");
                                                        setSelectedRange({ from: null, to: null });
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
                                                className={`border-t border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800/50 ${
                                                    shouldHighlightRow ? "bg-yellow-100 dark:bg-yellow-900/30" : ""
                                                }`}
                                            >
                                                <td className="px-2 py-2">
                                                    <button
                                                        onClick={() => toggleRowExpansion(record.id)}
                                                        className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                    >
                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-2 font-medium">{record.name}</td>
                                                <td className="px-3 py-2">{record.service}</td>
                                                <td className="px-3 py-2">{record.loads}</td>
                                                <td className="px-3 py-2">{record.detergent}</td>
                                                <td className="px-3 py-2">₱{record.price.toFixed(2)}</td>
                                                <td className="px-3 py-2">
                                                    {record.createdAt && !isNaN(new Date(record.createdAt))
                                                        ? format(new Date(record.createdAt), "MMM dd, yyyy")
                                                        : "—"}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span>{record.paymentMethod}</span>
                                                        {renderStatusBadge(
                                                            record.paymentMethod === "GCash" && !record.gcashVerified
                                                                ? "Pending"
                                                                : record.paid
                                                                  ? "Paid"
                                                                  : "Unpaid",
                                                            "payment",
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span>{record.laundryStatus}</span>
                                                        {renderStatusBadge(record.laundryStatus, "laundry")}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span>{record.disposed ? "Disposed" : record.expired ? "Expired" : record.pickupStatus}</span>
                                                        {renderStatusBadge(
                                                            record.disposed ? "Disposed" : record.expired ? "Expired" : record.pickupStatus,
                                                            "pickup",
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={() => handlePrint(record)}
                                                                disabled={isPrinting}
                                                                className="rounded-md bg-slate-100 p-2 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
                                                            >
                                                                <Printer className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">{isPrinting ? "Printing..." : "Print Receipt"}</TooltipContent>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr
                                                    className={`bg-slate-50 dark:bg-slate-800/30 ${shouldHighlightRow ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
                                                >
                                                    <td
                                                        colSpan={tableHeaders.length + 1}
                                                        className="px-4 py-3"
                                                    >
                                                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                                                            <div>
                                                                <span className="font-medium text-slate-500 dark:text-slate-400">
                                                                    Laundry Processed By:
                                                                </span>
                                                                <p>{record.laundryProcessedBy || "—"}</p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-slate-500 dark:text-slate-400">
                                                                    Claim Processed By:
                                                                </span>
                                                                <p>{record.claimProcessedBy || "—"}</p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-slate-500 dark:text-slate-400">Disposed By:</span>
                                                                <p>{record.disposedBy || "—"}</p>
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
                                    : "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-300 dark:hover:bg-cyan-800"
                            }`}
                        >
                            Prev
                        </button>

                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            Page <span className="text-cyan-600 dark:text-cyan-400">{currentPage}</span> of{" "}
                            <span className="text-cyan-600 dark:text-cyan-400">{totalPages}</span>
                        </span>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`rounded px-3 py-1 transition-colors ${
                                currentPage === totalPages
                                    ? "cursor-not-allowed opacity-50"
                                    : "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-300 dark:hover:bg-cyan-800"
                            }`}
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Print Modal */}
                {showPrintModal && printData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="mx-auto w-full max-w-sm">
                            {" "}
                            {/* Changed to max-w-sm */}
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
