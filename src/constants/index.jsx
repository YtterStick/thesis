import {
  Home,
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

export const overviewData = [
  { name: "Jan", total: 3500 },
  { name: "Feb", total: 2300 },
  { name: "Mar", total: 2800 },
  { name: "Apr", total: 5000 },
  { name: "May", total: 3600 },
  { name: "Jun", total: 4000 },
  { name: "Jul", total: 6500 },
  { name: "Aug", total: 5000 },
  { name: "Sep", total: 5500 },
  { name: "Oct", total: 6000 },
  { name: "Nov", total: 4500 },
  { name: "Dec", total: 8000 },
];

export const recentSalesData = [
  { id: 1, customer: "Andrei Dilag", service: "Wash Only", amount: 205.0, date: "2025-10-01" },
  { id: 2, customer: "Sheena Aleeza", service: "Wash & Dry", amount: 175.0, date: "2025-10-02" },
  { id: 3, customer: "Sheyi Sami", service: "Wash Only", amount: 600.0, date: "2025-10-03" },
  { id: 4, customer: "Star Sami", service: "Dry Clean", amount: 40.0, date: "2025-10-04" },
  { id: 5, customer: "Sheyi Cat", service: "Wash & Dry", amount: 100.0, date: "2025-10-05" },
];

export const initialTransactions = [
  {
    id: 1,
    name: "Andrei Dilag",
    service: "Wash & Dry",
    loads: 3,
    detergent: 2,
    softener: 1,
    price: 220,
    paymentStatus: "Unpaid",
    laundryStatus: "Done",
    pickupStatus: "Unclaimed",
    createdAt: "2025-06-27",
  },
  {
    id: 2,
    name: "Sheena Aleeza",
    service: "Dry Only",
    loads: 2,
    detergent: 1,
    softener: 1,
    price: 480,
    paymentStatus: "Paid",
    laundryStatus: "Done",
    pickupStatus: "Claimed",
    createdAt: "2025-06-24",
  },
  {
    id: 3,
    name: "sheyi cat",
    service: "Wash Only",
    loads: 1,
    detergent: 1,
    softener: 1,
    price: 120,
    paymentStatus: "Paid",
    laundryStatus: "Washing",
    pickupStatus: "Unclaimed",
    createdAt: "2025-06-21",
  },
  {
    id: 4,
    name: "Sami cat",
    service: "Wash Only",
    loads: 2,
    detergent: 2,
    softener: 2,
    price: 120,
    paymentStatus: "Unpaid",
    laundryStatus: "Washing",
    pickupStatus: "Unclaimed",
    createdAt: "2025-06-21",
  },
  {
    id: 5,
    name: "Star cat",
    service: "Wash & Dry",
    loads: 3,
    detergent: 3,
    softener: 3,
    price: 120,
    paymentStatus: "Paid",
    laundryStatus: "Washing",
    pickupStatus: "Unclaimed",
    createdAt: "2025-06-21",
  },
  {
    id: 6,
    name: "sheyi cat",
    service: "Wash & Dry",
    loads: 1,
    detergent: 1,
    softener: 0,
    price: 220,
    paymentStatus: "Unpaid",
    laundryStatus: "Done",
    pickupStatus: "Claimed",
    createdAt: "2025-05-21",
  },
  {
    id: 7,
    name: "sheyi cat",
    service: "Wash Only",
    loads: 2,
    detergent: 2,
    softener: 2,
    price: 120,
    paymentStatus: "Paid",
    laundryStatus: "Done",
    pickupStatus: "Unclaimed",
    createdAt: "2025-06-21",
  },
  {
    id: 8,
    name: "sheyi cat",
    service: "Wash Only",
    loads: 1,
    detergent: 1,
    softener: 0,
    price: 120,
    paymentStatus: "Unpaid",
    laundryStatus: "Pending",
    pickupStatus: "Unclaimed",
    createdAt: "2025-07-21",
  },
  {
    id: 9,
    name: "sheyi cat",
    service: "Wash Only",
    loads: 1,
    detergent: 1,
    softener: 0,
    price: 120,
    paymentStatus: "Paid",
    laundryStatus: "Done",
    pickupStatus: "Expired",
    createdAt: "2025-07-01",
  },
];

export const statusColor = {
  Paid: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
  Done: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
  Claimed: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
  "Ready to Claim": "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300",
  Pending: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
  Unclaimed: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
  Washing: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  Unpaid: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
  Expired: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-white",
};

export const tableHeaders = [
  "Name",
  "Service",
  "Loads",
  "Detergent",
  "Softener",
  "Price",
  "Date",
  "Payment",
  "Laundry",
  "Pickup",
  "Actions",
];

export const statusFilters = {
  payment: ["Paid", "Unpaid"],
  laundry: ["Pending", "Washing", "Done"],
  pickup: ["Unclaimed", "Claimed", "Expired"],
};

export const laundryServices = ["Wash Only", "Wash & Dry", "Dry Only"];

// 🗓️ Today's Date
const today = new Date().toISOString().split("T")[0];

// 📊 Filtered Sales for Today
export const todaySalesData = recentSalesData.filter(
  (sale) => sale.date === today
);

// 📈 Simplified Overview for Today (fallback to last entry)
export const todayOverviewData = overviewData.slice(-1);