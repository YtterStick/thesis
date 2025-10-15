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
import { api } from "@/lib/api-config"; // Import the api utility

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

    // Calculate isDarkMode based on theme - matching User side
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
            console.log("Fetching notifications...");

            // Use the api utility instead of direct fetch
            const data = await api.get("api/notifications");
            console.log("Fetched notifications:", data);
            setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            // Use the api utility instead of direct fetch
            const count = await api.get("api/notifications/unread-count");
            setUnreadCount(count);
            return count;
        } catch (error) {
            console.error("Error fetching unread count:", error);
            return unreadCount;
        }
    };

    // Mark notification as read
    const markAsRead = async (id) => {
        try {
            // Use the api utility instead of direct fetch
            await api.post(`api/notifications/${id}/read`);
            
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
            // Use the api utility instead of direct fetch
            await api.post("api/notifications/read-all");
            
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
                isDarkMode ? "border-[#1C3F3A] bg-[#0B2B26]" : "border-[#0B2B26] bg-[#E0EAE8]"
            }`}
        >
            {/* 🔧 Sidebar toggle + Search */}
            <div className="relative flex flex-1 items-center gap-x-3">
                {!searchActive && (
                    <button
                        className="group size-10 rounded-md transition-colors hover:opacity-80"
                        style={{
                            backgroundColor: isDarkMode ? '#1C3F3A' : '#F3EDE3',
                            color: isDarkMode ? '#F3EDE3' : '#0B2B26'
                        }}
                        onClick={() => setCollapsed(!collapsed)}
                        title="Toggle sidebar"
                    >
                        <ChevronsLeft
                            className={`mx-auto transition-colors ${collapsed ? "rotate-180" : ""}`}
                        />
                    </button>
                )}

                {/* 🔍 Desktop Search */}
                <div
                    ref={searchRef}
                    className={`input relative hidden h-[38px] w-full max-w-[250px] items-center rounded-md border px-3 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-cyan-500 sm:flex ${
                        isDarkMode ? "border-[#1C3F3A] bg-[#0B2B26]" : "border-[#0B2B26] bg-white"
                    }`}
                >
                    <Search
                        size={18}
                        className={isDarkMode ? "text-[#F3EDE3]" : "text-[#0B2B26]"}
                    />
                    <input
                        type="text"
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => searchQuery && setShowSearchResults(true)}
                        className={`w-full bg-transparent px-2 text-sm outline-none placeholder:${
                            isDarkMode ? 'text-[#F3EDE3]/60' : 'text-[#0B2B26]/60'
                        } ${isDarkMode ? "text-[#F3EDE3]" : "text-[#0B2B26]"}`}
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className={isDarkMode ? "text-[#F3EDE3]/60 hover:text-[#F3EDE3]" : "text-[#0B2B26]/60 hover:text-[#0B2B26]"}
                        >
                            <X size={16} />
                        </button>
                    )}
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs"
                          style={{
                              backgroundColor: isDarkMode ? '#1C3F3A' : '#F3EDE3',
                              color: isDarkMode ? '#F3EDE3' : '#0B2B26'
                          }}>
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
                                    backgroundColor: isDarkMode ? "#0B2B26" : "white",
                                    borderColor: isDarkMode ? "#1C3F3A" : "#0B2B26",
                                }}
                            >
                                <div className="p-2">
                                    <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide"
                                         style={{ color: isDarkMode ? '#F3EDE3/60' : '#0B2B26/60' }}>
                                        Search Results ({searchResults.length})
                                    </div>
                                    {searchResults.map((result, index) => (
                                        <motion.button
                                            key={`${result.path}-${index}`}
                                            className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:opacity-80"
                                            style={{
                                                backgroundColor: isDarkMode ? 'transparent' : 'transparent',
                                            }}
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
                                                style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate"
                                                     style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
                                                    {result.label}
                                                </div>
                                                <div className="text-xs truncate"
                                                     style={{ color: isDarkMode ? '#F3EDE3/60' : '#0B2B26/60' }}>
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
                            className="group flex size-10 items-center justify-center rounded-md transition-colors hover:opacity-80 sm:hidden"
                            style={{
                                backgroundColor: isDarkMode ? '#1C3F3A' : '#F3EDE3',
                                color: isDarkMode ? '#F3EDE3' : '#0B2B26'
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
                                    className={isDarkMode ? "text-[#F3EDE3]" : "text-[#0B2B26]"}
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
                        className="group relative size-10 rounded-md transition-colors hover:opacity-80"
                        style={{
                            backgroundColor: isDarkMode ? '#1C3F3A' : '#F3EDE3',
                            color: isDarkMode ? '#F3EDE3' : '#0B2B26'
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

                    {/* 🔔 Enhanced Notification System with Animation */}
                    <div className="relative" ref={notificationRef}>
                        <motion.button
                            className="group relative size-10 rounded-md transition-colors hover:opacity-80 flex items-center justify-center"
                            style={{
                                backgroundColor: isDarkMode ? '#1C3F3A' : '#F3EDE3',
                                color: isDarkMode ? '#F3EDE3' : '#0B2B26'
                            }}
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
                                <Bell size={20} />
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
                                    style={{
                                        backgroundColor: isDarkMode ? "#0B2B26" : "white",
                                        borderColor: isDarkMode ? "#1C3F3A" : "#0B2B26",
                                        borderLeft: `4px solid ${getNotificationColor(latestNotification.type)}`
                                    }}
                                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                    onClick={() => {
                                        setNotificationOpen(true);
                                        setShowNewNotification(false);
                                        markAsRead(latestNotification.id);
                                    }}
                                >
                                    <div className="p-3">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                {getNotificationIcon(latestNotification.type)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium"
                                                    style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
                                                    {latestNotification.title}
                                                </h4>
                                                <p className="mt-1 text-sm"
                                                   style={{ color: isDarkMode ? '#F3EDE3/80' : '#0B2B26/80' }}>
                                                    {latestNotification.message}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowNewNotification(false);
                                                }}
                                                className={isDarkMode ? "text-[#F3EDE3]/60 hover:text-[#F3EDE3]" : "text-[#0B2B26]/60 hover:text-[#0B2B26]"}
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
                                    style={{
                                        backgroundColor: isDarkMode ? "#0B2B26" : "white",
                                        borderColor: isDarkMode ? "#1C3F3A" : "#0B2B26",
                                    }}
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    {/* Header */}
                                    <div
                                        className="border-b p-3"
                                        style={{ borderColor: isDarkMode ? "#1C3F3A" : "#0B2B26" }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3
                                                className="font-semibold"
                                                style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}
                                            >
                                                Notifications
                                            </h3>
                                            {unreadCount > 0 && (
                                                <span className="rounded-full px-2 py-1 text-xs text-white"
                                                      style={{ backgroundColor: isDarkMode ? '#1C3F3A' : '#0B2B26' }}>
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
                                                            ? "border-l-2"
                                                            : "hover:opacity-80"
                                                    }`}
                                                    style={{ 
                                                        borderColor: isDarkMode ? "#1C3F3A" : "#0B2B26",
                                                        borderLeftColor: !notification.read ? 
                                                            (isDarkMode ? '#F3EDE3' : '#0B2B26') : 'transparent',
                                                        backgroundColor: !notification.read ? 
                                                            (isDarkMode ? 'rgba(243, 237, 227, 0.1)' : 'rgba(11, 43, 38, 0.1)') : 'transparent'
                                                    }}
                                                    onClick={() => markAsRead(notification.id)}
                                                    whileHover={{ 
                                                        scale: 1.02,
                                                    }}
                                                >
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4
                                                            className={`text-sm font-medium truncate ${
                                                                !notification.read
                                                                    ? ""
                                                                    : ""
                                                            }`}
                                                            style={{ color: isDarkMode ? "#F3EDE3" : "#0B2B26" }}
                                                        >
                                                            {notification.title}
                                                        </h4>
                                                        <p
                                                            className="mt-1 text-sm line-clamp-2"
                                                            style={{ color: isDarkMode ? "#F3EDE3/80" : "#0B2B26/80" }}
                                                        >
                                                            {notification.message}
                                                        </p>
                                                        <p
                                                            className="mt-1 text-xs"
                                                            style={{ color: isDarkMode ? "#F3EDE3/60" : "#0B2B26/60" }}
                                                        >
                                                            {formatTimeAgo(notification.createdAt)}
                                                        </p>
                                                    </div>
                                                    {!notification.read && (
                                                        <motion.div 
                                                            className="mt-2 h-2 w-2 rounded-full flex-shrink-0"
                                                            style={{ backgroundColor: isDarkMode ? '#F3EDE3' : '#0B2B26' }}
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
                                                style={{ color: isDarkMode ? "#F3EDE3/60" : "#0B2B26/60" }}
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
                                            style={{ borderColor: isDarkMode ? "#1C3F3A" : "#0B2B26" }}
                                        >
                                            <motion.button
                                                className="w-full rounded-md py-2 text-sm transition-all hover:opacity-80"
                                                style={{ 
                                                    color: isDarkMode ? "#F3EDE3" : "#0B2B26",
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
                            className={`flex h-[38px] items-center rounded-md border px-3 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-cyan-500 ${
                                isDarkMode ? "border-[#1C3F3A] bg-[#0B2B26]" : "border-[#0B2B26] bg-white"
                            }`}
                        >
                            <motion.div
                                layoutId="search-icon"
                                className="flex items-center"
                            >
                                <Search
                                    size={18}
                                    className={isDarkMode ? "text-[#F3EDE3]" : "text-[#0B2B26]"}
                                />
                            </motion.div>
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => searchQuery && setShowSearchResults(true)}
                                autoFocus
                                className={`w-full bg-transparent px-2 text-sm outline-none placeholder:${
                                    isDarkMode ? 'text-[#F3EDE3]/60' : 'text-[#0B2B26]/60'
                                } ${isDarkMode ? "text-[#F3EDE3]" : "text-[#0B2B26]"}`}
                            />
                            <button
                                onClick={() => {
                                    setSearchActive(false);
                                    clearSearch();
                                }}
                                className={isDarkMode ? "text-[#F3EDE3] hover:text-[#F3EDE3]/60" : "text-[#0B2B26] hover:text-[#0B2B26]/60"}
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
                                        backgroundColor: isDarkMode ? "#0B2B26" : "white",
                                        borderColor: isDarkMode ? "#1C3F3A" : "#0B2B26",
                                    }}
                                >
                                    <div className="p-2">
                                        <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide"
                                             style={{ color: isDarkMode ? '#F3EDE3/60' : '#0B2B26/60' }}>
                                            Search Results ({searchResults.length})
                                        </div>
                                        {searchResults.map((result, index) => (
                                            <motion.button
                                                key={`${result.path}-${index}`}
                                                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:opacity-80"
                                                style={{
                                                    backgroundColor: isDarkMode ? 'transparent' : 'transparent',
                                                }}
                                                onClick={() => handleSearchResultClick(result)}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <result.icon
                                                    size={18}
                                                    className="flex-shrink-0"
                                                    style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate"
                                                         style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
                                                        {result.label}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate"
                                                         style={{ color: isDarkMode ? '#F3EDE3/60' : '#0B2B26/60' }}>
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