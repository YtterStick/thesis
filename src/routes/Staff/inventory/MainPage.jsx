import { useEffect, useState } from "react";
import { Boxes, PackageX, Package, Clock, CheckCircle2, AlertTriangle, TrendingUp, Calendar, Layers } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { api } from "@/lib/api-config";

const fetchInventory = async () => {
    try {
        const data = await api.get("/stock");
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
        icon: <Layers className="h-4 w-4" />,
        label: "Full Stock",
        color: "text-green-600",
        labelColor: "text-green-600",
        darkLabelColor: "text-green-400",
        bgColor: "bg-green-100",
        darkBgColor: "bg-green-900/30",
        borderColor: "border-green-200",
        darkBorderColor: "border-green-800",
    };
};

// Skeleton Loader Components
const SkeletonCard = ({ isDarkMode }) => (
    <Card
        className="animate-pulse rounded-xl border-2"
        style={{
            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
        }}
    >
        <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div
                        className="mb-2 h-4 w-20 rounded"
                        style={{
                            backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                        }}
                    ></div>
                    <div
                        className="h-6 w-12 rounded"
                        style={{
                            backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                        }}
                    ></div>
                </div>
                <div
                    className="rounded-lg p-2"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                    }}
                >
                    <div className="h-5 w-5"></div>
                </div>
            </div>
        </CardContent>
    </Card>
);

const SkeletonTableRow = ({ isDarkMode }) => (
    <tr
        className="border-t transition-all"
        style={{
            borderColor: isDarkMode ? "#334155" : "#e2e8f0",
            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "#f8fafc",
        }}
    >
        <td className="p-4">
            <div className="flex items-center gap-3">
                <div
                    className="rounded-lg p-2"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                    }}
                >
                    <div className="h-4 w-4"></div>
                </div>
                <div>
                    <div
                        className="mb-2 h-4 w-32 rounded"
                        style={{
                            backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                        }}
                    ></div>
                    <div
                        className="h-3 w-24 rounded"
                        style={{
                            backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                        }}
                    ></div>
                </div>
            </div>
        </td>
        <td className="p-4">
            <div className="flex items-center gap-2">
                <div
                    className="h-4 w-8 rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                    }}
                ></div>
                <div
                    className="h-6 w-16 rounded-lg border-2"
                    style={{
                        borderColor: isDarkMode ? "#475569" : "#e2e8f0",
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                    }}
                ></div>
            </div>
        </td>
        <td className="p-4">
            <div className="flex justify-center">
                <div
                    className="h-6 w-32 rounded-lg border-2"
                    style={{
                        borderColor: isDarkMode ? "#475569" : "#e2e8f0",
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                    }}
                ></div>
            </div>
        </td>
        <td className="p-4">
            <div className="flex items-center gap-2">
                <div
                    className="h-4 w-4 rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                    }}
                ></div>
                <div
                    className="h-4 w-24 rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                    }}
                ></div>
            </div>
        </td>
        <td className="p-4">
            <div className="flex items-center gap-2">
                <div
                    className="h-4 w-4 rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                    }}
                ></div>
                <div
                    className="h-4 w-12 rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                    }}
                ></div>
            </div>
        </td>
    </tr>
);

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

    const getStockStatusCounts = (items) => {
        let out = 0, low = 0, adequate = 0, full = 0;

        for (const item of items) {
            const q = item.quantity ?? 0;
            const lowT = item.lowStockThreshold ?? 0;
            const adequateT = item.adequateStockThreshold ?? 0;

            if (q === 0) {
                out++;
            } else if (q <= lowT) {
                low++;
            } else if (q <= adequateT) {
                adequate++;
            } else {
                full++;
            }
        }

        return { out, low, adequate, full };
    };

    const { out, low, adequate, full } = getStockStatusCounts(items);
    const totalItems = items.length;

    const summaryCards = [
        {
            title: "Total Items",
            icon: <Package size={20} />,
            value: totalItems,
            color: isDarkMode ? "#3DD9B6" : "#0B2B26",
            description: "All inventory items"
        },
        {
            title: "Full Stock",
            icon: <Layers size={20} />,
            value: full,
            color: "#059669",
            description: "Above adequate threshold"
        },
        {
            title: "Adequate",
            icon: <Boxes size={20} />,
            value: adequate,
            color: "#3B82F6",
            description: "Within adequate range"
        },
        {
            title: "Low Stock",
            icon: <PackageX size={20} />,
            value: low,
            color: "#D97706",
            description: "Below low threshold"
        },
        {
            title: "Out of Stock",
            icon: <Clock size={20} />,
            value: out,
            color: "#DC2626",
            description: "Zero quantity"
        },
    ];

    const formatDate = (dateString) => {
        if (!dateString) return "Never restocked";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div
                className="min-h-screen space-y-5 overflow-visible px-6 pb-5 pt-4"
                style={{
                    backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 flex items-center gap-3"
                >
                    <div
                        className="animate-pulse rounded-lg p-2"
                        style={{
                            backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                        }}
                    >
                        <Boxes
                            size={22}
                            className="text-transparent"
                        />
                    </div>
                    <div>
                        <div
                            className="mb-2 h-6 w-48 animate-pulse rounded"
                            style={{
                                backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                            }}
                        ></div>
                        <div
                            className="h-4 w-64 animate-pulse rounded"
                            style={{
                                backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                            }}
                        ></div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {[...Array(5)].map((_, i) => (
                        <SkeletonCard
                            key={i}
                            isDarkMode={isDarkMode}
                        />
                    ))}
                </div>

                <Card
                    className="animate-pulse rounded-xl border-2"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}
                >
                    <CardHeader
                        className="rounded-t-xl p-6"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                        }}
                    >
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <div
                                    className="mb-2 h-6 w-32 animate-pulse rounded"
                                    style={{
                                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                                    }}
                                ></div>
                                <div
                                    className="h-4 w-48 animate-pulse rounded"
                                    style={{
                                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                                    }}
                                ></div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div
                            className="rounded-lg border-2"
                            style={{
                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                            }}
                        >
                            <table className="w-full text-sm">
                                <thead>
                                    <tr
                                        className="border-b"
                                        style={{
                                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                                        }}
                                    >
                                        <th className="p-4 text-left">
                                            <div
                                                className="h-4 w-24 animate-pulse rounded"
                                                style={{
                                                    backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                                                }}
                                            ></div>
                                        </th>
                                        <th className="p-4 text-left">
                                            <div
                                                className="h-4 w-16 animate-pulse rounded"
                                                style={{
                                                    backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                                                }}
                                            ></div>
                                        </th>
                                        <th className="p-4 text-center">
                                            <div
                                                className="mx-auto h-4 w-16 animate-pulse rounded"
                                                style={{
                                                    backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                                                }}
                                            ></div>
                                        </th>
                                        <th className="p-4 text-left">
                                            <div
                                                className="h-4 w-24 animate-pulse rounded"
                                                style={{
                                                    backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                                                }}
                                            ></div>
                                        </th>
                                        <th className="p-4 text-left">
                                            <div
                                                className="h-4 w-20 animate-pulse rounded"
                                                style={{
                                                    backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                                                }}
                                            ></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(3)].map((_, i) => (
                                        <SkeletonTableRow
                                            key={i}
                                            isDarkMode={isDarkMode}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen space-y-5 overflow-visible px-6 pb-5 pt-4"
            style={{
                backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
            }}
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex items-center gap-3"
            >
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="rounded-lg p-2"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#0f172a",
                        color: "#f1f5f9",
                    }}
                >
                    <Boxes size={22} />
                </motion.div>
                <div>
                    <p
                        className="text-xl font-bold"
                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                    >
                        Supply Monitoring
                    </p>
                    <p
                        className="text-sm"
                        style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                    >
                        Track and manage inventory supplies
                    </p>
                </div>
            </motion.div>

            {/* Summary Cards - Updated to 5 columns with new styling */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5"
            >
                {summaryCards.map(({ title, icon, value, color, description }, index) => (
                    <motion.div
                        key={title}
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.2 }}
                    >
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Card className="rounded-xl border-2 transition-all hover:shadow-lg cursor-help" style={{
                                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                    }}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium mb-1" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                                                        {title}
                                                    </p>
                                                    <p className="text-2xl font-bold" style={{ color }}>
                                                        {value}
                                                    </p>
                                                </div>
                                                <div 
                                                    className="rounded-lg p-2"
                                                    style={{
                                                        backgroundColor: `${color}20`,
                                                        color: color,
                                                    }}
                                                >
                                                    {icon}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{description}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </motion.div>
                ))}
            </motion.div>

            {/* Inventory Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <Card
                    className="rounded-xl border-2 transition-all"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}
                >
                    <CardHeader
                        className="rounded-t-xl p-6"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                        }}
                    >
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <CardTitle
                                    className="text-lg font-bold"
                                    style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                >
                                    Inventory Items
                                </CardTitle>
                                <CardDescription
                                    className="text-sm"
                                    style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                                >
                                    {totalItems} supply item{totalItems !== 1 ? "s" : ""} in inventory
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <TooltipProvider>
                            <div
                                className="rounded-lg border-2 shadow-sm"
                                style={{
                                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                }}
                            >
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr
                                            className="border-b"
                                            style={{
                                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                                backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                                            }}
                                        >
                                            <th
                                                className="p-4 text-left font-semibold"
                                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                            >
                                                Supply Item
                                            </th>
                                            <th
                                                className="p-4 text-left font-semibold"
                                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                            >
                                                Quantity
                                            </th>
                                            <th
                                                className="p-4 text-center font-semibold"
                                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                            >
                                                Status
                                            </th>
                                            <th
                                                className="p-4 text-left font-semibold"
                                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                            >
                                                Last Restock
                                            </th>
                                            <th
                                                className="p-4 text-left font-semibold"
                                                style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                            >
                                                Restock Qty
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="p-8 text-center"
                                                >
                                                    <div
                                                        className="flex flex-col items-center justify-center"
                                                        style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}
                                                    >
                                                        <PackageX
                                                            className="mb-4 h-12 w-12"
                                                            style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}
                                                        />
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
                                                    item.adequateStockThreshold ?? 0,
                                                );

                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className="border-t transition-all hover:opacity-90"
                                                        style={{
                                                            borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                                                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "#f8fafc",
                                                        }}
                                                    >
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="rounded-lg p-2"
                                                                    style={{
                                                                        backgroundColor: isDarkMode
                                                                            ? "rgba(51, 65, 85, 0.3)"
                                                                            : "rgba(11, 43, 38, 0.1)",
                                                                    }}
                                                                >
                                                                    <Package
                                                                        className="h-4 w-4"
                                                                        style={{ color: isDarkMode ? "#3DD9B6" : "#0f172a" }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <p
                                                                        className="font-medium"
                                                                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                                    >
                                                                        {item.name}
                                                                    </p>
                                                                    {item.category && (
                                                                        <p
                                                                            className="text-xs"
                                                                            style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}
                                                                        >
                                                                            {item.category}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="font-semibold"
                                                                    style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                                                                >
                                                                    {item.quantity}
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="rounded-lg border-2 capitalize"
                                                                    style={{
                                                                        borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                                                                        color: isDarkMode ? "#f1f5f9" : "#0f172a",
                                                                        backgroundColor: isDarkMode
                                                                            ? "rgba(51, 65, 85, 0.3)"
                                                                            : "rgba(243, 237, 227, 0.9)",
                                                                    }}
                                                                >
                                                                    {item.unit || "units"}
                                                                </Badge>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex justify-center">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Badge
                                                                            className="flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-1 transition-all"
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
                                                                        <p>
                                                                            Current stock level: {item.quantity} {item.unit}
                                                                        </p>
                                                                        {item.lowStockThreshold && (
                                                                            <p>Low stock threshold: {item.lowStockThreshold}</p>
                                                                        )}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar
                                                                    className="h-4 w-4"
                                                                    style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}
                                                                />
                                                                <span style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                                                                    {formatDate(item.lastRestock)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            {item.lastRestockAmount != null ? (
                                                                <div className="flex items-center gap-2">
                                                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                                                    <span className="font-semibold text-green-600">+{item.lastRestockAmount}</span>
                                                                </div>
                                                            ) : (
                                                                <span style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}>—</span>
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