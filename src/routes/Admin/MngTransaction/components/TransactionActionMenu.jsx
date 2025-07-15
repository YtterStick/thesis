import { Pencil, Trash2 } from "lucide-react";

const TransactionActionMenu = ({ onEdit, onDelete }) => {
  return (
    <div className="w-32 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-slate-700 dark:text-slate-200">
      <button
        onClick={() => {
          console.log("[ActionMenu] Edit clicked");
          onEdit?.();
        }}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <Pencil className="h-4 w-4" />
        Edit
      </button>
      <button
        onClick={() => {
          console.log("[ActionMenu] Delete clicked");
          onDelete?.();
        }}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  );
};

export default TransactionActionMenu;
