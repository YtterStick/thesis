import { useTheme } from "@/hooks/use-theme";
import {
  PackageX,
  PhilippinePeso,
  Package,
  Clock8,
  LineChart,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  Area,
  XAxis,
  YAxis,
} from "recharts";

export default function AdminDashboardPage() {
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState({
    totalIncome: 0,
    totalLoads: 0,
    unwashedCount: 0,
    totalUnclaimed: 0,
    overviewData: [],
    unclaimedList: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('http://localhost:8080/api/dashboard/admin', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      
      setDashboardData({
        totalIncome: data.totalIncome || 0,
        totalLoads: data.totalLoads || 0,
        unwashedCount: data.unwashedCount || 0,
        totalUnclaimed: data.totalUnclaimed || 0,
        overviewData: data.overviewData || [],
        unclaimedList: data.unclaimedList || [],
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const formatCurrency = (amount) => {
    // Format number with commas and two decimal places
    return `₱${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  // Skeleton loader components
  const SkeletonCard = () => (
    <div className="card">
      <div className="card-header flex items-center gap-x-3">
        <div className="w-fit rounded-lg p-2 bg-slate-300 dark:bg-slate-700 animate-pulse">
          <div className="h-6 w-6"></div>
        </div>
        <div className="h-5 w-24 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
      </div>
      <div className="card-body rounded-md bg-slate-100 p-4 dark:bg-slate-950">
        <div className="h-8 w-28 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
      </div>
    </div>
  );

  const SkeletonChart = () => (
    <div className="card col-span-1 md:col-span-2 lg:col-span-4">
      <div className="card-header">
        <div className="h-6 w-40 bg-slate-300 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-32 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
      </div>
      <div className="card-body">
        <div className="h-[285px] w-full bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
      </div>
    </div>
  );

  const SkeletonUnclaimedList = () => (
    <div className="card col-span-1 md:col-span-2 lg:col-span-3">
      <div className="card-header">
        <div className="h-6 w-32 bg-slate-300 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-40 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
      </div>
      <div className="card-body h-[310px] overflow-auto px-4 py-2 flex flex-col">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="flex items-center justify-between border-b border-slate-200 py-3 last:border-none dark:border-slate-700"
          >
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-3 w-40 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-3 w-24 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
            <div className="h-5 w-16 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (dashboardData.loading) {
    return (
      <div className="space-y-5 px-6 pb-4 pt-4 overflow-visible">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="card-header flex items-center gap-2">
            <div className="h-5 w-5 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="h-6 w-40 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Chart & Unclaimed List Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
          <SkeletonChart />
          <SkeletonUnclaimedList />
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="space-y-5 px-6 pb-4 pt-4 overflow-visible">
        <div className="card-header flex items-center gap-2">
          <LineChart className="h-5 w-5 text-muted-foreground" />
          <p className="card-title">Admin Dashboard</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Failed to load dashboard data</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Auto-retrying in 30 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Total Income",
      icon: <PhilippinePeso size={26} />,
      value: formatCurrency(dashboardData.totalIncome),
      color: "#3DD9B6",
    },
    {
      title: "Total Loads",
      icon: <Package size={26} />,
      value: dashboardData.totalLoads.toLocaleString(),
      color: "#60A5FA",
    },
    {
      title: "Unwashed",
      icon: <Clock8 size={26} />,
      value: dashboardData.unwashedCount.toLocaleString(),
      color: "#FB923C",
    },
    {
      title: "Total Unclaimed",
      icon: <PackageX size={26} />,
      value: dashboardData.totalUnclaimed.toLocaleString(),
      color: "#F87171",
    },
  ];

  return (
    <div className="space-y-5 px-6 pb-4 pt-4 overflow-visible">
      {/* 🧢 Section Header */}
      <div className="flex items-center justify-between">
        <div className="card-header flex items-center gap-2">
          <LineChart className="h-5 w-5 text-muted-foreground" />
          <p className="card-title">Admin Dashboard</p>
        </div>
      </div>

      {/* 📊 Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {summaryCards.map(({ title, icon, value, color }) => (
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
            <div className="card-body rounded-md bg-slate-100 p-4 dark:bg-slate-950">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 📈 Chart & Unclaimed List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="card col-span-1 md:col-span-2 lg:col-span-4">
          <div className="card-header">
            <p className="card-title">Yearly Revenue Overview</p>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {new Date().getFullYear()} Revenue by Month
            </span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart 
                data={dashboardData.overviewData} 
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891B2" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0E7490" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  cursor={false}
                  formatter={(value) => [`₱${Number(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`, "Revenue"]}
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
                  tick={{ fontSize: 16 }}
                />
                <YAxis
                  dataKey="total"
                  strokeWidth={0}
                  stroke={theme === "light" ? "#475569" : "#94a3b8"}
                  tickFormatter={(value) => `₱${value.toLocaleString()}`}
                  tickMargin={6}
                  tick={{ fontSize: 14 }}
                  width={60}
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

        {/* Unclaimed List */}
        <div className="card col-span-1 md:col-span-2 lg:col-span-3">
          <div className="card-header">
            <p className="card-title">Unclaimed</p>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {dashboardData.unclaimedList.length}  unclaimed laundry
            </span>
          </div>
          <div className="card-body h-[310px] overflow-auto px-4 py-2 flex flex-col">
            {dashboardData.unclaimedList.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No unclaimed completed loads</p>
            ) : (
              dashboardData.unclaimedList.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b border-slate-200 py-2 last:border-none dark:border-slate-700"
                >
                  <div className="leading-tight">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {transaction.customerName}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {transaction.serviceType} • {transaction.loadCount || 0} loads
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {transaction.date}
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                    Unclaimed
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}