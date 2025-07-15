import {
  Home,
  BarChart3,
  HandCoins,
  UserCog,
  Boxes,
  Receipt,
  Sliders,
  Tags,
  Bell,
  CreditCard,
  Settings,
} from "lucide-react";

export const navbarLinks = [
  {
    title: "Dashboard",
    Links: [
      { label: "Dashboard", icon: Home, path: "/dashboard" },
      { label: "Sales & Reports", icon: BarChart3, path: "/salesreports" },
    ],
  },
  {
    title: "Management",
    Links: [
      { label: "Manage Transaction", icon: HandCoins, path: "/managetransaction" },
      { label: "Manage Staff", icon: UserCog, path: "/managestaff" },
      { label: "Manage Inventory", icon: Boxes, path: "/manageinventory" },
      { label: "Manage Receipts", icon: Receipt, path: "/managereceipts" }, // optional
    ],
  },
  {
    title: "System Configuration",
    Links: [
      { label: "Service Option", icon: Sliders, path: "/serviceoption" },         // optional
      { label: "Pricing Management", icon: Tags, path: "/pricingmanagement" },    // optional
      { label: "Notification Settings", icon: Bell, path: "/notificationsettings" }, // optional
      { label: "Payment Method", icon: CreditCard, path: "/paymentmethod" },      // optional
    ],
  },
  {
    title: "Settings",
    Links: [
      { label: "Settings", icon: Settings, path: "/settings" }, // optional
    ],
  },
];