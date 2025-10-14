import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import {
  PackageX,
  PhilippinePeso,
  Package,
  Clock8,
  LineChart,
  AlertCircle,
  TrendingUp,
  Users,
  RefreshCw,
  Database
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { api, getApiUrl } from "@/lib/api-config";

// Cache configuration
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
const POLLING_INTERVAL = 30000; // 30 seconds
const BACKGROUND_REFRESH_INTERVAL = 60000; // 1 minute

// Initialize cache from localStorage
const initializeCache = () => {
  try {
    const stored = localStorage.getItem('dashboardCache');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        console.log("📦 Initializing from stored cache");
        return parsed;
      } else {
        console.log("🗑️ Stored cache expired");
        localStorage.removeItem('dashboardCache');
      }
    }
  } catch (error) {
    console.warn('Failed to load cache from storage:', error);
    localStorage.removeItem('dashboardCache');
  }
  return null;
};

// Global cache instance
let dashboardCache = initializeCache();
let cacheTimestamp = dashboardCache?.timestamp || null;

// Save cache to localStorage
const saveCacheToStorage = (data) => {
  try {
    localStorage.setItem('dashboardCache', JSON.stringify({
      ...data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to save cache to storage:', error);
  }
};

// Clear cache
export const clearDashboardCache = () => {
  dashboardCache = null;
  cacheTimestamp = null;
  localStorage.removeItem('dashboardCache');
  console.log('🧹 Dashboard cache cleared');
};

export default function AdminDashboardPage() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Initialize state with cached data if available
  const [dashboardData, setDashboardData] = useState(() => {
    if (dashboardCache && dashboardCache.data) {
      console.log("🎯 Initializing state with cached data");
      return {
        ...dashboardCache.data,
        loading: false,
        error: null,
        lastUpdated: new Date(dashboardCache.timestamp),
        dataVersion: 0,
        isUsingCache: true
      };
    }
    
    return {
      totalIncome: 0,
      totalLoads: 0,
      unwashedCount: 0,
      totalUnclaimed: 0,
      overviewData: [],
      unclaimedList: [],
      loading: true,
      error: null,
      lastUpdated: null,
      dataVersion: 0,
      isUsingCache: false
    };
  });

  const [initialLoad, setInitialLoad] = useState(!dashboardCache);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingIntervalRef = useRef(null);
  const backgroundRefreshRef = useRef(null);
  const isMountedRef = useRef(true);

  // Check if data has changed
  const hasDataChanged = (newData, oldData) => {
    if (!oldData) return true;
    
    return (
      newData.totalIncome !== oldData.totalIncome ||
      newData.totalLoads !== oldData.totalLoads ||
      newData.unwashedCount !== oldData.unwashedCount ||
      newData.totalUnclaimed !== oldData.totalUnclaimed ||
      JSON.stringify(newData.overviewData) !== JSON.stringify(oldData.overviewData) ||
      JSON.stringify(newData.unclaimedList) !== JSON.stringify(oldData.unclaimedList)
    );
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (forceRefresh = false, showLoading = false) => {
    if (!isMountedRef.current) return;

    if (showLoading) {
      setIsRefreshing(true);
    }

    try {
      const now = Date.now();
      
      // Check cache first unless forced refresh
      if (!forceRefresh && dashboardCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log("📦 Using cached dashboard data");
        
        setDashboardData(prev => ({
          ...dashboardCache.data,
          loading: false,
          error: null,
          lastUpdated: new Date(cacheTimestamp),
          dataVersion: prev.dataVersion + 1,
          isUsingCache: true
        }));
        
        setInitialLoad(false);
        setIsRefreshing(false);
        
        // Refresh in background if cache is older than 30 seconds
        if (now - cacheTimestamp > 30000) {
          console.log("🔄 Fetching fresh data in background");
          fetchFreshData(false);
        }
        return;
      }

      await fetchFreshData(showLoading);
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      if (!isMountedRef.current) return;
      
      // On error, keep cached data if available
      if (dashboardCache) {
        console.log("⚠️ Fetch failed, falling back to cached data");
        setDashboardData(prev => ({
          ...dashboardCache.data,
          loading: false,
          error: error.message,
          lastUpdated: new Date(cacheTimestamp),
          dataVersion: prev.dataVersion + 1,
          isUsingCache: true
        }));
      } else {
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: error.message,
          isUsingCache: false
        }));
      }
      setInitialLoad(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch fresh data from API
  const fetchFreshData = async (showLoading = true) => {
    console.log("🔄 Fetching fresh dashboard data");
    
    try {
      const data = await api.get('dashboard/admin');
      
      const newDashboardData = {
        totalIncome: data.totalIncome || 0,
        totalLoads: data.totalLoads || 0,
        unwashedCount: data.unwashedCount || 0,
        totalUnclaimed: data.totalUnclaimed || 0,
        overviewData: data.overviewData || [],
        unclaimedList: data.unclaimedList || [],
      };

      const currentTime = Date.now();

      // Only update state and cache if data has actually changed
      if (!dashboardCache || hasDataChanged(newDashboardData, dashboardCache.data)) {
        console.log("🔄 Dashboard data updated with fresh data");
        
        // Update cache
        dashboardCache = {
          data: newDashboardData,
          timestamp: currentTime
        };
        cacheTimestamp = currentTime;
        
        // Persist to localStorage
        saveCacheToStorage(dashboardCache);
        
        if (isMountedRef.current) {
          setDashboardData({
            ...newDashboardData,
            loading: false,
            error: null,
            lastUpdated: new Date(),
            dataVersion: (dashboardData.dataVersion || 0) + 1,
            isUsingCache: false
          });
        }
      } else {
        console.log("✅ No changes in dashboard data, updating timestamp only");
        cacheTimestamp = currentTime;
        if (dashboardCache) {
          dashboardCache.timestamp = currentTime;
          saveCacheToStorage(dashboardCache);
        }
        
        if (isMountedRef.current) {
          setDashboardData(prev => ({
            ...prev,
            loading: false,
            error: null,
            lastUpdated: new Date(),
            isUsingCache: true
          }));
        }
      }

    } catch (error) {
      throw error;
    } finally {
      if (isMountedRef.current) {
        setInitialLoad(false);
        if (showLoading) {
          setIsRefreshing(false);
        }
      }
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    console.log("🎯 Manual refresh triggered");
    fetchDashboardData(true, true);
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    // Always show cached data immediately if available
    if (dashboardCache) {
      console.log("🚀 Showing cached data immediately");
      setDashboardData(prev => ({
        ...dashboardCache.data,
        loading: false,
        error: null,
        lastUpdated: new Date(cacheTimestamp),
        dataVersion: prev.dataVersion + 1,
        isUsingCache: true
      }));
      setInitialLoad(false);
    }
    
    // Then fetch fresh data
    fetchDashboardData(false, false);
    
    // Set up polling with smart updates
    pollingIntervalRef.current = setInterval(() => {
      console.log("🔄 Auto-refreshing dashboard data...");
      fetchDashboardData(false, false);
    }, POLLING_INTERVAL);

    // Set up background refresh (less frequent)
    backgroundRefreshRef.current = setInterval(() => {
      console.log("🔄 Background refresh...");
      fetchDashboardData(true, false);
    }, BACKGROUND_REFRESH_INTERVAL);
    
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (backgroundRefreshRef.current) {
        clearInterval(backgroundRefreshRef.current);
      }
    };
  }, [fetchDashboardData]);

  const formatCurrency = (amount) => {
    return `₱${typeof amount === 'number' ? amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') : '0.00'}`;
  };

  // Skeleton loader components
  const SkeletonCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 p-5 transition-all"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      }}
    >
      <div className="flex items-center gap-x-3 mb-4">
        <div className="w-fit rounded-lg p-2 animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}>
          <div className="h-6 w-6"></div>
        </div>
        <div className="h-5 w-28 rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
      <div className="rounded-lg p-3 animate-pulse"
           style={{
             backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3"
           }}>
        <div className="h-8 w-32 rounded"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
    </motion.div>
  );

  const SkeletonChart = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 p-5 col-span-1 md:col-span-2 lg:col-span-4 transition-all"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      }}
    >
      <div className="mb-5">
        <div className="h-6 w-44 rounded animate-pulse mb-2"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
        <div className="h-4 w-36 rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
      <div className="h-[280px] w-full rounded-lg animate-pulse"
           style={{
             backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3"
           }}></div>
    </motion.div>
  );

  const SkeletonUnclaimedList = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 p-5 col-span-1 md:col-span-2 lg:col-span-3 transition-all"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      }}
    >
      <div className="mb-5">
        <div className="h-6 w-36 rounded animate-pulse mb-2"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
        <div className="h-4 w-44 rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
      <div className="h-[280px] overflow-auto px-2 py-2 flex flex-col space-y-3">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="flex items-center justify-between border-b py-3 last:border-none"
            style={{ borderColor: isDarkMode ? "#2A524C" : "#E0EAE8" }}
          >
            <div className="space-y-2">
              <div className="h-4 w-36 rounded animate-pulse"
                   style={{
                     backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                   }}></div>
              <div className="h-3 w-44 rounded animate-pulse"
                   style={{
                     backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                   }}></div>
              <div className="h-3 w-28 rounded animate-pulse"
                   style={{
                     backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                   }}></div>
            </div>
            <div className="h-5 w-20 rounded animate-pulse"
                 style={{
                   backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                 }}></div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  // Show skeleton loader only during initial load AND when no cached data is available
  if (initialLoad && !dashboardCache) {
    return (
      <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg animate-pulse"
                 style={{
                   backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                 }}></div>
            <div className="h-8 w-44 rounded-lg animate-pulse"
                 style={{
                   backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                 }}></div>
          </div>
          <div className="h-9 w-24 rounded-lg animate-pulse"
               style={{
                 backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
               }}></div>
        </motion.div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Chart & Unclaimed List Skeleton */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-7">
          <SkeletonChart />
          <SkeletonUnclaimedList />
        </div>
      </div>
    );
  }

  // If we have cached data, show it immediately even if loading fresh data
  const displayData = dashboardCache ? dashboardCache.data : dashboardData;

  if (dashboardData.error && !dashboardCache) {
    return (
      <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <LineChart size={22} style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }} />
            <p className="text-xl font-bold" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
              Admin Dashboard
            </p>
          </div>
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
            style={{
              backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
              color: "#F3EDE3",
            }}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
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
            <p className="text-sm mb-3"
               style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}>
              {dashboardData.error}
            </p>
            <Button
              onClick={handleManualRefresh}
              className="flex items-center gap-2 mx-auto"
              style={{
                backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                color: "#F3EDE3",
              }}
            >
              <RefreshCw size={16} />
              Try Again
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Total Income",
      icon: <PhilippinePeso size={26} />,
      value: formatCurrency(displayData.totalIncome),
      color: "#3DD9B6",
      description: "Total revenue generated",
    },
    {
      title: "Total Loads",
      icon: <Package size={26} />,
      value: displayData.totalLoads.toLocaleString(),
      color: "#60A5FA",
      description: "Laundry loads processed",
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
      value: displayData.totalUnclaimed.toLocaleString(),
      color: "#F87171",
      description: "Not picked up",
    },
  ];

  return (
    <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-3">
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
              Admin Dashboard
            </p>
            <p className="text-sm" style={{ color: isDarkMode ? '#F3EDE3/70' : '#0B2B26/70' }}>
              Real-time business overview and analytics
              {dashboardData.lastUpdated && (
                <span className="ml-2">
                  • Updated {dashboardData.lastUpdated.toLocaleTimeString()}
                  {dashboardData.isUsingCache && " (Cached)"}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
            color: "#F3EDE3",
          }}
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </motion.button>
      </motion.div>

      {/* Cache Indicator */}
      {dashboardData.isUsingCache && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg border"
          style={{
            backgroundColor: isDarkMode ? "#2A524C20" : "#E0EAE8",
            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
          }}
        >
          <Database size={16} style={{ color: isDarkMode ? '#3DD9B6' : '#0B2B26' }} />
          <span className="text-sm" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
            Showing cached data • Auto-refreshing in background
          </span>
        </motion.div>
      )}

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
            className="rounded-xl border-2 p-5 transition-all cursor-pointer"
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
            
            <div>
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

      {/* Chart & Unclaimed List */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.01 }}
          className="rounded-xl border-2 p-5 col-span-1 md:col-span-2 lg:col-span-4 transition-all"
          style={{
            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-lg font-bold mb-1" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                Revenue Overview
              </p>
              <span className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                {new Date().getFullYear()} Monthly Revenue
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
              <TrendingUp size={18} />
            </motion.div>
          </div>
          
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={displayData.overviewData} 
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDarkMode ? '#2A524C' : '#E0EAE8'}
                  horizontal={true}
                  vertical={false}
                />
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891B2" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0E7490" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  cursor={{ stroke: isDarkMode ? '#2A524C' : '#E0EAE8', strokeWidth: 1 }}
                  formatter={(value) => [`₱${Number(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`, "Revenue"]}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#0B2B26' : '#FFFFFF',
                    border: `2px solid ${isDarkMode ? '#1C3F3A' : '#0B2B26'}`,
                    color: isDarkMode ? '#F3EDE3' : '#0B2B26',
                    fontSize: "0.8rem",
                    fontWeight: "500",
                    borderRadius: "0.5rem",
                    padding: "0.6rem",
                  }}
                  itemStyle={{
                    color: "#0891B2",
                  }}
                />
                <XAxis
                  dataKey="name"
                  strokeWidth={0}
                  stroke={isDarkMode ? '#6B7280' : '#0B2B26'}
                  tickMargin={6}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  dataKey="total"
                  strokeWidth={0}
                  stroke={isDarkMode ? '#6B7280' : '#0B2B26'}
                  tickFormatter={(value) => `₱${value > 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                  tickMargin={6}
                  tick={{ fontSize: 12 }}
                  width={50}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#0891B2"
                  fillOpacity={1}
                  fill="url(#colorLoad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Unclaimed List Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.01 }}
          className="rounded-xl border-2 p-5 col-span-1 md:col-span-2 lg:col-span-3 transition-all"
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
                {displayData.unclaimedList.length} unclaimed loads
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
              <Users size={18} />
            </motion.div>
          </div>
          
          <div className="h-[260px] overflow-auto px-2">
            {displayData.unclaimedList.length === 0 ? (
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
                  All laundry has been picked up
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {displayData.unclaimedList.map((transaction, index) => (
                  <motion.div
                    key={transaction.id || index}
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
                          {transaction.customerName || 'Unknown Customer'}
                        </p>
                        <p className="text-sm mb-1" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/80' }}>
                          {transaction.serviceType || 'Unknown Service'} • {transaction.loadCount || 0} loads
                        </p>
                        <p className="text-xs" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/60' }}>
                          {transaction.date || 'No date'}
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

      {/* Loading Overlay */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 flex items-center gap-3"
            >
              <RefreshCw size={24} className="animate-spin text-[#0B2B26]" />
              <p className="text-[#0B2B26] font-medium">Refreshing data...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Button component (if not already imported)
const Button = ({ children, onClick, disabled, className = '', ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    {...props}
  >
    {children}
  </button>
);