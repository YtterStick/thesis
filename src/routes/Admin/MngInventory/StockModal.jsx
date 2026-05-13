import { useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

const StockModal = ({ item, onClose, onSubmit, loading = false }) => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    const [amount, setAmount] = useState("");
    const [mode, setMode] = useState("ADD"); // ADD or DEDUCT
    const [notes, setNotes] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (loading) return; 
        
        const parsed = parseInt(amount, 10);
        if (!isNaN(parsed) && parsed > 0) {
            onSubmit(parsed, mode, notes);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="rounded-xl border shadow-xl w-full max-w-sm transition-all overflow-hidden"
                style={{
                    backgroundColor: "var(--admin-card-bg)",
                    borderColor: "var(--admin-card-border)",
                }}
            >
                {/* Header */}
                <div className="p-5 border-b" style={{ borderColor: "var(--admin-card-border)", backgroundColor: "var(--admin-accent-soft)" }}>
                    <p className="text-lg font-bold" style={{ color: "var(--admin-text-primary)" }}>
                        Stock Control
                    </p>
                    <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>
                        {item.name} ({item.quantity} {item.unit})
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex p-1 rounded-lg gap-1" style={{ backgroundColor: "var(--admin-bg)" }}>
                        <button
                            type="button"
                            onClick={() => setMode("ADD")}
                            className="flex-1 py-1.5 text-xs font-bold rounded-md transition-all"
                            style={{
                                backgroundColor: mode === "ADD" ? "var(--admin-accent)" : "transparent",
                                color: mode === "ADD" ? "#FFFFFF" : "var(--admin-text-secondary)",
                            }}
                        >
                            Add Stock
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("DEDUCT")}
                            className="flex-1 py-1.5 text-xs font-bold rounded-md transition-all"
                            style={{
                                backgroundColor: mode === "DEDUCT" ? "#ef4444" : "transparent",
                                color: mode === "DEDUCT" ? "#FFFFFF" : "var(--admin-text-secondary)",
                            }}
                        >
                            Deduct Stock
                        </button>
                    </div>

                    <div>
                        <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--admin-text-secondary)" }}>
                            Amount ({item.unit})
                        </label>
                        <input
                            type="number"
                            min={1}
                            placeholder={`Enter amount to ${mode.toLowerCase()}`}
                            className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-admin-accent disabled:opacity-50"
                            style={{
                                backgroundColor: "var(--admin-bg)",
                                borderColor: "var(--admin-card-border)",
                                color: "var(--admin-text-primary)",
                            }}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    {mode === "DEDUCT" && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                        >
                            <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--admin-text-secondary)" }}>
                                Reason / Notes
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Damaged, Used in service"
                                className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-admin-accent disabled:opacity-50"
                                style={{
                                    backgroundColor: "var(--admin-bg)",
                                    borderColor: "var(--admin-card-border)",
                                    color: "var(--admin-text-primary)",
                                }}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                required={mode === "DEDUCT"}
                                disabled={loading}
                            />
                        </motion.div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg px-4 py-2 text-sm font-bold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                            style={{
                                color: "var(--admin-text-secondary)",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg px-4 py-2 text-sm font-bold text-white transition-all shadow-md hover:opacity-90 disabled:opacity-50"
                            style={{
                                backgroundColor: mode === "ADD" ? "var(--admin-accent)" : "#ef4444",
                            }}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Processing...
                                </div>
                            ) : (
                                mode === "ADD" ? "Confirm Add" : "Confirm Deduct"
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

StockModal.propTypes = {
    item: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool,
};

export default StockModal;