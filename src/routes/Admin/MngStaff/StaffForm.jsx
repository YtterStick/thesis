import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";

const StaffForm = ({ onAdd, onClose }) => {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    contact: "",
    role: "STAFF",
  });

  const [showPassword, setShowPassword] = useState(false);
  const roles = ["STAFF", "ADMIN"];

  useEffect(() => {
    if (typeof onAdd !== "function") {
      console.warn("⚠️ StaffForm mounted without valid onAdd function");
    }
  }, [onAdd]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("❌ Passwords do not match.");
      return;
    }

    const payload = {
      username: form.username.trim(),
      password: form.password.trim(),
      contact: "+63" + form.contact.trim(),
      role: form.role,
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
      setForm({
        username: "",
        password: "",
        confirmPassword: "",
        contact: "",
        role: "STAFF",
      });

      if (typeof onClose === "function") {
        onClose();
      }
    } catch (err) {
      alert("❌ Server connection error");
      console.error("API error:", err);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="rounded-lg border border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add New Staff</DialogTitle>
          <DialogDescription className="sr-only">
            Provide username, password, contact number, and role to register a new staff account.
          </DialogDescription>
          <DialogClose />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <Input
            placeholder="Username"
            value={form.username}
            onChange={(e) => handleChange("username", e.target.value)}
            required
            className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
          />

          {/* Password with toggle */}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
              className="pr-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-2 text-slate-500 dark:text-slate-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password (always hidden) */}
          <Input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            required
            className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
          />

          {/* Contact Input with +63 Prefix */}
          <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-slate-950">
            <span className="px-3 text-slate-500 dark:text-slate-400">+63</span>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9123456789"
              value={form.contact}
              onChange={(e) =>
                handleChange("contact", e.target.value.replace(/\D/g, ""))
              }
              required
              className="flex-1 border-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none"
            />
          </div>

          <Select
            value={form.role}
            onValueChange={(value) => handleChange("role", value)}
          >
            <SelectTrigger className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
              {roles.map((role) => (
                <SelectItem
                  key={role}
                  value={role}
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="submit"
            className="w-full bg-[#60A5FA] hover:bg-[#3B82F6] text-white rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
          >
            Save Staff
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

StaffForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default StaffForm;