import PropTypes from "prop-types";
import { Ban, CheckCircle, MoreVertical, Search } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 3;

const StaffTable = ({ staff, onConfirmDisable }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // ⏳ Show fallback while staff data is loading
  if (!staff || staff.length === 0) {
    return (
      <div className="card p-6 flex items-start justify-start">
        <div className="flex flex-col gap-2">
          <p className="card-title">Account List</p>
          <div className="relative h-[38px] w-full max-w-xs">
            <div className="input flex h-full items-center rounded-md border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800">
              <Search size={16} className="text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username, contact, role..."
                className="w-full bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50"
              />
            </div>
          </div>
          <div className="pt-6 text-sm text-slate-500 dark:text-slate-400">
            Loading staff data...
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(staff.length / ITEMS_PER_PAGE);

  const filtered = staff.filter((acc) =>
    [acc.username, acc.contact, acc.role]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const paginatedStaff = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="card">
      {/* Header with Search */}
      <div className="card-header flex flex-col items-start gap-2">
        <p className="card-title">Account List</p>
        <div className="relative h-[38px] w-full max-w-xs">
          <div className="input flex h-full items-center rounded-md border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800">
            <Search size={16} className="text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by username, contact, role..."
              className="w-full bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 w-full overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
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
            {paginatedStaff.length > 0 ? (
              paginatedStaff.map((account) => (
                <tr
                  key={account.id || `${account.contact}-${Math.random()}`}
                  className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/40"
                >
                  <td className="p-2 text-slate-800 dark:text-slate-100">
                    {account.username}
                  </td>
                  <td className="p-2 text-slate-600 dark:text-slate-300">
                    {account.role}
                  </td>
                  <td className="p-2 text-slate-600 dark:text-slate-300">
                    {account.contact?.replace(/^\+63/, "0")}
                  </td>
                  <td className="p-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        account.status === "Active"
                          ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {account.status}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-36 border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <DropdownMenuItem
                          onClick={() => onConfirmDisable(account)}
                          className={`flex cursor-pointer items-center gap-2 text-xs ${
                            account.status === "Active"
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {account.status === "Active" ? (
                            <>
                              <Ban className="h-4 w-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-slate-500 dark:text-slate-400"
                >
                  No matching accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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