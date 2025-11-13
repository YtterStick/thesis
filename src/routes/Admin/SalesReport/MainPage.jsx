import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, BarChart3, Package, ChevronLeft,PhilippinePeso, ChevronRight, Info, Calendar, LineChart, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { api } from "@/lib/api-config";
import * as XLSX from "xlsx";
import { getManilaTime, getManilaDateString } from "@/utils/manilaTime";

let salesReportCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
const POLLING_INTERVAL = 10000; // 10 seconds auto-refresh

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
                style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}
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
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#0B2B26",
                        color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                    }}
                >
                    <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#0B2B26",
                        color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                    }}
                >
                    {services.map((service) => (
                        <SelectItem
                            key={service.id}
                            value={service.id}
                            className="cursor-pointer transition-colors"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
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
        const monthInfo = payload[0]?.payload?.month ? ` (${payload[0].payload.month})` : '';
        
        return (
            <div
                className="rounded-lg border-2 p-3 shadow-lg"
                style={{
                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                    borderColor: isDarkMode ? "#334155" : "#0B2B26",
                    color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                }}
            >
                <p className="font-medium">{label}{monthInfo}</p>
                <p className="text-sm">
                    Income: <span className="font-medium">₱{payload[0].value.toLocaleString()}</span>
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
                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                    borderColor: isDarkMode ? "#334155" : "#0B2B26",
                    color: isDarkMode ? "#f1f5f9" : "#0B2B26",
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
    const [isExporting, setIsExporting] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
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

    const exportDropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handlePointerDown = (e) => {
            if (exportDropdownRef.current?.contains(e.target)) return;
            setShowExportDropdown(false);
        };
        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

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

    // Smart date grouping function
    const getSmartDateGrouping = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays <= 7) {
            return "daily"; // Show daily data for up to 7 days
        } else if (diffDays <= 90) {
            return "weekly"; // Show weekly data for up to 3 months
        } else {
            return "monthly"; // Show monthly data for longer periods
        }
    };

    // Function to get month name for a given date
    const getMonthName = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "long" });
    };

    // Function to process sales data based on date range
    const processSalesData = (rawData, rangeType, start, end) => {
        if (!rawData || rawData.length === 0) return [];

        // For "This Month", show only one bar for the whole month
        if (rangeType === "month") {
            const totalSales = rawData.reduce((sum, item) => sum + (item.sales || 0), 0);
            const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

            return [
                {
                    period: currentMonth,
                    sales: totalSales,
                },
            ];
        }

        if (rangeType === "custom") {
            const grouping = getSmartDateGrouping(start, end);

            if (grouping === "weekly") {
                // Group by weeks for custom ranges longer than 1 week
                const weeklyData = {};
                rawData.forEach((item) => {
                    if (item.period) {
                        const date = new Date(item.period);
                        const weekNumber = Math.ceil(date.getDate() / 7);
                        const monthName = getMonthName(item.period);
                        const weekKey = `Week ${weekNumber}`;

                        if (!weeklyData[weekKey]) {
                            weeklyData[weekKey] = {
                                sales: 0,
                                month: monthName
                            };
                        }
                        weeklyData[weekKey].sales += item.sales || 0;
                    }
                });

                return Object.entries(weeklyData).map(([period, data]) => ({
                    period,
                    sales: data.sales,
                    month: data.month
                }));
            } else if (grouping === "monthly") {
                // Group by months for custom ranges longer than 3 months
                const monthlyData = {};
                rawData.forEach((item) => {
                    if (item.period) {
                        const date = new Date(item.period);
                        const monthKey = date.toLocaleDateString("en-US", { month: "short" });

                        if (!monthlyData[monthKey]) {
                            monthlyData[monthKey] = 0;
                        }
                        monthlyData[monthKey] += item.sales || 0;
                    }
                });

                return Object.entries(monthlyData).map(([period, sales]) => ({
                    period,
                    sales,
                }));
            }
        }

        // Default: return data as is (daily)
        return rawData;
    };

    const fetchSalesReport = useCallback(
        async (forceRefresh = false) => {
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

                // Use the api utility instead of direct fetch
                const data = await api.get(`/reports/sales?${params}`);

                // Process sales data with smart grouping
                let processedSalesData = processSalesData(data.salesTrend || [], dateRange, requestStartDate, requestEndDate);

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
                    cacheTimestamp = now;
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
        },
        [dateRange, startDate, endDate, serviceTypeFilter, toast],
    );

    useEffect(() => {
        handleDateRangeChange("today");
    }, []);

    useEffect(() => {
        fetchSalesReport();
    }, [fetchSalesReport]);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        const intervalId = setInterval(() => {
            console.log("🔄 Auto-refreshing sales report data...");
            fetchSalesReport(false);
        }, POLLING_INTERVAL);

        return () => clearInterval(intervalId);
    }, [fetchSalesReport]);

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

    const handleDateRangeChange = (value) => {
        setDateRange(value);
        setDatesSwapped(false);

        // Use Manila time instead of local time - THIS IS THE KEY FIX
        const today = getManilaTime();
        const manilaDateString = getManilaDateString();

        switch (value) {
            case "today":
                setStartDate(manilaDateString);
                setEndDate(manilaDateString);
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
                setEndDate(manilaDateString);
                break;
            case "month":
                // For "This Month", set to first day of current month to today
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                setStartDate(monthStart.toISOString().split("T")[0]);
                setEndDate(manilaDateString);
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

    const handleExportSalesReport = async (exportType = 'full') => {
        try {
            setIsExporting(true);
            setShowExportDropdown(false);

            const workbook = XLSX.utils.book_new();
            const currentDate = new Date().toISOString().split('T')[0];
            const currentDateTime = new Date().toLocaleString();

            // Helper function to create styled headers
            const createStyledHeader = (title) => [
                [title],
                [], // Empty row for spacing
            ];

            // Helper function to add styled tables - FIXED: Only add headers once
            const addStyledTable = (sheet, data, startRow, hasHeader = true) => {
                data.forEach((row, rowIndex) => {
                    row.forEach((cell, colIndex) => {
                        const cellRef = XLSX.utils.encode_cell({ r: startRow + rowIndex, c: colIndex });
                        
                        // Style headers (first row of data if hasHeader is true)
                        if (hasHeader && rowIndex === 0) {
                            sheet[cellRef] = {
                                v: cell,
                                s: {
                                    font: { bold: true, color: { rgb: "FFFFFF" } },
                                    fill: { fgColor: { rgb: "2C5F2D" } }, // Dark green
                                    alignment: { horizontal: "center", vertical: "center" },
                                    border: {
                                        top: { style: "thin", color: { rgb: "1C3F3A" } },
                                        left: { style: "thin", color: { rgb: "1C3F3A" } },
                                        bottom: { style: "thin", color: { rgb: "1C3F3A" } },
                                        right: { style: "thin", color: { rgb: "1C3F3A" } },
                                    },
                                }
                            };
                        } else {
                            // Style data rows
                            sheet[cellRef] = {
                                v: cell,
                                s: {
                                    border: {
                                        left: { style: "thin", color: { rgb: "E0E0E0" } },
                                        right: { style: "thin", color: { rgb: "E0E0E0" } },
                                        bottom: { style: "thin", color: { rgb: "E0E0E0" } },
                                    },
                                    alignment: { vertical: "center" }
                                }
                            };
                            
                            // Alternate row coloring
                            if (rowIndex % 2 === 1) {
                                sheet[cellRef].s.fill = { fgColor: { rgb: "F8F9FA" } };
                            }
                            
                            // Right align numeric columns
                            if (typeof cell === 'number' || (typeof cell === 'string' && cell.includes('₱'))) {
                                sheet[cellRef].s.alignment = { horizontal: "right", vertical: "center" };
                            }
                        }
                    });
                });
                
                return startRow + data.length;
            };

            if (exportType === 'summary' || exportType === 'full') {
                // Summary Sheet - Enhanced with better formatting
                const summaryHeader = createStyledHeader('STARWASH SALES REPORT SUMMARY');
                
                const reportInfo = [
                    ['Report Generated', currentDateTime],
                    ['Date Range', dateRange.charAt(0).toUpperCase() + dateRange.slice(1)],
                    ['Start Date', startDate],
                    ['End Date', endDate],
                    ['Service Type', serviceTypeFilter === 'all' ? 'All Services' : serviceTypeFilter],
                    ['', ''], // Spacer
                ];

                const financialSummaryHeader = [['FINANCIAL PERFORMANCE']];
                const financialSummary = [
                    ['Metric', 'Value'],
                    ['Total Income', `₱${summaryData.totalSales.toLocaleString()}`],
                    ['Total Transactions', summaryData.totalTransactions.toLocaleString()],
                    ['Average Order Value', `₱${summaryData.averageOrderValue.toFixed(2)}`],
                    ['Growth Percentage', `${summaryData.growthPercentage}%`],
                    ['', ''], // Spacer
                ];

                const operationalSummaryHeader = [['OPERATIONAL METRICS']];
                const operationalSummary = [
                    ['Metric', 'Value'],
                    ['Total Customers', summaryData.totalCustomers.toLocaleString()],
                    ['Total Loads Processed', summaryData.totalLoads.toLocaleString()],
                    ['Average Loads per Transaction', (summaryData.totalLoads / summaryData.totalTransactions).toFixed(1)],
                ];

                const summaryDataSheet = [
                    ...summaryHeader,
                    ...reportInfo,
                    ...financialSummaryHeader,
                    ...financialSummary,
                    ...operationalSummaryHeader,
                    ...operationalSummary,
                ];

                const summarySheet = XLSX.utils.aoa_to_sheet(summaryDataSheet);
                
                // Merge header cells for better appearance
                if (!summarySheet['!merges']) summarySheet['!merges'] = [];
                summarySheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
                summarySheet['!merges'].push({ s: { r: 8, c: 0 }, e: { r: 8, c: 1 } });
                summarySheet['!merges'].push({ s: { r: 15, c: 0 }, e: { r: 15, c: 1 } });

                XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
            }

            if (exportType === 'trend' || exportType === 'full') {
                // Sales Trend Sheet - Enhanced with tables
                const trendHeader = createStyledHeader('SALES TREND ANALYSIS');
                
                const summaryRow = [
                    ['Period Summary', 'Total Sales', 'Average per Period'],
                    [
                        `${salesData.length} ${salesData.length === 1 ? 'Period' : 'Periods'}`,
                        `₱${salesData.reduce((sum, item) => sum + item.sales, 0).toLocaleString()}`,
                        `₱${(salesData.reduce((sum, item) => sum + item.sales, 0) / salesData.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    ],
                    [], // Spacer
                ];

                // FIXED: Only one header row
                const trendData = [
                    ['Period', 'Sales (₱)', 'Percentage of Total'],
                    ...salesData.map(item => {
                        const totalSales = salesData.reduce((sum, i) => sum + i.sales, 0);
                        const percentage = totalSales > 0 ? (item.sales / totalSales * 100) : 0;
                        return [
                            item.period,
                            item.sales,
                            `${percentage.toFixed(1)}%`
                        ];
                    })
                ];

                const trendDataSheet = [
                    ...trendHeader,
                    ...summaryRow,
                    ...trendData,
                ];

                const trendSheet = XLSX.utils.aoa_to_sheet(trendDataSheet);
                
                // Style the trend sheet
                addStyledTable(trendSheet, trendData, 5); // Start at row 5 (after headers and summary)
                
                XLSX.utils.book_append_sheet(workbook, trendSheet, 'Sales Trend');
            }

            if (exportType === 'services' || exportType === 'full') {
                // Service Distribution Sheet - Enhanced with tables
                const servicesHeader = createStyledHeader('SERVICE DISTRIBUTION ANALYSIS');
                
                const totalServiceTransactions = serviceDistributionData.reduce((sum, item) => sum + item.value, 0);
                
                // FIXED: Only one header row
                const serviceData = [
                    ['Service Type', 'Transaction Count', 'Percentage', 'Revenue Contribution'],
                    ...serviceDistributionData.map(item => {
                        const percentage = totalServiceTransactions > 0 ? (item.value / totalServiceTransactions * 100) : 0;
                        // Estimate revenue contribution based on average order value
                        const estimatedRevenue = item.value * summaryData.averageOrderValue;
                        return [
                            item.name,
                            item.value,
                            `${percentage.toFixed(1)}%`,
                            `₱${estimatedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ];
                    })
                ];

                const servicesDataSheet = [
                    ...servicesHeader,
                    ['Total Services Offered:', serviceDistributionData.length],
                    ['Total Transactions:', totalServiceTransactions],
                    [], // Spacer
                    ...serviceData,
                ];

                const servicesSheet = XLSX.utils.aoa_to_sheet(servicesDataSheet);
                
                // Style the services sheet
                addStyledTable(servicesSheet, serviceData, 6); // Start at row 6
                
                XLSX.utils.book_append_sheet(workbook, servicesSheet, 'Service Analysis');
            }

            if (exportType === 'transactions' || exportType === 'full') {
                // Transactions Sheet - FIXED: No duplicate headers
                const transactionsHeader = createStyledHeader('CUSTOMER TRANSACTIONS');
                
                // FIXED: Create header row separately from data
                const transactionHeaders = [['Transaction Date', 'Customer Name', 'Service Type', 'Amount (₱)', 'Loads', 'Status']];
                
                const transactionData = recentTransactions.map(transaction => [
                    new Date(transaction.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    }),
                    transaction.customerName,
                    transaction.serviceType,
                    transaction.totalPrice,
                    transaction.loads || 1,
                    'Completed'
                ]);

                const summaryStats = [
                    [],
                    ['Transaction Summary', '', '', '', '', ''],
                    ['Total Transactions:', recentTransactions.length, '', 'Total Revenue:', `₱${recentTransactions.reduce((sum, t) => sum + t.totalPrice, 0).toLocaleString()}`, ''],
                    ['Average Transaction:', `₱${(recentTransactions.reduce((sum, t) => sum + t.totalPrice, 0) / recentTransactions.length).toFixed(2)}`, '', 'Period Covered:', `${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}`, ''],
                    [], // Spacer
                ];

                // FIXED: Combine headers and data without duplication
                const transactionsDataSheet = [
                    ...transactionsHeader,
                    ...summaryStats,
                    ...transactionHeaders, // Header row
                    ...transactionData,    // Data rows
                ];

                const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsDataSheet);
                
                // Style the transactions sheet - FIXED: Start at correct row
                const allTransactionData = [transactionHeaders[0], ...transactionData];
                addStyledTable(transactionsSheet, allTransactionData, 8); // Start at row 8
                
                XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
            }

            // Set column widths for all sheets
            const colWidths = [
                { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }
            ];
            
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                if (sheet) {
                    sheet['!cols'] = colWidths;
                    
                    // Add auto-filter to data tables
                    if (sheetName !== 'Executive Summary') {
                        const range = XLSX.utils.decode_range(sheet['!ref']);
                        // Set auto-filter for data rows (skip headers)
                        sheet['!autofilter'] = {
                            ref: XLSX.utils.encode_range({
                                s: { r: range.s.r + 2, c: range.s.c },
                                e: { r: range.e.r, c: range.e.c }
                            })
                        };
                    }
                }
            });

            // Generate filename based on export type
            const filename = `StarWash_Sales_Report_${exportType.charAt(0).toUpperCase() + exportType.slice(1)}_${dateRange}_${currentDate}.xlsx`;

            XLSX.writeFile(workbook, filename);

            toast({
                title: "Export Successful",
                description: `Sales report has been exported`,
                variant: "default",
            });

        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "Export Failed",
                description: "Failed to export sales report. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
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

    // Updated color scheme to match admin dashboard
    const CHART_COLORS = {
        primary: "#0891B2", // Cyan from admin dashboard area chart
        secondary: "#0E7490", // Darker cyan for gradient
        accent: "#3DD9B6",
        highlight: "#60A5FA",
        complementary: "#FB923C",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
    };

    // Service colors that work well in both light and dark mode
    const SERVICE_COLORS = [
        "#0891B2", // Cyan
        "#10B981", // Emerald
        "#F59E0B", // Amber
        "#EF4444", // Red
        "#8B5CF6", // Violet
        "#EC4899", // Pink
        "#14B8A6", // Teal
    ];

    const summaryCards = [
        {
            label: "Total Income",
            value: animatedSummary.totalSales,
            icon: <PhilippinePeso size={26} />, 
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
                    fill={isDarkMode ? "#f1f5f9" : "#0B2B26"}
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
                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                borderColor: isDarkMode ? "#334155" : "#0B2B26",
            }}
        >
            <div className="mb-4 flex items-center justify-between">
                <div
                    className="w-fit animate-pulse rounded-lg p-2"
                    style={{
                        backgroundColor: isDarkMode ? "#334155" : "#E0EAE8",
                    }}
                >
                    <div className="h-6 w-6"></div>
                </div>
                <div
                    className="h-8 w-24 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#334155" : "#E0EAE8",
                    }}
                ></div>
            </div>

            <div className="space-y-2">
                <div
                    className="mb-2 h-5 w-32 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#334155" : "#E0EAE8",
                    }}
                ></div>
                <div
                    className="h-4 w-44 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#334155" : "#E0EAE8",
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
                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                borderColor: isDarkMode ? "#334155" : "#0B2B26",
            }}
        >
            <div className="mb-5">
                <div
                    className="mb-2 h-6 w-44 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#334155" : "#E0EAE8",
                    }}
                ></div>
                <div
                    className="h-4 w-36 animate-pulse rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#334155" : "#E0EAE8",
                    }}
                ></div>
            </div>
            <div
                className="h-[300px] w-full animate-pulse rounded-lg"
                style={{
                    backgroundColor: isDarkMode ? "#334155" : "#F3EDE3",
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
                        backgroundColor: isDarkMode ? "#334155" : "#E0EAE8",
                    }}
                ></div>
                <div className="space-y-2">
                    <div
                        className="h-6 w-44 animate-pulse rounded-lg"
                        style={{
                            backgroundColor: isDarkMode ? "#334155" : "#E0EAE8",
                        }}
                    ></div>
                    <div
                        className="h-4 w-56 animate-pulse rounded"
                        style={{
                            backgroundColor: isDarkMode ? "#334155" : "#E0EAE8",
                        }}
                    ></div>
                </div>
            </div>
        </motion.div>
    );

    // Show skeleton loader only during initial load
    if (initialLoad) {
        return (
            <div 
                className="space-y-5 overflow-visible px-6 pb-5 pt-4 min-h-screen"
                style={{
                    backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                }}
            >
                <SkeletonHeader />

                {/* Filters Skeleton */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border-2 p-5 transition-all"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#0B2B26",
                    }}
                >
                    <div
                        className="mb-4 h-6 w-32 animate-pulse rounded"
                        style={{
                            backgroundColor: isDarkMode ? "#334155" : "#E0EAE8",
                        }}
                    ></div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="space-y-2"
                            >
                                <div
                                    className="h-4 w-20 animate-pulse rounded"
                                    style={{
                                        backgroundColor: isDarkMode ? "#334155" : "#E0EAE8",
                                    }}
                                ></div>
                                <div
                                    className="h-10 w-full animate-pulse rounded"
                                    style={{
                                        backgroundColor: isDarkMode ? "#334155" : "#F3EDE3",
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
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#0B2B26",
                    }}
                >
                    <div
                        className="mb-4 h-6 w-44 animate-pulse rounded"
                        style={{
                            backgroundColor: isDarkMode ? "#334155" : "#E0EAE8",
                        }}
                    ></div>
                    <div
                        className="h-[400px] w-full animate-pulse rounded-lg"
                        style={{
                            backgroundColor: isDarkMode ? "#334155" : "#F3EDE3",
                        }}
                    ></div>
                </motion.div>
            </div>
        );
    }

    return (
        <div 
            className="space-y-5 overflow-visible px-6 pb-5 pt-4 min-h-screen"
            style={{
                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
            }}
        >
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
                            backgroundColor: isDarkMode ? "#1e293b" : "#0f172a",
                            color: isDarkMode ? "#f1f5f9" : "#f1f5f9",
                        }}
                    >
                        <LineChart size={22} style={{ color: isDarkMode ? "#f1f5f9" : "#f1f5f9" }} />
                    </motion.div>
                    <div>
                        <p
                            className="text-xl font-bold"
                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                        >
                            Sales Reports
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                        >
                            Analyze and track your business performance
                        </p>
                    </div>
                </div>

                {/* Export Button */}
                <div className="relative" ref={exportDropdownRef}>
                    <Button
                        onClick={() => setShowExportDropdown(!showExportDropdown)}
                        className="transition-all"
                        style={{
                            backgroundColor: "#10B981",
                            color: "#FFFFFF",
                            border: "2px solid #10B981",
                        }}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        {isExporting ? "Exporting..." : "Export Report"}
                    </Button>

                    {showExportDropdown && (
                        <div
                            className="absolute right-0 z-50 mt-2 w-48 rounded-lg border-2 p-2 shadow-lg"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                            }}
                        >
                            <button
                                onClick={() => handleExportSalesReport('full')}
                                className="w-full rounded px-3 py-2 text-left text-sm transition-all hover:bg-opacity-20"
                                style={{
                                    color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                    backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                }}
                            >
                                📊 Full Report
                                <div className="mt-1 text-xs opacity-70">Complete analysis with all data</div>
                            </button>

                            <div className="my-2 border-t" style={{ borderColor: isDarkMode ? "#334155" : "#cbd5e1" }} />

                            <button
                                onClick={() => handleExportSalesReport('summary')}
                                className="w-full rounded px-3 py-2 text-left text-sm transition-all hover:bg-opacity-20"
                                style={{
                                    color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                    backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                }}
                            >
                                📈 Executive Summary
                                <div className="mt-1 text-xs opacity-70">Key metrics and performance</div>
                            </button>

                            <button
                                onClick={() => handleExportSalesReport('trend')}
                                className="w-full rounded px-3 py-2 text-left text-sm transition-all hover:bg-opacity-20"
                                style={{
                                    color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                    backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                }}
                            >
                                📅 Sales Trend
                                <div className="mt-1 text-xs opacity-70">Revenue over time analysis</div>
                            </button>

                            <button
                                onClick={() => handleExportSalesReport('transactions')}
                                className="w-full rounded px-3 py-2 text-left text-sm transition-all hover:bg-opacity-20"
                                style={{
                                    color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                    backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                }}
                            >
                                👥 Customer Transactions
                                <div className="mt-1 text-xs opacity-70">Detailed transaction data</div>
                            </button>
                        </div>
                    )}
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
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}
                >
                    <CardHeader
                        className="rounded-t-xl pb-4"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                        }}
                    >
                        <CardTitle style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}>Report Filters</CardTitle>
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

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="space-y-2">
                                <Label
                                    className="mb-1 block"
                                    style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}
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
                                            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                            borderColor: isDarkMode ? "#334155" : "#0B2B26",
                                            color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                                        }}
                                    >
                                        <SelectValue placeholder="Select date range" />
                                    </SelectTrigger>
                                    <SelectContent
                                        style={{
                                            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                            borderColor: isDarkMode ? "#334155" : "#0B2B26",
                                            color: isDarkMode ? "#f1f5f9" : "#0B2B26",
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
                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}
                                        >
                                            Start Date
                                        </Label>
                                        <div className="relative">
                                            <Calendar 
                                                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" 
                                                style={{ color: isDarkMode ? "#94a3b8" : "#0B2B26/70" }} 
                                            />
                                            <Input
                                                type="date"
                                                value={startDate}
                                                max={endDate || undefined}
                                                onChange={(e) => handleStartDateChange(e.target.value)}
                                                className="w-full pl-10 transition-all"
                                                style={{
                                                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                                    borderColor: isDarkMode ? "#334155" : "#0B2B26",
                                                    color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label
                                            className="mb-1 block"
                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}
                                        >
                                            End Date
                                        </Label>
                                        <div className="relative">
                                            <Calendar 
                                                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" 
                                                style={{ color: isDarkMode ? "#94a3b8" : "#0B2B26/70" }} 
                                            />
                                            <Input
                                                type="date"
                                                value={endDate}
                                                min={startDate || undefined}
                                                onChange={(e) => handleEndDateChange(e.target.value)}
                                                className="w-full pl-10 transition-all"
                                                style={{
                                                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                                    borderColor: isDarkMode ? "#334155" : "#0B2B26",
                                                    color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <ServiceSelector
                                services={services}
                                serviceId={serviceTypeFilter}
                                onChange={handleServiceChange}
                                isLocked={false}
                            />

                            <div className="space-y-2">
                                <Label
                                    className="mb-1 block"
                                    style={{ color: isDarkMode ? "#f1f5f9" : "#0B2B26" }}
                                >
                                    Search Customers
                                </Label>
                                <div className="relative">
                                    <Search 
                                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" 
                                        style={{ color: isDarkMode ? "#94a3b8" : "#0B2B26/70" }} 
                                    />
                                    <Input
                                        type="text"
                                        placeholder="Search by name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 transition-all"
                                        style={{
                                            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                            borderColor: isDarkMode ? "#334155" : "#0B2B26",
                                            color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                                        }}
                                    />
                                </div>
                            </div>
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
                                <div
                                    className="text-2xl font-bold"
                                    style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                >
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
                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                            >
                                {label}
                            </h3>
                            <p
                                className="text-sm"
                                style={{
                                    color: trend !== undefined ? (trend >= 0 ? "#10B981" : "#EF4444") : isDarkMode ? "#94a3b8" : "#475569",
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
                            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                        }}
                    >
                        <CardHeader>
                            <CardTitle style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>Income Trend</CardTitle>
                            <CardDescription style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}>
                                {dateRange === "month" ? "Current month total income" : "Income performance overview"}
                            </CardDescription>
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
                                        stroke={isDarkMode ? "#334155" : "#e2e8f0"}
                                    />
                                    <XAxis
                                        dataKey="period"
                                        stroke={isDarkMode ? "#cbd5e1" : "#475569"}
                                        tickLine={{ stroke: isDarkMode ? "#cbd5e1" : "#475569" }}
                                        interval={0} // Force show all labels
                                        tick={renderCustomXAxisTick}
                                        height={50} // Increase height to accommodate all labels
                                    />
                                    <YAxis
                                        stroke={isDarkMode ? "#cbd5e1" : "#475569"}
                                        tick={{ fill: isDarkMode ? "#cbd5e1" : "#475569" }}
                                        tickLine={{ stroke: isDarkMode ? "#cbd5e1" : "#475569" }}
                                        tickFormatter={(value) => `₱${value > 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                                    />
                                    <Tooltip
                                        content={<CustomBarTooltip isDarkMode={isDarkMode} />}
                                        cursor={false}
                                        contentStyle={{
                                            backgroundColor: isDarkMode ? "#0f172a" : "#FFFFFF",
                                            border: `2px solid ${isDarkMode ? "#334155" : "#cbd5e1"}`,
                                            color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                            fontSize: "0.8rem",
                                            fontWeight: "500",
                                            borderRadius: "0.5rem",
                                            padding: "0.6rem",
                                        }}
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
                                    >
                                        {salesData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`}
                                                fill={CHART_COLORS.primary}
                                                stroke={CHART_COLORS.secondary}
                                                strokeWidth={1}
                                            />
                                        ))}
                                    </Bar>
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
                            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                        }}
                    >
                        <CardHeader>
                            <CardTitle style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>Service Distribution</CardTitle>
                            <CardDescription style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}>Distribution of services used</CardDescription>
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
                                            fill: isDarkMode ? "#f1f5f9" : "#0f172a",
                                            fontSize: "12px",
                                            fontWeight: "500",
                                        }}
                                    >
                                        {serviceDistributionData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={SERVICE_COLORS[index % SERVICE_COLORS.length]}
                                                stroke={isDarkMode ? "#1e293b" : "#FFFFFF"}
                                                strokeWidth={2}
                                                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        content={<CustomPieTooltip isDarkMode={isDarkMode} />}
                                        contentStyle={{
                                            backgroundColor: isDarkMode ? "#0f172a" : "#FFFFFF",
                                            border: `2px solid ${isDarkMode ? "#334155" : "#cbd5e1"}`,
                                            color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                            fontSize: "0.8rem",
                                            fontWeight: "500",
                                            borderRadius: "0.5rem",
                                            padding: "0.6rem",
                                        }}
                                    />
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
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}
                >
                    <CardHeader
                        className="rounded-t-xl pb-4"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                        }}
                    >
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <CardTitle style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>Customer Transactions</CardTitle>
                                <CardDescription style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}>
                                    Latest transaction per customer ({filteredTransactions.length} unique customers)
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search
                                    className="absolute left-2 top-2.5 h-4 w-4"
                                    style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}
                                />
                                <Input
                                    placeholder="Search customers..."
                                    className="w-full pl-8 transition-all"
                                    style={{
                                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                        color: isDarkMode ? "#f1f5f9" : "#0f172a",
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
                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                            }}
                        >
                            <table className="w-full">
                                <thead>
                                    <tr
                                        style={{
                                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                        }}
                                    >
                                        <th
                                            className="p-4 text-left font-medium"
                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                        >
                                            Customer
                                        </th>
                                        <th
                                            className="p-4 text-left font-medium"
                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                        >
                                            Service
                                        </th>
                                        <th
                                            className="p-4 text-left font-medium"
                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                        >
                                            Amount
                                        </th>
                                        <th
                                            className="p-4 text-left font-medium"
                                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
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
                                                borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                                                backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "#f8fafc",
                                            }}
                                        >
                                            <td
                                                className="p-4 font-medium"
                                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                            >
                                                {transaction.customerName}
                                            </td>
                                            <td
                                                className="p-4"
                                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                            >
                                                {transaction.serviceType}
                                            </td>
                                            <td
                                                className="p-4 font-medium"
                                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                            >
                                                ₱{transaction.totalPrice}
                                            </td>
                                            <td
                                                className="p-4"
                                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
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
                                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                }}
                            >
                                <div
                                    className="text-sm"
                                    style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}
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
                                                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                                color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                            }}
                                        >
                                            <SelectValue placeholder="10" />
                                        </SelectTrigger>
                                        <SelectContent
                                            style={{
                                                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                                color: isDarkMode ? "#f1f5f9" : "#0f172a",
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
                                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                            color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                        }}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
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
                                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                            color: isDarkMode ? "#f1f5f9" : "#0f172a",
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