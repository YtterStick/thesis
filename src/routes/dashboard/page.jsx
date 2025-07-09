import { PackageX, CreditCard, PhilippinePeso, Package, TrendingUp, Clock8 } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { overviewData, recentSalesData } from "@/constants";

import { AreaChart, ResponsiveContainer, Tooltip, Area, XAxis, YAxis } from "recharts";

const DashboardPage = () => {
    const { theme } = useTheme();

    return (
        <div className="flex flex-col gap-y-3">
            <h1 className="title">Dashboard</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Here is today’s report and performance overview.</p>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[
                    {
                        title: "Total Income",
                        icon: <PhilippinePeso size={26} />,
                        value: "₱25,154",
                        growth: "+12% increase compared to yesterday",
                    },
                    {
                        title: "Total Loads",
                        icon: <Package size={26} />,
                        value: "1,247",
                        growth: "+8% increase compared to yesterday",
                    },
                    {
                        title: "Pending Pickup",
                        icon: <Clock8 size={26} />,
                        value: "42",
                        growth: "-4% decrease compared to yesterday",
                    },
                    {
                        title: "Total Unclaimed",
                        icon: <PackageX size={26} />,
                        value: "71",
                        growth: "-3% decrease compared to yesterday",
                    },
                ].map(({ title, icon, value, growth }) => (
                    <div
                        key={title}
                        className="card"
                    >
                        <div className="card-header">
                            <div className="w-fit rounded-lg bg-[#3DD9B6]/20 p-2 text-[#3DD9B6] transition-colors dark:bg-[#007362]/30 dark:text-[#3DD9B6]">
                                {icon}
                            </div>
                            <p className="card-title">{title}</p>
                        </div>
                        <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950">
                            <p className="text-3xl font-bold text-slate-900 transition-colors dark:text-slate-50">{value}</p>
                            <p
                                className={`text-xs font-medium transition-colors ${
                                    growth.startsWith("-") ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-[#28b99a]"
                                }`}
                            >
                                {growth}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            {/* Charts + Unpaid List */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Overview Chart */}
                <div className="card col-span-1 md:col-span-2 lg:col-span-4">
                    <div className="card-header">
                        <p className="card-title">Overview</p>
                    </div>
                    <div className="card-body p-0">
                        <ResponsiveContainer
                            width="100%"
                            height={300}
                        >
                            <AreaChart
                                data={overviewData}
                                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
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
                                            stopColor="#3DD9B6"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#008B76"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    cursor={false}
                                    formatter={(value) => `₱${value}`}
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
                                    stroke="#3DD9B6"
                                    fillOpacity={1}
                                    fill="url(#colorLoad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Sales / Unpaid List */}
                <div className="card col-span-1 md:col-span-2 lg:col-span-3">
                    <div className="card-header">
                        <p className="card-title">Unpaid List</p>
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
                                    <p className="font-medium text-slate-900 dark:text-slate-50">₱{sale.amount.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
