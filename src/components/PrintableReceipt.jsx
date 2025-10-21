import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import QR from "qrcode";
import { Printer, X } from "lucide-react";

const PrintableReceipt = ({ invoiceData, onClose }) => {
    const [qrImage, setQrImage] = useState(null);

    if (!invoiceData) {
        return <div className="flex items-center justify-center p-4 text-gray-600">Loading receipt data...</div>;
    }

    // Use actual settings from backend or fallback to defaults
    const settings = invoiceData.formatSettings || {
        storeName: "STARWASH LAUNDRY",
        address: "123 Laundry Street, City, State 12345",
        phone: "Tel: (123) 456-7890",
        footerNote: "Thank you for your business!",
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

    // FIXED: Simple tracking URL using invoice number
    const qrValue = invoiceNumber ? `https://www.starwashph.com/?search=${encodeURIComponent(invoiceNumber)}#service_tracking` : null;

    useEffect(() => {
        if (qrValue) {
            console.log("📱 QR Code will direct to:", qrValue);
            QR.toDataURL(qrValue, { width: 80 }, (err, url) => {
                if (!err) {
                    setQrImage(url);
                } else {
                    console.error("❌ QR Code generation error:", err);
                }
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
            <div className="mx-auto max-w-sm space-y-2 rounded border border-dashed border-gray-300 bg-white p-3 font-mono text-xs shadow-md">
                {/* Store Header - Using actual settings */}
                <div className="text-center">
                    <div className="text-base font-bold uppercase text-gray-900">{settings.storeName}</div>
                    <div className="text-[10px] text-gray-600">{settings.address}</div>
                    <div className="text-[10px] text-gray-600">{settings.phone}</div>
                </div>

                <hr className="my-1 border-gray-300" />

                {/* Invoice Meta */}
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="text-gray-700">
                        Invoice #: <span className="font-bold text-gray-900">{invoiceNumber}</span>
                    </div>
                    <div className="text-right text-gray-700">
                        Date: <span className="font-bold text-gray-900">{formatDate(issueDate)}</span>
                    </div>
                    <div className="text-gray-700">
                        Customer: <span className="font-bold text-gray-900">{customerName}</span>
                    </div>
                    <div className="text-right text-gray-700">
                        Contact: <span className="font-bold text-gray-900">{contact || "—"}</span>
                    </div>
                    <div className="text-gray-700">
                        Staff: <span className="font-bold text-gray-900">{staffId || "—"}</span>
                    </div>
                    <div className="text-right text-gray-700">
                        Payment: <span className="font-bold text-gray-900">{paymentMethod}</span>
                    </div>

                    {paymentMethod === "GCash" && gcashReference && (
                        <div className="col-span-2 flex justify-between rounded bg-yellow-50 px-1 py-0.5 text-[9px]">
                            <span className="text-gray-700">GCash Ref:</span>
                            <span className="font-mono text-gray-900">{gcashReference}</span>
                        </div>
                    )}

                    <div className="col-span-2 flex justify-between text-[10px] font-bold text-red-600">
                        <span>Due Date:</span>
                        <span>{formatDate(dueDate)}</span>
                    </div>
                </div>

                <hr className="my-1 border-gray-300" />

                {/* Service Details */}
                <div>
                    <div className="mb-0.5 text-[10px] font-bold uppercase text-gray-900">Service Details</div>
                    <div className="space-y-0.5">
                        <div className="flex justify-between text-gray-700">
                            <span>
                                {serviceName}: {loads}
                            </span>
                            <span className="text-gray-900">{formatCurrency(loadsTotal)}</span>
                        </div>
                        {servicePrice > 0 && (
                            <div className="pl-1 text-[9px] text-gray-600">Rate: {formatCurrency(servicePrice)} per load</div>
                        )}
                    </div>
                </div>

                {/* Consumables */}
                {consumables.length > 0 && (
                    <div>
                        <div className="mb-0.5 text-[10px] font-bold uppercase text-gray-900">Consumables</div>
                        <div className="space-y-0.5">
                            {consumables.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between text-gray-700"
                                >
                                    <span>
                                        {item.name}: {item.quantity}
                                    </span>
                                    <span className="text-gray-900">{formatCurrency((item.price || 0) * (item.quantity || 0))}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <hr className="my-1 border-gray-300" />

                {/* Totals */}
                <div className="space-y-0.5">
                    <div className="flex justify-between font-bold text-gray-900">
                        <span>Total Amount:</span>
                        <span>{formatCurrency(finalTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-700">
                        <span>Amount Given:</span>
                        <span>{formatCurrency(amountGiven)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-700">
                        <span>Change:</span>
                        <span>{formatCurrency(change)}</span>
                    </div>
                </div>

                {/* Terms & Conditions */}
                <div className="mt-1 rounded bg-gray-100 p-1 text-[9px]">
                    <div className="mb-0.5 font-bold text-gray-900">Terms & Conditions</div>
                    <p className="text-gray-700">
                        Laundry must be claimed within 7 days. Unclaimed items may be subject to disposal. Please retain your invoice for
                        verification.
                    </p>
                </div>

                {/* FIXED QR Code Section - Simple tracking URL */}
                {qrValue && (
                    <div className="mt-1 text-center">
                        <div className="flex justify-center">
                            <div className="rounded border border-gray-300 bg-white p-1">
                                {/* Screen QR Code */}
                                <div className="print:hidden">
                                    <QRCode
                                        value={qrValue}
                                        size={60}
                                    />
                                </div>
                                {/* Print QR Code */}
                                {qrImage && (
                                    <div className="hidden print:block">
                                        <img 
                                            src={qrImage} 
                                            alt="QR Code" 
                                            className="h-[60px] w-[60px]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-0.5 text-[9px] text-gray-600">
                            Scan to track your laundry status
                        </div>
                    </div>
                )}

                {/* Footer - Using actual footer note from settings */}
                <div className="mt-1 border-t border-gray-300 pt-1 text-center text-[9px] text-gray-600">
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

            {/* Print Styles - Kept exactly as before */}
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
                    .text-gray-700 {
                        color: #4b5563 !important;
                    }

                    .text-gray-900 {
                        color: #000 !important;
                    }

                    /* Remove background colors for print */
                    .bg-yellow-50,
                    .bg-gray-100 {
                        background: #f9fafb !important;
                    }

                    /* Ensure QR code is visible in print */
                    .hidden.print\\:block {
                        display: block !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default PrintableReceipt;