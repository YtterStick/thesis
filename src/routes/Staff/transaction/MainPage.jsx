import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import TransactionForm from "./TransactionForm";
import ServiceInvoiceCard from "@/components/ServiceInvoiceCard";
import TotalPreviewCard from "@/components/TotalPreviewCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, XCircle, AlertTriangle, Check, X, Eye, Calculator, Printer } from "lucide-react";
import { api } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MainPage = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const formRef = useRef();
    const [invoice, setInvoice] = useState(null);
    const [previewData, setPreviewData] = useState({
        totalAmount: 0,
        amountGiven: 0,
        change: 0,
    });
    const [showActions, setShowActions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    const { toast } = useToast();

    const [showUnclaimedDialog, setShowUnclaimedDialog] = useState(false);
    const [pendingPayload, setPendingPayload] = useState(null);
    const [unclaimedItems, setUnclaimedItems] = useState([]);
    const [isCheckingLaundry, setIsCheckingLaundry] = useState(false);
    const [isProcessingAfterConfirm, setIsProcessingAfterConfirm] = useState(false);
    
    const [showClaimingStub, setShowClaimingStub] = useState(false);

    useEffect(() => {
        const handlePrintStart = () => document.body.classList.add("print-mode");
        const handlePrintEnd = () => {
            document.body.classList.remove("print-mode");
            setShowClaimingStub(true);
        };

        window.addEventListener("beforeprint", handlePrintStart);
        window.addEventListener("afterprint", handlePrintEnd);

        return () => {
            window.removeEventListener("beforeprint", handlePrintStart);
            window.removeEventListener("afterprint", handlePrintEnd);
        };
    }, []);

    useEffect(() => {
        return () => {
            localStorage.removeItem("staffId");
        };
    }, []);

    const checkUnclaimedLaundry = async (customerName, contact) => {
        try {
            const response = await api.get("/records");

            const currentTime = new Date();

            const unclaimedLaundry = response.filter((record) => {
                const isSameCustomer = record.customerName?.toLowerCase() === customerName?.toLowerCase() && record.contact === contact;

                const isUnclaimed = record.pickupStatus === "UNCLAIMED" || record.pickupStatus === "Unclaimed";

                const isNotExpired = !record.expired;
                const isNotDisposed = !record.disposed;

                return isSameCustomer && isUnclaimed && isNotExpired && isNotDisposed;
            });

            return unclaimedLaundry;
        } catch (error) {
            console.error("Error checking unclaimed laundry:", error);
            return [];
        }
    };

    const handleSubmit = async (payload) => {
        if (isSubmitting || isCheckingLaundry) return;
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            setIsCheckingLaundry(true);
            const unclaimedLaundry = await checkUnclaimedLaundry(payload.customerName, payload.contact);

            if (unclaimedLaundry.length > 0) {
                setUnclaimedItems(unclaimedLaundry);
                setPendingPayload(payload);
                setShowUnclaimedDialog(true);
                setIsSubmitting(false);
                setIsCheckingLaundry(false);
                return;
            }

            await processTransaction(payload);
        } catch (error) {
            console.error("Error checking unclaimed laundry:", error);
            await processTransaction(payload);
        } finally {
            setIsCheckingLaundry(false);
        }
    };

    const processTransaction = async (payload) => {
        try {
            const staffId = localStorage.getItem("staffId");

            const payloadWithStaff = {
                ...payload,
                staffId: staffId || "Unknown",
            };

            console.log("📝 Transaction payload staffId:", payloadWithStaff.staffId);

            const response = await api.post("/transactions", payloadWithStaff);
            console.log("🧾 Full backend response:", response);

            console.log("🔍 Response data structure:", {
                invoiceNumber: response.invoiceNumber,
                customerName: response.customerName,
                service: response.service,
                serviceName: response.serviceName,
                servicePrice: response.servicePrice,
                loads: response.loads,
                consumables: response.consumables,
                totalPrice: response.totalPrice,
                amountGiven: response.amountGiven,
                change: response.change,
                staffId: response.staffId,
                formatSettings: response.formatSettings,
            });

            const transformedInvoice = {
                invoiceNumber: response.invoiceNumber,
                customerName: response.customerName,
                contact: response.contact,
                staffId: response.staffId || staffId || "Unknown",

                serviceName: response.serviceName || (response.service && response.service.name) || "Service",
                servicePrice: response.servicePrice || (response.service && response.service.price) || 0,
                loads: response.loads || response.serviceQuantity || 1,

                totalPrice: response.totalPrice,
                paymentMethod: response.paymentMethod,
                amountGiven: response.amountGiven || 0,
                change: response.change || 0,

                issueDate: response.issueDate,
                dueDate: response.dueDate,

                consumables: Array.isArray(response.consumables) ? response.consumables : [],

                formatSettings: response.formatSettings || {
                    storeName: "STARWASH LAUNDRY",
                    address: "123 Laundry Street, City, State 12345",
                    phone: "Tel: (123) 456-7890",
                    footerNote: "Thank you for your business!",
                },

                ...response,
            };
            setInvoice(transformedInvoice);
            setPreviewData({
                totalAmount: 0,
                amountGiven: 0,
                change: 0,
            });
            setShowActions(false);
            setIsLocked(true);

            toast({
                title: "Transaction Successful",
                description: `Invoice ${response.invoiceNumber} created successfully`,
                variant: "default",
            });
        } catch (error) {
            console.error("❌ Transaction failed:", error);

            const isInsufficientStock =
                error.response?.data?.error === "Insufficient stock" || (error.message && error.message.includes("Insufficient stock"));

            if (isInsufficientStock) {
                console.log("📦 Insufficient stock detected - handled by TransactionForm");
            } else {
                setErrorMessage(error.message || "Transaction failed");
                toast({
                    title: "Transaction Failed",
                    description: error.message || "Please try again",
                    variant: "destructive",
                });
            }

            throw error;
        } finally {
            setIsSubmitting(false);
            setIsProcessingAfterConfirm(false);
        }
    };

    const handleConfirmTransaction = async () => {
        setIsProcessingAfterConfirm(true);
        setShowUnclaimedDialog(false);

        if (pendingPayload) {
            try {
                await processTransaction(pendingPayload);
            } catch (error) {
            }
        }
        setPendingPayload(null);
        setUnclaimedItems([]);
    };

    const handleCancelTransaction = () => {
        setShowUnclaimedDialog(false);
        setPendingPayload(null);
        setUnclaimedItems([]);
        setIsSubmitting(false);
    };

    const handleStartNew = () => {
        setInvoice(null);
        setPreviewData({
            totalAmount: 0,
            amountGiven: 0,
            change: 0,
        });
        setShowActions(false);
        setShowClaimingStub(false);
        setErrorMessage(null);
        setIsLocked(false);
        setIsProcessingAfterConfirm(false);
        formRef.current?.resetForm();
    };

    const handleCancel = () => {
        setShowActions(false);
        setErrorMessage(null);
    };

    const handlePreviewChange = (data) => {
        setPreviewData((prev) => ({
            ...prev,
            ...data,
        }));
    };

    const handlePrintClaimingStub = () => {
        const handleBeforePrint = () => {
            document.body.classList.add("print-mode", "print-claiming-stub");
        };
        
        const handleAfterPrint = () => {
            document.body.classList.remove("print-mode", "print-claiming-stub");
            setShowClaimingStub(false);
            setShowActions(true);
        };

        window.addEventListener("beforeprint", handleBeforePrint);
        window.addEventListener("afterprint", handleAfterPrint);

        window.print();

        setTimeout(() => {
            window.removeEventListener("beforeprint", handleBeforePrint);
            window.removeEventListener("afterprint", handleAfterPrint);
        }, 1000);
    };

    const handleSkipClaimingStub = () => {
        setShowClaimingStub(false);
        setShowActions(true);
    };

    const FloatingPreview = () => {
        const { totalAmount = 0, amountGiven = 0, change = 0 } = previewData;
        const isPaid = amountGiven > 0;
        const isUnderpaid = isPaid && change < 0;
        const isOverpaid = isPaid && change > 0;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="fixed bottom-6 right-6 z-40 w-64 rounded-xl border-2 p-4 shadow-2xl lg:absolute lg:bottom-6 lg:right-6"
                style={{
                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                }}
            >
                <div className="mb-3 flex items-center gap-2">
                    <Calculator
                        className="h-4 w-4"
                        style={{ color: isDarkMode ? "#60a5fa" : "#2563eb" }}
                    />
                    <h3
                        className="text-sm font-semibold"
                        style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                    >
                        Live Total Preview
                    </h3>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span style={{ color: isDarkMode ? "#cbd5e1" : "#64748b" }}>Total:</span>
                        <div
                            className="flex items-center gap-1 font-semibold"
                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                        >
                            <span>₱</span>
                            <span>{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span style={{ color: isDarkMode ? "#cbd5e1" : "#64748b" }}>Given:</span>
                        <div
                            className="flex items-center gap-1 font-semibold"
                            style={{ color: isDarkMode ? "#f1f5f9" : "#0f172a" }}
                        >
                            <span>₱</span>
                            <span>{amountGiven.toFixed(2)}</span>
                        </div>
                    </div>

                    {isPaid && (
                        <div
                            className="flex items-center justify-between border-t pt-2"
                            style={{ borderColor: isDarkMode ? "#334155" : "#e2e8f0" }}
                        >
                            <span style={{ color: isDarkMode ? "#cbd5e1" : "#64748b" }}>Change:</span>
                            <div
                                className={`flex items-center gap-1 font-semibold ${
                                    isUnderpaid ? "text-red-500" : isOverpaid ? "text-green-500" : isDarkMode ? "text-slate-300" : "text-slate-700"
                                }`}
                            >
                                <span>{change < 0 ? "-₱" : "₱"}</span>
                                <span>{Math.abs(change).toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {isUnderpaid && (
                    <div
                        className="mt-2 flex items-center gap-1 rounded p-2 text-xs"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            border: `1px solid ${isDarkMode ? "#ef4444" : "#ef4444"}`,
                        }}
                    >
                        <AlertTriangle size={12} />
                        <span>Amount given is less than total</span>
                    </div>
                )}

                <div
                    className="mt-2 flex items-center gap-1 text-xs"
                    style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
                >
                    <Eye size={12} />
                    <span>Updates as you type</span>
                </div>
            </motion.div>
        );
    };

    const ClaimingStub = () => {
        if (!invoice) return null;

        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            return isNaN(date)
                ? "Invalid Date"
                : date.toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                });
        };

        return (
            <div className="printable-area">
                <div className="mx-auto max-w-xs space-y-1 rounded border border-dashed border-gray-300 bg-white p-2 font-mono text-xs shadow-md receipt-optimized">
                    <div className="text-center store-header">
                        <div className="text-sm font-bold uppercase text-gray-900 header-title">
                            {invoice.formatSettings?.storeName || "STARWASH LAUNDRY"}
                        </div>
                        <div className="text-[9px] text-gray-600 header-info">CLAIMING STUB</div>
                    </div>

                    <hr className="my-1 border-gray-300 divider" />

                    <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between">
                            <span className="text-gray-700 label">Invoice #:</span>
                            <span className="font-bold text-gray-900 value-bold">{invoice.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-700 label">Customer:</span>
                            <span className="font-bold text-gray-900 value-bold">{invoice.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-700 label">Loads:</span>
                            <span className="font-bold text-gray-900 value-bold">{invoice.loads}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-700 label">Issue Date:</span>
                            <span className="font-bold text-gray-900 value-bold">{formatDate(invoice.issueDate)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-700 label">Due Date:</span>
                            <span className="font-bold text-gray-900 value-bold">{formatDate(invoice.dueDate)}</span>
                        </div>
                    </div>

                    <hr className="my-1 border-gray-300 divider" />

                    <div className="rounded bg-yellow-50 p-1 text-[9px] terms-section">
                        <div className="font-bold text-gray-900 section-title">IMPORTANT</div>
                        <p className="text-gray-700 terms-text">
                            Present this stub when claiming your laundry. Keep this stub safe.
                        </p>
                    </div>

                    <div className="mt-1 text-center text-[8px] text-gray-600 footer">
                        {invoice.formatSettings?.footerNote || "Thank you for your business!"}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="px-6 pb-5 pt-4 overflow-hidden" style={{
            backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
        }}>
            <div className="mb-6">
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                    <TransactionForm
                        ref={formRef}
                        onSubmit={handleSubmit}
                        onPreviewChange={handlePreviewChange}
                        isSubmitting={isSubmitting || isCheckingLaundry || isProcessingAfterConfirm}
                        isLocked={isLocked}
                    />

                    {!invoice &&
                        previewData &&
                        typeof previewData.totalAmount === "number" &&
                        typeof previewData.amountGiven === "number" &&
                        typeof previewData.change === "number" && (
                            <TotalPreviewCard
                                amount={previewData.totalAmount}
                                amountGiven={previewData.amountGiven}
                                change={previewData.change}
                            />
                        )}

                    {invoice && !showClaimingStub && (
                        <ServiceInvoiceCard
                            transaction={invoice}
                            settings={invoice.formatSettings}
                        />
                    )}

                    {invoice && showClaimingStub && <ClaimingStub />}
                </div>
            </div>

            {!invoice && previewData && previewData.totalAmount > 0 && <FloatingPreview />}

            {showClaimingStub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="relative z-50 w-full max-w-md mx-4 rounded-xl border-2 p-6 shadow-xl transition-all"
                        style={{
                            borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                            backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                        }}
                    >
                        <div className="text-center text-base font-semibold mb-4" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                            Print Claiming Stub
                        </div>
                        <Separator className="mb-4" style={{ backgroundColor: isDarkMode ? '#334155' : '#cbd5e1' }} />
                        
                        <div className="text-center mb-6" style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
                            <p className="text-sm mb-4">Would you like to print the claiming stub?</p>
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg inline-block">
                                <ClaimingStub />
                            </div>
                        </div>

                        <div className="flex justify-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={handleSkipClaimingStub}
                                className="flex items-center gap-2 text-sm font-medium"
                                style={{ 
                                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                    backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.3)' : 'rgba(11, 43, 38, 0.1)',
                                }}
                            >
                                <XCircle className="h-4 w-4" />
                                Skip
                            </Button>
                            <Button
                                onClick={handlePrintClaimingStub}
                                className="flex items-center gap-2 text-sm font-medium"
                                style={{ 
                                    backgroundColor: isDarkMode ? '#0f172a' : '#0f172a',
                                    color: '#f1f5f9'
                                }}
                            >
                                <Printer className="h-4 w-4" />
                                Print Stub
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {showActions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={handleCancel}
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="relative z-50 w-full max-w-sm rounded-xl border-2 p-6 shadow-xl transition-all print:hidden"
                        style={{
                            borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                            backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                        }}
                    >
                        <div className="text-center text-base font-semibold mb-4" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                            Transaction Complete
                        </div>
                        <Separator className="mb-4" style={{ backgroundColor: isDarkMode ? '#334155' : '#cbd5e1' }} />
                        <div className="flex justify-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={handleStartNew}
                                className="flex items-center gap-2 text-sm font-medium"
                                style={{ 
                                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                    backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.3)' : 'rgba(11, 43, 38, 0.1)',
                                }}
                            >
                                <RotateCcw className="h-4 w-4" />
                                Start New
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleCancel}
                                className="flex items-center gap-2 text-sm font-medium"
                                style={{ 
                                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                    backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.3)' : 'rgba(11, 43, 38, 0.1)',
                                }}
                            >
                                <XCircle className="h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {showUnclaimedDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={handleCancelTransaction}
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="relative z-50 w-full max-w-md mx-4"
                    >
                        <Card style={{
                            borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                            backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF'
                        }}>
                            <CardHeader className="flex flex-row items-center pb-4">
                                <AlertTriangle className="h-5 w-5 mr-2" style={{ color: isDarkMode ? '#fbbf24' : '#f59e0b' }} />
                                <CardTitle className="text-lg" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                    Unclaimed Laundry Found
                                </CardTitle>
                            </CardHeader>
                            
                            <CardContent>
                                <div style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }} className="text-sm">
                                    <p>
                                        <strong>{pendingPayload?.customerName}</strong> has {unclaimedItems.length} unclaimed laundry item(s):
                                    </p>
                                    
                                    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                                        {unclaimedItems.map((item, index) => (
                                            <div 
                                                key={item.id || index}
                                                className="p-2 rounded text-xs"
                                                style={{
                                                    backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.3)' : 'rgba(241, 245, 249, 0.5)',
                                                    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
                                                }}
                                            >
                                                <div className="font-medium">{item.serviceName}</div>
                                                <div>Invoice: {item.invoiceNumber}</div>
                                                <div>Loads: {item.loads} • ₱{item.totalPrice?.toFixed(2)}</div>
                                                <div className="text-xs opacity-75">
                                                    Created: {new Date(item.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <p className="mt-3">
                                        Do you want to continue creating a new transaction?
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={handleCancelTransaction}
                                        className="flex items-center gap-2"
                                        style={{
                                            borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                                            color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                        }}
                                        disabled={isProcessingAfterConfirm}
                                    >
                                        <X className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleConfirmTransaction}
                                        className="flex items-center gap-2"
                                        style={{
                                            backgroundColor: isProcessingAfterConfirm 
                                                ? (isDarkMode ? '#374151' : '#9ca3af') 
                                                : (isDarkMode ? '#0f172a' : '#0f172a'),
                                            color: '#f1f5f9'
                                        }}
                                        disabled={isProcessingAfterConfirm}
                                    >
                                        {isProcessingAfterConfirm ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4" />
                                                Continue Anyway
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default MainPage;