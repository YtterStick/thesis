import { ThemeProvider } from "@/contexts/theme-context";
import { AuthProvider } from "@/contexts/auth-context";
import {
  Navigate,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

//Admin Page
import Layout from "@/routes/layout";
import DashboardPage from "@/routes/Admin/dashboard/page";
import SalesReportPage from "@/routes/Admin/SalesReport/MainPage";
import ManageTransactionPage from "@/routes/Admin/MngTransaction/MainPage";
import ManageStaffPage from "@/routes/Admin/MngStaff/MainPage";
import ManageInventoryPage from "@/routes/Admin/MngInventory/MainPage";
import LoginPage from "@/routes/Auth/LoginPage";
import ServiceOptionPage from "@/routes/Admin/SvcOption/MainPage";
import ManageReceiptPage from "@/routes/Admin/MngReceipt/MainPage";
import MachineMainPage from "@/routes/Admin/Machine/MainPage";
import TermsSettingsPage from "@/routes/Admin/TermsSettings/MainPage";
import DocumentSettingsPage from "@/routes/Admin/Format/MainPage";
import PaymentMethodsPage from "./routes/Admin/Payment/MainPage";
import AuditTrailPage from "@/routes/Admin/AuditTrail/MainPage";

//Staff Page
import StaffDashboardPage from "@/routes/Staff/dashboard/page";
import NewTransactionPage from "@/routes/Staff/transaction/MainPage";
import StaffRecordsPage from "@/routes/Staff/records/MainPage";
import StaffInventoryPage from "@/routes/Staff/inventory/MainPage";
import StaffServiceTracking from "@/routes/Staff/tracking/MainPage";
import StaffClaimingLaundry from "@/routes/Staff/claiming/MainPage";
import MissingItemsPage from "./routes/Staff/missing/MainPage";

import LandingPage from "@/routes/User/landing-page/LandingPage";

import { Toaster } from "@/components/ui/toaster";

import AuthGuard from "@/utils/AuthGuard";

const AdminRoute = ({ element }) => (
  <AuthGuard requiredRole="ADMIN">
    <Layout>{element}</Layout>
  </AuthGuard>
);

const StaffRoute = ({ element }) => (
  <AuthGuard requiredRole="STAFF">
    <Layout>{element}</Layout>
  </AuthGuard>
);

const NotFoundPage = () => (
  <div className="text-center text-red-500 mt-24 text-xl font-semibold">
    🚧 404 - Page Not Found
  </div>
);

const UnauthorizedPage = () => (
  <div className="text-center text-yellow-500 mt-24 text-xl font-semibold">
    🚫 Unauthorized Access
  </div>
);

function App() {
  const router = createBrowserRouter([
    { path: "/", element: <Navigate to="/home" replace /> },
    { path: "/home", element: <LandingPage /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/unauthorized", element: <UnauthorizedPage /> },

    //Admin Routes
    { path: "/dashboard", element: <AdminRoute element={<DashboardPage />} /> },
    { path: "/salesreports", element: <AdminRoute element={<SalesReportPage />} /> },
    { path: "/managetransaction", element: <AdminRoute element={<ManageTransactionPage />} /> },
    { path: "/managestaff", element: <AdminRoute element={<ManageStaffPage />} /> },
    { path: "/manageinventory", element: <AdminRoute element={<ManageInventoryPage />} /> },
    { path: "/managereceipts", element: <AdminRoute element={<ManageReceiptPage />} /> },
    { path: "/serviceoption", element: <AdminRoute element={<ServiceOptionPage />} /> },
    { path: "/paymentmethod", element: <AdminRoute element={<PaymentMethodsPage/>} /> },
    { path: "/documentsettings", element: <AdminRoute element={<DocumentSettingsPage />} /> },
    { path: "/machines", element: <AdminRoute element={<MachineMainPage />} /> },
    { path: "/termssettings", element: <AdminRoute element={<TermsSettingsPage />} /> },
    { path: "/audittrail", element: <AdminRoute element={<AuditTrailPage />} /> },

    //Staff Routes
    { path: "/staff/dashboard", element: <StaffRoute element={<StaffDashboardPage />} /> },
    { path: "/staff/transactions/new", element: <StaffRoute element={<NewTransactionPage />} /> },
    { path: "/staff/inventory", element: <StaffRoute element={<StaffInventoryPage/> } /> },
    { path: "/staff/records", element: <StaffRoute element={<StaffRecordsPage />} /> },
    { path: "/staff/tracking", element: <StaffRoute element={<StaffServiceTracking />} /> },
    { path: "/staff/claiming", element: <StaffRoute element={<StaffClaimingLaundry/>} /> },
    { path: "/staff/missing-items", element: <StaffRoute element={<MissingItemsPage/>} /> },

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