import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Trash2, Plus, Settings, WashingMachine, X, Package } from "lucide-react";
import EditServiceModal from "./components/EditServiceModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-config"; // Import the api utility

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Initialize cache properly
const initializeCache = () => {
  try {
    const stored = localStorage.getItem('servicesCache');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if cache is still valid
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        console.log("📦 Initializing services from stored cache");
        return parsed;
      } else {
        console.log("🗑️ Stored services cache expired");
      }
    }
  } catch (error) {
    console.warn('Failed to load services cache from storage:', error);
  }
  return null;
};

// Initialize global cache
let servicesCache = initializeCache();
let cacheTimestamp = servicesCache?.timestamp || null;

// Save cache to localStorage for persistence
const saveCacheToStorage = (data) => {
  try {
    localStorage.setItem('servicesCache', JSON.stringify({
      data: data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to save services cache to storage:', error);
  }
};

export default function MainPage() {
    const { theme } = useTheme();
    const { toast } = useToast();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    const [services, setServices] = useState(() => {
      if (servicesCache && servicesCache.data) {
        console.log("🎯 Initializing services state with cached data");
        return servicesCache.data;
      }
      return [];
    });
    const [editTarget, setEditTarget] = useState(null);
    const [error, setError] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [loading, setLoading] = useState(!servicesCache); // Only loading if no cache
    const [initialLoad, setInitialLoad] = useState(!servicesCache); // Only initial load if no cache
    const isMountedRef = useRef(true);

    // Function to check if data has actually changed
    const hasDataChanged = (newData, oldData) => {
      if (!oldData) return true;
      return JSON.stringify(newData) !== JSON.stringify(oldData);
    };

    const fetchServices = useCallback(async (forceRefresh = false) => {
      // Don't fetch if component is unmounted
      if (!isMountedRef.current) return;

      try {
        const now = Date.now();
        
        // Check cache first unless forced refresh
        if (!forceRefresh && servicesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
          console.log("📦 Using cached services data");
          
          // Always update with cached data to ensure UI is populated
          setServices(servicesCache.data);
          setLoading(false);
          setInitialLoad(false);
          return;
        }

        await fetchFreshServices();
      } catch (err) {
        console.error("❌ Error fetching services:", err.message);
        if (!isMountedRef.current) return;
        
        // On error, keep cached data if available
        if (servicesCache) {
          console.log("⚠️ Fetch failed, falling back to cached services data");
          setServices(servicesCache.data);
          setError("Failed to refresh services. Showing cached data.");
        } else {
          setError("Failed to load services. Make sure you're logged in.");
        }
        setLoading(false);
        setInitialLoad(false);
      }
    }, []);

    // Separate function for actual API call using the api utility
    const fetchFreshServices = async () => {
      console.log("🔄 Fetching fresh services data");
      setLoading(true);

      try {
        const data = await api.get("api/services");
        const newServices = data || [];
        
        const currentTime = Date.now();

        // Only update state and cache if data has actually changed
        if (!servicesCache || hasDataChanged(newServices, servicesCache.data)) {
          console.log("🔄 Services data updated with fresh data");
          
          // Update cache
          servicesCache = {
            data: newServices,
            timestamp: currentTime
          };
          cacheTimestamp = currentTime;
          
          // Persist to localStorage
          saveCacheToStorage(newServices);
          
          if (isMountedRef.current) {
            setServices(newServices);
            setError(null);
          }
        } else {
          console.log("✅ No changes in services data, updating timestamp only");
          // Just update the timestamp to extend cache life
          cacheTimestamp = currentTime;
          servicesCache.timestamp = currentTime;
          saveCacheToStorage(servicesCache.data);
        }

        if (isMountedRef.current) {
          setLoading(false);
          setInitialLoad(false);
        }
      } catch (error) {
        console.error("❌ Error in fetchFreshServices:", error);
        if (isMountedRef.current) {
          setLoading(false);
          setInitialLoad(false);
          throw error;
        }
      }
    };

    useEffect(() => {
      isMountedRef.current = true;
      
      // Always show cached data immediately if available
      if (servicesCache) {
        console.log("🚀 Showing cached services data immediately");
        setServices(servicesCache.data);
        setLoading(false);
        setInitialLoad(false);
      }
      
      // Then fetch fresh data
      fetchServices();
      
      return () => {
        isMountedRef.current = false;
      };
    }, [fetchServices]);

    const handleSave = async (updated) => {
        const method = updated.id ? "PUT" : "POST";
        const endpoint = updated.id ? `api/services/${updated.id}` : "api/services";

        try {
            let saved;
            if (updated.id) {
                saved = await api.put(endpoint, updated);
            } else {
                saved = await api.post(endpoint, updated);
            }

            setServices((prev) => {
                const exists = prev.some((s) => s.id === saved.id);
                const newServices = exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved];
                
                // Update cache
                servicesCache = {
                  data: newServices,
                  timestamp: Date.now()
                };
                cacheTimestamp = Date.now();
                saveCacheToStorage(newServices);
                
                return newServices;
            });

            toast({
                title: updated.id ? "Service updated" : "Service added",
                description: `${saved.name} has been ${updated.id ? "updated" : "added"}.`,
            });

            setEditTarget(null);
        } catch (error) {
            console.error("❌ Error saving service:", error.message);
            setError("Failed to save service.");
            toast({
                title: "Save failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`api/services/${id}`);
            
            setServices((prev) => {
                const newServices = prev.filter((s) => s.id !== id);
                
                // Update cache
                servicesCache = {
                  data: newServices,
                  timestamp: Date.now()
                };
                cacheTimestamp = Date.now();
                saveCacheToStorage(newServices);
                
                return newServices;
            });
            setConfirmDeleteId(null);

            toast({
                title: "Service deleted",
                description: "The service has been removed successfully.",
            });
        } catch (error) {
            console.error("❌ Error deleting service:", error.message);
            setError("Failed to delete service.");
            toast({
                title: "Delete failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    // Skeleton Loader Components - Updated to match AdminDashboard pattern
    const SkeletonCard = ({ index }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border-2 p-5 transition-all"
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
                <div className="h-8 w-24 rounded animate-pulse"
                     style={{
                       backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                     }}></div>
            </div>
            
            <div className="space-y-2">
                <div className="h-5 w-32 rounded animate-pulse mb-2"
                     style={{
                       backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                     }}></div>
                <div className="h-4 w-44 rounded animate-pulse"
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
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-3"
        >
            <div className="flex items-center gap-3">
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
            </div>
            <div className="h-10 w-32 rounded-lg animate-pulse"
                 style={{
                   backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                 }}></div>
        </motion.div>
    );

    const ServiceCard = ({ service, index }) => (
        <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ 
                scale: 1.03,
                y: -2,
                transition: { duration: 0.2 }
            }}
            onClick={() => setEditTarget(service)}
            className="relative rounded-xl border-2 p-5 transition-all cursor-pointer"
            style={{
                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
            }}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(service.id);
                }}
                className="absolute right-3 top-3 rounded-lg p-1 transition-all hover:opacity-80"
                style={{
                    backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                }}
                title="Delete service"
            >
                <X
                    size={16}
                    style={{ color: isDarkMode ? '#F87171' : '#EF4444' }}
                />
            </button>

            <div className="mb-4 flex items-center gap-3">
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="rounded-lg p-2"
                    style={{
                        backgroundColor: "#0891B220",
                        color: "#0891B2",
                    }}
                >
                    <WashingMachine size={22} />
                </motion.div>
                <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                    {service.name}
                </h3>
            </div>
            
            <p className="text-sm mb-4" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/80' }}>
                {service.description}
            </p>
            
            <div className="flex items-center justify-between">
                <motion.p 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                    className="text-xl font-bold"
                    style={{ color: isDarkMode ? '#0891B2' : '#0E7490' }}
                >
                    ₱{service.price.toFixed(2)}
                </motion.p>
            </div>
        </motion.div>
    );

    // Show skeleton loader only during initial load AND when no cached data is available
    if (initialLoad && !servicesCache) {
        return (
            <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
                <SkeletonHeader />
                
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl border-2 p-4 transition-all"
                        style={{
                            backgroundColor: isDarkMode ? "#FEF2F2" : "#FEF2F2",
                            borderColor: isDarkMode ? "#F87171" : "#EF4444",
                        }}
                    >
                        <div className="h-5 w-full rounded animate-pulse"
                             style={{
                               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                             }}></div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, index) => (
                        <SkeletonCard key={index} index={index} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
            {/* 🧢 Section Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-3"
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
                        <Settings size={22} />
                    </motion.div>
                    <div>
                        <p className="text-xl font-bold" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
                            Service Options
                        </p>
                        <p className="text-sm" style={{ color: isDarkMode ? '#F3EDE3/70' : '#0B2B26/70' }}>
                            Manage your laundry services and pricing
                        </p>
                    </div>
                </div>
                
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditTarget({})}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
                    style={{
                        backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                        color: "#F3EDE3",
                    }}
                >
                    <Plus size={18} />
                    <span className="text-sm font-medium">Add Service</span>
                </motion.button>
            </motion.div>

            {/* 🔥 Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border-2 p-4 transition-all"
                    style={{
                        backgroundColor: isDarkMode ? "#FEF2F2" : "#FEF2F2",
                        borderColor: isDarkMode ? "#F87171" : "#EF4444",
                    }}
                >
                    <p className="text-sm font-medium" style={{ color: isDarkMode ? '#DC2626' : '#DC2626' }}>
                        {error}
                    </p>
                </motion.div>
            )}

            {/* 🧼 Service Cards */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {services.length > 0 ? (
                    services.map((service, index) => (
                        <ServiceCard key={service.id} service={service} index={index} />
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border-2 p-8 text-center col-span-full transition-all"
                        style={{
                            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        }}
                    >
                        <div className="flex flex-col items-center justify-center">
                            <Package className="mb-4 h-16 w-16 opacity-50" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/50' }} />
                            <p className="mb-2 text-lg font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                No services yet.
                            </p>
                            <p className="mb-4 text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                Start by adding your first service.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setEditTarget({})}
                                className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
                                style={{
                                    backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                    color: "#F3EDE3",
                                }}
                            >
                                <Plus size={18} />
                                <span className="text-sm font-medium">Add Your First Service</span>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ✏️ Edit Modal */}
            <AnimatePresence>
                {editTarget && (
                    <EditServiceModal
                        service={editTarget}
                        onClose={() => setEditTarget(null)}
                        onSave={handleSave}
                    />
                )}
            </AnimatePresence>

            {/* ❓ Confirm Delete */}
            <AnimatePresence>
                {confirmDeleteId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="w-full max-w-sm rounded-xl border-2 p-6 shadow-xl transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                            }}
                        >
                            <h3 className="mb-2 text-lg font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                Delete Service
                            </h3>
                            <p className="mb-4 text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/80' }}>
                                Are you sure you want to delete this service? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                                    style={{
                                        backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                                        color: isDarkMode ? '#13151B' : '#0B2B26',
                                    }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDelete(confirmDeleteId)}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all"
                                    style={{
                                        backgroundColor: '#EF4444',
                                    }}
                                >
                                    Delete
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}