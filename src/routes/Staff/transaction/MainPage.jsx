import { useRef, useState, useEffect } from "react";
import TransactionForm from "./TransactionForm";
import ServiceInvoiceCard from "@/components/ServiceInvoiceCard";
import TotalPreviewCard from "@/components/TotalPreviewCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, XCircle } from "lucide-react";
import { api } from "@/lib/api-config"; // Import the api utility

const MainPage = () => {
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
            // Use the api utility directly for the POST request
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
        } catch (error) {
            console.error("❌ Transaction failed:", error);
            setErrorMessage(error.message || "Transaction failed");
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
        <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
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
                <div className="mt-6 text-sm text-red-600 dark:text-red-400">
                    ❌ {errorMessage}
                </div>
            )}

            {showActions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm print:hidden">
                    <div className="w-full max-w-sm space-y-4 rounded-xl border-2 p-6 transition-all"
                         style={{
                             borderColor: 'rgb(11, 43, 38)',
                             backgroundColor: 'rgb(243, 237, 227)',
                             color: 'rgb(11, 43, 38)'
                         }}>
                        <div className="text-center text-base font-semibold">Transaction Complete</div>
                        <Separator style={{ backgroundColor: 'rgb(11, 43, 38)' }} />
                        <div className="flex justify-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={handleStartNew}
                                className="flex items-center gap-2 text-sm font-medium hover:text-blue-600"
                                style={{ color: 'rgb(11, 43, 38)' }}
                            >
                                <RotateCcw className="h-4 w-4" />
                                Start New
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleCancel}
                                className="flex items-center gap-2 text-sm font-medium hover:text-red-600"
                                style={{ color: 'rgb(11, 43, 38)' }}
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