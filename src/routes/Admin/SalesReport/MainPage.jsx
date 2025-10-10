import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, DollarSign, TrendingUp, BarChart3, Package, ChevronLeft, ChevronRight, Info, Calendar, LineChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

let salesReportCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for sales report data

const AnimatedNumber = ({ value, isChanging }) => {
    if (!isChanging) {
        return <span>{value}</span>;
    }

    return (
        <span className="relative inline-block">
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={value}
                    initial={{
                        opacity: 0,
                        y: 30,
                        scale: 1.2,
                        rotateX: 90,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotateX: 0,
                    }}
                    exit={{
                        opacity: 0,
                        y: -30,
                        scale: 0.8,
                        rotateX: -90,
                    }}
                    transition={{
                        duration: 0.6,
                        ease: "easeOut",
                    }}
                    className="inline-block"
                    style={{
                        transformStyle: "preserve-3d",
                    }}
                >
                    {value}
                </motion.span>
            </AnimatePresence>
        </span>
    );
};

const ServiceSelector = ({ services, serviceId, onChange, isLocked }) => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    return (
        <div className="space-y-2">
            <Label
                className="mb-1 block"
                style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}
            >
                Service Type
            </Label>
            <Select
                value={serviceId}
                onValueChange={(value) => onChange("serviceId", value)}
                disabled={isLocked}
            >
                <SelectTrigger
                    className="transition-all"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        color: isDarkMode ? "#13151B" : "#0B2B26",
                    }}
                >
                    <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        color: isDarkMode ? "#13151B" : "#0B2B26",
                    }}
                >
                    {services.map((service) => (
                        <SelectItem
                            key={service.id}
                            value={service.id}
                            className="cursor-pointer transition-colors"
                            style={{
                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                            }}
                        >
                            {service.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

const formatDateForBackend = (dateString) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

const CustomBarTooltip = ({ active, payload, label, isDarkMode }) => {
    if (active && payload && payload.length) {
        return (
            <div
                className="rounded-lg border-2 p-3 shadow-lg"
                style={{
                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    color: isDarkMode ? "#13151B" : "#0B2B26",
                }}
            >
                <p className="font-medium">{label}</p>
                <p className="text-sm">
                    Sales: <span className="font-medium">₱{payload[0].value.toLocaleString()}</span>
                </p>
            </div>
        );
    }
    return null;
};

const CustomPieTooltip = ({ active, payload, isDarkMode }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;

        return (
            <div
                className="rounded-lg border-2 p-3 shadow-lg"
                style={{
                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    color: isDarkMode ? "#13151B" : "#0B2B26",
                }}
            >
                <p className="font-medium">{data.name}</p>
                <p className="text-sm">
                    Count: <span className="font-medium">{data.value} transactions</span>
                </p>
                <p className="text-sm">
                    Percentage: <span className="font-medium">{Math.round(data.percent * 100)}%</span>
                </p>
            </div>
        );
    }
    return null;
};

const SalesReportPage = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const [isLoading, setIsLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [dateRange, setDateRange] = useState("today");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [datesSwapped, setDatesSwapped] = useState(false);
    const { toast } = useToast();

    const [salesData, setSalesData] = useState([]);
    const [serviceDistributionData, setServiceDistributionData] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [summaryData, setSummaryData] = useState({
        totalSales: 0,
        totalTransactions: 0,
        totalCustomers: 0,
        averageOrderValue: 0,
        todaySales: 0,
        yesterdaySales: 0,
        growthPercentage: 0,
        totalLoads: 0,
    });

    // State for animated numbers
    const [animatedSummary, setAnimatedSummary] = useState({
        totalSales: "0",
        totalTransactions: "0",
        averageOrderValue: "0.00",
        totalLoads: "0",
        growthPercentage: "0",
        isChanging: false,
    });

    const services = [
        { id: "all", name: "All Services" },
        { id: "Wash & Dry", name: "Wash & Dry" },
        { id: "Wash", name: "Wash Only" },
        { id: "Dry", name: "Dry Only" },
    ];

    useEffect(() => {
        handleDateRangeChange("today");
    }, []);

    useEffect(() => {
        fetchSalesReport();
    }, [dateRange, startDate, endDate, serviceTypeFilter]);

    // Update animated numbers when summary data changes
    useEffect(() => {
        if (!initialLoad) {
            setAnimatedSummary((prev) => ({
                totalSales: `₱${summaryData.totalSales.toLocaleString()}`,
                totalTransactions: summaryData.totalTransactions.toLocaleString(),
                averageOrderValue: `₱${summaryData.averageOrderValue.toFixed(2)}`,
                totalLoads: (summaryData.totalLoads || 0).toLocaleString(),
                growthPercentage: `${Math.round(summaryData.growthPercentage)}`,
                isChanging: true,
            }));

            // Reset changing state after animation
            setTimeout(() => {
                setAnimatedSummary((prev) => ({ ...prev, isChanging: false }));
            }, 1000);
        }
    }, [summaryData, initialLoad]);

    // Function to check if data has actually changed
    const hasDataChanged = (newData, oldData) => {
        if (!oldData) return true;

        return (
            JSON.stringify(newData.salesData) !== JSON.stringify(oldData.salesData) ||
            JSON.stringify(newData.serviceDistributionData) !== JSON.stringify(oldData.serviceDistributionData) ||
            JSON.stringify(newData.recentTransactions) !== JSON.stringify(oldData.recentTransactions) ||
            JSON.stringify(newData.summaryData) !== JSON.stringify(oldData.summaryData)
        );
    };

    // Fix for percentage calculation - ensure it doesn't exceed 100%
    const calculateSafeGrowthPercentage = (todaySales, yesterdaySales) => {
        if (yesterdaySales === 0) {
            return todaySales > 0 ? 100 : 0;
        }

        const percentage = ((todaySales - yesterdaySales) / yesterdaySales) * 100;

        // Cap at 100% to prevent unrealistic numbers like 290%
        if (percentage > 100) return 100;
        if (percentage < -100) return -100;

        return Math.round(percentage);
    };

    const fetchSalesReport = async (forceRefresh = false) => {
        try {
            // Check cache first unless forced refresh
            const now = Date.now();
            const cacheKey = `${dateRange}-${startDate}-${endDate}-${serviceTypeFilter}`;

            if (
                !forceRefresh &&
                salesReportCache &&
                salesReportCache.cacheKey === cacheKey &&
                cacheTimestamp &&
                now - cacheTimestamp < CACHE_DURATION
            ) {
                console.log("📦 Using cached sales report data");
                setSalesData(salesReportCache.salesData);
                setServiceDistributionData(salesReportCache.serviceDistributionData);
                setRecentTransactions(salesReportCache.recentTransactions);
                setSummaryData(salesReportCache.summaryData);
                setIsLoading(false);
                setInitialLoad(false);
                return;
            }

            setIsLoading(true);
            const token = localStorage.getItem("authToken");

            setDatesSwapped(false);

            let requestStartDate = startDate;
            let requestEndDate = endDate;

            if (dateRange === "custom") {
                if (!startDate || !endDate) {
                    toast({
                        title: "Error",
                        description: "Please select both start and end dates for custom range",
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    setInitialLoad(false);
                    return;
                }

                const start = new Date(startDate);
                const end = new Date(endDate);

                if (start > end) {
                    requestStartDate = endDate;
                    requestEndDate = startDate;
                    setDatesSwapped(true);

                    toast({
                        title: "Info",
                        description: "Start date was after end date. Dates have been auto-swapped.",
                        variant: "default",
                    });
                }
            }

            const params = new URLSearchParams();
            if (dateRange !== "custom") {
                params.append("dateRange", dateRange);
            } else {
                params.append("dateRange", "custom");
                if (requestStartDate) params.append("startDate", formatDateForBackend(requestStartDate));
                if (requestEndDate) params.append("endDate", formatDateForBackend(requestEndDate));
            }
            if (serviceTypeFilter !== "all") {
                params.append("serviceType", serviceTypeFilter);
            }

            const response = await fetch(`http://localhost:8080/api/reports/sales?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                if (response.status === 400) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Invalid request parameters");
                } else if (response.status === 401) {
                    throw new Error("Authentication failed");
                } else {
                    throw new Error("Failed to fetch sales report");
                }
            }

            const data = await response.json();

            // Process sales data to ensure all dates are properly formatted and visible
            let processedSalesData = data.salesTrend || [];

            if (dateRange === "year") {
                const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                const salesMap = {};
                processedSalesData.forEach((item) => {
                    const monthNames = [
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                    ];
                    const monthIndex = monthNames.findIndex((name) => name === item.period);
                    if (monthIndex !== -1) {
                        salesMap[allMonths[monthIndex]] = item.sales;
                    } else {
                        // If period is already in abbreviated format, use it directly
                        salesMap[item.period] = item.sales;
                    }
                });

                // Create a complete dataset with all months
                processedSalesData = allMonths.map((month) => ({
                    period: month,
                    sales: salesMap[month] || 0,
                }));
            } else if (dateRange === "week" || dateRange === "month") {
                // Ensure proper date formatting for shorter time periods
                processedSalesData = processedSalesData.map((item) => {
                    // If the period is a date string, format it properly
                    if (item.period && item.period.includes("-")) {
                        try {
                            const date = new Date(item.period);
                            if (!isNaN(date.getTime())) {
                                return {
                                    ...item,
                                    period: date.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    }),
                                };
                            }
                        } catch (e) {
                            console.warn("Failed to parse date:", item.period);
                        }
                    }
                    return item;
                });
            }

            // Apply safe growth percentage calculation
            const safeGrowthPercentage = calculateSafeGrowthPercentage(data.summary?.todaySales || 0, data.summary?.yesterdaySales || 0);

            const newData = {
                salesData: processedSalesData,
                serviceDistributionData: data.serviceDistribution || [],
                recentTransactions: data.recentTransactions || [],
                summaryData: {
                    ...data.summary,
                    growthPercentage: safeGrowthPercentage, // Use the safe calculation
                    totalSales: data.summary?.totalSales || 0,
                    totalTransactions: data.summary?.totalTransactions || 0,
                    totalCustomers: data.summary?.totalCustomers || 0,
                    averageOrderValue: data.summary?.averageOrderValue || 0,
                    todaySales: data.summary?.todaySales || 0,
                    yesterdaySales: data.summary?.yesterdaySales || 0,
                    totalLoads: data.summary?.totalLoads || 0,
                },
            };

            // Only update state and cache if data has actually changed
            if (hasDataChanged(newData, salesReportCache)) {
                console.log("🔄 Sales report data updated");

                // Update cache
                salesReportCache = {
                    ...newData,
                    cacheKey: cacheKey,
                };
                cacheTimestamp = Date.now();

                setSalesData(newData.salesData);
                setServiceDistributionData(newData.serviceDistributionData);
                setRecentTransactions(newData.recentTransactions);
                setSummaryData(newData.summaryData);
            } else {
                console.log("✅ No changes in sales report data, skipping update");
                // Just update the timestamp to extend cache life
                cacheTimestamp = Date.now();
            }

            setCurrentPage(1);
            setIsLoading(false);
            setInitialLoad(false);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: error.message || "Failed to load sales report",
                variant: "destructive",
            });
            setIsLoading(false);
            setInitialLoad(false);
        }
    };

    const handleDateRangeChange = (value) => {
        setDateRange(value);
        setDatesSwapped(false);

        const today = new Date();
        switch (value) {
            case "today":
                setStartDate(today.toISOString().split("T")[0]);
                setEndDate(today.toISOString().split("T")[0]);
                break;
            case "yesterday":
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                setStartDate(yesterday.toISOString().split("T")[0]);
                setEndDate(yesterday.toISOString().split("T")[0]);
                break;
            case "week":
                const weekStart = new Date(today);
                weekStart.setDate(weekStart.getDate() - 7);
                setStartDate(weekStart.toISOString().split("T")[0]);
                setEndDate(today.toISOString().split("T")[0]);
                break;
            case "month":
                const monthStart = new Date(today);
                monthStart.setDate(1);
                setStartDate(monthStart.toISOString().split("T")[0]);
                setEndDate(today.toISOString().split("T")[0]);
                break;
            case "year":
                const yearStart = new Date(today.getFullYear(), 0, 1);
                const yearEnd = new Date(today.getFullYear(), 11, 31);
                setStartDate(yearStart.toISOString().split("T")[0]);
                setEndDate(yearEnd.toISOString().split("T")[0]);
                break;
            default:
                break;
        }
    };

    const handleStartDateChange = (newStartDate) => {
        setStartDate(newStartDate);
        if (endDate && new Date(newStartDate) > new Date(endDate)) {
            setEndDate(newStartDate);
            toast({
                title: "Info",
                description: "End date automatically adjusted to match start date",
                variant: "default",
            });
        }
    };

    const handleEndDateChange = (newEndDate) => {
        setEndDate(newEndDate);
        if (startDate && new Date(newEndDate) < new Date(startDate)) {
            setStartDate(newEndDate);
            toast({
                title: "Info",
                description: "Start date automatically adjusted to match end date",
                variant: "default",
            });
        }
    };

    const handleServiceChange = (field, value) => {
        if (field === "serviceId") {
            setServiceTypeFilter(value);
        }
    };

    const filteredTransactions = recentTransactions.filter(
        (transaction) =>
            transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.serviceType.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    // Updated color scheme with #1C3F3A as primary
    const CHART_COLORS = {
        primary: "#1C3F3A",
        secondary: "#2A524C",
        accent: "#3DD9B6",
        highlight: "#60A5FA",
        complementary: "#FB923C",
        light: "#18442AF5",
    };

    const SERVICE_COLORS = [
        CHART_COLORS.primary, // #1C3F3A - Dark Teal
        CHART_COLORS.secondary, // #2A524C - Medium Teal
        CHART_COLORS.accent, // #3DD9B6 - Bright Teal
        CHART_COLORS.highlight, // #60A5FA - Blue
        CHART_COLORS.complementary, // #FB923C - Orange
    ];

    const summaryCards = [
        {
            label: "Total Income",
            value: animatedSummary.totalSales,
            icon: <DollarSign size={26} />,
            color: CHART_COLORS.accent,
            description: `${summaryData.growthPercentage >= 0 ? "+" : ""}${animatedSummary.growthPercentage}% from previous period`,
            trend: summaryData.growthPercentage,
        },
        {
            label: "Transactions",
            value: animatedSummary.totalTransactions,
            icon: <TrendingUp size={26} />,
            color: CHART_COLORS.highlight,
            description: `${summaryData.totalCustomers} unique customers`,
        },
        {
            label: "Avg. Order Value",
            value: animatedSummary.averageOrderValue,
            icon: <BarChart3 size={26} />,
            color: CHART_COLORS.complementary,
            description: "Per transaction",
        },
        {
            label: "Total Loads",
            value: animatedSummary.totalLoads,
            icon: <Package size={26} />,
            color: CHART_COLORS.primary,
            description: "Total wash loads processed",
        },
    ];

    // Custom XAxis tick component to ensure all labels are visible
    const renderCustomXAxisTick = ({ x, y, payload }) => {
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={16}
                    textAnchor="middle"
                    fill={isDarkMode ? "#13151B" : "#0B2B26"}
                    fontSize="12"
                    fontWeight="500"
                >
                    {payload.value}
                </text>
            </g>
        );
    };

    // Skeleton loader components (only for initial load)
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
            <div className="mb-4 flex items-center justify-between">
                <div
                    className="w-fit animate-pulse rounded-lg p-2"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                    }}
                >
                    <div className="h-6 w-6"></div>
                </div>
                <div
                    className="h-8 w-24 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                    }}
                ></div>
            </div>

            <div className="space-y-2">
                <div
                    className="mb-2 h-5 w-32 animate-pulse rounded"
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
        </motion.div>
    );

    const SkeletonChart = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border-2 p-5 transition-all"
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
                className="h-[300px] w-full animate-pulse rounded-lg"
                style={{
                    backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                }}
            ></div>
        </motion.div>
    );

    const SkeletonHeader = () => (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex items-center gap-3">
                <div
                    className="h-10 w-10 animate-pulse rounded-lg"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                    }}
                ></div>
                <div className="space-y-2">
                    <div
                        className="h-6 w-44 animate-pulse rounded-lg"
                        style={{
                            backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                        }}
                    ></div>
                    <div
                        className="h-4 w-56 animate-pulse rounded"
                        style={{
                            backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                        }}
                    ></div>
                </div>
            </div>
        </motion.div>
    );

    // Show skeleton loader only during initial load
    if (initialLoad) {
        return (
            <div className="space-y-5 overflow-visible px-6 pb-5 pt-4">
                <SkeletonHeader />

                {/* Filters Skeleton */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border-2 p-5 transition-all"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                >
                    <div
                        className="mb-4 h-6 w-32 animate-pulse rounded"
                        style={{
                            backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                        }}
                    ></div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="space-y-2"
                            >
                                <div
                                    className="h-4 w-20 animate-pulse rounded"
                                    style={{
                                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                                    }}
                                ></div>
                                <div
                                    className="h-10 w-full animate-pulse rounded"
                                    style={{
                                        backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                    }}
                                ></div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Summary Cards Skeleton */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, index) => (
                        <SkeletonCard key={index} />
                    ))}
                </div>

                {/* Charts Skeleton */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <SkeletonChart />
                    <SkeletonChart />
                </div>

                {/* Transactions Skeleton */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border-2 p-5 transition-all"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                >
                    <div
                        className="mb-4 h-6 w-44 animate-pulse rounded"
                        style={{
                            backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                        }}
                    ></div>
                    <div
                        className="h-[400px] w-full animate-pulse rounded-lg"
                        style={{
                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                        }}
                    ></div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-5 overflow-visible px-6 pb-5 pt-4">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div className="flex items-center gap-3">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="rounded-lg p-2"
                        style={{
                            backgroundColor: isDarkMode ? CHART_COLORS.light : CHART_COLORS.primary,
                            color: "#F3EDE3",
                        }}
                    >
                        <LineChart size={22} />
                    </motion.div>
                    <div>
                        <p
                            className="text-xl font-bold"
                            style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}
                        >
                            Sales Reports
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: isDarkMode ? "#F3EDE3/70" : "#0B2B26/70" }}
                        >
                            Analyze and track your business performance
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card
                    className="rounded-xl border-2 transition-all"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                >
                    <CardHeader
                        className="rounded-t-xl pb-4"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                        }}
                    >
                        <CardTitle style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>Report Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        {datesSwapped && (
                            <div
                                className="mb-4 flex items-center rounded-lg p-3 transition-all"
                                style={{
                                    backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.1)",
                                    color: isDarkMode ? "#3b82f6" : "#1d4ed8",
                                    border: `1px solid ${isDarkMode ? "#3b82f6" : "#3b82f6"}`,
                                }}
                            >
                                <Info className="mr-2 h-4 w-4" />
                                <span>Start date was after end date. Dates have been auto-swapped.</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label
                                    className="mb-1 block"
                                    style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                >
                                    Date Range
                                </Label>
                                <Select
                                    value={dateRange}
                                    onValueChange={handleDateRangeChange}
                                >
                                    <SelectTrigger
                                        className="transition-all"
                                        style={{
                                            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                            color: isDarkMode ? "#13151B" : "#0B2B26",
                                        }}
                                    >
                                        <SelectValue placeholder="Select date range" />
                                    </SelectTrigger>
                                    <SelectContent
                                        style={{
                                            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                            color: isDarkMode ? "#13151B" : "#0B2B26",
                                        }}
                                    >
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="yesterday">Yesterday</SelectItem>
                                        <SelectItem value="week">Last 7 Days</SelectItem>
                                        <SelectItem value="month">This Month</SelectItem>
                                        <SelectItem value="year">This Year</SelectItem>
                                        <SelectItem value="custom">Custom Range</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {dateRange === "custom" && (
                                <>
                                    <div className="space-y-2">
                                        <Label
                                            className="mb-1 block"
                                            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                        >
                                            Start Date
                                        </Label>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            max={endDate || undefined}
                                            onChange={(e) => handleStartDateChange(e.target.value)}
                                            className="transition-all"
                                            style={{
                                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                                color: isDarkMode ? "#13151B" : "#0B2B26",
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label
                                            className="mb-1 block"
                                            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                        >
                                            End Date
                                        </Label>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            min={startDate || undefined}
                                            onChange={(e) => handleEndDateChange(e.target.value)}
                                            className="transition-all"
                                            style={{
                                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                                color: isDarkMode ? "#13151B" : "#0B2B26",
                                            }}
                                        />
                                    </div>
                                </>
                            )}

                            <ServiceSelector
                                services={services}
                                serviceId={serviceTypeFilter}
                                onChange={handleServiceChange}
                                isLocked={false}
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Summary Cards */}
<div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
  {summaryCards.map(({ label, value, icon, color, description, trend }, index) => (
    <motion.div
      key={label}
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
          {/* Change the p tag to div since it contains block content */}
          <div
            className="text-2xl font-bold"
            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
          >
            {/* Use AnimatedNumber instead of skeleton loading */}
            <AnimatedNumber 
              value={value} 
              isChanging={animatedSummary.isChanging} 
            />
          </div>
        </motion.div>
      </div>

      <div>
        <h3
          className="mb-2 text-lg font-semibold"
          style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
        >
          {label}
        </h3>
        <p
          className="text-sm"
          style={{
            color: trend !== undefined ? (trend >= 0 ? "#10B981" : "#EF4444") : isDarkMode ? "#6B7280" : "#0B2B26/80",
          }}
        >
          {description}
        </p>
      </div>
    </motion.div>
  ))}
</div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Sales Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card
                        className="rounded-xl border-2 transition-all"
                        style={{
                            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        }}
                    >
                        <CardHeader>
                            <CardTitle style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>Income Trend</CardTitle>
                            <CardDescription style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}>Income performance overview</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer
                                width="100%"
                                height={300}
                            >
                                <BarChart
                                    data={salesData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={isDarkMode ? "#2A524C" : "#E0EAE8"}
                                    />
                                    <XAxis
                                        dataKey="period"
                                        stroke={isDarkMode ? "#13151B" : "#0B2B26"}
                                        tickLine={{ stroke: isDarkMode ? "#13151B" : "#0B2B26" }}
                                        interval={0} // Force show all labels
                                        tick={renderCustomXAxisTick}
                                        height={50} // Increase height to accommodate all labels
                                    />
                                    <YAxis
                                        stroke={isDarkMode ? "#13151B" : "#0B2B26"}
                                        tick={{ fill: isDarkMode ? "#13151B" : "#0B2B26" }}
                                        tickLine={{ stroke: isDarkMode ? "#13151B" : "#0B2B26" }}
                                        tickFormatter={(value) => `₱${value > 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                                    />
                                    <Tooltip
                                        content={<CustomBarTooltip isDarkMode={isDarkMode} />}
                                        cursor={{ fill: "transparent" }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="sales"
                                        name="Income"
                                        fill={CHART_COLORS.primary}
                                        stroke={CHART_COLORS.secondary}
                                        strokeWidth={1}
                                        radius={[4, 4, 0, 0]}
                                        className="transition-all duration-300 hover:opacity-80"
                                        activeBar={{
                                            fill: CHART_COLORS.accent,
                                            stroke: CHART_COLORS.primary,
                                            strokeWidth: 2,
                                            radius: [4, 4, 0, 0],
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Service Distribution Chart */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card
                        className="rounded-xl border-2 transition-all"
                        style={{
                            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        }}
                    >
                        <CardHeader>
                            <CardTitle style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>Service Distribution</CardTitle>
                            <CardDescription style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}>Distribution of services used</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer
                                width="100%"
                                height={300}
                            >
                                <RechartsPieChart>
                                    <Pie
                                        data={serviceDistributionData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        innerRadius={60}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                                        labelStyle={{
                                            fill: isDarkMode ? "#13151B" : "#0B2B26",
                                            fontSize: "12px",
                                            fontWeight: "500",
                                        }}
                                    >
                                        {serviceDistributionData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={SERVICE_COLORS[index % SERVICE_COLORS.length]}
                                                stroke={isDarkMode ? "#F3EDE3" : "#FFFFFF"} // Fixed: Use appropriate stroke for dark mode
                                                strokeWidth={2}
                                                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip isDarkMode={isDarkMode} />} />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Recent Transactions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Card
                    className="rounded-xl border-2 transition-all"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                >
                    <CardHeader
                        className="rounded-t-xl pb-4"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                        }}
                    >
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <CardTitle style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>Customer Transactions</CardTitle>
                                <CardDescription style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}>
                                    Latest transaction per customer ({filteredTransactions.length} unique customers)
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search
                                    className="absolute left-2 top-2.5 h-4 w-4"
                                    style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}
                                />
                                <Input
                                    placeholder="Search customers..."
                                    className="w-full pl-8 transition-all"
                                    style={{
                                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                        color: isDarkMode ? "#13151B" : "#0B2B26",
                                    }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div
                            className="rounded-b-xl border-2 border-t-0"
                            style={{
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                            }}
                        >
                            <table className="w-full">
                                <thead>
                                    <tr
                                        style={{
                                            backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                        }}
                                    >
                                        <th
                                            className="p-4 text-left font-medium"
                                            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                        >
                                            Customer
                                        </th>
                                        <th
                                            className="p-4 text-left font-medium"
                                            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                        >
                                            Service
                                        </th>
                                        <th
                                            className="p-4 text-left font-medium"
                                            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                        >
                                            Amount
                                        </th>
                                        <th
                                            className="p-4 text-left font-medium"
                                            style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                        >
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((transaction) => (
                                        <tr
                                            key={transaction.id}
                                            className="border-t transition-all hover:opacity-90"
                                            style={{
                                                borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                                                backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                            }}
                                        >
                                            <td
                                                className="p-4 font-medium"
                                                style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                            >
                                                {transaction.customerName}
                                            </td>
                                            <td
                                                className="p-4"
                                                style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                            >
                                                {transaction.serviceType}
                                            </td>
                                            <td
                                                className="p-4 font-medium"
                                                style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                            >
                                                ₱{transaction.totalPrice}
                                            </td>
                                            <td
                                                className="p-4"
                                                style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                            >
                                                {new Date(transaction.createdAt).toLocaleDateString("en-US", {
                                                    month: "2-digit",
                                                    day: "2-digit",
                                                    year: "numeric",
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            <div
                                className="flex items-center justify-between border-t p-4"
                                style={{
                                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                }}
                            >
                                <div
                                    className="text-sm"
                                    style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}
                                >
                                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTransactions.length)} of{" "}
                                    {filteredTransactions.length} customers
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Select
                                        value={itemsPerPage.toString()}
                                        onValueChange={(value) => {
                                            setItemsPerPage(parseInt(value));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger
                                            className="w-20 transition-all"
                                            style={{
                                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                                color: isDarkMode ? "#13151B" : "#0B2B26",
                                            }}
                                        >
                                            <SelectValue placeholder="10" />
                                        </SelectTrigger>
                                        <SelectContent
                                            style={{
                                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                                color: isDarkMode ? "#13151B" : "#0B2B26",
                                            }}
                                        >
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="transition-all"
                                        style={{
                                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                            color: isDarkMode ? "#13151B" : "#0B2B26",
                                        }}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                                    >
                                        Page <span style={{ color: CHART_COLORS.accent }}>{currentPage}</span> of{" "}
                                        <span style={{ color: CHART_COLORS.accent }}>{totalPages}</span>
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="transition-all"
                                        style={{
                                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                            color: isDarkMode ? "#13151B" : "#0B2B26",
                                        }}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default SalesReportPage;
