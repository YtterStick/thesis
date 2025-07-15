import PropTypes from "prop-types";

const mockAuditLogs = [
  { id: 1, action: "Created account for Sheyi", user: "Admin", time: "2025-06-30 10:30" },
  { id: 2, action: "Disabled account for Sheena", user: "Admin", time: "2025-06-30 10:45" },
  { id: 3, action: "Changed role to Admin for Andrei", user: "Admin", time: "2025-06-30 11:10" },
];

const AuditTrail = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
      <div className="card w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="card-title">Audit Trail</p>
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Close
          </button>
        </div>

        <ul className="flex flex-col gap-y-3 max-h-[400px] overflow-y-auto">
          {mockAuditLogs.map((log) => (
            <li
              key={log.id}
              className="flex flex-col rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700"
            >
              <span className="font-medium text-slate-800 dark:text-slate-100">{log.action}</span>
              <span className="text-slate-500 dark:text-slate-400">
                by <strong>{log.user}</strong> on {log.time}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

AuditTrail.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default AuditTrail;