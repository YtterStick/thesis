import { ThemeProvider } from "@/contexts/theme-context";
import { AuthProvider } from "@/hooks/useAuth";
import {
  Navigate,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

// 📦 Admin Pages
import Layout from "@/routes/layout";
import DashboardPage from "@/routes/Admin/dashboard/page";
import SalesReportPage from "@/routes/Admin/SalesReport/MainPage";
import ManageTransactionPage from "@/routes/Admin/MngTransaction/MainPage";
import ManageStaffPage from "@/routes/Admin/MngStaff/MainPage";
import ManageInventoryPage from "@/routes/Admin/MngInventory/MainPage";
import LoginPage from "@/routes/Auth/LoginPage";
import ServiceOptionPage from "@/routes/Admin/SvcOption/MainPage";
import ReceiptSettingsPage from "@/routes/Admin/ReceiptSettings/MainPage";
import InvoiceSettingsPage from "@/routes/Admin/InvoiceSettings/MainPage"; // ✅ NEW
import ManageReceiptPage from "@/routes/Admin/MngReceipt/MainPage";
import NewTransactionPage from "@/routes/Staff/transaction/MainPage";

// 👕 Staff Pages
import StaffDashboardPage from "@/routes/Staff/dashboard/page";

// ✅ Toast Provider
import { Toaster } from "@/components/ui/toaster";

// 🛡️ Route Wrappers
const AdminRoute = ({ element }) => <Layout>{element}</Layout>;
const StaffRoute = ({ element }) => <Layout>{element}</Layout>; // Reuse layout for now

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
    { path: "/managereceipts", element: <AdminRoute element={<ManageReceiptPage />} /> },
    { path: "/serviceoption", element: <AdminRoute element={<ServiceOptionPage />} /> },
    { path: "/notificationsettings", element: <AdminRoute element={<h1 className="title">Notification Settings</h1>} /> },
    { path: "/paymentmethod", element: <AdminRoute element={<h1 className="title">Payment Method</h1>} /> },
    { path: "/receiptssettings", element: <AdminRoute element={<ReceiptSettingsPage />} /> },
    { path: "/invoicesettings", element: <AdminRoute element={<InvoiceSettingsPage />} /> }, // ✅ NEW
    { path: "/settings", element: <AdminRoute element={<h1 className="title">Settings</h1>} /> },

    // 👕 Staff Routes
    { path: "/staff/dashboard", element: <StaffRoute element={<StaffDashboardPage />} /> },
    { path: "/staff/transactions/new", element: <StaffRoute element={<NewTransactionPage />} /> },
    { path: "/staff/transactions/records", element: <StaffRoute element={<h1 className="title">Transaction records</h1>} /> },

    // ❌ Catch-all
    { path: "*", element: <NotFoundPage /> },
  ]);

  return (
    <ThemeProvider storageKey="theme">
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;