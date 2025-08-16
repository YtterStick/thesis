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
import { cn } from "@/utils/cn";

const InventoryTable = ({ items, onAddStock, onEditItem, onDeleteRequest }) => {
  const getRoleTextColor = (role) => {
    if (role === "admin") return "text-blue-600 dark:text-blue-300";
    if (role === "staff") return "text-orange-600 dark:text-orange-300";
    return "text-slate-800 dark:text-white";
  };

  return (
    <TooltipProvider>
      <div className="card">
        {/* Header */}
        <div className="card-header flex items-center justify-between">
          <p className="card-title">Inventory List</p>
        </div>

        {/* Table */}
        <div className="mt-4 w-full overflow-x-auto rounded-md border border-slate-300 dark:border-slate-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-200 text-xs uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Quantity</th>
                <th className="p-2">Price</th>
                <th className="p-2">Last Restock</th>
                <th className="p-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => {
                  const id = item._id || item.id;
                  const quantity = item.quantity;
                  const unit = item.unit;

                  let statusIcon = null;
                  let tooltipClass = "";

                  if (quantity === 0) {
                    tooltipClass =
                      "border-red-500 text-red-600 dark:border-red-400 dark:text-red-400";
                    statusIcon = (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <XCircle className="ml-2 h-4 w-4 text-red-500 dark:text-red-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className={tooltipClass}>
                          Out of Stock
                        </TooltipContent>
                      </Tooltip>
                    );
                  } else if (quantity <= 50) {
                    tooltipClass =
                      "border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400";
                    statusIcon = (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle className="ml-2 h-4 w-4 text-orange-500 dark:text-orange-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className={tooltipClass}>
                          Low Stock
                        </TooltipContent>
                      </Tooltip>
                    );
                  } else if (quantity <= 100) {
                    tooltipClass =
                      "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400";
                    statusIcon = (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CircleCheck className="ml-2 h-4 w-4 text-blue-500 dark:text-blue-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className={tooltipClass}>
                          Adequate Stock
                        </TooltipContent>
                      </Tooltip>
                    );
                  } else {
                    tooltipClass =
                      "border-green-600 text-green-600 dark:border-green-400 dark:text-green-400";
                    statusIcon = (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CheckCircle2 className="ml-2 h-4 w-4 text-green-600 dark:text-green-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className={tooltipClass}>
                          Stocked
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <tr
                      key={id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className={cn("p-2 font-medium", getRoleTextColor(item.role))}>
                        {item.name}
                      </td>
                      <td className="p-2 text-slate-600 dark:text-slate-300 flex items-center">
                        {quantity} {unit}
                        {statusIcon}
                      </td>
                      <td className="p-2 text-slate-600 dark:text-slate-300">
                        ₱{item.price?.toFixed(2) ?? "—"}
                      </td>
                      <td className="p-2 text-slate-500 dark:text-slate-400 text-xs">
                        {item.lastRestock
                          ? new Date(item.lastRestock).toLocaleString()
                          : "—"}
                      </td>
                      <td className="p-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-md p-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                              <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-36 border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <DropdownMenuItem
                              onClick={() => onAddStock(item)}
                              className="flex items-center gap-2 text-xs cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400"
                            >
                              <Plus className="h-4 w-4" />
                              Add Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEditItem(item)}
                              className="flex items-center gap-2 text-xs cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteRequest(item)}
                              className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 cursor-pointer hover:underline"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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