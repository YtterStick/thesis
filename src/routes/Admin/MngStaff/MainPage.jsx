import { useState, useEffect, useCallback } from "react";
import StaffTable from "./StaffTable";
import StaffForm from "./StaffForm";
import AuditTrail from "./AuditTrail";
import { Users, ShieldCheck, User } from "lucide-react";

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

  // ✅ No longer fetches by ID — just uses saved user directly
  const handleAddAccount = useCallback((savedUser) => {
    setAccountList((prev) => [...prev, { ...savedUser, status: "Active" }]);
  }, []);

  return (
    <div className="flex flex-col gap-y-4 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="title">Manage Accounts</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-x-2 w-full sm:w-auto">
          <button
            className="btn-ghost border px-4 py-2 text-sm"
            onClick={() => setShowAudit(true)}
          >
            View Audit Trail
          </button>
          <button
            className="btn-ghost border px-4 py-2 text-sm"
            onClick={() => setShowForm(true)}
          >
            + Add Account
          </button>
        </div>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="card flex-row items-center gap-x-4">
          <div className="rounded-lg bg-[#3DD9B6]/20 p-3 text-[#3DD9B6] dark:bg-[#007362]/30">
            <Users size={28} />
          </div>
          <div>
            <p className="card-title">Total Accounts</p>
            <p className="text-3xl font-bold">{accountList.length}</p>
          </div>
        </div>
        <div className="card flex-row items-center gap-x-4">
          <div className="rounded-lg bg-[#3DD9B6]/20 p-3 text-[#3DD9B6] dark:bg-[#007362]/30">
            <ShieldCheck size={28} />
          </div>
          <div>
            <p className="card-title">Total Admins</p>
            <p className="text-3xl font-bold">{totalAdmins}</p>
          </div>
        </div>
        <div className="card flex-row items-center gap-x-4">
          <div className="rounded-lg bg-[#3DD9B6]/20 p-3 text-[#3DD9B6] dark:bg-[#007362]/30">
            <User size={28} />
          </div>
          <div>
            <p className="card-title">Total Staff</p>
            <p className="text-3xl font-bold">{totalStaff}</p>
          </div>
        </div>
      </div>

      <StaffTable staff={accountList} onConfirmDisable={setConfirmTarget} />

      {showForm && (
        <StaffForm
          onAdd={handleAddAccount}
          onClose={() => setShowForm(false)}
        />
      )}

      {showAudit && <AuditTrail onClose={() => setShowAudit(false)} />}

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
    </div>
  );
};

export default MainPage;