import { Home,
  BarChart3,
  HandCoins,
  UserCog,
  Boxes,
  Receipt,
  Settings,
  Sliders,
  Tags,
  Bell,
  CreditCard,
 } from "lucide-react";
export const navbarLinks = [
    {
        title: "Dashboard",
        Links: [
            {
                label: "Dashboard",
                icon: Home,
                path: "/",
            },
            {
                label: "Sales & Reports",
                icon: BarChart3,
                path: "/sales-reports",
            },
        ],
    },
    {
        title: "Management",
        Links: [
            {
                label: "Manage Transaction",
                icon: HandCoins,
                path: "/manage-transaction",
            },
            {
                label: "Manage Staff",
                icon: UserCog,
                path: "/manage-staff",
            },
            {
                label: "Manage Inventory",
                icon: Boxes,
                path: "/manage-inventory",
            },
            {
                label: "Manage Receipts",
                icon: Receipt,
                path: "/manage-receipts",
            },
        ],
    },
    {
        title: "System Configuration",
        Links: [
            {
                label: "Service Option",
                icon: Sliders,
                path: "/service-option",
            },
            {
                label: "Pricing Management",
                icon: Tags,
                path: "/pricing-management",
            },
            {
                label: "Notification Settings",
                icon: Bell,
                path: "/notification-settings",
            },
            {
                label: "Payment Method",
                icon: CreditCard,
                path: "/payment-method",
            },
        ],
    },
    {
        title: "Settings",
        Links: [
            {
                label: "Settings",
                icon: Settings,
                path: "/settings",
            },
        ],
    },
];

export const overviewData = [
    {
        name: "Jan",
        total: 3500,
    },
    {
        name: "Feb",
        total: 2300,
    },
    {
        name: "Mar",
        total: 2800,
    },
    {
        name: "Apr",
        total: 5000,
    },
    {
        name: "May",
        total: 3600,
    },
    {
        name: "Jun",
        total: 4000,
    },
    {
        name: "Jul",
        total: 6500,
    },
    {
        name: "Aug",
        total: 5000,
    },
    {
        name: "Sep",
        total: 5500,
    },
    {
        name: "Oct",
        total: 6000,
    },
    {
        name: "Nov",
        total: 4500,
    },
    {
        name: "Dec",
        total: 8000,
    },
];
export const recentSalesData = [
    {
        id: 1,
        customer: "Andrei Dilag",
        service: "Wash Only",
        amount: 205.0,
        date: "2025-10-01",
    },
    {
        id: 2,
        customer: "Sheena Aleeza",
        service: "Wash & Dry",
        amount: 175.0,
        date: "2025-10-02",
    },
    {
        id: 3,
        customer: "Sheyi Sami",
        service: "Wash Only",
        amount: 600.0,
        date: "2025-10-03",
    },
    {
        id: 4,
        customer: "Star Sami",
        service: "Dry Clean",
        amount: 40.0,
        date: "2025-10-04",
    },
    {
        id: 5,
        customer: "Sheyi Cat",
        service: "Wash & Dry",
        amount: 100.0,
        date: "2025-10-05",
    },
];
