import { useState } from "react";
import CustomDateInput from "../MngTransaction/components/CustomDateInput";
import ExportCSV from "../MngTransaction/components/ExportCSV";

const MainPage = ({ transactions = [] }) => {
  const [selectedRange, setSelectedRange] = useState({ from: "", to: "" });

  const isInRange = (dateStr) => {
    const created = new Date(dateStr);
    const from = selectedRange?.from ? new Date(selectedRange.from) : null;
    const to = selectedRange?.to ? new Date(selectedRange.to) : null;
    return !from || !to || (created >= from && created <= to);
  };

  const filtered = transactions.filter((t) => isInRange(t.createdAt) && t.paymentStatus === "Paid");
  const totalSales = filtered.reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Sales & Reports</h1>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:w-auto">
          <CustomDateInput value={selectedRange} onChange={setSelectedRange} />
        </div>

        <div className="w-full sm:w-auto">
          <ExportCSV data={filtered} filename="sales_report.csv" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-md bg-slate-100 p-4 dark:bg-slate-800">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Sales</h3>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            ₱{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-md bg-slate-100 p-4 dark:bg-slate-800">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">Transactions</h3>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{filtered.length}</p>
        </div>
        <div className="rounded-md bg-slate-100 p-4 dark:bg-slate-800">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">Top Service</h3>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 italic">Coming soon</p>
        </div>
        <div className="rounded-md bg-slate-100 p-4 dark:bg-slate-800">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">Most Frequent Customer</h3>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 italic">Coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default MainPage;