import React from "react";
import QRCode from "react-qr-code";

const ReceiptCard = ({ transaction, settings }) => {
    if (!transaction || !settings) return null;

    const {
        transactionId,
        receiptCode,
        issueDate,
        customerName,
        contact,
        service,
        consumables,
        totalAmount,
        change,
        amountGiven,
        paymentStatus,
    } = transaction;

    const isPaid = paymentStatus === "Paid";

    const trackingUrl = receiptCode ? `http://localhost:3000/track/${receiptCode}` : null;
    console.log("🔍 QR Tracking URL:", trackingUrl);

    const formatCurrency = (value) => (typeof value === "number" ? `₱${value.toFixed(2)}` : "₱0.00");

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("en-PH", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return "Invalid Date";
        }
    };

    const calculateSubtotal = (price, quantity) =>
        typeof price === "number" && typeof quantity === "number" ? price * quantity : 0;

    const serviceSubtotal = calculateSubtotal(service?.price, service?.quantity);

    const consumablesTotal = Array.isArray(consumables)
        ? consumables.reduce((sum, item) => sum + calculateSubtotal(item.price, item.quantity), 0)
        : 0;

    const totalFromItems = serviceSubtotal + consumablesTotal;

    return (
        <div className="printable-area">
            <div className="mx-auto max-w-md space-y-2 rounded-md border border-dashed bg-white p-4 font-mono text-sm shadow-md dark:border-gray-600 dark:bg-muted">
                {/* 🧾 Receipt Label */}
                <div className="text-center text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Official Receipt</div>

                {/* 🏪 Store Info */}
                <div className="text-center text-lg font-bold dark:text-white">{settings.storeName}</div>
                <div className="text-center dark:text-gray-300">{settings.address}</div>
                <div className="text-center dark:text-gray-300">{settings.phone}</div>

                <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

                {/* 📄 Receipt Metadata */}
                <div className="space-y-1 text-xs dark:text-gray-300">
                    <div className="flex justify-between">
                        <span>Receipt #: {receiptCode ?? transactionId}</span>
                        <span>Issued: {formatDate(issueDate)}</span>
                    </div>
                    <div className="flex justify-end">
                        <span className="font-bold uppercase text-green-600">Paid</span>
                    </div>
                </div>

                <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

                {/* 👤 Customer Info */}
                <div className="space-y-1 dark:text-white">
                    <div className="flex justify-between">
                        <span>Name</span>
                        <span>{customerName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Contact</span>
                        <span>{contact}</span>
                    </div>
                </div>

                <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

                {/* 🧾 Transaction Details */}
                <div className="space-y-1 dark:text-white">
                    <div className="flex justify-between">
                        <span>Service</span>
                        <span>
                            {service?.name} — {formatCurrency(service?.price)} × {service?.quantity} loads
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Service Total</span>
                        <span>{formatCurrency(serviceSubtotal)}</span>
                    </div>

                    {Array.isArray(consumables) &&
                        consumables.map((item, index) => (
                            <div key={index} className="flex justify-between">
                                <span>
                                    {item.name} — {formatCurrency(item.price)} × {item.quantity}
                                </span>
                                <span>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        ))}
                </div>

                <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

                {/* 💰 Totals */}
                <div className="flex justify-between font-bold dark:text-white">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount ?? totalFromItems)}</span>
                </div>

                {isPaid && (
                    <>
                        <div className="flex justify-between dark:text-white">
                            <span>Amount Given</span>
                            <span>{formatCurrency(parseFloat(amountGiven))}</span>
                        </div>
                        <div className="flex justify-between dark:text-white">
                            <span>Change</span>
                            <span>{formatCurrency(change)}</span>
                        </div>
                    </>
                )}

                {/* 📱 QR Code */}
                {trackingUrl && (
                    <div className="mt-3 flex justify-center">
                        <QRCode value={trackingUrl} size={64} />
                    </div>
                )}
                <div className="mt-1 text-center text-xs dark:text-gray-300">
                    Scan to track your laundry status
                </div>

                {/* 📝 Footer Note */}
                <div className="mt-2 text-center dark:text-gray-300">{settings.footerNote}</div>

                {/* 🖨️ Print Button */}
                <div className="mt-4 text-center print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="rounded bg-[#3DD9B6] px-4 py-2 text-white shadow-md transition-transform hover:scale-105 hover:bg-[#2fc3a4] dark:bg-[#007362] dark:hover:bg-[#00564e]"
                    >
                        Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptCard;