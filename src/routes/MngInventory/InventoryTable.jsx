import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";

const MENU_HEIGHT = 110;

const InventoryTable = ({ items = [], onAddStock, onEditItem, onDeleteRequest }) => {
  const [openItem, setOpenItem] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRefs = useRef({});

  useEffect(() => {
    const handleClickOutside = (e) => {
      const menuEl = document.getElementById("global-dropdown");
      if (menuEl && !menuEl.contains(e.target)) {
        setOpenItem(null);
      }
    };
    if (openItem) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openItem]);

  const toggleMenu = (item) => {
    const button = triggerRefs.current[item.id];
    if (button) {
      const rect = button.getBoundingClientRect();
      setMenuPos({
        top: rect.top - MENU_HEIGHT - 4,
        left: rect.right - 144,
      });
      setOpenItem((prev) => (prev?.id === item.id ? null : item));
    }
  };

  const handleAction = (action) => {
    if (!openItem) return;
    if (action === "add") onAddStock(openItem);
    if (action === "edit") onEditItem(openItem);
    if (action === "delete") onDeleteRequest(openItem);
    setOpenItem(null);
  };

  return (
    <>
      <div className="relative overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Quantity</th>
              <th className="p-2">Last Restock</th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              let badge = null;
              if (item.quantity === 0) {
                badge = { text: "Out of Stock", class: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300" };
              } else if (item.quantity <= 10) {
                badge = { text: "Low", class: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300" };
              } else if (item.quantity <= 20) {
                badge = { text: "Adequate", class: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" };
              }

              return (
                <tr key={item.id} className="border-b border-slate-200 dark:border-slate-700">
                  <td className="p-2 text-slate-800 dark:text-slate-100">{item.name}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300">
                    {item.quantity} {item.unit}
                    {badge && (
                      <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.class}`}>
                        {badge.text}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-slate-500 dark:text-slate-400 text-xs">
                    {item.lastRestock ? new Date(item.lastRestock).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-2 text-right">
                    <button
                      ref={(el) => (triggerRefs.current[item.id] = el)}
                      onClick={() => toggleMenu(item)}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openItem && (
        <div
          id="global-dropdown"
          className="fixed z-50 w-36 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-slate-700 dark:text-slate-200"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <button
            onClick={() => handleAction("add")}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Add Stock
          </button>
          <button
            onClick={() => handleAction("edit")}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => handleAction("delete")}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </>
  );
};

InventoryTable.propTypes = {
  items: PropTypes.array.isRequired,
  onAddStock: PropTypes.func.isRequired,
  onEditItem: PropTypes.func.isRequired,
  onDeleteRequest: PropTypes.func.isRequired,
};

export default InventoryTable;