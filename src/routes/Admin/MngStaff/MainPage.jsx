import { useState, useEffect, useCallback } from "react";
import StaffTable from "./StaffTable";
import StaffForm from "./StaffForm";
import AuditTrail from "./AuditTrail";
import { ShieldCheck, Users, User, Plus } from "lucide-react";

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
    window.location.href = "/login";
    return;
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
  const [accountList, setAccountList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [error, setError] = useState(null);

  const totalAdmins = accountList.filter((acc) => acc.role === "ADMIN").length;
  const totalStaff = accountList.filter((acc) => acc.role === "STAFF").length;

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await secureFetch("/accounts");
        const enriched = data.map((acc) => ({
          ...acc,
          status: "Active",
        }));
        setAccountList(enriched);
      } catch (error) {
        console.error("❌ Error fetching accounts:", error.message);
        setError("Failed to load accounts. Make sure you're logged in as ADMIN.");
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

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
          <ShieldCheck className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Manage Accounts
          </h1>
        </div>
        {accountList.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-slate-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Add Account</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 mb-6">
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
            <div className="card-body bg-slate-100 dark:bg-slate-950 rounded-md p-4 transition-colors">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                {value}
              </p>
              <p className={`text-xs font-medium ${growthColor}`}>{growth}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Staff Table or Skeleton Loader */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-[160px] rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <StaffTable staff={accountList} onConfirmDisable={setConfirmTarget} />
      )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
          <div className="card w-full max-w-sm mx-4 sm:mx-0">
            <p className="mb-2 font-medium text-slate-800 dark:text-white">
              {confirmTarget.status === "Active"
                ? `Disable account for ${confirmTarget.username}?`
                : `Enable account for ${confirmTarget.username}?`}
            </p>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              {confirmTarget.status === "Active"
                ? "This will prevent them from logging in."
                : "They will regain access to the system."}
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => setConfirmTarget(null)}
                className="btn-ghost text-sm text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toggleStatus(confirmTarget.id);
                  setConfirmTarget(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white                dark:focus-visible:ring-offset-slate-950 ${
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