import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, WrenchIcon, X, ExternalLink, Activity, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api-config";
import { useNavigate } from "react-router-dom";

export function AiSchedulingCard({ isDarkMode }) {
    const [machineHealth, setMachineHealth] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const navigate = useNavigate();

    // Fetch machine health on mount (this is NOT an AI call — zero tokens used)
    useEffect(() => {
        const fetchMachineHealth = async () => {
            try {
                setLoading(true);
                const response = await api.get("/dashboard/admin/machine-health");
                setMachineHealth(response);
            } catch (err) {
                console.error("Failed to fetch machine health:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMachineHealth();
    }, []);

    const flaggedMachines = machineHealth.filter(m => m.needsMaintenance);
    const hasCritical = flaggedMachines.some(m => m.severity === "CRITICAL");
    const hasWarnings = flaggedMachines.length > 0;

    const getSeverityColor = (severity) => {
        if (severity === "CRITICAL") return { bg: "#DC2626", text: "#FEE2E2", border: "#F87171" };
        if (severity === "WARNING") return { bg: "#F59E0B", text: "#FEF3C7", border: "#FBBF24" };
        return { bg: "#10B981", text: "#D1FAE5", border: "#34D399" };
    };

    const getProgressColor = (loads) => {
        if (loads >= 200) return "#EF4444";
        if (loads >= 100) return "#F59E0B";
        return "#10B981";
    };

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-1 md:col-span-2 lg:col-span-7 rounded-xl border-2 p-5"
                style={{ backgroundColor: "var(--admin-card-bg)", borderColor: "var(--admin-card-border)" }}
            >
                <div className="flex items-center gap-3 text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing machine health...</span>
                </div>
            </motion.div>
        );
    }

    return (
        <>
            {/* Warning Banner — only shows if there are flagged machines */}
            {hasWarnings ? (
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setShowModal(true)}
                    className="w-full rounded-xl border-2 p-5 transition-all overflow-hidden relative text-left cursor-pointer group"
                    style={{
                        backgroundColor: "var(--admin-card-bg)",
                        borderColor: hasCritical ? "#F87171" : "#FBBF24",
                        background: isDarkMode
                            ? hasCritical 
                                ? "linear-gradient(135deg, rgba(127,29,29,0.4) 0%, rgba(15,23,42,1) 100%)"
                                : "linear-gradient(135deg, rgba(113,63,18,0.3) 0%, rgba(15,23,42,1) 100%)"
                            : hasCritical
                                ? "linear-gradient(135deg, rgba(254,226,226,1) 0%, rgba(255,255,255,1) 100%)"
                                : "linear-gradient(135deg, rgba(254,243,199,1) 0%, rgba(255,255,255,1) 100%)"
                    }}
                >
                    {/* Pulsing warning glow */}
                    <motion.div 
                        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                        style={{ background: hasCritical ? "#EF4444" : "#F59E0B" }}
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10 w-full">
                        <div className={`p-3 rounded-xl text-white shadow-lg w-fit transition-shadow ${hasCritical ? 'shadow-red-500/30 group-hover:shadow-red-500/50' : 'shadow-amber-500/30 group-hover:shadow-amber-500/50'}`}
                            style={{ background: hasCritical ? "linear-gradient(135deg, #DC2626, #B91C1C)" : "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1">
                            <h3 className="text-lg font-bold" style={{ color: hasCritical ? "#DC2626" : "#D97706" }}>
                                {hasCritical ? "⚠️ Critical Maintenance Alert" : "🔧 Maintenance Advisory"}
                            </h3>
                            <p className="text-sm mt-0.5" style={{ color: "var(--admin-text-secondary)" }}>
                                {flaggedMachines.length} machine{flaggedMachines.length > 1 ? 's' : ''} {hasCritical ? 'urgently need' : 'may need'} maintenance — Click to view details
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                            {flaggedMachines.slice(0, 3).map((m, i) => (
                                <span key={i} className="px-2 py-1 rounded-md text-xs font-bold" 
                                    style={{ 
                                        backgroundColor: getSeverityColor(m.severity).text,
                                        color: getSeverityColor(m.severity).bg
                                    }}>
                                    {m.machineName}
                                </span>
                            ))}
                            {flaggedMachines.length > 3 && (
                                <span className="text-xs font-medium" style={{ color: "var(--admin-text-secondary)" }}>
                                    +{flaggedMachines.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                </motion.button>
            ) : null}

            {/* Detailed Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                        onClick={() => { setShowModal(false); setSelectedMachine(null); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-2xl rounded-2xl border-2 p-6 relative overflow-hidden max-h-[85vh] flex flex-col"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                                borderColor: isDarkMode ? "#334155" : "#e2e8f0"
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl text-white shadow-lg"
                                        style={{ background: hasCritical ? "linear-gradient(135deg, #DC2626, #B91C1C)" : "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold" style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}>
                                            Machine Health Report
                                        </h3>
                                        <p className="text-xs" style={{ color: isDarkMode ? "#64748b" : "#94a3b8" }}>
                                            Based on actual load assignment data • No AI tokens used
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => { setShowModal(false); setSelectedMachine(null); }} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    <X className="w-5 h-5" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }} />
                                </button>
                            </div>

                            {/* Machine List */}
                            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                                {machineHealth.map((machine, index) => {
                                    const colors = getSeverityColor(machine.severity);
                                    const maxLoads = Math.max(...machineHealth.map(m => m.totalLoadsProcessed), 1);
                                    const progressPercent = Math.min((machine.totalLoadsProcessed / maxLoads) * 100, 100);

                                    return (
                                        <motion.div
                                            key={machine.machineId}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer"
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
                                                <span className="text-sm font-bold" style={{ color: getProgressColor(machine.totalLoadsProcessed) }}>
                                                    {machine.totalLoadsProcessed} loads
                                                </span>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDarkMode ? "#1e293b" : "#e2e8f0" }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPercent}%` }}
                                                    transition={{ duration: 0.8, delay: index * 0.05 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: getProgressColor(machine.totalLoadsProcessed) }}
                                                />
                                            </div>

                                            {/* Expanded details */}
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
                                                            <p className="text-sm" style={{ color: isDarkMode ? "#cbd5e1" : "#475569" }}>
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
                                                                    setShowModal(false);
                                                                    navigate("/machines");
                                                                }}
                                                                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-lg"
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
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
