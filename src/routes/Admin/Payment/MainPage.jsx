import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Wallet, 
  Smartphone, 
  Loader2, 
  CalendarIcon, 
  CheckCircle, 
  Filter, 
  Download 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Switch from "./Switch";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PaymentManagementPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("methods");
  const [gcashEnabled, setGcashEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (activeTab === "methods") {
      fetchPaymentSettings();
    } else if (activeTab === "pending") {
      fetchPendingTransactions();
    }
  }, [activeTab]);

  useEffect(() => {
    filterTransactionsByDate();
  }, [pendingTransactions, selectedDate]);

  const fetchPaymentSettings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:8080/api/payment-settings", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGcashEnabled(data.gcashEnabled);
      } else {
        setGcashEnabled(true);
      }
    } catch (error) {
      console.error("Error fetching payment settings:", error);
      setGcashEnabled(true);
      toast({
        title: "Error",
        description: "Failed to load payment settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingTransactions = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:8080/api/transactions/pending-gcash", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingTransactions(data);
      } else {
        throw new Error("Failed to fetch pending transactions");
      }
    } catch (error) {
      console.error("Error fetching pending transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load pending GCash payments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactionsByDate = () => {
    if (!selectedDate) {
      setFilteredTransactions(pendingTransactions);
      return;
    }

    const filtered = pendingTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      return (
        transactionDate.getDate() === selectedDate.getDate() &&
        transactionDate.getMonth() === selectedDate.getMonth() &&
        transactionDate.getFullYear() === selectedDate.getFullYear()
      );
    });

    setFilteredTransactions(filtered);
  };

  const handleToggleGcash = async () => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem("authToken");
      const newStatus = !gcashEnabled;

      const response = await fetch("http://localhost:8080/api/payment-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gcashEnabled: newStatus }),
      });

      if (response.ok) {
        setGcashEnabled(newStatus);
        toast({
          title: "Success",
          description: `GCash has been ${newStatus ? "enabled" : "disabled"}`,
        });
      } else {
        throw new Error("Failed to update payment settings");
      }
    } catch (error) {
      console.error("Error updating payment settings:", error);
      toast({
        title: "Error",
        description: "Failed to update GCash setting",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyPayment = async (transactionId) => {
    try {
      setIsVerifying(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:8080/api/transactions/${transactionId}/verify-gcash`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "GCash payment verified successfully",
        });
        setPendingTransactions(pendingTransactions.filter(t => t.id !== transactionId));
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to verify payment");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Invoice Number", "Customer Name", "Contact", "Total Amount", "Date", "Status"],
      ...filteredTransactions.map(t => [
        t.invoiceNumber,
        t.customerName,
        t.contact,
        `₱${t.totalPrice.toFixed(2)}`,
        format(new Date(t.createdAt), "MMM dd, yyyy hh:mm a"),
        "Pending"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pending_gcash_payments_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalPendingAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.totalPrice, 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Payment Management</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Manage payment methods and review pending GCash payments</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="pending">Pending GCash Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="methods">
          <Card className="border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
            <CardHeader className="rounded-t-lg bg-slate-100 dark:bg-slate-800">
              <CardTitle className="text-slate-900 dark:text-slate-50">Available Payment Methods</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Cash is always available. GCash can be enabled or disabled.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                    <span>Loading settings...</span>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {/* Cash (always enabled, no toggle) */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">Cash</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Pay with physical cash</p>
                      </div>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>

                  {/* GCash (toggleable) */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">GCash</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Pay via GCash mobile wallet</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {isUpdating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="gcash-toggle"
                            checked={gcashEnabled}
                            onChange={handleToggleGcash}
                          />
                          <Label
                            htmlFor="gcash-toggle"
                            className="sr-only"
                          >
                            Toggle GCash
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card className="border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
            <CardHeader className="rounded-t-lg bg-slate-100 dark:bg-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-slate-900 dark:text-slate-50">
                    Pending GCash Payments
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {filteredTransactions.length} pending GCash payments
                    {selectedDate && ` on ${format(selectedDate, "MMM dd, yyyy")}`}
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Pick a date"}
                        <Filter className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button onClick={handleExportCSV} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                    <span>Loading pending payments...</span>
                  </div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-600 dark:text-slate-400">
                    {pendingTransactions.length === 0 
                      ? "No pending GCash payments" 
                      : `No pending GCash payments on ${format(selectedDate, "MMM dd, yyyy")}`
                    }
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Pending Amount:</span>
                      <span className="text-lg font-bold text-amber-600">₱{totalPendingAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{transaction.invoiceNumber}</TableCell>
                            <TableCell>{transaction.customerName}</TableCell>
                            <TableCell>{transaction.contact}</TableCell>
                            <TableCell>₱{transaction.totalPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              {format(new Date(transaction.createdAt), "MMM dd, yyyy hh:mm a")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                Pending
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                onClick={() => handleVerifyPayment(transaction.id)}
                                disabled={isVerifying}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Verify
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentManagementPage;