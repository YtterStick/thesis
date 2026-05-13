import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, History, TrendingUp, TrendingDown, RefreshCw, User, Calendar, MessageSquare } from "lucide-react";
import { api } from "@/lib/api-config";

const StockHistoryModal = ({ item, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await api.get(`/stock/${item.id}/history`);
                setHistory(data);
            } catch (error) {
                console.error("Error fetching stock history:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [item.id]);

    const formatTimestamp = (ts) => {
        return new Date(ts).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getLogIcon = (type) => {
        switch (type) {
            case 'ADD': return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'DEDUCT': return <TrendingDown className="h-4 w-4 text-red-500" />;
            case 'UPDATE': return <RefreshCw className="h-4 w-4 text-blue-500" />;
            default: return <History className="h-4 w-4 text-slate-500" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="rounded-xl border shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col transition-all overflow-hidden"
                style={{
                    backgroundColor: "var(--admin-card-bg)",
                    borderColor: "var(--admin-card-border)",
                }}
            >
                {/* Header */}
                <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--admin-card-border)", backgroundColor: "var(--admin-accent-soft)" }}>
                    <div className="flex items-center gap-3">
                        <History className="h-5 w-5" style={{ color: "var(--admin-accent)" }} />
                        <div>
                            <p className="text-lg font-bold" style={{ color: "var(--admin-text-primary)" }}>
                                Stock History
                            </p>
                            <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>
                                Activity log for {item.name}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X className="h-5 w-5" style={{ color: "var(--admin-text-secondary)" }} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-admin-accent border-t-transparent" />
                            <p className="text-sm font-medium" style={{ color: "var(--admin-text-secondary)" }}>Loading history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <History className="h-12 w-12 mb-3 opacity-20" />
                            <p className="text-sm font-bold" style={{ color: "var(--admin-text-primary)" }}>No History Found</p>
                            <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>Changes to this item will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((log, idx) => (
                                <motion.div 
                                    key={log.id || idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-4 rounded-xl border relative overflow-hidden group"
                                    style={{ 
                                        borderColor: "var(--admin-card-border)",
                                        backgroundColor: "var(--admin-bg)"
                                    }}
                                >
                                    {/* Type Indicator */}
                                    <div className="absolute top-0 left-0 bottom-0 w-1" style={{ 
                                        backgroundColor: log.type === 'ADD' ? '#22c55e' : log.type === 'DEDUCT' ? '#ef4444' : '#3b82f6' 
                                    }} />

                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {getLogIcon(log.type)}
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                {log.type === 'INITIAL' ? 'Initial Stock' : log.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-medium opacity-60">
                                            <Calendar className="h-3 w-3" />
                                            {formatTimestamp(log.timestamp)}
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-sm font-bold" style={{ color: "var(--admin-text-primary)" }}>
                                                {log.amount > 0 ? `+${log.amount}` : log.amount} {item.unit}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] opacity-60">Balance:</span>
                                                <span className="text-xs font-bold">{log.newQuantity} {item.unit}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <User className="h-3 w-3 opacity-40" />
                                                <span className="text-xs font-medium" style={{ color: "var(--admin-text-primary)" }}>
                                                    {log.updatedBy || 'System'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {log.notes && (
                                        <div className="mt-3 flex gap-2 p-2 rounded-lg bg-white/50 dark:bg-black/20 border border-dashed border-slate-200 dark:border-slate-800">
                                            <MessageSquare className="h-3 w-3 mt-0.5 opacity-40 shrink-0" />
                                            <p className="text-xs italic leading-relaxed" style={{ color: "var(--admin-text-secondary)" }}>
                                                {log.notes}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50 dark:bg-slate-900/50">
                    <button 
                        onClick={onClose}
                        className="w-full py-2.5 rounded-lg text-sm font-bold text-white shadow-lg transition-all active:scale-95"
                        style={{ backgroundColor: "var(--admin-accent)" }}
                    >
                        Done
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default StockHistoryModal;
