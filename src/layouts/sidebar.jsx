import { forwardRef } from "react";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";
import { navbarLinks } from "@/constants/navbarLinks";
import PropTypes from "prop-types";
import { cn } from "@/utils/cn";
import { NavLink } from "react-router-dom";

export const Sidebar = forwardRef(({ collapsed }, ref) => {
  return (
    <aside
      ref={ref}
      className={cn(
        "fixed z-[100] flex h-full flex-col overflow-x-hidden border-r bg-white dark:border-slate-700 dark:bg-slate-900 transition-all",
        collapsed ? "md:w-[70px] md:items-center max-md:-left-full" : "md:w-[240px] max-md:left-0"
      )}
    >
      {/* Logo and title */}
      <div className="flex items-center gap-x-3 p-3">
        <img src={logoLight} alt="Logo" className="h-6 dark:hidden" />
        <img src={logoDark} alt="Logo (dark)" className="h-6 hidden dark:block" />
        {!collapsed && (
          <p
            className="text-lg transition-colors"
            style={{
              fontFamily: "Starjedi",
              color: "var(--tw-text-opacity)",
              textShadow: "0 0 2px rgba(255, 255, 255, 0.6)",
              letterSpacing: "1px",
            }}
          >
            Starwash
          </p>
        )}
      </div>

      {/* Navigation links */}
      <div className="flex w-full flex-col gap-y-6 overflow-y-auto overflow-x-hidden p-3 scrollbar-thin">
        {navbarLinks.map((group) => (
          <nav
            key={group.title}
            className={cn("flex flex-col gap-y-2", collapsed && "items-center")}
          >
            {!collapsed && (
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {group.title}
              </p>
            )}
            <div className="flex flex-col gap-y-1 w-full">
              {group.Links.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-x-3 rounded px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white",
                      isActive
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                        : "text-slate-700 dark:text-slate-200",
                      collapsed && "justify-center"
                    )
                  }
                >
                  <link.icon size={22} className="flex-shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </NavLink>
              ))}
            </div>
          </nav>
        ))}
      </div>
    </aside>
  );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
  collapsed: PropTypes.bool,
};