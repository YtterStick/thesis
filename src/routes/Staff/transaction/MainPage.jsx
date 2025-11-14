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

    // Add state for unclaimed laundry dialog
    const [showUnclaimedDialog, setShowUnclaimedDialog] = useState(false);
    const [pendingPayload, setPendingPayload] = useState(null);
    const [unclaimedItems, setUnclaimedItems] = useState([]);
    const [isCheckingLaundry, setIsCheckingLaundry] = useState(false);
    // Add state to track if we're processing after confirmation
    const [isProcessingAfterConfirm, setIsProcessingAfterConfirm] = useState(false);
    
    // NEW: State for claiming stub
    const [showClaimingStub, setShowClaimingStub] = useState(false);

    useEffect(() => {
        const handlePrintStart = () => document.body.classList.add("print-mode");
        const handlePrintEnd = () => {
            document.body.classList.remove("print-mode");
            // NEW: Show claiming stub after invoice prints instead of transaction complete modal
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

    // Function to check for unclaimed laundry
    const checkUnclaimedLaundry = async (customerName, contact) => {
        try {
            // Get all records to check for unclaimed laundry
            const response = await api.get("/records");

            const currentTime = new Date();

            // Filter for unclaimed, non-expired, non-disposed laundry for this customer
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
            // Check for unclaimed laundry before submitting
            setIsCheckingLaundry(true);
            const unclaimedLaundry = await checkUnclaimedLaundry(payload.customerName, payload.contact);

            if (unclaimedLaundry.length > 0) {
                // Show confirmation dialog
                setUnclaimedItems(unclaimedLaundry);
                setPendingPayload(payload);
                setShowUnclaimedDialog(true);
                setIsSubmitting(false);
                setIsCheckingLaundry(false);
                return;
            }

            // No unclaimed laundry, proceed with transaction creation
            await processTransaction(payload);
        } catch (error) {
            console.error("Error checking unclaimed laundry:", error);
            // If check fails, proceed with submission
            await processTransaction(payload);
        } finally {
            setIsCheckingLaundry(false);
        }
    };

    const processTransaction = async (payload) => {
        try {
            // Get staffId from localStorage BEFORE making the API call
            const staffId = localStorage.getItem("staffId");

            // Include staffId in the payload
            const payloadWithStaff = {
                ...payload,
                staffId: staffId || "Unknown",
            };

            console.log("📝 Transaction payload staffId:", payloadWithStaff.staffId);

            const response = await api.post("/transactions", payloadWithStaff);
            console.log("🧾 Full backend response:", response);

            // DEBUG: Check what data is actually returned
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

            // FIXED: Transform the response to match ServiceInvoiceCard expectations
            const transformedInvoice = {
                // Core transaction data
                invoiceNumber: response.invoiceNumber,
                customerName: response.customerName,
                contact: response.contact,
                staffId: response.staffId || staffId || "Unknown",

                // Service data - handle both nested and flat structures
                serviceName: response.serviceName || (response.service && response.service.name) || "Service",
                servicePrice: response.servicePrice || (response.service && response.service.price) || 0,
                loads: response.loads || response.serviceQuantity || 1,

                // Financial data
                totalPrice: response.totalPrice,
                paymentMethod: response.paymentMethod,
                amountGiven: response.amountGiven || 0,
                change: response.change || 0,

                // Dates
                issueDate: response.issueDate,
                dueDate: response.dueDate,

                // Consumables - ensure it's always an array
                consumables: Array.isArray(response.consumables) ? response.consumables : [],

                // Settings - provide fallback
                formatSettings: response.formatSettings || {
                    storeName: "STARWASH LAUNDRY",
                    address: "123 Laundry Street, City, State 12345",
                    phone: "Tel: (123) 456-7890",
                    footerNote: "Thank you for your business!",
                },

                // Include the original response as fallback
                ...response,
            };

            // DEBUG: Final check before setting invoice
            console.log("🔍 FINAL CHECK - Does invoice have all required fields?", {
                hasInvoiceNumber: !!transformedInvoice.invoiceNumber,
                hasCustomerName: !!transformedInvoice.customerName,
                hasServiceName: !!transformedInvoice.serviceName,
                hasServicePrice: !!transformedInvoice.servicePrice,
                hasLoads: !!transformedInvoice.loads,
                hasTotalPrice: !!transformedInvoice.totalPrice,
                hasAmountGiven: transformedInvoice.amountGiven !== undefined,
                hasChange: transformedInvoice.change !== undefined,
                hasStaffId: !!transformedInvoice.staffId,
                hasConsumables: Array.isArray(transformedInvoice.consumables),
                hasFormatSettings: !!transformedInvoice.formatSettings,
                fullObject: transformedInvoice,
            });

            console.log("🎯 FINAL Transformed invoice for printing:", transformedInvoice);

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

            // Check if it's an insufficient stock error by looking at the response data
            const isInsufficientStock =
                error.response?.data?.error === "Insufficient stock" || (error.message && error.message.includes("Insufficient stock"));

            if (isInsufficientStock) {
                // Don't set error message and don't show toast for insufficient stock
                // TransactionForm will handle the visual display of insufficient items
                console.log("📦 Insufficient stock detected - handled by TransactionForm");
            } else {
                // For other errors, show the error message and toast
                setErrorMessage(error.message || "Transaction failed");
                toast({
                    title: "Transaction Failed",
                    description: error.message || "Please try again",
                    variant: "destructive",
                });
            }

            // Re-throw the error so TransactionForm can handle it specifically
            throw error;
        } finally {
            setIsSubmitting(false);
            setIsProcessingAfterConfirm(false);
        }
    };

    const handleConfirmTransaction = async () => {
        // Set processing state and close dialog immediately
        setIsProcessingAfterConfirm(true);
        setShowUnclaimedDialog(false);

        if (pendingPayload) {
            try {
                await processTransaction(pendingPayload);
            } catch (error) {
                // Error handled in processTransaction
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
        setShowClaimingStub(false); // NEW: Reset claiming stub state
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

    // NEW: Handle claiming stub print
    const handlePrintClaimingStub = () => {
        // Set up print event listeners
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

        // Trigger print
        window.print();

        // Clean up event listeners after a short delay
        setTimeout(() => {
            window.removeEventListener("beforeprint", handleBeforePrint);
            window.removeEventListener("afterprint", handleAfterPrint);
        }, 1000);
    };

    // NEW: Handle skip claiming stub
    const handleSkipClaimingStub = () => {
        setShowClaimingStub(false);
        setShowActions(true);
    };

    // Floating Preview Component
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

                {/* Warning for underpayment */}
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

    // NEW: Claiming Stub Component
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
                    {/* Store Header */}
                    <div className="text-center store-header">
                        <div className="text-sm font-bold uppercase text-gray-900 header-title">
                            {invoice.formatSettings?.storeName || "STARWASH LAUNDRY"}
                        </div>
                        <div className="text-[9px] text-gray-600 header-info">CLAIMING STUB</div>
                    </div>

                    <hr className="my-1 border-gray-300 divider" />

                    {/* Claiming Stub Details */}
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

                    {/* Important Notice */}
                    <div className="rounded bg-yellow-50 p-1 text-[9px] terms-section">
                        <div className="font-bold text-gray-900 section-title">IMPORTANT</div>
                        <p className="text-gray-700 terms-text">
                            Present this stub when claiming your laundry. Keep this stub safe.
                        </p>
                    </div>

                    {/* Footer */}
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
            {/* Main content with manual spacing - EXACTLY LIKE YOUR WORKING VERSION */}
            <div className="mb-6">
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                    {/* Left Column - Transaction Form */}
                    <TransactionForm
                        ref={formRef}
                        onSubmit={handleSubmit}
                        onPreviewChange={handlePreviewChange}
                        isSubmitting={isSubmitting || isCheckingLaundry || isProcessingAfterConfirm}
                        isLocked={isLocked}
                    />

                    {/* Right Column - Preview Cards */}
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

                    {/* FIXED: ServiceInvoiceCard rendered directly in grid - NOT hidden */}
                    {invoice && !showClaimingStub && (
                        <ServiceInvoiceCard
                            transaction={invoice}
                            settings={invoice.formatSettings}
                        />
                    )}

                    {/* NEW: Show claiming stub when needed */}
                    {invoice && showClaimingStub && <ClaimingStub />}
                </div>
            </div>

            {/* Floating Preview - Shows on all screens */}
            {!invoice && previewData && previewData.totalAmount > 0 && <FloatingPreview />}

            {/* NEW: Claiming Stub Modal - Shows after invoice prints */}
            {showClaimingStub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                    />
                    
                    {/* Modal Content */}
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

            {/* Transaction Complete Modal - Now only shows if claiming stub is skipped */}
            {showActions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={handleCancel}
                    />
                    
                    {/* Modal Content */}
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

            {/* Unclaimed Laundry Dialog */}
            {showUnclaimedDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={handleCancelTransaction}
                    />
                    
                    {/* Modal Content */}
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