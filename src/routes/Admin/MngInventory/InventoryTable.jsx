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
      label: "Low Stock",
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
      label: "Adequate Stock",
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
    label: "Full Stock",
    color: "text-green-600",
    labelColor: "text-green-600",
    darkLabelColor: "text-green-400",
    bgColor: "bg-green-100",
    darkBgColor: "bg-green-900/30",
    borderColor: "border-green-200",
    darkBorderColor: "border-green-800",
  };
};

const InventoryTable = ({ items, onAddStock, onEditItem, onDeleteRequest }) => {
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
        <div className="overflow-x-auto rounded-lg border-2"
             style={{
               borderColor: isDarkMode ? "#334155" : "#cbd5e1",
             }}>
          <table className="min-w-full text-left text-sm">
            <thead style={{
              backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
            }}>
              <tr>
                <th className="p-3 text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Supply Item</th>
                <th className="p-3 text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Quantity</th>
                <th className="p-3 text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Status</th>
                <th className="p-3 text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Price</th>
                <th className="p-3 text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Last Restock</th>
                <th className="p-3 text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Restock Qty</th>
                <th className="p-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Action</th>
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
                      className="border-t transition-colors hover:opacity-90"
                      style={{
                        borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                        backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "#f8fafc",
                      }}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="rounded-lg p-2"
                            style={{
                              backgroundColor: isDarkMode
                                ? "rgba(51, 65, 85, 0.3)"
                                : "rgba(11, 43, 38, 0.1)",
                            }}
                          >
                            <Package
                              className="h-4 w-4"
                              style={{ color: isDarkMode ? "#3DD9B6" : "#0f172a" }}
                            />
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                              {item.name}
                            </p>
                            {item.category && (
                              <p className="text-xs" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                                {item.category}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                            {item.quantity}
                          </span>
                          <Badge
                            variant="outline"
                            className="rounded-lg border-2 capitalize"
                            style={{
                              borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                              color: isDarkMode ? "#f1f5f9" : "#0f172a",
                              backgroundColor: isDarkMode
                                ? "rgba(51, 65, 85, 0.3)"
                                : "rgba(243, 237, 227, 0.9)",
                            }}
                          >
                            {item.unit || "units"}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3">
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
                                <span className={isDarkMode ? status.darkLabelColor : status.labelColor}>
                                  {status.label}
                                </span>
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Current stock level: {item.quantity} {item.unit}
                              </p>
                              {item.lowStockThreshold && (
                                <p>Low stock threshold: {item.lowStockThreshold}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="p-3" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                        ₱{item.price?.toFixed(2) ?? "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                            {formatDate(item.lastRestock)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                        {item.lastRestockAmount != null ? `+${item.lastRestockAmount}` : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="rounded-md p-1 transition-colors hover:opacity-80"
                              style={{
                                backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                              }}
                            >
                              <MoreVertical className="h-4 w-4" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }} />
                            </motion.button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-36 border-2 transition-all"
                            style={{
                              backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                              borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                              color: isDarkMode ? "#f1f5f9" : "#0f172a",
                            }}
                          >
                            <DropdownMenuItem
                              onClick={() => onAddStock(item)}
                              className="flex cursor-pointer items-center gap-2 text-xs transition-colors hover:opacity-80"
                              style={{
                                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                              }}
                            >
                              <Plus className="h-4 w-4" />
                              Add Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEditItem(item)}
                              className="flex cursor-pointer items-center gap-2 text-xs transition-colors hover:opacity-80"
                              style={{
                                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                }}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteRequest(item)}
                              className="flex cursor-pointer items-center gap-2 text-xs transition-colors hover:opacity-80"
                              style={{
                                color: "#EF4444",
                              }}
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
                    className="p-8 text-center"
                    style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Boxes className="h-12 w-12 opacity-50" />
                      <div>
                        <p className="font-medium">No inventory items found</p>
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
      </motion.div>
    </TooltipProvider>
  );
};

InventoryTable.propTypes = {
  items: PropTypes.array.isRequired,
  onAddStock: PropTypes.func.isRequired,
  onEditItem: PropTypes.func.isRequired,
  onDeleteRequest: PropTypes.func.isRequired,
};

export default InventoryTable;