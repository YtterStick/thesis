import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Pencil, Trash2, Search, MoreVertical, Users } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import EditStaffForm from "./EditStaffForm";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 8;

const StaffTable = ({ staff, onStatusChange, onStaffUpdate, onDeleteRequest }) => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStaff, setEditingStaff] = useState(null);
  const [sortField, setSortField] = useState("username");
  const [sortOrder, setSortOrder] = useState("asc");
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Filter and sort
  const filtered = (staff || [])
    .filter((acc) =>
      [acc.username, acc.contact, acc.role]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = (a[sortField] || "").toString().toLowerCase();
      const bVal = (b[sortField] || "").toString().toLowerCase();
      if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedStaff = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const SortIndicator = ({ field }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1" style={{ color: "var(--admin-accent)" }}>
        {sortOrder === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: "var(--admin-card-border)" }}>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search accounts..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--admin-bg)",
              borderColor: "var(--admin-card-border)",
              color: "var(--admin-text-primary)",
            }}
          />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--admin-text-secondary)" }}>
          {filtered.length} accounts
        </p>
      </div>

      {/* Table */}
      <table className="admin-table">
        <thead className="admin-table-thead">
          <tr>
            <th className="admin-table-th cursor-pointer" onClick={() => handleSort("username")}>
              Username <SortIndicator field="username" />
            </th>
            <th className="admin-table-th cursor-pointer" onClick={() => handleSort("role")}>
              Role <SortIndicator field="role" />
            </th>
            <th className="admin-table-th cursor-pointer" onClick={() => handleSort("contact")}>
              Contact <SortIndicator field="contact" />
            </th>
            <th className="admin-table-th text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedStaff.length > 0 ? (
            paginatedStaff.map((account, index) => (
              <motion.tr
                key={account.id || index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="admin-table-tr"
              >
                <td className="admin-table-td">
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-lg p-2"
                      style={{ backgroundColor: "var(--admin-table-hover)" }}
                    >
                      <Users className="h-4 w-4" style={{ color: "var(--admin-accent)" }} />
                    </div>
                    <span className="font-bold">{account.username}</span>
                  </div>
                </td>
                <td className="admin-table-td">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm"
                    style={{
                      backgroundColor: account.role === "ADMIN"
                        ? "rgba(96, 165, 250, 0.1)"
                        : "rgba(251, 146, 60, 0.1)",
                      color: account.role === "ADMIN" ? "#3b82f6" : "#f59e0b",
                      borderColor: account.role === "ADMIN"
                        ? "rgba(96, 165, 250, 0.2)"
                        : "rgba(251, 146, 60, 0.2)",
                    }}
                  >
                    {account.role}
                  </span>
                </td>
                <td className="admin-table-td text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                  {account.contact?.replace(/^\+63/, "0") || "—"}
                </td>
                <td className="admin-table-td text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="rounded-md p-1 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                        style={{ color: "var(--admin-text-secondary)" }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-36 border shadow-lg"
                      style={{
                        backgroundColor: "var(--admin-card-bg)",
                        borderColor: "var(--admin-card-border)",
                        color: "var(--admin-text-primary)",
                      }}
                    >
                      <DropdownMenuItem
                        onClick={() => setEditingStaff(account)}
                        className="flex cursor-pointer items-center gap-2 text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteRequest?.(account)}
                        className="flex cursor-pointer items-center gap-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </motion.tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="admin-table-td p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Search className="h-12 w-12 opacity-20" />
                  <div>
                    <p className="font-bold" style={{ color: "var(--admin-text-primary)" }}>No accounts found</p>
                    {searchTerm && (
                      <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>Try adjusting your search</p>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "var(--admin-card-border)" }}>
          <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-30"
              style={{
                backgroundColor: "var(--admin-table-hover)",
                color: "var(--admin-text-primary)",
              }}
            >
              Previous
            </button>
            <span className="text-xs font-medium px-2" style={{ color: "var(--admin-text-secondary)" }}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-30"
              style={{
                backgroundColor: "var(--admin-table-hover)",
                color: "var(--admin-text-primary)",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Staff Form Modal */}
      {editingStaff && (
        <EditStaffForm
          staff={editingStaff}
          onUpdate={(updatedStaff) => {
            onStaffUpdate(updatedStaff);
            setEditingStaff(null);
          }}
          onClose={() => setEditingStaff(null)}
        />
      )}
    </div>
  );
};

StaffTable.propTypes = {
  staff: PropTypes.array.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onStaffUpdate: PropTypes.func.isRequired,
  onDeleteRequest: PropTypes.func,
};

export default StaffTable;