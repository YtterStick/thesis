import { useTheme } from "@/hooks/use-theme";
import {
  PackageX,
  PhilippinePeso,
  Package,
  Clock8,
  Timer,
} from "lucide-react";

// 🗓️ Today's Date
const today = new Date().toISOString().split("T")[0];

// 🔄 Replace with actual transaction data
const initialTransactions = [
  {
    id: 1,
    name: "Sheyi Cat",
    service: "Wash & Dry",
    pickupStatus: "Unclaimed",
    createdAt: today,
    amount: 100,
  },
  {
    id: 2,
    name: "Star Sami",
    service: "Dry Clean",
    pickupStatus: "Unclaimed",
    createdAt: today,
    amount: 40,
  },
];

const todayTransactions = initialTransactions.filter((tx) => tx.createdAt === today);
const pendingPickup = todayTransactions.filter((tx) => tx.pickupStatus === "Pending").length;
const unclaimedTransactions = todayTransactions.filter((tx) => tx.pickupStatus === "Unclaimed");
const unclaimedCount = unclaimedTransactions.length;

// 🧺 Active Machine Sessions (replace with real data)
const activeMachineSessions = [
  { machineId: "Washer 1", endTime: "2025-08-08T15:30:00+08:00" },
  { machineId: "Dryer 2", endTime: "2025-08-08T15:45:00+08:00" },
];

const now = new Date();
const sessionsWithRemaining = activeMachineSessions.map((session) => {
  const end = new Date(session.endTime);
  const remaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 60000));
  return { ...session, remainingMinutes: remaining };
});

const StaffDashboardPage = () => {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col gap-y-4">
      <h1 className="title">Staff Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[
          {
            title: "Today's Income",
            icon: <PhilippinePeso size={26} />,
            value: "₱2,400.00",
            growth: "+5% vs yesterday",
            color: "#3DD9B6",
            growthColor: "text-emerald-700 dark:text-[#28b99a]",
          },
          {
            title: "Today's Loads",
            icon: <Package size={26} />,
            value: "20",
            growth: "+3% vs yesterday",
            color: "#60A5FA",
            growthColor: "text-blue-600 dark:text-blue-400",
          },
          {
            title: "Unwashed",
            icon: <Clock8 size={26} />,
            value: "20",
            growth: "-2%",
            color: "#FB923C",
            growthColor: "text-orange-600 dark:text-orange-400",
          },
          {
            title: "Unclaimed",
            icon: <PackageX size={26} />,
            value: "100",
            growth: "-1%",
            color: "#F87171",
            growthColor: "text-red-600 dark:text-red-400",
          },
        ].map(({ title, icon, value, growth, color, growthColor }) => (
          <div key={title} className="card">
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
              <p className="card-title">{title}</p>
            </div>
            <div className="card-body rounded-md bg-slate-100 p-4 dark:bg-slate-950">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
              <p className={`text-xs font-medium ${growthColor}`}>{growth}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Machine Status + Unclaimed Transactions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Currently Running Machines */}
        <div className="card col-span-1 md:col-span-2 lg:col-span-4">
          <div className="card-header">
            <p className="card-title">Currently Running Machines</p>
          </div>
          <div className="card-body h-[360px] overflow-auto px-4 py-2 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Washers */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Washers</p>
                {["Washer 1", "Washer 2", "Washer 3", "Washer 4", "Washer 5"].map((machineId) => {
                  const session = sessionsWithRemaining.find((s) => s.machineId === machineId);
                  return (
                    <div
                      key={machineId}
                      className="flex items-center justify-between border-b border-slate-200 py-2 last:border-none dark:border-slate-700"
                    >
                      <div className="flex items-center gap-x-2 leading-tight">
                        <Timer size={20} className="text-blue-500 dark:text-blue-400" />
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{machineId}</p>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {session ? `${session.remainingMinutes} min left` : "Idle"}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Dryers */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Dryers</p>
                {["Dryer 1", "Dryer 2", "Dryer 3", "Dryer 4", "Dryer 5"].map((machineId) => {
                  const session = sessionsWithRemaining.find((s) => s.machineId === machineId);
                  return (
                    <div
                      key={machineId}
                      className="flex items-center justify-between border-b border-slate-200 py-2 last:border-none dark:border-slate-700"
                    >
                      <div className="flex items-center gap-x-2 leading-tight">
                        <Timer size={20} className="text-blue-500 dark:text-blue-400" />
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{machineId}</p>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {session ? `${session.remainingMinutes} min left` : "Idle"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Unclaimed Transactions */}
        <div className="card col-span-1 md:col-span-2 lg:col-span-3">
          <div className="card-header">
            <p className="card-title">Unclaimed Transactions</p>
          </div>
          <div className="card-body h-[360px] overflow-auto px-4 py-2 flex flex-col">
            {unclaimedCount === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">None for today.</p>
            ) : (
              unclaimedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between border-b border-slate-200 py-2 last:border-none dark:border-slate-700"
                >
                  <div className="leading-tight">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{tx.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{tx.service}</p>
                  </div>
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">Unclaimed</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardPage;