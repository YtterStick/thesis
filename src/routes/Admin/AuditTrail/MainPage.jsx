import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { 
  History, 
  Search, 
  Filter, 
  User, 
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API_BASE_URL = "https://thesis-g0pr.onrender.com/api";
const ALLOWED_SKEW_MS = 5000;

const isTokenExpired = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp * 1000;
    const now = Date.now();
    return exp + ALLOWED_SKEW_MS < now;
  } catch (err) {
    console.warn("❌ Failed to decode token:", err);
    return true;
  }
};

const secureFetch = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem("authToken");
  if (!token || typeof token !== "string" || !token.includes(".") || isTokenExpired(token)) {
    window.location.href = "/login";
    throw new Error("Token expired or invalid");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} - ${errorText}`);
  }
  return response.json();
};

// Skeleton Loader Components
const SkeletonCard = ({ isDarkMode }) => (
  <Card className="rounded-xl border-2 animate-pulse"
    style={{
      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
    }}
  >
    <CardContent className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search Skeleton */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 rounded bg-gray-300" />
          </div>
          <div className="h-10 rounded-lg bg-gray-300 pl-10" />
        </div>
        
        {/* Filter Select Skeletons */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-gray-300" />
        ))}
      </div>
    </CardContent>
  </Card>
);

const SkeletonTableRow = ({ isDarkMode, index }) => (
  <TableRow 
    style={{ 
      backgroundColor: index % 2 === 0 
        ? (isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(243, 237, 227, 0.9)") 
        : "transparent",
      borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
    }}
  >
    <TableCell>
      <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse" />
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
        <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse" />
      </div>
    </TableCell>
    <TableCell>
      <div className="h-6 bg-gray-300 rounded w-20 animate-pulse" />
    </TableCell>
    <TableCell>
      <div className="h-4 bg-gray-300 rounded w-1/3 animate-pulse" />
    </TableCell>
    <TableCell>
      <div className="h-4 bg-gray-300 rounded w-full animate-pulse" />
    </TableCell>
  </TableRow>
);

const SkeletonTable = ({ isDarkMode }) => (
  <Card className="rounded-xl border-2"
    style={{
      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
    }}
  >
    <CardHeader className="flex flex-row items-center justify-between">
      <div className="h-6 bg-gray-300 rounded w-48 animate-pulse" />
      <div className="flex items-center gap-2">
        <div className="h-4 bg-gray-300 rounded w-12 animate-pulse" />
        <div className="h-10 bg-gray-300 rounded w-20 animate-pulse" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="rounded-lg border-2 overflow-hidden"
        style={{
          borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
        }}
      >
        <Table>
          <TableHeader>
            <TableRow style={{ 
              backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
            }}>
              {["Timestamp", "User", "Action", "Role", "Description"].map((header) => (
                <TableHead key={header} style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <SkeletonTableRow key={index} isDarkMode={isDarkMode} index={index} />
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Skeleton Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="h-4 bg-gray-300 rounded w-48 animate-pulse" />
        <div className="flex items-center gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-300 rounded w-10 animate-pulse" />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

const AuditTrailPage = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [users, setUsers] = useState([]);
  const [knownUsernames, setKnownUsernames] = useState(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const actionTypes = [
    { value: "all", label: "All Actions" },
    { value: "LOGIN", label: "Login" },
    { value: "LOGOUT", label: "Logout" },
    { value: "CREATE", label: "Create" },
    { value: "UPDATE", label: "Update" },
    { value: "DELETE", label: "Delete" },
    { value: "PRINT", label: "Print" },
    { value: "TRANSACTION", label: "Transaction" },
  ];

  const pageSizeOptions = [10, 25, 50, 100];

  const fetchUsers = useCallback(async () => {
    try {
      const data = await secureFetch("/api/accounts");
      console.log("👥 Users response:", data);
      
      const userList = data.users || data || [];
      const usernameSet = new Set();
      const uniqueUsers = userList.map(user => {
        const username = user.username || user.email;
        if (username) {
          usernameSet.add(username);
        }
        return {
          value: username,
          label: username
        };
      }).filter(user => user.value); // Filter out any null/undefined usernames
      
      setKnownUsernames(usernameSet);
      setUsers([
        { value: "all", label: "All Users" },
        ...uniqueUsers,
        { value: "unknown", label: "Unknown" }
      ]);
    } catch (error) {
      console.error("❌ Failed to fetch users:", error);
      // Fallback to "All Users" and "Unknown"
      setUsers([
        { value: "all", label: "All Users" },
        { value: "unknown", label: "Unknown" }
      ]);
      setKnownUsernames(new Set());
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await secureFetch("/api/audit-logs");
      console.log("📊 Audit logs response:", data);
      
      const logs = data.logs || data || [];
      console.log(`📋 Total logs found: ${logs.length}`);
      
      setAuditLogs(logs);
      
      // Fetch users separately
      await fetchUsers();
    } catch (error) {
      console.error("❌ Failed to fetch audit logs:", error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Helper function to check if a log entry belongs to an unknown user
  const isUnknownUser = (log) => {
    if (!log.username) return true;
    return !knownUsernames.has(log.username);
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = selectedAction === "all" || log.action === selectedAction;
    
    // Handle user filtering including "unknown" case
    const matchesUser = selectedUser === "all" || 
      (selectedUser === "unknown" ? isUnknownUser(log) : log.username === selectedUser);

    let matchesDate = true;
    if (dateRange !== "all" && log.timestamp) {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      
      switch (dateRange) {
        case "today":
          matchesDate = logDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          matchesDate = logDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          matchesDate = logDate >= monthAgo;
          break;
        default:
          matchesDate = true;
      }
    }

    return matchesSearch && matchesAction && matchesUser && matchesDate;
  });

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedAction, selectedUser, dateRange, itemsPerPage]);

  const getActionColor = (action) => {
    switch (action) {
      case "LOGIN": return "#10B981";
      case "LOGOUT": return "#6B7280";
      case "CREATE": return "#3B82F6";
      case "UPDATE": return "#F59E0B";
      case "DELETE": return "#EF4444";
      case "PRINT": return "#EC4899";
      case "TRANSACTION": return "#06B6D4";
      default: return isDarkMode ? "#9CA3AF" : "#6B7280";
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  return (
    <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="rounded-lg p-2"
            style={{
              backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
              color: "#F3EDE3",
            }}
          >
            <History size={22} />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
              Audit Trail
            </h1>
            <p className="text-sm" style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
              Monitor all system activities and user actions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchAuditLogs}
            className="flex items-center gap-2 transition-all hover:opacity-80"
            style={{
              backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
              color: "#F3EDE3",
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Filters - Show skeleton when loading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {loading ? (
          <SkeletonCard isDarkMode={isDarkMode} />
        ) : (
          <Card className="rounded-xl border-2"
            style={{
              borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
              backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
            }}
          >
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                    size={16} 
                    style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}
                  />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-lg border-2 transition-all"
                    style={{
                      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                      backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                      color: isDarkMode ? "#13151B" : "#0B2B26",
                    }}
                  />
                </div>

                {/* Action Filter */}
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger className="rounded-lg border-2 transition-all"
                    style={{
                      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                      backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                      color: isDarkMode ? "#13151B" : "#0B2B26",
                    }}
                  >
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                  >
                    {actionTypes.map((action) => (
                      <SelectItem 
                        key={action.value} 
                        value={action.value}
                        style={{
                          color: isDarkMode ? "#13151B" : "#0B2B26",
                        }}
                      >
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* User Filter */}
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="rounded-lg border-2 transition-all"
                    style={{
                      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                      backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                      color: isDarkMode ? "#13151B" : "#0B2B26",
                    }}
                  >
                    <SelectValue placeholder="Filter by user" />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                  >
                    {users.map((user) => (
                      <SelectItem 
                        key={user.value} 
                        value={user.value}
                        style={{
                          color: isDarkMode ? "#13151B" : "#0B2B26",
                        }}
                      >
                        {user.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Range Filter */}
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="rounded-lg border-2 transition-all"
                    style={{
                      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                      backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                      color: isDarkMode ? "#13151B" : "#0B2B26",
                    }}
                  >
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                  >
                    <SelectItem 
                      value="all"
                      style={{
                        color: isDarkMode ? "#13151B" : "#0B2B26",
                      }}
                    >
                      All Time
                    </SelectItem>
                    <SelectItem 
                      value="today"
                      style={{
                        color: isDarkMode ? "#13151B" : "#0B2B26",
                      }}
                    >
                      Today
                    </SelectItem>
                    <SelectItem 
                      value="week"
                      style={{
                        color: isDarkMode ? "#13151B" : "#0B2B26",
                      }}
                    >
                      Last 7 Days
                    </SelectItem>
                    <SelectItem 
                      value="month"
                      style={{
                        color: isDarkMode ? "#13151B" : "#0B2B26",
                      }}
                    >
                      Last 30 Days
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedAction("all");
                    setSelectedUser("all");
                    setDateRange("all");
                  }}
                  variant="outline"
                  className="rounded-lg border-2 transition-all hover:opacity-80"
                  style={{
                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                    color: isDarkMode ? "#13151B" : "#0B2B26",
                  }}
                >
                  <Filter size={16} className="mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Audit Logs Table - Show skeleton when loading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {loading ? (
          <SkeletonTable isDarkMode={isDarkMode} />
        ) : (
          <Card className="rounded-xl border-2"
            style={{
              borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
              backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                Activity Logs ({filteredLogs.length} records)
              </CardTitle>
              
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#6B7280' }}>
                  Show:
                </span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-20 rounded-lg border-2 transition-all"
                    style={{
                      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                      backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                      color: isDarkMode ? "#13151B" : "#0B2B26",
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                  >
                    {pageSizeOptions.map((size) => (
                      <SelectItem 
                        key={size} 
                        value={size.toString()}
                        style={{
                          color: isDarkMode ? "#13151B" : "#0B2B26",
                        }}
                      >
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border-2 overflow-hidden"
                style={{
                  borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                }}
              >
                <Table>
                  <TableHeader>
                    <TableRow style={{ 
                      backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                    }}>
                      <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Timestamp</TableHead>
                      <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>User</TableHead>
                      <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Action</TableHead>
                      <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Role</TableHead>
                      <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center">
                            <History size={48} style={{ color: isDarkMode ? '#6B7280' : '#6B7280' }} className="mb-2" />
                            <p style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                              {auditLogs.length === 0 ? 'No audit logs available' : 'No logs match your filters'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentLogs.map((log, index) => (
                        <TableRow 
                          key={log.id || index} 
                          style={{ 
                            backgroundColor: index % 2 === 0 
                              ? (isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(243, 237, 227, 0.9)") 
                              : "transparent",
                            borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                          }}
                        >
                          <TableCell style={{ color: isDarkMode ? '#13151B' : '#374151' }}>
                            {formatTimestamp(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User size={14} style={{ color: isDarkMode ? '#6B7280' : '#6B7280' }} />
                              <span style={{ color: isDarkMode ? '#13151B' : '#374151' }}>
                                {log.username || 'Unknown'}
                                {isUnknownUser(log) && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Unknown
                                  </Badge>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className="transition-all hover:opacity-80"
                              style={{ 
                                backgroundColor: getActionColor(log.action),
                                color: 'white'
                              }}
                            >
                              {log.action || 'UNKNOWN'}
                            </Badge>
                          </TableCell>
                          <TableCell style={{ color: isDarkMode ? '#13151B' : '#374151' }}>
                            {log.entityType || 'System'}
                          </TableCell>
                          <TableCell style={{ color: isDarkMode ? '#13151B' : '#374151' }}>
                            {log.description || 'No description'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm" style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* First Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      className="rounded-lg border-2 transition-all hover:opacity-80"
                      style={{
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                        color: isDarkMode ? "#13151B" : "#0B2B26",
                      }}
                    >
                      <ChevronsLeft size={16} />
                    </Button>

                    {/* Previous Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="rounded-lg border-2 transition-all hover:opacity-80"
                      style={{
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                        color: isDarkMode ? "#13151B" : "#0B2B26",
                      }}
                    >
                      <ChevronLeft size={16} />
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`rounded-lg border-2 transition-all ${
                              currentPage === pageNum ? 'font-bold' : ''
                            }`}
                            style={{
                              borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                              backgroundColor: currentPage === pageNum 
                                ? (isDarkMode ? "#18442AF5" : "#0B2B26")
                                : (isDarkMode ? "#FFFFFF" : "#F3EDE3"),
                              color: currentPage === pageNum 
                                ? "#F3EDE3"
                                : (isDarkMode ? "#13151B" : "#0B2B26"),
                            }}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    {/* Next Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border-2 transition-all hover:opacity-80"
                      style={{
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                        color: isDarkMode ? "#13151B" : "#0B2B26",
                      }}
                    >
                      <ChevronRight size={16} />
                    </Button>

                    {/* Last Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border-2 transition-all hover:opacity-80"
                      style={{
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                        color: isDarkMode ? "#13151B" : "#0B2B26",
                      }}
                    >
                      <ChevronsRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default AuditTrailPage;