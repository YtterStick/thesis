import { useState, useEffect } from "react";
import TransactionTableAdmin from "./TransactionTable";
import EditTransactionModal from "./components/EditTransactionModal";
import {
  PhilippinePeso,
  Package,
  PackageX,
  Clock8,
} from "lucide-react";

const MainPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Fetch transactions (Admin side)
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("/api/admin/transactions"); // ⬅️ adjust endpoint to your backend
        if (!res.ok) throw new Error("Failed to fetch transactions");
        const data = await res.json();
        setTransactions(data);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // 🧮 Metrics
  const totalIncome = transactions.reduce((acc, t) => acc + (t.price || 0), 0);
  const totalLoads = transactions.reduce((acc, t) => acc + (t.loads || 0), 0);
  const unclaimed = transactions.filter((t) => t.pickupStatus === "Unclaimed").length;
  const expired = transactions.filter((t) => t.pickupStatus === "Expired").length;

  const handleSave = (updated) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    setEditTarget(null);
  };

  return (
    <main className="relative p-6 space-y-6">
      {/* 🧢 Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Manage Transactions (Admin)
        </h1>
      </div>

      {/* 🎨 Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[
          {
            label: "Total Income",
            value: `₱${totalIncome.toFixed(2)}`,
            icon: <PhilippinePeso size={26} />,
            growth: "+12% compared to yesterday",
            color: "#3DD9B6",
            growthColor: "text-emerald-700 dark:text-[#28b99a]",
          },
          {
            label: "Total Loads",
            value: totalLoads,
            icon: <Package size={26} />,
            growth: "+8% compared to yesterday",
            color: "#60A5FA",
            growthColor: "text-blue-600 dark:text-blue-400",
          },
          {
            label: "Unclaimed Loads",
            value: unclaimed,
            icon: <PackageX size={26} />,
            growth: "-3% compared to yesterday",
            color: "#F87171",
            growthColor: "text-red-600 dark:text-red-400",
          },
          {
            label: "Expired Loads",
            value: expired,
            icon: <Clock8 size={26} />,
            growth: "+1% compared to yesterday",
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
              <p className={`text-xs font-medium mt-1 ${growthColor}`}>
                {growth}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 📋 Transaction Table */}
      <div className="card">
        <div className="card-header justify-between">
          <p className="card-title">Transaction List</p>
        </div>
        {loading ? (
          <p className="p-4 text-center text-slate-500 dark:text-slate-400">
            Loading transactions...
          </p>
        ) : (
          <TransactionTableAdmin items={transactions} onEdit={setEditTarget} />
        )}
      </div>

      {/* ✏️ Edit Modal */}
      <EditTransactionModal
        key={editTarget?.id || "empty"}
        transaction={editTarget}
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
      />
    </main>
  );
};

export default MainPage;
