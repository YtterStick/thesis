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

    if (isLoading) {
        return (
            <aside
                ref={ref}
                className={cn(
                    "fixed z-50 flex h-screen flex-col border-r transition-all duration-300 ease-in-out",
                    collapsed ? "max-md:-left-full md:w-[70px]" : "max-md:left-0 md:w-[240px]",
                    isDarkMode ? "border-[#1C3F3A] bg-[#0B2B26]" : "border-[#0B2B26] bg-[#E0EAE8]"
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
                        isDarkMode ? "bg-[#1C3F3A]" : "bg-[#0B2B26]/20"
                    )} />
                    {!collapsed && (
                        <div className={cn(
                            "h-4 w-24 rounded animate-pulse",
                            isDarkMode ? "bg-[#1C3F3A]" : "bg-[#0B2B26]/20"
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
                "fixed z-50 flex h-screen flex-col border-r transition-all duration-300 ease-in-out",
                collapsed ? "max-md:-left-full md:w-[70px]" : "max-md:left-0 md:w-[240px]",
                isDarkMode ? "border-[#1C3F3A] bg-[#0B2B26]" : "border-[#0B2B26] bg-[#E0EAE8]"
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
                        className={cn("font-starjedi text-lg tracking-wide whitespace-nowrap", 
                            isDarkMode ? "text-[#F3EDE3]" : "text-[#0B2B26]")}
                        style={{
                            textShadow: isDarkMode ? "0 0 3px rgba(255, 255, 255, 0.4)" : "0 0 2px rgba(0, 0, 0, 0.2)",
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
                                className="text-xs font-semibold uppercase tracking-wide mb-1 overflow-hidden whitespace-nowrap"
                                style={{ color: isDarkMode ? '#F3EDE3/60' : '#0B2B26/60' }}
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
                                            "hover:opacity-80",
                                            isActive
                                                ? "border-l-2 font-semibold"
                                                : "",
                                            collapsed && "justify-center"
                                        )
                                    }
                                    style={({ isActive }) => ({
                                        color: isDarkMode ? '#F3EDE3' : '#0B2B26',
                                        borderLeftColor: isActive ? (isDarkMode ? '#F3EDE3' : '#0B2B26') : 'transparent',
                                        backgroundColor: isActive ? 
                                            (isDarkMode ? 'rgba(243, 237, 227, 0.1)' : 'rgba(11, 43, 38, 0.1)') : 'transparent'
                                    })}
                                    onMouseEnter={() => setActiveGroup(group.title)}
                                    onMouseLeave={() => setActiveGroup(null)}
                                >
                                    <link.icon
                                        size={22}
                                        className="flex-shrink-0"
                                        style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}
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
                                            isDarkMode ? "bg-[#0B2B26] text-[#F3EDE3] border border-[#1C3F3A]" : "bg-[#E0EAE8] text-[#0B2B26] border border-[#0B2B26]"
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
            <div className={cn(
                "mt-auto border-t p-3 transition-colors relative flex-shrink-0", 
                isDarkMode ? "border-[#1C3F3A]" : "border-[#0B2B26]"
            )}>
                {collapsed ? (
                    <div className="relative flex justify-center" ref={profileRef}>
                        <button
                            className={cn(
                                "flex size-10 items-center justify-center rounded-full border transition-all hover:opacity-80",
                                isDarkMode 
                                    ? "border-[#F3EDE3] bg-[#1C3F3A] text-[#F3EDE3]" 
                                    : "border-[#0B2B26] bg-[#F3EDE3] text-[#0B2B26]"
                            )}
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
                                        isDarkMode ? "border-[#1C3F3A] bg-[#0B2B26]" : "border-[#0B2B26] bg-[#E0EAE8]",
                                    )}
                                >
                                    <div className={cn(
                                        "border-b px-3 py-2",
                                        isDarkMode ? "border-[#1C3F3A]" : "border-[#0B2B26]"
                                    )}>
                                        <p className="text-sm font-medium truncate"
                                           style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
                                            {user?.username || "Username"}
                                        </p>
                                        <p className="text-xs truncate"
                                           style={{ color: isDarkMode ? '#F3EDE3/60' : '#0B2B26/60' }}>
                                            {role || "User Role"}
                                        </p>
                                    </div>
                                    <button
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-80"
                                        style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}
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
                            className={cn(
                                "flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:opacity-80",
                                isDarkMode ? "hover:bg-[#1C3F3A]" : "hover:bg-[#F3EDE3]"
                            )}
                            onClick={() => setShowProfileMenu((prev) => !prev)}
                        >
                            <div className={cn(
                                "flex size-10 items-center justify-center rounded-full border",
                                isDarkMode 
                                    ? "border-[#F3EDE3] bg-[#1C3F3A] text-[#F3EDE3]" 
                                    : "border-[#0B2B26] bg-[#F3EDE3] text-[#0B2B26]"
                            )}>
                                <span className="text-sm font-medium">{getInitials(user?.username)}</span>
                            </div>
                            <div className="flex-1 overflow-hidden text-left">
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="truncate text-sm font-medium"
                                    style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}
                                >
                                    {user?.username || "Username"}
                                </motion.p>
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2, delay: 0.1 }}
                                    className="truncate text-xs"
                                    style={{ color: isDarkMode ? '#F3EDE3/60' : '#0B2B26/60' }}
                                >
                                    {role || "User Role"}
                                </motion.p>
                            </div>
                            <ChevronDown
                                size={16}
                                style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}
                                className={`transition-transform ${showProfileMenu ? "rotate-180" : ""}`}
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
                                        isDarkMode ? "border-[#1C3F3A] bg-[#0B2B26]" : "border-[#0B2B26] bg-[#E0EAE8]",
                                    )}
                                >
                                    <button
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-80"
                                        style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}
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