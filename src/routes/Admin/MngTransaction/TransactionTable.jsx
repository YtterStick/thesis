import { useState, useEffect, useRef } from "react";
import ExportCSV from "@/constants/ExportCSV";
import CustomDateInput from "../../../constants/CustomDateInput";
import TransactionActionMenu from "./components/TransactionActionMenu";
import StatusCheckboxGroup from "./components/StatusCheckBoxGroup";
import { Search, Filter, MoreVertical } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

const TransactionTableAdmin = ({ items = [], onEdit }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRange, setSelectedRange] = useState({ from: "", to: "" });
    const [selectedLaundry, setSelectedLaundry] = useState([]);
    const [selectedPickup, setSelectedPickup] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const filterRef = useRef(null);
    const dropdownRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 6;
    const [openItem, setOpenItem] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const triggerRefs = useRef({});

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedRange, selectedLaundry, selectedPickup, selectedPaymentMethod]);

    useEffect(() => {
        const handlePointerDown = (e) => {
            if (filterRef.current?.contains(e.target) || dropdownRef.current?.contains(e.target)) return;
            setShowFilters(false);
            setShowDatePicker(false);
            setOpenItem(null);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    const toggleStatus = (type, value) => {
        const map = {
            laundry: [selectedLaundry, setSelectedLaundry],
            pickup: [selectedPickup, setSelectedPickup],
            paymentMethod: [selectedPaymentMethod, setSelectedPaymentMethod],
        };
        const [selected, setSelected] = map[type];
        setSelected((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));
    };

    const isInRange = (dateStr) => {
        const created = new Date(dateStr);
        const from = selectedRange?.from ? new Date(selectedRange.from) : null;
        const to = selectedRange?.to ? new Date(selectedRange.to) : null;
        if (from && to) return created >= from && created <= to;
        if (from) return created >= from;
        if (to) return created <= to;
        return true;
    };

    const filtered = items.filter((t) => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = isInRange(t.createdAt);
        const matchesLaundry = selectedLaundry.length === 0 || selectedLaundry.includes(t.laundryStatus);
        const matchesPickup = selectedPickup.length === 0 || selectedPickup.includes(t.pickupStatus);
        const matchesPayment = selectedPaymentMethod.length === 0 || selectedPaymentMethod.includes(t.paymentMethod);
        return matchesSearch && matchesDate && matchesLaundry && matchesPickup && matchesPayment;
    });

    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const toggleMenu = (item) => {
        const button = triggerRefs.current[item.id];
        if (button) {
            const rect = button.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX + rect.width / 2 - 64,
            });
            setOpenItem((prev) => (prev?.id === item.id ? null : item));
        }
    };

    const handleEdit = () => {
        const target = openItem;
        if (!target) return;
        onEdit(target);
        setTimeout(() => setOpenItem(null), 100);
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                {/* 🔍 Search & Filters */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative h-[38px] w-full lg:w-[250px]">
                        <div className="flex h-full items-center rounded-md border border-slate-300 bg-white px-3 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:ring-offset-2 focus-within:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-cyan-400 dark:focus-within:ring-offset-slate-950">
                            <Search size={16} className="text-[#0891B2] dark:text-[#0891B2]" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name..."
                                className="w-full bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-2 sm:flex-row">
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowFilters((prev) => !prev);
                                    setShowDatePicker(false);
                                }}
                                className={`flex h-[38px] min-w-[120px] items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-cyan-400 dark:focus-visible:ring-offset-slate-950 ${
                                    showFilters
                                        ? "bg-[#0891B2] text-white hover:bg-[#0E7490]"
                                        : "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                                }`}
                            >
                                <Filter className={`h-4 w-4 ${showFilters ? "text-white" : "text-[#0891B2] dark:text-[#0891B2]"}`} />
                                Filters
                            </button>
                            {showFilters && (
                                <div
                                    ref={filterRef}
                                    className="absolute z-50 mt-2 flex flex-col gap-6 rounded-md border border-slate-300 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                                    style={{ minWidth: "220px", maxWidth: "280px", width: "100%" }}
                                >
                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-white">Payment Method</span>
                                        <StatusCheckboxGroup
                                            type="paymentMethod"
                                            options={["Cash", "GCash"]}
                                            selected={selectedPaymentMethod}
                                            toggleFn={toggleStatus}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-white">Laundry Status</span>
                                        <StatusCheckboxGroup
                                            type="laundry"
                                            options={["Pending", "Washing", "Done"]}
                                            selected={selectedLaundry}
                                            toggleFn={toggleStatus}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-white">Pickup Status</span>
                                        <StatusCheckboxGroup
                                            type="pickup"
                                            options={["Unclaimed", "Claimed"]}
                                            selected={selectedPickup}
                                            toggleFn={toggleStatus}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <CustomDateInput
                            value={selectedRange}
                            onChange={setSelectedRange}
                            show={showDatePicker}
                            setShow={setShowDatePicker}
                            closeOther={() => setShowFilters(false)}
                        />

                        <ExportCSV data={filtered} filename="transactions_admin.csv" />
                    </div>
                </div>

                {/* 📋 Table */}
                <div className="mt-4 w-full overflow-x-auto rounded-md border border-slate-300 dark:border-slate-700">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-200 text-xs uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <tr>
                                <th className="p-2">Customer</th>
                                <th className="p-2">Service</th>
                                <th className="p-2">Loads</th>
                                <th className="p-2">Detergent</th>
                                <th className="p-2">Softener</th>
                                <th className="p-2">Price</th>
                                <th className="p-2">Date</th>
                                <th className="p-2">Laundry Status</th>
                                <th className="p-2">Pickup Status</th>
                                <th className="p-2">Processed By</th>
                                <th className="p-2">Payment Method</th>
                                <th className="p-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length > 0 ? (
                                paginated.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="border-b border-slate-200 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800/50"
                                    >
                                        <td className="p-2 text-slate-800 dark:text-slate-100">{t.name}</td>
                                        <td className="p-2 text-slate-600 dark:text-slate-300">{t.service}</td>
                                        <td className="p-2 text-slate-600 dark:text-slate-300">{t.loads}</td>
                                        <td className="p-2 text-slate-600 dark:text-slate-300">{t.detergent}</td>
                                        <td className="p-2 text-slate-600 dark:text-slate-300">{t.softener}</td>
                                        <td className="p-2 text-slate-600 dark:text-slate-300">₱{t.price.toFixed(2)}</td>
                                        <td className="p-2 text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(t.createdAt).toLocaleDateString("en-US")}
                                        </td>
                                        <td className="p-2 text-slate-600 dark:text-slate-300">{t.laundryStatus}</td>
                                        <td className="p-2 text-slate-600 dark:text-slate-300">{t.pickupStatus}</td>
                                        <td className="p-2 text-slate-600 dark:text-slate-300">{t.processedBy || "—"}</td>
                                        <td className="p-2 text-slate-600 dark:text-slate-300">{t.paymentMethod || "—"}</td>
                                        <td className="p-2 text-center">
                                            <button
                                                ref={(el) => (triggerRefs.current[t.id] = el)}
                                                onClick={() => toggleMenu(t)}
                                                className="rounded-md p-1 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                                            >
                                                <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={12} className="p-4 text-center text-slate-500 dark:text-slate-400">
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 📄 Pagination */}
                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Previous
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`rounded px-2 py-1 ${
                                    currentPage === i + 1
                                        ? "bg-[#3DD9B6] text-white dark:bg-[#007362]"
                                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* 🎯 Floating Action Menu */}
                {openItem && (
                    <div
                        id="transaction-dropdown"
                        className="fixed z-50"
                        style={{ top: menuPos.top, left: menuPos.left }}
                        ref={dropdownRef}
                    >
                        <TransactionActionMenu
                            onEdit={handleEdit}
                            onDelete={() => {
                                console.log("[TransactionTableAdmin] Delete triggered:", openItem);
                                setOpenItem(null);
                            }}
                        />
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
};

export default TransactionTableAdmin;
