import React, { useState, useEffect } from "react";
import ClaimingTable from "./ClaimingTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Package, Bell, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { api } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MainPage = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    const [transactions, setTransactions] = useState([]);
    const [expiredTransactions, setExpiredTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingExpired, setIsLoadingExpired] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("unclaimed");
    const [hasFetched, setHasFetched] = useState(false);
    const [pendingWarnings, setPendingWarnings] = useState(0);
    const [isSendingWarnings, setIsSendingWarnings] = useState(false);
    const { toast } = useToast();

    // Handle URL parameters for auto-search
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get('search');
        
        if (searchParam) {
            setSearchTerm(searchParam);
            // Clear the URL parameter after using it
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
            
            toast({
                title: "Auto-search activated",
                description: `Searching for: ${searchParam}`,
                duration: 3000,
            });
        }
    }, []);

    useEffect(() => {
        if (!hasFetched) {
            fetchCompletedTransactions();
            fetchExpiredTransactions();
            fetchPendingWarnings();
        }
    }, [hasFetched]);

    useEffect(() => {
        filterTransactions();
    }, [transactions, expiredTransactions, searchTerm, activeTab]);

    const fetchCompletedTransactions = async () => {
        try {
            setIsLoading(true);
            const data = await api.get("/claiming/completed-unclaimed");

            // REMOVED the unnecessary transaction detail fetching
            // Just use the data as-is from the completed-unclaimed endpoint
            const filteredData = data.filter((transaction) => {
                // Filter out unverified GCash transactions if payment info is already in the response
                if (transaction.paymentMethod === "GCash") {
                    return transaction.gcashVerified === true;
                }
                return true;
            });

            // Sort by completion date (newest first)
            const sortedData = filteredData.sort((a, b) => {
                const getLatestCompletionDate = (transaction) => {
                    return transaction.loadAssignments?.reduce(
                        (latest, load) => (load.endTime ? Math.max(latest, new Date(load.endTime).getTime()) : latest),
                        0,
                    );
                };

                const aDate = getLatestCompletionDate(a);
                const bDate = getLatestCompletionDate(b);

                return bDate - aDate;
            });

            setTransactions(sortedData);
            setHasFetched(true);
        } catch (error) {
            console.error(error);
            toast({ 
                title: "Error", 
                description: "Failed to load completed transactions", 
                variant: "destructive" 
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExpiredTransactions = async () => {
        try {
            setIsLoadingExpired(true);
            const data = await api.get("/expired");

            const sortedData = data.sort((a, b) => {
                const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                return bDate - aDate;
            });

            setExpiredTransactions(sortedData);
        } catch (error) {
            console.error(error);
            toast({ 
                title: "Error", 
                description: "Failed to load expired transactions", 
                variant: "destructive" 
            });
        } finally {
            setIsLoadingExpired(false);
        }
    };

    const fetchPendingWarnings = async () => {
        try {
            const response = await api.get("/disposal-warnings/pending");
            setPendingWarnings(response.count || 0);
        } catch (error) {
            console.error("Failed to fetch pending warnings:", error);
        }
    };

    const sendManualWarnings = async () => {
        try {
            setIsSendingWarnings(true);
            const response = await api.post("/disposal-warnings/send-manual");
            
            toast({
                title: "Success",
                description: `Sent ${response.data.warningsSent} disposal warnings`,
            });
            
            // Refresh the pending warnings count
            fetchPendingWarnings();
        } catch (error) {
            console.error(error);
            toast({ 
                title: "Error", 
                description: "Failed to send disposal warnings", 
                variant: "destructive" 
            });
        } finally {
            setIsSendingWarnings(false);
        }
    };

    const filterTransactions = () => {
        let filtered = activeTab === "unclaimed" ? transactions : expiredTransactions;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (t) =>
                    t.customerName?.toLowerCase().includes(term) ||
                    t.contact?.toLowerCase().includes(term) ||
                    t.transactionId?.toLowerCase().includes(term),
            );
        }

        setFilteredTransactions(filtered);
    };

    const handleClaim = async (transactionId) => {
        try {
            const claimedTransaction = await api.patch(`/claiming/${transactionId}/claim`);

            toast({
                title: "Success",
                description: "Laundry marked as claimed. You can now view/print the receipt.",
            });

            setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
            setExpiredTransactions((prev) => prev.filter((t) => t.id !== transactionId));
            fetchPendingWarnings();

            return claimedTransaction;
        } catch (error) {
            console.error(error);
            let errorMessage;
            if (error.message.includes("expired")) {
                errorMessage = "Cannot claim past due laundry. Please dispose instead.";
            } else if (error.message.includes("GCash")) {
                errorMessage = "Cannot claim laundry with unverified GCash payment.";
            } else {
                errorMessage = "Failed to claim laundry";
            }
            toast({ 
                title: "Error", 
                description: errorMessage, 
                variant: "destructive" 
            });
            return null;
        }
    };

    const handleDispose = async (transactionId) => {
        try {
            await api.patch(`/expired/${transactionId}/dispose`);

            toast({
                title: "Success",
                description: "Past due laundry has been disposed.",
            });

            setExpiredTransactions((prev) => prev.filter((t) => t.id !== transactionId));
            fetchPendingWarnings();
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: error.message || "Failed to dispose past due laundry",
                variant: "destructive",
            });
        }
    };

    const refreshData = () => {
        setHasFetched(false);
        fetchCompletedTransactions();
        fetchExpiredTransactions();
        fetchPendingWarnings();
    };

    const clearSearch = () => {
        setSearchTerm("");
    };

    return (
        <div 
            className="space-y-5 px-6 pb-5 pt-4 overflow-visible min-h-screen"
            style={{
                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
            }}
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-3 mb-3"
            >
                <div className="flex items-center gap-3">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="rounded-lg p-2"
                        style={{
                            backgroundColor: isDarkMode ? "#1e293b" : "#0f172a",
                            color: isDarkMode ? "#f1f5f9" : "#f1f5f9",
                        }}
                    >
                        <Package size={22} />
                    </motion.div>
                    <div>
                        <p className="text-xl font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                            Laundry Claiming & Disposing
                        </p>
                        <p className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                            Manage completed and past due laundry
                        </p>
                    </div>
                </div>

                {/* Disposal Warning Button */}
                {pendingWarnings > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <Button
                            onClick={sendManualWarnings}
                            disabled={isSendingWarnings}
                            className="flex items-center gap-2"
                            style={{
                                backgroundColor: isDarkMode ? "#EF4444" : "#DC2626",
                                color: "white",
                            }}
                        >
                            <Bell size={16} />
                            {isSendingWarnings ? (
                                <RefreshCw size={16} className="animate-spin" />
                            ) : (
                                `Send Warnings (${pendingWarnings})`
                            )}
                        </Button>
                    </motion.div>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card 
                    className="rounded-xl border-2 transition-all"
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    }}
                >
                    <CardHeader 
                        className="rounded-t-xl p-6"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                        }}
                    >
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <CardTitle 
                                    className="text-lg font-bold"
                                    style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                                >
                                    {activeTab === "unclaimed" ? "Completed & Unclaimed Laundry" : "Past Due Laundry"}
                                </CardTitle>
                                <CardDescription 
                                    className="text-sm"
                                    style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}
                                >
                                    {filteredTransactions.length} item{filteredTransactions.length !== 1 ? "s" : ""}{" "}
                                    {activeTab === "unclaimed" ? "ready for pickup" : "past due and need disposal"}
                                    {pendingWarnings > 0 && ` • ${pendingWarnings} need disposal warnings`}
                                    {searchTerm && (
                                        <span className="ml-2">
                                            • Searching for: "<strong>{searchTerm}</strong>"
                                            <button 
                                                onClick={clearSearch}
                                                className="ml-2 text-xs underline hover:no-underline"
                                                style={{ color: isDarkMode ? '#3DD9B6' : '#0891B2' }}
                                            >
                                                clear
                                            </button>
                                        </span>
                                    )}
                                </CardDescription>
                            </div>
                            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
                                <div className="flex space-x-2">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                            activeTab === "unclaimed"
                                                ? "text-white"
                                                : isDarkMode ? "text-slate-100" : "text-slate-700"
                                        }`}
                                        style={{
                                            backgroundColor: activeTab === "unclaimed" 
                                                ? (isDarkMode ? "#0f172a" : "#0f172a")
                                                : (isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)"),
                                        }}
                                        onClick={() => setActiveTab("unclaimed")}
                                    >
                                        Unclaimed ({transactions.length})
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                            activeTab === "expired"
                                                ? "text-white"
                                                : isDarkMode ? "text-slate-100" : "text-slate-700"
                                        }`}
                                        style={{
                                            backgroundColor: activeTab === "expired" 
                                                ? "#EF4444"
                                                : (isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)"),
                                        }}
                                        onClick={() => setActiveTab("expired")}
                                    >
                                        Past Due ({expiredTransactions.length})
                                    </motion.button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search 
                                            className="absolute left-2 top-2.5 h-4 w-4" 
                                            style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}
                                        />
                                        <Input
                                            placeholder="Search customers..."
                                            className="w-full border-2 pl-8 transition-all sm:w-64"
                                            style={{
                                                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                                borderColor: searchTerm ? (isDarkMode ? "#3DD9B6" : "#0891B2") : (isDarkMode ? "#475569" : "#cbd5e1"),
                                                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                            }}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={clearSearch}
                                                className="absolute right-2 top-2.5"
                                                style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={refreshData}
                                        className="rounded-lg p-2 transition-all"
                                        style={{
                                            backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                            color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                        }}
                                    >
                                        <RefreshCw size={18} />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <ClaimingTable
                            transactions={filteredTransactions}
                            isLoading={activeTab === "unclaimed" ? isLoading : isLoadingExpired}
                            hasFetched={hasFetched}
                            onClaim={handleClaim}
                            onDispose={handleDispose}
                            isExpiredTab={activeTab === "expired"}
                            hasUnfilteredData={activeTab === "unclaimed" ? transactions.length > 0 : expiredTransactions.length > 0}
                            isDarkMode={isDarkMode}
                            onSendWarning={(transactionId) => {
                                api.post(`/disposal-warnings/send-for-job/${transactionId}`)
                                    .then(() => {
                                        toast({
                                            title: "Success",
                                            description: "Disposal warning sent successfully",
                                        });
                                        fetchPendingWarnings();
                                    })
                                    .catch(error => {
                                        toast({
                                            title: "Error",
                                            description: "Failed to send disposal warning",
                                            variant: "destructive",
                                        });
                                    });
                            }}
                        />
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default MainPage;