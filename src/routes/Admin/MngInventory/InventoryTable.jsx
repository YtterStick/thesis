import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import PropTypes from "prop-types";
import {
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  Search,
  Boxes,
  Package,
  Clock,
  AlertTriangle,
  Layers,
  XCircle,
  History,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const getStatusIcon = (quantity, low, adequate) => {
  if (quantity === 0) {
    return {
      icon: <XCircle className="h-4 w-4" />,
      label: "Out of Stock",
      color: "text-red-500",
      labelColor: "text-red-600",
      darkLabelColor: "text-red-400",
      bgColor: "bg-red-100",
      darkBgColor: "bg-red-900/30",
      borderColor: "border-red-200",
      darkBorderColor: "border-red-800",
    };
  }
  if (quantity <= low) {
    return {
      icon: <AlertTriangle className="h-4 w-4" />,
      label: "Low",
      color: "text-orange-500",
      labelColor: "text-orange-600",
      darkLabelColor: "text-orange-400",
      bgColor: "bg-orange-100",
      darkBgColor: "bg-orange-900/30",
      borderColor: "border-orange-200",
      darkBorderColor: "border-orange-800",
    };
  }
  if (quantity <= adequate) {
    return {
      icon: <Clock className="h-4 w-4" />,
      label: "Normal",
      color: "text-blue-500",
      labelColor: "text-blue-600",
      darkLabelColor: "text-blue-400",
      bgColor: "bg-blue-100",
      darkBgColor: "bg-blue-900/30",
      borderColor: "border-blue-200",
      darkBorderColor: "border-blue-800",
    };
  }
  return {
    icon: <Layers className="h-4 w-4" />,
    label: "Full",
    color: "text-green-600",
    labelColor: "text-green-600",
    darkLabelColor: "text-green-400",
    bgColor: "bg-green-100",
    darkBgColor: "bg-green-900/30",
    borderColor: "border-green-200",
    darkBorderColor: "border-green-800",
  };
};

const InventoryTable = ({ items, onAddStock, onEditItem, onDeleteRequest, onViewHistory }) => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const filteredItems = items.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "Never restocked";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border-2 p-5 transition-all"
        style={{
          backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
          borderColor: isDarkMode ? "#334155" : "#cbd5e1",
        }}
      >
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
              Inventory List
            </p>
            <p className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
              {filteredItems.length} items found
            </p>
          </div>
          
          {/* Search */}
          <div className="w-full max-w-xs">
            <div className="relative">
              <div className="flex h-[38px] items-center rounded-lg border-2 px-3 transition-all"
                   style={{
                     backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                     borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                   }}>
                <Search
                  size={16}
                  style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search items..."
                  className="w-full bg-transparent px-2 text-sm placeholder:text-slate-400 focus-visible:outline-none"
                  style={{
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border shadow-sm"
             style={{
               borderColor: "var(--admin-card-border)",
             }}>
          <table className="admin-table">
            <thead className="admin-table-thead">
              <tr>
                <th className="admin-table-th">Supply Item</th>
                <th className="admin-table-th">Quantity</th>
                <th className="admin-table-th text-center">Status</th>
                <th className="admin-table-th">Price</th>
                <th className="admin-table-th">Last Restock</th>
                <th className="admin-table-th">Restock Qty</th>
                <th className="admin-table-th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => {
                  const id = item._id || item.id;
                  const status = getStatusIcon(
                    item.quantity,
                    item.lowStockThreshold ?? 0,
                    item.adequateStockThreshold ?? 0,
                  );

                  return (
                    <motion.tr
                      key={id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="admin-table-tr"
                    >
                      <td className="admin-table-td">
                        <div className="flex items-center gap-3">
                          <div
                            className="rounded-lg p-2"
                            style={{
                              backgroundColor: "var(--admin-table-hover)",
                            }}
                          >
                            <Package
                              className="h-4 w-4"
                              style={{ color: "var(--admin-accent)" }}
                            />
                          </div>
                          <div>
                            <p className="font-bold">
                              {item.name}
                            </p>
                            {item.category && (
                              <p className="text-[10px] uppercase tracking-wider opacity-60">
                                {item.category}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="admin-table-td">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            {item.quantity}
                          </span>
                          <span className="text-[10px] font-medium uppercase tracking-widest opacity-60">
                            {item.unit || "units"}
                          </span>
                        </div>
                      </td>
                      <td className="admin-table-td">
                        <div className="flex justify-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                className="flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-1 transition-all"
                                style={{
                                  backgroundColor: isDarkMode ? status.darkBgColor : status.bgColor,
                                  borderColor: isDarkMode ? status.darkBorderColor : status.borderColor,
                                }}
                              >
                                <span className={isDarkMode ? status.color : status.color}>
                                  {status.icon}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? status.darkLabelColor : status.labelColor}`}>
                                  {status.label}
                                </span>
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent style={{ backgroundColor: "var(--admin-card-bg)", color: "var(--admin-text-primary)", border: "1px solid var(--admin-card-border)" }}>
                              <p className="text-xs">
                                Current stock level: {item.quantity} {item.unit}
                              </p>
                              {item.lowStockThreshold && (
                                <p className="text-[10px] opacity-70">Low stock threshold: {item.lowStockThreshold}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="admin-table-td font-bold text-admin-accent">
                        ₱{item.price?.toFixed(2) ?? "—"}
                      </td>
                      <td className="admin-table-td text-[11px] opacity-70">
                        {formatDate(item.lastRestock)}
                      </td>
                      <td className="admin-table-td font-medium">
                        {item.lastRestockAmount != null ? (
                          <span className="text-green-500">+{item.lastRestockAmount}</span>
                        ) : "—"}
                      </td>
                      <td className="admin-table-td text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="rounded-md p-1 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                              style={{
                                color: "var(--admin-text-secondary)",
                              }}
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
                              onClick={() => onAddStock(item)}
                              className="flex cursor-pointer items-center gap-2 text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Plus className="h-4 w-4" />
                              Stock Control
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onViewHistory(item)}
                              className="flex cursor-pointer items-center gap-2 text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <History className="h-4 w-4" />
                              History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEditItem(item)}
                              className="flex cursor-pointer items-center gap-2 text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteRequest(item)}
                              className="flex cursor-pointer items-center gap-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="admin-table-td p-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Boxes className="h-12 w-12 opacity-30" />
                      <div>
                        <p className="font-bold">No inventory items found</p>
                        {searchTerm && (
                          <p className="text-xs opacity-60">Try adjusting your search terms</p>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

InventoryTable.propTypes = {
  items: PropTypes.array.isRequired,
  onAddStock: PropTypes.func.isRequired,
  onEditItem: PropTypes.func.isRequired,
  onDeleteRequest: PropTypes.func.isRequired,
  onViewHistory: PropTypes.func.isRequired,
};

export default InventoryTable;