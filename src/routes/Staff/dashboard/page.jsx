import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { PackageX, PhilippinePeso, Package, Clock8, Timer, AlertCircle, LineChart } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api-config"; // Import the api utility

const CACHE_DURATION = 4 * 60 * 60 * 1000;
const POLLING_INTERVAL = 15000;

const initializeCache = () => {
  try {
    const stored = localStorage.getItem('staffDashboardCache');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        console.log("📦 Initializing staff dashboard from stored cache");
        return parsed;
      } else {
        console.log("🗑️ Stored staff cache expired");
      }
    }
  } catch (error) {
    console.warn('Failed to load staff cache from storage:', error);
  }
  return null;
};

let staffDashboardCache = initializeCache();
let cacheTimestamp = staffDashboardCache?.timestamp || null;

const saveCacheToStorage = (data) => {
  try {
    localStorage.setItem('staffDashboardCache', JSON.stringify({
      ...data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to save staff cache to storage:', error);
  }
};

const StaffDashboardPage = () => {
  const { theme } = useTheme();
  
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [dashboardData, setDashboardData] = useState(() => {
    if (staffDashboardCache && staffDashboardCache.data) {
      console.log("🎯 Initializing staff state with cached data");
      return {
        ...staffDashboardCache.data,
        loading: false,
        error: null,
        lastUpdated: new Date(staffDashboardCache.timestamp),
        dataVersion: 0
      };
    }
    
    return {
      todayIncome: 0,
      todayLoads: 0,
      unwashedCount: 0,
      unclaimedCount: 0,
      allMachines: [],
      completedUnclaimedTransactions: [],
      loading: true,
      error: null,
      lastUpdated: null,
      dataVersion: 0
    };
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [initialLoad, setInitialLoad] = useState(!staffDashboardCache);
  const pollingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const hasDataChanged = (newData, oldData) => {
    if (!oldData) return true;
    
    return (
      newData.todayIncome !== oldData.todayIncome ||
      newData.todayLoads !== oldData.todayLoads ||
      newData.unwashedCount !== oldData.unwashedCount ||
      newData.unclaimedCount !== oldData.unclaimedCount ||
      JSON.stringify(newData.allMachines) !== JSON.stringify(oldData.allMachines) ||
      JSON.stringify(newData.completedUnclaimedTransactions) !== JSON.stringify(oldData.completedUnclaimedTransactions)
    );
  };

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    try {
      const now = Date.now();
      
      if (!forceRefresh && staffDashboardCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log("📦 Using cached staff dashboard data");
        
        setDashboardData(prev => ({
          ...staffDashboardCache.data,
          loading: false,
          error: null,
          lastUpdated: new Date(cacheTimestamp),
          dataVersion: prev.dataVersion + 1
        }));
        
        setInitialLoad(false);
        
        if (now - cacheTimestamp > 30000) {
          console.log("🔄 Fetching fresh staff data in background");
          fetchFreshData();
        }
        return;
      }

      await fetchFreshData();
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      if (!isMountedRef.current) return;
      
      if (staffDashboardCache) {
        console.log("⚠️ Fetch failed, falling back to cached data");
        setDashboardData(prev => ({
          ...staffDashboardCache.data,
          loading: false,
          error: error.message,
          lastUpdated: new Date(cacheTimestamp),
          dataVersion: prev.dataVersion + 1
        }));
      } else {
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
      setInitialLoad(false);
    }
  }, []);

  const fetchFreshData = async () => {
    console.log("🔄 Fetching fresh staff dashboard data");
    
    if (isMountedRef.current) {
      setDashboardData(prev => ({ ...prev, loading: true }));
    }

    try {
      // Use the api utility instead of direct fetch
      const data = await api.get("api/dashboard/staff");
      
      const newDashboardData = {
        todayIncome: data.todayIncome || 0,
        todayLoads: data.todayLoads || 0,
        unwashedCount: data.unwashedCount || 0,
        unclaimedCount: data.unclaimedCount || 0,
        allMachines: data.allMachines || [],
        completedUnclaimedTransactions: data.completedUnclaimedTransactions || [],
      };

      const currentTime = Date.now();

      if (!staffDashboardCache || hasDataChanged(newDashboardData, staffDashboardCache.data)) {
        console.log("🔄 Staff dashboard data updated with fresh data");
        
        staffDashboardCache = {
          data: newDashboardData,
          timestamp: currentTime
        };
        cacheTimestamp = currentTime;
        
        saveCacheToStorage(staffDashboardCache);
        
        if (isMountedRef.current) {
          setDashboardData({
            ...newDashboardData,
            loading: false,
            error: null,
            lastUpdated: new Date(),
            dataVersion: (dashboardData.dataVersion || 0) + 1
          });
        }
      } else {
        console.log("✅ No changes in staff dashboard data, updating timestamp only");
        cacheTimestamp = currentTime;
        staffDashboardCache.timestamp = currentTime;
        saveCacheToStorage(staffDashboardCache);
        
        if (isMountedRef.current) {
          setDashboardData(prev => ({
            ...prev,
            loading: false,
            error: null,
            lastUpdated: new Date()
          }));
        }
      }

      if (isMountedRef.current) {
        setInitialLoad(false);
      }
    } catch (error) {
      console.error('Error fetching fresh staff data:', error);
      if (isMountedRef.current) {
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    if (staffDashboardCache) {
      console.log("🚀 Showing cached staff data immediately");
      setDashboardData(prev => ({
        ...staffDashboardCache.data,
        loading: false,
        error: null,
        lastUpdated: new Date(cacheTimestamp),
        dataVersion: prev.dataVersion + 1
      }));
      setInitialLoad(false);
    }
    
    fetchDashboardData();
    
    pollingIntervalRef.current = setInterval(() => {
      console.log("🔄 Auto-refreshing staff dashboard data...");
      fetchDashboardData(false);
    }, POLLING_INTERVAL);

    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      clearInterval(timeTimer);
    };
  }, [fetchDashboardData]);

  const formatCurrency = (amount) => {
    return `₱${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

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
      console.error("Error calculating remaining time:", error);
      return "In Use";
    }
  };

  const getMachineStatus = (machine) => {
    if (machine.status === "In Use" && machine.endTime) {
      const remaining = getRemainingTime(machine.endTime);
      if (remaining === "Done") {
        return "Done";
      }
      return remaining || "In Use";
    }
    return machine.status || "Available";
  };

  const getStatusColor = (status) => {
    if (status.includes("m") || status.includes("s")) return "#3B82F6";
    if (status === "In Use") return "#F59E0B";
    if (status === "Available") return "#10B981";
    if (status === "Maintenance") return "#EF4444";
    if (status === "Done") return "#8B5CF6";
    return isDarkMode ? "#9CA3AF" : "#6B7280";
  };

  const calculateMachineStats = () => {
    const machines = displayData.allMachines || [];
    const totalMachines = machines.length;
    
    const availableMachines = machines.filter(machine => {
      const status = getMachineStatus(machine);
      return status === "Available";
    }).length;
    
    const inUseMachines = machines.filter(machine => {
      const status = getMachineStatus(machine);
      return status !== "Available" && status !== "Maintenance";
    }).length;
    
    const maintenanceMachines = machines.filter(machine => {
      const status = getMachineStatus(machine);
      return status === "Maintenance";
    }).length;

    return {
      total: totalMachines,
      available: availableMachines,
      inUse: inUseMachines,
      maintenance: maintenanceMachines
    };
  };

  // Fixed Skeleton Components - Removed animations that cause movement
  const SkeletonCard = () => (
    <div
      className="rounded-xl border-2 p-5 transition-all h-[140px] flex flex-col"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      }}
    >
      <div className="flex items-center gap-x-3 mb-4">
        <div className="w-fit rounded-lg p-2"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}>
          <div className="h-6 w-6 rounded"></div>
        </div>
        <div className="h-5 w-28 rounded"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div className="rounded-lg p-3"
             style={{
               backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3"
             }}>
          <div className="h-8 w-32 rounded"
               style={{
                 backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
               }}></div>
        </div>
        <div className="h-4 w-40 rounded mt-2"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
    </div>
  );

  const SkeletonMachineList = () => (
    <div
      className="rounded-xl border-2 p-5 transition-all h-[380px] flex flex-col"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      }}
    >
      <div className="mb-5">
        <div className="h-6 w-44 rounded mb-2"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
        <div className="h-4 w-32 rounded"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          {/* Washers Column */}
          <div className="space-y-3 border-r border-slate-200 pr-4 dark:border-slate-700">
            <div className="h-5 w-24 rounded mb-2"
                 style={{
                   backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                 }}></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border"
                   style={{
                     borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                     backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                   }}>
                <div className="flex items-center gap-x-2">
                  <div className="w-5 h-5 rounded"
                       style={{
                         backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                       }}></div>
                  <div className="h-4 w-28 rounded"
                       style={{
                         backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                       }}></div>
                </div>
                <div className="h-4 w-12 rounded"
                     style={{
                       backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                     }}></div>
              </div>
            ))}
          </div>

          {/* Dryers Column */}
          <div className="space-y-3 pl-4">
            <div className="h-5 w-20 rounded mb-2"
                 style={{
                   backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                 }}></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border"
                   style={{
                     borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                     backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                   }}>
                <div className="flex items-center gap-x-2">
                  <div className="w-5 h-5 rounded"
                       style={{
                         backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                       }}></div>
                  <div className="h-4 w-28 rounded"
                       style={{
                         backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                       }}></div>
                </div>
                <div className="h-4 w-12 rounded"
                     style={{
                       backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                     }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const SkeletonUnclaimedList = () => (
    <div
      className="rounded-xl border-2 p-5 transition-all h-[380px] flex flex-col"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      }}
    >
      <div className="mb-5">
        <div className="h-6 w-36 rounded mb-2"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
        <div className="h-4 w-44 rounded"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border"
               style={{
                 borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                 backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
               }}>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-28 rounded"
                   style={{
                     backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                   }}></div>
              <div className="h-3 w-36 rounded"
                   style={{
                     backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                   }}></div>
            </div>
            <div className="h-6 w-16 rounded-full"
                 style={{
                   backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                 }}></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (initialLoad && !staffDashboardCache) {
    return (
      <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg"
               style={{
                 backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
               }}></div>
          <div className="h-8 w-44 rounded-lg"
               style={{
                 backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
               }}></div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Machine Status & Unclaimed List Skeleton */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-1 md:col-span-2 lg:col-span-4">
            <SkeletonMachineList />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <SkeletonUnclaimedList />
          </div>
        </div>
      </div>
    );
  }

  const displayData = staffDashboardCache ? staffDashboardCache.data : dashboardData;

  if (dashboardData.error && !staffDashboardCache) {
    return (
      <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <LineChart size={22} style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }} />
          <p className="text-xl font-bold" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
            Staff Dashboard
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center h-52 rounded-xl border-2 p-6"
          style={{
            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
          }}
        >
          <div className="text-center">
            <AlertCircle className="h-14 w-14 mx-auto mb-3" 
                         style={{ color: '#F87171' }} />
            <p className="text-base font-semibold mb-1"
               style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
              Failed to load dashboard data
            </p>
            <p className="text-sm"
               style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}>
              Auto-retrying in 30 seconds...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Today's Income",
      icon: <PhilippinePeso size={26} />,
      value: formatCurrency(displayData.todayIncome),
      color: "#3DD9B6",
      description: "Revenue generated today",
    },
    {
      title: "Today's Loads",
      icon: <Package size={26} />,
      value: displayData.todayLoads.toLocaleString(),
      color: "#60A5FA",
      description: "Loads processed today",
    },
    {
      title: "Unwashed",
      icon: <Clock8 size={26} />,
      value: displayData.unwashedCount.toLocaleString(),
      color: "#FB923C",
      description: "Waiting to be washed",
    },
    {
      title: "Unclaimed",
      icon: <PackageX size={26} />,
      value: displayData.completedUnclaimedTransactions.length.toLocaleString(),
      color: "#F87171",
      description: "Completed but not claimed",
    },
  ];

  const washers = displayData.allMachines.filter((machine) => machine && machine.type && machine.type.toUpperCase() === "WASHER");
  const dryers = displayData.allMachines.filter((machine) => machine && machine.type && machine.type.toUpperCase() === "DRYER");

  const machineStats = calculateMachineStats();

  return (
    <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-3"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="rounded-lg p-2"
          style={{
            backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
            color: isDarkMode ? "#F3EDE3" : "#F3EDE3",
          }}
        >
          <LineChart size={22} />
        </motion.div>
        <div>
          <p className="text-xl font-bold" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
            Staff Dashboard
          </p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {summaryCards.map(({ title, icon, value, color, description }, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ 
              scale: 1.03,
              y: -2,
              transition: { duration: 0.2 }
            }}
            className="rounded-xl border-2 p-5 transition-all cursor-pointer h-[140px] flex flex-col"
            style={{
              backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
              borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="rounded-lg p-2"
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                }}
              >
                {icon}
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.2 }}
                className="text-right"
              >
                <p className="text-2xl font-bold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                  {value}
                </p>
              </motion.div>
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                {title}
              </h3>
              <p className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/80' }}>
                {description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 🎰 Machine Status & Unclaimed Transactions */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-7">
        {/* All Machines Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.01 }}
          className="rounded-xl border-2 p-5 col-span-1 md:col-span-2 lg:col-span-4 transition-all h-[380px] flex flex-col"
          style={{
            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-bold mb-1" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                All Machines Status
              </p>
              {/* Machine Statistics Label */}
              <span className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                {machineStats.total} total • {machineStats.available} available • {machineStats.inUse} in use • {machineStats.maintenance} maintenance
              </span>
            </div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="rounded-lg p-2"
              style={{
                backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                color: isDarkMode ? "#F3EDE3" : "#F3EDE3",
              }}
            >
              <Timer size={18} />
            </motion.div>
          </div>
          
          <div className="flex-1 overflow-auto px-2">
            {displayData.allMachines.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center py-8"
              >
                <Timer size={36} style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/50' }} className="mb-3" />
                <p className="text-base font-semibold mb-1" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                  No Machines Found
                </p>
                <p className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                  No machines are currently registered
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Washers */}
                <div className="space-y-3 border-r border-slate-200 pr-4 dark:border-slate-700">
                  <p className="text-sm font-medium" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                    Washers ({washers.length})
                  </p>
                  {washers.length === 0 ? (
                    <p className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/50' }}>
                      No washers found
                    </p>
                  ) : (
                    washers.map((machine, index) => {
                      const status = getMachineStatus(machine);
                      const statusColor = getStatusColor(status);
                      return (
                        <motion.div
                          key={machine.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ 
                            scale: 1.02,
                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                            transition: { duration: 0.2 }
                          }}
                          className="flex items-center justify-between rounded-lg border p-3 transition-all cursor-pointer"
                          style={{
                            borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                            backgroundColor: isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(243, 237, 227, 0.9)",
                          }}
                        >
                          <div className="flex items-center gap-x-2 leading-tight">
                            <Timer
                              size={20}
                              style={{ color: '#3B82F6' }}
                            />
                            <p className="text-sm font-medium" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                              {machine.name || "Unnamed Washer"}
                            </p>
                          </div>
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className="text-sm font-medium whitespace-nowrap"
                            style={{ color: statusColor }}
                          >
                            {status}
                          </motion.span>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Dryers */}
                <div className="space-y-3 pl-4">
                  <p className="text-sm font-medium" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                    Dryers ({dryers.length})
                  </p>
                  {dryers.length === 0 ? (
                    <p className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/50' }}>
                      No dryers found
                    </p>
                  ) : (
                    dryers.map((machine, index) => {
                      const status = getMachineStatus(machine);
                      const statusColor = getStatusColor(status);
                      return (
                        <motion.div
                          key={machine.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ 
                            scale: 1.02,
                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                            transition: { duration: 0.2 }
                          }}
                          className="flex items-center justify-between rounded-lg border p-3 transition-all cursor-pointer"
                          style={{
                            borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                            backgroundColor: isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(243, 237, 227, 0.9)",
                          }}
                        >
                          <div className="flex items-center gap-x-2 leading-tight">
                            <Timer
                              size={20}
                              style={{ color: '#F59E0B' }}
                            />
                            <p className="text-sm font-medium" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                              {machine.name || "Unnamed Dryer"}
                            </p>
                          </div>
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className="text-sm font-medium whitespace-nowrap"
                            style={{ color: statusColor }}
                          >
                            {status}
                          </motion.span>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Unclaimed Transactions Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.01 }}
          className="rounded-xl border-2 p-5 col-span-1 md:col-span-2 lg:col-span-3 transition-all h-[380px] flex flex-col"
          style={{
            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-lg font-bold mb-1" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                Unclaimed Laundry
              </p>
              <span className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                {displayData.completedUnclaimedTransactions.length} completed but not claimed
              </span>
            </div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="rounded-lg p-2"
              style={{
                backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                color: isDarkMode ? "#F3EDE3" : "#F3EDE3",
              }}
            >
              <PackageX size={18} />
            </motion.div>
          </div>
          
          <div className="flex-1 overflow-auto px-2">
            {displayData.completedUnclaimedTransactions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center py-8"
              >
                <PackageX size={36} style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/50' }} className="mb-3" />
                <p className="text-base font-semibold mb-1" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                  No Unclaimed Loads
                </p>
                <p className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                  All completed laundry has been claimed
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {displayData.completedUnclaimedTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.02,
                      backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                      transition: { duration: 0.2 }
                    }}
                    className="rounded-lg border p-3 transition-all cursor-pointer"
                    style={{
                      borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                      backgroundColor: isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(243, 237, 227, 0.9)",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                          {transaction.customerName}
                        </p>
                        <p className="text-sm mb-1" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/80' }}>
                          {transaction.serviceType} • {transaction.loadAssignments?.length || 0} loads
                        </p>
                      </div>
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className="rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: '#FB923C20',
                          color: '#FB923C',
                        }}
                      >
                        Unclaimed
                      </motion.span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StaffDashboardPage;