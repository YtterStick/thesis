import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package,
  BarChart3,
  PieChart,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const SalesReportPage = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Sample data for charts and reports
  const salesData = [
    { day: 'Mon', sales: 12500, transactions: 45, customers: 38 },
    { day: 'Tue', sales: 15800, transactions: 52, customers: 45 },
    { day: 'Wed', sales: 14200, transactions: 48, customers: 42 },
    { day: 'Thu', sales: 18900, transactions: 61, customers: 53 },
    { day: 'Fri', sales: 21500, transactions: 72, customers: 65 },
    { day: 'Sat', sales: 27800, transactions: 89, customers: 78 },
    { day: 'Sun', sales: 19500, transactions: 63, customers: 56 },
  ];

  const paymentMethodsData = [
    { name: 'Cash', value: 65, color: '#10b981' },
    { name: 'GCash', value: 25, color: '#3b82f6' },
    { name: 'Bank Transfer', value: 10, color: '#8b5cf6' },
  ];

  const serviceTypeData = [
    { name: 'Wash & Fold', value: 45, color: '#f59e0b' },
    { name: 'Dry Clean', value: 30, color: '#ef4444' },
    { name: 'Ironing', value: 15, color: '#06b6d4' },
    { name: 'Special', value: 10, color: '#8b5cf6' },
  ];

  const recentTransactions = [
    { id: 1, customer: 'John Doe', amount: 1250, paymentMethod: 'Cash', service: 'Wash & Fold', date: '2024-01-15 14:30', status: 'completed' },
    { id: 2, customer: 'Jane Smith', amount: 850, paymentMethod: 'GCash', service: 'Dry Clean', date: '2024-01-15 13:15', status: 'completed' },
    { id: 3, customer: 'Mike Johnson', amount: 2100, paymentMethod: 'Cash', service: 'Wash & Fold', date: '2024-01-15 12:45', status: 'completed' },
    { id: 4, customer: 'Sarah Wilson', amount: 950, paymentMethod: 'Bank Transfer', service: 'Ironing', date: '2024-01-15 11:20', status: 'completed' },
    { id: 5, customer: 'Tom Brown', amount: 1750, paymentMethod: 'GCash', service: 'Special', date: '2024-01-15 10:05', status: 'completed' },
  ];

  const summaryData = {
    totalSales: 125800,
    totalTransactions: 370,
    totalCustomers: 320,
    averageOrderValue: 340,
    todaySales: 19500,
    yesterdaySales: 27800,
    growthPercentage: -29.8
  };

  useEffect(() => {
    fetchSalesReport();
  }, [dateRange, startDate, endDate, paymentMethodFilter, serviceTypeFilter]);

  const fetchSalesReport = async () => {
    try {
      setIsLoading(true);
      // Simulate API call - replace with actual API endpoint
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load sales report", variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleExportReport = (format) => {
    toast({
      title: "Export Started",
      description: `Exporting report as ${format.toUpperCase()}...`,
    });
    // Simulate export functionality
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Report exported as ${format.toUpperCase()} successfully`,
      });
    }, 2000);
  };

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    // Set dates based on selection
    const today = new Date();
    switch (value) {
      case 'today':
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setStartDate(yesterday.toISOString().split('T')[0]);
        setEndDate(yesterday.toISOString().split('T')[0]);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        setStartDate(weekStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(1);
        setStartDate(monthStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      default:
        break;
    }
  };

  const filteredTransactions = recentTransactions.filter(transaction =>
    transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Sales Reports</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Analyze and track your business performance</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
            onClick={() => handleExportReport('pdf')}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
            onClick={() => handleExportReport('excel')}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-100 dark:bg-slate-800 rounded-t-lg">
          <CardTitle className="text-slate-900 dark:text-slate-50">Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-muted-foreground mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700">
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

            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-muted-foreground mb-2 block">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-muted-foreground mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-muted-foreground mb-2 block">Payment Method</label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-muted-foreground mb-2 block">Service Type</label>
              <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700">
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="wash">Wash & Fold</SelectItem>
                  <SelectItem value="dry">Dry Clean</SelectItem>
                  <SelectItem value="iron">Ironing</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Sales</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  ₱{summaryData.totalSales.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                  <span className={summaryData.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {summaryData.growthPercentage >= 0 ? '+' : ''}{summaryData.growthPercentage}%
                  </span> from yesterday
                </p>
              </div>
              <div className="p-3 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Transactions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {summaryData.totalTransactions}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                  {summaryData.totalCustomers} unique customers
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg. Order Value</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  ₱{summaryData.averageOrderValue}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                  Per transaction
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Today's Sales</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  ₱{summaryData.todaySales.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                  {recentTransactions.length} transactions today
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-50">Sales Trend (Last 7 Days)</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Daily sales performance overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`₱${value.toLocaleString()}`, 'Sales']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="sales" name="Sales" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Chart */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-50">Payment Methods</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Distribution of payment methods used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="shadow-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-100 dark:bg-slate-800 rounded-t-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-50">Recent Transactions</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Latest customer transactions
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <Input
                placeholder="Search transactions..."
                className="pl-8 w-full border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700">
                  <th className="text-left p-4 text-slate-900 dark:text-slate-100">Customer</th>
                  <th className="text-left p-4 text-slate-900 dark:text-slate-100">Service</th>
                  <th className="text-left p-4 text-slate-900 dark:text-slate-100">Amount</th>
                  <th className="text-left p-4 text-slate-900 dark:text-slate-100">Payment</th>
                  <th className="text-left p-4 text-slate-900 dark:text-slate-100">Date</th>
                  <th className="text-left p-4 text-slate-900 dark:text-slate-100">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{transaction.customer}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{transaction.service}</td>
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">₱{transaction.amount}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300">
                        {transaction.paymentMethod}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{transaction.date}</td>
                    <td className="p-4">
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        {transaction.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesReportPage;