"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Sparkles, Orbit, Satellite, Rocket, User, Lock } from "lucide-react";
import { motion } from "framer-motion";
import logoLight from "@/assets/logo-dark.svg";
import AuthLoader from "@/components/feedback/AuthLoader";

const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const issuedAt = new Date(decoded.iat * 1000);
    const expiresAt = new Date(decoded.exp * 1000);
    const isExpired = expiresAt.getTime() < Date.now();
    if (isExpired) return null;
    return { ...decoded, issuedAt, expiresAt };
  } catch {
    return null;
  }
};

const BackgroundElements = () => {
  const elements = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      width: Math.floor(Math.random() * 100) + 50,
      height: Math.floor(Math.random() * 100) + 50,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
    }));
  }, []);

  return (
    <>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        {elements.map((el) => (
          <motion.div
            key={el.id}
            className="absolute bg-gradient-to-r from-[#18442A] to-[#2A8C6F] rounded-full"
            style={{
              width: el.width,
              height: el.height,
              top: el.top,
              left: el.left,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Floating Icons */}
      <motion.div 
        className="fixed left-1/4 top-1/4 text-[#2A8C6F] opacity-40 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Orbit size={40} />
      </motion.div>
      <motion.div 
        className="fixed right-1/4 top-1/3 text-[#225C4A] opacity-40 pointer-events-none"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        <Satellite size={30} />
      </motion.div>
      <motion.div 
        className="fixed bottom-1/4 left-1/3 text-[#2A8C6F] opacity-40 pointer-events-none"
        animate={{ x: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        <Rocket size={35} />
      </motion.div>
    </>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, role, loading } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginMeta, setLoginMeta] = useState(null);
  const [isFocused, setIsFocused] = useState({ username: false, password: false });

  useEffect(() => {
    if (isAuthenticated) {
      const normalizedRole = role?.toUpperCase();
      if (normalizedRole === "ADMIN") {
        navigate("/dashboard");
      } else if (normalizedRole === "STAFF") {
        navigate("/staff/dashboard");
      } else {
        navigate("/unauthorized");
      }
    }
  }, [isAuthenticated, role, navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAuthenticating) return;

    setError("");
    setIsAuthenticating(true);

    try {
      const loginRes = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // Handle different HTTP status codes
      if (loginRes.status === 403) {
        throw new Error("Account is deactivated. Please contact administrator.");
      } else if (!loginRes.ok) {
        throw new Error("Invalid username or password");
      }

      const { token } = await loginRes.json();
      if (!token) throw new Error("No token received");

      const decoded = decodeToken(token);
      if (!decoded) throw new Error("Token expired or invalid");

      setLoginMeta({
        issuedAt: decoded.issuedAt,
        expiresAt: decoded.expiresAt,
      });

      localStorage.setItem("authToken", token);
      await login(token);
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.message);
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#E0EAE8] via-[#D5DCDB] to-[#E0EAE8] px-4 py-10">
      <BackgroundElements />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-0 bg-gradient-to-b from-white/90 to-[#F3EDE3]/90 backdrop-blur-xl shadow-2xl shadow-[#1C3F3A]/20 border border-[#1C3F3A]/15">
          <CardHeader className="space-y-3 text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="relative">
                <motion.div
                  className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1C3F3A] to-[#2A8C6F] flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 5 }}
                  animate={{ rotate: [0, -2, 2, 0] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 5 }}
                >
                  <span className="font-bold text-lg text-[#F3EDE3]">
                    SW
                  </span>
                </motion.div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-3 bg-gradient-to-r from-[#2A8C6F] to-[#D5DCDB] rounded-full opacity-20 blur-md pointer-events-none"
                />
              </div>
            </motion.div>
            <CardTitle className="font-deathstar text-3xl bg-gradient-to-br from-[#1C3F3A] to-[#2A8C6F] bg-clip-text text-transparent tracking-wider">
              STAR WASH
            </CardTitle>
            <CardDescription className="text-[#1C3F3A]/70">
              Access Star Wash laundry system
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={form.username}
                    onChange={handleChange}
                    onFocus={() => handleFocus('username')}
                    onBlur={() => handleBlur('username')}
                    required
                    className="bg-white/60 border-[#1C3F3A]/30 text-[#0B2B26] pl-10 pr-4 py-5 rounded-lg focus:ring-2 focus:ring-[#2A8C6F] focus:border-transparent transition-all duration-300"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-5 w-5 text-[#1C3F3A]/50" />
                  </div>
                  <Label 
                    htmlFor="username" 
                    className={`absolute left-10 transition-all duration-300 ease-in-out pointer-events-none ${
                      isFocused.username || form.username 
                        ? "-top-2.5 text-xs text-[#2A8C6F] bg-white px-1 rounded font-medium" 
                        : "top-1/2 transform -translate-y-1/2 text-sm text-[#1C3F3A]/50"
                    }`}
                  >
                    Username
                  </Label>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                    required
                    className="bg-white/60 border-[#1C3F3A]/30 text-[#0B2B26] pl-10 pr-10 py-5 rounded-lg focus:ring-2 focus:ring-[#2A8C6F] focus:border-transparent transition-all duration-300"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-[#1C3F3A]/50" />
                  </div>
                  <Label 
                    htmlFor="password" 
                    className={`absolute left-10 transition-all duration-300 ease-in-out pointer-events-none ${
                      isFocused.password || form.password 
                        ? "-top-2.5 text-xs text-[#2A8C6F] bg-white px-1 rounded font-medium" 
                        : "top-1/2 transform -translate-y-1/2 text-sm text-[#1C3F3A]/50"
                    }`}
                  >
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#1C3F3A]/50 hover:text-[#2A8C6F] transition-colors duration-300"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </motion.div>
              )}

              {/* Login Button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full bg-gradient-to-br from-[#1C3F3A] to-[#2A8C6F] hover:from-[#225C4A] hover:to-[#2A8C6F] text-[#F3EDE3] font-medium py-6 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"
                >
                  {isAuthenticating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="mr-2" />
                      Login
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Login Metadata */}
            {loginMeta && !isAuthenticating && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 rounded-lg border border-[#2A8C6F]/30 bg-gradient-to-br from-[#E0EAE8] to-[#D5DCDB] p-4 text-sm text-[#1C3F3A]/70 shadow-sm"
              >
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#2A8C6F]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-[#1C3F3A]">Authentication Successful</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[#1C3F3A]/50">Issued:</span>{" "}
                    {loginMeta.issuedAt.toLocaleString()}
                  </div>
                  <div>
                    <span className="text-[#1C3F3A]/50">Expires:</span>{" "}
                    {loginMeta.expiresAt.toLocaleString()}
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center text-[#1C3F3A]/50 text-xs">
        Star Wash Laundry System • {new Date().getFullYear()}
      </div>

      {/* Fullscreen Loader Overlay */}
      {isAuthenticating && <AuthLoader />}
    </div>
  );
};

export default LoginPage;