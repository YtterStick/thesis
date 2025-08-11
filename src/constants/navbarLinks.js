import {
  Home,
  BarChart3,
  HandCoins,
  UserCog,
  Boxes,
  Receipt,
  Sliders,
  Bell,
  CreditCard,
  Settings,
  FileCog,
} from "lucide-react";

export const navbarLinks = [
  {
    title: "Dashboard",
    Links: [
      { label: "Overview", icon: Home, path: "/dashboard" },
      { label: "Sales & Reports", icon: BarChart3, path: "/salesreports" },
    ],
  },
  {
    title: "Operations",
    Links: [
      { label: "Transaction Records", icon: HandCoins, path: "/managetransaction" },
      { label: "Receipts", icon: Receipt, path: "/managereceipts" },
      { label: "Inventory", icon: Boxes, path: "/manageinventory" },
    ],
  },
  {
    title: "User Management",
    Links: [
      { label: "User Accounts", icon: UserCog, path: "/managestaff" },
    ],
  },
  {
    title: "System Settings",
    Links: [
      { label: "Services & Pricing", icon: Sliders, path: "/serviceoption" },
      { label: "SMS Alerts", icon: Bell, path: "/notificationsettings" },
      { label: "Receipt Format", icon: FileCog, path: "/receiptssettings" },
      { label: "Payment Methods", icon: CreditCard, path: "/paymentmethod" },
    ],
  },
  {
    title: "General",
    Links: [
      { label: "App Settings", icon: Settings, path: "/settings" },
    ],
  },
];