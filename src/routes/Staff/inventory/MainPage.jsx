// staff/inventory/MainPage.jsx

import { useEffect, useState } from "react";
import { Boxes, PackageX, Package, Clock8, CheckCircle2 } from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const ALLOWED_SKEW_MS = 5000;

const isTokenExpired = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp * 1000;
    return Date.now() > exp + ALLOWED_SKEW_MS;
  } catch (err) {
    console.warn("❌ Failed to decode token:", err);
    return true;
  }
};

const fetchInventory = async () => {
  const token = localStorage.getItem("authToken");
  if (!token || isTokenExpired(token)) {
    window.location.href = "/login";
    return [];
  }

  try {
    const response = await fetch("http://localhost:8080/api/stock", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await response.json();
    }

    return [];
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
};

const getStatusIcon = (quantity, low, adequate) => {
  if (quantity === 0) {
    return {
      icon: <PackageX className="ml-2 h-4 w-4 text-red-500 dark:text-red-400" />,
      label: "Out of Stock",
    };
  }
  if (quantity <= low) {
    return {
      icon: <Package className="ml-2 h-4 w-4 text-orange-500 dark:text-orange-400" />,
      label: "Low Stock",
    };
  }
  if (quantity <= adequate) {
    return {
      icon: <Clock8 className="ml-2 h-4 w-4 text-blue-500 dark:text-blue-400" />,
      label: "Adequate Stock",
    };
  }
  return {
    icon: <CheckCircle2 className="ml-2 h-4 w-4 text-green-600 dark:text-green-400" />,
    label: "Stocked",
  };
};

const StaffInventoryPage = () => {
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

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <Boxes className="h-6 w-6 text-cyan-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Supply Monitoring
        </h1>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-[160px] animate-pulse rounded-md bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400">
          No supplies found.
        </p>
      ) : (
        <TooltipProvider>
          <div className="overflow-x-auto rounded-md border border-slate-300 dark:border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Quantity</th>
                  <th className="p-2 text-left">Last Restock</th>
                  <th className="p-2 text-left">Restock Qty</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const { icon, label } = getStatusIcon(
                    item.quantity,
                    item.lowStockThreshold ?? 0,
                    item.adequateStockThreshold ?? 0
                  );

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="p-2 font-medium text-slate-800 dark:text-white">
                        {item.name}
                      </td>
                      <td className="flex items-center p-2 text-slate-600 dark:text-slate-300">
                        {item.quantity} {item.unit}
                        <Tooltip>
                          <TooltipTrigger asChild>{icon}</TooltipTrigger>
                          <TooltipContent>{label}</TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="p-2 text-xs text-slate-500 dark:text-slate-400">
                        {item.lastRestock
                          ? new Date(item.lastRestock).toLocaleString()
                          : "—"}
                      </td>
                      <td className="p-2 text-slate-600 dark:text-slate-300">
                        {item.lastRestockAmount != null
                          ? `+${item.lastRestockAmount}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TooltipProvider>
      )}
    </main>
  );
};

export default StaffInventoryPage;