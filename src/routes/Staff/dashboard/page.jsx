import { useTheme } from "@/hooks/use-theme";
import { PackageX, PhilippinePeso, Package, Clock8, Timer, AlertCircle } from "lucide-react";
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
        lastUpdated: null,
    });

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = useCallback(async () => {
        try {
            const token = localStorage.getItem("authToken");

            const response = await fetch("http://localhost:8080/api/dashboard/staff", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch dashboard data");
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
                lastUpdated: new Date(),
            });
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setDashboardData((prev) => ({
                ...prev,
                loading: false,
                error: error.message,
            }));
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();

        const interval = setInterval(fetchDashboardData, 15000);
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    const formatCurrency = (amount) => {
        return `₱${amount.toFixed(2)}`;
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
        if (status.includes("m") || status.includes("s")) return "text-blue-600 dark:text-blue-400";
        if (status === "In Use") return "text-orange-600 dark:text-orange-400";
        if (status === "Available") return "text-green-600 dark:text-green-400";
        if (status === "Maintenance") return "text-red-600 dark:text-red-400";
        if (status === "Done") return "text-purple-600 dark:text-purple-400";
        return "text-slate-600 dark:text-slate-400";
    };

    // Skeleton loader components
    const SummaryCardSkeleton = () => (
        <div className="card animate-pulse">
            <div className="card-header flex items-center gap-x-3">
                <div className="w-10 h-10 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-24"></div>
            </div>
            <div className="card-body rounded-md bg-slate-100 p-4 dark:bg-slate-950">
                <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded"></div>
            </div>
        </div>
    );

    const MachineListSkeleton = () => (
        <div className="space-y-2">
            <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-20 mb-2"></div>
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-x-2">
                        <div className="w-5 h-5 bg-slate-300 dark:bg-slate-700 rounded"></div>
                        <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-32"></div>
                    </div>
                    <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-12"></div>
                </div>
            ))}
        </div>
    );

    const UnclaimedListSkeleton = () => (
        <div className="space-y-2">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                        <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-28"></div>
                        <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-36"></div>
                    </div>
                    <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-16"></div>
                </div>
            ))}
        </div>
    );

    if (dashboardData.error) {
        return (
            <div className="flex flex-col gap-y-4">
                <h1 className="title">Staff Dashboard</h1>
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                        <p className="text-slate-600 dark:text-slate-400">Failed to load dashboard data</p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">Auto-retrying in 30 seconds...</p>
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
            color: "#3DD9B6",
        },
        {
            title: "Today's Loads",
            icon: <Package size={26} />,
            value: dashboardData.todayLoads.toString(),
            color: "#60A5FA",
        },
        {
            title: "Unwashed",
            icon: <Clock8 size={26} />,
            value: dashboardData.unwashedCount.toString(),
            color: "#FB923C",
        },
        {
            title: "Unclaimed",
            icon: <PackageX size={26} />,
            value: dashboardData.completedUnclaimedTransactions.length.toString(),
            color: "#F87171",
        },
    ];

    const washers = dashboardData.allMachines.filter((machine) => machine && machine.type && machine.type.toUpperCase() === "WASHER");
    const dryers = dashboardData.allMachines.filter((machine) => machine && machine.type && machine.type.toUpperCase() === "DRYER");

    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between">
                <h1 className="title">Staff Dashboard</h1>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {dashboardData.loading ? (
                    Array.from({ length: 4 }).map((_, index) => <SummaryCardSkeleton key={index} />)
                ) : (
                    summaryCards.map(({ title, icon, value, growth, color, growthColor }) => (
                        <div
                            key={title}
                            className="card"
                        >
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
                    ))
                )}
            </div>

            {/* Machine Status + Unclaimed Transactions */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* All Machines */}
                <div className="card col-span-1 md:col-span-2 lg:col-span-4">
                    <div className="card-header">
                        <p className="card-title">All Machines Status</p>
                        
                    </div>
                    <div className="card-body flex h-[360px] flex-col overflow-auto px-4 py-2">
                        {dashboardData.loading ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <MachineListSkeleton />
                                <MachineListSkeleton />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Washers with right border */}
                                <div className="space-y-2 border-r border-slate-200 pr-4 dark:border-slate-700">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Washers ({washers.length})</p>
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
                                                        <Timer
                                                            size={20}
                                                            className="text-blue-500 dark:text-blue-400"
                                                        />
                                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                                                            {machine.name || "Unnamed Washer"}
                                                        </p>
                                                    </div>
                                                    <p className={`text-sm font-medium ${getStatusColor(status)}`}>{status}</p>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Dryers */}
                                <div className="space-y-2 pl-4">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Dryers ({dryers.length})</p>
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
                                                        <Timer
                                                            size={20}
                                                            className="text-orange-500 dark:text-orange-400"
                                                        />
                                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                                                            {machine.name || "Unnamed Dryer"}
                                                        </p>
                                                    </div>
                                                    <p className={`text-sm font-medium ${getStatusColor(status)}`}>{status}</p>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Unclaimed Transactions */}
                <div className="card col-span-1 md:col-span-2 lg:col-span-3">
                    <div className="card-header">
                        <p className="card-title">Unclaimed</p>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            {dashboardData.loading ? (
                                <span className="inline-block h-3 bg-slate-300 dark:bg-slate-700 rounded w-28"></span>
                            ) : (
                                `${dashboardData.completedUnclaimedTransactions.length} unclaimed laundry`
                            )}
                        </span>
                    </div>
                    <div className="card-body flex h-[360px] flex-col overflow-auto px-4 py-2">
                        {dashboardData.loading ? (
                            <UnclaimedListSkeleton />
                        ) : dashboardData.completedUnclaimedTransactions.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">No unclaimed completed loads</p>
                        ) : (
                            dashboardData.completedUnclaimedTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between border-b border-slate-200 py-2 last:border-none dark:border-slate-700"
                                >
                                    <div className="leading-tight">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{transaction.customerName}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {transaction.serviceType} • {transaction.loadAssignments?.length || 0} loads
                                        </p>
                                    </div>
                                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">Unclaimed</p>
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