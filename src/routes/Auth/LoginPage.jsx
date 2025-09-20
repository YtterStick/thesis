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
            className="absolute bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
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
        className="fixed left-1/4 top-1/4 text-purple-400 opacity-40 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Orbit size={40} />
      </motion.div>
      <motion.div 
        className="fixed right-1/4 top-1/3 text-blue-400 opacity-40 pointer-events-none"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        <Satellite size={30} />
      </motion.div>
      <motion.div 
        className="fixed bottom-1/4 left-1/3 text-pink-400 opacity-40 pointer-events-none"
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 px-4 py-10">
      <BackgroundElements />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-0 bg-gradient-to-b from-slate-900/80 to-slate-800/80 backdrop-blur-xl shadow-2xl shadow-purple-500/20">
          <CardHeader className="space-y-3 text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="relative">
                <img
                  src={logoLight}
                  alt="Starwash Logo"
                  className="h-12 mx-auto drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 blur-md pointer-events-none"
                />
              </div>
            </motion.div>
            <CardTitle className="font-deathstar text-3xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              STAR WASH
            </CardTitle>
            <CardDescription className="text-slate-400">
              Access your cosmic laundry management system
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
                    className="bg-slate-800/50 border-slate-700 text-white pl-10 pr-4 py-5 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <Label 
                    htmlFor="username" 
                    className={`absolute left-10 transition-all duration-300 ease-in-out pointer-events-none ${
                      isFocused.username || form.username 
                        ? "-top-2.5 text-xs text-purple-400 bg-slate-900 px-1 rounded" 
                        : "top-1/2 transform -translate-y-1/2 text-sm text-slate-400"
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
                    className="bg-slate-800/50 border-slate-700 text-white pl-10 pr-10 py-5 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Label 
                    htmlFor="password" 
                    className={`absolute left-10 transition-all duration-300 ease-in-out pointer-events-none ${
                      isFocused.password || form.password 
                        ? "-top-2.5 text-xs text-purple-400 bg-slate-900 px-1 rounded" 
                        : "top-1/2 transform -translate-y-1/2 text-sm text-slate-400"
                    }`}
                  >
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-purple-400 transition-colors"
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
                  className="flex items-center p-3 text-sm text-red-400 bg-red-400/10 rounded-lg"
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
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-6 rounded-lg transition-all duration-300 flex items-center justify-center"
                >
                  {isAuthenticating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="mr-2" />
                      Launch System
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
                className="mt-6 rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-sm text-slate-400"
              >
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-slate-300">Authentication Successful</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">Issued:</span>{" "}
                    {loginMeta.issuedAt.toLocaleString()}
                  </div>
                  <div>
                    <span className="text-slate-500">Expires:</span>{" "}
                    {loginMeta.expiresAt.toLocaleString()}
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center text-slate-500 text-xs">
        Star Wash Laundry System • {new Date().getFullYear()}
      </div>

      {/* Fullscreen Loader Overlay */}
      {isAuthenticating && <AuthLoader />}
    </div>
  );
};

export default LoginPage;