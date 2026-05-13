import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import {
    ChevronsLeft,
    Moon,
    Search,
    Sun,
    X,
} from "lucide-react";
import PropTypes from "prop-types";
import NotificationSystem from "./notification";

export const Header = ({ collapsed, setCollapsed, sidebarLinks = [], onSearchResultClick }) => {
    const { theme, setTheme } = useTheme();
    const [searchActive, setSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    
    const searchRef = useRef(null);

    // Calculate isDarkMode based on theme
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const toggleTheme = () => {
        const newTheme = isDarkMode ? "light" : "dark";
        setTheme(newTheme);
    };

    // Search functionality
    const performSearch = useCallback((query) => {
        if (!query.trim() || !sidebarLinks.length) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const results = [];
        const lowerQuery = query.toLowerCase();

        sidebarLinks.forEach((group) => {
            group.Links.forEach((link) => {
                const matchesLabel = link.label.toLowerCase().includes(lowerQuery);
                const matchesPath = link.path.toLowerCase().includes(lowerQuery);
                const matchesGroup = group.title.toLowerCase().includes(lowerQuery);
                
                if (matchesLabel || matchesPath || matchesGroup) {
                    results.push({
                        ...link,
                        group: group.title,
                        groupTitle: group.title,
                        matchType: matchesLabel ? 'label' : matchesPath ? 'path' : 'group'
                    });
                }
            });
        });

        setSearchResults(results);
        setShowSearchResults(results.length > 0);
    }, [sidebarLinks]);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        performSearch(query);
    };

    const handleSearchResultClick = (result) => {
        setSearchQuery("");
        setShowSearchResults(false);
        setSearchActive(false);
        
        if (onSearchResultClick) {
            onSearchResultClick(result);
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSearchResults([]);
        setShowSearchResults(false);
    };

    // Close search results when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Close search when pressing Escape
    useEffect(() => {
        function handleEscapeKey(event) {
            if (event.key === 'Escape') {
                if (showSearchResults) {
                    setShowSearchResults(false);
                }
                if (searchActive) {
                    setSearchActive(false);
                    clearSearch();
                }
            }
        }

        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [searchActive, showSearchResults]);

    return (
        <header
            className="relative z-10 flex h-[60px] items-center justify-between border-b px-4 shadow-sm transition-colors"
            style={{
                backgroundColor: "var(--admin-header-bg)",
                borderColor: "var(--admin-card-border)",
            }}
        >
            {/* 🔧 Sidebar toggle + Search */}
            <div className="relative flex flex-1 items-center gap-x-3">
                {!searchActive && (
                    <button
                        className="group size-10 rounded-md transition-all hover:opacity-80 border shadow-sm"
                        style={{
                            backgroundColor: "var(--admin-accent-soft)",
                            color: "var(--admin-accent)",
                            borderColor: "var(--admin-card-border)",
                        }}
                        onClick={() => setCollapsed(!collapsed)}
                        title="Toggle sidebar"
                    >
                        <ChevronsLeft
                            className={`mx-auto transition-transform ${collapsed ? "rotate-180" : ""}`}
                        />
                    </button>
                )}

                {/* 🔍 Desktop Search */}
                <div
                    ref={searchRef}
                    className="input relative hidden h-[38px] w-full max-w-[250px] items-center rounded-md border px-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 sm:flex"
                    style={{
                        backgroundColor: "var(--admin-bg)",
                        borderColor: "var(--admin-card-border)",
                    }}
                >
                    <Search
                        size={18}
                        style={{ color: "var(--admin-text-secondary)" }}
                    />
                    <input
                        type="text"
                        placeholder="Search menu..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => searchQuery && setShowSearchResults(true)}
                        className="w-full bg-transparent px-2 text-sm outline-none placeholder:opacity-50"
                        style={{ color: "var(--admin-text-primary)" }}
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="hover:opacity-70"
                            style={{ color: "var(--admin-text-secondary)" }}
                        >
                            <X size={16} />
                        </button>
                    )}
                    <span 
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-[10px] font-bold border"
                        style={{
                            backgroundColor: "var(--admin-card-bg)",
                            borderColor: "var(--admin-card-border)",
                            color: "var(--admin-text-secondary)",
                        }}
                    >
                        /
                    </span>

                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                        {showSearchResults && searchResults.length > 0 && (
                            <motion.div
                                className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto rounded-md border shadow-xl z-50"
                                style={{
                                    backgroundColor: "var(--admin-card-bg)",
                                    borderColor: "var(--admin-card-border)",
                                }}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="p-2">
                                    <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest opacity-50 pt-2" style={{ color: "var(--admin-text-secondary)" }}>
                                        Results ({searchResults.length})
                                    </div>
                                    {searchResults.map((result, index) => (
                                        <motion.button
                                            key={`${result.path}-${index}`}
                                            className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                            onClick={() => handleSearchResultClick(result)}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <result.icon
                                                size={18}
                                                className="flex-shrink-0"
                                                style={{ color: "var(--admin-text-secondary)" }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate" style={{ color: "var(--admin-text-primary)" }}>
                                                    {result.label}
                                                </div>
                                                <div className="text-xs truncate opacity-70" style={{ color: "var(--admin-text-secondary)" }}>
                                                    {result.groupTitle}
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 📱 Mobile Search Trigger */}
                <AnimatePresence>
                    {!searchActive && (
                        <motion.button
                            onClick={() => setSearchActive(true)}
                            className="group flex size-10 items-center justify-center rounded-md transition-all hover:opacity-80 border shadow-sm sm:hidden"
                            style={{
                                backgroundColor: "var(--admin-card-bg)",
                                borderColor: "var(--admin-card-border)",
                                color: "var(--admin-text-primary)",
                            }}
                            title="Search"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <motion.div
                                layoutId="search-icon"
                                className="flex items-center"
                            >
                                <Search
                                    size={18}
                                    style={{ color: "var(--admin-text-secondary)" }}
                                />
                            </motion.div>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* 🧭 Right section */}
            {!searchActive && (
                <div className="relative flex items-center gap-x-3">
                    {/* 🌗 Enhanced Theme toggle with animation */}
                    <motion.button
                        className="group relative size-10 rounded-md transition-all hover:opacity-80 border shadow-sm"
                        style={{
                            backgroundColor: "var(--admin-card-bg)",
                            borderColor: "var(--admin-card-border)",
                            color: "var(--admin-text-primary)",
                        }}
                        onClick={toggleTheme}
                        title="Toggle theme"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={isDarkMode ? 'dark' : 'light'}
                                initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center justify-center w-full h-full"
                            >
                                {isDarkMode ? (
                                    <Sun size={20} />
                                ) : (
                                    <Moon size={20} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </motion.button>

                    {/* 🔔 Notification System */}
                    <NotificationSystem />
                </div>
            )}

            {/* 📱 Mobile Search Overlay */}
            <AnimatePresence>
                {searchActive && (
                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-[10px] top-[10px] z-30 w-[95%] px-4 sm:hidden"
                    >
                        <div
                            ref={searchRef}
                            className="flex h-[38px] items-center rounded-md border px-3 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-blue-500/20"
                            style={{
                                backgroundColor: "var(--admin-bg)",
                                borderColor: "var(--admin-card-border)",
                            }}
                        >
                            <motion.div
                                layoutId="search-icon"
                                className="flex items-center"
                            >
                                <Search
                                    size={18}
                                    style={{ color: "var(--admin-text-secondary)" }}
                                />
                            </motion.div>
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => searchQuery && setShowSearchResults(true)}
                                autoFocus
                                className="w-full bg-transparent px-2 text-sm outline-none placeholder:opacity-50"
                                style={{ color: "var(--admin-text-primary)" }}
                            />
                            <button
                                onClick={() => {
                                    setSearchActive(false);
                                    clearSearch();
                                }}
                                style={{ color: "var(--admin-text-secondary)" }}
                                className="hover:opacity-70"
                                title="Close search"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <AnimatePresence>
                            {showSearchResults && searchResults.length > 0 && (
                                <motion.div
                                    className="absolute left-4 right-4 top-full mt-1 max-h-80 overflow-y-auto rounded-md border shadow-lg z-50"
                                    style={{
                                        backgroundColor: "var(--admin-card-bg)",
                                        borderColor: "var(--admin-card-border)",
                                    }}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="p-2">
                                        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest opacity-50 pt-2" style={{ color: "var(--admin-text-secondary)" }}>
                                            Search Results ({searchResults.length})
                                        </div>
                                        {searchResults.map((result, index) => (
                                            <motion.button
                                                key={`${result.path}-${index}`}
                                                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                                onClick={() => handleSearchResultClick(result)}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <result.icon
                                                    size={18}
                                                    className="flex-shrink-0"
                                                    style={{ color: "var(--admin-text-secondary)" }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate" style={{ color: "var(--admin-text-primary)" }}>
                                                        {result.label}
                                                    </div>
                                                    <div className="text-xs truncate opacity-70" style={{ color: "var(--admin-text-secondary)" }}>
                                                        {result.groupTitle}
                                                    </div>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
    sidebarLinks: PropTypes.array,
    onSearchResultClick: PropTypes.func,
};

export default Header;