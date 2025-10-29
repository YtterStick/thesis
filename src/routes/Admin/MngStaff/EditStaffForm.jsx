import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import PropTypes from "prop-types";
import { X, Eye, EyeOff, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { secureFetch } from "@/lib/secureFetch";

const EditStaffForm = ({ staff, onUpdate, onClose }) => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
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
    const [contactError, setContactError] = useState("");
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

    const validateContact = (contact) => {
        const digitsOnly = contact.replace(/\D/g, "");
        if (!digitsOnly.startsWith("09")) {
            return "Phone number must start with '09'";
        }
        if (digitsOnly.length !== 11) {
            return "Phone number must be exactly 11 digits";
        }
        return "";
    };

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));

        if (field === "password") {
            setPasswordError(validatePassword(value));
        }

        if (field === "contact") {
            const digitsOnly = value.replace(/\D/g, "").slice(0, 11);
            setForm((prev) => ({ ...prev, contact: digitsOnly }));
            setContactError(validateContact(digitsOnly));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (form.password && form.password !== form.confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }

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

        const contactValidationError = validateContact(form.contact);
        if (contactValidationError) {
            setContactError(contactValidationError);
            toast({
                title: "Error",
                description: contactValidationError,
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }

        const payload = {
            contact: form.contact.trim(),
            role: form.role,
        };

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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-50 w-full max-w-md rounded-xl border-2 p-6 shadow-xl transition-all"
                style={{
                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                    borderColor: isDarkMode ? "#334155" : "#0B2B26",
                    color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                }}
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
                        Edit Staff Account
                    </h2>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="rounded-lg p-1 transition-colors hover:opacity-80"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                        }}
                    >
                        <X className="h-4 w-4" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }} />
                    </motion.button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
                            Username
                        </label>
                        <Input
                            value={form.username}
                            disabled
                            className="rounded-lg border-2 transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                borderColor: isDarkMode ? "#334155" : "#0B2B26",
                                color: isDarkMode ? "#94a3b8" : "#0B2B26/70",
                            }}
                        />
                    </div>

                    {/* Password with toggle and info */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
                            New Password (leave blank to keep current)
                        </label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                value={form.password}
                                onChange={(e) => handleChange("password", e.target.value)}
                                className="rounded-lg border-2 pr-20 transition-all"
                                style={{
                                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                    borderColor: isDarkMode ? "#334155" : "#0B2B26",
                                    color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                                }}
                            />
                            <div className="absolute right-3 top-2 flex space-x-2">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    onClick={() => setShowPasswordInfo(!showPasswordInfo)}
                                    className="transition-colors hover:opacity-80"
                                    style={{ color: isDarkMode ? '#94a3b8' : '#0B2B26/70' }}
                                >
                                    <Info size={16} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="transition-colors hover:opacity-80"
                                    style={{ color: isDarkMode ? '#94a3b8' : '#0B2B26/70' }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </motion.button>
                            </div>
                        </div>

                        {passwordError && (
                            <p className="text-xs" style={{ color: '#EF4444' }}>{passwordError}</p>
                        )}

                        {showPasswordInfo && (
                            <div className="rounded-lg border-2 p-3 text-xs transition-all"
                                 style={{
                                     backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.1)",
                                     borderColor: isDarkMode ? "#3b82f6" : "#3b82f6",
                                     color: isDarkMode ? "#3b82f6" : "#1d4ed8",
                                 }}>
                                <p className="font-medium">Password must contain:</p>
                                <ul className="mt-1 list-disc pl-4 space-y-1">
                                    <li>At least 8 characters</li>
                                    <li>One uppercase letter (A-Z)</li>
                                    <li>One lowercase letter (a-z)</li>
                                    <li>One number (0-9)</li>
                                    <li>One special character (@$!%*?&)</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm New Password"
                                value={form.confirmPassword}
                                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                className="rounded-lg border-2 pr-10 transition-all"
                                style={{
                                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                    borderColor: isDarkMode ? "#334155" : "#0B2B26",
                                    color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                                }}
                            />
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="absolute right-3 top-2 transition-colors hover:opacity-80"
                                style={{ color: isDarkMode ? '#94a3b8' : '#0B2B26/70' }}
                            >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </motion.button>
                        </div>
                    </div>

                    {/* Contact Input */}
                    <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
                            Contact Number
                        </label>
                        <div className="flex items-center rounded-lg border-2 transition-all"
                             style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                borderColor: isDarkMode ? "#334155" : "#0B2B26",
                             }}>
                            <span className="px-3" style={{ color: isDarkMode ? '#94a3b8' : '#0B2B26/70' }}>+63</span>
                            <Input
                                type="tel"
                                inputMode="numeric"
                                maxLength={11}
                                placeholder="9123456789"
                                value={form.contact}
                                onChange={(e) => handleChange("contact", e.target.value)}
                                required
                                className="flex-1 border-none bg-transparent transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
                                style={{
                                    color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                                }}
                            />
                        </div>
                        {contactError && (
                            <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{contactError}</p>
                        )}
                    </div>

                    {/* Role Select */}
                    <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
                            Role
                        </label>
                        <Select
                            value={form.role}
                            onValueChange={(value) => handleChange("role", value)}
                        >
                            <SelectTrigger
                                className="rounded-lg border-2 transition-all"
                                style={{
                                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                    borderColor: isDarkMode ? "#334155" : "#0B2B26",
                                    color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                                }}
                            >
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent 
                                className="rounded-lg border-2 transition-all"
                                style={{
                                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                    borderColor: isDarkMode ? "#334155" : "#0B2B26",
                                    color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                                }}
                            >
                                {roles.map((role) => (
                                    <SelectItem
                                        key={role}
                                        value={role}
                                        className="cursor-pointer transition-colors hover:opacity-80"
                                        style={{
                                            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                        }}
                                    >
                                        {role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="pt-2"
                    >
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-lg px-4 py-2 text-white transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#0f172a" : "#0B2B26",
                            }}
                        >
                            {isSubmitting ? "Updating..." : "Update Account"}
                        </Button>
                    </motion.div>
                </form>
            </motion.div>
        </div>
    );
};

EditStaffForm.propTypes = {
    staff: PropTypes.object.isRequired,
    onUpdate: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default EditStaffForm;