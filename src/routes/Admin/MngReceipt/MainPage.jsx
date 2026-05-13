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
      <div className="overflow-x-auto rounded-xl border shadow-sm"
           style={{ borderColor: "var(--admin-card-border)" }}>
        <table className="admin-table">
          <thead className="admin-table-thead">
            <tr>
              <th className="admin-table-th">Receipt #</th>
              <th className="admin-table-th">Customer</th>
              <th className="admin-table-th">Date</th>
              <th className="admin-table-th">Total</th>
              <th className="admin-table-th">Status</th>
              <th className="admin-table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.map((r) => {
              const badge = statusBadge(r.status);
              return (
                <tr
                  key={r.id}
                  className="admin-table-tr"
                >
                  <td className="admin-table-td font-semibold">{r.id}</td>
                  <td className="admin-table-td">{r.customer}</td>
                  <td className="admin-table-td opacity-70">{r.date}</td>
                  <td className="admin-table-td font-bold" style={{ color: "var(--admin-accent)" }}>
                    ₱{r.total.toFixed(2)}
                  </td>
                  <td className="admin-table-td">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.class}`}
                    >
                      {badge.text}
                    </span>
                  </td>
                  <td className="admin-table-td">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(r)}
                        className="hover:bg-admin-table-hover"
                      >
                        <Eye size={16} style={{ color: "var(--admin-text-secondary)" }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-admin-table-hover"
                      >
                        <Printer size={16} style={{ color: "var(--admin-accent)" }} />
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