import React, { useState, useEffect } from "react";
import ClaimingTable from "./ClaimingTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

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
    const { toast } = useToast();

    useEffect(() => {
        if (!hasFetched) {
            fetchCompletedTransactions();
            fetchExpiredTransactions();
        }
    }, [hasFetched]);

    useEffect(() => {
        filterTransactions();
    }, [transactions, expiredTransactions, searchTerm, activeTab]);

    const fetchCompletedTransactions = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("authToken");
            const response = await fetch("http://localhost:8080/api/claiming/completed-unclaimed", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch completed transactions");
            const data = await response.json();

            const filteredData = data.filter((transaction) => {
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
            const token = localStorage.getItem("authToken");
            const response = await fetch("http://localhost:8080/api/expired", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch expired transactions");
            const data = await response.json();

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
            const token = localStorage.getItem("authToken");
            const response = await fetch(`http://localhost:8080/api/claiming/${transactionId}/claim`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });

            if (!response.ok) {
                if (response.status === 400) {
                    const errorData = await response.json();
                    if (errorData.message && errorData.message.includes("expired")) {
                        throw new Error("Cannot claim expired job");
                    }
                    if (errorData.message && errorData.message.includes("GCash")) {
                        throw new Error("GCash payment not verified");
                    }
                }
                throw new Error("Failed to claim transaction");
            }

            const claimedTransaction = await response.json();

            toast({
                title: "Success",
                description: "Laundry marked as claimed. You can now view/print the receipt.",
            });

            setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
            setExpiredTransactions((prev) => prev.filter((t) => t.id !== transactionId));

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
            const token = localStorage.getItem("authToken");
            const response = await fetch(`http://localhost:8080/api/expired/${transactionId}/dispose`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to dispose transaction");
            }

            toast({
                title: "Success",
                description: "Past due laundry has been disposed.",
            });

            setExpiredTransactions((prev) => prev.filter((t) => t.id !== transactionId));
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
    };

    return (
        <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-3"
            >
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="rounded-lg p-2"
                    style={{
                        backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                        color: "#F3EDE3",
                    }}
                >
                    <Package size={22} />
                </motion.div>
                <div>
                    <p className="text-xl font-bold" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
                        Laundry Claiming & Disposing
                    </p>
                    <p className="text-sm" style={{ color: isDarkMode ? '#F3EDE3/70' : '#0B2B26/70' }}>
                        Manage completed and past due laundry
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card 
                    className="rounded-xl border-2 transition-all"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                >
                    <CardHeader 
                        className="rounded-t-xl p-6"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                        }}
                    >
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <CardTitle 
                                    className="text-lg font-bold"
                                    style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
                                >
                                    {activeTab === "unclaimed" ? "Completed & Unclaimed Laundry" : "Past Due Laundry"}
                                </CardTitle>
                                <CardDescription 
                                    className="text-sm"
                                    style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}
                                >
                                    {filteredTransactions.length} item{filteredTransactions.length !== 1 ? "s" : ""}{" "}
                                    {activeTab === "unclaimed" ? "ready for pickup" : "past due and need disposal"}
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
                                                ? (isDarkMode ? "#18442AF5" : "#0B2B26")
                                                : (isDarkMode ? "rgba(42, 82, 76, 0.2)" : "rgba(11, 43, 38, 0.1)"),
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
                                                : (isDarkMode ? "rgba(42, 82, 76, 0.2)" : "rgba(11, 43, 38, 0.1)"),
                                        }}
                                        onClick={() => setActiveTab("expired")}
                                    >
                                        Past Due ({expiredTransactions.length})
                                    </motion.button>
                                </div>
                                <div className="relative">
                                    <Search 
                                        className="absolute left-2 top-2.5 h-4 w-4" 
                                        style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}
                                    />
                                    <Input
                                        placeholder="Search customers..."
                                        className="w-full border-2 pl-8 transition-all sm:w-64"
                                        style={{
                                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                            color: isDarkMode ? '#13151B' : '#0B2B26',
                                        }}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
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
                        />
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default MainPage;