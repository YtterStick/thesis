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
  FileCog,
  ScrollText,
  BookText,
  WashingMachine,
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
      { label: "Receipts & Invoice", icon: ScrollText, path: "/documentsettings" },
      { label: "Payment Methods", icon: CreditCard, path: "/paymentmethod" },
    ],
  },
  {
    title: "Legal & Machine",
    Links: [
      { label: "Terms & Conditions", icon: BookText, path: "/termssettings" },
      { label: "Manage Machines", icon: WashingMachine, path: "/machines" }
    ],
  },
];