import { useState } from "react";
import RecordTable from "./RecordTable.jsx";
import { PhilippinePeso, Package, Clock8, TimerOff, XCircle } from "lucide-react";

const today = new Date().toISOString().split("T")[0];

const initialRecords = [
  {
    id: 1,
    name: "Sheyi Cat",
    service: "Wash & Dry",
    loads: 2,
    detergent: "1",
    softener: "3",
    price: 100,
    paymentStatus: "Paid",
    date: today,
    pickupStatus: "Unclaimed",
    washed: false,
    expired: false,
  },
  {
    id: 2,
    name: "Star Sami",
    service: "Dry Clean",
    loads: 1,
    detergent: "Ariel",
    softener: "None",
    price: 40,
    paymentStatus: "Unpaid",
    date: today,
    pickupStatus: "Expired",
    washed: true,
    expired: true,
  },
  {
    id: 3,
    name: "Sheena",
    service: "Wash Only",
    loads: 3,
    detergent: "2",
    softener: "1",
    price: 90,
    paymentStatus: "Unpaid",
    date: today,
    pickupStatus: "Unclaimed",
    washed: false,
    expired: false,
  },
];

const MainPage = () => {
  const [records] = useState(initialRecords);

  const totalIncome = records
    .filter((r) => r.paymentStatus === "Paid")
    .reduce((acc, r) => acc + r.price, 0);

  const totalLoads = records.reduce((acc, r) => acc + r.loads, 0);
  const unwashed = records.filter((r) => !r.washed).length;
  const expired = records.filter((r) => r.expired).length;
  const unpaid = records.filter((r) => r.paymentStatus === "Unpaid").length;

  return (
    <main className="relative p-6 space-y-6">
      {/* 🧢 Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Staff Laundry Records
        </h1>
      </div>

      {/* 🎨 Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          {
            label: "Today's Income",
            value: `₱${totalIncome.toFixed(2)}`,
            icon: <PhilippinePeso size={26} />,
            growth: "+4% vs yesterday",
            color: "#3DD9B6",
            growthColor: "text-emerald-700 dark:text-[#28b99a]",
          },
          {
            label: "Today's Loads",
            value: totalLoads,
            icon: <Package size={26} />,
            growth: "+2% vs yesterday",
            color: "#60A5FA",
            growthColor: "text-blue-600 dark:text-blue-400",
          },
          {
            label: "Unwashed Loads",
            value: unwashed,
            icon: <Clock8 size={26} />,
            growth: "+1%",
            color: "#FB923C",
            growthColor: "text-orange-600 dark:text-orange-400",
          },
          {
            label: "Expired Loads",
            value: expired,
            icon: <TimerOff size={26} />,
            growth: "+0%",
            color: "#F87171",
            growthColor: "text-red-600 dark:text-red-400",
          },
          {
            label: "Unpaid",
            value: unpaid,
            icon: <XCircle size={26} />,
            growth: "+3%",
            color: "#A78BFA",
            growthColor: "text-violet-600 dark:text-violet-400",
          },
        ].map(({ label, value, icon, growth, color, growthColor }) => (
          <div key={label} className="card">
            <div className="card-header flex items-center gap-x-3">
              <div
                className="w-fit rounded-lg p-2"
                style={{
                  backgroundColor: `${color}33`,
                  color: color,
                }}
              >
                {icon}
              </div>
              <p className="card-title">{label}</p>
            </div>
            <div className="card-body rounded-md bg-slate-100 p-4 transition-colors dark:bg-slate-950">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                {value}
              </p>
              <p className={`text-xs font-medium mt-1 ${growthColor}`}>{growth}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 📋 Record Table */}
      <div className="card">
        <div className="card-header justify-between">
          <p className="card-title">Laundry Records</p>
        </div>
        <RecordTable items={records} />
      </div>
    </main>
  );
};

export default MainPage;