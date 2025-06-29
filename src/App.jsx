import { ThemeProvider } from "@/contexts/theme-context";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "@/routes/layout";
import DashboardPage from "@/routes/dashboard/page";
function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element:<Layout />,
      children: [{
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "sales-reports",
        element: <h1 className="title">Sales & Reports</h1>,
      },
       {
        path: "manage-transaction",
        element: <h1 className="title">Manage Transaction</h1>,
      },
       {
        path: "manage-staff",
        element: <h1 className="title">Manage Staff</h1>,
      },
       {
        path: "manage-inventory",
        element: <h1 className="title">Manage Inventory</h1>,
      },
       {
        path: "manage-receipts",
        element: <h1 className="title">Manage Receipts</h1>,
      },
       {
        path: "service-option",
        element: <h1 className="title">Service Option</h1>,
      },
      {
        path: "pricing-management",
        element: <h1 className="title">Pricing Management</h1>,
      },
       {
        path: "notification-settings",
        element: <h1 className="title">Notification Settings</h1>,
      },
       {
        path: "payment-method",
        element: <h1 className="title">Payment Method</h1>,
      },
      {
        path: "settings",
        element: <h1 className="title">Settings</h1>,
      },
    ],
    },
  ]);
  return (
    <ThemeProvider storageKey="theme">
      <RouterProvider router= {router}/>
    </ThemeProvider>
  );
}

export default App;