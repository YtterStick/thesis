import React, { useState, useEffect } from "react";
import ClaimingTable from "./ClaimingTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MainPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [expiredTransactions, setExpiredTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExpired, setIsLoadingExpired] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
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
  }, [transactions, expiredTransactions, searchTerm, dateFilter, activeTab]);

  const fetchCompletedTransactions = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "http://localhost:8080/api/claiming/completed-unclaimed",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch completed transactions");
      const data = await response.json();
      
      const filteredData = data.filter(transaction => {
        if (transaction.paymentMethod === "GCash") {
          return transaction.gcashVerified === true;
        }
        return true;
      });
      
      setTransactions(filteredData);
      setHasFetched(true);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load completed transactions", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpiredTransactions = async () => {
    try {
      setIsLoadingExpired(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "http://localhost:8080/api/expired",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch expired transactions");
      const data = await response.json();
      setExpiredTransactions(data);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load expired transactions", variant: "destructive" });
    } finally {
      setIsLoadingExpired(false);
    }
  };

  const filterTransactions = () => {
    let filtered = activeTab === "unclaimed" ? transactions : expiredTransactions;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.customerName?.toLowerCase().includes(term) ||
          t.contact?.toLowerCase().includes(term) ||
          t.transactionId?.toLowerCase().includes(term)
      );
    }

    if (dateFilter !== "all") {
      const today = new Date();
      filtered = filtered.filter(t => {
        const completionDate = t.loadAssignments?.reduce((latest, load) => {
          if (load.endTime) {
            const loadDate = new Date(load.endTime);
            return !latest || loadDate > latest ? loadDate : latest;
          }
          return latest;
        }, null);
        if (!completionDate) return false;

        switch (dateFilter) {
          case "today":
            return completionDate.toDateString() === today.toDateString();
          case "week":
            const oneWeekAgo = new Date(); 
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return completionDate >= oneWeekAgo;
          default:
            return true;
        }
      });
    }

    setFilteredTransactions(filtered);
  };

  const handleClaim = async (transactionId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:8080/api/claiming/${transactionId}/claim`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

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

      // Remove from both lists
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      setExpiredTransactions(prev => prev.filter(t => t.id !== transactionId));

      return claimedTransaction;
    } catch (error) {
      console.error(error);
      let errorMessage;
      if (error.message.includes("expired")) {
        errorMessage = "Cannot claim expired laundry. Please dispose instead.";
      } else if (error.message.includes("GCash")) {
        errorMessage = "Cannot claim laundry with unverified GCash payment.";
      } else {
        errorMessage = "Failed to claim laundry";
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      return null;
    }
  };

  const handleDispose = async (transactionId) => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await fetch(
      `http://localhost:8080/api/expired/${transactionId}/dispose`,
      { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to dispose transaction");
    }

    toast({
      title: "Success",
      description: "Expired laundry has been disposed.",
    });

    // Remove from expired list
    setExpiredTransactions(prev => prev.filter(t => t.id !== transactionId));
  } catch (error) {
    console.error(error);
    toast({ 
      title: "Error", 
      description: error.message || "Failed to dispose expired laundry", 
      variant: "destructive" 
    });
  }
};

  const refreshData = () => {
    setHasFetched(false);
    fetchCompletedTransactions();
    fetchExpiredTransactions();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Laundry Claiming & Disposing </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Manage completed and expired laundry</p>
        </div>
      </div>

      <Card className="shadow-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-100 dark:bg-slate-800 rounded-t-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-50">
                {activeTab === "unclaimed" ? "Completed & Unclaimed Laundry" : "Expired Laundry"}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {filteredTransactions.length} item{filteredTransactions.length !== 1 ? "s" : ""}{" "}
                {activeTab === "unclaimed" ? "ready for pickup" : "expired and need disposal"}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="flex space-x-1">
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === "unclaimed"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                  onClick={() => setActiveTab("unclaimed")}
                >
                  Unclaimed ({transactions.length})
                </button>
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === "expired"
                      ? "bg-red-600 text-white"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                  onClick={() => setActiveTab("expired")}
                >
                  Expired ({expiredTransactions.length})
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                <Input
                  placeholder="Search customers..."
                  className="pl-8 w-full sm:w-64 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <select
                  className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                </select>
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
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MainPage;