import PropTypes from "prop-types";
import { UserCheck, UserX } from "lucide-react";

const StaffTable = ({ staff, onConfirmDisable }) => {
  const formatNumber = (num) => {
    if (!num) return "—";
    return num.startsWith("+63") ? "0" + num.slice(3) : num;
  };

  return (
    <div className="card">
      <div className="card-header justify-between">
        <p className="card-title">Staff List</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="staff-table-header">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Contact</th>
              <th className="p-2">Role</th>
              <th className="p-2">Status</th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((person) => (
              <tr
                key={person.id}
                className="border-b border-slate-200 dark:border-slate-700 staff-row-hover"
              >
                <td className="p-2 text-slate-800 dark:text-slate-100">{person.name}</td>
                <td className="p-2 text-slate-700 dark:text-slate-300">
                  {formatNumber(person.contact)}
                </td>
                <td className="p-2 text-slate-700 dark:text-slate-300">{person.role}</td>
                <td className="p-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      person.status === "Active" ? "badge-active" : "badge-inactive"
                    }`}
                  >
                    {person.status}
                  </span>
                </td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => onConfirmDisable(person)}
                    className={`transition-colors ${
                      person.status === "Active"
                        ? "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                        : "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    }`}
                    title={person.status === "Active" ? "Disable Account" : "Enable Account"}
                  >
                    {person.status === "Active" ? <UserX size={18} /> : <UserCheck size={18} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

StaffTable.propTypes = {
  staff: PropTypes.array.isRequired,
  onConfirmDisable: PropTypes.func.isRequired,
};

export default StaffTable;