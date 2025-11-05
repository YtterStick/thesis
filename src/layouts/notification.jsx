import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/auth-context";
import {
    Bell,
    X,
    CheckCircle,
    AlertCircle,
    Info,
    RefreshCw,
    Sun,
    Clock,
    AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api-config";
import { useNavigate } from "react-router-dom";

// localStorage keys
const STORAGE_KEYS = {
    SHOWN_NOTIFICATION_IDS: 'starwash_shown_notification_ids',
    SHOWN_NOTIFICATION_TIMESTAMPS: 'starwash_shown_notification_timestamps',
    NOTIFICATIONS_CACHE: 'starwash_notifications_cache',
    UNREAD_COUNT_CACHE: 'starwash_unread_count_cache',
    CACHE_TIMESTAMP: 'starwash_cache_timestamp'
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

export const NotificationSystem = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { user, role: userRole } = useAuth(); // Get role from auth context
    
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [autoNotifications, setAutoNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const notificationRef = useRef(null);
    const notificationsEndRef = useRef(null);
    const observerRef = useRef(null);
    const pollingRef = useRef(null);
    const realTimePollingRef = useRef(null);
    const autoNotificationTimeoutRef = useRef(new Map());
    const shownNotificationIdsRef = useRef(new Set());
    const lastFetchedIdsRef = useRef(new Set());
    const processedNotificationIdsRef = useRef(new Set());

    // Calculate isDarkMode based on theme
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Debug role
    useEffect(() => {
        console.log("🎯 Notification System - User Role:", userRole);
        console.log("👤 Notification System - User:", user);
    }, [userRole, user]);

    // Cache management functions
    const getCachedData = useCallback((key) => {
        try {
            const cached = localStorage.getItem(key);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRY) {
                    return data;
                }
            }
        } catch (error) {
            console.error('Error reading cache:', error);
        }
        return null;
    }, []);

    const setCachedData = useCallback((key, data) => {
        try {
            const cacheData = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error setting cache:', error);
        }
    }, []);

    // Save shown notification IDs to localStorage
    const saveShownNotificationIds = useCallback((idsArray, timestampsMap = {}) => {
        try {
            const currentTime = Date.now();
            const updatedTimestamps = { ...timestampsMap };
            idsArray.forEach(id => {
                updatedTimestamps[id] = currentTime;
            });

            localStorage.setItem(STORAGE_KEYS.SHOWN_NOTIFICATION_IDS, JSON.stringify(idsArray));
            localStorage.setItem(STORAGE_KEYS.SHOWN_NOTIFICATION_TIMESTAMPS, JSON.stringify(updatedTimestamps));
        } catch (error) {
            console.error('Error saving shown notification IDs to localStorage:', error);
        }
    }, []);

    // Add notification ID to shown set and save to localStorage
    const markNotificationAsShown = useCallback((notificationId) => {
        shownNotificationIdsRef.current.add(notificationId);
        processedNotificationIdsRef.current.add(notificationId);
        const idsArray = Array.from(shownNotificationIdsRef.current);
        
        let timestampsMap = {};
        try {
            const storedTimestamps = localStorage.getItem(STORAGE_KEYS.SHOWN_NOTIFICATION_TIMESTAMPS);
            if (storedTimestamps) {
                timestampsMap = JSON.parse(storedTimestamps);
            }
        } catch (error) {
            console.error('Error loading timestamps from localStorage:', error);
        }
        
        saveShownNotificationIds(idsArray, timestampsMap);
    }, [saveShownNotificationIds]);

    // Initialize shown notification IDs from localStorage
    useEffect(() => {
        const initializeShownNotifications = () => {
            try {
                const storedIds = localStorage.getItem(STORAGE_KEYS.SHOWN_NOTIFICATION_IDS);
                const storedTimestamps = localStorage.getItem(STORAGE_KEYS.SHOWN_NOTIFICATION_TIMESTAMPS);
                
                if (storedIds) {
                    const idsArray = JSON.parse(storedIds);
                    const timestampsMap = storedTimestamps ? JSON.parse(storedTimestamps) : {};
                    
                    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                    const validIds = idsArray.filter(id => {
                        const timestamp = timestampsMap[id];
                        return timestamp && timestamp > oneWeekAgo;
                    });
                    
                    shownNotificationIdsRef.current = new Set(validIds);
                    processedNotificationIdsRef.current = new Set(validIds);
                    
                    if (validIds.length !== idsArray.length) {
                        saveShownNotificationIds(validIds, timestampsMap);
                    }
                }
            } catch (error) {
                console.error('Error loading shown notification IDs from localStorage:', error);
                shownNotificationIdsRef.current = new Set();
                processedNotificationIdsRef.current = new Set();
            }
        };

        initializeShownNotifications();
    }, [saveShownNotificationIds]);

    // Format time ago in PH Time (GMT+8)
    const formatTimeAgo = useCallback((dateString) => {
        try {
            const date = new Date(dateString);
            const phDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
            const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
            
            const diffInSeconds = Math.floor((now - phDate) / 1000);

            if (diffInSeconds < 60) {
                return `${diffInSeconds} seconds ago`;
            } else if (diffInSeconds < 3600) {
                return `${Math.floor(diffInSeconds / 60)} minutes ago`;
            } else if (diffInSeconds < 86400) {
                return `${Math.floor(diffInSeconds / 3600)} hours ago`;
            } else {
                return `${Math.floor(diffInSeconds / 86400)} days ago`;
            }
        } catch (error) {
            console.error("Error formatting time:", error);
            return "Recently";
        }
    }, []);

    // Enhanced notification navigation with proper role-based paths
    const handleNotificationNavigation = useCallback((notification) => {
        console.log("Navigating with notification:", notification);
        console.log("User role:", userRole);
        
        setNotificationOpen(false);
        
        if (notification.autoShow) {
            removeAutoNotification(notification.id);
        }

        // MARK AS READ when notification is clicked
        if (!notification.read) {
            markAsRead(notification.id);
        }

        // Determine navigation path based on notification type and user role
        let targetPath = "";
        
        // Stock-related notifications
        const isStockNotification = 
            notification.type === "stock_alert" || 
            notification.type === "inventory_update" || 
            notification.type === "stock_info" ||
            notification.type === "low_stock_warning" ||
            notification.type === "adequate_stock_level";

        // Laundry-related notifications  
        const isLaundryNotification =
            notification.type === "load_washed" || 
            notification.type === "load_dried" || 
            notification.type === "load_completed" ||
            notification.type === "new_laundry_service";

        if (isStockNotification) {
            // Proper role-based routing for stock notifications
            if (userRole === "ADMIN") {
                targetPath = "/manageinventory";
            } else {
                targetPath = "/staff/inventory";
            }
        } else if (isLaundryNotification) {
            // Laundry notifications
            if (userRole === "STAFF") {
                targetPath = "/staff/tracking";
            } else {
                targetPath = "/manageinventory";
            }
        } else {
            // Default fallback
            targetPath = userRole === "ADMIN" ? "/manageinventory" : "/staff/dashboard";
        }

        console.log(`Navigating to: ${targetPath} for ${notification.type}`);
        navigate(targetPath);

        // Scroll to specific element if relatedEntityId exists
        if (notification.relatedEntityId) {
            setTimeout(() => {
                let elementId = "";
                if (isStockNotification) {
                    elementId = `stock-${notification.relatedEntityId}`;
                } else if (isLaundryNotification) {
                    elementId = `job-${notification.relatedEntityId}`;
                }
                
                const element = document.getElementById(elementId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('highlight-pulse');
                    setTimeout(() => element.classList.remove('highlight-pulse'), 3000);
                }
            }, 500);
        }
    }, [navigate, userRole]);

    // Fetch unread count with caching
    const fetchUnreadCount = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh) {
            const cachedCount = getCachedData(STORAGE_KEYS.UNREAD_COUNT_CACHE);
            if (cachedCount !== null) {
                setUnreadCount(cachedCount);
                return cachedCount;
            }
        }

        try {
            const response = await api.get("api/notifications/unread-count");
            
            let count = 0;
            if (typeof response === 'number') {
                count = response;
            } else if (response && typeof response.count === 'number') {
                count = response.count;
            } else if (response && typeof response.data === 'number') {
                count = response.data;
            } else if (response && typeof response.unreadCount === 'number') {
                count = response.unreadCount;
            }
            
            console.log('🔢 Fetched unread count:', count);
            setUnreadCount(count);
            setCachedData(STORAGE_KEYS.UNREAD_COUNT_CACHE, count);
            return count;
        } catch (error) {
            console.error("Error fetching unread count:", error);
            
            const cachedCount = getCachedData(STORAGE_KEYS.UNREAD_COUNT_CACHE);
            if (cachedCount !== null) {
                setUnreadCount(cachedCount);
                return cachedCount;
            }
            
            setUnreadCount(0);
            return 0;
        }
    }, [getCachedData, setCachedData]);

    // Smart refresh functionality - load initial 30 items
    const smartRefreshNotifications = useCallback(async (forceRefresh = false) => {
        setIsRefreshing(true);
        try {
            console.log('🔄 Starting smart refresh...');
            
            const response = await api.get(`api/notifications?page=1&limit=30`);
            
            let notificationsData = [];
            let hasMoreData = false;
            
            if (Array.isArray(response)) {
                notificationsData = response;
                hasMoreData = response.length === 30;
            } else if (response && response.notifications) {
                notificationsData = response.notifications;
                hasMoreData = response.hasMore || false;
            } else if (response && Array.isArray(response.data)) {
                notificationsData = response.data;
                hasMoreData = response.hasMore || false;
            } else {
                notificationsData = Array.isArray(response) ? response : [];
                hasMoreData = false;
            }
            
            // Update last fetched IDs
            notificationsData.forEach(notif => {
                if (notif.id) {
                    lastFetchedIdsRef.current.add(notif.id);
                }
            });
            
            setNotifications(notificationsData);
            setHasMore(hasMoreData);
            setPage(1);
            
            setCachedData(STORAGE_KEYS.NOTIFICATIONS_CACHE, notificationsData);
            await fetchUnreadCount(true);
            
            console.log(`📥 Smart refresh loaded ${notificationsData.length} notifications, hasMore: ${hasMoreData}`);
            
            return true;
        } catch (error) {
            console.error('❌ Smart refresh failed:', error);
            
            const cachedNotifications = getCachedData(STORAGE_KEYS.NOTIFICATIONS_CACHE);
            if (cachedNotifications) {
                setNotifications(cachedNotifications);
            }
            
            return false;
        } finally {
            setIsRefreshing(false);
        }
    }, [getCachedData, setCachedData, fetchUnreadCount]);

    // Enhanced fetch notifications with smart loading (infinite scroll)
    const fetchNotifications = useCallback(async (pageNum = 1, append = false, forceRefresh = false) => {
        // Use cache only for initial load, not for refreshes or appends
        if (pageNum === 1 && !append && !forceRefresh) {
            const cachedNotifications = getCachedData(STORAGE_KEYS.NOTIFICATIONS_CACHE);
            if (cachedNotifications && cachedNotifications.length >= 30) {
                console.log(`📂 Using ${cachedNotifications.length} cached notifications`);
                setNotifications(cachedNotifications);
                setHasMore(cachedNotifications.length === 30);
                setLoading(false);
                
                // Update last fetched IDs from cache
                cachedNotifications.forEach(notif => {
                    if (notif.id) {
                        lastFetchedIdsRef.current.add(notif.id);
                    }
                });
                
                return true;
            }
            return await smartRefreshNotifications();
        }

        try {
            setNotificationsLoading(true);
            if (!append) {
                setLoading(true);
            }

            const response = await api.get(`api/notifications?page=${pageNum}&limit=30`);
            
            let notificationsData = [];
            let hasMoreData = false;
            
            if (Array.isArray(response)) {
                notificationsData = response;
                hasMoreData = response.length === 30;
            } else if (response && response.notifications) {
                notificationsData = response.notifications;
                hasMoreData = response.hasMore || false;
            } else if (response && Array.isArray(response.data)) {
                notificationsData = response.data;
                hasMoreData = response.hasMore || false;
            } else {
                notificationsData = Array.isArray(response) ? response : [];
                hasMoreData = false;
            }

            console.log(`📥 Page ${pageNum}: Loaded ${notificationsData.length} notifications, hasMore: ${hasMoreData}`);

            // Update last fetched IDs
            notificationsData.forEach(notif => {
                if (notif.id) {
                    lastFetchedIdsRef.current.add(notif.id);
                }
            });

            if (append) {
                setNotifications(prev => [...prev, ...notificationsData]);
            } else {
                setNotifications(notificationsData);
                if (pageNum === 1) {
                    setCachedData(STORAGE_KEYS.NOTIFICATIONS_CACHE, notificationsData);
                }
            }
            
            setHasMore(hasMoreData);
            setPage(pageNum);
            return true;
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
            
            if (pageNum === 1 && !append) {
                const cachedNotifications = getCachedData(STORAGE_KEYS.NOTIFICATIONS_CACHE);
                if (cachedNotifications) {
                    setNotifications(cachedNotifications);
                    setLoading(false);
                    return true;
                }
            }
            
            if (!append) {
                setNotifications([]);
            }
            setHasMore(false);
            return false;
        } finally {
            setNotificationsLoading(false);
            if (!append) {
                setLoading(false);
            }
        }
    }, [getCachedData, setCachedData, smartRefreshNotifications]);

    // Mark notification as read
    const markAsRead = useCallback(async (id) => {
        try {
            await api.post(`api/notifications/${id}/read`);
            
            setNotifications(prev => 
                prev.map(notif => 
                    notif.id === id ? { ...notif, read: true } : notif
                )
            );
            
            setAutoNotifications(prev => 
                prev.map(notif => 
                    notif.id === id ? { ...notif, read: true } : notif
                )
            );
            
            const cachedNotifications = getCachedData(STORAGE_KEYS.NOTIFICATIONS_CACHE);
            if (cachedNotifications) {
                const updatedCache = cachedNotifications.map(notif => 
                    notif.id === id ? { ...notif, read: true } : notif
                );
                setCachedData(STORAGE_KEYS.NOTIFICATIONS_CACHE, updatedCache);
            }
            
            // Force refresh the unread count immediately
            await fetchUnreadCount(true);
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    }, [fetchUnreadCount, getCachedData, setCachedData]);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            await api.post("api/notifications/read-all");
            
            setNotifications(prev => 
                prev.map(notif => ({ ...notif, read: true }))
            );
            
            setAutoNotifications(prev => 
                prev.map(notif => ({ ...notif, read: true }))
            );
            
            const cachedNotifications = getCachedData(STORAGE_KEYS.NOTIFICATIONS_CACHE);
            if (cachedNotifications) {
                const updatedCache = cachedNotifications.map(notif => ({ ...notif, read: true }));
                setCachedData(STORAGE_KEYS.NOTIFICATIONS_CACHE, updatedCache);
            }
            
            // Force refresh the unread count immediately
            await fetchUnreadCount(true);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    }, [fetchUnreadCount, getCachedData, setCachedData]);

    // Remove auto notification
    const removeAutoNotification = useCallback((notificationId) => {
        if (autoNotificationTimeoutRef.current.has(notificationId)) {
            clearTimeout(autoNotificationTimeoutRef.current.get(notificationId));
            autoNotificationTimeoutRef.current.delete(notificationId);
        }
        
        setAutoNotifications(prev => 
            prev.filter(notif => notif.id !== notificationId)
        );
    }, []);

    // Show auto notifications - Only show once per notification lifetime
    const showAutoNotifications = useCallback((newNotifications) => {
        if (!newNotifications || newNotifications.length === 0) return;

        console.log('🎯 Checking for new notifications to show as popup...', newNotifications);

        const notificationsToShow = newNotifications.filter(notification => {
            // Check if already shown in popup OR already processed
            const hasBeenShown = shownNotificationIdsRef.current.has(notification.id);
            const hasBeenProcessed = processedNotificationIdsRef.current.has(notification.id);
            
            if (hasBeenShown || hasBeenProcessed) {
                console.log(`📭 Skipping - already shown/processed: ${notification.id}`);
                return false;
            }
            
            // Check if already fetched in the list (to avoid showing old notifications as new)
            const isAlreadyFetched = lastFetchedIdsRef.current.has(notification.id);
            if (isAlreadyFetched) {
                console.log(`📭 Skipping - already in notification list: ${notification.id}`);
                processedNotificationIdsRef.current.add(notification.id);
                return false;
            }
            
            console.log(`📬 Will show new notification popup: ${notification.id}`);
            return true;
        });

        if (notificationsToShow.length === 0) {
            console.log('📭 No new notifications to show as popup');
            return;
        }

        const limitedNotifications = notificationsToShow.slice(0, 3);
        
        // Mark as shown AND processed immediately to prevent spam
        limitedNotifications.forEach(notification => {
            console.log(`🏷️ Marking notification as shown and processed: ${notification.id}`);
            markNotificationAsShown(notification.id);
            processedNotificationIdsRef.current.add(notification.id);
        });

        const newAutoNotifications = limitedNotifications.map(notification => ({
            ...notification,
            autoShow: true,
            showTime: new Date(),
            // Add a unique key for the animation
            uniqueKey: `${notification.id}-${Date.now()}`
        }));

        console.log('🚀 Showing auto notifications popup:', newAutoNotifications.length);

        setAutoNotifications(prev => {
            const combined = [...newAutoNotifications, ...prev];
            return combined.slice(0, 3); // Limit to 3 max
        });

        // Set timeouts to remove notifications after 5 seconds
        newAutoNotifications.forEach(notification => {
            const timeoutId = setTimeout(() => {
                console.log(`⏰ Removing auto notification: ${notification.id}`);
                removeAutoNotification(notification.id);
            }, 5000);
            
            autoNotificationTimeoutRef.current.set(notification.id, timeoutId);
        });

        // Update unread count when showing new notifications
        fetchUnreadCount(true);
    }, [removeAutoNotification, markNotificationAsShown, fetchUnreadCount]);

    // Enhanced notification click handler
    const handleNotificationClick = useCallback((notification) => {
        console.log('📝 Notification clicked, marking as read:', notification.id);
        
        // Always mark as read when clicked, regardless of current state
        markAsRead(notification.id);
        
        handleNotificationNavigation(notification);
    }, [markAsRead, handleNotificationNavigation]);

    // Helper functions for notification styling
    const getNotificationColor = useCallback((type) => {
        switch (type) {
            case "stock_alert": 
            case "low_stock_warning": 
                return "#ef4444"; // red
            case "inventory_update": 
                return "#10b981"; // green
            case "stock_info": 
            case "adequate_stock_level": 
                return "#3b82f6"; // blue
            case "expired_laundry": 
                return "#dc2626"; // dark red
            case "warning": 
                return "#f59e0b"; // amber
            case "load_washed": 
                return "#3b82f6"; // blue
            case "load_dried": 
                return "#f59e0b"; // amber
            case "load_completed": 
                return "#10b981"; // green
            case "new_laundry_service":
                return "#8b5cf6"; // purple
            default: 
                return "#6b7280"; // gray
        }
    }, []);

    const getNotificationIcon = useCallback((type) => {
        const iconProps = { size: 18 };
        switch (type) {
            case "stock_alert":
            case "low_stock_warning":
                return <AlertCircle {...iconProps} className="text-red-500" />;
            case "inventory_update":
                return <CheckCircle {...iconProps} className="text-green-500" />;
            case "stock_info":
            case "adequate_stock_level":
                return <Info {...iconProps} className="text-blue-500" />;
            case "expired_laundry":
                return <Clock {...iconProps} className="text-red-600" />;
            case "warning":
                return <AlertTriangle {...iconProps} className="text-amber-500" />;
            case "load_washed":
                return <RefreshCw {...iconProps} className="text-blue-500" />;
            case "load_dried":
                return <Sun {...iconProps} className="text-orange-500" />;
            case "load_completed":
                return <CheckCircle {...iconProps} className="text-green-500" />;
            case "new_laundry_service":
                return <Bell {...iconProps} className="text-purple-500" />;
            default:
                return <Bell {...iconProps} className="text-gray-500" />;
        }
    }, []);

    // Real-time polling for notifications (only for popups when dropdown is closed)
    const startRealTimePolling = useCallback(() => {
        if (realTimePollingRef.current) {
            clearInterval(realTimePollingRef.current);
        }

        realTimePollingRef.current = setInterval(async () => {
            try {
                // Always check for new notifications, but only show popups when dropdown is closed
                const response = await api.get("api/notifications?page=1&limit=10");
                let recentNotifications = [];
                
                if (Array.isArray(response)) {
                    recentNotifications = response;
                } else if (response && response.notifications) {
                    recentNotifications = response.notifications;
                } else if (response && Array.isArray(response.data)) {
                    recentNotifications = response.data;
                }
                
                // Get only unread notifications that are very recent (last 2 minutes)
                const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
                const newUnreadNotifications = recentNotifications.filter(notif => 
                    !notif.read && new Date(notif.createdAt) > twoMinutesAgo
                );
                
                if (newUnreadNotifications.length > 0) {
                    console.log('🔔 Real-time check found new notifications:', newUnreadNotifications.length);
                    
                    // Only show popups if dropdown is closed
                    if (!notificationOpen) {
                        showAutoNotifications(newUnreadNotifications);
                    }
                    
                    // Always update the count
                    fetchUnreadCount(true);
                }
            } catch (error) {
                console.error('❌ Real-time polling error:', error);
            }
        }, 8000); // Check every 8 seconds (reduced frequency)
    }, [notificationOpen, showAutoNotifications, fetchUnreadCount]);

    // Infinite scroll setup - SMART REFRESH when scrolling to bottom
    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !notificationsLoading && !isRefreshing) {
                    console.log('📜 SMART REFRESH: Loading more notifications, page:', page + 1);
                    fetchNotifications(page + 1, true);
                }
            },
            { threshold: 0.1 }
        );

        if (notificationsEndRef.current) {
            observerRef.current.observe(notificationsEndRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, notificationsLoading, page, fetchNotifications, isRefreshing]);

    // Fetch notifications when dropdown opens and start real-time polling
    useEffect(() => {
        if (notificationOpen) {
            console.log('📂 Opening notifications dropdown');
            smartRefreshNotifications(true);
            fetchUnreadCount(true);
        }

        // Start real-time polling for popups (runs regardless of dropdown state)
        startRealTimePolling();

        return () => {
            if (realTimePollingRef.current) {
                clearInterval(realTimePollingRef.current);
                realTimePollingRef.current = null;
            }
        };
    }, [notificationOpen, smartRefreshNotifications, fetchUnreadCount, startRealTimePolling]);

    // Initialize notifications on component mount
    useEffect(() => {
        const initializeNotifications = async () => {
            try {
                console.log('🚀 Initializing notification system...');
                const cachedNotifications = getCachedData(STORAGE_KEYS.NOTIFICATIONS_CACHE);
                const cachedUnreadCount = getCachedData(STORAGE_KEYS.UNREAD_COUNT_CACHE);
                
                if (cachedNotifications && cachedNotifications.length >= 30) {
                    console.log(`📂 Using ${cachedNotifications.length} cached notifications`);
                    setNotifications(cachedNotifications);
                    
                    // Update last fetched IDs from cache
                    cachedNotifications.forEach(notif => {
                        if (notif.id) {
                            lastFetchedIdsRef.current.add(notif.id);
                        }
                    });
                    
                    setLoading(false);
                }
                
                if (cachedUnreadCount !== null) {
                    setUnreadCount(cachedUnreadCount);
                }
                
                await Promise.all([
                    fetchUnreadCount(true),
                    smartRefreshNotifications(true)
                ]);
                
            } catch (error) {
                console.error('Error initializing notifications:', error);
                setLoading(false);
            }
        };

        initializeNotifications();
    }, [fetchUnreadCount, smartRefreshNotifications, getCachedData]);

    // Manual refresh function
    const handleManualRefresh = useCallback(async () => {
        if (isRefreshing || notificationsLoading) return;
        
        console.log('🔃 Manual refresh triggered');
        await smartRefreshNotifications(true);
    }, [isRefreshing, notificationsLoading, smartRefreshNotifications]);

    // Skeleton loader component for notifications
    const NotificationSkeleton = () => (
        <div className="animate-pulse">
            {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-start gap-3 border-b p-3 border-slate-700">
                    <div className="mt-0.5 flex-shrink-0">
                        <div className={`w-4 h-4 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className={`h-4 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`} style={{ width: '70%' }}></div>
                        <div className={`h-3 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`} style={{ width: '90%' }}></div>
                        <div className={`h-2 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`} style={{ width: '40%' }}></div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Auto Notification Component
    const AutoNotification = ({ notification, index }) => (
        <motion.div
            className="fixed right-4 w-80 rounded-lg border shadow-lg z-50 cursor-pointer mb-3"
            style={{
                backgroundColor: isDarkMode ? "#1e293b" : "white",
                borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                top: `${80 + (index * 112)}px`,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ 
                duration: 0.4,
                delay: index * 0.15,
                type: "spring",
                stiffness: 300,
                damping: 25
            }}
            onClick={() => handleNotificationClick(notification)}
            whileHover={{ 
                scale: 1.02,
                y: -2,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="flex items-start gap-3 p-4">
                <div className="mt-0.5 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100 mb-1">
                        {notification.title || 'No Title'}
                    </h4>
                    <p className="text-sm line-clamp-2 text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                        {notification.message || 'No message'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                        {notification.createdAt ? formatTimeAgo(notification.createdAt) : 'Just now'}
                    </p>
                </div>
                {!notification.read && (
                    <div 
                        className="mt-1 h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getNotificationColor(notification.type) }}
                    />
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        removeAutoNotification(notification.id);
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Close notification"
                >
                    <X size={14} />
                </button>
            </div>
        </motion.div>
    );

    return (
        <>
            {/* Auto Notifications - Show only once, no spam */}
            <AnimatePresence>
                {autoNotifications.map((notification, index) => (
                    <AutoNotification 
                        key={notification.uniqueKey || notification.id || `auto-${Date.now()}-${index}`} 
                        notification={notification}
                        index={index}
                    />
                ))}
            </AnimatePresence>

            {/* Enhanced Notification System */}
            <div className="relative" ref={notificationRef}>
                <button
                    className="group relative size-10 rounded-md transition-colors hover:opacity-80 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    title="Notifications"
                    onClick={() => {
                        setNotificationOpen(!notificationOpen);
                        if (!notificationOpen) {
                            smartRefreshNotifications(true);
                        }
                    }}
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Notification dropdown */}
                <AnimatePresence>
                    {notificationOpen && (
                        <motion.div
                            className="absolute right-0 top-12 w-80 rounded-md border shadow-lg z-50 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Header */}
                            <div
                                className="border-b p-3 border-slate-200 dark:border-slate-700"
                            >
                                <div className="flex items-center justify-between">
                                    <h3
                                        className="font-semibold text-slate-900 dark:text-slate-100"
                                    >
                                        Notifications
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {unreadCount > 0 && (
                                            <span className="rounded-full px-2 py-1 text-xs text-white bg-slate-800 dark:bg-slate-700">
                                                {unreadCount} new
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1">
                                            {isRefreshing ? (
                                                <RefreshCw size={14} className="animate-spin text-cyan-500" />
                                            ) : (
                                                <button
                                                    onClick={handleManualRefresh}
                                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                    title="Refresh notifications"
                                                    disabled={isRefreshing}
                                                >
                                                    <RefreshCw size={14} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" />
                                                </button>
                                            )}
                                            {loading && (
                                                <RefreshCw size={14} className="animate-spin text-slate-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                </div>
                            </div>

                            {/* Notifications List with SMART REFRESH Infinite Scroll */}
                            <div className="max-h-96 overflow-y-auto">
                                {notificationsLoading && page === 1 ? (
                                    <NotificationSkeleton />
                                ) : notifications.length > 0 ? (
                                    <>
                                        <div className="p-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                            Showing {notifications.length} notifications
                                            {hasMore && " - Scroll down to load more"}
                                        </div>
                                        {notifications.map((notification, index) => (
                                            <div
                                                key={notification.id || index}
                                                className={`flex cursor-pointer items-start gap-3 border-b p-3 transition-all ${
                                                    !notification.read
                                                        ? "border-l-2"
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-700"
                                                } border-slate-200 dark:border-slate-700`}
                                                style={{ 
                                                    borderLeftColor: !notification.read ? 
                                                        getNotificationColor(notification.type) : 'transparent',
                                                    backgroundColor: !notification.read ? 
                                                        'rgba(100, 116, 139, 0.1)' : 'transparent'
                                                }}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="mt-0.5 flex-shrink-0">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4
                                                        className="text-sm font-medium truncate text-slate-900 dark:text-slate-100"
                                                    >
                                                        {notification.title || 'No Title'}
                                                    </h4>
                                                    <p
                                                        className="mt-1 text-sm line-clamp-2 text-slate-600 dark:text-slate-400"
                                                    >
                                                        {notification.message || 'No message'}
                                                    </p>
                                                    <p
                                                        className="mt-1 text-xs text-slate-500 dark:text-slate-500"
                                                    >
                                                        {notification.createdAt ? formatTimeAgo(notification.createdAt) : 'Recently'}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <div 
                                                        className="mt-2 h-2 w-2 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: getNotificationColor(notification.type) }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        
                                        {/* SMART REFRESH Infinite scroll trigger */}
                                        <div ref={notificationsEndRef} className="p-2">
                                            {notificationsLoading && page > 1 && (
                                                <div className="flex justify-center py-2">
                                                    <RefreshCw size={16} className="animate-spin text-slate-500" />
                                                    <span className="ml-2 text-xs text-slate-500">Loading more notifications...</span>
                                                </div>
                                            )}
                                            {!hasMore && notifications.length > 0 && (
                                                <div className="text-center text-xs py-2 text-slate-500 dark:text-slate-400">
                                                    No more notifications
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div
                                        className="p-6 text-center text-slate-500 dark:text-slate-400"
                                    >
                                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No notifications</p>
                                        <p className="text-xs mt-1 opacity-70">You're all caught up!</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && !notificationsLoading && (
                                <div
                                    className="border-t p-2 border-slate-200 dark:border-slate-700"
                                >
                                    <button
                                        className="w-full rounded-md py-2 text-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                                        onClick={markAllAsRead}
                                    >
                                        Mark all as read
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default NotificationSystem;