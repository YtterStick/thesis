import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { ChevronsLeft, Moon, Search, Sun, Bell, X, CheckCircle, AlertCircle, Info, ClipboardList } from "lucide-react";
import PropTypes from "prop-types";

export const Header = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const [searchActive, setSearchActive] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const notificationRef = useRef(null);

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
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
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

    // Close notification dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setNotificationOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (notificationOpen) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [notificationOpen]);

    // Periodically check for new notifications
    useEffect(() => {
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, []);

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
                        placeholder="Search something"
                        className={`w-full bg-transparent px-2 text-sm outline-none placeholder:text-slate-400 ${
                            theme === "dark" ? "text-white" : "text-slate-900"
                        }`}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        /
                    </span>
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
                    {/* 🌗 Theme toggle */}
                    <button
                        className="group relative size-10 rounded-md transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        title="Toggle theme"
                    >
                        <Sun
                            size={20}
                            className={`absolute inset-0 m-auto transition-opacity ${
                                theme === "dark" ? "opacity-0" : "text-slate-700 group-hover:text-cyan-600"
                            }`}
                        />
                        <Moon
                            size={20}
                            className={`absolute inset-0 m-auto transition-opacity ${
                                theme === "dark" ? "text-white opacity-100 group-hover:text-cyan-400" : "opacity-0"
                            }`}
                        />
                    </button>

                    {/* 🔔 Notifications */}
                    <div
                        className="relative"
                        ref={notificationRef}
                    >
                        <button
                            className="group relative size-10 rounded-md transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
                            title="Notifications"
                            onClick={() => setNotificationOpen(!notificationOpen)}
                            onMouseEnter={() => setNotificationOpen(true)}
                        >
                            <Bell
                                size={20}
                                className={`transition-colors ${
                                    theme === "dark" ? "text-white group-hover:text-cyan-400" : "text-slate-700 group-hover:text-cyan-600"
                                }`}
                            />
                            {unreadCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification dropdown */}
                        <AnimatePresence>
                            {notificationOpen && (
                                <motion.div
                                    className="absolute right-0 top-12 w-80 rounded-md border shadow-lg"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    onMouseLeave={() => setNotificationOpen(false)}
                                    style={{
                                        backgroundColor: theme === "dark" ? "#1e293b" : "white",
                                        borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                                    }}
                                >
                                    <div
                                        className="border-b p-3"
                                        style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
                                    >
                                        <h3
                                            className="font-semibold"
                                            style={{ color: theme === "dark" ? "white" : "#1e293b" }}
                                        >
                                            Notifications
                                        </h3>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`flex cursor-pointer items-start gap-3 border-b p-3 transition-colors ${
                                                        !notification.read
                                                            ? "bg-blue-50 dark:bg-blue-900/20"
                                                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    }`}
                                                    style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
                                                    onClick={() => markAsRead(notification.id)}
                                                >
                                                    <div className="mt-0.5">
                                                        {notification.type === "stock_alert" && (
                                                            <AlertCircle
                                                                size={18}
                                                                className="text-red-500"
                                                            />
                                                        )}
                                                        {notification.type === "inventory_update" && (
                                                            <CheckCircle
                                                                size={18}
                                                                className="text-green-500"
                                                            />
                                                        )}
                                                        {notification.type === "stock_info" && (
                                                            <Info
                                                                size={18}
                                                                className="text-blue-500"
                                                            />
                                                        )}
                                                        {/* Add new notification types for laundry services */}
                                                        {notification.type === "new_laundry_service" && (
                                                            <Bell
                                                                size={18}
                                                                className="text-purple-500"
                                                            />
                                                        )}
                                                        {notification.type === "load_completed" && (
                                                            <CheckCircle
                                                                size={18}
                                                                className="text-green-500"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4
                                                            className={`text-sm font-medium ${
                                                                !notification.read
                                                                    ? "text-blue-600 dark:text-blue-400"
                                                                    : theme === "dark"
                                                                      ? "text-white"
                                                                      : "text-slate-900"
                                                            }`}
                                                        >
                                                            {notification.title}
                                                        </h4>
                                                        <p
                                                            className="mt-1 text-sm"
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
                                                    {!notification.read && <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>}
                                                </div>
                                            ))
                                        ) : (
                                            <div
                                                className="p-4 text-center"
                                                style={{ color: theme === "dark" ? "#cbd5e1" : "#64748b" }}
                                            >
                                                No notifications
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className="border-t p-2"
                                        style={{ borderColor: theme === "dark" ? "#334155" : "#e2e8f0" }}
                                    >
                                        <button
                                            className="w-full rounded-md py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                                            style={{ color: theme === "dark" ? "#e2e8f0" : "#475569" }}
                                            onClick={markAllAsRead}
                                        >
                                            Mark all as read
                                        </button>
                                    </div>
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
                                placeholder="Search something"
                                autoFocus
                                className={`w-full bg-transparent px-2 text-sm outline-none placeholder:text-slate-400 ${
                                    theme === "dark" ? "text-white" : "text-slate-900"
                                }`}
                            />
                            <button
                                onClick={() => setSearchActive(false)}
                                className={`ml-2 transition-colors ${
                                    theme === "dark" ? "text-white hover:text-cyan-400" : "text-slate-700 hover:text-cyan-600"
                                }`}
                                title="Close search"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
};

export default Header;