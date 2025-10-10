import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import PropTypes from "prop-types";
import {
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  XCircle,
  AlertCircle,
  CircleCheck,
  CheckCircle2,
  Search,
  Boxes,
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
import { Input } from "@/components/ui/input";
import { useState } from "react";

const InventoryTable = ({ items, onAddStock, onEditItem, onDeleteRequest }) => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const filteredItems = items.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border-2 p-5 transition-all"
        style={{
          backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
          borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
        }}
      >
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
              Inventory List
            </p>
            <p className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
              {filteredItems.length} items found
            </p>
          </div>
          
          {/* Search */}
          <div className="w-full max-w-xs">
            <div className="relative">
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search items..."
                  className="w-full bg-transparent px-2 text-sm placeholder:text-slate-400 focus-visible:outline-none"
                  style={{
                    color: isDarkMode ? '#13151B' : '#0B2B26',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border-2"
             style={{
               borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
             }}>
          <table className="min-w-full text-left text-sm">
            <thead style={{
              backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
            }}>
              <tr>
                <th className="p-3 text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Name</th>
                <th className="p-3 text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Quantity</th>
                <th className="p-3 text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Price</th>
                <th className="p-3 text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Last Restock</th>
                <th className="p-3 text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Restock Qty</th>
                <th className="p-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => {
                  const id = item._id || item.id;
                  const quantity = item.quantity;
                  const unit = item.unit;
                  const low = item.lowStockThreshold ?? 0;
                  const adequate = item.adequateStockThreshold ?? 0;

                  let statusIcon = null;
                  let tooltipClass = "";

                  if (quantity === 0) {
                    tooltipClass = "border-red-500 text-red-600 dark:border-red-400 dark:text-red-400";
                    statusIcon = (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <XCircle className="ml-2 h-4 w-4 cursor-help text-red-500 dark:text-red-400" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className={tooltipClass}>
                          Out of Stock
                        </TooltipContent>
                      </Tooltip>
                    );
                  } else if (quantity <= low) {
                    tooltipClass = "border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400";
                    statusIcon = (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle className="ml-2 h-4 w-4 cursor-help text-orange-500 dark:text-orange-400" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className={tooltipClass}>
                          Low Stock
                        </TooltipContent>
                      </Tooltip>
                    );
                  } else if (quantity <= adequate) {
                    tooltipClass = "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400";
                    statusIcon = (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CircleCheck className="ml-2 h-4 w-4 cursor-help text-blue-500 dark:text-blue-400" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className={tooltipClass}>
                          Adequate Stock
                        </TooltipContent>
                      </Tooltip>
                    );
                  } else {
                    tooltipClass = "border-green-600 text-green-600 dark:border-green-400 dark:text-green-400";
                    statusIcon = (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CheckCircle2 className="ml-2 h-4 w-4 cursor-help text-green-600 dark:text-green-400" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className={tooltipClass}>
                          Stocked
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <motion.tr
                      key={id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-t transition-colors hover:opacity-90"
                      style={{
                        borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                        backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                      }}
                    >
                      <td className="p-3 font-medium" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                        {item.name}
                      </td>
                      <td className="flex items-center p-3" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                        {quantity} {unit}
                        {statusIcon}
                      </td>
                      <td className="p-3" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                        ₱{item.price?.toFixed(2) ?? "—"}
                      </td>
                      <td className="p-3 text-xs" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                        {item.lastRestock
                          ? new Date(item.lastRestock).toLocaleString()
                          : "—"}
                      </td>
                      <td className="p-3" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
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
                                backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                              }}
                            >
                              <MoreVertical className="h-4 w-4" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }} />
                            </motion.button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-36 border-2 transition-all"
                            style={{
                              backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                              borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                              color: isDarkMode ? "#13151B" : "#0B2B26",
                            }}
                          >
                            <DropdownMenuItem
                              onClick={() => onAddStock(item)}
                              className="flex cursor-pointer items-center gap-2 text-xs transition-colors hover:opacity-80"
                              style={{
                                color: isDarkMode ? '#13151B' : '#0B2B26',
                              }}
                            >
                              <Plus className="h-4 w-4" />
                              Add Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEditItem(item)}
                              className="flex cursor-pointer items-center gap-2 text-xs transition-colors hover:opacity-80"
                              style={{
                                color: isDarkMode ? '#13151B' : '#0B2B26',
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
                    colSpan={6}
                    className="p-8 text-center"
                    style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}
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