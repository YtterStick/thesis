import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Trash2, Plus, Settings, WashingMachine, X, Package } from "lucide-react";
import EditServiceModal from "./components/EditServiceModal";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const CACHE_DURATION = 5 * 60 * 1000;

const initializeCache = () => {
  try {
    const stored = localStorage.getItem('servicesCache');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to load services cache from storage:', error);
  }
  return null;
};

let servicesCache = initializeCache();
let cacheTimestamp = servicesCache?.timestamp || null;

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
      if (servicesCache && servicesCache.data) return servicesCache.data;
      return [];
    });
    const [editTarget, setEditTarget] = useState(null);
    const [error, setError] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [loading, setLoading] = useState(!servicesCache);
    const [initialLoad, setInitialLoad] = useState(!servicesCache);
    const isMountedRef = useRef(true);

    const hasDataChanged = (newData, oldData) => {
      if (!oldData) return true;
      return JSON.stringify(newData) !== JSON.stringify(oldData);
    };

    const fetchServices = useCallback(async (forceRefresh = false) => {
      if (!isMountedRef.current) return;
      try {
        const now = Date.now();
        if (!forceRefresh && servicesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
          setServices(servicesCache.data);
          setLoading(false);
          setInitialLoad(false);
          return;
        }
        await fetchFreshServices();
      } catch (err) {
        console.error("Error fetching services:", err.message);
        if (servicesCache) setServices(servicesCache.data);
        setError("Failed to refresh services.");
        setLoading(false);
        setInitialLoad(false);
      }
    }, []);

    const fetchFreshServices = async () => {
      setLoading(true);
      try {
        const data = await api.get("/services");
        const newServices = data || [];
        const currentTime = Date.now();

        if (!servicesCache || hasDataChanged(newServices, servicesCache.data)) {
          servicesCache = { data: newServices, timestamp: currentTime };
          cacheTimestamp = currentTime;
          saveCacheToStorage(newServices);
          if (isMountedRef.current) {
            setServices(newServices);
            setError(null);
          }
        }
        if (isMountedRef.current) {
          setLoading(false);
          setInitialLoad(false);
        }
      } catch (error) {
        if (isMountedRef.current) {
          setLoading(false);
          setInitialLoad(false);
          throw error;
        }
      }
    };

    useEffect(() => {
      isMountedRef.current = true;
      fetchServices();
      return () => { isMountedRef.current = false; };
    }, [fetchServices]);

    const handleSave = async (updated) => {
        const endpoint = updated.id ? `/services/${updated.id}` : "/services";
        try {
            const saved = updated.id ? await api.put(endpoint, updated) : await api.post(endpoint, updated);
            setServices((prev) => {
                const exists = prev.some((s) => s.id === saved.id);
                const newServices = exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved];
                servicesCache = { data: newServices, timestamp: Date.now() };
                cacheTimestamp = Date.now();
                saveCacheToStorage(newServices);
                return newServices;
            });
            toast({ title: updated.id ? "Service updated" : "Service added" });
            setEditTarget(null);
        } catch (error) {
            toast({ title: "Save failed", variant: "destructive" });
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/services/${id}`);
            setServices((prev) => {
                const newServices = prev.filter((s) => s.id !== id);
                servicesCache = { data: newServices, timestamp: Date.now() };
                cacheTimestamp = Date.now();
                saveCacheToStorage(newServices);
                return newServices;
            });
            setConfirmDeleteId(null);
            toast({ title: "Service deleted" });
        } catch (error) {
            toast({ title: "Delete failed", variant: "destructive" });
        }
    };

    const SkeletonCard = ({ index }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border p-5 transition-all shadow-sm"
            style={{ backgroundColor: "var(--admin-card-bg)", borderColor: "var(--admin-card-border)" }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="w-fit rounded-lg p-2 animate-pulse" style={{ backgroundColor: "var(--admin-accent-soft)" }}>
                    <div className="h-6 w-6"></div>
                </div>
                <div className="h-8 w-24 rounded animate-pulse" style={{ backgroundColor: "var(--admin-accent-soft)" }}></div>
            </div>
            <div className="space-y-2">
                <div className="h-5 w-32 rounded animate-pulse mb-2" style={{ backgroundColor: "var(--admin-accent-soft)" }}></div>
                <div className="h-4 w-44 rounded animate-pulse" style={{ backgroundColor: "var(--admin-accent-soft)" }}></div>
            </div>
        </motion.div>
    );

    const SkeletonHeader = () => (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg animate-pulse" style={{ backgroundColor: "var(--admin-accent-soft)" }}></div>
                <div className="space-y-2">
                    <div className="h-6 w-44 rounded-lg animate-pulse" style={{ backgroundColor: "var(--admin-accent-soft)" }}></div>
                    <div className="h-4 w-56 rounded animate-pulse" style={{ backgroundColor: "var(--admin-accent-soft)" }}></div>
                </div>
            </div>
            <div className="h-10 w-32 rounded-lg animate-pulse" style={{ backgroundColor: "var(--admin-accent-soft)" }}></div>
        </div>
    );

    const ServiceCard = ({ service, index }) => (
        <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => setEditTarget(service)}
            className="relative rounded-xl border p-5 transition-all cursor-pointer hover:shadow-lg group"
            style={{ backgroundColor: "var(--admin-card-bg)", borderColor: "var(--admin-card-border)" }}
        >
            <button
                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(service.id); }}
                className="absolute right-3 top-3 rounded-lg p-1.5 transition-all opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20"
                style={{ backgroundColor: "var(--admin-bg)", border: "1px solid var(--admin-card-border)" }}
            >
                <Trash2 size={14} className="text-red-500" />
            </button>
            <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg p-2.5 shadow-sm" style={{ backgroundColor: "var(--admin-accent-soft)", color: "var(--admin-accent)" }}>
                    <WashingMachine size={22} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: "var(--admin-text-primary)" }}>{service.name}</h3>
            </div>
            <p className="text-sm mb-6 line-clamp-2 min-h-[40px]" style={{ color: "var(--admin-text-secondary)" }}>
                {service.description || "No description provided."}
            </p>
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--admin-card-border)" }}>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-50" style={{ color: "var(--admin-text-secondary)" }}>Base Price</span>
                    <p className="text-xl font-bold" style={{ color: "var(--admin-accent)" }}>₱{service.price.toFixed(2)}</p>
                </div>
                <div className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800" style={{ color: "var(--admin-text-secondary)" }}>
                    Service
                </div>
            </div>
        </motion.div>
    );

    if (initialLoad && !servicesCache) {
        return (
            <div className="p-6" style={{ backgroundColor: "var(--admin-bg)" }}>
                <SkeletonHeader />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, index) => <SkeletonCard key={index} index={index} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen" style={{ backgroundColor: "var(--admin-bg)" }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 shadow-sm" style={{ backgroundColor: "var(--admin-accent)", color: "var(--admin-card-bg)" }}>
                        <Settings size={22} />
                    </div>
                    <div>
                        <p className="text-xl font-bold" style={{ color: "var(--admin-text-primary)" }}>Service Options</p>
                        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>Configure categories and pricing</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditTarget({})}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all shadow-md"
                    style={{ backgroundColor: "var(--admin-accent)", color: "var(--admin-card-bg)" }}
                >
                    <Plus size={18} />
                    <span className="text-sm font-bold">Add Service</span>
                </motion.button>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {services.length > 0 ? (
                    services.map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)
                ) : (
                    <div className="rounded-xl border p-12 text-center col-span-full shadow-sm" style={{ backgroundColor: "var(--admin-card-bg)", borderColor: "var(--admin-card-border)" }}>
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" style={{ color: "var(--admin-text-secondary)" }} />
                        <p className="text-xl font-bold" style={{ color: "var(--admin-text-primary)" }}>No services found.</p>
                        <button onClick={() => setEditTarget({})} className="mt-4 px-6 py-2 rounded-lg font-bold" style={{ backgroundColor: "var(--admin-accent)", color: "var(--admin-card-bg)" }}>
                            Create First Service
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {editTarget && <EditServiceModal service={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />}
            </AnimatePresence>

            <AnimatePresence>
                {confirmDeleteId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-2xl border p-8 shadow-2xl" style={{ backgroundColor: "var(--admin-card-bg)", borderColor: "var(--admin-card-border)" }}>
                            <h3 className="text-xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Delete Service?</h3>
                            <p className="text-sm mb-8" style={{ color: "var(--admin-text-secondary)" }}>Permanently remove this service? This cannot be undone.</p>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => handleDelete(confirmDeleteId)} className="w-full rounded-xl py-3 text-sm font-bold text-white bg-red-500">Delete Permanently</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="w-full rounded-xl py-3 text-sm font-bold border" style={{ color: "var(--admin-text-primary)", borderColor: "var(--admin-card-border)" }}>Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}