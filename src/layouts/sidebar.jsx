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
import { ChevronDown, LogOut, User } from "lucide-react";

export const Sidebar = forwardRef(({ collapsed, links, user, role, isLoading = false }, ref) => {
    const { theme } = useTheme();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [activeGroup, setActiveGroup] = useState(null);
    const profileRef = useRef(null);
    const logout = useLogout();

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

    if (isLoading) {
        return (
            <aside
                ref={ref}
                className={cn(
                    "fixed z-50 flex h-screen flex-col border-r transition-all duration-300 ease-in-out",
                    collapsed ? "max-md:-left-full md:w-[70px]" : "max-md:left-0 md:w-[240px]",
                    theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
                )}
            >
                {/* Skeleton Logo */}
                <div className={cn(
                    "flex items-center p-3 min-h-[60px] flex-shrink-0",
                    collapsed ? "justify-center" : "gap-x-3"
                )}>
                    <div className={cn(
                        "rounded-full animate-pulse",
                        collapsed ? "h-8 w-8" : "h-6 w-6"
                    )} />
                    {!collapsed && (
                        <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                    )}
                </div>

                {/* Skeleton Navigation Links */}
                <div className="flex flex-1 flex-col gap-y-4 p-3 min-h-0 overflow-y-auto">
                    {[1, 2].map((group) => (
                        <nav
                            key={group}
                            className={cn("flex flex-col gap-y-2", collapsed && "items-center")}
                        >
                            {!collapsed && (
                                <div className="h-3 w-16 bg-slate-300 dark:bg-slate-700 rounded animate-pulse mb-1" />
                            )}
                            <div className="flex flex-col gap-y-1">
                                {[1, 2, 3].map((link) => (
                                    <div
                                        key={link}
                                        className={cn(
                                            "flex items-center gap-x-3 rounded px-3 py-2",
                                            collapsed ? "justify-center" : ""
                                        )}
                                    >
                                        <div className="h-6 w-6 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                                        {!collapsed && (
                                            <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </nav>
                    ))}
                </div>

                {/* Skeleton Profile Section */}
                <div className={cn(
                    "mt-auto border-t p-3 flex-shrink-0",
                    theme === "dark" ? "border-slate-700" : "border-slate-200"
                )}>
                    {collapsed ? (
                        <div className="flex justify-center">
                            <div className="h-10 w-10 bg-slate-300 dark:bg-slate-700 rounded-full animate-pulse" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-300 dark:bg-slate-700 rounded-full animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-20 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                                <div className="h-2 w-16 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        );
    }

    return (
        <aside
            ref={ref}
            className={cn(
                "fixed z-50 flex h-screen flex-col border-r transition-all duration-300 ease-in-out",
                collapsed ? "max-md:-left-full md:w-[70px]" : "max-md:left-0 md:w-[240px]",
                theme === "dark" ? "border-slate-700 bg-slate-900 shadow-lg" : "border-slate-200 bg-gradient-to-b from-white to-slate-100 shadow-lg",
            )}
            style={{ overflow: 'hidden' }}
        >
            {/* 🪐 Logo and Title - Fixed centering */}
            <div className={cn(
                "flex items-center p-3 min-h-[60px] flex-shrink-0",
                collapsed ? "justify-center" : "gap-x-3"
            )}>
                <img
                    src={logoLight}
                    alt="Logo"
                    className="h-6 dark:hidden"
                />
                <img
                    src={logoDark}
                    alt="Logo (dark)"
                    className="hidden h-6 dark:block"
                />
                {!collapsed && (
                    <motion.p
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn("font-starjedi text-lg tracking-wide whitespace-nowrap", theme === "dark" ? "glow-text text-white" : "text-slate-800")}
                        style={{
                            textShadow: theme === "dark" ? "0 0 3px rgba(255, 255, 255, 0.4)" : "0 0 2px rgba(0, 0, 0, 0.2)",
                            letterSpacing: "1px",
                        }}
                    >
                        STAR WASH
                    </motion.p>
                )}
            </div>

            {/* 🧭 Navigation Links - Fixed overflow */}
            <div className="scrollbar-thin flex flex-1 flex-col gap-y-4 p-3 min-h-0 overflow-y-auto">
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
                                className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1 overflow-hidden whitespace-nowrap"
                            >
                                {group.title}
                            </motion.p>
                        )}
                        <div className="flex flex-col gap-y-1">
                            {group.Links.map((link) => (
                                <NavLink
                                    key={link.label}
                                    to={link.path}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-x-3 rounded px-3 py-2 text-sm font-medium transition-all group relative",
                                            "hover:bg-[#0891B2]/10 hover:text-[#0891B2] dark:hover:bg-[#0891B2]/20 dark:hover:text-[#0891B2]",
                                            isActive
                                                ? "border-l-2 border-[#0891B2] bg-[#0891B2]/20 font-semibold text-[#0891B2] dark:bg-slate-700"
                                                : "text-slate-800 dark:text-slate-200",
                                            collapsed && "justify-center"
                                        )
                                    }
                                    onMouseEnter={() => setActiveGroup(group.title)}
                                    onMouseLeave={() => setActiveGroup(null)}
                                >
                                    <link.icon
                                        size={22}
                                        className="flex-shrink-0"
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
                                    
                                    {/* Tooltip for collapsed state */}
                                    {collapsed && (
                                        <div className={cn(
                                            "absolute left-full ml-3 px-2 py-1 text-xs font-medium rounded-md shadow-lg transition-opacity z-50 whitespace-nowrap",
                                            theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-slate-800",
                                            activeGroup === group.title ? "opacity-100" : "opacity-0 pointer-events-none"
                                        )}>
                                            {link.label}
                                        </div>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </nav>
                ))}
            </div>

            {/* 👤 Profile Section */}
            <div className={cn("mt-auto border-t p-3 transition-colors relative flex-shrink-0", theme === "dark" ? "border-slate-700" : "border-slate-200")}>
                {collapsed ? (
                    <div className="relative flex justify-center" ref={profileRef}>
                        <button
                            className="flex size-10 items-center justify-center rounded-full border border-slate-300 bg-cyan-600 text-white transition-all hover:ring-2 hover:ring-cyan-500 dark:border-slate-600"
                            onClick={() => setShowProfileMenu((prev) => !prev)}
                            title="Profile"
                        >
                            <User size={20} />
                        </button>

                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className={cn(
                                        "fixed left-[70px] bottom-3 mb-2 w-48 rounded-lg border py-1 shadow-lg z-50",
                                        theme === "dark" ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white",
                                    )}
                                >
                                    <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{user?.username || "Username"}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{role || "User Role"}</p>
                                    </div>
                                    <button
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
                                        onClick={logout}
                                    >
                                        <LogOut size={16} />
                                        <span>Logout</span>
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
                            className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
                            onClick={() => setShowProfileMenu((prev) => !prev)}
                        >
                            <div className="flex size-10 items-center justify-center rounded-full border border-slate-300 bg-cyan-600 text-white dark:border-slate-600">
                                <span className="text-sm font-medium">{getInitials(user?.username)}</span>
                            </div>
                            <div className="flex-1 overflow-hidden text-left">
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="truncate text-sm font-medium text-slate-800 dark:text-slate-100"
                                >
                                    {user?.username || "Username"}
                                </motion.p>
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2, delay: 0.1 }}
                                    className="truncate text-xs text-slate-500 dark:text-slate-400"
                                >
                                    {role || "User Role"}
                                </motion.p>
                            </div>
                            <ChevronDown
                                size={16}
                                className={`text-slate-500 transition-transform ${showProfileMenu ? "rotate-180" : ""}`}
                            />
                        </button>

                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className={cn(
                                        "absolute bottom-full left-0 right-0 mb-2 rounded-lg border py-1 shadow-lg z-50",
                                        theme === "dark" ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white",
                                    )}
                                >
                                    <button
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
                                        onClick={logout}
                                    >
                                        <LogOut size={16} />
                                        <span>Logout</span>
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