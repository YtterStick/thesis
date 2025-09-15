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
import { Eye, EyeOff, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { secureFetch } from "@/lib/secureFetch";

const EditStaffForm = ({ staff, onUpdate, onClose }) => {
  const [form, setForm] = useState({
    username: staff.username || "",
    password: "",
    confirmPassword: "",
    contact: staff.contact?.replace("+63", "") || "",
    role: staff.role || "STAFF",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const roles = ["STAFF", "ADMIN"];
  const { toast } = useToast();

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validatePassword = (password) => {
    if (password && !passwordRegex.test(password)) {
      return "Password must be at least 8 characters, contain uppercase, lowercase, number and special character (@$!%*?&)";
    }
    return "";
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    
    if (field === "password") {
      setPasswordError(validatePassword(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate passwords match if password is provided
    if (form.password && form.password !== form.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Validate password strength if password is provided
    if (form.password) {
      const error = validatePassword(form.password);
      if (error) {
        setPasswordError(error);
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      contact: "+63" + form.contact.trim(),
      role: form.role,
    };

    // Only include password if it was provided
    if (form.password) {
      payload.password = form.password.trim();
    }

    try {
      await secureFetch(`/accounts/${staff.id}`, "PATCH", payload);

      if (typeof onUpdate === "function") {
        onUpdate({
          ...staff,
          contact: payload.contact,
          role: payload.role,
        });
      }

      toast({
        title: "Success",
        description: "Account updated successfully",
      });

      if (typeof onClose === "function") {
        onClose();
      }
    } catch (err) {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={isSubmitting ? undefined : onClose}>
      <DialogContent className="rounded-lg border border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Edit Staff Account</DialogTitle>
          <DialogDescription className="sr-only">
            Update contact number, role, or password for this staff account.
          </DialogDescription>
          <DialogClose />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <Input
            placeholder="Username"
            value={form.username}
            disabled
            className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
          />

          {/* Password with toggle and info */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="New Password (leave blank to keep current)"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="pr-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
              />
              <div className="absolute right-3 top-2 flex space-x-1">
                <button
                  type="button"
                  onClick={() => setShowPasswordInfo(!showPasswordInfo)}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-500"
                >
                  <Info size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            {passwordError && (
              <p className="text-red-500 text-xs">{passwordError}</p>
            )}
            
            {showPasswordInfo && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                <p>Password must contain:</p>
                <ul className="list-disc pl-4 mt-1">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter (A-Z)</li>
                  <li>One lowercase letter (a-z)</li>
                  <li>One number (0-9)</li>
                  <li>One special character (@$!%*?&)</li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password with toggle */}
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              value={form.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              className="pr-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-2 text-slate-500 dark:text-slate-400 hover:text-blue-500"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Contact Input */}
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

          {/* Role Select */}
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
            disabled={isSubmitting}
            className="w-full bg-[#60A5FA] hover:bg-[#3B82F6] text-white rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Updating..." : "Update Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

EditStaffForm.propTypes = {
  staff: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default EditStaffForm;