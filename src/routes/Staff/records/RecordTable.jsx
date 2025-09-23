import { useState, useEffect, useRef } from "react";
import { Search, AlertCircle, CheckCircle2, Printer, CalendarIcon } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import PrintableReceipt from "@/components/PrintableReceipt";

const tableHeaders = ["Name", "Service", "Loads", "Detergent", "Fabric", "Price", "Date", "Pickup", "Actions"];

const renderStatusBadge = (status, isExpired) => {
    // If expired, override the status to show as expired
    if (isExpired) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                    </span>
                </TooltipTrigger>
                <TooltipContent side="top">Past Due</TooltipContent>
            </Tooltip>
        );
    }

    const iconMap = {
        EXPIRED: <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />,
        UNCLAIMED: <AlertCircle className="h-4 w-4 text-orange-500 dark:text-orange-400" />,
        CLAIMED: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />,
    };

    const icon = iconMap[status] || null;
    return icon ? (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center">{icon}</span>
            </TooltipTrigger>
            <TooltipContent side="top">{status.charAt(0) + status.slice(1).toLowerCase()}</TooltipContent>
        </Tooltip>
    ) : null;
};

const RecordTable = ({ items = [] }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRange, setSelectedRange] = useState({ from: null, to: null });
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState("desc");
    const [printData, setPrintData] = useState(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const rowsPerPage = 6;
    const calendarRef = useRef(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedRange]);

    useEffect(() => {
        const handlePointerDown = (e) => {
            if (calendarRef.current?.contains(e.target)) return;
            setShowCalendar(false);
        };
        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    const isInRange = (dateStr) => {
        const created = new Date(dateStr);
        const from = selectedRange?.from ? new Date(selectedRange.from) : null;
        const to = selectedRange?.to ? new Date(selectedRange.to) : null;
        if (from && to) return created >= from && created <= to;
        if (from) return created >= from;
        if (to) return created <= to;
        return true;
    };

    // Filter out disposed records and apply search/filter
    const filtered = items.filter((r) => 
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        isInRange(r.createdAt)
    );

    const sorted = [...filtered].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
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

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const closePrintModal = () => {
        setShowPrintModal(false);
        setPrintData(null);
    };

    const clearDateFilter = () => {
        setSelectedRange({ from: null, to: null });
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                {/* 🔍 Search + Calendar */}
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

                    {/* 📅 Calendar */}
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
                </div>

                {/* 📊 Table */}
                <div className="overflow-x-auto rounded-md border border-slate-300 dark:border-slate-700">
                    <table className="min-w-full table-auto text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800">
                            <tr>
                                {tableHeaders.map((header) => (
                                    <th
                                        key={header}
                                        className={`px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 ${
                                            header === "Date" ? "cursor-pointer" : ""
                                        }`}
                                        onClick={header === "Date" ? () => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc")) : undefined}
                                    >
                                        {header}
                                        {header === "Date" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={tableHeaders.length}
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
                                paginated.map((record, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-t border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800/50"
                                    >
                                        <td className="px-3 py-2">{record.name}</td>
                                        <td className="px-3 py-2">{record.service}</td>
                                        <td className="px-3 py-2">{record.loads}</td>
                                        <td className="px-3 py-2">{record.detergent}</td>
                                        <td className="px-3 py-2">{record.fabric}</td>
                                        <td className="px-3 py-2">₱{record.price}</td>
                                        <td className="px-3 py-2">
                                            {record.createdAt && !isNaN(new Date(record.createdAt))
                                                ? format(new Date(record.createdAt), "MMM dd, yyyy")
                                                : "—"}
                                        </td>
                                        <td className="p-2 text-slate-600 dark:text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <span>{record.expired ? "Past Due" : record.pickupStatus}</span>
                                                {renderStatusBadge(record.pickupStatus, record.expired)}
                                            </div>
                                        </td>
                                        <td className="p-2">
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
                                                <TooltipContent side="top">
                                                    {isPrinting ? "Printing..." : "Print Receipt"}
                                                </TooltipContent>
                                            </Tooltip>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 📄 Pagination */}
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

export default RecordTable;