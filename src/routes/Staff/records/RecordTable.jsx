import { useState, useEffect, useRef } from "react";
import { Search, AlertCircle, CheckCircle2, Printer, CalendarIcon } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import PrintableReceipt from "@/components/PrintableReceipt";

const tableHeaders = ["Name", "Service", "Loads", "Detergent", "Fabric", "Price", "Date", "Pickup", "Actions"];

const renderStatusBadge = (status, isExpired, isDarkMode) => {
    // If expired, override the status to show as expired
    if (isExpired) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                    </span>
                </TooltipTrigger>
                <TooltipContent 
                    side="top"
                    style={{
                        backgroundColor: isDarkMode ? '#0B2B26' : '#FFFFFF',
                        color: isDarkMode ? '#F3EDE3' : '#0B2B26',
                        borderColor: isDarkMode ? '#1C3F3A' : '#0B2B26',
                    }}
                >
                    Past Due
                </TooltipContent>
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
            <TooltipContent 
                side="top"
                style={{
                    backgroundColor: isDarkMode ? '#0B2B26' : '#FFFFFF',
                    color: isDarkMode ? '#F3EDE3' : '#0B2B26',
                    borderColor: isDarkMode ? '#1C3F3A' : '#0B2B26',
                }}
            >
                {status.charAt(0) + status.slice(1).toLowerCase()}
            </TooltipContent>
        </Tooltip>
    ) : null;
};

const RecordTable = ({ items = [], isDarkMode }) => {
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
        if (!dateStr) return false;
        
        const created = new Date(dateStr);
        created.setHours(0, 0, 0, 0);
        
        // Add null checks for selectedRange
        const from = selectedRange?.from ? new Date(selectedRange.from) : null;
        const to = selectedRange?.to ? new Date(selectedRange.to) : null;
        
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

    const formatDateRange = () => {
        // Add null check for selectedRange
        if (!selectedRange) return "Date Range";
        
        if (selectedRange.from && selectedRange.to) {
            return `${format(selectedRange.from, "MMM dd, yyyy")} - ${format(selectedRange.to, "MMM dd, yyyy")}`;
        }
        if (selectedRange.from) {
            return `From ${format(selectedRange.from, "MMM dd, yyyy")}`;
        }
        if (selectedRange.to) {
            return `Until ${format(selectedRange.to, "MMM dd, yyyy")}`;
        }
        return "Date Range";
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                {/* 🔍 Search + Calendar */}
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

                    {/* 📅 Calendar */}
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
                            <div className="absolute right-0 z-50 mt-2 rounded-lg border-2 p-2 shadow-lg"
                                style={{
                                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                }}>
                                <Calendar
                                    mode="range"
                                    selected={selectedRange}
                                    onSelect={(range) => {
                                        // Ensure range is always an object with from and to properties
                                        setSelectedRange(range || { from: null, to: null });
                                    }}
                                    isDarkMode={isDarkMode}
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
                </div>

                {/* 📊 Table */}
                <div className="overflow-x-auto rounded-lg border-2"
                     style={{
                         borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                     }}>
                    <table className="min-w-full table-auto text-sm">
                        <thead style={{
                            backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                        }}>
                            <tr>
                                {tableHeaders.map((header) => (
                                    <th
                                        key={header}
                                        className={`px-3 py-2 text-left text-xs font-medium ${
                                            header === "Date" ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
                                        }`}
                                        style={{
                                            color: isDarkMode ? '#13151B' : '#0B2B26',
                                        }}
                                        onClick={header === "Date" ? () => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc")) : undefined}
                                    >
                                        <div className="flex items-center">
                                            {header}
                                            {header === "Date" && (
                                                <span className="ml-1" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                    {sortOrder === "asc" ? "↑" : "↓"}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={tableHeaders.length}
                                        className="px-4 py-6 text-center text-sm"
                                        style={{
                                            color: isDarkMode ? '#6B7280' : '#0B2B26/70',
                                        }}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }} className="h-5 w-5" />
                                            <span>No records found.</span>
                                            {(searchTerm || selectedRange?.from || selectedRange?.to) && (
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
                                paginated.map((record, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-t transition-all hover:opacity-90"
                                        style={{
                                            borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                        }}
                                    >
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
                                        <td className="px-3 py-2" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                            {record.fabric}
                                        </td>
                                        <td className="px-3 py-2 font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                            ₱{record.price.toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                            {record.createdAt && !isNaN(new Date(record.createdAt))
                                                ? format(new Date(record.createdAt), "MMM dd, yyyy")
                                                : "—"}
                                        </td>
                                        <td className="p-2">
                                            <div className="flex items-center gap-2">
                                                <span style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                    {record.expired ? "Past Due" : record.pickupStatus}
                                                </span>
                                                {renderStatusBadge(record.pickupStatus, record.expired, isDarkMode)}
                                            </div>
                                        </td>
                                        <td className="p-2">
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
                                    : "hover:opacity-80"
                            }`}
                            style={{
                                backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                color: "#F3EDE3",
                            }}
                        >
                            Prev
                        </button>

                        <span className="font-medium" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
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

export default RecordTable;