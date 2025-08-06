import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useTheme } from "@/hooks/use-theme";
import {
  ChevronsLeft,
  Moon,
  Search,
  Sun,
  Bell,
  X,
} from "lucide-react";
import profileImg from "@/assets/profile.jpg";
import PropTypes from "prop-types";
import { useLogout } from "@/hooks/useLogout";

export const Header = ({ collapsed, setCollapsed }) => {
  const { theme, setTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const profileRef = useRef(null);
  const logout = useLogout();

  useClickOutside([profileRef], () => setShowMenu(false));

  return (
    <header className="relative z-10 flex h-[60px] items-center justify-between bg-white px-4 shadow-md transition-colors dark:bg-slate-900">
      {/* Left: Sidebar toggle + Search */}
      <div className="flex items-center gap-x-3 flex-1 relative">
        {!searchActive && (
          <button
            className="btn-ghost size-10"
            onClick={() => setCollapsed(!collapsed)}
            title="Toggle sidebar"
          >
            <ChevronsLeft
              className={collapsed ? "rotate-180 transition-transform" : "transition-transform"}
            />
          </button>
        )}

        {/* Desktop Search */}
        <div className="input relative h-[38px] hidden sm:flex w-full max-w-[250px] items-center rounded-md border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800">
          <Search size={18} className="text-slate-300" />
          <input
            type="text"
            placeholder="Search something"
            className="w-full bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">/</span>
        </div>

        {/* Mobile Search Trigger */}
        <AnimatePresence>
          {!searchActive && (
            <motion.button
              onClick={() => setSearchActive(true)}
              className="btn-ghost size-10 sm:hidden flex items-center justify-center"
              title="Search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div layoutId="search-icon" className="flex items-center">
                <Search size={18} className="text-slate-500 dark:text-slate-400" />
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Right section (hidden in mobile search mode) */}
      {!searchActive && (
        <div className="relative flex items-center gap-x-3">
          {/* Theme toggle */}
          <button
            className="btn-ghost relative size-10"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            <Sun
              size={20}
              className="absolute inset-0 m-auto transition-opacity duration-300 dark:opacity-0"
            />
            <Moon
              size={20}
              className="absolute inset-0 m-auto opacity-0 transition-opacity duration-300 dark:opacity-100"
            />
          </button>

          {/* Notifications */}
          <button className="btn-ghost size-10" title="Notifications">
            <Bell size={20} />
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              className="size-10 overflow-hidden rounded-full"
              onClick={() => setShowMenu((prev) => !prev)}
              title="Profile options"
            >
              <img
                src={profileImg}
                alt="Profile"
                className="size-full object-cover"
              />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-40 rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
                >
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">
                    View Profile
                  </button>
                  <button 
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={logout}>
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Mobile Search Overlay */}
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
            <div className="input flex h-[38px] items-center rounded-md border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-800">
              <motion.div layoutId="search-icon" className="flex items-center">
                <Search size={18} className="text-slate-300" />
              </motion.div>
              <input
                type="text"
                placeholder="Search something"
                autoFocus
                className="w-full bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50"
              />
              <button
                onClick={() => setSearchActive(false)}
                className="ml-2 text-slate-500 hover:text-red-500"
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