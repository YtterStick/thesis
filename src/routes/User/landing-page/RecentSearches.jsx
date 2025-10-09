import { motion } from "framer-motion";

const RecentSearches = ({ isDarkMode, recentSearches, onRecentSearchClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 2.2 }}
            className="rounded-2xl border-2 p-4 md:p-6"
            style={{
                backgroundColor: isDarkMode ? "#F3EDE3" : "#183D3D",
                borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                color: isDarkMode ? "#13151B" : "#F3EDE3",
            }}
        >
            <h3 className="mb-4 text-lg font-bold md:text-xl">Recent Searches</h3>
            <div className="max-h-80 space-y-3 overflow-y-auto pr-2 md:max-h-96 md:space-y-4">
                {recentSearches.length > 0 ? (
                    recentSearches.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ 
                                scale: 1.02,
                                y: -2,
                                transition: { duration: 0.2 }
                            }}
                            className={`cursor-pointer rounded-xl border p-3 transition-all md:p-4 ${
                                isDarkMode ? "hover:bg-[#2A524C]" : "hover:bg-[#D5DCDB]"
                            }`}
                            style={{
                                backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                                color: isDarkMode ? "#13151B" : "#183D3D",
                            }}
                            onClick={() => onRecentSearchClick(item.receiptNumber)}
                        >
                            <div className="mb-2 flex items-start justify-between">
                                <p
                                    className="font-mono text-sm font-semibold md:text-base"
                                    style={{ color: isDarkMode ? "#18442A" : "#183D3D" }}
                                >
                                    {item.receiptNumber}
                                </p>
                            </div>
                            <h4
                                className="mb-1 text-base font-semibold md:text-lg"
                                style={{ color: isDarkMode ? "#13151B" : "#183D3D" }}
                            >
                                Click to track again
                            </h4>
                            <p
                                className="text-xs md:text-sm"
                                style={{ color: isDarkMode ? "#6B7280" : "#183D3D" }}
                            >
                                Last searched: {item.searchedAt}
                            </p>
                        </motion.div>
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl border p-4 text-center"
                        style={{
                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                            borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                            color: isDarkMode ? "#13151B" : "#183D3D",
                        }}
                    >
                        <p className="text-sm md:text-base">No recent searches yet</p>
                        <p className="mt-1 text-xs opacity-70">Your searched receipts will appear here</p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default RecentSearches;