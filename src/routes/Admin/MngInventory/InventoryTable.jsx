import PropTypes from "prop-types";
import { MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const InventoryTable = ({ items, onAddStock, onEditItem, onDeleteRequest }) => {
  return (
    <div className="card">
      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <p className="card-title">Inventory List</p>
      </div>

      {/* Table */}
      <div className="mt-4 w-full overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
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
                const badge =
                  item.quantity === 0
                    ? {
                        text: "Out of Stock",
                        class: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
                      }
                    : item.quantity <= 10
                    ? {
                        text: "Low",
                        class: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
                      }
                    : item.quantity <= 20
                    ? {
                        text: "Adequate",
                        class: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
                      }
                    : null;

                return (
                  <tr
                    key={id}
                    className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/40"
                  >
                    <td className="p-2 text-slate-800 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="p-2 text-slate-600 dark:text-slate-300">
                      {item.quantity} {item.unit}
                      {badge && (
                        <span
                          className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.class}`}
                        >
                          {badge.text}
                        </span>
                      )}
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
                          <button className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-36 border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <DropdownMenuItem
                            onClick={() => onAddStock(item)}
                            className="flex items-center gap-2 text-xs cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                            Add Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEditItem(item)}
                            className="flex items-center gap-2 text-xs cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteRequest(item)}
                            className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 cursor-pointer"
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
  );
};

InventoryTable.propTypes = {
  items: PropTypes.array.isRequired,
  onAddStock: PropTypes.func.isRequired,
  onEditItem: PropTypes.func.isRequired,
  onDeleteRequest: PropTypes.func.isRequired,
};

export default InventoryTable;