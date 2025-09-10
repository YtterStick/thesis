import { useTheme } from "@/hooks/use-theme";
import {
  PackageX,
  PhilippinePeso,
  Package,
  Clock8,
  Timer,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const StaffDashboardPage = () => {
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState({
    todayIncome: 0,
    todayLoads: 0,
    unwashedCount: 0,
    unclaimedCount: 0,
    allMachines: [],
    completedUnclaimedTransactions: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  // State for real-time countdown
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('http://localhost:8080/api/dashboard/staff', {
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
        todayIncome: data.todayIncome || 0,
        todayLoads: data.todayLoads || 0,
        unwashedCount: data.unwashedCount || 0,
        unclaimedCount: data.unclaimedCount || 0,
        allMachines: data.allMachines || [],
        completedUnclaimedTransactions: data.completedUnclaimedTransactions || [],
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
    
    // Set up polling every 15 seconds for data refresh
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const formatCurrency = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  // Real-time remaining time calculation - FIXED (no buffer)
  const getRemainingTime = (endTime) => {
    if (!endTime) return null;
    
    try {
      const end = new Date(endTime);
      const remainingMs = end.getTime() - currentTime.getTime();
      
      if (remainingMs <= 0) return "Done";
      
      const remainingMinutes = Math.floor(remainingMs / 60000);
      const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
      
      if (remainingMinutes > 0) {
        return `${remainingMinutes}m ${remainingSeconds}s`;
      }
      return `${remainingSeconds}s`;
    } catch (error) {
      console.error('Error calculating remaining time:', error);
      return "In Use";
    }
  };

  const getMachineStatus = (machine) => {
    // Always show timer if machine is in use, even if endTime is near
    if (machine.status === "In Use") {
      if (machine.endTime) {
        const remaining = getRemainingTime(machine.endTime);
        return remaining || "In Use";
      }
      return "In Use";
    }
    return machine.status || "Available";
  };

  const getStatusColor = (status) => {
    if (status.includes("m") || status.includes("s")) return "text-blue-600 dark:text-blue-400";
    if (status === "In Use") return "text-orange-600 dark:text-orange-400";
    if (status === "Available") return "text-green-600 dark:text-green-400";
    if (status === "Maintenance") return "text-red-600 dark:text-red-400";
    if (status === "Done") return "text-purple-600 dark:text-purple-400";
    return "text-slate-600 dark:text-slate-400";
  };

  if (dashboardData.loading) {
    return (
      <div className="flex flex-col gap-y-4">
        <h1 className="title">Staff Dashboard</h1>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
            Loading live data...
          </div>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="flex flex-col gap-y-4">
        <h1 className="title">Staff Dashboard</h1>
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
      title: "Today's Income",
      icon: <PhilippinePeso size={26} />,
      value: formatCurrency(dashboardData.todayIncome),
      growth: "+5% vs yesterday",
      color: "#3DD9B6",
      growthColor: "text-emerald-700 dark:text-[#28b99a]",
    },
    {
      title: "Today's Loads",
      icon: <Package size={26} />,
      value: dashboardData.todayLoads.toString(),
      growth: "+3% vs yesterday",
      color: "#60A5FA",
      growthColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Unwashed",
      icon: <Clock8 size={26} />,
      value: dashboardData.unwashedCount.toString(),
      growth: "-2%",
      color: "#FB923C",
      growthColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Unclaimed",
      icon: <PackageX size={26} />,
      value: dashboardData.completedUnclaimedTransactions.length.toString(),
      growth: "-1%",
      color: "#F87171",
      growthColor: "text-red-600 dark:text-red-400",
    },
  ];

  // Group machines by type
  const washers = dashboardData.allMachines.filter(machine => 
    machine && machine.type && machine.type.toUpperCase() === 'WASHER'
  );
  
  const dryers = dashboardData.allMachines.filter(machine => 
    machine && machine.type && machine.type.toUpperCase() === 'DRYER'
  );

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <h1 className="title">Staff Dashboard</h1>
        {dashboardData.lastUpdated && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Live • Updated: {dashboardData.lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {summaryCards.map(({ title, icon, value, growth, color, growthColor }) => (
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
              <p className={`text-xs font-medium ${growthColor}`}>{growth}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Machine Status + Unclaimed Transactions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* All Machines */}
        <div className="card col-span-1 md:col-span-2 lg:col-span-4">
          <div className="card-header">
            <p className="card-title">All Machines Status</p>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {dashboardData.allMachines.length} machines • Live tracking
            </span>
          </div>
          <div className="card-body h-[360px] overflow-auto px-4 py-2 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Washers */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Washers ({washers.length})
                </p>
                {washers.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500">No washers found</p>
                ) : (
                  washers.map((machine) => {
                    const status = getMachineStatus(machine);
                    return (
                      <div
                        key={machine.id}
                        className="flex items-center justify-between border-b border-slate-200 py-2 last:border-none dark:border-slate-700"
                      >
                        <div className="flex items-center gap-x-2 leading-tight">
                          <Timer size={20} className="text-blue-500 dark:text-blue-400" />
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                            {machine.name || 'Unnamed Washer'}
                          </p>
                        </div>
                        <p className={`text-sm font-medium ${getStatusColor(status)}`}>
                          {status}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dryers */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Dryers ({dryers.length})
                </p>
                {dryers.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500">No dryers found</p>
                ) : (
                  dryers.map((machine) => {
                    const status = getMachineStatus(machine);
                    return (
                      <div
                        key={machine.id}
                        className="flex items-center justify-between border-b border-slate-200 py-2 last:border-none dark:border-slate-700"
                      >
                        <div className="flex items-center gap-x-2 leading-tight">
                          <Timer size={20} className="text-orange-500 dark:text-orange-400" />
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                            {machine.name || 'Unnamed Dryer'}
                          </p>
                        </div>
                        <p className={`text-sm font-medium ${getStatusColor(status)}`}>
                          {status}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Unclaimed Transactions */}
        <div className="card col-span-1 md:col-span-2 lg:col-span-3">
          <div className="card-header">
            <p className="card-title">Unclaimed</p>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {dashboardData.completedUnclaimedTransactions.length} completed loads
            </span>
          </div>
          <div className="card-body h-[360px] overflow-auto px-4 py-2 flex flex-col">
            {dashboardData.completedUnclaimedTransactions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No unclaimed completed loads</p>
            ) : (
              dashboardData.completedUnclaimedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b border-slate-200 py-2 last:border-none dark:border-slate-700"
                >
                  <div className="leading-tight">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {transaction.customerName}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {transaction.serviceType} • {transaction.loadAssignments?.length || 0} loads
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
};

export default StaffDashboardPage;