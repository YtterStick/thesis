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
import { 
  Wallet, 
  Smartphone, 
  Loader2, 
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Switch from "./Switch";

const PaymentManagementPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("methods");
  const [gcashEnabled, setGcashEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (activeTab === "methods") {
      fetchPaymentSettings();
    } else if (activeTab === "pending") {
      fetchPendingTransactions();
    }
  }, [activeTab]);

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

  const totalPendingAmount = pendingTransactions.reduce((sum, transaction) => sum + transaction.totalPrice, 0);

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
              <div>
                <CardTitle className="text-slate-900 dark:text-slate-50">
                  Pending GCash Payments
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {pendingTransactions.length} pending GCash payments
                </CardDescription>
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
              ) : pendingTransactions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-600 dark:text-slate-400">
                    No pending GCash payments
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
                          <TableHead>Reference #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{transaction.invoiceNumber}</TableCell>
                            <TableCell>{transaction.gcashReference || "N/A"}</TableCell>
                            <TableCell>{transaction.customerName}</TableCell>
                            <TableCell>{transaction.contact}</TableCell>
                            <TableCell>₱{transaction.totalPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              {new Date(transaction.createdAt).toLocaleDateString()}
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