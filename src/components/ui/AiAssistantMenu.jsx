import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquare, LineChart, Loader2, AlertCircle, X, ChevronDown, Star, WrenchIcon, Activity, ExternalLink } from "lucide-react";
import { api } from "@/lib/api-config";
import { useNavigate } from "react-router-dom";

export function AiAssistantMenu({ isDarkMode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeModal, setActiveModal] = useState(null); // 'insights', 'sentiment', or 'diagnostics'
    const navigate = useNavigate();
    
    // Insights State
    const [insight, setInsight] = useState(null);
    const [insightLoading, setInsightLoading] = useState(false);
    const [insightError, setInsightError] = useState(null);

    // Sentiment State
    const [sentiment, setSentiment] = useState(null);
    const [sentimentLoading, setSentimentLoading] = useState(false);
    const [sentimentError, setSentimentError] = useState(null);
    const [addingReview, setAddingReview] = useState(false);

    // Diagnostics State (NEW)
    const [machineHealth, setMachineHealth] = useState([]);
    const [machineHealthLoading, setMachineHealthLoading] = useState(false);
    const [diagnostics, setDiagnostics] = useState(null);
    const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
    const [diagnosticsError, setDiagnosticsError] = useState(null);
    const [selectedMachine, setSelectedMachine] = useState(null);

    const handleOpenModal = (type) => {
        setIsOpen(false);
        setActiveModal(type);
        if (type === 'insights' && !insight) fetchInsights();
        if (type === 'sentiment' && !sentiment) fetchSentiment();
        if (type === 'diagnostics') {
            fetchMachineHealth();
        }
    };

    const fetchInsights = async () => {
        try {
            setInsightLoading(true);
            setInsightError(null);
            const response = await api.get("/dashboard/admin/ai-insights");
            setInsight(response.insight);
        } catch (err) {
            console.error("Failed to fetch AI insights:", err);
            setInsightError("Failed to load AI insights.");
        } finally {
            setInsightLoading(false);
        }
    };

    const fetchSentiment = async () => {
        try {
            setSentimentLoading(true);
            setSentimentError(null);
            const response = await api.get("/api/reviews/sentiment");
            setSentiment(response.sentiment);
        } catch (err) {
            console.error("Failed to fetch AI sentiment:", err);
            setSentimentError("Failed to load AI sentiment analysis.");
        } finally {
            setSentimentLoading(false);
        }
    };

    const fetchMachineHealth = async () => {
        try {
            setMachineHealthLoading(true);
            const response = await api.get("/dashboard/admin/machine-health");
            setMachineHealth(response);
        } catch (err) {
            console.error("Failed to fetch machine health:", err);
        } finally {
            setMachineHealthLoading(false);
        }
    };

    const fetchDiagnostics = async () => {
        try {
            setDiagnosticsLoading(true);
            setDiagnosticsError(null);
            const response = await api.get("/dashboard/admin/machine-health/ai-analysis");
            setDiagnostics(response.analysis);
        } catch (err) {
            console.error("Failed to fetch AI diagnostics:", err);
            setDiagnosticsError("Failed to load AI diagnostics.");
        } finally {
            setDiagnosticsLoading(false);
        }
    };

    const renderFormattedText = (text) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <span key={index} className="font-extrabold text-blue-600 dark:text-blue-400">
                        {part.slice(2, -2)}
                    </span>
                );
            }
            return part;
        });
    };

    const addDummyReview = async (rating, comment) => {
        try {
            setAddingReview(true);
            await api.post("/api/reviews", {
                customerName: "Test Customer",
                rating: rating,
                comment: comment
            });
            await fetchSentiment();
        } catch (err) {
            console.error("Failed to add review", err);
        } finally {
            setAddingReview(false);
        }
    };

    return (
        <div className="relative z-50">
            {/* Header Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40"
                style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
                <Sparkles className="w-4 h-4" />
                <span>AI Assistant</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 top-full mt-2 w-64 rounded-xl border p-2 shadow-2xl z-50"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                                borderColor: isDarkMode ? "#334155" : "#e2e8f0"
                            }}
                        >
                            <button
                                onClick={() => handleOpenModal('insights')}
                                className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                                style={{ color: isDarkMode ? "#e2e8f0" : "#1e293b" }}
                            >
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    <LineChart className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">Business Insights</div>
                                    <div className="text-xs opacity-70">Analyze operations</div>
                                </div>
                            </button>
                            <button
                                onClick={() => handleOpenModal('sentiment')}
                                className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left mt-1"
                                style={{ color: isDarkMode ? "#e2e8f0" : "#1e293b" }}
                            >
                                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">Customer Sentiment</div>
                                    <div className="text-xs opacity-70">Analyze feedback</div>
                                </div>
                            </button>
                            <button
                                onClick={() => handleOpenModal('diagnostics')}
                                className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left mt-1"
                                style={{ color: isDarkMode ? "#e2e8f0" : "#1e293b" }}
                            >
                                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                    <WrenchIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">Machine Diagnostics</div>
                                    <div className="text-xs opacity-70">Predictive maintenance</div>
                                </div>
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Insights Modal */}
            <AnimatePresence>
                {activeModal === 'insights' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                        onClick={() => setActiveModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-lg rounded-2xl border p-6 relative overflow-hidden"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                                borderColor: isDarkMode ? "#334155" : "#e2e8f0"
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
                                style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)" }} />

                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-blue-500">
                                        Business Insights
                                    </h3>
                                </div>
                                <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
                                    <X className="w-5 h-5" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }} />
                                </button>
                            </div>

                            <div className="relative z-10 min-h-[100px] flex items-center justify-center">
                                {insightLoading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                        <span className="text-sm text-slate-500">Generating insights...</span>
                                    </div>
                                ) : insightError ? (
                                    <div className="flex items-center gap-2 text-sm text-red-500 p-4 rounded-xl bg-red-50 dark:bg-red-900/20">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <span>{insightError}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm leading-relaxed p-4 rounded-xl w-full" style={{ 
                                        color: isDarkMode ? "#e2e8f0" : "#334155",
                                        backgroundColor: isDarkMode ? "rgba(51,65,85,0.4)" : "rgba(241,245,249,0.8)"
                                    }}>
                                        {insight}
                                    </p>
                                )}
                            </div>
                            
                            {!insightLoading && (
                                <div className="mt-4 flex justify-end relative z-10">
                                    <button onClick={fetchInsights} className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors">
                                        Refresh Insights
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sentiment Modal */}
            <AnimatePresence>
                {activeModal === 'sentiment' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                        onClick={() => setActiveModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-lg rounded-2xl border p-6 relative overflow-hidden"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                                borderColor: isDarkMode ? "#334155" : "#e2e8f0"
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
                                style={{ background: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)" }} />

                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                                        Customer Sentiment
                                    </h3>
                                </div>
                                <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
                                    <X className="w-5 h-5" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }} />
                                </button>
                            </div>

                            <div className="relative z-10 min-h-[100px] flex items-center justify-center">
                                {sentimentLoading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                                        <span className="text-sm text-slate-500">Analyzing feedback...</span>
                                    </div>
                                ) : sentimentError ? (
                                    <div className="flex items-center gap-2 text-sm text-red-500 p-4 rounded-xl bg-red-50 dark:bg-red-900/20">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <span>{sentimentError}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm leading-relaxed p-4 rounded-xl w-full" style={{ 
                                        color: isDarkMode ? "#e2e8f0" : "#334155",
                                        backgroundColor: isDarkMode ? "rgba(51,65,85,0.4)" : "rgba(241,245,249,0.8)"
                                    }}>
                                        {sentiment}
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 pt-4 relative z-10 border-t" style={{ borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
                                <p className="text-xs mb-3 text-slate-500">Test: Add dummy reviews</p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => addDummyReview(5, "Great service, folded perfectly! Will come back.")}
                                        disabled={addingReview}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all hover:opacity-80 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    >
                                        {addingReview ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3 fill-current" />}
                                        Add 5-Star
                                    </button>
                                    <button 
                                        onClick={() => addDummyReview(2, "Took too long. Very crowded.")}
                                        disabled={addingReview}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all hover:opacity-80 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    >
                                        {addingReview ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3 fill-current" />}
                                        Add 2-Star
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Diagnostics Modal */}
            <AnimatePresence>
                {activeModal === 'diagnostics' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                        onClick={() => setActiveModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-2xl rounded-2xl border p-6 relative overflow-hidden max-h-[85vh] flex flex-col"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                                borderColor: isDarkMode ? "#334155" : "#e2e8f0"
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
                                style={{ background: "linear-gradient(135deg, #6366f1 0%, #3B82F6 100%)" }} />

                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-lg">
                                        <WrenchIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-blue-500">
                                            AI Machine Diagnostics
                                        </h3>
                                        <p className="text-xs" style={{ color: isDarkMode ? "#64748b" : "#94a3b8" }}>
                                            Real-time predictive maintenance logs
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
                                    <X className="w-5 h-5" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }} />
                                </button>
                            </div>

                            {/* AI diagnostic summary card */}
                            <div className="mb-4 rounded-xl border p-4 bg-gradient-to-br relative overflow-hidden z-10"
                                style={{
                                    borderColor: isDarkMode ? "#4338ca" : "#c7d2fe",
                                    background: isDarkMode 
                                        ? "linear-gradient(135deg, rgba(49,46,129,0.15) 0%, rgba(15,23,42,0.2) 100%)"
                                        : "linear-gradient(135deg, rgba(238,242,255,0.7) 0%, rgba(255,255,255,1) 100%)"
                                }}
                            >
                                <div className="flex items-center justify-between gap-3 relative z-10 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                            AI Predictive Diagnostics
                                        </span>
                                    </div>
                                    {diagnostics && (
                                        <button 
                                            onClick={fetchDiagnostics}
                                            disabled={diagnosticsLoading}
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 cursor-pointer"
                                        >
                                            {diagnosticsLoading ? "Regenerating..." : "Refresh"}
                                        </button>
                                    )}
                                </div>

                                <div className="text-sm relative z-10" style={{ color: "var(--admin-text-secondary)" }}>
                                    {diagnosticsLoading ? (
                                        <div className="flex items-center gap-2 py-2 text-indigo-500 font-medium">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>StarWash AI is analyzing workload histories & patterns...</span>
                                        </div>
                                    ) : diagnosticsError ? (
                                        <div className="text-red-500 text-xs py-1">{diagnosticsError}</div>
                                    ) : diagnostics ? (
                                        <p className="leading-relaxed text-slate-700 dark:text-slate-300 text-xs font-medium">
                                            {renderFormattedText(diagnostics)}
                                        </p>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                                            <span className="text-xs text-slate-500 dark:text-slate-400 text-left">
                                                Use StarWash AI to check for breakdown risks, identify overused equipment, and predict maintenance urgency.
                                            </span>
                                            <button
                                                onClick={fetchDiagnostics}
                                                className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                                style={{ background: "linear-gradient(135deg, #4F46E5, #3730A3)" }}
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Generate AI Analysis
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Machine List */}
                            <div className="overflow-y-auto flex-1 space-y-3 pr-1 relative z-10">
                                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-left" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                                    Machine Workload & Maintenance Status
                                </h4>
                                {machineHealthLoading ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                    </div>
                                ) : (
                                    machineHealth.map((machine, index) => {
                                        const isCritical = machine.severity === "CRITICAL";
                                        const isWarning = machine.severity === "WARNING";
                                        
                                        const colors = isCritical 
                                            ? { bg: "#DC2626", text: "#FEE2E2", border: "#F87171" }
                                            : isWarning 
                                                ? { bg: "#F59E0B", text: "#FEF3C7", border: "#FBBF24" }
                                                : { bg: "#10B981", text: "#D1FAE5", border: "#34D399" };

                                        const progressColor = machine.totalLoadsProcessed >= 200 
                                            ? "#EF4444" 
                                            : machine.totalLoadsProcessed >= 100 
                                                ? "#F59E0B" 
                                                : "#10B981";

                                        const maxLoads = Math.max(...machineHealth.map(m => m.totalLoadsProcessed), 1);
                                        const progressPercent = Math.min((machine.totalLoadsProcessed / maxLoads) * 100, 100);

                                        return (
                                            <div
                                                key={machine.machineId}
                                                className="rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer text-left"
                                                style={{
                                                    backgroundColor: isDarkMode ? "rgba(51,65,85,0.3)" : "rgba(248,250,252,1)",
                                                    borderColor: machine.needsMaintenance ? colors.border : (isDarkMode ? "#334155" : "#e2e8f0"),
                                                    borderWidth: machine.needsMaintenance ? "2px" : "1px"
                                                }}
                                                onClick={() => setSelectedMachine(selectedMachine?.machineId === machine.machineId ? null : machine)}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                                                            {machine.machineName}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                                            style={{ backgroundColor: colors.text, color: colors.bg }}>
                                                            {machine.severity}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full"
                                                            style={{ 
                                                                backgroundColor: isDarkMode ? "rgba(100,116,139,0.3)" : "#f1f5f9",
                                                                color: isDarkMode ? "#94a3b8" : "#64748b"
                                                            }}>
                                                            {machine.machineType}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-bold" style={{ color: progressColor }}>
                                                        {machine.totalLoadsProcessed} loads
                                                    </span>
                                                </div>

                                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDarkMode ? "#1e293b" : "#e2e8f0" }}>
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{ 
                                                            width: `${progressPercent}%`,
                                                            backgroundColor: progressColor 
                                                        }}
                                                    />
                                                </div>

                                                <AnimatePresence>
                                                    {selectedMachine?.machineId === machine.machineId && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
                                                                <p className="text-sm font-medium" style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}>
                                                                    {machine.message}
                                                                </p>
                                                                <div className="flex items-center gap-4 text-xs" style={{ color: isDarkMode ? "#64748b" : "#94a3b8" }}>
                                                                    <span>Status: <strong>{machine.status}</strong></span>
                                                                    {machine.lastMaintenance && <span>Last Maintenance: <strong>{machine.lastMaintenance}</strong></span>}
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        sessionStorage.setItem('autoEditMachineId', machine.machineId);
                                                                        setActiveModal(null);
                                                                        navigate("/machines");
                                                                    }}
                                                                    className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-lg cursor-pointer"
                                                                    style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
                                                                >
                                                                    <WrenchIcon className="w-4 h-4" />
                                                                    Go to Machine Management
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
