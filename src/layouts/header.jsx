import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import {
    ChevronsLeft,
    Moon,
    Search,
    Sun,
    Bell,
    X,
    CheckCircle,
    AlertCircle,
    Info,
    ClipboardList,
    RefreshCw,
} from "lucide-react";
import PropTypes from "prop-types";

export const Header = ({ collapsed, setCollapsed, sidebarLinks = [], onSearchResultClick }) => {
    const { theme, setTheme } = useTheme();
    const [searchActive, setSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNewNotification, setShowNewNotification] = useState(false);
    const [latestNotification, setLatestNotification] = useState(null);
    const notificationRef = useRef(null);
    const searchRef = useRef(null);

    // Calculate isDarkMode based on theme
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const toggleTheme = () => {
        const newTheme = isDarkMode ? "light" : "dark";
        setTheme(newTheme);
    };

    // Search functionality
    const performSearch = (query) => {
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
    };

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
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setNotificationOpen(false);
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

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("authToken");
            console.log("Fetching notifications with token:", token);

            const response = await fetch("http://localhost:8080/api/notifications", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("Notifications response status:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("Fetched notifications:", data);
                setNotifications(data);
            } else {
                console.error("Failed to fetch notifications:", response.status);
                const errorText = await response.text();
                console.error("Error details:", errorText);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch("http://localhost:8080/api/notifications/unread-count", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const count = await response.json();
                setUnreadCount(count);
                return count;
            }
            return unreadCount;
        } catch (error) {
            console.error("Error fetching unread count:", error);
            return unreadCount;
        }
    };

    // Mark notification as read
    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem("authToken");
            await fetch(`http://localhost:8080/api/notifications/${id}/read`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Refresh notifications and count
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem("authToken");
            await fetch("http://localhost:8080/api/notifications/read-all", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Refresh notifications and count
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    // Format time ago
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return `${diffInSeconds} seconds ago`;
        } else if (diffInSeconds < 3600) {
            return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        } else if (diffInSeconds < 86400) {
            return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        } else {
            return `${Math.floor(diffInSeconds / 86400)} days ago`;
        }
    };

    // Helper functions for notification styling
    const getNotificationColor = (type) => {
        switch (type) {
            case "stock_alert": return "#ef4444"; // red
            case "inventory_update": return "#10b981"; // green
            case "stock_info": return "#3b82f6"; // blue
            case "load_washed": return "#3b82f6"; // blue
            case "load_dried": return "#f59e0b"; // orange
            case "load_completed": return "#10b981"; // green
            default: return "#6b7280"; // gray
        }
    };

    const getNotificationIcon = (type) => {
        const iconProps = { size: 18 };
        switch (type) {
            case "stock_alert":
                return <AlertCircle {...iconProps} className="text-red-500" />;
            case "inventory_update":
                return <CheckCircle {...iconProps} className="text-green-500" />;
            case "stock_info":
                return <Info {...iconProps} className="text-blue-500" />;
            case "load_washed":
                return <RefreshCw {...iconProps} className="text-blue-500" />;
            case "load_dried":
                return <Sun {...iconProps} className="text-orange-500" />;
            case "load_completed":
                return <CheckCircle {...iconProps} className="text-green-500" />;
            default:
                return <Bell {...iconProps} className="text-gray-500" />;
        }
    };

    // Enhanced useEffect for notifications
    useEffect(() => {
        if (notificationOpen) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [notificationOpen]);

    // New useEffect for real-time notification handling
    useEffect(() => {
        const checkForNewNotifications = async () => {
            const previousUnreadCount = unreadCount;
            const newUnreadCount = await fetchUnreadCount();
            
            // If unread count increased, show notification
            if (newUnreadCount > previousUnreadCount && previousUnreadCount >= 0) {
                // Fetch the latest notification to show
                await fetchNotifications();
                const latestUnread = notifications.find(n => !n.read);
                if (latestUnread) {
                    setLatestNotification(latestUnread);
                    setShowNewNotification(true);
                    
                    // Auto-hide after 5 seconds
                    setTimeout(() => {
                        setShowNewNotification(false);
                    }, 5000);
                }
            }
        };

        const interval = setInterval(() => {
            checkForNewNotifications();
        }, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [unreadCount, notifications]);

    return (
        <header
            className={`relative z-10 flex h-[60px] items-center justify-between border-b px-4 shadow-sm transition-colors ${
                theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"
            }`}
        >
            {/* 🔧 Sidebar toggle + Search */}
            <div className="relative flex flex-1 items-center gap-x-3">
                {!searchActive && (
                    <button
                        className="group size-10 rounded-md transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
                        onClick={() => setCollapsed(!collapsed)}
                        title="Toggle sidebar"
                    >
                        <ChevronsLeft
                            className={`mx-auto transition-colors ${collapsed ? "rotate-180" : ""} ${
                                theme === "dark" ? "text-white group-hover:text-cyan-400" : "text-slate-700 group-hover:text-cyan-600"
                            }`}
                        />
                    </button>
                )}

                {/* 🔍 Desktop Search */}
                <div
                    ref={searchRef}
                    className={`input relative hidden h-[38px] w-full max-w-[250px] items-center rounded-md border px-3 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-cyan-500 sm:flex ${
                        theme === "dark" ? "border-slate-600 bg-slate-800" : "border-slate-300 bg-white"
                    }`}
                >
                    <Search
                        size={18}
                        className={`transition-colors ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                    />
                    <input
                        type="text"
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => searchQuery && setShowSearchResults(true)}
                        className={`w-full bg-transparent px-2 text-sm outline-none placeholder:text-slate-400 ${
                            theme === "dark" ? "text-white" : "text-slate-900"
                        }`}
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className={`transition-colors ${
                                theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <X size={16} />
                        </button>
                    )}
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        /
                    </span>

                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                        {showSearchResults && searchResults.length > 0 && (
                            <motion.div
                                className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-y-auto rounded-md border shadow-lg"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    backgroundColor: theme === "dark" ? "#1e293b" : "white",
                                    borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                                }}
                            >
                                <div className="p-2">
                                    <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Search Results ({searchResults.length})
                                    </div>
                                    {searchResults.map((result, index) => (
                                        <motion.button
                                            key={`${result.path}-${index}`}
                                            className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                                            onClick={() => handleSearchResultClick(result)}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <result.icon
                                                size={18}
                                                className="flex-shrink-0 text-cyan-600 dark:text-cyan-400"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                                    {result.label}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
                            className="group flex size-10 items-center justify-center rounded-md transition-colors hover:bg-slate-200 dark:hover:bg-slate-800 sm:hidden"
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
                                    className={`transition-colors ${theme === "dark" ? "text-white" : "text-slate-700"}`}
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
                        className="group relative size-10 rounded-md transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
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
                                    <Sun
                                        size={20}
                                        className="text-white group-hover:text-cyan-400 transition-colors"
                                    />
                                ) : (
                                    <Moon
                                        size={20}
                                        className="text-slate-700 group-hover:text-cyan-600 transition-colors"
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </motion.button>

                    {/* 🔔 Enhanced Notification System with Animation */}
                    <div className="relative" ref={notificationRef}>
                        <motion.button
                            className="group relative size-10 rounded-md transition-colors hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center"
                            title="Notifications"
                            onClick={() => {
                                setNotificationOpen(!notificationOpen);
                                setShowNewNotification(false);
                            }}
                            whileHover={{ 
                                scale: 1.1,
                                rotate: [0, -5, 5, 0],
                                transition: { 
                                    rotate: { duration: 0.5, ease: "easeInOut" },
                                    scale: { duration: 0.2 }
                                }
                            }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <motion.div
                                animate={
                                    showNewNotification 
                                    ? {
                                        scale: [1, 1.2, 1],
                                        transition: { duration: 0.5, repeat: 1 }
                                    }
                                    : {}
                                }
                                className="flex items-center justify-center"
                            >
                                <Bell
                                    size={20}
                                    className={`transition-colors ${
                                        theme === "dark" ? "text-white group-hover:text-cyan-400" : "text-slate-700 group-hover:text-cyan-600"
                                    }`}
                                />
                            </motion.div>
                            {unreadCount > 0 && (
                                <motion.span 
                                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                >
                                    {unreadCount}
                                </motion.span>
                            )}
                        </motion.button>

                        {/* Toast Notification for new alerts */}
                        <AnimatePresence>
                            {showNewNotification && latestNotification && (
                                <motion.div
                                    className="absolute right-0 top-12 z-50 w-80 rounded-md border shadow-lg cursor-pointer"
                                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                    onClick={() => {
                                        setNotificationOpen(true);
                                        setShowNewNotification(false);
                                        markAsRead(latestNotification.id);
                                    }}
                                    style={{
                                        backgroundColor: theme === "dark" ? "#1e293b" : "white",
                                        borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                                        borderLeft: `4px solid ${getNotificationColor(latestNotification.type)}`
                                    }}
                                >
                                    <div className="p-3">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                {getNotificationIcon(latestNotification.type)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`text-sm font-medium ${
                                                    theme === "dark" ? "text-white" : "text-slate-900"
                                                }`}>
                                                    {latestNotification.title}
                                                </h4>
                                                <p className={`mt-1 text-sm ${
                                                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                                                }`}>
                                                    {latestNotification.message}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowNewNotification(false);
                                                }}
                                                className={`transition-colors ${
                                                    theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"
                                                }`}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Notification dropdown */}
                        <AnimatePresence>
                            {notificationOpen && (
                                <motion.div
                                    className="absolute right-0 top-12 w-80 rounded-md border shadow-lg z-50"
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                                    style={{
                                        backgroundColor: theme === "dark" ? "#1e293b" : "white",
                                        borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                                    }}
                                >
                                    {/* Header */}
                                    <div
                                        className="border-b p-3"
                                        style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3
                                                className="font-semibold"
                                                style={{ color: theme === "dark" ? "white" : "#1e293b" }}
                                            >
                                                Notifications
                                            </h3>
                                            {unreadCount > 0 && (
                                                <span className="rounded-full bg-cyan-500 px-2 py-1 text-xs text-white">
                                                    {unreadCount} new
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notifications List */}
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            notifications.map((notification, index) => (
                                                <motion.div
                                                    key={notification.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className={`flex cursor-pointer items-start gap-3 border-b p-3 transition-all ${
                                                        !notification.read
                                                            ? "bg-cyan-50 dark:bg-cyan-900/20 border-l-2 border-l-cyan-500"
                                                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                    }`}
                                                    style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
                                                    onClick={() => markAsRead(notification.id)}
                                                    whileHover={{ 
                                                        scale: 1.02,
                                                        backgroundColor: theme === "dark" ? "#334155" : "#f8fafc"
                                                    }}
                                                >
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4
                                                            className={`text-sm font-medium truncate ${
                                                                !notification.read
                                                                    ? "text-cyan-600 dark:text-cyan-400"
                                                                    : theme === "dark"
                                                                      ? "text-white"
                                                                      : "text-slate-900"
                                                            }`}
                                                        >
                                                            {notification.title}
                                                        </h4>
                                                        <p
                                                            className="mt-1 text-sm line-clamp-2"
                                                            style={{ color: theme === "dark" ? "#cbd5e1" : "#64748b" }}
                                                        >
                                                            {notification.message}
                                                        </p>
                                                        <p
                                                            className="mt-1 text-xs"
                                                            style={{ color: theme === "dark" ? "#94a3b8" : "#94a3b8" }}
                                                        >
                                                            {formatTimeAgo(notification.createdAt)}
                                                        </p>
                                                    </div>
                                                    {!notification.read && (
                                                        <motion.div 
                                                            className="mt-2 h-2 w-2 rounded-full bg-cyan-500 flex-shrink-0"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                                        />
                                                    )}
                                                </motion.div>
                                            ))
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="p-6 text-center"
                                                style={{ color: theme === "dark" ? "#cbd5e1" : "#64748b" }}
                                            >
                                                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No notifications</p>
                                                <p className="text-xs mt-1 opacity-70">You're all caught up!</p>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    {notifications.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="border-t p-2"
                                            style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
                                        >
                                            <motion.button
                                                className="w-full rounded-md py-2 text-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                                style={{ 
                                                    color: theme === "dark" ? "#e2e8f0" : "#475569",
                                                }}
                                                onClick={markAllAsRead}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                Mark all as read
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
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
                            className={`input flex h-[38px] items-center rounded-md border px-3 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-cyan-500 ${
                                theme === "dark" ? "border-slate-600 bg-slate-800" : "border-slate-300 bg-white"
                            }`}
                        >
                            <motion.div
                                layoutId="search-icon"
                                className="flex items-center"
                            >
                                <Search
                                    size={18}
                                    className={`transition-colors ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                                />
                            </motion.div>
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => searchQuery && setShowSearchResults(true)}
                                autoFocus
                                className={`w-full bg-transparent px-2 text-sm outline-none placeholder:text-slate-400 ${
                                    theme === "dark" ? "text-white" : "text-slate-900"
                                }`}
                            />
                            <button
                                onClick={() => {
                                    setSearchActive(false);
                                    clearSearch();
                                }}
                                className={`ml-2 transition-colors ${
                                    theme === "dark" ? "text-white hover:text-cyan-400" : "text-slate-700 hover:text-cyan-600"
                                }`}
                                title="Close search"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Mobile Search Results */}
                        <AnimatePresence>
                            {showSearchResults && searchResults.length > 0 && (
                                <motion.div
                                    className="absolute left-4 right-4 top-full mt-1 max-h-80 overflow-y-auto rounded-md border shadow-lg"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                        backgroundColor: theme === "dark" ? "#1e293b" : "white",
                                        borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                                    }}
                                >
                                    <div className="p-2">
                                        <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Search Results ({searchResults.length})
                                        </div>
                                        {searchResults.map((result, index) => (
                                            <motion.button
                                                key={`${result.path}-${index}`}
                                                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                                                onClick={() => handleSearchResultClick(result)}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <result.icon
                                                    size={18}
                                                    className="flex-shrink-0 text-cyan-600 dark:text-cyan-400"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                                        {result.label}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
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