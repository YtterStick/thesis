import { useState } from "react";
import {
  CreditCard,
  Package,
  Clock8,
  PackageX,
  PhilippinePeso,
} from "lucide-react";
import { laundryServices } from "@/constants";
import ExportCSV from "@/constants/ExportCSV";
import CustomDateInput from "@/constants/CustomDateInput";

import SummaryCard from "./components/SummaryCard";
import IncomeBarChart from "./components/IncomeBarChart";
import ServicePieChart from "./components/ServicePieChart";
import SalesTable from "./components/SalesTable";

const sampleTransactions = Array.from({ length: 50 }, (_, i) => {
  const service = laundryServices[i % laundryServices.length];
  const paid = i % 3 !== 0;
  const loads = Math.floor(Math.random() * 4) + 1;

  return {
    id: i + 1,
    name: `Customer ${i + 1}`,
    service,
    price: loads * 80,
    paymentStatus: paid ? "Paid" : "Unpaid",
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    loads,
  };
});

const MainPage = () => {
  const [range, setRange] = useState({ from: "", to: "" });

  const isInRange = (dateStr) => {
    const date = new Date(dateStr);
    const from = range.from ? new Date(range.from) : null;
    const to = range.to ? new Date(range.to) : null;
    return (!from || date >= from) && (!to || date <= to);
  };

  const filtered = sampleTransactions.filter((t) => isInRange(t.createdAt));

  const totalIncome = filtered
    .filter((t) => t.paymentStatus === "Paid")
    .reduce((acc, t) => acc + t.price, 0);
  const totalLoads = filtered.reduce((acc, t) => acc + t.loads, 0);
  const pendingPickup = filtered.filter((t) => t.paymentStatus === "Unpaid").length;
  const unclaimed = filtered.length % 10;

  const serviceSummary = laundryServices.map((service) => ({
    name: service,
    value: filtered.filter((t) => t.service === service).length,
  }));

  const incomeByDate = filtered.reduce((acc, t) => {
    const date = new Date(t.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + t.price;
    return acc;
  }, {});
  const chartData = Object.entries(incomeByDate)
  .map(([date, total]) => ({ date, total }))
  .sort((a, b) => new Date(a.date) - new Date(b.date)); // 👈 ascending order

  return (
    <div className="flex flex-col gap-y-2">
      <h1 className="title">Sales Report</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Here’s a breakdown of income trends and pending transactions.
      </p>

      {/* ✅ Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SummaryCard
          label="Total Income"
          icon={<PhilippinePeso size={26} />}
          value={`₱${totalIncome.toFixed(2)}`}
          growth="+12% compared to last period"
        />
        <SummaryCard
          label="Total Loads"
          icon={<Package size={26} />}
          value={totalLoads}
          growth="+8% increase from previous week"
        />
        <SummaryCard
          label="Pending Pickup"
          icon={<Clock8 size={26} />}
          value={pendingPickup}
          growth="-4% decrease"
        />
        <SummaryCard
          label="Unclaimed"
          icon={<PackageX size={26} />}
          value={unclaimed}
          growth="-3% decrease"
        />
      </div>

      {/* 🗓️ Filters & Export */}
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <CustomDateInput value={range} onChange={setRange} />
        <ExportCSV data={filtered} filename="sales-report.csv" />
      </div>

      {/* 📊 Charts Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <IncomeBarChart data={chartData} />
        <ServicePieChart data={serviceSummary} />
      </div>

      {/* 📋 Table */}
      <SalesTable data={filtered} />
    </div>
  );
};

export default MainPage;