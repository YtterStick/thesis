import { useEffect, useState } from "react";
import { Boxes, PackageX, Package, Clock, CheckCircle2, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { api } from "@/lib/api-config"; // Import the api utility

const fetchInventory = async () => {
  try {
    // Use the api utility instead of direct fetch
    const data = await api.get("api/stock");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
};

const getStatusIcon = (quantity, low, adequate) => {
  if (quantity === 0) {
    return {
      icon: <PackageX className="h-4 w-4" />,
      label: "Out of Stock",
      color: "text-red-500",
      labelColor: "text-red-600",
      darkLabelColor: "text-red-400",
      bgColor: "bg-red-100",
      darkBgColor: "bg-red-900/30",
      borderColor: "border-red-200",
      darkBorderColor: "border-red-800",
    };
  }
  if (quantity <= low) {
    return {
      icon: <AlertTriangle className="h-4 w-4" />,
      label: "Low Stock",
      color: "text-orange-500",
      labelColor: "text-orange-600",
      darkLabelColor: "text-orange-400",
      bgColor: "bg-orange-100",
      darkBgColor: "bg-orange-900/30",
      borderColor: "border-orange-200",
      darkBorderColor: "border-orange-800",
    };
  }
  if (quantity <= adequate) {
    return {
      icon: <Clock className="h-4 w-4" />,
      label: "Adequate Stock",
      color: "text-blue-500",
      labelColor: "text-blue-600",
      darkLabelColor: "text-blue-400",
      bgColor: "bg-blue-100",
      darkBgColor: "bg-blue-900/30",
      borderColor: "border-blue-200",
      darkBorderColor: "border-blue-800",
    };
  }
  return {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: "Well Stocked",
    color: "text-green-600",
    labelColor: "text-green-600",
    darkLabelColor: "text-green-400",
    bgColor: "bg-green-100",
    darkBgColor: "bg-green-900/30",
    borderColor: "border-green-200",
    darkBorderColor: "border-green-800",
  };
};

const StaffInventoryPage = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInventory = async () => {
      const data = await fetchInventory();
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    loadInventory();
  }, []);

  // Calculate summary statistics
  const totalItems = items.length;
  const outOfStockItems = items.filter(item => item.quantity === 0).length;
  const lowStockItems = items.filter(item => item.quantity > 0 && item.quantity <= (item.lowStockThreshold ?? 0)).length;
  const wellStockedItems = items.filter(item => item.quantity > (item.adequateStockThreshold ?? 0)).length;

  const formatDate = (dateString) => {
    if (!dateString) return "Never restocked";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-3"
        >
          <div className="rounded-lg p-2 bg-slate-200 dark:bg-slate-700 animate-pulse">
            <Boxes size={22} className="text-slate-400" />
          </div>
          <div>
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
        </motion.div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card className="rounded-xl border-2 border-slate-200 dark:border-slate-700">
          <CardHeader className="rounded-t-xl bg-slate-100 dark:bg-slate-800/50">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div>
                      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-3"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="rounded-lg p-2"
          style={{
            backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
            color: "#F3EDE3",
          }}
        >
          <Boxes size={22} />
        </motion.div>
        <div>
          <p className="text-xl font-bold" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
            Supply Monitoring
          </p>
          <p className="text-sm" style={{ color: isDarkMode ? '#F3EDE3/70' : '#0B2B26/70' }}>
            Track and manage inventory supplies
          </p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="rounded-xl border-2 transition-all hover:shadow-lg" style={{
          backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
          borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
        }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>Total Items</p>
                <p className="text-2xl font-bold mt-1" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>{totalItems}</p>
              </div>
              <div className="rounded-lg p-2" style={{
                backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
              }}>
                <Package className="h-5 w-5" style={{ color: isDarkMode ? '#18442AF5' : '#0B2B26' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-2 transition-all hover:shadow-lg" style={{
          backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
          borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
        }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>Well Stocked</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#059669' }}>{wellStockedItems}</p>
              </div>
              <div className="rounded-lg p-2 bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-2 transition-all hover:shadow-lg" style={{
          backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
          borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
        }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>Low Stock</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#D97706' }}>{lowStockItems}</p>
              </div>
              <div className="rounded-lg p-2 bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-2 transition-all hover:shadow-lg" style={{
          backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
          borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
        }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>Out of Stock</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#DC2626' }}>{outOfStockItems}</p>
              </div>
              <div className="rounded-lg p-2 bg-red-100">
                <PackageX className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Inventory Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="rounded-xl border-2 transition-all" style={{
          backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
          borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
        }}>
          <CardHeader className="rounded-t-xl p-6" style={{
            backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
          }}>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="text-lg font-bold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                  Inventory Items
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                  {totalItems} supply item{totalItems !== 1 ? 's' : ''} in inventory
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <TooltipProvider>
              <div className="rounded-lg border-2 shadow-sm" style={{
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
              }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{
                      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                      backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                    }}>
                      <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Supply Item</th>
                      <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Quantity</th>
                      <th className="p-4 text-center font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Status</th>
                      <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Last Restock</th>
                      <th className="p-4 text-left font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Restock Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center">
                          <div className="flex flex-col items-center justify-center" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                            <PackageX className="mb-4 h-12 w-12" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/50' }} />
                            <p className="text-lg font-medium">No supplies found</p>
                            <p className="text-sm">Inventory items will appear here once added</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => {
                        const status = getStatusIcon(
                          item.quantity,
                          item.lowStockThreshold ?? 0,
                          item.adequateStockThreshold ?? 0
                        );

                        return (
                          <tr
                            key={item.id}
                            className="border-t transition-all hover:opacity-90"
                            style={{
                              borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                              backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                            }}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-lg p-2" style={{
                                  backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                                }}>
                                  <Package className="h-4 w-4" style={{ color: isDarkMode ? '#18442AF5' : '#0B2B26' }} />
                                </div>
                                <div>
                                  <p className="font-medium" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                    {item.name}
                                  </p>
                                  {item.category && (
                                    <p className="text-xs" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                      {item.category}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                  {item.quantity}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="rounded-lg border-2 capitalize"
                                  style={{
                                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                    color: isDarkMode ? '#13151B' : '#0B2B26',
                                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(243, 237, 227, 0.9)",
                                  }}
                                >
                                  {item.unit || 'units'}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      className="flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer border px-3 py-1 min-w-[140px]"
                                      style={{
                                        backgroundColor: isDarkMode ? status.darkBgColor : status.bgColor,
                                        borderColor: isDarkMode ? status.darkBorderColor : status.borderColor,
                                      }}
                                    >
                                      <span className={isDarkMode ? status.color : status.color}>
                                        {status.icon}
                                      </span>
                                      <span className={isDarkMode ? status.darkLabelColor : status.labelColor}>
                                        {status.label}
                                      </span>
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Current stock level: {item.quantity} {item.unit}</p>
                                    {item.lowStockThreshold && (
                                      <p>Low stock threshold: {item.lowStockThreshold}</p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }} />
                                <span style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                  {formatDate(item.lastRestock)}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              {item.lastRestockAmount != null ? (
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                  <span className="font-semibold text-green-600">
                                    +{item.lastRestockAmount}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default StaffInventoryPage;