import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import TransactionForm from "./TransactionForm";
import ServiceInvoiceCard from "@/components/ServiceInvoiceCard";
import TotalPreviewCard from "@/components/TotalPreviewCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, XCircle, AlertTriangle, Check, X } from "lucide-react";
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

    useEffect(() => {
        const handlePrintStart = () => document.body.classList.add("print-mode");
        const handlePrintEnd = () => {
            document.body.classList.remove("print-mode");
            setShowActions(true);
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
            const response = await api.get("api/records");
            
            const currentTime = new Date();
            
            // Filter for unclaimed, non-expired, non-disposed laundry for this customer
            const unclaimedLaundry = response.filter(record => {
                const isSameCustomer = record.customerName?.toLowerCase() === customerName?.toLowerCase() &&
                                    record.contact === contact;
                
                const isUnclaimed = record.pickupStatus === "UNCLAIMED" || 
                                  record.pickupStatus === "Unclaimed";
                
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
                staffId: staffId || "Unknown"
            };

            console.log("📝 Transaction payload staffId:", payloadWithStaff.staffId);

            const response = await api.post("api/transactions", payloadWithStaff);
            console.log("🧾 Full backend response:", response);
            console.log("🔍 Response structure keys:", Object.keys(response));
            
            // Check what service data is in the response
            console.log("🛠️ Service data in response:", {
                serviceName: response.serviceName,
                service: response.service,
                servicePrice: response.servicePrice,
                loads: response.loads,
                serviceQuantity: response.serviceQuantity
            });

            // Transform the response to ensure proper structure for frontend
            const transformedInvoice = {
                // Use direct properties from response
                invoiceNumber: response.invoiceNumber,
                customerName: response.customerName,
                contact: response.contact,
                staffId: response.staffId,
                serviceName: response.serviceName,
                servicePrice: response.servicePrice,
                loads: response.loads || response.serviceQuantity || 1,
                totalPrice: response.totalPrice,
                paymentMethod: response.paymentMethod,
                amountGiven: response.amountGiven,
                change: response.change,
                issueDate: response.issueDate,
                dueDate: response.dueDate,
                consumables: response.consumables || [],
                formatSettings: response.formatSettings || {},
                
                // Include the original response as fallback
                ...response
            };

            console.log("🎯 Transformed invoice data:", {
                staffId: transformedInvoice.staffId,
                serviceName: transformedInvoice.serviceName,
                servicePrice: transformedInvoice.servicePrice,
                loads: transformedInvoice.loads,
                serviceQuantity: transformedInvoice.serviceQuantity
            });

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
            const isInsufficientStock = error.response?.data?.error === "Insufficient stock" || 
                                       (error.message && error.message.includes("Insufficient stock"));
            
            if (isInsufficientStock) {
                // Don't set error message and don't show toast for insufficient stock
                // TransactionForm will handle the visual display of insufficient items
                console.log("📦 Insufficient stock detected - handled by TransactionForm");
            } else {
                // For other errors, show the error message and toast
                setErrorMessage(error.message || "Transaction failed");
                toast({
                    title: "Insufficient stock",
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

    return (
        <div className="px-6 pb-5 pt-4 overflow-hidden" style={{
            backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
        }}>
            {/* Main content with manual spacing */}
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

                    {invoice && (
                        <div>
                            <ServiceInvoiceCard
                                transaction={invoice}
                                settings={invoice.formatSettings}
                            />
                        </div>
                    )}
                </div>
            </div>


            {/* Transaction Complete Modal */}
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