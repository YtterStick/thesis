import {
  Home,
  ClipboardList,
  PackageCheck,
  Bell,
  AlertTriangle,
  Boxes,
  Receipt,
  Users,
  Timer,
  PlusCircle,
} from "lucide-react";

export const staffNavbarLinks = [
  {
    title: "Dashboard",
    Links: [
      { label: "Dashboard", icon: Home, path: "/staff/dashboard" },
    ],
  },
  {
    title: "Transactions",
    Links: [
      { label: "New Transaction", icon: PlusCircle, path: "/staff/transactions/new" },
      { label: "Transaction Records", icon: ClipboardList, path: "/staff/records" },
      { label: "Unpaid Transactions", icon: Receipt, path: "/staff/unpaid" },
    ],
  },
  {
    title: "Laundry Operations",
    Links: [
      { label: "Service Tracking", icon: Timer, path: "/staff/service-tracking" },
      { label: "Claiming Center", icon: PackageCheck, path: "/staff/claiming" },
      { label: "Expired Loads", icon: AlertTriangle, path: "/staff/expired-loads" },
      { label: "Missing Items", icon: Users, path: "/staff/missing-items" },
    ],
  },
  {
    title: "Customer Notifications",
    Links: [
      { label: "SMS Alerts", icon: Bell, path: "/staff/notifications" },
    ],
  },
  {
    title: "Inventory",
    Links: [
      { label: "Supply Monitoring", icon: Boxes, path: "/staff/inventory" },
    ],
  },
];