import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/auth-context";
import { PackageX, PhilippinePeso, Package, Clock8, LineChart, AlertCircle, TrendingUp, Users, Monitor, WashingMachine, Activity, Bell, RefreshCw, PieChart as LucidePieChart } from "lucide-react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AreaChart, ResponsiveContainer, Tooltip, Area, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { api } from "@/lib/api-config";
import { useNavigate } from "react-router-dom";
import { useSse } from "@/hooks/use-sse";

const CACHE_DURATION = 4 * 60 * 60 * 1000;

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
        console.log("❌ No token found in localStorage (key: authToken)");
        // Try other common keys just in case
        const altToken = localStorage.getItem("token");
        if (altToken) console.log("💡 Found token under alternative key 'token'");
    }
};

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

const calculateUnwashedLoads = (records) => {
    return records.reduce((acc, r) => acc + (r.unwashedLoadsCount || 0), 0);
};

export default function AdminDashboardPage() {
    const { theme } = useTheme();
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

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
    const transactionCheckIntervalRef = useRef(null);
    const isMountedRef = useRef(true);

    // Live Dashboard additions
    const [machines, setMachines] = useState([]);
    const [machinesLoading, setMachinesLoading] = useState(true);

    const refreshMachines = useCallback(() => {
        if (!isAuthenticated || !isAdmin) return;
        
        api.get("/machines")
            .then(data => {
                if (isMountedRef.current) {
                    setMachines(data || []);
                    setMachinesLoading(false);
                }
            })
            .catch(err => console.error("❌ Failed to refresh machines:", err));
    }, [isAuthenticated, isAdmin]);

    const serviceDistribution = useMemo(() => {
        const activeData = dashboardCache ? dashboardCache.data : dashboardData;
        const transactions = activeData?.todayTransactions || [];
        const counts = {
            "Wash & Dry": 0,
            "Wash Only": 0,
            "Dry Only": 0,
            "Other": 0
        };

        transactions.forEach(t => {
            const name = (t.service || "").toLowerCase();
            if (name.includes("wash") && name.includes("dry")) {
                counts["Wash & Dry"] += t.price || 0;
            } else if (name.includes("wash")) {
                counts["Wash Only"] += t.price || 0;
            } else if (name.includes("dry")) {
                counts["Dry Only"] += t.price || 0;
            } else {
                counts["Other"] += t.price || 0;
            }
        });

        const rawData = [
            { name: "Wash & Dry", value: counts["Wash & Dry"], color: "#10B981" }, // green
            { name: "Wash Only", value: counts["Wash Only"], color: "#3B82F6" },  // blue
            { name: "Dry Only", value: counts["Dry Only"], color: "#F59E0B" },   // amber
            { name: "Other", value: counts["Other"], color: "#8B5CF6" }          // purple
        ];

        // Filter out categories with 0 revenue
        return rawData.filter(item => item.value > 0);
    }, [dashboardData.todayTransactions, dashboardCache]);

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

            // Trigger non-blocking refresh for live machines
            refreshMachines();

            const totalsResponse = await api.get("/dashboard/admin/totals");
            console.log("💰 Dashboard totals:", totalsResponse);

            const recordsData = await api.get("/admin/records?page=0&size=50");
            console.log("📊 Today's records data:", recordsData);

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
                issueDate: r.issueDate,
                paid: r.paid || false,
                expired: r.expired,
                disposed: r.disposed || false,
                disposedBy: r.disposedBy || "—",
                gcashReference: r.gcashReference || "—",
                unwashedLoadsCount: r.unwashedLoadsCount || 0,
            }));

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayTransactions = mappedRecords
                .filter(record => {
                    if (!record.issueDate) return false;
                    const recordDate = new Date(record.issueDate);
                    recordDate.setHours(0, 0, 0, 0);
                    return recordDate.getTime() === today.getTime();
                })
                .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

            console.log("📅 Today's transactions using issueDate:", todayTransactions.length);

            const dashboardApiData = await api.get("/dashboard/admin");
            console.log("📊 Chart data from backend:", dashboardApiData.overviewData);

            const newDashboardData = {
                totalIncome: totalsResponse.totalIncome || 0,
                totalLoads: totalsResponse.totalLoads || 0,
                pendingCount: totalsResponse.pendingCount || 0,
                totalUnclaimed: totalsResponse.totalUnclaimed || 0,
                todayTransactions: todayTransactions || [],
                overviewData: dashboardApiData.overviewData || [],
                unclaimedList: dashboardApiData.unclaimedList || [],
            };

            const currentTime = Date.now();

            if (!dashboardCache || hasDataChanged(newDashboardData, dashboardCache.data)) {
                console.log("🔄 Dashboard data updated with fresh totals");

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

    const checkForNewTransactions = useCallback(async () => {
        if (!isMountedRef.current || !isAuthenticated || !isAdmin) return;

        try {
            const recordsData = await api.get("/admin/records?page=0&size=10&sort=createdAt,desc");
            const mappedRecords = recordsData.map((r) => ({
                id: r.id,
                invoiceNumber: r.invoiceNumber,
                name: r.customerName,
                service: r.serviceName,
                loads: r.loads || 0,
                price: r.totalPrice || 0,
                paymentMethod: r.paymentMethod || "—",
                issueDate: r.issueDate,
                createdAt: r.createdAt,
            }));

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const newTodayTransactions = mappedRecords
                .filter(record => {
                    if (!record.issueDate) return false;
                    const recordDate = new Date(record.issueDate);
                    recordDate.setHours(0, 0, 0, 0);
                    return recordDate.getTime() === today.getTime();
                });

            const currentTransactionCount = dashboardData.todayTransactions?.length || 0;
            if (newTodayTransactions.length > currentTransactionCount) {
                console.log("🆕 New transactions detected, refreshing dashboard...");
                fetchDashboardData(true);
            }
        } catch (error) {
            console.error("❌ Error checking for new transactions:", error);
        }
    }, [isAuthenticated, isAdmin, dashboardData.todayTransactions?.length, fetchDashboardData]);
 
     // Real-time updates via internal broadcast (to avoid duplicate SSE connections)
     useEffect(() => {
         const handleTransactionUpdate = () => {
             fetchDashboardData(true);
             refreshMachines();
         };
         const handleLaundryUpdate = () => {
             fetchDashboardData(true);
             refreshMachines();
         };
         const handleStockUpdate = () => {
             fetchDashboardData(true);
             refreshMachines();
         };
         const handleNotificationUpdate = () => {
             fetchDashboardData(true);
             refreshMachines();
         };

         window.addEventListener('STARWASH_TRANSACTION_UPDATE', handleTransactionUpdate);
         window.addEventListener('STARWASH_LAUNDRY_UPDATE', handleLaundryUpdate);
         window.addEventListener('STARWASH_STOCK_UPDATE', handleStockUpdate);
         window.addEventListener('STARWASH_NOTIFICATION_UPDATE', handleNotificationUpdate);

         return () => {
             window.removeEventListener('STARWASH_TRANSACTION_UPDATE', handleTransactionUpdate);
             window.removeEventListener('STARWASH_LAUNDRY_UPDATE', handleLaundryUpdate);
             window.removeEventListener('STARWASH_STOCK_UPDATE', handleStockUpdate);
             window.removeEventListener('STARWASH_NOTIFICATION_UPDATE', handleNotificationUpdate);
         };
     }, [fetchDashboardData, refreshMachines]);

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
            refreshMachines();

            // Polling is now handled by useSse real-time events!
            // transactionCheckIntervalRef.current = setInterval(() => {
            //     checkForNewTransactions();
            // }, 3000);

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
    }, [fetchDashboardData, checkForNewTransactions, isAuthenticated, isAdmin, logout]);

    const formatCurrency = (amount) => {
        return `₱${(amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
    };

    const handleTransactionClick = (customerName) => {
        sessionStorage.setItem('autoSearchName', customerName);
        navigate('/managetransaction');
    };

    const SkeletonCard = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border-2 p-5 transition-all"
            style={{
                backgroundColor: "var(--admin-card-bg)",
                borderColor: "var(--admin-card-border)",
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
                backgroundColor: "var(--admin-card-bg)",
                borderColor: "var(--admin-card-border)",
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
                backgroundColor: "var(--admin-card-bg)",
                borderColor: "var(--admin-card-border)",
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
                        style={{ color: "var(--admin-text-primary)" }}
                    >
                        Access Denied
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-52 items-center justify-center rounded-xl border-2 p-6"
                    style={{
                        backgroundColor: "var(--admin-card-bg)",
                        borderColor: "var(--admin-card-border)",
                    }}
                >
                    <div className="text-center">
                        <AlertCircle
                            className="mx-auto mb-3 h-14 w-14"
                            style={{ color: "#F87171" }}
                        />
                        <p
                            className="mb-1 text-base font-semibold"
                            style={{ color: "var(--admin-text-primary)" }}
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

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>

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
                        backgroundColor: "var(--admin-card-bg)",
                        borderColor: "var(--admin-card-border)",
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
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex items-center gap-3"
            >
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="rounded-lg p-2 shadow-sm"
                    style={{
                        backgroundColor: "var(--admin-accent)",
                        color: "var(--admin-card-bg)",
                    }}
                >
                    <LineChart size={22} />
                </motion.div>
                <div>
                    <p
                        className="text-xl font-bold"
                        style={{ color: "var(--admin-text-primary)" }}
                    >
                        Admin Dashboard
                    </p>
                    <p
                        className="text-sm"
                        style={{ color: "var(--admin-text-secondary)" }}
                    >
                        Real-time business overview and analytics
                    </p>
                </div>
            </motion.div>

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
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                        }}
                        className="cursor-pointer rounded-xl border p-5 transition-all shadow-sm"
                        style={{
                            backgroundColor: "var(--admin-card-bg)",
                            borderColor: "var(--admin-card-border)",
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
                                    style={{ color: "var(--admin-text-primary)" }}
                                >
                                    {value}
                                </p>
                            </motion.div>
                        </div>

                        <div>
                            <h3
                                className="mb-2 text-lg font-semibold"
                                style={{ color: "var(--admin-text-primary)" }}
                            >
                                {title}
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: "var(--admin-text-secondary)" }}
                            >
                                {description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-7">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.005 }}
                    className="col-span-1 rounded-xl border p-5 transition-all shadow-sm md:col-span-2 lg:col-span-4"
                    style={{
                        backgroundColor: "var(--admin-card-bg)",
                        borderColor: "var(--admin-card-border)",
                    }}
                >
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p
                                className="mb-1 text-lg font-bold"
                                style={{ color: "var(--admin-text-primary)" }}
                            >
                                Revenue Overview
                            </p>
                            <span
                                className="text-sm"
                                style={{ color: "var(--admin-text-secondary)" }}
                            >
                                {new Date().getFullYear()} Monthly Revenue
                            </span>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="rounded-lg p-2"
                            style={{
                                backgroundColor: "var(--admin-accent)",
                                color: "var(--admin-card-bg)",
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
                                        backgroundColor: "var(--admin-card-bg)",
                                        border: `1px solid var(--admin-card-border)`,
                                        color: "var(--admin-text-primary)",
                                        fontSize: "0.8rem",
                                        fontWeight: "500",
                                        borderRadius: "0.5rem",
                                        padding: "0.6rem",
                                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                    }}
                                    itemStyle={{
                                        color: "#0891B2",
                                    }}
                                />
                                <XAxis
                                    dataKey="name"
                                    strokeWidth={0}
                                    stroke="var(--admin-text-secondary)"
                                    tickMargin={6}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    dataKey="total"
                                    strokeWidth={0}
                                    stroke="var(--admin-text-secondary)"
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

                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.005 }}
                    className="col-span-1 rounded-xl border p-5 transition-all shadow-sm md:col-span-2 lg:col-span-3"
                    style={{
                        backgroundColor: "var(--admin-card-bg)",
                        borderColor: "var(--admin-card-border)",
                    }}
                >
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p
                                className="mb-1 text-lg font-bold"
                                style={{ color: "var(--admin-text-primary)" }}
                            >
                                Today's Transactions
                            </p>
                            <span
                                className="text-sm"
                                style={{ color: "var(--admin-text-secondary)" }}
                            >
                                Real-time sales and tracking
                            </span>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="rounded-lg p-2"
                            style={{
                                backgroundColor: "var(--admin-accent)",
                                color: "var(--admin-card-bg)",
                            }}
                        >
                            <TrendingUp size={18} />
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
                                    <motion.button
                                        key={transaction.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{
                                            scale: 1.02,
                                            backgroundColor: isDarkMode ? "#334155" : "#f8fafc",
                                            transition: { duration: 0.2 },
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleTransactionClick(transaction.name || transaction.customerName)}
                                        className="w-full text-left rounded-lg border p-3 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                        style={{ 
                                                            color: isDarkMode ? "#3DD9B6" : "#059669",
                                                        }}
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
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* 🚀 NEW PREMIUM WIDGETS SECTION */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-7 mt-5">
                {/* 🧺 Dedicated Live Machine Grid (col-span-4) */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.005 }}
                    className="col-span-1 rounded-xl border p-5 transition-all h-[360px] flex flex-col shadow-sm md:col-span-2 lg:col-span-4"
                    style={{
                        backgroundColor: "var(--admin-card-bg)",
                        borderColor: "var(--admin-card-border)",
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-lg font-bold mb-1" style={{ color: "var(--admin-text-primary)" }}>
                                Live Machine Grid
                            </p>
                            <span className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                                {machines.length} total • {machines.filter(m => m.status === "Available").length} available • {machines.filter(m => m.status === "In Use" || m.status === "Busy").length} busy
                            </span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 180 }}
                            transition={{ duration: 0.4 }}
                            onClick={refreshMachines}
                            className="rounded-lg p-2 transition-colors"
                            style={{
                                backgroundColor: "var(--admin-accent)",
                                color: "var(--admin-card-bg)",
                            }}
                        >
                            <WashingMachine size={18} />
                        </motion.button>
                    </div>

                    <div className="flex-1 overflow-auto pr-1">
                        {machinesLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    style={{ color: "var(--admin-accent)" }}
                                >
                                    <RefreshCw size={24} />
                                </motion.div>
                            </div>
                        ) : machines.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <WashingMachine size={36} className="mb-2 opacity-40" style={{ color: "var(--admin-text-secondary)" }} />
                                <p className="font-semibold text-sm" style={{ color: "var(--admin-text-primary)" }}>No Machines Configured</p>
                                <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>Register equipment in the Machine Management page.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {machines.map((machine, index) => {
                                    const status = machine.status || "Available";
                                    const isAvailable = status === "Available";
                                    const isInUse = status === "In Use" || status === "Busy";
                                    const isDone = status === "Done" || status === "Ready";
                                    const isMaintenance = status === "Maintenance" || status === "Out of Order";

                                    let statusColor = "#10B981"; // green
                                    let statusBg = "rgba(16, 185, 129, 0.2)";
                                    if (isInUse) {
                                        statusColor = "#F59E0B"; // amber
                                        statusBg = "rgba(245, 158, 11, 0.2)";
                                    } else if (isDone) {
                                        statusColor = "#8B5CF6"; // purple
                                        statusBg = "rgba(139, 92, 246, 0.2)";
                                    } else if (isMaintenance) {
                                        statusColor = "#EF4444"; // red
                                        statusBg = "rgba(239, 68, 68, 0.2)";
                                    }

                                    return (
                                        <motion.div
                                            key={machine.id || index}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ y: -3, boxShadow: "0 8px 20px -6px rgba(0, 0, 0, 0.15)" }}
                                            onClick={() => navigate("/machines")}
                                            className="cursor-pointer border-2 rounded-xl p-3 flex flex-col justify-between transition-all"
                                            style={{
                                                backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.4)" : "rgba(248, 250, 252, 0.8)",
                                                borderColor: isDarkMode ? "#334155" : "#e2e8f0"
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-1 mb-2">
                                                <p className="font-bold text-sm truncate" style={{ color: "var(--admin-text-primary)" }}>
                                                    {machine.name}
                                                </p>
                                                <span className="relative flex h-2 w-2 mt-1 flex-shrink-0">
                                                    <span
                                                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                                        style={{ backgroundColor: statusColor }}
                                                    ></span>
                                                    <span
                                                        className="relative inline-flex rounded-full h-2 w-2"
                                                        style={{ backgroundColor: statusColor }}
                                                    ></span>
                                                </span>
                                            </div>
                                            <div className="mt-auto">
                                                <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1" style={{ color: "var(--admin-text-secondary)" }}>
                                                    {machine.type}
                                                </p>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span style={{ color: "var(--admin-text-secondary)" }}>
                                                        {machine.capacityKg ? `${machine.capacityKg} kg` : "8.0 kg"}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase" style={{ color: statusColor, backgroundColor: statusBg }}>
                                                        {status}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 📊 Service Revenue Distribution Doughnut Chart (col-span-3) */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.005 }}
                    className="col-span-1 rounded-xl border p-5 transition-all h-[360px] flex flex-col shadow-sm md:col-span-2 lg:col-span-3"
                    style={{
                        backgroundColor: "var(--admin-card-bg)",
                        borderColor: "var(--admin-card-border)",
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-lg font-bold mb-1" style={{ color: "var(--admin-text-primary)" }}>
                                Service Distribution
                            </p>
                            <span className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                                Today's revenue share
                            </span>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="rounded-lg p-2"
                            style={{
                                backgroundColor: "var(--admin-accent)",
                                color: "var(--admin-card-bg)",
                            }}
                        >
                            <LucidePieChart size={18} />
                        </motion.div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        {serviceDistribution.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-8">
                                <LucidePieChart size={36} className="mb-2 opacity-40 animate-pulse" style={{ color: "var(--admin-text-secondary)" }} />
                                <p className="font-semibold text-sm" style={{ color: "var(--admin-text-primary)" }}>No Revenue Today</p>
                                <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>Transactions completed today will show up here.</p>
                            </div>
                        ) : (
                            <div className="flex flex-1 items-center justify-between gap-4">
                                <div className="w-[45%] h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={serviceDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={65}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {serviceDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [`₱${Number(value).toFixed(2)}`, "Revenue"]}
                                                contentStyle={{
                                                    backgroundColor: "var(--admin-card-bg)",
                                                    border: `1px solid var(--admin-card-border)`,
                                                    color: "var(--admin-text-primary)",
                                                    fontSize: "0.75rem",
                                                    fontWeight: "500",
                                                    borderRadius: "0.5rem",
                                                    padding: "0.5rem",
                                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 space-y-2.5 max-h-[220px] overflow-auto pr-1">
                                    {serviceDistribution.map((item, index) => {
                                        const totalVal = serviceDistribution.reduce((sum, entry) => sum + entry.value, 0);
                                        const percentage = totalVal > 0 ? ((item.value / totalVal) * 100).toFixed(0) : 0;
                                        return (
                                            <div key={index} className="flex items-center justify-between text-xs border-b pb-1.5 last:border-0 last:pb-0" style={{ borderColor: "rgba(148, 163, 184, 0.1)" }}>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                                    <span className="truncate font-semibold" style={{ color: "var(--admin-text-primary)" }}>{item.name}</span>
                                                </div>
                                                <div className="text-right ml-2 flex-shrink-0">
                                                    <p className="font-bold" style={{ color: "var(--admin-text-primary)" }}>₱{item.value.toFixed(2)}</p>
                                                    <span className="text-[10px] opacity-60 font-semibold" style={{ color: "var(--admin-text-secondary)" }}>{percentage}% share</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    </motion.div>
            </div>
        </div>
    );
}