import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertCircle, X } from "lucide-react";
import { api } from "@/lib/api-config";

export function AiInsightsCard({ isDarkMode }) {
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get("/dashboard/admin/ai-insights");
            setInsight(response.insight);
            setShowModal(true);
        } catch (err) {
            console.error("Failed to fetch AI insights:", err);
            setError("Failed to load AI insights.");
            setShowModal(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Trigger Button Card */}
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchInsights}
                disabled={loading}
                className="w-full h-full rounded-xl border-2 p-5 transition-all overflow-hidden relative cursor-pointer group flex flex-col items-center justify-center text-center"
                style={{
                    backgroundColor: "var(--admin-card-bg)",
                    borderColor: "var(--admin-card-border)",
                    background: isDarkMode 
                        ? "linear-gradient(135deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)" 
                        : "linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)"
                }}
            >
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.15, 0.05] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                    style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)", transform: "translate(30%, -30%)" }}
                />

                <div className="flex flex-col items-center gap-3 relative z-10 w-full">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                        {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Sparkles className="w-7 h-7" />}
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-blue-500">
                            Business Insights
                        </h3>
                        <p className="text-xs mt-1 px-2" style={{ color: "var(--admin-text-secondary)" }}>
                            {loading ? "Analyzing dashboard..." : "Generate AI business strategies"}
                        </p>
                    </div>

                    <div 
                        className="mt-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-md group-hover:shadow-lg w-full max-w-[160px]"
                        style={{ background: "linear-gradient(135deg, #8B5CF6, #3B82F6)" }}
                    >
                        {loading ? "Analyzing..." : "Generate"}
                    </div>
                </div>
            </motion.button>

            {/* Modal Overlay */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-lg rounded-2xl border-2 p-6 relative overflow-hidden"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                                borderColor: isDarkMode ? "#334155" : "#e2e8f0"
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Glow */}
                            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
                                style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)" }} />

                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/20">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-blue-500">
                                        AI Business Insights
                                    </h3>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    <X className="w-5 h-5" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }} />
                                </button>
                            </div>

                            <div className="relative z-10">
                                {error ? (
                                    <div className="flex items-center gap-2 text-sm text-red-500 p-4 rounded-xl" style={{ backgroundColor: isDarkMode ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.05)" }}>
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm leading-relaxed p-4 rounded-xl" style={{ 
                                        color: isDarkMode ? "#e2e8f0" : "#334155",
                                        backgroundColor: isDarkMode ? "rgba(51,65,85,0.4)" : "rgba(241,245,249,0.8)"
                                    }}>
                                        {insight}
                                    </p>
                                )}
                            </div>

                            <p className="text-xs mt-4 text-center relative z-10" style={{ color: isDarkMode ? "#64748b" : "#94a3b8" }}>
                                Powered by Gemini AI • Cached for 4 hours to save tokens
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
