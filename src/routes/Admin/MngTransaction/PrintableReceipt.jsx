import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import QR from "qrcode";
import { Printer, X } from "lucide-react";

const PrintableReceipt = ({ invoiceData, onClose }) => {
    const [qrImage, setQrImage] = useState(null);

    if (!invoiceData) {
        return <div className="flex items-center justify-center p-4 text-gray-600 dark:text-gray-300">Loading receipt data...</div>;
    }

    // Use actual settings from backend or fallback to defaults
    const settings = invoiceData.formatSettings || {
        storeName: "STARWASH LAUNDRY",
        address: "123 Laundry Street, City, State 12345",
        phone: "Tel: (123) 456-7890",
        footerNote: "Thank you for your business!",
        trackingUrl: null,
    };

    // Map invoice data
    const transaction = {
        invoiceNumber: invoiceData.invoiceNumber,
        transactionId: invoiceData.invoiceNumber,
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        customerName: invoiceData.customerName,
        contact: invoiceData.contact,
        staffId: invoiceData.staffName || invoiceData.staffId,
        amountGiven: invoiceData.amountGiven || 0,
        change: invoiceData.change || 0,
        paymentMethod: invoiceData.paymentMethod,
        gcashReference: invoiceData.gcashReference,
        totalPrice: invoiceData.totalPrice,
        loads: invoiceData.service?.quantity || 0,
        serviceName: invoiceData.service?.name || "",
        servicePrice: invoiceData.service?.price || 0,
        consumables: invoiceData.consumables || [],
    };

    const {
        invoiceNumber,
        issueDate,
        dueDate,
        customerName,
        contact,
        staffId,
        amountGiven,
        change,
        paymentMethod,
        gcashReference,
        totalPrice,
        loads,
        serviceName,
        servicePrice,
        consumables,
    } = transaction;

    const formatCurrency = (value) => {
        const numValue = typeof value === "number" ? value : parseFloat(value) || 0;
        return `₱${numValue.toFixed(2)}`;
    };

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return isNaN(date)
                ? "Invalid Date"
                : date.toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                  });
        } catch (error) {
            return "Invalid Date";
        }
    };

    // QR Code logic - use actual tracking URL from settings
    const qrValue = settings.trackingUrl && invoiceNumber ? settings.trackingUrl.replace("{id}", invoiceNumber) : null;

    useEffect(() => {
        if (qrValue) {
            QR.toDataURL(qrValue, { width: 80 }, (err, url) => {
                if (!err) setQrImage(url);
            });
        }
    }, [qrValue]);

    const consumableTotal = consumables.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);

    const loadsTotal = loads * servicePrice;
    const finalTotal = totalPrice != null ? totalPrice : consumableTotal + loadsTotal;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="printable-area">
            {/* Close Button - Above the receipt */}
            <div className="mb-2 flex justify-end print:hidden">
                <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-white transition-colors hover:bg-gray-700"
                    title="Close receipt"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Compact Receipt */}
            <div className="mx-auto max-w-sm space-y-2 rounded border border-dashed border-gray-300 bg-white p-3 font-mono text-xs shadow-md dark:border-gray-600 dark:bg-slate-900">
                {/* Store Header - Using actual settings */}
                <div className="text-center">
                    <div className="text-base font-bold uppercase text-gray-900 dark:text-white">{settings.storeName}</div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-300">{settings.address}</div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-300">{settings.phone}</div>
                </div>

                <hr className="my-1 border-gray-300 dark:border-gray-600" />

                {/* Invoice Meta */}
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="text-gray-700 dark:text-gray-300">
                        Invoice #: <span className="font-bold text-gray-900 dark:text-white">{invoiceNumber}</span>
                    </div>
                    <div className="text-right text-gray-700 dark:text-gray-300">
                        Date: <span className="font-bold text-gray-900 dark:text-white">{formatDate(issueDate)}</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                        Customer: <span className="font-bold text-gray-900 dark:text-white">{customerName}</span>
                    </div>
                    <div className="text-right text-gray-700 dark:text-gray-300">
                        Contact: <span className="font-bold text-gray-900 dark:text-white">{contact || "—"}</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                        Staff: <span className="font-bold text-gray-900 dark:text-white">{staffId || "—"}</span>
                    </div>
                    <div className="text-right text-gray-700 dark:text-gray-300">
                        Payment: <span className="font-bold text-gray-900 dark:text-white">{paymentMethod}</span>
                    </div>

                    {paymentMethod === "GCash" && gcashReference && (
                        <div className="col-span-2 flex justify-between rounded bg-yellow-50 px-1 py-0.5 text-[9px] dark:bg-yellow-900/20">
                            <span className="text-gray-700 dark:text-gray-300">GCash Ref:</span>
                            <span className="font-mono text-gray-900 dark:text-white">{gcashReference}</span>
                        </div>
                    )}

                    <div className="col-span-2 flex justify-between text-[10px] font-bold text-red-600 dark:text-red-400">
                        <span>Due Date:</span>
                        <span>{formatDate(dueDate)}</span>
                    </div>
                </div>

                <hr className="my-1 border-gray-300 dark:border-gray-600" />

                {/* Service Details */}
                <div>
                    <div className="mb-0.5 text-[10px] font-bold uppercase text-gray-900 dark:text-white">Service Details</div>
                    <div className="space-y-0.5">
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>
                                {serviceName} × {loads}
                            </span>
                            <span className="text-gray-900 dark:text-white">{formatCurrency(loadsTotal)}</span>
                        </div>
                        {servicePrice > 0 && (
                            <div className="pl-1 text-[9px] text-gray-600 dark:text-gray-400">Rate: {formatCurrency(servicePrice)} per load</div>
                        )}
                    </div>
                </div>

                {/* Consumables */}
                {consumables.length > 0 && (
                    <div>
                        <div className="mb-0.5 text-[10px] font-bold uppercase text-gray-900 dark:text-white">Consumables</div>
                        <div className="space-y-0.5">
                            {consumables.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between text-gray-700 dark:text-gray-300"
                                >
                                    <span>
                                        {item.name} × {item.quantity}
                                    </span>
                                    <span className="text-gray-900 dark:text-white">{formatCurrency((item.price || 0) * (item.quantity || 0))}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <hr className="my-1 border-gray-300 dark:border-gray-600" />

                {/* Totals */}
                <div className="space-y-0.5">
                    <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                        <span>Total Amount:</span>
                        <span>{formatCurrency(finalTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-700 dark:text-gray-300">
                        <span>Amount Given:</span>
                        <span>{formatCurrency(amountGiven)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-700 dark:text-gray-300">
                        <span>Change:</span>
                        <span>{formatCurrency(change)}</span>
                    </div>
                </div>

                {/* Terms & Conditions */}
                <div className="mt-1 rounded bg-gray-100 p-1 text-[9px] dark:bg-slate-700">
                    <div className="mb-0.5 font-bold text-gray-900 dark:text-white">Terms & Conditions</div>
                    <p className="text-gray-700 dark:text-gray-300">
                        Laundry must be claimed within 7 days. Unclaimed items may be subject to disposal. Please retain your invoice for
                        verification.
                    </p>
                </div>

                {/* QR Code Section */}
                {qrValue && (
                    <div className="mt-1 text-center">
                        <div className="flex justify-center">
                            <div className="rounded border border-gray-300 bg-white p-1 dark:border-gray-600">
                                <QRCode
                                    value={qrValue}
                                    size={60}
                                />
                            </div>
                        </div>
                        <div className="mt-0.5 text-[9px] text-gray-600 dark:text-gray-400">Scan to track your laundry status</div>
                    </div>
                )}

                {/* Barcode */}
                <div className="mt-1 text-center">
                    <div className="barcode font-mono text-sm font-bold tracking-widest text-gray-900 dark:text-white">*{invoiceNumber}*</div>
                </div>

                {/* Footer - Using actual footer note from settings */}
                <div className="mt-1 border-t border-gray-300 pt-1 text-center text-[9px] text-gray-600 dark:border-gray-600 dark:text-gray-400">
                    {settings.footerNote}
                </div>
            </div>

            {/* Print Button */}
            <div className="mt-4 text-center print:hidden">
                <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                >
                    <Printer size={16} />
                    Print Receipt
                </button>
            </div>

            {/* Print Styles */}
            <style jsx>{`
                @media print {
                    @page {
                        margin: 0.1in;
                        size: auto;
                    }

                    body * {
                        visibility: hidden;
                    }

                    .printable-area,
                    .printable-area * {
                        visibility: visible;
                    }

                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }

                    /* Reset all dark mode styles for printing */
                    .dark\\:bg-slate-900,
                    .dark\\:text-white,
                    .dark\\:text-gray-300,
                    .dark\\:border-gray-600 {
                        background: white !important;
                        color: black !important;
                        border-color: #d1d5db !important;
                    }

                    /* Make sure everything fits on one page */
                    .max-w-sm {
                        max-width: 100% !important;
                        margin: 0 auto;
                    }

                    /* Hide buttons when printing */
                    .print\\:hidden {
                        display: none !important;
                    }

                    /* Increase text size slightly for print */
                    .text-xs {
                        font-size: 11px;
                    }
                    .text-\\[10px\\] {
                        font-size: 10px;
                    }
                    .text-\\[9px\\] {
                        font-size: 9px;
                    }

                    /* Ensure proper contrast for print */
                    .text-gray-600,
                    .text-gray-700,
                    .dark\\:text-gray-300,
                    .dark\\:text-gray-400 {
                        color: #4b5563 !important;
                    }

                    .text-gray-900,
                    .dark\\:text-white {
                        color: #000 !important;
                    }

                    /* Remove background colors for print */
                    .bg-yellow-50,
                    .dark\\:bg-yellow-900\\/20,
                    .bg-gray-100,
                    .dark\\:bg-slate-700 {
                        background: #f9fafb !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default PrintableReceipt;
