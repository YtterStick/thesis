import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QRCode from "react-qr-code";
import { ScrollText, Save, Eye, Receipt, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-config";

const ALLOWED_SKEW_MS = 5000;
const CACHE_DURATION = 5 * 60 * 1000;

// Add tracking URL as a constant
const TRACKING_URL_BASE = "https://your-tracking-domain.com/track";

const initializeCache = () => {
  try {
    const stored = localStorage.getItem('receiptSettingsCache');
    if (stored) {
      const parsed = JSON.parse(stored);
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

let receiptSettingsCache = initializeCache();
let cacheTimestamp = receiptSettingsCache?.timestamp || null;

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

  const [settings, setSettings] = useState(() => {
    if (receiptSettingsCache && receiptSettingsCache.data) {
      console.log("🎯 Initializing receipt settings state with cached data");
      return {
        storeName: receiptSettingsCache.data.storeName || "",
        address: receiptSettingsCache.data.address || "",
        phone: receiptSettingsCache.data.phone || "",
        footerNote: receiptSettingsCache.data.footerNote || "",
      };
    }
    
    return {
      storeName: "",
      address: "",
      phone: "",
      footerNote: "",
    };
  });

  const [activePreview, setActivePreview] = useState("invoice");
  const [isLoading, setIsLoading] = useState(!receiptSettingsCache);
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(!receiptSettingsCache);
  const isMountedRef = useRef(true);

  const hasDataChanged = (newData, oldData) => {
    if (!oldData) return true;
    
    return (
      newData.storeName !== oldData.storeName ||
      newData.address !== oldData.address ||
      newData.phone !== oldData.phone ||
      newData.footerNote !== oldData.footerNote
    );
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    try {
      const now = Date.now();
      
      if (!forceRefresh && receiptSettingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log("📦 Using cached receipt settings");
        
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

  const fetchFreshSettings = async () => {
    console.log("🔄 Fetching fresh receipt settings");
    if (isMountedRef.current) {
      setIsLoading(true);
    }

    try {
      const data = await api.get("api/format-settings");
      
      const newSettings = {
        storeName: data?.storeName || "",
        address: data?.address || "",
        phone: data?.phone || "",
        footerNote: data?.footerNote || "",
      };

      const currentTime = Date.now();

      if (!receiptSettingsCache || hasDataChanged(newSettings, receiptSettingsCache.data)) {
        console.log("🔄 Receipt settings updated with fresh data");
        
        receiptSettingsCache = {
          data: newSettings,
          timestamp: currentTime
        };
        cacheTimestamp = currentTime;
        
        saveCacheToStorage(newSettings);
        
        if (isMountedRef.current) {
          setSettings(newSettings);
        }
      } else {
        console.log("✅ No changes in receipt settings, updating timestamp only");
        cacheTimestamp = currentTime;
        receiptSettingsCache.timestamp = currentTime;
        saveCacheToStorage(receiptSettingsCache.data);
      }

      if (isMountedRef.current) {
        setIsLoading(false);
        setInitialLoad(false);
      }
    } catch (error) {
      console.error("Error fetching receipt settings:", error);
      if (isMountedRef.current) {
        setIsLoading(false);
        setInitialLoad(false);
        toast({
          title: "Error",
          description: "Failed to load receipt configuration",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    if (receiptSettingsCache) {
      console.log("🚀 Showing cached receipt settings immediately");
      setSettings(receiptSettingsCache.data);
      setIsLoading(false);
      setInitialLoad(false);
    }
    
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
      };
      
      await api.post("api/format-settings", payload);
      
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

  // Use the constant tracking URL with the sample ID
  const previewTrackingLink = `${TRACKING_URL_BASE}?id=${sampleData.id}`;

  const formattedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const renderPreview = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-mono text-sm border-2 rounded-xl transition-all"
      style={{
        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
        color: isDarkMode ? "#f1f5f9" : "#0f172a",
      }}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="font-bold text-lg" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
            {settings.storeName || "Store Name"}
          </div>
          <div className="text-sm" style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}>
            {settings.address || "Store Address"}
          </div>
          <div className="text-sm" style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}>
            {settings.phone || "Phone Number"}
          </div>
        </div>

        <hr style={{ 
          borderColor: isDarkMode ? "#334155" : "#cbd5e1",
          borderWidth: '1px'
        }} />

        {/* Transaction Details */}
        <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
          <div>
            {activePreview === "invoice" ? "Service Invoice #:" : "Receipt #:"}{" "}
            <span className="font-bold" style={{ color: isDarkMode ? "#ffffff" : "#0f172a" }}>
              {sampleData.id}
            </span>
          </div>
          <div className="text-right">
            Date: <span className="font-bold" style={{ color: isDarkMode ? "#ffffff" : "#0f172a" }}>
              {sampleData.createdAt}
            </span>
          </div>
          <div>
            Customer: <span className="font-bold" style={{ color: isDarkMode ? "#ffffff" : "#0f172a" }}>
              {sampleData.customerName}
            </span>
          </div>
          <div className="text-right">
            Staff: <span className="font-bold" style={{ color: isDarkMode ? "#ffffff" : "#0f172a" }}>
              {sampleData.staffName}
            </span>
          </div>
          <div>
            Payment: <span className="font-bold" style={{ color: isDarkMode ? "#ffffff" : "#0f172a" }}>
              {sampleData.paymentMethod}
            </span>
          </div>
          {activePreview === "invoice" && (
            <div className="col-span-2 flex justify-between pt-1">
              <span>Due Date to Claim:</span>
              <span className="font-bold" style={{ color: "#F87171" }}>{formattedDueDate}</span>
            </div>
          )}
        </div>

        <hr style={{ 
          borderColor: isDarkMode ? "#334155" : "#cbd5e1",
          borderWidth: '1px'
        }} />

        {/* Items */}
        <div className="space-y-2 text-sm" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
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
          borderColor: isDarkMode ? "#334155" : "#cbd5e1",
          borderWidth: '1px'
        }} />

        {/* Total */}
        <div className="flex justify-between font-bold text-sm pt-1" style={{ color: isDarkMode ? "#ffffff" : "#0f172a" }}>
          <span>Total</span>
          <span>₱{sampleData.total.toFixed(2)}</span>
        </div>

        {/* QR Code */}
        <div className="flex justify-center pt-3 print:hidden">
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
        <div className="text-center text-xs pt-1" style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}>
          Scan to track your laundry status
        </div>

        {/* Terms & Conditions for Invoice */}
        {activePreview === "invoice" && (
          <>
            <hr style={{ 
              borderColor: isDarkMode ? "#334155" : "#cbd5e1",
              borderWidth: '1px'
            }} />
            <div className="text-xs pt-2" style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}>
              <strong className="block mb-1 text-sm" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
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
        <div className="text-center text-xs pt-2" style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}>
          {settings.footerNote || "Thank you for choosing our service!"}
        </div>
      </div>
    </motion.div>
  );

  const SkeletonCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 p-5 transition-all h-[560px]"
      style={{
        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-fit rounded-lg p-2 animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
             }}>
          <div className="h-6 w-6"></div>
        </div>
        <div className="h-6 w-32 rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
             }}></div>
      </div>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 rounded animate-pulse"
                 style={{
                   backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                 }}></div>
            <div className="h-10 w-full rounded animate-pulse"
                 style={{
                   backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                 }}></div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <div className="h-10 w-40 rounded-lg animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
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
             backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
           }}></div>
      <div className="space-y-2">
        <div className="h-6 w-44 rounded-lg animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
             }}></div>
        <div className="h-4 w-56 rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
             }}></div>
      </div>
    </motion.div>
  );

  if (initialLoad && !receiptSettingsCache) {
    return (
      <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible" style={{
        backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
      }}>
        <SkeletonHeader />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible" style={{
      backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
    }}>
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
            backgroundColor: isDarkMode ? "#1e293b" : "#0f172a",
            color: "#f1f5f9",
          }}
        >
          <ScrollText size={22} />
        </motion.div>
        <div>
          <p className="text-xl font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
            Receipt Configuration
          </p>
          <p className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
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
                  backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                  borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2" 
                         style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="rounded-lg p-1.5"
                  style={{
                    backgroundColor: "#0f172a",
                    color: "#f1f5f9",
                  }}
                >
                  <Save size={16} />
                </motion.div>
                Receipt Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 flex-1">
              {[
                { label: "Store Name", key: "storeName" },
                { label: "Address", key: "address" },
                { label: "Phone Number", key: "phone" },
                { label: "Footer Note", key: "footerNote" },
              ].map(({ label, key }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-medium" 
                         style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                    {label}
                  </Label>
                  <Input
                    value={settings[key]}
                    onChange={(e) => updateSetting(key, e.target.value)}
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    aria-label={label}
                    className="rounded-lg border-2 transition-all"
                    style={{
                      backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                      borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                      color: isDarkMode ? "#f1f5f9" : "#0f172a",
                    }}
                  />
                </motion.div>
              ))}
            </CardContent>
            <div className="flex justify-end px-6 pb-4 pt-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-lg px-4 py-2 text-white transition-all"
                  style={{
                    backgroundColor: "#0f172a",
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
                  backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                  borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex justify-between items-center" 
                         style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                <div className="flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="rounded-lg p-1.5"
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#f1f5f9",
                    }}
                  >
                    <Eye size={16} />
                  </motion.div>
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
                        ? "#0f172a"
                        : (isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)"),
                      color: activePreview === "invoice" 
                        ? "#FFFFFF"
                        : (isDarkMode ? "#f1f5f9" : "#0f172a"),
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
                        ? "#0f172a"
                        : (isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)"),
                      color: activePreview === "receipt" 
                        ? "#FFFFFF"
                        : (isDarkMode ? "#f1f5f9" : "#0f172a"),
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