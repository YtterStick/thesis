import { motion } from "framer-motion";

const RecentSearches = ({ isDarkMode, recentSearches, onRecentSearchClick }) => {
    const scrollbarThumbColor = isDarkMode ? "rgba(148, 163, 184, 0.35)" : "rgba(51, 65, 85, 0.25)";
    const scrollbarThumbHover = isDarkMode ? "rgba(148, 163, 184, 0.55)" : "rgba(51, 65, 85, 0.45)";

    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 2.2 }}
            className="relative overflow-hidden rounded-3xl border p-4 md:p-6 shadow-xl backdrop-blur-md transition-all duration-300"
            style={{
                backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.65)" : "rgba(255, 255, 255, 0.86)",
                borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                color: isDarkMode ? "#cbd5e1" : "#475569",
            }}
        >
            <div
                className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl"
                style={{
                    background: isDarkMode ? "rgba(59, 130, 246, 0.25)" : "rgba(59, 130, 246, 0.15)",
                }}
            />

            <div className="relative mb-4 flex items-end justify-between gap-3">
                <div>
                    <p
                        className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]"
                        style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
                    >
                        Quick Access
                    </p>
                    <h3 className="text-lg font-black tracking-tight md:text-xl" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>
                        Recent Searches
                    </h3>
                </div>
                <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                        backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.16)" : "rgba(37, 99, 235, 0.1)",
                        color: isDarkMode ? "#93c5fd" : "#1d4ed8",
                    }}
                >
                    {recentSearches.length} saved
                </span>
            </div>

            <div
                className="recent-searches-scroll space-y-3 overflow-y-auto pr-2 md:space-y-4"
                style={{
                    height: "220px",
                    scrollbarWidth: "thin",
                }}
            >
                {recentSearches.length > 0 ? (
                    recentSearches.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.01, y: -2 }}
                            className={`cursor-pointer rounded-2xl border p-3 transition-all md:p-4 min-h-[120px] ${
                                isDarkMode ? "hover:border-blue-500/35 hover:bg-slate-800/45" : "hover:border-blue-400/35 hover:bg-white"
                            }`}
                            style={{
                                backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.45)" : "rgba(248, 250, 252, 0.78)",
                                borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                                color: isDarkMode ? "#cbd5e1" : "#475569",
                            }}
                            onClick={() => onRecentSearchClick(item.receiptNumber)}
                        >
                            <div className="mb-2 flex items-start justify-between gap-2">
                                <p
                                    className="font-mono text-sm font-black tracking-wide md:text-[15px]"
                                    style={{ color: isDarkMode ? "#3b82f6" : "#2563eb" }}
                                >
                                    {item.receiptNumber}
                                </p>
                                <span
                                    className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                                    style={{
                                        backgroundColor: isDarkMode ? "rgba(16, 185, 129, 0.14)" : "rgba(16, 185, 129, 0.1)",
                                        color: isDarkMode ? "#6ee7b7" : "#047857",
                                    }}
                                >
                                    Tap to track
                                </span>
                            </div>
                            <h4
                                className="mb-1 text-sm font-bold"
                                style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}
                            >
                                Click to track again
                            </h4>
                            <p
                                className="text-xs md:text-sm"
                                style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
                            >
                                Last searched: {item.searchedAt}
                            </p>
                        </motion.div>
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-2xl border p-4 text-center flex flex-col justify-center items-center min-h-[140px]"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.35)" : "rgba(248, 250, 252, 0.65)",
                            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                            color: isDarkMode ? "#cbd5e1" : "#475569",
                        }}
                    >
                        <p className="text-sm md:text-base font-semibold">No recent searches yet</p>
                        <p className="mt-1 text-xs opacity-70">Your searched receipts will appear here</p>
                    </motion.div>
                )}
            </div>

            <style>{`
                .recent-searches-scroll::-webkit-scrollbar {
                    width: 8px;
                }
                .recent-searches-scroll::-webkit-scrollbar-track {
                    background: ${isDarkMode ? "rgba(15, 23, 42, 0.1)" : "rgba(0, 0, 0, 0.05)"};
                    border-radius: 4px;
                    margin: 4px 0;
                }
                .recent-searches-scroll::-webkit-scrollbar-thumb {
                    background: ${scrollbarThumbColor};
                    border-radius: 4px;
                    border: 2px solid ${isDarkMode ? "#1e293b" : "#ffffff"};
                }
                .recent-searches-scroll::-webkit-scrollbar-thumb:hover {
                    background: ${scrollbarThumbHover};
                }
                .recent-searches-scroll::-webkit-scrollbar-thumb:active {
                    background: ${scrollbarThumbHover};
                }

                .recent-searches-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: ${scrollbarThumbColor} ${isDarkMode ? "rgba(15, 23, 42, 0.1)" : "rgba(0, 0, 0, 0.05)"};
                }
            `}</style>
        </motion.div>
    );
};

export default RecentSearches;