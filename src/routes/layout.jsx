import { Sidebar } from "@/layouts/sidebar";
import { Header } from "@/layouts/header";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { useTheme } from "@/hooks/use-theme";
import AuthLoader from "@/components/feedback/AuthLoader";

import { navbarLinks } from "@/constants/navbarLinks";
import { staffNavbarLinks } from "@/constants/staffNavbarLinks";

const Layout = ({ children }) => {
  const isDesktopDevice = useMediaQuery("(min-width: 768px)");
  const [collapsed, setCollapsed] = useState(!isDesktopDevice);
  const sidebarRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, isAuthenticated, role, user } = useAuth();
  const { theme } = useTheme();

  const isAuthRoute =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/unauthorized");

  const showProtectedLayout =
    !isAuthRoute && !loading && isAuthenticated && (role === "ADMIN" || role === "STAFF");

  const sidebarLinks = role === "ADMIN" ? navbarLinks : staffNavbarLinks;

  useEffect(() => {
    setCollapsed(!isDesktopDevice);
  }, [isDesktopDevice]);

  useClickOutside([sidebarRef], () => {
    if (!isDesktopDevice && !collapsed) {
      setCollapsed(true);
    }
  });

  // Handle search result click - navigate to the selected page
  const handleSearchResultClick = (result) => {
    navigate(result.path);
    // Close sidebar on mobile after navigation
    if (!isDesktopDevice) {
      setCollapsed(true);
    }
  };

  if (loading) {
    return <AuthLoader />;
  }

  if (!showProtectedLayout) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-50 transition-colors">
      {/* Mobile overlay */}
      <div
        className={cn(
          "pointer-events-none fixed inset-0 -z-10 bg-black opacity-0 transition-opacity",
          !collapsed && "max-md:pointer-events-auto max-md:z-50 max-md:opacity-30"
        )}
      />

      {/* Sidebar */}
      <Sidebar 
        ref={sidebarRef} 
        collapsed={collapsed} 
        links={sidebarLinks}
        user={user}
        role={role}
      />

      {/* Main layout wrapper */}
      <div
        className={cn(
          "transition-[margin] duration-300",
          collapsed ? "md:ml-[70px]" : "md:ml-[240px]"
        )}
      >
        {/* Header with search functionality */}
        <Header 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          sidebarLinks={sidebarLinks}
          onSearchResultClick={handleSearchResultClick}
        />

        {/* Page content */}
        <div className="h-[calc(100vh-60px)] overflow-y-auto overflow-x-hidden p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 bg-slate-100 dark:bg-slate-950">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;