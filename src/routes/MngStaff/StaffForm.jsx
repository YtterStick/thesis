import { useState } from "react";
import PropTypes from "prop-types";
import { Listbox } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

const StaffForm = ({ onAdd, onClose }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    contact: "",
    role: "Staff",
  });

  const roles = ["Staff", "Admin"];

  const handleSubmit = (e) => {
    e.preventDefault();

    const name = formData.username.trim();
    const contact = "+63" + formData.contact.trim();

    onAdd({
      id: Date.now(),
      name,
      contact,
      role: formData.role,
      status: "Active",
    });

    setFormData({
      username: "",
      password: "",
      contact: "",
      role: "Staff",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
      <div className="card w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <p className="card-title">Add New Staff</p>
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-3">
          <input
            type="text"
            placeholder="Username"
            className="form-input"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="form-input"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          {/* 📱 Phone Number Field with Fixed +63 Prefix */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400">
              +63
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Phone number"
              className="form-input pl-12"
              value={formData.contact}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contact: e.target.value.replace(/\D/g, ""),
                })
              }
              required
            />
          </div>

          {/* Role Selector */}
          <Listbox
            value={formData.role}
            onChange={(val) => setFormData({ ...formData, role: val })}
          >
            <div className="relative">
              <Listbox.Button className="form-input pr-10 text-left leading-[1.25rem]">
                {formData.role}
              </Listbox.Button>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
              <Listbox.Options className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                {roles.map((role) => (
                  <Listbox.Option
                    key={role}
                    value={role}
                    className="cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {role}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>

          <button
            type="submit"
            className="mt-2 rounded-lg bg-[#008B76] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#007362] dark:bg-[#007362] dark:hover:bg-[#00564e]"
          >
            Save Staff
          </button>
        </form>
      </div>
    </div>
  );
};

StaffForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default StaffForm;