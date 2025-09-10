import React, { useState, useEffect } from "react";
import ClaimingTable from "./ClaimingTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MainPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [hasFetched, setHasFetched] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!hasFetched) fetchCompletedTransactions();
  }, [hasFetched]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, dateFilter]);

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
      setTransactions(data);
      setHasFetched(true);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load completed transactions", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

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

      if (!response.ok) throw new Error("Failed to claim transaction");

      const claimedTransaction = await response.json();

      toast({
        title: "Success",
        description: "Laundry marked as claimed. You can now view/print the receipt.",
      });

      setTransactions(prev => prev.filter(t => t.id !== transactionId));

      return claimedTransaction;
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to claim laundry", variant: "destructive" });
      return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Laundry Claiming</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Manage completed laundry ready for pickup</p>
        </div>
      </div>

      <Card className="shadow-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-100 dark:bg-slate-800 rounded-t-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-50">Completed & Unclaimed Laundry</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {filteredTransactions.length} item{filteredTransactions.length !== 1 ? "s" : ""} ready for pickup
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
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
            isLoading={isLoading}
            hasFetched={hasFetched}
            onClaim={handleClaim}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MainPage;
