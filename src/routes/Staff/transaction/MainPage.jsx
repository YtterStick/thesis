import { useRef, useState, useEffect } from "react";
import TransactionForm from "./TransactionForm";
import ReceiptCard from "@/components/ReceiptCard";
import InvoiceCard from "@/components/InvoiceCard";
import TotalPreviewCard from "@/components/TotalPreviewCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, XCircle } from "lucide-react";

const ALLOWED_SKEW_MS = 5000;

const isTokenExpired = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp * 1000;
    const now = Date.now();

    console.log("🔍 Token expiration check:");
    console.log("⏳ Exp:", new Date(exp).toLocaleString());
    console.log("🕒 Now:", new Date(now).toLocaleString());

    return exp + ALLOWED_SKEW_MS < now;
  } catch (err) {
    console.warn("❌ Failed to decode token:", err);
    return true;
  }
};

const secureFetch = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem("authToken");

  if (!token || isTokenExpired(token)) {
    console.warn("⛔ Token expired. Redirecting to login.");
    throw new Error("Token expired");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`http://localhost:8080/api${endpoint}`, options);

  if (!response.ok) {
    console.error(`❌ ${method} ${endpoint} failed:`, response.status);
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
};

const MainPage = () => {
  const formRef = useRef();
  const [transaction, setTransaction] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    window.onafterprint = () => {
      setShowActions(true);
    };
  }, []);

  const fetchSettings = async (isPaid) => {
    const endpoint = isPaid ? "/receipt-settings" : "/invoice-settings";
    try {
      const settings = await secureFetch(endpoint);
      return settings;
    } catch (error) {
      console.error("❌ Failed to fetch settings:", error);
      if (error.message === "Token expired") {
        window.location.href = "/login";
      }
      throw error;
    }
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

      setPreviewData(null);
      setShowActions(false);
    } catch (error) {
      console.error("❌ Transaction failed:", error);
    }
  };

  const handleStartNew = () => {
    setTransaction(null);
    setPreviewData(null);
    setShowActions(false);
    formRef.current?.resetForm();
  };

  const handleCancel = () => {
    setTransaction(null);
    setShowActions(false);
  };

  return (
    <main className="p-6 bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <TransactionForm
          ref={formRef}
          onSubmit={handleSubmit}
          onPreviewChange={setPreviewData}
        />

        {!transaction?.paymentStatus && previewData && (
          <TotalPreviewCard
            amount={previewData.totalAmount}
            amountGiven={previewData.amountGiven}
            change={previewData.change}
          />
        )}

        {transaction?.paymentStatus === "Paid" && (
          <div className="space-y-4">
            <ReceiptCard
              transaction={transaction}
              settings={transaction.settings}
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

      {/* ✅ Floating Action Card */}
      {showActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-sm space-y-4 rounded-lg border border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white">
            <div className="text-center text-base font-semibold">
              Transaction Complete
            </div>
            <Separator className="bg-slate-200 dark:bg-slate-700" />
            <div className="flex justify-center gap-3">
              <Button
                variant="ghost"
                onClick={handleStartNew}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
              >
                <RotateCcw className="h-4 w-4" />
                Start New
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MainPage;