import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/auth-context";
import { PackageX, PhilippinePeso, Package, Clock8, LineChart, AlertCircle, TrendingUp, Users } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { AreaChart, ResponsiveContainer, Tooltip, Area, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api-config";

const CACHE_DURATION = 4 * 60 * 60 * 1000;
const POLLING_INTERVAL = 10000;

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

const testBasicAuth = async () => {
    try {
        console.log('🔍 Testing /me endpoint...');
        const userInfo = await api.get('me');
        console.log('✅ /me endpoint successful:', userInfo);
        console.log('👤 Current user role:', userInfo.role);
        return userInfo;
    } catch (error) {
        console.error('❌ /me endpoint failed:', error);
        return null;
    }
};

const debugTokenInfo = () => {
    const token = localStorage.getItem("authToken");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            console.log("🔐 Token Debug Info:");
            console.log("   User:", payload.sub);
            console.log("   Role:", payload.role);
            console.log("   Expires:", new Date(payload.exp * 1000));
            console.log("   Issued:", new Date(payload.iat * 1000));
            console.log("   All claims:", payload);
        } catch (error) {
            console.error("❌ Failed to decode token:", error);
        }
    } else {
        console.log("❌ No token found in localStorage");
    }
};

// Calculate unclaimed loads the same way as AdminRecordTable
const calculateUnclaimedLoads = (records) => {
    const unclaimedRecords = records.filter((r) => 
        r.pickupStatus === "UNCLAIMED" && 
        r.laundryStatus === "Completed" &&
        !r.expired && 
        !r.disposed
    );
    
    const totalUnclaimed = unclaimedRecords.length;
    const unclaimedList = unclaimedRecords.map(record => ({
        id: record.id,
        customerName: record.name,
        serviceType: record.service,
        loadCount: record.loads,
        date: record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A',
        invoiceNumber: record.invoiceNumber
    }));

    return { totalUnclaimed, unclaimedList };
};

// Calculate unwashed loads (same as AdminRecordTable)
const calculateUnwashedLoads = (records) => {
    return records.reduce((acc, r) => acc + (r.unwashedLoadsCount || 0), 0);
};

// Calculate total income and loads
const calculateTotals = (records) => {
    const totalIncome = records.reduce((acc, r) => acc + (r.price || 0), 0);
    const totalLoads = records.reduce((acc, r) => acc + (r.loads || 0), 0);
    return { totalIncome, totalLoads };
};

export default function AdminDashboardPage() {
    const { theme } = useTheme();
    const { isAuthenticated, user, logout } = useAuth();

    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const isAdmin = user?.role === "ADMIN";

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
            pendingCount: 0,
            totalUnclaimed: 0,
            overviewData: [],
            todayTransactions: [],
            loading: true,
            error: null,
            lastUpdated: null,
            dataVersion: 0,
        };
    });

    const [initialLoad, setInitialLoad] = useState(!dashboardCache);
    const pollingIntervalRef = useRef(null);
    const isMountedRef = useRef(true);

    const hasDataChanged = (newData, oldData) => {
        if (!oldData) return true;

        return (
            newData.totalIncome !== oldData.totalIncome ||
            newData.totalLoads !== oldData.totalLoads ||
            newData.pendingCount !== oldData.pendingCount ||
            newData.totalUnclaimed !== oldData.totalUnclaimed ||
            JSON.stringify(newData.overviewData) !== JSON.stringify(oldData.overviewData) ||
            JSON.stringify(newData.todayTransactions) !== JSON.stringify(oldData.todayTransactions)
        );
    };

    const fetchDashboardData = useCallback(
        async (forceRefresh = false) => {
            if (!isMountedRef.current || !isAuthenticated || !isAdmin) {
                return;
            }

            try {
                const now = Date.now();

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
        [isAuthenticated, isAdmin],
    );

    const fetchFreshData = async () => {
        console.log("🔄 Fetching fresh dashboard data");

        if (!isAuthenticated || !isAdmin) {
            throw new Error("Authentication required or insufficient privileges");
        }

        try {
            const userInfo = await testBasicAuth();
            if (!userInfo) {
                throw new Error("Basic authentication failed");
            }

            console.log("🔐 User authenticated, proceeding to dashboard data...");

            // Fetch records from the same endpoint as AdminRecordTable
            const recordsData = await api.get("api/admin/records");
            console.log("📊 Raw records data:", recordsData);

            // Map the records to match AdminRecordTable structure
            const mappedRecords = recordsData.map((r) => ({
                id: r.id,
                invoiceNumber: r.invoiceNumber,
                name: r.customerName,
                service: r.serviceName,
                loads: r.loads || 0,
                detergent: r.detergent,
                fabric: r.fabric || "—",
                price: r.totalPrice || 0,
                paymentMethod: r.paymentMethod || "—",
                pickupStatus: r.pickupStatus,
                laundryStatus: r.laundryStatus,
                laundryProcessedBy: r.laundryProcessedBy || "—",
                claimProcessedBy: r.claimProcessedBy || "—",
                createdAt: r.createdAt,
                paid: r.paid || false,
                expired: r.expired,
                disposed: r.disposed || false,
                disposedBy: r.disposedBy || "—",
                gcashReference: r.gcashReference || "—",
                unwashedLoadsCount: r.unwashedLoadsCount || 0,
            }));

            // Calculate metrics using the same logic as AdminRecordTable
            const { totalIncome, totalLoads } = calculateTotals(mappedRecords);
            const unwashedCount = calculateUnwashedLoads(mappedRecords);
            const { totalUnclaimed, unclaimedList } = calculateUnclaimedLoads(mappedRecords);

            // Calculate today's transactions
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayTransactions = mappedRecords
                .filter(record => {
                    if (!record.createdAt) return false;
                    const recordDate = new Date(record.createdAt);
                    recordDate.setHours(0, 0, 0, 0);
                    return recordDate.getTime() === today.getTime();
                })
                // Sort by creation date - latest first
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const pendingCount = todayTransactions.filter(t => 
                t.laundryStatus !== "Completed" && t.pickupStatus !== "CLAIMED"
            ).length;

            console.log("📈 Calculated metrics:", {
                totalIncome,
                totalLoads,
                unwashedCount,
                totalUnclaimed,
                pendingCount,
                todayTransactionsCount: todayTransactions.length
            });

            // Get the chart data from your existing backend endpoint
            const dashboardApiData = await api.get("/api/dashboard/admin");
            console.log("📊 Chart data from backend:", dashboardApiData.overviewData);

            const newDashboardData = {
                totalIncome: totalIncome || 0,
                totalLoads: totalLoads || 0,
                pendingCount: pendingCount || 0,
                totalUnclaimed: totalUnclaimed || 0,
                todayTransactions: todayTransactions || [],
                overviewData: dashboardApiData.overviewData || [],
                unclaimedList: unclaimedList || [],
            };

            const currentTime = Date.now();

            if (!dashboardCache || hasDataChanged(newDashboardData, dashboardCache.data)) {
                console.log("🔄 Dashboard data updated with fresh data");

                dashboardCache = {
                    data: newDashboardData,
                    timestamp: currentTime,
                };
                cacheTimestamp = currentTime;

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
            } else {
                console.log("✅ No changes in dashboard data, updating timestamp only");
                cacheTimestamp = currentTime;
                dashboardCache.timestamp = currentTime;
                saveCacheToStorage(dashboardCache);

                if (isMountedRef.current) {
                    setDashboardData((prev) => ({
                        ...prev,
                        loading: false,
                        error: null,
                        lastUpdated: new Date(),
                    }));
                }
            }

            if (isMountedRef.current) {
                setInitialLoad(false);
            }
        } catch (error) {
            console.error("❌ Error in fetchFreshData:", error);

            if (error.message.includes("403")) {
                console.log("🔍 403 Error Details:");
                debugTokenInfo();
                throw new Error("Access forbidden. You may not have admin privileges. Check backend logs.");
            } else if (error.message.includes("401")) {
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

    useEffect(() => {
        isMountedRef.current = true;

        const runTests = async () => {
            debugTokenInfo();
            await testBasicAuth();
        };

        runTests();

        console.log("🔐 Auth Status:", { isAuthenticated, user, isAdmin });

        if (isAuthenticated && isAdmin) {
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

            fetchDashboardData();

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
    }, [fetchDashboardData, isAuthenticated, isAdmin, logout]);

    const formatCurrency = (amount) => {
        return `₱${(amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
    };

    const SkeletonCard = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border-2 p-5 transition-all"
            style={{
                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
            }}
        >
            <div className="mb-4 flex items-center gap-x-3">
                <div
                    className="w-fit animate-pulse rounded-lg p-2"
                    style={{
                        backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                    }}
                >
                    <div className="h-6 w-6"></div>
                </div>
                <div
                    className="h-5 w-28 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                    }}
                ></div>
            </div>
            <div
                className="animate-pulse rounded-lg p-3"
                style={{
                    backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                }}
            >
                <div
                    className="h-8 w-32 rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
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
                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
            }}
        >
            <div className="mb-5">
                <div
                    className="mb-2 h-6 w-44 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                    }}
                ></div>
                <div
                    className="h-4 w-36 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                    }}
                ></div>
            </div>
            <div
                className="h-[280px] w-full animate-pulse rounded-lg"
                style={{
                    backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                }}
            ></div>
        </motion.div>
    );

    const SkeletonTodayTransactions = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 rounded-xl border-2 p-5 transition-all md:col-span-2 lg:col-span-3"
            style={{
                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
            }}
        >
            <div className="mb-5">
                <div
                    className="mb-2 h-6 w-36 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                    }}
                ></div>
                <div
                    className="h-4 w-44 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                    }}
                ></div>
            </div>
            <div className="flex h-[280px] flex-col space-y-3 overflow-auto px-2 py-2">
                {[1, 2, 3, 4, 5].map((item) => (
                    <div
                        key={item}
                        className="flex items-center justify-between border-b py-3 last:border-none"
                        style={{ borderColor: isDarkMode ? "#334155" : "#e2e8f0" }}
                    >
                        <div className="space-y-2 flex-1">
                            <div className="flex justify-between">
                                <div
                                    className="h-4 w-24 animate-pulse rounded"
                                    style={{
                                        backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                                    }}
                                ></div>
                                <div
                                    className="h-4 w-16 animate-pulse rounded ml-4"
                                    style={{
                                        backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                                    }}
                                ></div>
                            </div>
                            <div
                                className="h-3 w-32 animate-pulse rounded"
                                style={{
                                    backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                                }}
                            ></div>
                            <div
                                className="h-3 w-40 animate-pulse rounded"
                                style={{
                                    backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                                }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );

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
                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                    />
                    <p
                        className="text-xl font-bold"
                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                    >
                        Access Denied
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-52 items-center justify-center rounded-xl border-2 p-6"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}
                >
                    <div className="text-center">
                        <AlertCircle
                            className="mx-auto mb-3 h-14 w-14"
                            style={{ color: "#F87171" }}
                        />
                        <p
                            className="mb-1 text-base font-semibold"
                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                        >
                            Insufficient Privileges
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                        >
                            You need admin privileges to access this dashboard.
                        </p>
                        <p
                            className="mt-2 text-sm"
                            style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                        >
                            Current role: {user?.role}
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

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
                            backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                        }}
                    ></div>
                    <div
                        className="h-8 w-44 animate-pulse rounded-lg"
                        style={{
                            backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
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

                {/* Chart & Today's Transactions Skeleton */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-7">
                    <SkeletonChart />
                    <SkeletonTodayTransactions />
                </div>
            </div>
        );
    }

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
                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                    />
                    <p
                        className="text-xl font-bold"
                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                    >
                        Admin Dashboard
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-52 items-center justify-center rounded-xl border-2 p-6"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}
                >
                    <div className="text-center">
                        <AlertCircle
                            className="mx-auto mb-3 h-14 w-14"
                            style={{ color: "#F87171" }}
                        />
                        <p
                            className="mb-1 text-base font-semibold"
                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                        >
                            Failed to load dashboard data
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
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
            value: formatCurrency(displayData.totalIncome || 0),
            color: "#3DD9B6",
            description: "Total revenue generated",
        },
        {
            title: "Total Loads",
            icon: <Package size={26} />,
            value: (displayData.totalLoads || 0).toLocaleString(),
            color: "#60A5FA",
            description: "Laundry loads processed",
        },
        {
            title: "Pending",
            icon: <Clock8 size={26} />,
            value: (displayData.pendingCount || 0).toLocaleString(),
            color: "#FB923C",
            description: "Today's pending laundry",
        },
        {
            title: "Unclaimed",
            icon: <PackageX size={26} />,
            value: (displayData.totalUnclaimed || 0).toLocaleString(),
            color: "#F87171",
            description: "Not picked up",
        },
    ];

    return (
        <div className="space-y-5 overflow-visible px-6 pb-5 pt-4">
            {/* Section Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex items-center gap-3"
            >
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="rounded-lg p-2"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#1e293b",
                        color: isDarkMode ? "#1e293b" : "#1e293b",
                    }}
                >
                    <LineChart size={22} style={{ color: isDarkMode ? "#f1f5f9" : "#f1f5f9" }} />
                </motion.div>
                <div>
                    <p
                        className="text-xl font-bold"
                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                    >
                        Admin Dashboard
                    </p>
                    <p
                        className="text-sm"
                        style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                    >
                        Real-time business overview and analytics
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
                            transition: { duration: 0.2 },
                        }}
                        className="cursor-pointer rounded-xl border-2 p-5 transition-all"
                        style={{
                            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
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
                                    style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                >
                                    {value}
                                </p>
                            </motion.div>
                        </div>

                        <div>
                            <h3
                                className="mb-2 text-lg font-semibold"
                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                            >
                                {title}
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                            >
                                {description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 📈 Chart & Today's Transactions */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-7">
                {/* Chart Card */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.01 }}
                    className="col-span-1 rounded-xl border-2 p-5 transition-all md:col-span-2 lg:col-span-4"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}
                >
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p
                                className="mb-1 text-lg font-bold"
                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                            >
                                Revenue Overview
                            </p>
                            <span
                                className="text-sm"
                                style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                            >
                                {new Date().getFullYear()} Monthly Revenue
                            </span>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="rounded-lg p-2"
                            style={{
                                backgroundColor: isDarkMode ? "#0f172a" : "#0f172a",
                                color: isDarkMode ? "#f1f5f9" : "#f1f5f9",
                            }}
                        >
                            <TrendingUp size={18} style={{ color: isDarkMode ? "#f1f5f9" : "#f1f5f9" }} />
                        </motion.div>
                    </div>

                    <div className="h-[260px]">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <AreaChart
                                data={displayData.overviewData || []}
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
                                        `₱${Number(value || 0)
                                            .toFixed(2)
                                            .replace(/\d(?=(\d{3})+\.)/g, "$&,")}`,
                                        "Revenue",
                                    ]}
                                    contentStyle={{
                                        backgroundColor: isDarkMode ? "#0f172a" : "#FFFFFF",
                                        border: `2px solid ${isDarkMode ? "#334155" : "#cbd5e1"}`,
                                        color: isDarkMode ? "#f1f5f9" : "#0f172a",
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
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"}
                                    tickMargin={6}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    dataKey="total"
                                    strokeWidth={0}
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"}
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

                {/* Today's Transactions Card */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.01 }}
                    className="col-span-1 rounded-xl border-2 p-5 transition-all md:col-span-2 lg:col-span-3"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}
                >
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p
                                className="mb-1 text-lg font-bold"
                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                            >
                                Today's Transactions
                            </p>
                            <span
                                className="text-sm"
                                style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                            >
                                {(displayData.todayTransactions?.length || 0)} transactions today
                            </span>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="rounded-lg p-2"
                            style={{
                                backgroundColor: isDarkMode ? "#0f172a" : "#0f172a",
                                color: isDarkMode ? "#f1f5f9" : "#f1f5f9",
                            }}
                        >
                            <Users size={18} style={{ color: isDarkMode ? "#f1f5f9" : "#f1f5f9" }} />
                        </motion.div>
                    </div>

                    <div className="h-[260px] overflow-auto px-2">
                        {!displayData.todayTransactions || displayData.todayTransactions.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex h-full flex-col items-center justify-center py-8 text-center"
                            >
                                <Package
                                    size={36}
                                    style={{ color: isDarkMode ? "#64748b" : "#94a3b8" }}
                                    className="mb-3"
                                />
                                <p
                                    className="mb-1 text-base font-semibold"
                                    style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                >
                                    No Transactions Today
                                </p>
                                <p
                                    className="text-sm"
                                    style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                                >
                                    No transactions have been made today
                                </p>
                            </motion.div>
                        ) : (
                            <div className="space-y-3">
                                {(displayData.todayTransactions || []).map((transaction, index) => (
                                    <motion.div
                                        key={transaction.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{
                                            scale: 1.02,
                                            backgroundColor: isDarkMode ? "#334155" : "#f8fafc",
                                            transition: { duration: 0.2 },
                                        }}
                                        className="cursor-pointer rounded-lg border p-3 transition-all"
                                        style={{
                                            borderColor: isDarkMode ? "#475569" : "#e2e8f0",
                                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(248, 250, 252, 0.8)",
                                        }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p
                                                        className="text-sm font-semibold"
                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                    >
                                                        {transaction.name || transaction.customerName}
                                                    </p>
                                                    <p
                                                        className="text-sm font-bold ml-4"
                                                        style={{ color: isDarkMode ? "#3DD9B6" : "#059669" }}
                                                    >
                                                        ₱{(transaction.price || transaction.totalPrice || 0).toFixed(2)}
                                                    </p>
                                                </div>
                                                <p
                                                    className="mb-1 text-sm"
                                                    style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                                                >
                                                    {transaction.service} • {transaction.loads || transaction.loadCount || 0} loads
                                                </p>
                                                <p
                                                    className="text-xs"
                                                    style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
                                                >
                                                    Payment: {transaction.paymentMethod} • {transaction.pickupStatus}
                                                </p>
                                                {transaction.invoiceNumber && (
                                                    <p
                                                        className="text-xs"
                                                        style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
                                                    >
                                                        Invoice: {transaction.invoiceNumber}
                                                    </p>
                                                )}
                                            </div>
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