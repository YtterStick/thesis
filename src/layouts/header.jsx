import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useTheme } from "@/hooks/use-theme";
import { ChevronsLeft, Moon, Search, Sun, Bell, X } from "lucide-react";
import profileImg from "@/assets/profile.jpg";
import PropTypes from "prop-types";
import { useLogout } from "@/hooks/useLogout";

export const Header = ({ collapsed, setCollapsed, role }) => {
    const { theme, setTheme } = useTheme();
    const [showMenu, setShowMenu] = useState(false);
    const [searchActive, setSearchActive] = useState(false);
    const profileRef = useRef(null);
    const logout = useLogout();

    useClickOutside([profileRef], () => setShowMenu(false));

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
                    <button
                        className="group size-10 rounded-md transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
                        title="Notifications"
                    >
                        <Bell
                            size={20}
                            className={`transition-colors ${
                                theme === "dark" ? "text-white group-hover:text-cyan-400" : "text-slate-700 group-hover:text-cyan-600"
                            }`}
                        />
                    </button>

                    {/* 👤 Profile dropdown */}
                    <div
                        className="relative"
                        ref={profileRef}
                    >
                        <button
                            className="group size-10 overflow-hidden rounded-full border border-slate-300 transition-all hover:ring-2 hover:ring-cyan-500 dark:border-slate-600"
                            onClick={() => setShowMenu((prev) => !prev)}
                            title="Profile options"
                        >
                            <img
                                src={profileImg}
                                alt="Profile"
                                className="size-full object-cover transition group-hover:brightness-90"
                            />
                        </button>

                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className={`absolute right-0 mt-2 w-40 rounded-md border shadow-lg transition-colors ${
                                        theme === "dark" ? "border-slate-600 bg-slate-800 text-white" : "border-slate-200 bg-white text-slate-700"
                                    }`}
                                >
                                    <button className="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-cyan-100 dark:hover:bg-cyan-900">
                                        {role === "STAFF" ? "My Profile" : "View Profile"}
                                    </button>
                                    <button
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
                                        onClick={logout}
                                    >
                                        Logout
                                    </button>
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
    role: PropTypes.string,
};

export default Header;
