import { useState } from "react";
import TransactionTable from "./TransactionTable";
import EditTransactionModal from "./components/EditTransactionModal";
import { initialTransactions } from "@/constants";
import { CreditCard, Clock, Loader2, Truck, Ban } from "lucide-react";

const MainPage = () => {
    const [transactions, setTransactions] = useState(initialTransactions);
    const [editTarget, setEditTarget] = useState(null);

    const totalIncome = transactions.filter((t) => t.paymentStatus === "Paid").reduce((acc, t) => acc + t.price, 0);

    const unpaid = transactions.filter((t) => t.paymentStatus === "Unpaid").length;
    const unclaimed = transactions.filter((t) => t.pickupStatus === "Unclaimed").length;
    const expired = transactions.filter((t) => t.pickupStatus === "Expired").length;
    const totalLoads = transactions.reduce((acc, t) => acc + t.loads, 0);

    const handleSave = (updated) => {
        setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setEditTarget(null);
    };

    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between">
                <h1 className="title">Manage Transactions</h1>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <SummaryCard
                    label="Total Income"
                    value={`₱${totalIncome.toFixed(2)}`}
                    icon={<CreditCard />}
                />
                <SummaryCard
                    label="Unpaid"
                    value={unpaid}
                    icon={<Clock />}
                />
                <SummaryCard
                    label="Total Loads"
                    value={totalLoads}
                    icon={<Loader2 />}
                />
                <SummaryCard
                    label="Unclaimed Loads"
                    value={unclaimed}
                    icon={<Truck />}
                />
                <SummaryCard
                    label="Expired Loads"
                    value={expired}
                    icon={<Ban />}
                />
            </div>

            <div className="card">
                <div className="card-header justify-between">
                    <p className="card-title">Transaction List</p>
                </div>
                <TransactionTable
                    items={transactions}
                    onEdit={setEditTarget}
                />
            </div>

            <EditTransactionModal
  key={editTarget?.id || "empty"}
  transaction={editTarget}
  isOpen={Boolean(editTarget)}
  onClose={() => setEditTarget(null)}
  onSave={handleSave}
/>

        </div>
    );
};

const SummaryCard = ({ label, value, icon }) => (
    <div className="card flex-row items-center gap-x-4">
        <div className="rounded-lg bg-[#3DD9B6]/20 p-3 text-[#3DD9B6] dark:bg-[#007362]/30">{icon}</div>
        <div>
            <p className="card-title">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
        </div>
    </div>
);

export default MainPage;
