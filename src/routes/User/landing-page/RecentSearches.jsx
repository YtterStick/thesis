import { motion } from "framer-motion";

const RecentSearches = ({ isDarkMode, recentSearches, onRecentSearchClick }) => {
    // Scrollbar colors
    const scrollbarThumbColor = isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)";
    const scrollbarThumbHover = isDarkMode ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.25)";

    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 2.2 }}
            className="rounded-2xl border p-4 md:p-6 shadow-xl backdrop-blur-md transition-all duration-300"
            style={{
                backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.75)",
                borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                color: isDarkMode ? "#cbd5e1" : "#475569",
            }}
        >
            <h3 className="mb-4 text-lg font-black tracking-tight md:text-xl" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>Recent Searches</h3>
            
            {/* Fixed height scrollable container with custom scrollbar */}
            <div 
                className="space-y-3 overflow-y-auto pr-2 md:space-y-4"
                style={{ 
                    height: '280px', // Fixed height to show exactly 2 cards
                    scrollbarWidth: 'thin',
                }}
            >
                {recentSearches.length > 0 ? (
                    recentSearches.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className={`cursor-pointer rounded-xl border p-3 transition-all md:p-4 min-h-[120px] ${
                                isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-100/40"
                            }`}
                            style={{
                                backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.3)" : "rgba(255, 255, 255, 0.5)",
                                borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                                color: isDarkMode ? "#cbd5e1" : "#475569",
                            }}
                            onClick={() => onRecentSearchClick(item.receiptNumber)}
                        >
                            <div className="mb-2 flex items-start justify-between">
                                <p
                                    className="font-mono text-sm font-black tracking-wide"
                                    style={{ color: isDarkMode ? "#3b82f6" : "#2563eb" }}
                                >
                                    {item.receiptNumber}
                                </p>
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
                        className="rounded-xl border p-4 text-center flex flex-col justify-center items-center min-h-[120px]"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.2)" : "rgba(255, 255, 255, 0.4)",
                            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                            color: isDarkMode ? "#cbd5e1" : "#475569",
                        }}
                    >
                        <p className="text-sm md:text-base font-semibold">No recent searches yet</p>
                        <p className="mt-1 text-xs opacity-70">Your searched receipts will appear here</p>
                    </motion.div>
                )}
            </div>

            {/* Dynamic scrollbar styles that update with theme */}
            <style>{`
                /* Scrollbar for Webkit browsers (Chrome, Safari, Edge) */
                .overflow-y-auto::-webkit-scrollbar {
                    width: 8px;
                }
                .overflow-y-auto::-webkit-scrollbar-track {
                    background: ${isDarkMode ? "rgba(15, 23, 42, 0.1)" : "rgba(0, 0, 0, 0.05)"};
                    border-radius: 4px;
                    margin: 4px 0;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: ${scrollbarThumbColor};
                    border-radius: 4px;
                    border: 2px solid ${isDarkMode ? "#1e293b" : "#ffffff"};
                }
                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: ${scrollbarThumbHover};
                }
                .overflow-y-auto::-webkit-scrollbar-thumb:active {
                    background: ${scrollbarThumbHover};
                }
                
                /* Scrollbar for Firefox */
                .overflow-y-auto {
                    scrollbar-width: thin;
                    scrollbar-color: ${scrollbarThumbColor} ${isDarkMode ? "rgba(15, 23, 42, 0.1)" : "rgba(0, 0, 0, 0.05)"};
                }
            `}</style>
        </motion.div>
    );
};

export default RecentSearches;