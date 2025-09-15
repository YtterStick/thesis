import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, DollarSign, TrendingUp, BarChart3, Package, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";

// Helper function to format date as MM/DD/YYYY (matching backend pattern)
const formatDateForBackend = (dateString) => {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

// Custom Tooltip Components
const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const isDarkMode = document.documentElement.classList.contains("dark");

        return (
            <div
                className={`rounded-lg border p-3 shadow-lg ${
                    isDarkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-900"
                }`}
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

const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const isDarkMode = document.documentElement.classList.contains("dark");
        const data = payload[0].payload;

        return (
            <div
                className={`rounded-lg border p-3 shadow-lg ${
                    isDarkMode ? "border-slate-600 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-900"
                }`}
            >
                <p className="font-medium">{data.name}</p>
                <p className="text-sm">
                    Count: <span className="font-medium">{data.value} transactions</span>
                </p>
                <p className="text-sm">
                    Percentage: <span className="font-medium">{(data.percent * 100).toFixed(1)}%</span>
                </p>
            </div>
        );
    }
    return null;
};

const SalesReportPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [dateRange, setDateRange] = useState("today");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [datesSwapped, setDatesSwapped] = useState(false);
    const { toast } = useToast();

    // State for backend data
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
    });

    useEffect(() => {
        handleDateRangeChange("today"); // Set initial date range
    }, []);

    useEffect(() => {
        fetchSalesReport();
    }, [dateRange, startDate, endDate, serviceTypeFilter]);

    const fetchSalesReport = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("authToken");
            
            // Reset swap indicator
            setDatesSwapped(false);

            // Validate custom date range
            let requestStartDate = startDate;
            let requestEndDate = endDate;
            
            if (dateRange === "custom") {
                if (!startDate || !endDate) {
                    toast({ 
                        title: "Error", 
                        description: "Please select both start and end dates for custom range", 
                        variant: "destructive" 
                    });
                    setIsLoading(false);
                    return;
                }
                
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                // Auto-swap if start date is after end date
                if (start > end) {
                    // Swap dates for the request
                    requestStartDate = endDate;
                    requestEndDate = startDate;
                    setDatesSwapped(true);
                    
                    toast({ 
                        title: "Info", 
                        description: "Start date was after end date. Dates have been auto-swapped.", 
                        variant: "default" 
                    });
                }
            }

            // Build query parameters
            const params = new URLSearchParams();
            if (dateRange !== "custom") {
                params.append("dateRange", dateRange);
            } else {
                // For custom range, we need to explicitly set dateRange to "custom"
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
                // Handle different error statuses
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

            // Update state with backend data
            setSalesData(data.salesTrend || []);
            setServiceDistributionData(data.serviceDistribution || []);
            setRecentTransactions(data.recentTransactions || []);
            setSummaryData(
                data.summary || {
                    totalSales: 0,
                    totalTransactions: 0,
                    totalCustomers: 0,
                    averageOrderValue: 0,
                    todaySales: 0,
                    yesterdaySales: 0,
                    growthPercentage: 0,
                },
            );

            // Reset to first page when data changes
            setCurrentPage(1);

            setIsLoading(false);
        } catch (error) {
            console.error(error);
            toast({ 
                title: "Error", 
                description: error.message || "Failed to load sales report", 
                variant: "destructive" 
            });
            setIsLoading(false);
        }
    };

    const handleDateRangeChange = (value) => {
        setDateRange(value);
        // Reset swap indicator when changing date range
        setDatesSwapped(false);
        
        // Set dates based on selection
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
            default:
                break;
        }
    };

    const handleStartDateChange = (newStartDate) => {
        setStartDate(newStartDate);
        if (endDate && new Date(newStartDate) > new Date(endDate)) {
            setEndDate(newStartDate); // Automatically set end date to match start date
            toast({
                title: "Info",
                description: "End date automatically adjusted to match start date",
                variant: "default"
            });
        }
    };

    const handleEndDateChange = (newEndDate) => {
        setEndDate(newEndDate);
        if (startDate && new Date(newEndDate) < new Date(startDate)) {
            setStartDate(newEndDate); // Automatically set start date to match end date
            toast({
                title: "Info",
                description: "Start date automatically adjusted to match end date",
                variant: "default"
            });
        }
    };

    // Filter transactions based on search term
    const filteredTransactions = recentTransactions.filter(
        (transaction) =>
            transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.serviceType.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Calculate pagination values
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    // Colors for service distribution chart
    const SERVICE_COLORS = ["#f59e0b", "#ef4444", "#8b5cf6", "#10b981", "#3b82f6"];

    // Colors for charts based on theme
    const getChartColors = () => {
        const isDarkMode = document.documentElement.classList.contains("dark");
        return {
            text: isDarkMode ? "#d1d5db" : "#374151",
            grid: isDarkMode ? "#4b5563" : "#e5e7eb",
            tooltipBg: isDarkMode ? "#1f2937" : "#fff",
            tooltipText: isDarkMode ? "#f3f4f6" : "#111827",
        };
    };

    const chartColors = getChartColors();

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Sales Reports</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Analyze and track your business performance</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                <CardHeader className="rounded-t-lg bg-slate-100 dark:bg-slate-800">
                    <CardTitle className="text-slate-900 dark:text-slate-50">Report Filters</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {datesSwapped && (
                        <div className="mb-4 flex items-center rounded-md bg-blue-50 p-3 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                            <Info className="mr-2 h-4 w-4" />
                            <span>Start date was after end date. Dates have been auto-swapped.</span>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-muted-foreground">Date Range</label>
                            <Select
                                value={dateRange}
                                onValueChange={handleDateRangeChange}
                            >
                                <SelectTrigger className="border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
                                    <SelectValue placeholder="Select date range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="yesterday">Yesterday</SelectItem>
                                    <SelectItem value="week">Last 7 Days</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {dateRange === "custom" && (
                            <>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-muted-foreground">Start Date</label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        max={endDate || undefined} // Disable dates after endDate
                                        onChange={(e) => handleStartDateChange(e.target.value)}
                                        className="border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-muted-foreground">End Date</label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        min={startDate || undefined} // Disable dates before startDate
                                        onChange={(e) => handleEndDateChange(e.target.value)}
                                        className="border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-muted-foreground">Service Type</label>
                            <Select
                                value={serviceTypeFilter}
                                onValueChange={setServiceTypeFilter}
                            >
                                <SelectTrigger className="border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
                                    <SelectValue placeholder="All Services" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Services</SelectItem>
                                    <SelectItem value="Wash & Dry">Wash & Dry</SelectItem>
                                    <SelectItem value="Wash">Wash Only</SelectItem>
                                    <SelectItem value="Dry">Dry Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Income Card */}
                <Card className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Income</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">₱{summaryData.totalSales.toLocaleString()}</p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                                    <span className={summaryData.growthPercentage >= 0 ? "text-green-600" : "text-red-600"}>
                                        {summaryData.growthPercentage >= 0 ? "+" : ""}
                                        {summaryData.growthPercentage}%
                                    </span>{" "}
                                    from previous period
                                </p>
                            </div>
                            <div className="rounded-lg bg-cyan-100 p-3 dark:bg-cyan-900/20">
                                <DollarSign className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Transactions Card */}
                <Card className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Transactions</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{summaryData.totalTransactions}</p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">{summaryData.totalCustomers} unique customers</p>
                            </div>
                            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
                                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Average Order Value Card */}
                <Card className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg. Order Value</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">₱{summaryData.averageOrderValue.toFixed(2)}</p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">Per transaction</p>
                            </div>
                            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Loads Card */}
                <Card className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Loads</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{summaryData.totalLoads}</p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">Total wash loads processed</p>
                            </div>
                            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/20">
                                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Sales Trend Chart */}
                <Card className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-slate-50">Sales Trend</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">Sales performance overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer
                            width="100%"
                            height={300}
                        >
                            <BarChart data={salesData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={chartColors.grid}
                                />
                                <XAxis
                                    dataKey="period"
                                    stroke={chartColors.text}
                                    tick={{ fill: chartColors.text }}
                                />
                                <YAxis
                                    stroke={chartColors.text}
                                    tick={{ fill: chartColors.text }}
                                />
                                <Tooltip content={<CustomBarTooltip />} />
                                <Legend />
                                <Bar
                                    dataKey="sales"
                                    name="Sales"
                                    fill="#0891b2"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Service Distribution Chart */}
                <Card className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-slate-50">Service Distribution</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">Distribution of services used</CardDescription>
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
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelStyle={{ fill: chartColors.text }}
                                >
                                    {serviceDistributionData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={SERVICE_COLORS[index % SERVICE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                <CardHeader className="rounded-t-lg bg-slate-100 dark:bg-slate-800">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <CardTitle className="text-slate-900 dark:text-slate-50">Customer Transactions</CardTitle>
                            <CardDescription className="text-slate-600 dark:text-slate-400">
                                Latest transaction per customer ({filteredTransactions.length} unique customers)
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <Input
                                placeholder="Search customers..."
                                className="w-full border-slate-300 pl-8 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80">
                                    <th className="p-4 text-left text-slate-900 dark:text-slate-100">Customer</th>
                                    <th className="p-4 text-left text-slate-900 dark:text-slate-100">Service</th>
                                    <th className="p-4 text-left text-slate-900 dark:text-slate-100">Amount</th>
                                    <th className="p-4 text-left text-slate-900 dark:text-slate-100">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((transaction) => (
                                    <tr
                                        key={transaction.id}
                                        className="border-t border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800/50"
                                    >
                                        <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{transaction.customerName}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">{transaction.serviceType}</td>
                                        <td className="p-4 font-medium text-slate-900 dark:text-slate-100">₱{transaction.totalPrice}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">
                                            {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                                                month: '2-digit',
                                                day: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between border-t border-slate-300 p-4 dark:border-slate-700">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
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
                                    <SelectTrigger className="w-20">
                                        <SelectValue placeholder="10" />
                                    </SelectTrigger>
                                    <SelectContent>
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
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SalesReportPage;