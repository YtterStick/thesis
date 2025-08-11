import { useState, useEffect, useCallback } from "react";
import StaffTable from "./StaffTable";
import StaffForm from "./StaffForm";
import AuditTrail from "./AuditTrail";
import { Users, ShieldCheck, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const MainPage = () => {
  const [accountList, setAccountList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  const totalAdmins = accountList.filter((acc) => acc.role === "ADMIN").length;
  const totalStaff = accountList.filter((acc) => acc.role === "STAFF").length;

  useEffect(() => {
    if (!token) {
      setError("No token found. Please log in.");
      return;
    }

    const fetchAccounts = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/accounts", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unauthorized or failed to fetch accounts.");
        }

        const data = await response.json();
        const enriched = data.map((acc) => ({
          ...acc,
          status: "Active",
        }));

        setAccountList(enriched);
      } catch (error) {
        console.error("❌ Error fetching accounts:", error.message);
        setError("Failed to load accounts. Make sure you're logged in as ADMIN.");
      }
    };

    fetchAccounts();
  }, [token]);

  const toggleStatus = (id) => {
    setAccountList((prev) =>
      prev.map((acc) =>
        acc.id === id
          ? { ...acc, status: acc.status === "Active" ? "Inactive" : "Active" }
          : acc
      )
    );
  };

  const handleAddAccount = useCallback((savedUser) => {
    setAccountList((prev) => [...prev, { ...savedUser, status: "Active" }]);
  }, []);

  return (
    <main className="relative p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-[#3DD9B6]" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Manage Accounts
          </h1>
        </div>
        {accountList.length > 0 && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#3DD9B6] text-white hover:bg-[#2fc3a4] dark:bg-[#007362] dark:hover:bg-[#00564e] shadow-md transition-transform hover:scale-105"
          >
            <Plus size={16} className="mr-2" />
            Add Account
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols- mb-6">
        {[
          {
            title: "Total Accounts",
            icon: <Users size={26} />,
            value: accountList.length,
            growth: "+0% change today",
            color: "#3DD9B6",
            growthColor: "text-emerald-700 dark:text-[#28b99a]",
          },
          {
            title: "Total Admins",
            icon: <ShieldCheck size={26} />,
            value: totalAdmins,
            growth: "+0% change today",
            color: "#60A5FA",
            growthColor: "text-blue-600 dark:text-blue-400",
          },
          {
            title: "Total Staff",
            icon: <User size={26} />,
            value: totalStaff,
            growth: "+0% change today",
            color: "#FB923C",
            growthColor: "text-orange-600 dark:text-orange-400",
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
            <div className="card-body bg-slate-100 transition-colors dark:bg-slate-950 rounded-md p-4">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 transition-colors">
                {value}
              </p>
              <p className={`text-xs font-medium transition-colors ${growthColor}`}>
                {growth}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Staff Table */}
      <StaffTable staff={accountList} onConfirmDisable={setConfirmTarget} />

      {/* Add Form */}
      {showForm && (
        <StaffForm
          onAdd={handleAddAccount}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Audit Trail */}
      {showAudit && <AuditTrail onClose={() => setShowAudit(false)} />}

      {/* Confirm Modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="card w-full max-w-sm mx-4 sm:mx-0">
            <p className="mb-2 font-medium">
              {confirmTarget.status === "Active"
                ? `Disable account for ${confirmTarget.username}?`
                : `Enable account for ${confirmTarget.username}?`}
            </p>
            <p className="mb-4 text-sm text-gray-500">
              {confirmTarget.status === "Active"
                ? "This will prevent them from logging in."
                : "They will regain access to the system."}
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => setConfirmTarget(null)}
                className="btn-ghost px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toggleStatus(confirmTarget.id);
                  setConfirmTarget(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  confirmTarget.status === "Active"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {confirmTarget.status === "Active" ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MainPage;