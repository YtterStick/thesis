import {
  PackageX,
  PhilippinePeso,
  Package,
  Clock8,
  LineChart,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { overviewData, recentSalesData } from "@/constants";
import {
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  Area,
  XAxis,
  YAxis,
} from "recharts";

export default function DashboardPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-5 px-6 pb-4 pt-4 overflow-visible">
      {/* 🧢 Section Header */}
      <div className="card-header flex items-center gap-2">
        <LineChart className="h-5 w-5 text-muted-foreground" />
        <p className="card-title">Dashboard</p>
      </div>

      {/* 📊 Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[
          {
            title: "Total Income",
            icon: <PhilippinePeso size={26} />,
            value: "₱25,154",
            color: "#3DD9B6",
          },
          {
            title: "Total Loads",
            icon: <Package size={26} />,
            value: "1,247",
            color: "#60A5FA",
          },
          {
            title: "Unwashed",
            icon: <Clock8 size={26} />,
            value: "42",
            color: "#FB923C",
          },
          {
            title: "Total Unclaimed",
            icon: <PackageX size={26} />,
            value: "71",
            color: "#F87171",
          },
        ].map(({ title, icon, value, color }) => (
          <div key={title} className="card">
            <div className="card-header flex items-center gap-x-3">
              <div
                className="w-fit rounded-lg p-2"
                style={{
                  backgroundColor: `${color}33`,
                  color: color,
                }}
              >
                {icon}
              </div>
              <p className="card-title">{title}</p>
            </div>
            <div className="card-body rounded-md bg-slate-100 p-4 transition-colors dark:bg-slate-950">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                {value}
              </p>
              <p className={`text-xs font-medium ${growthColor}`}>{growth}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 📈 Chart & Unclaimed List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Overview Chart */}
        <div className="card col-span-1 md:col-span-2 lg:col-span-4">
          <div className="card-header">
            <p className="card-title">Overview</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={overviewData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891B2" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0E7490" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  cursor={false}
                  formatter={(value) => `₱${value}`}
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                    border: "1px solid",
                    borderColor: theme === "dark" ? "#1e293b" : "#e2e8f0",
                    color: theme === "dark" ? "#f8fafc" : "#0f172a",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    borderRadius: "0.375rem",
                    padding: "0.5rem 0.75rem",
                  }}
                  itemStyle={{
                    color: "#0891B2",
                  }}
                />
                <XAxis
                  dataKey="name"
                  strokeWidth={0}
                  stroke={theme === "light" ? "#475569" : "#94a3b8"}
                  tickMargin={6}
                />
                <YAxis
                  dataKey="total"
                  strokeWidth={0}
                  stroke={theme === "light" ? "#475569" : "#94a3b8"}
                  tickFormatter={(value) => `₱${value}`}
                  tickMargin={6}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#0891B2"
                  fillOpacity={1}
                  fill="url(#colorLoad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Unpaid List */}
        <div className="card col-span-1 md:col-span-2 lg:col-span-3">
          <div className="card-header">
            <p className="card-title">Unclaimed List</p>
          </div>
          <div className="card-body h-[300px] overflow-auto p-0">
            {recentSalesData.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between gap-x-4 border-b border-slate-200 py-2 pr-2 last:border-none dark:border-slate-700"
              >
                <div className="flex flex-col gap-y-1">
                  <p className="font-medium text-slate-900 dark:text-slate-50">{sale.customer}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{sale.service}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{sale.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    ₱{sale.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}