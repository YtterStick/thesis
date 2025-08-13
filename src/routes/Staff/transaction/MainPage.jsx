import { useState } from "react";
import TransactionForm from "./TransactionForm";
import ReceiptCard from "@/components/ReceiptCard";
import InvoiceCard from "@/components/InvoiceCard";
import { format } from "date-fns"; // 📦 Make sure this is installed

const MainPage = () => {
  const [transaction, setTransaction] = useState(null);

  const fetchSettings = async (isPaid) => {
    const token = localStorage.getItem("token");
    const endpoint = isPaid
      ? "http://localhost:8080/api/receipt-settings"
      : "http://localhost:8080/api/invoice-settings";

    const res = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch settings");
    return await res.json();
  };

  const handleSubmit = async (formData) => {
    try {
      const isPaid = formData.paymentStatus === "Paid";
      const settings = await fetchSettings(isPaid);

      setTransaction({
        ...formData,
        settings,
        loads: formData.loads,
        plasticCount: formData.plasticCount,
        detergent: formData.detergent,
        fabricSoftener: formData.fabricSoftener,
      });
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  return (
    <main className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <TransactionForm onSubmit={handleSubmit} />

        {transaction?.paymentStatus === "Paid" && (
          <div className="space-y-4">
            <ReceiptCard
              transaction={transaction}
              settings={transaction.settings}
              isPaid={true}
            />
          </div>
        )}

        {transaction?.paymentStatus === "Unpaid" && (
          <div className="space-y-4">
            <InvoiceCard
              invoice={transaction}
              settings={transaction.settings}
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default MainPage;