import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Printer, ReceiptText } from "lucide-react";
import ReceiptPreviewModal from "./ReceiptPreviewModal";

const dummyReceipts = [
  {
    id: "R-001",
    customer: "Juan Tamad",
    date: "2025-08-07",
    total: 230.0,
    status: "Completed",
  },
  {
    id: "R-002",
    customer: "Sheyi Kulet",
    date: "2025-08-06",
    total: 180.0,
    status: "Pending",
  },
];

const statusBadge = (status) => {
  switch (status) {
    case "Completed":
      return {
        text: "Completed",
        class: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
      };
    case "Pending":
      return {
        text: "Pending",
        class: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
      };
    case "Cancelled":
      return {
        text: "Cancelled",
        class: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
      };
    default:
      return {
        text: status,
        class: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
      };
  }
};

const MainPage = () => {
  const [search, setSearch] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const filteredReceipts = dummyReceipts.filter((r) =>
    r.customer.toLowerCase().includes(search.toLowerCase())
  );

  const handlePreview = (receipt) => {
    setSelectedReceipt(receipt);
    setPreviewOpen(true);
  };

  return (
    <main className="relative p-6">
      {/* 🧾 Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Manage Receipts
          </h1>
        </div>
      </div>

      {/* 🔍 Search */}
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search by customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 📄 Receipt Table */}
      <div className="w-full overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="p-2">Receipt #</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Date</th>
              <th className="p-2">Total</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.map((r) => {
              const badge = statusBadge(r.status);
              return (
                <tr
                  key={r.id}
                  className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <td className="p-2 text-slate-800 dark:text-slate-100 font-semibold">{r.id}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300">{r.customer}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300">{r.date}</td>
                  <td className="p-2 text-blue-600 dark:text-blue-300 font-bold">
                    ₱{r.total.toFixed(2)}
                  </td>
                  <td className="p-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.class}`}
                    >
                      {badge.text}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex justify-start gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(r)}
                        className="hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Eye size={16} className="text-slate-600 dark:text-slate-300" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Printer size={16} className="text-blue-600 dark:text-blue-300" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 🔍 Preview Modal */}
      <ReceiptPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        receipt={selectedReceipt}
      />
    </main>
  );
};

export default MainPage;