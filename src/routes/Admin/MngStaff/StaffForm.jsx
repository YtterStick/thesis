import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const StaffForm = ({ onAdd, onClose }) => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        contact: "",
        role: "STAFF",
    });

    const roles = ["STAFF", "ADMIN"];

    useEffect(() => {
        if (typeof onAdd !== "function") {
            console.warn("⚠️ StaffForm mounted without valid onAdd function");
        }
    }, [onAdd]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            username: formData.username.trim(),
            password: formData.password.trim(),
            contact: "+63" + formData.contact.trim(),
            role: formData.role,
        };

        try {
            const res = await fetch("http://localhost:8080/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                alert("❌ Registration failed.");
                console.error("Backend error:", error);
                return;
            }

            const result = await res.json();

            if (typeof onAdd === "function") {
                onAdd({
                    id: result.id,
                    username: result.username,
                    contact: result.contact || payload.contact,
                    role: result.role || payload.role,
                    status: "Active",
                });
            }

            alert("✅ Account registered!");
            setFormData({ username: "", password: "", contact: "", role: "STAFF" });

            if (typeof onClose === "function") {
                onClose();
            }
        } catch (err) {
            alert("❌ Server connection error");
            console.error("API error:", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
            <div className="card w-full max-w-md overflow-visible">
                <div className="mb-4 flex items-center justify-between">
                    <p className="card-title">Add New Staff</p>
                    <button
                        onClick={onClose}
                        className="text-red-400 transition-transform duration-300 hover:rotate-90 hover:text-red-600 dark:hover:text-red-500"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-y-3"
                >
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

                    <div className="form-input flex gap-x-2">
                        <span className="text-sm text-slate-500">+63</span>
                        <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="9123456789"
                            className="w-full bg-transparent outline-none"
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

                    <Select
                        value={formData.role}
                        onValueChange={(val) => setFormData({ ...formData, role: val })}
                    >
                        <SelectTrigger className="form-input">
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="fixed z-[60] rounded-md shadow-md bg-slate-100 dark:bg-slate-900">
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

                    <button
                        type="submit"
                        className="mt-2 rounded-lg bg-[#008B76] px-4 py-2 text-sm text-white hover:bg-[#007362]"
                    >
                        Save
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
