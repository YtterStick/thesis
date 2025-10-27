import { motion } from "framer-motion";

const RecentSearches = ({ isDarkMode, recentSearches, onRecentSearchClick }) => {
    // Scrollbar colors - use card color for scrollbar thumb in both modes
    const scrollbarThumbColor = isDarkMode ? "#2A524C" : "#F3EDE3"; // Green for dark, card color for light
    const scrollbarThumbHover = isDarkMode ? "#1E3D38" : "#E8E0D0"; // Darker green for dark, slightly darker cream for light

    // Card hover colors - better combinations
    const cardHoverColor = isDarkMode ? "#F8F5F0" : "#E8E0D0"; // Light cream for dark, slightly darker cream for light

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
            
            {/* Fixed height scrollable container with custom scrollbar */}
            <div 
                className="space-y-3 overflow-y-auto pr-2 md:space-y-4"
                style={{ 
                    height: '280px', // Fixed height to show exactly 2 cards
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${scrollbarThumbColor} ${isDarkMode ? "#F3EDE3" : "#183D3D"}`,
                }}
            >
                {recentSearches.length > 0 ? (
                    recentSearches.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ 
                                backgroundColor: cardHoverColor,
                            }}
                            className={`cursor-pointer rounded-xl border p-3 transition-all md:p-4 min-h-[120px]`}
                            style={{
                                backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3", // Card color
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
                        className="rounded-xl border p-4 text-center flex flex-col justify-center items-center min-h-[120px]"
                        style={{
                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3", // Card color
                            borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                            color: isDarkMode ? "#13151B" : "#183D3D",
                        }}
                    >
                        <p className="text-sm md:text-base">No recent searches yet</p>
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
                    background: ${isDarkMode ? "#F3EDE3" : "#183D3D"};
                    border-radius: 4px;
                    margin: 4px 0;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: ${scrollbarThumbColor};
                    border-radius: 4px;
                    border: 2px solid ${isDarkMode ? "#F3EDE3" : "#183D3D"};
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
                    scrollbar-color: ${scrollbarThumbColor} ${isDarkMode ? "#F3EDE3" : "#183D3D"};
                }
            `}</style>
        </motion.div>
    );
};

export default RecentSearches;