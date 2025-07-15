import { useState } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"; // Adjust path as needed
import { cn } from "@/utils/cn";

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
                        className="text-red-400 transition-transform hover:rotate-90 hover:text-red-500 dark:hover:text-red-500"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                  </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-y-3"
                >
                    {/* Username */}
                    <input
                        type="text"
                        placeholder="Username"
                        className="form-input focus:border-[#3DD9B6] focus:outline-none focus:ring-2 focus:ring-[#3DD9B6]"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />

                    {/* Password */}
                    <input
                        type="password"
                        placeholder="Password"
                        className="form-input focus:border-[#3DD9B6] focus:outline-none focus:ring-2 focus:ring-[#3DD9B6]"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />

                    {/* Contact number with +63 prefix */}
                    <div className="form-input flex gap-x-2 focus-within:border-[#3DD9B6] focus-within:ring-2 focus-within:ring-[#3DD9B6]">
                        <span className="flex-shrink-0 text-sm text-slate-500 dark:text-slate-400">+63</span>
                        <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="9123456789"
                            className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
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

                    {/* Role dropdown */}
                    <Select
                        value={formData.role}
                        onValueChange={(val) => setFormData({ ...formData, role: val })}
                    >
                        <SelectTrigger className="form-input focus:border-[#3DD9B6] focus:outline-none focus:ring-2 focus:ring-[#3DD9B6]">
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                            {roles.map((role) => (
                                <SelectItem
                                    key={role}
                                    value={role}
                                >
                                    {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Save button */}
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
