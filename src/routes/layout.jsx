import { Sidebar } from "@/layouts/sidebar";
import { Header } from "@/layouts/header";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { useTheme } from "@/hooks/use-theme";

const Layout = ({ children }) => {
  const isDesktopDevice = useMediaQuery("(min-width: 768px)");
  const [collapsed, setCollapsed] = useState(!isDesktopDevice);
  const sidebarRef = useRef(null);
  const location = useLocation();
  const { loading, isAuthenticated, role } = useAuth();
  const { theme } = useTheme();

  const isAuthRoute =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/unauthorized");

  const showProtectedLayout =
    !isAuthRoute && !loading && isAuthenticated && role === "ADMIN";

  // 🛠 Update collapsed only on device resize — NOT on route change
  useEffect(() => {
    setCollapsed(!isDesktopDevice);
  }, [isDesktopDevice]); // ✅ removed location.pathname

  useClickOutside([sidebarRef], () => {
    if (!isDesktopDevice && !collapsed) {
      setCollapsed(true);
    }
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Authenticating...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors">
      {/* Mobile overlay */}
      <div
        className={cn(
          "pointer-events-none fixed inset-0 -z-10 bg-black opacity-0 transition-opacity",
          !collapsed &&
            "max-md:pointer-events-auto max-md:z-50 max-md:opacity-30"
        )}
      />

      {/* Sidebar */}
      {showProtectedLayout && (
        <Sidebar ref={sidebarRef} collapsed={collapsed} />
      )}

      {/* Main layout wrapper */}
      <div
        className={cn(
          "transition-[margin] duration-300",
          showProtectedLayout
            ? collapsed
              ? "md:ml-[70px]"
              : "md:ml-[240px]"
            : ""
        )}
      >
        {/* Header */}
        {showProtectedLayout && (
          <Header collapsed={collapsed} setCollapsed={setCollapsed} />
        )}

        {/* Page content */}
        <div className="h-[calc(100vh-60px)] overflow-y-auto overflow-x-hidden p-6 bg-slate-100 dark:bg-slate-950 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;