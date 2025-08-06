import PropTypes from "prop-types";
import { Ban, CheckCircle } from "lucide-react";
import { useState } from "react";

const ITEMS_PER_PAGE = 8;

const StaffTable = ({ staff, onConfirmDisable }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(staff.length / ITEMS_PER_PAGE);

    const paginatedStaff = staff.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    return (
        <div className="card">
            <div className="card-header justify-between">
                <p className="card-title">Account List</p>
            </div>
            <div className="w-full overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <tr>
                            <th className="p-2">Username</th>
                            <th className="p-2">Role</th>
                            <th className="p-2">Contact</th>
                            <th className="p-2">Status</th>
                            <th className="p-2 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedStaff.map((account) => (
                            <tr
                                key={account.id || `${account.contact}-${Math.random()}`}
                                className="staff-row-hover border-b border-slate-200 dark:border-slate-700"
                            >
                                <td className="p-2 align-top text-slate-800 dark:text-slate-100">{account.username}</td>
                                <td className="p-2 align-top text-slate-700 dark:text-slate-300">{account.role}</td>
                                <td className="p-2 align-top text-slate-700 dark:text-slate-300">{account.contact?.replace(/^\+63/, "0")}</td>
                                <td className="p-2 align-top">
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                                            account.status === "Active" ? "badge-active" : "badge-inactive"
                                        }`}
                                    >
                                        {account.status}
                                    </span>
                                </td>
                                <td className="p-2 text-right align-top">
                                    <button
                                        onClick={() => onConfirmDisable(account)}
                                        className={`transition-colors ${
                                            account.status === "Active"
                                                ? "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                                : "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                        }`}
                                        title={account.status === "Active" ? "Disable Account" : "Enable Account"}
                                    >
                                        {account.status === "Active" ? <Ban size={18} /> : <CheckCircle size={18} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

StaffTable.propTypes = {
    staff: PropTypes.array.isRequired,
    onConfirmDisable: PropTypes.func.isRequired,
};

export default StaffTable;
