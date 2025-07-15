import { useState } from "react";
import { statusColor } from "@/constants";

const SalesTable = ({ data }) => {
  const [sortColumn, setSortColumn] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const sortData = (col, dir) => {
    return [...data].sort((a, b) => {
      let valA = col === "date" ? new Date(a.createdAt) : a[col];
      let valB = col === "date" ? new Date(b.createdAt) : b[col];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return dir === "asc" ? -1 : 1;
      if (valA > valB) return dir === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (col) => {
    const direction = sortColumn === col && sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(col);
    setSortDirection(direction);
    setCurrentPage(1); // reset to first page on sort
  };

  const sorted = sortData(sortColumn, sortDirection);
  const totalPages = Math.ceil(sorted.length / pageSize);
  const start = Math.max((currentPage - 1) * pageSize, 0);
  const paged = sorted.slice(start, start + pageSize);

  return (
    <div className="mt-4">
      <div className="w-full overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              {[
                { key: "name", label: "Customer" },
                { key: "service", label: "Service" },
                { key: "loads", label: "Loads" },
                { key: "price", label: "Amount" },
                { key: "paymentStatus", label: "Status" },
                { key: "date", label: "Date" },
              ].map(({ key, label }) => {
                const isActive = sortColumn === key;
                const icon = isActive
                  ? sortDirection === "asc" ? "▲" : "▼"
                  : "⇅";
                return (
                  <th
                    key={key}
                    className="p-2 cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-100"
                    onClick={() => handleSort(key)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{label}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{icon}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paged.map((t) => (
              <tr key={t.id} className="border-b border-slate-200 dark:border-slate-700">
                <td className="p-2 text-slate-800 dark:text-slate-100">{t.name}</td>
                <td className="p-2 text-slate-600 dark:text-slate-300">{t.service}</td>
                <td className="p-2 text-slate-600 dark:text-slate-300">{t.loads}</td>
                <td className="p-2 text-slate-600 dark:text-slate-300">₱{t.price.toFixed(2)}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColor[t.paymentStatus] || ""}`}
                  >
                    {t.paymentStatus}
                  </span>
                </td>
                <td className="p-2 text-slate-500 dark:text-slate-400 text-xs">
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-2 flex justify-between items-center text-sm text-slate-600 dark:text-slate-300">
        <p>Page {currentPage} of {totalPages}</p>
        <div className="flex gap-2">
          {currentPage > 1 && (
            <button
              className="px-3 py-1 rounded border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              ← Prev
            </button>
          )}
          {currentPage < totalPages && (
            <button
              className="px-3 py-1 rounded border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesTable;