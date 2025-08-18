import { forwardRef } from "react";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";
import PropTypes from "prop-types";
import { cn } from "@/utils/cn";
import { NavLink } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";

export const Sidebar = forwardRef(({ collapsed, links }, ref) => {
  const { theme } = useTheme();

  return (
    <aside
      ref={ref}
      className={cn(
        "fixed z-[100] flex h-full flex-col overflow-x-hidden border-r transition-all",
        collapsed ? "md:w-[70px] md:items-center max-md:-left-full" : "md:w-[240px] max-md:left-0",
        theme === "dark"
          ? "bg-slate-900 border-slate-700 shadow-lg"
          : "bg-gradient-to-b from-white to-slate-100 border-slate-200 shadow-lg"
      )}
    >
      {/* 🪐 Logo and Title */}
      <div className="flex items-center gap-x-3 p-3">
        <img src={logoLight} alt="Logo" className="h-6 dark:hidden" />
        <img src={logoDark} alt="Logo (dark)" className="h-6 hidden dark:block" />
        {!collapsed && (
          <p
            className={cn(
              "text-lg font-starjedi tracking-wide",
              theme === "dark" ? "text-white glow-text" : "text-slate-800"
            )}
            style={{
              textShadow:
                theme === "dark"
                  ? "0 0 3px rgba(255, 255, 255, 0.4)"
                  : "0 0 2px rgba(0, 0, 0, 0.2)",
              letterSpacing: "1px",
            }}
          >
            STAR WASH
          </p>
        )}
      </div>

      {/* 🧭 Navigation Links */}
      <div className="flex w-full flex-col gap-y-6 overflow-y-auto overflow-x-hidden p-3 scrollbar-thin">
        {links.map((group) => (
          <nav key={group.title} className={cn("flex flex-col gap-y-2", collapsed && "items-center")}>
            {!collapsed && (
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
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
                      "flex items-center gap-x-3 rounded px-3 py-2 text-sm font-medium transition-all",
                      "hover:bg-[#0891B2]/10 hover:text-[#0891B2] dark:hover:bg-[#0891B2]/20 dark:hover:text-[#0891B2]",
                      "hover:scale-[1.02] hover:border-l-2 hover:border-[#0891B2]",
                      isActive
                        ? "bg-[#0891B2]/20 dark:bg-slate-700 text-[#0891B2] font-semibold border-l-2 border-[#0891B2]"
                        : "text-slate-800 dark:text-slate-200",
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
  links: PropTypes.array.isRequired,
};