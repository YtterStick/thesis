import { forwardRef, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";
import PropTypes from "prop-types";
import { cn } from "@/utils/cn";
import { NavLink } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useLogout } from "@/hooks/useLogout";
import { ChevronDown, LogOut, User, Loader2 } from "lucide-react";

export const Sidebar = forwardRef(({ collapsed, links, user, role, isLoading = false }, ref) => {
    const { theme } = useTheme();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [activeGroup, setActiveGroup] = useState(null);
    const [hoveredLink, setHoveredLink] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const profileRef = useRef(null);
    const logout = useLogout();

    // Calculate isDarkMode based on theme - matching User side
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    useClickOutside([profileRef], () => setShowProfileMenu(false));

    // Function to get initials from username
    const getInitials = (username) => {
        if (!username) return "U";
        return username
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Enhanced logout handler with protection
    const handleLogout = async () => {
        if (isLoggingOut) return; // Prevent multiple clicks
        
        setIsLoggingOut(true);
        setShowProfileMenu(false);
        
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            // Reset after a minimum delay to ensure visual feedback
            setTimeout(() => {
                setIsLoggingOut(false);
            }, 1000);
        }
    };

    // Simple calculation for collapsed state - only count the links
    const calculateCollapsedPositions = () => {
        const positions = {};
        let linkCount = 0;
        
        links.forEach((group) => {
            group.Links.forEach((link) => {
                // Simple calculation: header (60px) + (link index * 48px) + 20px to center
                positions[link.label] = 60 + (linkCount * 48) + 20;
                linkCount++;
            });
        });

        return positions;
    };

    const collapsedPositions = calculateCollapsedPositions();

    if (isLoading) {
        return (
            <aside
                ref={ref}
                className={cn(
                    "fixed z-40 flex h-screen flex-col border-r transition-all duration-300 ease-in-out",
                    collapsed ? "max-md:-left-full md:w-[70px]" : "max-md:left-0 md:w-[240px]",
                    isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"
                )}
            >
                {/* Skeleton Logo */}
                <div className={cn(
                    "flex items-center p-3 min-h-[60px] flex-shrink-0",
                    collapsed ? "justify-center" : "gap-x-3"
                )}>
                    <div className={cn(
                        "rounded-full animate-pulse",
                        collapsed ? "h-8 w-8" : "h-6 w-6",
                        isDarkMode ? "bg-slate-700" : "bg-slate-300"
                    )} />
                    {!collapsed && (
                        <div className={cn(
                            "h-4 w-24 rounded animate-pulse",
                            isDarkMode ? "bg-slate-700" : "bg-slate-300"
                        )} />
                    )}
                </div>
            </aside>
        );
    }

    return (
        <aside
            ref={ref}
            className={cn(
                "fixed z-40 flex h-screen flex-col border-r transition-all duration-300 ease-in-out overflow-hidden",
                collapsed ? "max-md:-left-full md:w-[70px]" : "max-md:left-0 md:w-[240px]",
            )}
            style={{
                backgroundColor: "var(--admin-sidebar-bg)",
                borderColor: "var(--admin-card-border)",
            }}
        >
            {/* 🪐 Logo and Title - Fixed centering */}
            <div className={cn(
                "flex items-center p-3 min-h-[60px] flex-shrink-0",
                collapsed ? "justify-center" : "gap-x-3"
            )}>
                {/* Use GIF from public folder */}
                <img
                    src="/logo.gif"
                    alt="Logo"
                    className="h-6"
                />
                {!collapsed && (
                    <motion.p
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn("font-starjedi text-lg tracking-wide whitespace-nowrap")}
                        style={{
                            color: "var(--admin-text-primary)",
                            textShadow: isDarkMode ? "0 0 3px rgba(255, 255, 255, 0.2)" : "none",
                            letterSpacing: "1px",
                        }}
                    >
                        STAR WASH
                    </motion.p>
                )}
            </div>

            {/* 🧭 Navigation Links - Fixed overflow */}
            <div className="scrollbar-thin flex flex-1 flex-col gap-y-4 p-3 min-h-0 overflow-y-auto overflow-x-hidden">
                {links.map((group) => (
                    <nav
                        key={group.title}
                        className={cn("flex flex-col gap-y-2", collapsed && "items-center")}
                    >
                        {!collapsed && (
                            <motion.p 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-[10px] font-bold uppercase tracking-widest mb-1 overflow-hidden whitespace-nowrap opacity-60"
                                style={{ color: "var(--admin-text-secondary)" }}
                            >
                                {group.title}
                            </motion.p>
                        )}
                        <div className="flex flex-col gap-y-1">
                            {group.Links.map((link) => (
                                <div key={link.label} className="relative">
                                    <NavLink
                                        to={link.path}
                                        className={({ isActive }) =>
                                            cn(
                                                "flex items-center gap-x-3 rounded px-3 py-2 text-sm font-medium transition-all group relative",
                                                "hover:opacity-80",
                                                isActive
                                                    ? "border-l-2 font-semibold"
                                                    : "",
                                                collapsed && "justify-center"
                                            )
                                        }
                                        style={({ isActive }) => ({
                                            color: isActive ? "var(--admin-accent)" : "var(--admin-text-primary)",
                                            borderLeftColor: isActive ? "var(--admin-accent)" : 'transparent',
                                            backgroundColor: isActive ? "var(--admin-accent-soft)" : 'transparent'
                                        })}
                                        onMouseEnter={() => {
                                            setActiveGroup(group.title);
                                            setHoveredLink(link.label);
                                        }}
                                        onMouseLeave={() => {
                                            setActiveGroup(null);
                                            setHoveredLink(null);
                                        }}
                                    >
                                        <link.icon
                                            size={22}
                                            className="flex-shrink-0"
                                            style={{ color: "var(--admin-text-secondary)" }}
                                        />
                                        {!collapsed && (
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden whitespace-nowrap"
                                            >
                                                {link.label}
                                            </motion.span>
                                        )}
                                    </NavLink>
                                    
                                    {/* Tooltip for collapsed state */}
                                    {collapsed && hoveredLink === link.label && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={cn(
                                                "fixed left-[70px] px-3 py-2 text-xs font-medium rounded-md shadow-lg z-50 whitespace-nowrap pointer-events-none border",
                                            )}
                                            style={{
                                                backgroundColor: "var(--admin-card-bg)",
                                                borderColor: "var(--admin-card-border)",
                                                color: "var(--admin-text-primary)",
                                                top: `${collapsedPositions[link.label]}px`
                                            }}
                                        >
                                            {link.label}
                                        </motion.div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </nav>
                ))}
            </div>

            {/* 👤 Profile Section */}
            <div 
                className="mt-auto border-t p-3 transition-colors relative flex-shrink-0"
                style={{ borderColor: "var(--admin-card-border)" }}
            >
                {collapsed ? (
                    <div className="relative flex justify-center" ref={profileRef}>
                        <button
                            className={cn(
                                "flex size-10 items-center justify-center rounded-full border transition-all hover:opacity-80 shadow-sm",
                            )}
                            style={{
                                borderColor: "var(--admin-card-border)",
                                backgroundColor: "var(--admin-accent-soft)",
                                color: "var(--admin-accent)",
                            }}
                            onClick={() => setShowProfileMenu((prev) => !prev)}
                            onMouseEnter={() => setHoveredLink('profile')}
                            onMouseLeave={() => setHoveredLink(null)}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <User size={20} />
                            )}
                        </button>

                        {/* Profile tooltip for collapsed state */}
                        {collapsed && hoveredLink === 'profile' && !isLoggingOut && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                    "fixed left-[70px] bottom-3 px-3 py-2 text-xs font-medium rounded-md shadow-lg z-50 whitespace-nowrap pointer-events-none border",
                                )}
                                style={{
                                    backgroundColor: "var(--admin-card-bg)",
                                    borderColor: "var(--admin-card-border)",
                                    color: "var(--admin-text-primary)",
                                }}
                            >
                                {isLoggingOut ? "Logging out..." : "Profile"}
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {showProfileMenu && !isLoggingOut && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className={cn(
                                        "fixed left-[70px] bottom-3 mb-2 w-48 rounded-lg border py-1 shadow-lg z-50",
                                    )}
                                    style={{
                                        backgroundColor: "var(--admin-card-bg)",
                                        borderColor: "var(--admin-card-border)",
                                    }}
                                >
                                    <div 
                                        className="border-b px-3 py-2"
                                        style={{ borderColor: "var(--admin-card-border)" }}
                                    >
                                        <p className="text-sm font-medium truncate" style={{ color: "var(--admin-text-primary)" }}>
                                            {user?.username || "Username"}
                                        </p>
                                        <p className="text-xs truncate" style={{ color: "var(--admin-text-secondary)" }}>
                                            {role || "User Role"}
                                        </p>
                                    </div>
                                    <button
                                        className={cn(
                                            "flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors",
                                            isLoggingOut 
                                                ? "opacity-50 cursor-not-allowed" 
                                                : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                        style={{ color: "var(--admin-text-primary)" }}
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                    >
                                        {isLoggingOut ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Logging out...</span>
                                            </>
                                        ) : (
                                            <>
                                                <LogOut size={16} />
                                                <span>Logout</span>
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div
                        className="relative"
                        ref={profileRef}
                    >
                        <button
                            className={cn(
                                "flex w-full items-center gap-3 rounded-lg p-2 transition-all hover:opacity-80",
                            )}
                            onClick={() => !isLoggingOut && setShowProfileMenu((prev) => !prev)}
                            disabled={isLoggingOut}
                        >
                            <div className={cn(
                                "flex size-10 items-center justify-center rounded-full border shadow-sm",
                            )}
                            style={{
                                borderColor: "var(--admin-card-border)",
                                backgroundColor: "var(--admin-accent-soft)",
                                color: "var(--admin-accent)",
                            }}>
                                {isLoggingOut ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <span className="text-sm font-medium">{getInitials(user?.username)}</span>
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden text-left">
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="truncate text-sm font-bold"
                                    style={{ color: "var(--admin-text-primary)" }}
                                >
                                    {user?.username || "Username"}
                                </motion.p>
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2, delay: 0.1 }}
                                    className="truncate text-xs"
                                    style={{ color: "var(--admin-text-secondary)" }}
                                >
                                    {isLoggingOut ? "Logging out..." : (role || "User Role")}
                                </motion.p>
                            </div>
                            {!isLoggingOut && (
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform ${showProfileMenu ? "rotate-180" : ""}`}
                                    style={{ color: "var(--admin-text-secondary)" }}
                                />
                            )}
                        </button>

                        <AnimatePresence>
                            {showProfileMenu && !isLoggingOut && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className={cn(
                                        "absolute bottom-full left-0 right-0 mb-2 rounded-lg border py-1 shadow-lg z-50",
                                    )}
                                    style={{
                                        backgroundColor: "var(--admin-card-bg)",
                                        borderColor: "var(--admin-card-border)",
                                    }}
                                >
                                    <button
                                        className={cn(
                                            "flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors",
                                            isLoggingOut 
                                                ? "opacity-50 cursor-not-allowed" 
                                                : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                        style={{ color: "var(--admin-text-primary)" }}
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                    >
                                        {isLoggingOut ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Logging out...</span>
                                            </>
                                        ) : (
                                            <>
                                                <LogOut size={16} />
                                                <span>Logout</span>
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </aside>
    );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapsed: PropTypes.bool,
    links: PropTypes.array.isRequired,
    user: PropTypes.object,
    role: PropTypes.string,
    isLoading: PropTypes.bool,
};