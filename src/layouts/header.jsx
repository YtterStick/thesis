import { useTheme } from "../hooks/use-theme";
import { ChevronsLeft, Moon, Search, Sun, Bell } from "lucide-react";
import profileImg from "../assets/profile.jpg";
import PropTypes from "prop-types";

export const Header = ({ collapsed, setCollapsed }) => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="relative z-10 flex h-[60px] items-center justify-between bg-white px-4 shadow-md transition-colors dark:bg-slate-900">
      <div className="flex items-center gap-x-3">
        {/* Sidebar Toggle */}
        <button
          className="btn-ghost size-10"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <ChevronsLeft className={collapsed && "rotate-180"} />
        </button>

        {/* Search Input */}
        <div className="relative input">
          <Search size={20} className="text-slate-300" />
          <input
            type="text"
            name="search"
            id="search"
            placeholder="Search something"
            className="w-full bg-transparent text-slate-900 outline-0 placeholder:text-slate-300 dark:text-slate-50"
          />
          {/* Shortcut Hint */}
          <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            /
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-x-3">
        {/* Theme Toggle */}
        {/* Theme Toggle Button */}
<button
  className="btn-ghost size-10 relative"
  aria-label="Toggle theme"
  title="Toggle theme"
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
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
        <button className="btn-ghost size-10" aria-label="Notifications">
          <Bell size={20} />
        </button>

        {/* Profile Avatar */}
        <button
          className="size-10 overflow-hidden rounded-full"
          title="View profile"
          aria-label="View profile"
        >
          <img src={profileImg} alt="Profile" className="size-full object-cover" />
        </button>
      </div>
    </header>
  );
};

Header.propTypes = {
  collapsed: PropTypes.bool,
  setCollapsed: PropTypes.func,
};