import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/auth-context";
import { PackageX, PhilippinePeso, Package, Clock8, LineChart, AlertCircle, TrendingUp, Users } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { AreaChart, ResponsiveContainer, Tooltip, Area, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api-config";

const CACHE_DURATION = 4 * 60 * 60 * 1000;
const POLLING_INTERVAL = 30000; // Increased to 30 seconds

// Initialize cache properly
const initializeCache = () => {
    try {
        const stored = localStorage.getItem("dashboardCache");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Date.now() - parsed.timestamp < CACHE_DURATION) {
                console.log("📦 Initializing from stored cache");
                return parsed;
            } else {
                console.log("🗑️ Stored cache expired");
            }
        }
    } catch (error) {
        console.warn("Failed to load cache from storage:", error);
    }
    return null;
};

let dashboardCache = initializeCache();
let cacheTimestamp = dashboardCache?.timestamp || null;

const saveCacheToStorage = (data) => {
    try {
        localStorage.setItem(
            "dashboardCache",
            JSON.stringify({
                ...data,
                timestamp: Date.now(),
            }),
        );
    } catch (error) {
        console.warn("Failed to save cache to storage:", error);
    }
};

// Test if basic authentication works
const testBasicAuth = async () => {
    try {
        console.log("🔍 Testing /me endpoint...");
        const userInfo = await api.get("me");
        console.log("✅ /me endpoint successful:", userInfo);
        console.log("👤 Current user role:", userInfo.role);
        return userInfo;
    } catch (error) {
        console.error("❌ /me endpoint failed:", error);
        return null;
    }
};

export default function AdminDashboardPage() {
    const { theme } = useTheme();
    const { isAuthenticated, user, logout } = useAuth();

    // Calculate isDarkMode based on theme
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Check if user has admin role
    const isAdmin = user?.role === "ADMIN";

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
        };
    });

    const [initialLoad, setInitialLoad] = useState(!dashboardCache);
    const pollingIntervalRef = useRef(null);
    const isMountedRef = useRef(true);

    // Enhanced fetch function with better debugging
    const fetchFreshData = async () => {
        console.log("🔄 Fetching fresh dashboard data");

        if (!isAuthenticated || !isAdmin) {
            throw new Error("Authentication required or insufficient privileges");
        }

        try {
            // Test basic auth first
            const userInfo = await testBasicAuth();
            if (!userInfo) {
                throw new Error("Basic authentication failed");
            }

            console.log("🔐 User authenticated, proceeding to dashboard data...");

            const data = await api.get("api/dashboard/admin");

            const newDashboardData = {
                totalIncome: data.totalIncome || 0,
                totalLoads: data.totalLoads || 0,
                unwashedCount: data.unwashedCount || 0,
                totalUnclaimed: data.totalUnclaimed || 0,
                overviewData: data.overviewData || [],
                unclaimedList: data.unclaimedList || [],
            };

            const currentTime = Date.now();

            console.log("🔄 Dashboard data updated with fresh data");

            // Update cache
            dashboardCache = {
                data: newDashboardData,
                timestamp: currentTime,
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
                });
            }

            if (isMountedRef.current) {
                setInitialLoad(false);
            }
        } catch (error) {
            console.error("❌ Error in fetchFreshData:", error);

            // Handle specific error cases
            if (error.message.includes("403")) {
                console.log("🔍 403 Error Details - checking token info:");
                const token = localStorage.getItem("authToken");
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split(".")[1]));
                        console.log("Token payload:", payload);
                    } catch (e) {
                        console.error("Failed to decode token:", e);
                    }
                }
                throw new Error("Access forbidden. You may not have admin privileges.");
            } else if (error.message.includes("401")) {
                // Token might be invalid, trigger logout
                console.log("🔍 401 Error - Token may be invalid");
                logout();
                throw new Error("Authentication failed. Please log in again.");
            } else if (error.message.includes("Failed to fetch")) {
                throw new Error("Network error. Please check your connection.");
            } else {
                throw error;
            }
        }
    };

    const fetchDashboardData = useCallback(
        async (forceRefresh = false) => {
            // Don't fetch if component is unmounted or user is not authenticated/admin
            if (!isMountedRef.current || !isAuthenticated || !isAdmin) {
                return;
            }

            try {
                const now = Date.now();

                // Check cache first unless forced refresh
                if (!forceRefresh && dashboardCache && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
                    console.log("📦 Using cached dashboard data");

                    setDashboardData((prev) => ({
                        ...dashboardCache.data,
                        loading: false,
                        error: null,
                        lastUpdated: new Date(cacheTimestamp),
                        dataVersion: prev.dataVersion + 1,
                    }));

                    setInitialLoad(false);

                    // Fetch fresh data in background if cache is older than 30 seconds
                    if (now - cacheTimestamp > 30000) {
                        console.log("🔄 Fetching fresh data in background");
                        fetchFreshData();
                    }
                    return;
                }

                await fetchFreshData();
            } catch (error) {
                console.error("Error in fetchDashboardData:", error);
                if (!isMountedRef.current) return;

                // On error, keep cached data if available
                if (dashboardCache) {
                    console.log("⚠️ Fetch failed, falling back to cached data");
                    setDashboardData((prev) => ({
                        ...dashboardCache.data,
                        loading: false,
                        error: error.message,
                        lastUpdated: new Date(cacheTimestamp),
                        dataVersion: prev.dataVersion + 1,
                    }));
                } else {
                    setDashboardData((prev) => ({
                        ...prev,
                        loading: false,
                        error: error.message,
                    }));
                }
                setInitialLoad(false);
            }
        },
        [isAuthenticated, isAdmin, logout],
    );

    useEffect(() => {
        isMountedRef.current = true;

        // Add debug info to see what's happening
        console.log("🔐 Auth Status:", { isAuthenticated, user, isAdmin });

        // Only fetch data if user is authenticated and is admin
        if (isAuthenticated && isAdmin) {
            // Always show cached data immediately if available
            if (dashboardCache) {
                console.log("🚀 Showing cached data immediately");
                setDashboardData((prev) => ({
                    ...dashboardCache.data,
                    loading: false,
                    error: null,
                    lastUpdated: new Date(cacheTimestamp),
                    dataVersion: prev.dataVersion + 1,
                }));
                setInitialLoad(false);
            }

            // Then fetch fresh data
            fetchDashboardData();

            // Set up polling with smart updates
            pollingIntervalRef.current = setInterval(() => {
                console.log("🔄 Auto-refreshing dashboard data...");
                fetchDashboardData(false);
            }, POLLING_INTERVAL);
        } else if (!isAuthenticated) {
            setDashboardData((prev) => ({
                ...prev,
                loading: false,
                error: "Please log in to access the dashboard",
            }));
            setInitialLoad(false);
        } else if (!isAdmin) {
            setDashboardData((prev) => ({
                ...prev,
                loading: false,
                error: "Insufficient privileges. Admin access required.",
            }));
            setInitialLoad(false);
        }

        return () => {
            isMountedRef.current = false;
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [fetchDashboardData, isAuthenticated, isAdmin]);

    const formatCurrency = (amount) => {
        return `₱${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
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
            <div className="mb-4 flex items-center gap-x-3">
                <div
                    className="w-fit animate-pulse rounded-lg p-2"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                    }}
                >
                    <div className="h-6 w-6"></div>
                </div>
                <div
                    className="h-5 w-28 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                    }}
                ></div>
            </div>
            <div
                className="animate-pulse rounded-lg p-3"
                style={{
                    backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                }}
            >
                <div
                    className="h-8 w-32 rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                    }}
                ></div>
            </div>
        </motion.div>
    );

    const SkeletonChart = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 rounded-xl border-2 p-5 transition-all md:col-span-2 lg:col-span-4"
            style={{
                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
            }}
        >
            <div className="mb-5">
                <div
                    className="mb-2 h-6 w-44 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                    }}
                ></div>
                <div
                    className="h-4 w-36 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                    }}
                ></div>
            </div>
            <div
                className="h-[280px] w-full animate-pulse rounded-lg"
                style={{
                    backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                }}
            ></div>
        </motion.div>
    );

    const SkeletonUnclaimedList = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 rounded-xl border-2 p-5 transition-all md:col-span-2 lg:col-span-3"
            style={{
                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
            }}
        >
            <div className="mb-5">
                <div
                    className="mb-2 h-6 w-36 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                    }}
                ></div>
                <div
                    className="h-4 w-44 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                    }}
                ></div>
            </div>
            <div className="flex h-[280px] flex-col space-y-3 overflow-auto px-2 py-2">
                {[1, 2, 3, 4, 5].map((item) => (
                    <div
                        key={item}
                        className="flex items-center justify-between border-b py-3 last:border-none"
                        style={{ borderColor: isDarkMode ? "#2A524C" : "#E0EAE8" }}
                    >
                        <div className="space-y-2">
                            <div
                                className="h-4 w-36 animate-pulse rounded"
                                style={{
                                    backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                                }}
                            ></div>
                            <div
                                className="h-3 w-44 animate-pulse rounded"
                                style={{
                                    backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                                }}
                            ></div>
                            <div
                                className="h-3 w-28 animate-pulse rounded"
                                style={{
                                    backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                                }}
                            ></div>
                        </div>
                        <div
                            className="h-5 w-20 animate-pulse rounded"
                            style={{
                                backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                            }}
                        ></div>
                    </div>
                ))}
            </div>
        </motion.div>
    );

    // Show access denied message if user is not admin
    if (isAuthenticated && !isAdmin) {
        return (
            <div className="space-y-5 overflow-visible px-6 pb-5 pt-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-3"
                >
                    <LineChart
                        size={22}
                        style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}
                    />
                    <p
                        className="text-xl font-bold"
                        style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}
                    >
                        Access Denied
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-52 items-center justify-center rounded-xl border-2 p-6"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                >
                    <div className="text-center">
                        <AlertCircle
                            className="mx-auto mb-3 h-14 w-14"
                            style={{ color: "#F87171" }}
                        />
                        <p
                            className="mb-1 text-base font-semibold"
                            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                        >
                            Insufficient Privileges
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: isDarkMode ? "#6B7280" : "#0B2B26" }}
                        >
                            You need admin privileges to access this dashboard.
                        </p>
                        <p
                            className="mt-2 text-sm"
                            style={{ color: isDarkMode ? "#6B7280" : "#0B2B26" }}
                        >
                            Current role: {user?.role}
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Show skeleton loader only during initial load AND when no cached data is available
    if (initialLoad && !dashboardCache) {
        return (
            <div className="space-y-5 overflow-visible px-6 pb-5 pt-4">
                {/* Header Skeleton */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-3"
                >
                    <div
                        className="h-8 w-8 animate-pulse rounded-lg"
                        style={{
                            backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                        }}
                    ></div>
                    <div
                        className="h-8 w-44 animate-pulse rounded-lg"
                        style={{
                            backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                        }}
                    ></div>
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
            <div className="space-y-5 overflow-visible px-6 pb-5 pt-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-3"
                >
                    <LineChart
                        size={22}
                        style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}
                    />
                    <p
                        className="text-xl font-bold"
                        style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}
                    >
                        Admin Dashboard
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-52 items-center justify-center rounded-xl border-2 p-6"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                >
                    <div className="text-center">
                        <AlertCircle
                            className="mx-auto mb-3 h-14 w-14"
                            style={{ color: "#F87171" }}
                        />
                        <p
                            className="mb-1 text-base font-semibold"
                            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                        >
                            Failed to load dashboard data
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: isDarkMode ? "#6B7280" : "#0B2B26" }}
                        >
                            {dashboardData.error || "Auto-retrying in 30 seconds..."}
                        </p>
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
        <div className="space-y-5 overflow-visible px-6 pb-5 pt-4">
            {/* 🧢 Section Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex items-center gap-3"
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
                    <p
                        className="text-xl font-bold"
                        style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}
                    >
                        Admin Dashboard
                    </p>
                    <p
                        className="text-sm"
                        style={{ color: isDarkMode ? "#F3EDE3/70" : "#0B2B26/70" }}
                    >
                        Real-time business overview and analytics
                        {dashboardData.lastUpdated && <span> • Last updated: {dashboardData.lastUpdated.toLocaleTimeString()}</span>}
                    </p>
                </div>
            </motion.div>

            {/* 📊 Summary Cards */}
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
                            transition: { duration: 0.2 },
                        }}
                        className="cursor-pointer rounded-xl border-2 p-5 transition-all"
                        style={{
                            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        }}
                    >
                        <div className="mb-4 flex items-center justify-between">
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
                                <p
                                    className="text-2xl font-bold"
                                    style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                >
                                    {value}
                                </p>
                            </motion.div>
                        </div>

                        <div>
                            <h3
                                className="mb-2 text-lg font-semibold"
                                style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                            >
                                {title}
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/80" }}
                            >
                                {description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 📈 Chart & Unclaimed List */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-7">
                {/* Chart Card */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.01 }}
                    className="col-span-1 rounded-xl border-2 p-5 transition-all md:col-span-2 lg:col-span-4"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                >
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p
                                className="mb-1 text-lg font-bold"
                                style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                            >
                                Revenue Overview
                            </p>
                            <span
                                className="text-sm"
                                style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}
                            >
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
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <AreaChart
                                data={displayData.overviewData}
                                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                            >
                                <defs>
                                    <linearGradient
                                        id="colorLoad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#0891B2"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#0E7490"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    cursor={false}
                                    formatter={(value) => [
                                        `₱${Number(value)
                                            .toFixed(2)
                                            .replace(/\d(?=(\d{3})+\.)/g, "$&,")}`,
                                        "Revenue",
                                    ]}
                                    contentStyle={{
                                        backgroundColor: isDarkMode ? "#0B2B26" : "#FFFFFF",
                                        border: `2px solid ${isDarkMode ? "#1C3F3A" : "#0B2B26"}`,
                                        color: isDarkMode ? "#F3EDE3" : "#0B2B26",
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
                                    stroke={isDarkMode ? "#6B7280" : "#0B2B26"}
                                    tickMargin={6}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    dataKey="total"
                                    strokeWidth={0}
                                    stroke={isDarkMode ? "#6B7280" : "#0B2B26"}
                                    tickFormatter={(value) => `₱${value > 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
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
                    className="col-span-1 rounded-xl border-2 p-5 transition-all md:col-span-2 lg:col-span-3"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                >
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p
                                className="mb-1 text-lg font-bold"
                                style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                            >
                                Unclaimed Laundry
                            </p>
                            <span
                                className="text-sm"
                                style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}
                            >
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
                                className="flex h-full flex-col items-center justify-center py-8 text-center"
                            >
                                <PackageX
                                    size={36}
                                    style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/50" }}
                                    className="mb-3"
                                />
                                <p
                                    className="mb-1 text-base font-semibold"
                                    style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                >
                                    No Unclaimed Loads
                                </p>
                                <p
                                    className="text-sm"
                                    style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}
                                >
                                    All laundry has been picked up
                                </p>
                            </motion.div>
                        ) : (
                            <div className="space-y-3">
                                {displayData.unclaimedList.map((transaction, index) => (
                                    <motion.div
                                        key={transaction.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{
                                            scale: 1.02,
                                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                            transition: { duration: 0.2 },
                                        }}
                                        className="cursor-pointer rounded-lg border p-3 transition-all"
                                        style={{
                                            borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                                            backgroundColor: isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(243, 237, 227, 0.9)",
                                        }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p
                                                    className="mb-1 text-sm font-semibold"
                                                    style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                                >
                                                    {transaction.customerName}
                                                </p>
                                                <p
                                                    className="mb-1 text-sm"
                                                    style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/80" }}
                                                >
                                                    {transaction.serviceType} • {transaction.loadCount || 0} loads
                                                </p>
                                                <p
                                                    className="text-xs"
                                                    style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/60" }}
                                                >
                                                    {transaction.date}
                                                </p>
                                            </div>
                                            <motion.span
                                                whileHover={{ scale: 1.05 }}
                                                className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold"
                                                style={{
                                                    backgroundColor: "#FB923C20",
                                                    color: "#FB923C",
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
}
