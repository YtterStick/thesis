"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import logoLight from "@/assets/logo-dark.svg";
import AuthLoader from "@/components/feedback/AuthLoader";

const decodeToken = (token) => {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        return decoded;
    } catch {
        return null;
    }
};

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [form, setForm] = useState({ username: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouse = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 10;
            const y = (e.clientY / window.innerHeight - 0.5) * 10;
            setMouse({ x, y });
        };
        window.addEventListener("mousemove", handleMouse);
        return () => window.removeEventListener("mousemove", handleMouse);
    }, []);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsAuthenticating(true);

        try {
            const loginRes = await fetch("http://localhost:8080/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!loginRes.ok) throw new Error("Login failed");

            const { token } = await loginRes.json();
            if (!token) throw new Error("No token received");

            localStorage.setItem("token", token);
            await login(token);

            const decoded = decodeToken(token);
            const normalizedRole = decoded?.role?.toUpperCase();

            // ⏳ 4-second delay before navigating
            if (normalizedRole === "ADMIN") {
                navigate("/dashboard");
            } else if (normalizedRole === "STAFF") {
                navigate("/staff/dashboard");
            } else {
                navigate("/login");
            }
            setIsAuthenticating(false);
        } catch (err) {
            console.error("❌ Login error:", err);
            setError("Invalid username or password");
            setIsAuthenticating(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-10 text-slate-100">
            {/* 🌌 Background layers */}
            <div className="animate-backgroundBlur absolute inset-0 z-0 bg-gradient-to-b from-[#050505] via-[#0b0b0b] to-[#1a1a1a]" />
            <div className="starfield absolute inset-0 z-0" />
            <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_rgba(0,181,255,0.08)_0%,_transparent_70%)]" />

            {/* 🚀 Login Card */}
            <motion.div
                style={{ transform: `rotateY(${mouse.x}deg) rotateX(${mouse.y}deg)` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[400px]"
            >
                <Card className="animate-cardglow border border-[#00B5FF] bg-[#181818]/80 backdrop-blur-md">
                    <CardHeader className="space-y-3">
                        <div className="flex items-center gap-4">
                            <img
                                src={logoLight}
                                alt="Starwash Logo"
                                className="h-8 drop-shadow-[0_0_10px_#00B5FF]"
                            />
                            <CardTitle className="font-starjedi glow-text text-2xl tracking-wide text-slate-50">STAR WASH</CardTitle>
                        </div>
                        <CardDescription className="text-xs text-slate-400">
                            Welcome to your Laundry System. Begin systems authentication.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            {/* Username */}
                            <div className="relative w-full">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="Username"
                                    className="peer w-full rounded-md border border-slate-700 bg-[#1f1f1f] px-3 pb-2 pt-5 text-xs text-slate-100 placeholder:text-sm placeholder:text-slate-500 focus:border-[#00B5FF] focus:placeholder-transparent focus:ring-2 focus:ring-[#00B5FF]"
                                />
                                <label
                                    htmlFor="username"
                                    className="absolute left-3 top-1 bg-[#1f1f1f] px-1 text-xs text-slate-400 transition-all duration-200 ease-in-out peer-placeholder-shown:top-[14px] peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#00B5FF]"
                                >
                                    Username
                                </label>
                            </div>

                            {/* Password */}
                            <div className="relative w-full">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Password"
                                    className="peer w-full rounded-md border border-slate-700 bg-[#1f1f1f] px-3 pb-2 pr-10 pt-5 text-xs text-slate-100 placeholder:text-sm placeholder:text-slate-500 focus:border-[#00B5FF] focus:placeholder-transparent focus:ring-2 focus:ring-[#00B5FF]"
                                />
                                <label
                                    htmlFor="password"
                                    className="absolute left-3 top-1 bg-[#1f1f1f] px-1 text-xs text-slate-400 transition-all duration-200 ease-in-out peer-placeholder-shown:top-[14px] peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#00B5FF]"
                                >
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-3 text-white transition-colors hover:text-[#00B5FF]"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>

                                {/* 🔴 Error Badge */}
                                {error && (
                                    <div className="absolute -top-6 right-3 rounded-md border border-red-500 bg-red-900/10 px-2 py-1 text-xs font-medium text-red-500 shadow-sm">
                                        {error}
                                    </div>
                                )}
                            </div>

                            {/* 🔘 Login Button */}
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#0077CC] via-[#00B5FF] to-[#0077CC] px-4 py-2 text-xs font-medium text-slate-900 shadow-[0_0_8px_#00B5FF80] transition-transform hover:scale-[1.01] hover:shadow-[0_0_12px_#00B5FF80]"
                            >
                                Login
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            {/* ⏳ Auth Loader */}
            {isAuthenticating && <AuthLoader />}
        </div>
    );
};

export default LoginPage;
