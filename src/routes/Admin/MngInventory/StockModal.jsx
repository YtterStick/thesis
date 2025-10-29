import { useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

const StockModal = ({ item, onClose, onSubmit, loading = false }) => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    const [amount, setAmount] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (loading) return; // Prevent submission while loading
        
        const parsed = parseInt(amount, 10);
        if (!isNaN(parsed) && parsed > 0) {
            onSubmit(parsed);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border-2 p-6 w-full max-w-sm transition-all"
                style={{
                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                }}
            >
                <p className="text-lg font-bold mb-4" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                    Add Stock
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <p className="text-sm mb-1" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                            {item.name} stock: <strong style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>{item.quantity}</strong>
                        </p>
                        <p className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                            Unit price: <strong style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>₱{item.price?.toFixed(2) ?? "—"}</strong>
                        </p>
                    </div>

                    <div>
                        <input
                            type="number"
                            min={1}
                            placeholder="Enter amount to add"
                            className="w-full rounded-lg border-2 px-3 py-2 text-sm transition-all [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:opacity-50"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                            }}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <motion.button
                            whileHover={{ scale: loading ? 1 : 1.05 }}
                            whileTap={{ scale: loading ? 1 : 0.95 }}
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                            }}
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: loading ? 1 : 1.05 }}
                            whileTap={{ scale: loading ? 1 : 0.95 }}
                            type="submit"
                            disabled={loading}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: isDarkMode ? "#0f172a" : "#0f172a",
                            }}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Adding...
                                </div>
                            ) : (
                                "Add Stock"
                            )}
                        </motion.button>
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