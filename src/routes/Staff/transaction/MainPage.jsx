import { useRef, useState, useEffect } from "react";
import TransactionForm from "./TransactionForm";
import ServiceInvoiceCard from "@/components/ServiceInvoiceCard";
import TotalPreviewCard from "@/components/TotalPreviewCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, XCircle } from "lucide-react";

const ALLOWED_SKEW_MS = 5000;

const isTokenExpired = (token) => {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        const exp = decoded.exp * 1000;
        const now = Date.now();
        return exp + ALLOWED_SKEW_MS < now;
    } catch (err) {
        console.warn("❌ Failed to decode token:", err);
        return true;
    }
};

const secureFetch = async (endpoint, method = "POST", body = null) => {
    const token = localStorage.getItem("authToken");
    if (!token || typeof token !== "string" || !token.includes(".") || isTokenExpired(token)) {
        window.location.href = "/login";
        throw new Error("Token expired or invalid");
    }

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`http://localhost:8080/api${endpoint}`, options);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed: ${response.status} - ${errorText}`);
    }
    return response.json();
};

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

    const handleSubmit = async (payload) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const response = await secureFetch("/transactions", "POST", payload);
            console.log("🧾 Invoice saved:", response.invoiceNumber);
            setInvoice({
                ...payload,
                invoiceNumber: response.invoiceNumber,
                formatSettings: response.formatSettings || {},
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
        <main className="bg-white p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
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

            {errorMessage && <div className="mt-6 text-sm text-red-600 dark:text-red-400">❌ {errorMessage}</div>}

            {showActions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm print:hidden">
                    <div className="w-full max-w-sm space-y-4 rounded-lg border border-slate-300 bg-white p-6 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                        <div className="text-center text-base font-semibold">Transaction Complete</div>
                        <Separator className="bg-slate-200 dark:bg-slate-700" />
                        <div className="flex justify-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={handleStartNew}
                                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Start New
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleCancel}
                                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400"
                            >
                                <XCircle className="h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default MainPage;
