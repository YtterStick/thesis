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
  CheckCircle,
  AlertTriangle,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

// Custom Toggle Switch Component
const ToggleSwitch = ({ checked, onChange, disabled = false, id }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${checked 
          ? 'bg-[#18442AF5]' 
          : 'bg-gray-200 dark:bg-gray-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      id={id}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ease-in-out
          ${checked ? 'translate-x-6' : 'translate-x-1'}
          shadow-lg
        `}
      />
    </button>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "warning"
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-50 w-full max-w-md rounded-xl border-2 p-6 shadow-xl"
        style={{
          backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
          borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`rounded-lg p-2 ${
            type === "warning" 
              ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          }`}>
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
            {title}
          </h3>
        </div>

        {/* Description */}
        <p className="mb-6 text-sm" style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/80" }}>
          {description}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-lg border-2 px-4 py-2 transition-all"
            style={{
              borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
              color: isDarkMode ? "#13151B" : "#0B2B26",
              backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
            }}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 text-white transition-all"
            style={{
              backgroundColor: type === "warning" 
                ? "#EF4444" 
                : (isDarkMode ? "#18442AF5" : "#0B2B26"),
            }}
          >
            {confirmText}
          </Button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 transition-colors hover:opacity-70"
          style={{
            backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
          }}
        >
          <X size={16} style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }} />
        </button>
      </motion.div>
    </div>
  );
};

const PaymentManagementPage = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  const [activeTab, setActiveTab] = useState("methods");
  const [gcashEnabled, setGcashEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [transactionToVerify, setTransactionToVerify] = useState(null);
  const [showGcashConfirm, setShowGcashConfirm] = useState(false);

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

  const handleToggleGcash = () => {
    setShowGcashConfirm(true);
  };

  const confirmToggleGcash = async () => {
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
      setShowGcashConfirm(false);
    }
  };

  const handleVerifyPayment = (transaction) => {
    setTransactionToVerify(transaction);
    setShowConfirmModal(true);
  };

  const confirmVerifyPayment = async () => {
    if (!transactionToVerify) return;

    try {
      setIsVerifying(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:8080/api/transactions/${transactionToVerify.id}/verify-gcash`, {
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
        setPendingTransactions(pendingTransactions.filter(t => t.id !== transactionToVerify.id));
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
      setShowConfirmModal(false);
      setTransactionToVerify(null);
    }
  };

  const totalPendingAmount = pendingTransactions.reduce((sum, transaction) => sum + transaction.totalPrice, 0);

  return (
    <div className="space-y-6 px-6 pb-5 pt-4 overflow-visible">
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
          <Wallet size={22} />
        </motion.div>
        <div>
          <p className="text-xl font-bold" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
            Payment Management
          </p>
          <p className="text-sm" style={{ color: isDarkMode ? '#F3EDE3/70' : '#0B2B26/70' }}>
            Manage payment methods and review pending GCash payments
          </p>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-lg p-1 gap-1"
                  style={{
                    backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.3)" : "rgba(11, 43, 38, 0.1)",
                    border: isDarkMode ? "1px solid #2A524C" : "1px solid #E0EAE8",
                  }}>
          <TabsTrigger 
            value="methods"
            className="rounded-md transition-all font-medium text-sm"
            style={{
              backgroundColor: activeTab === "methods" 
                ? (isDarkMode ? "#18442AF5" : "#0B2B26")
                : (isDarkMode ? "rgba(243, 237, 227, 0.1)" : "transparent"),
              color: activeTab === "methods" 
                ? "#FFFFFF" 
                : (isDarkMode ? "#F3EDE3" : "#0B2B26"),
              border: activeTab === "methods" 
                ? "none"
                : (isDarkMode ? "1px solid #2A524C" : "1px solid #E0EAE8"),
              boxShadow: activeTab === "methods" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Payment Methods
          </TabsTrigger>
          <TabsTrigger 
            value="pending"
            className="rounded-md transition-all font-medium text-sm"
            style={{
              backgroundColor: activeTab === "pending" 
                ? (isDarkMode ? "#18442AF5" : "#0B2B26")
                : (isDarkMode ? "rgba(243, 237, 227, 0.1)" : "transparent"),
              color: activeTab === "pending" 
                ? "#FFFFFF" 
                : (isDarkMode ? "#F3EDE3" : "#0B2B26"),
              border: activeTab === "pending" 
                ? "none"
                : (isDarkMode ? "1px solid #2A524C" : "1px solid #E0EAE8"),
              boxShadow: activeTab === "pending" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Pending GCash
          </TabsTrigger>
        </TabsList>

        <TabsContent value="methods">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="rounded-xl border-2 transition-all"
                  style={{
                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                  }}>
              <CardHeader className="rounded-t-xl pb-4"
                         style={{
                           backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                         }}>
                <CardTitle style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                  Available Payment Methods
                </CardTitle>
                <CardDescription style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}>
                  Cash is always available. GCash can be enabled or disabled.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="flex items-center justify-center" style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}>
                      <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                      <span>Loading settings...</span>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: isDarkMode ? "#2A524C" : "#E0EAE8" }}>
                    {/* Cash (always enabled, no toggle) */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <div className="rounded-lg p-2"
                             style={{
                               backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                               color: isDarkMode ? "#18442AF5" : "#0B2B26",
                             }}>
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                            Cash
                          </h3>
                          <p className="text-sm" style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}>
                            Pay with physical cash
                          </p>
                        </div>
                      </div>
                      <Badge style={{ 
                        backgroundColor: isDarkMode ? "rgba(34, 197, 94, 0.2)" : "#DCFCE7",
                        color: isDarkMode ? "#4ADE80" : "#166534"
                      }}>
                        Enabled
                      </Badge>
                    </div>

                    {/* GCash (toggleable) */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <div className="rounded-lg p-2"
                             style={{
                               backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                               color: isDarkMode ? "#18442AF5" : "#0B2B26",
                             }}>
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                            GCash
                          </h3>
                          <p className="text-sm" style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}>
                            Pay via GCash mobile wallet
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {isUpdating ? (
                          <Loader2 className="h-5 w-5 animate-spin" style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }} />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <ToggleSwitch
                              id="gcash-toggle"
                              checked={gcashEnabled}
                              onChange={handleToggleGcash}
                              disabled={isUpdating}
                            />
                            <Label
                              htmlFor="gcash-toggle"
                              className="text-sm font-medium"
                              style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}
                            >
                              {gcashEnabled ? "Enabled" : "Disabled"}
                            </Label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="pending">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="rounded-xl border-2 transition-all"
                  style={{
                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                  }}>
              <CardHeader className="rounded-t-xl pb-4"
                         style={{
                           backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                         }}>
                <div>
                  <CardTitle style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                    Pending GCash Payments
                  </CardTitle>
                  <CardDescription style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}>
                    {pendingTransactions.length} pending GCash payments • Total: ₱{totalPendingAmount.toFixed(2)}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="flex items-center justify-center" style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}>
                      <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                      <span>Loading pending payments...</span>
                    </div>
                  </div>
                ) : pendingTransactions.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Smartphone className="h-12 w-12 mb-3 opacity-50" style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/50" }} />
                      <p className="text-base font-semibold mb-1" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                        No Pending GCash Payments
                      </p>
                      <p className="text-sm" style={{ color: isDarkMode ? "#6B7280" : "#0B2B26/70" }}>
                        All GCash payments have been verified
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b" style={{ borderColor: isDarkMode ? "#2A524C" : "#E0EAE8" }}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                          Total Pending Amount:
                        </span>
                        <span className="text-lg font-bold" style={{ color: "#F59E0B" }}>
                          ₱{totalPendingAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow style={{ 
                            backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)" 
                          }}>
                            <TableHead style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>Invoice #</TableHead>
                            <TableHead style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>Reference #</TableHead>
                            <TableHead style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>Customer</TableHead>
                            <TableHead style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>Contact</TableHead>
                            <TableHead style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>Amount</TableHead>
                            <TableHead style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>Date</TableHead>
                            <TableHead style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>Status</TableHead>
                            <TableHead className="text-right" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingTransactions.map((transaction) => (
                            <TableRow key={transaction.id} style={{ 
                              borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                              backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                            }}>
                              <TableCell className="font-medium" style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                                {transaction.invoiceNumber}
                              </TableCell>
                              <TableCell style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                                {transaction.gcashReference || "N/A"}
                              </TableCell>
                              <TableCell style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                                {transaction.customerName}
                              </TableCell>
                              <TableCell style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                                {transaction.contact}
                              </TableCell>
                              <TableCell style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                                ₱{transaction.totalPrice.toFixed(2)}
                              </TableCell>
                              <TableCell style={{ color: isDarkMode ? "#13151B" : "#0B2B26" }}>
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge style={{ 
                                  backgroundColor: isDarkMode ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7",
                                  color: isDarkMode ? "#F59E0B" : "#92400E"
                                }}>
                                  Pending
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    onClick={() => handleVerifyPayment(transaction)}
                                    disabled={isVerifying}
                                    size="sm"
                                    className="rounded-lg text-white transition-all"
                                    style={{
                                      backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                    }}
                                  >
                                    <CheckCircle className="mr-1 h-4 w-4" />
                                    Verify
                                  </Button>
                                </motion.div>
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
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {/* GCash Toggle Confirmation */}
        {showGcashConfirm && (
          <ConfirmationModal
            isOpen={showGcashConfirm}
            onClose={() => setShowGcashConfirm(false)}
            onConfirm={confirmToggleGcash}
            title={`${gcashEnabled ? 'Disable' : 'Enable'} GCash`}
            description={`Are you sure you want to ${gcashEnabled ? 'disable' : 'enable'} GCash payments? ${gcashEnabled ? 'Customers will no longer be able to pay via GCash.' : 'Customers will be able to pay via GCash.'}`}
            confirmText={gcashEnabled ? 'Disable GCash' : 'Enable GCash'}
            type="warning"
          />
        )}

        {/* Payment Verification Confirmation */}
        {showConfirmModal && transactionToVerify && (
          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => {
              setShowConfirmModal(false);
              setTransactionToVerify(null);
            }}
            onConfirm={confirmVerifyPayment}
            title="Verify GCash Payment"
            description={`Are you sure you want to verify this GCash payment from ${transactionToVerify.customerName} for ₱${transactionToVerify.totalPrice.toFixed(2)}? This action cannot be undone.`}
            confirmText={isVerifying ? "Verifying..." : "Verify Payment"}
            type="default"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentManagementPage;