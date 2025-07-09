import { useState } from "react";
import StaffTable from "./StaffTable";
import StaffForm from "./StaffForm";
import AuditTrail from "./AuditTrail";
import { Users, ShieldCheck } from "lucide-react";

const initialStaff = [
  {
    id: 1,
    name: "Andrei Dilag",
    contact: "+639150475513",
    role: "Admin",
    status: "Active",
  },
  {
    id: 2,
    name: "Sheena Aleeza",
    contact: "+639272532051",
    role: "Staff",
    status: "Inactive",
  },
];

const MainPage = () => {
  const [staffList, setStaffList] = useState(initialStaff);
  const [showForm, setShowForm] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const totalAdmins = staffList.filter((s) => s.role === "Admin").length;

  const toggleStatus = (id) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" }
          : s
      )
    );
  };

  return (
    <div className="flex flex-col gap-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="title">Manage Staff</h1>
        <div className="flex gap-x-2">
          <button
            className="btn-ghost border px-4 py-2 text-sm text-slate-900 dark:text-slate-50"
            onClick={() => setShowAudit(true)}
          >
            View Audit Trail
          </button>
          <button
            className="btn-ghost border px-4 py-2 text-sm text-slate-900 dark:text-slate-50"
            onClick={() => setShowForm(true)}
          >
            + Add Staff
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card flex-row items-center gap-x-4">
          <div className="rounded-lg bg-[#3DD9B6]/20 p-3 text-[#3DD9B6] dark:bg-[#007362]/30">
            <Users size={28} />
          </div>
          <div>
            <p className="card-title">Total Staff</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {staffList.length}
            </p>
          </div>
        </div>
        <div className="card flex-row items-center gap-x-4">
          <div className="rounded-lg bg-[#3DD9B6]/20 p-3 text-[#3DD9B6] dark:bg-[#007362]/30">
            <ShieldCheck size={28} />
          </div>
          <div>
            <p className="card-title">Total Admins</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {totalAdmins}
            </p>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <StaffTable staff={staffList} onConfirmDisable={setConfirmTarget} />

      {/* Add Form Modal */}
      {showForm && (
        <StaffForm
          onAdd={(newStaff) => {
            setStaffList((prev) => [...prev, { ...newStaff, id: prev.length + 1 }]);
            setShowForm(false);
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Audit Trail Modal */}
      {showAudit && <AuditTrail onClose={() => setShowAudit(false)} />}

      {/* Confirm Enable/Disable */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
          <div className="card w-full max-w-sm">
            <p className="mb-2 text-base font-medium text-slate-800 dark:text-slate-100">
              {confirmTarget.status === "Active"
                ? `Disable account for ${confirmTarget.name}?`
                : `Enable account for ${confirmTarget.name}?`}
            </p>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              {confirmTarget.status === "Active"
                ? "This will prevent them from logging in until re-enabled."
                : "They will regain access to the system."}
            </p>
            <div className="flex justify-end gap-x-2">
              <button
                onClick={() => setConfirmTarget(null)}
                className="btn-ghost px-4 py-2 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toggleStatus(confirmTarget.id);
                  setConfirmTarget(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                  confirmTarget.status === "Active"
                    ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                    : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
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