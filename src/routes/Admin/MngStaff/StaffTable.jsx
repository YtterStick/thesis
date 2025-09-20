import PropTypes from "prop-types";
import { Pencil, Trash2, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/utils/cn";
import EditStaffForm from "./EditStaffForm";

const ITEMS_PER_PAGE = 7;

const StaffTable = ({ staff, onStatusChange, onStaffUpdate }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const { toast } = useToast();

  if (!staff || staff.length === 0) {
    return (
      <div className="card flex items-start justify-start p-6">
        <div className="flex flex-col gap-2">
          <p className="card-title">Account List</p>
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <div className="pt-6 text-sm text-slate-500 dark:text-slate-400">
            Loading staff data...
          </div>
        </div>
      </div>
    );
  }

  const filtered = staff.filter((acc) =>
    [acc.username, acc.contact, acc.role]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedStaff = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
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

  return (
    <div className="card">
      {/* Header with Search */}
      <div className="card-header flex flex-col items-start gap-2">
        <p className="card-title">Account List</p>
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={(term) => {
            setSearchTerm(term);
            setCurrentPage(1);
          }}
        />
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
              <th className="p-2 text-right">Actions</th>
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
                  <td
                    className={cn(
                      "p-2 font-medium uppercase",
                      account.role === "ADMIN"
                        ? "text-blue-400 dark:text-blue-400"
                        : account.role === "STAFF"
                        ? "text-orange-400 dark:text-orange-400"
                        : "text-slate-600 dark:text-slate-300"
                    )}
                  >
                    {account.role}
                  </td>
                  <td className="p-2 text-slate-600 dark:text-slate-300">
                    {account.contact?.replace(/^\+63/, "0")}
                  </td>
                  <td className="p-2">
                    <span
                      className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        account.status === "Active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      )}
                    >
                      {account.status}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end space-x-2">
                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingStaff(account)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                        disabled={loadingId === account.id}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      {/* Compact Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-4 text-sm">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`rounded px-3 py-1 transition-colors ${
              currentPage === 1
                ? "opacity-50 cursor-not-allowed"
                : "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-300 dark:hover:bg-cyan-800"
            }`}
          >
            Prev
          </button>

          <span className="text-slate-600 dark:text-slate-300 font-medium">
            Page{" "}
            <span className="text-cyan-600 dark:text-cyan-400">
              {currentPage}
            </span>{" "}
            of{" "}
            <span className="text-cyan-600 dark:text-cyan-400">
              {totalPages}
            </span>
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`rounded px-3 py-1 transition-colors ${
              currentPage === totalPages
                ? "opacity-50 cursor-not-allowed"
                : "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-300 dark:hover:bg-cyan-800"
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Staff Form Modal */}
      {editingStaff && (
        <EditStaffForm
          staff={editingStaff}
          onUpdate={(updatedStaff) => {
            // Update the local state
            const updated = staff.map(acc => 
              acc.id === updatedStaff.id ? updatedStaff : acc
            );
            // Call the parent callback to update the main state
            onStaffUpdate(updatedStaff);
            setEditingStaff(null);
          }}
          onClose={() => setEditingStaff(null)}
        />
      )}
    </div>
  );
};

const SearchBar = ({ searchTerm, setSearchTerm }) => (
  <div className="relative w-full max-w-xs">
    <div className="flex items-center rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 focus-within:ring-2 focus-within:ring-cyan-500 dark:focus-within:ring-cyan-400 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-slate-950 px-3 h-[38px]">
      <Search size={16} className="text-slate-400 dark:text-slate-500" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by username, contact, role..."
        className="w-full bg-transparent px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none"
      />
    </div>
  </div>
);

StaffTable.propTypes = {
  staff: PropTypes.array.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onStaffUpdate: PropTypes.func.isRequired, // Add this prop type
};

export default StaffTable;