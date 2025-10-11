import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import QRCode from "react-qr-code";
import { ScrollText, Save, Eye, Receipt, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ALLOWED_SKEW_MS = 5000;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Initialize cache properly
const initializeCache = () => {
  try {
    const stored = localStorage.getItem('receiptSettingsCache');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if cache is still valid
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        console.log("📦 Initializing receipt settings from stored cache");
        return parsed;
      } else {
        console.log("🗑️ Stored receipt settings cache expired");
      }
    }
  } catch (error) {
    console.warn('Failed to load receipt settings cache from storage:', error);
  }
  return null;
};

// Global cache instance
let receiptSettingsCache = initializeCache();
let cacheTimestamp = receiptSettingsCache?.timestamp || null;

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

  if (!token || isTokenExpired(token)) {
    console.warn("⛔ Token expired. Redirecting to login.");
    // Clear cache on token expiry
    receiptSettingsCache = null;
    cacheTimestamp = null;
    localStorage.removeItem('receiptSettingsCache');
    window.location.href = "/login";
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`http://localhost:8080/api${endpoint}`, options);

  if (!response.ok) {
    console.error(`❌ ${method} ${endpoint} failed:`, response.status);
    throw new Error(`Request failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  return contentType && contentType.includes("application/json")
    ? response.json()
    : response.text();
};

// Save cache to localStorage for persistence
const saveCacheToStorage = (data) => {
  try {
    localStorage.setItem('receiptSettingsCache', JSON.stringify({
      data: data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to save receipt settings cache to storage:', error);
  }
};

export default function ReceiptConfigPage() {
  const { theme } = useTheme();
  const { toast } = useToast();
  
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Initialize state with cached data if available
  const [settings, setSettings] = useState(() => {
    if (receiptSettingsCache && receiptSettingsCache.data) {
      console.log("🎯 Initializing receipt settings state with cached data");
      return {
        storeName: receiptSettingsCache.data.storeName || "",
        address: receiptSettingsCache.data.address || "",
        phone: receiptSettingsCache.data.phone || "",
        footerNote: receiptSettingsCache.data.footerNote || "",
        trackingUrl: receiptSettingsCache.data.trackingUrl || "",
      };
    }
    
    return {
      storeName: "",
      address: "",
      phone: "",
      footerNote: "",
      trackingUrl: "",
    };
  });

  const [activePreview, setActivePreview] = useState("invoice");
  const [isLoading, setIsLoading] = useState(!receiptSettingsCache); // Only loading if no cache
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(!receiptSettingsCache); // Only initial load if no cache
  const isMountedRef = useRef(true);

  // Function to check if data has actually changed
  const hasDataChanged = (newData, oldData) => {
    if (!oldData) return true;
    
    return (
      newData.storeName !== oldData.storeName ||
      newData.address !== oldData.address ||
      newData.phone !== oldData.phone ||
      newData.footerNote !== oldData.footerNote ||
      newData.trackingUrl !== oldData.trackingUrl
    );
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    // Don't fetch if component is unmounted
    if (!isMountedRef.current) return;

    try {
      const now = Date.now();
      
      // Check cache first unless forced refresh
      if (!forceRefresh && receiptSettingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log("📦 Using cached receipt settings");
        
        // Always update with cached data to ensure UI is populated
        if (isMountedRef.current) {
          setSettings(receiptSettingsCache.data);
          setIsLoading(false);
          setInitialLoad(false);
        }
        return;
      }

      await fetchFreshSettings();
    } catch (err) {
      console.error("Failed to fetch format settings:", err);
      if (!isMountedRef.current) return;
      
      // On error, keep cached data if available
      if (receiptSettingsCache) {
        console.log("⚠️ Fetch failed, falling back to cached receipt settings");
        setSettings(receiptSettingsCache.data);
        toast({
          title: "Warning",
          description: "Failed to refresh settings. Showing cached data.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load receipt configuration",
          variant: "destructive",
        });
      }
      setIsLoading(false);
      setInitialLoad(false);
    }
  }, [toast]);

  // Separate function for actual API call
  const fetchFreshSettings = async () => {
    console.log("🔄 Fetching fresh receipt settings");
    if (isMountedRef.current) {
      setIsLoading(true);
    }

    const data = await secureFetch("/format-settings");
    
    const newSettings = {
      storeName: data?.storeName || "",
      address: data?.address || "",
      phone: data?.phone || "",
      footerNote: data?.footerNote || "",
      trackingUrl: data?.trackingUrl || "",
    };

    const currentTime = Date.now();

    // Only update state and cache if data has actually changed
    if (!receiptSettingsCache || hasDataChanged(newSettings, receiptSettingsCache.data)) {
      console.log("🔄 Receipt settings updated with fresh data");
      
      // Update cache
      receiptSettingsCache = {
        data: newSettings,
        timestamp: currentTime
      };
      cacheTimestamp = currentTime;
      
      // Persist to localStorage
      saveCacheToStorage(newSettings);
      
      if (isMountedRef.current) {
        setSettings(newSettings);
      }
    } else {
      console.log("✅ No changes in receipt settings, updating timestamp only");
      // Just update the timestamp to extend cache life
      cacheTimestamp = currentTime;
      receiptSettingsCache.timestamp = currentTime;
      saveCacheToStorage(receiptSettingsCache.data);
    }

    if (isMountedRef.current) {
      setIsLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    // Always show cached data immediately if available
    if (receiptSettingsCache) {
      console.log("🚀 Showing cached receipt settings immediately");
      setSettings(receiptSettingsCache.data);
      setIsLoading(false);
      setInitialLoad(false);
    }
    
    // Then fetch fresh data
    fetchSettings();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = { 
        storeName: settings.storeName, 
        address: settings.address, 
        phone: settings.phone, 
        footerNote: settings.footerNote, 
        trackingUrl: settings.trackingUrl 
      };
      
      await secureFetch("/format-settings", "POST", payload);
      
      // Update cache
      receiptSettingsCache = {
        data: payload,
        timestamp: Date.now()
      };
      cacheTimestamp = Date.now();
      saveCacheToStorage(payload);
      
      toast({ 
        title: "Success", 
        description: "Receipt configuration updated successfully.",
      });
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "Failed to save configuration.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sampleData = {
    id: "INV-00123",
    createdAt: "Aug 21, 2025 10:45 AM",
    customerName: "Andrei",
    staffName: "Sheena",
    detergentQty: 2,
    fabricQty: 1,
    plasticQty: 1,
    loads: 3,
    total: 180.0,
    paymentMethod: "Cash",
  };

  const previewTrackingLink = settings.trackingUrl.includes("{id}")
    ? settings.trackingUrl.replace("{id}", sampleData.id)
    : settings.trackingUrl;

  const formattedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const renderPreview = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-mono text-sm space-y-2 border-2 rounded-xl transition-all"
      style={{
        backgroundColor: isDarkMode ? "#183D3D" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
        color: isDarkMode ? "#F3EDE3" : "#0B2B26",
      }}
    >
      <div className="p-4 space-y-2">
        {/* Header */}
        <div className="text-center font-bold text-lg" style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}>
          {settings.storeName || "Store Name"}
        </div>
        <div className="text-center text-sm" style={{ color: isDarkMode ? "#E0EAE8" : "#1E3A3A" }}>
          {settings.address || "Store Address"}
        </div>
        <div className="text-center text-sm" style={{ color: isDarkMode ? "#E0EAE8" : "#1E3A3A" }}>
          {settings.phone || "Phone Number"}
        </div>

        <hr style={{ 
          borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
          borderWidth: '1px'
        }} />

        {/* Transaction Details */}
        <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}>
          <div>
            {activePreview === "invoice" ? "Service Invoice #:" : "Receipt #:"}{" "}
            <span className="font-bold" style={{ color: isDarkMode ? "#FFFFFF" : "#0B2B26" }}>
              {sampleData.id}
            </span>
          </div>
          <div className="text-right">
            Date: <span className="font-bold" style={{ color: isDarkMode ? "#FFFFFF" : "#0B2B26" }}>
              {sampleData.createdAt}
            </span>
          </div>
          <div>
            Customer: <span className="font-bold" style={{ color: isDarkMode ? "#FFFFFF" : "#0B2B26" }}>
              {sampleData.customerName}
            </span>
          </div>
          <div className="text-right">
            Staff: <span className="font-bold" style={{ color: isDarkMode ? "#FFFFFF" : "#0B2B26" }}>
              {sampleData.staffName}
            </span>
          </div>
          <div>
            Payment: <span className="font-bold" style={{ color: isDarkMode ? "#FFFFFF" : "#0B2B26" }}>
              {sampleData.paymentMethod}
            </span>
          </div>
          {activePreview === "invoice" && (
            <div className="col-span-2 flex justify-between">
              <span>Due Date to Claim:</span>
              <span className="font-bold" style={{ color: "#F87171" }}>{formattedDueDate}</span>
            </div>
          )}
        </div>

        <hr style={{ 
          borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
          borderWidth: '1px'
        }} />

        {/* Items */}
        <div className="space-y-1 text-sm" style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}>
          <div className="flex justify-between">
            <span>Detergents × {sampleData.detergentQty}</span>
            <span>₱{(sampleData.detergentQty * 30).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Fabric Softeners × {sampleData.fabricQty}</span>
            <span>₱{(sampleData.fabricQty * 30).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Plastic × {sampleData.plasticQty}</span>
            <span>₱{(sampleData.plasticQty * 10).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Wash & Dry × {sampleData.loads}</span>
            <span>₱{(sampleData.loads * 50).toFixed(2)}</span>
          </div>
        </div>

        <hr style={{ 
          borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
          borderWidth: '1px'
        }} />

        {/* Total */}
        <div className="flex justify-between font-bold text-sm" style={{ color: isDarkMode ? "#FFFFFF" : "#0B2B26" }}>
          <span>Total</span>
          <span>₱{sampleData.total.toFixed(2)}</span>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mt-3 print:hidden">
          <div style={{ 
            background: 'white', 
            padding: '8px', 
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            <QRCode 
              value={previewTrackingLink} 
              size={64}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </div>
        </div>
        <div className="text-center mt-1 text-xs" style={{ color: isDarkMode ? "#CBD5E1" : "#4B5563" }}>
          Scan to track your laundry status
        </div>

        {/* Terms & Conditions for Invoice */}
        {activePreview === "invoice" && (
          <>
            <hr style={{ 
              borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
              borderWidth: '1px'
            }} />
            <div className="text-xs mt-2" style={{ color: isDarkMode ? "#E0EAE8" : "#6B7280" }}>
              <strong className="block mb-1 text-sm" style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}>
                Terms & Conditions
              </strong>
              <p>
                Laundry must be claimed within 7 days. Unclaimed items may be subject to disposal or storage fees.
                Please retain your invoice for verification.
              </p>
            </div>
          </>
        )}

        {/* Footer Note */}
        <div className="text-center mt-2 text-xs" style={{ color: isDarkMode ? "#CBD5E1" : "#6B7280" }}>
          {settings.footerNote || "Thank you for choosing our service!"}
        </div>
      </div>
    </motion.div>
  );

  // Skeleton loader components
  const SkeletonCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 p-5 transition-all h-[560px]"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-fit rounded-lg p-2 animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}>
          <div className="h-6 w-6"></div>
        </div>
        <div className="h-6 w-32 rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 rounded animate-pulse"
                 style={{
                   backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                 }}></div>
            <div className="h-10 w-full rounded animate-pulse"
                 style={{
                   backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3"
                 }}></div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <div className="h-10 w-40 rounded-lg animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
    </motion.div>
  );

  const SkeletonHeader = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 mb-4"
    >
      <div className="h-10 w-10 rounded-lg animate-pulse"
           style={{
             backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
           }}></div>
      <div className="space-y-2">
        <div className="h-6 w-44 rounded-lg animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
        <div className="h-4 w-56 rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
    </motion.div>
  );

  // Show skeleton loader only during initial load AND when no cached data is available
  if (initialLoad && !receiptSettingsCache) {
    return (
      <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
        <SkeletonHeader />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
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
          <ScrollText size={22} />
        </motion.div>
        <div>
          <p className="text-xl font-bold" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
            Receipt Configuration
          </p>
          <p className="text-sm" style={{ color: isDarkMode ? '#F3EDE3/70' : '#0B2B26/70' }}>
            Customize your receipt and invoice templates
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configuration Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-xl border-2 transition-all h-[560px] flex flex-col"
                style={{
                  backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                  borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                }}>
            <CardHeader className="pb-1">
              <CardTitle className="text-base flex items-center gap-2" 
                         style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                <div className="rounded-lg p-1.5"
                     style={{
                       backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                       color: isDarkMode ? "#18442AF5" : "#0B2B26",
                     }}>
                  <Save size={16} />
                </div>
                Receipt Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm px-6 flex-1">
              {[
                { label: "Store Name", key: "storeName" },
                { label: "Address", key: "address" },
                { label: "Phone Number", key: "phone" },
                { label: "Footer Note", key: "footerNote" },
                { label: "Tracking URL", key: "trackingUrl" },
              ].map(({ label, key }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="space-y-1"
                >
                  <Label className="text-sm font-medium" 
                         style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                    {label}
                  </Label>
                  <Input
                    value={settings[key]}
                    onChange={(e) => updateSetting(key, e.target.value)}
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    aria-label={label}
                    className="rounded-lg border-2 transition-all"
                    style={{
                      backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                      borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                      color: isDarkMode ? "#13151B" : "#0B2B26",
                    }}
                  />
                </motion.div>
              ))}
            </CardContent>
            <div className="flex justify-end px-6 pb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-lg px-4 py-2 text-white transition-all"
                  style={{
                    backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                  }}
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Preview Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="rounded-xl border-2 transition-all h-[560px] flex flex-col"
                style={{
                  backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                  borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                }}>
            <CardHeader className="pb-1">
              <CardTitle className="text-base flex justify-between items-center" 
                         style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg p-1.5"
                       style={{
                         backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                         color: isDarkMode ? "#18442AF5" : "#0B2B26",
                       }}>
                    <Eye size={16} />
                  </div>
                  <span>Receipt Preview</span>
                </div>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActivePreview("invoice")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      activePreview === "invoice"
                        ? "text-white"
                        : ""
                    }`}
                    style={{
                      backgroundColor: activePreview === "invoice" 
                        ? (isDarkMode ? "#18442AF5" : "#0B2B26")
                        : (isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)"),
                      color: activePreview === "invoice" 
                        ? "#FFFFFF"
                        : (isDarkMode ? "#13151B" : "#0B2B26"),
                    }}
                  >
                    <FileText size={12} className="inline mr-1" />
                    Service Invoice
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActivePreview("receipt")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      activePreview === "receipt"
                        ? "text-white"
                        : ""
                    }`}
                    style={{
                      backgroundColor: activePreview === "receipt" 
                        ? (isDarkMode ? "#18442AF5" : "#0B2B26")
                        : (isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)"),
                      color: activePreview === "receipt" 
                        ? "#FFFFFF"
                        : (isDarkMode ? "#13151B" : "#0B2B26"),
                    }}
                  >
                    <Receipt size={12} className="inline mr-1" />
                    Receipt
                  </motion.button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-y-auto flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePreview}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderPreview()}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}