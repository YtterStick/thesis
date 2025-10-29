import { useRef, useState, useEffect } from "react";
import TransactionForm from "./TransactionForm";
import ServiceInvoiceCard from "@/components/ServiceInvoiceCard";
import TotalPreviewCard from "@/components/TotalPreviewCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, XCircle } from "lucide-react";
import { api } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";

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

    const handleSubmit = async (payload) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const response = await api.post("api/transactions", payload);
            console.log("🧾 Invoice saved:", response.invoiceNumber);

            const staffId = localStorage.getItem("staffId");

            setInvoice({
                ...payload,
                invoiceNumber: response.invoiceNumber,
                formatSettings: response.formatSettings || {},
                staffId: staffId || "Unknown",
            });

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
            
            // Handle insufficient stock errors specifically
            if (error.message && error.message.includes("Insufficient stock")) {
                setErrorMessage(error.message);
                toast({
                    title: "Insufficient Stock",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
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
        }
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
        <div className="space-y-6 px-6 pb-5 pt-4 overflow-visible" style={{
            backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
        }}>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                <TransactionForm
                    ref={formRef}
                    onSubmit={handleSubmit}
                    onPreviewChange={handlePreviewChange}
                    isSubmitting={isSubmitting}
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
                    <div className="space-y-4">
                        <ServiceInvoiceCard
                            transaction={invoice}
                            settings={invoice.formatSettings}
                        />
                    </div>
                )}
            </div>

            {errorMessage && (
                <div className="mt-6 text-sm" style={{ color: isDarkMode ? '#F87171' : '#DC2626' }}>
                    ❌ {errorMessage}
                </div>
            )}

            {showActions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
                    <div className="w-full max-w-sm space-y-4 rounded-xl border-2 p-6 transition-all"
                         style={{
                             borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                             backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                         }}>
                        <div className="text-center text-base font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                            Transaction Complete
                        </div>
                        <Separator style={{ backgroundColor: isDarkMode ? '#334155' : '#cbd5e1' }} />
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainPage;