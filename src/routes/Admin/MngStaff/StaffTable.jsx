import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Pencil, Trash2, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/utils/cn";
import EditStaffForm from "./EditStaffForm";

const ITEMS_PER_PAGE = 4;

const StaffTable = ({ staff, onStatusChange, onStaffUpdate }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [sortField, setSortField] = useState("username");
  const [sortOrder, setSortOrder] = useState("asc");
  const { toast } = useToast();

  if (!staff || staff.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border-2 p-6 transition-all"
        style={{
          backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
          borderColor: isDarkMode ? "#334155" : "#0B2B26",
        }}
      >
        <div className="flex flex-col gap-4">
          <p className="text-lg font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
            Account List
          </p>
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} isDarkMode={isDarkMode} />
          <div className="pt-6 text-center" style={{ color: isDarkMode ? '#94a3b8' : '#0B2B26/70' }}>
            No accounts found
          </div>
        </div>
      </motion.div>
    );
  }

  // Filter and sort staff
  const filtered = staff
    .filter((acc) =>
      [acc.username, acc.contact, acc.role]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "contact") {
        aValue = aValue?.replace(/^\+63/, "0") || "";
        bValue = bValue?.replace(/^\+63/, "0") || "";
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
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

  const handleDelete = async (id) => {
    setLoadingId(id);
    try {
      await onStatusChange(id, "Inactive");
      toast({
        title: "Success",
        description: "Account disabled successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const SortableHeader = ({ children, field }) => (
    <th 
      className="p-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors hover:opacity-80"
      style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {children}
        {sortField === field && (
          <span className="ml-1" style={{ color: isDarkMode ? '#3DD9B6' : '#0891B2' }}>
            {sortOrder === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 p-5 transition-all"
      style={{
        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
        borderColor: isDarkMode ? "#334155" : "#0B2B26",
      }}
    >
      {/* Header with Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
            Account List
          </p>
          <p className="text-sm" style={{ color: isDarkMode ? '#94a3b8' : '#0B2B26/70' }}>
            {filtered.length} accounts found
          </p>
        </div>
        <SearchBar 
          searchTerm={searchTerm} 
          setSearchTerm={(term) => {
            setSearchTerm(term);
            setCurrentPage(1);
          }}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border-2"
           style={{
             borderColor: isDarkMode ? "#334155" : "#0B2B26",
           }}>
        <table className="min-w-full text-left text-sm">
          <thead style={{
            backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
          }}>
            <tr>
              <SortableHeader field="username">Username</SortableHeader>
              <SortableHeader field="role">Role</SortableHeader>
              <SortableHeader field="contact">Contact</SortableHeader>
              <th className="p-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedStaff.length > 0 ? (
              paginatedStaff.map((account, index) => (
                <motion.tr
                  key={account.id || `${account.contact}-${Math.random()}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-t transition-colors hover:opacity-90"
                  style={{
                    borderColor: isDarkMode ? "#334155" : "#E0EAE8",
                    backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "#F3EDE3",
                  }}
                >
                  <td className="p-3 font-medium" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
                    {account.username}
                  </td>
                  <td className="p-3 font-medium uppercase"
                      style={{ 
                        color: account.role === "ADMIN" 
                          ? (isDarkMode ? "#60A5FA" : "#2563EB")
                          : account.role === "STAFF"
                          ? (isDarkMode ? "#FB923C" : "#EA580C")
                          : (isDarkMode ? '#f1f5f9' : '#0B2B26')
                      }}>
                    {account.role}
                  </td>
                  <td className="p-3" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
                    {account.contact?.replace(/^\+63/, "0")}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end space-x-2">
                      {/* Edit Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditingStaff(account)}
                        className="rounded-lg p-2 transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                        }}
                      >
                        <Pencil className="h-4 w-4" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }} />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(account.id)}
                        disabled={loadingId === account.id}
                        className="rounded-lg p-2 transition-colors hover:opacity-80 disabled:opacity-50"
                        style={{
                          backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          color: "#EF4444",
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center"
                  style={{ color: isDarkMode ? '#94a3b8' : '#0B2B26/70' }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Search className="h-12 w-12 opacity-50" />
                    <div>
                      <p className="font-medium">No matching accounts found</p>
                      {searchTerm && (
                        <p className="text-sm">Try adjusting your search terms</p>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm" style={{ color: isDarkMode ? '#94a3b8' : '#0B2B26/70' }}>
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} accounts
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg px-3 py-1 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                color: isDarkMode ? '#f1f5f9' : '#0B2B26',
              }}
            >
              Previous
            </motion.button>

            <span className="text-sm font-medium px-3" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
              Page <span style={{ color: isDarkMode ? '#3DD9B6' : '#0891B2' }}>{currentPage}</span> of{" "}
              <span style={{ color: isDarkMode ? '#3DD9B6' : '#0891B2' }}>{totalPages}</span>
            </span>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg px-3 py-1 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                color: isDarkMode ? '#f1f5f9' : '#0B2B26',
              }}
            >
              Next
            </motion.button>
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
    </motion.div>
  );
};

const SearchBar = ({ searchTerm, setSearchTerm, isDarkMode }) => (
  <div className="w-full max-w-xs">
    <div className="relative">
      <div className="flex h-[38px] items-center rounded-lg border-2 px-3 transition-all"
           style={{
             backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
             borderColor: isDarkMode ? "#334155" : "#0B2B26",
           }}>
        <Search
          size={16}
          style={{ color: isDarkMode ? '#94a3b8' : '#0B2B26' }}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by username, contact, role..."
          className="w-full bg-transparent px-2 text-sm placeholder:text-slate-400 focus-visible:outline-none"
          style={{
            color: isDarkMode ? '#f1f5f9' : '#0B2B26',
          }}
        />
      </div>
    </div>
  </div>
);

StaffTable.propTypes = {
  staff: PropTypes.array.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onStaffUpdate: PropTypes.func.isRequired,
};

export default StaffTable;