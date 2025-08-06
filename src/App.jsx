import { ThemeProvider } from "@/contexts/theme-context";
import { AuthProvider } from "@/hooks/useAuth";
import {
  Navigate,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

// 📦 Pages
import Layout from "@/routes/layout";
import DashboardPage from "@/routes/Admin/dashboard/page";
import SalesReportPage from "@/routes/Admin/SalesReport/MainPage";
import ManageTransactionPage from "@/routes/Admin/MngTransaction/MainPage";
import ManageStaffPage from "@/routes/Admin/MngStaff/MainPage";
import ManageInventoryPage from "@/routes/Admin/MngInventory/MainPage";
import LoginPage from "@/routes/Auth/LoginPage";
import ServiceOptionPage from "@/routes/Admin/SvcOption/MainPage"; // ✅ NEW import

// ✅ Toast Provider
import { Toaster } from "@/components/ui/toaster";

// 🛡️ Shared Admin Wrapper
const AdminRoute = ({ element }) => <Layout>{element}</Layout>;

// 🚨 Fallback Page
const NotFoundPage = () => (
  <div className="text-center text-red-500 mt-24 text-xl font-semibold">
    🚧 404 - Page Not Found
  </div>
);

function App() {
  const router = createBrowserRouter([
    { path: "/", element: <Navigate to="/login" replace /> },
    { path: "/login", element: <LoginPage /> },

    // 🔒 Admin Routes
    { path: "/dashboard", element: <AdminRoute element={<DashboardPage />} /> },
    { path: "/salesreports", element: <AdminRoute element={<SalesReportPage />} /> },
    { path: "/managetransaction", element: <AdminRoute element={<ManageTransactionPage />} /> },
    { path: "/managestaff", element: <AdminRoute element={<ManageStaffPage />} /> },
    { path: "/manageinventory", element: <AdminRoute element={<ManageInventoryPage />} /> },
    { path: "/managereceipts", element: <AdminRoute element={<h1 className="title">Manage Receipts</h1>} /> }, // 🔧 Optional placeholder
    { path: "/serviceoption", element: <AdminRoute element={<ServiceOptionPage />} /> }, // ✅ NEW route
    { path: "/pricingmanagement", element: <AdminRoute element={<h1 className="title">Pricing Management</h1>} /> }, // 🔧 Optional placeholder
    { path: "/settings", element: <AdminRoute element={<h1 className="title">Settings</h1>} /> }, // 🔧 Optional placeholder

    // ❌ Catch-all
    { path: "*", element: <NotFoundPage /> },
  ]);

  return (
    <ThemeProvider storageKey="theme">
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster /> {/* ✅ Enables toast notifications */}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;