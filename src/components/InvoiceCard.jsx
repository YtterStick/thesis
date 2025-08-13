import React from "react";
import QRCode from "react-qr-code";

const InvoiceCard = ({ invoice, settings }) => {
  if (!invoice || !settings) return null;

  const {
    transactionId,
    invoiceNumber,
    issueDate,
    dueDate,
    customerName,
    contact,
    status,
    amountGiven,
    change,
    tax,
    total,
    service,
    consumables,
  } = invoice;

  const formatCurrency = (value) =>
    typeof value === "number" ? `₱${value.toFixed(2)}` : "₱0.00";

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateSubtotal = (price, quantity) =>
    typeof price === "number" && typeof quantity === "number"
      ? price * quantity
      : 0;

  const serviceSubtotal = calculateSubtotal(service?.price, service?.quantity);

  const consumablesTotal = Array.isArray(consumables)
    ? consumables.reduce(
        (sum, item) => sum + calculateSubtotal(item.price, item.quantity),
        0
      )
    : 0;

  const totalFromItems = serviceSubtotal + consumablesTotal;

  const trackingUrl =
    invoiceNumber && transactionId
      ? `http://localhost:3000/track/${transactionId}?invoice=${invoiceNumber}`
      : null;

  const statusBadge = (
    <span
      className={`px-2 py-1 rounded text-xs font-bold uppercase ${
        status === "Unpaid"
          ? "bg-red-100 text-red-600"
          : "bg-green-100 text-green-600"
      }`}
    >
      {status}
    </span>
  );

  return (
    <div className="printable-area">
      <div className="bg-white dark:bg-muted shadow-md rounded-md p-4 border border-dashed dark:border-gray-600 font-mono text-sm space-y-2 max-w-md mx-auto">
        {/* 🧾 Invoice Type Label */}
        <div className="text-center text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {status === "Unpaid" ? "Unpaid Invoice" : "Sales Invoice"}
        </div>

        {/* 🏪 Store Info */}
        <div className="text-center font-bold text-lg dark:text-white">
          {settings.storeName}
        </div>
        <div className="text-center dark:text-gray-300">{settings.address}</div>
        <div className="text-center dark:text-gray-300">{settings.phone}</div>

        <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

        {/* 📄 Invoice Metadata */}
        <div className="text-xs dark:text-gray-300 space-y-1">
          <div className="flex justify-between">
            <span>Invoice #: {invoiceNumber ?? "Not Assigned"}</span>
            <span>Issued: {formatDate(issueDate)}</span>
          </div>
          <div className="flex justify-between">
            <span>Due: {formatDate(dueDate)}</span>
            {statusBadge}
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
          Payment due within 7 days of issue date.
        </div>

        <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

        {/* 👤 Customer Info */}
        <div className="space-y-1 text-sm dark:text-white">
          <div className="flex justify-between">
            <span>Customer</span>
            <span>{customerName}</span>
          </div>
          <div className="flex justify-between">
            <span>Contact</span>
            <span>{contact}</span>
          </div>
        </div>

        <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

        {/* 📋 Itemized Breakdown */}
        <div className="space-y-1 dark:text-white">
          {service && (
            <div className="flex justify-between">
              <span>
                {service.name} × {service.quantity} loads
              </span>
              <span>{formatCurrency(serviceSubtotal)}</span>
            </div>
          )}

          {Array.isArray(consumables) &&
            consumables.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
        </div>

        <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

        {/* 💰 Totals */}
        <div className="flex justify-between dark:text-white">
          <span>Subtotal</span>
          <span>{formatCurrency(serviceSubtotal + consumablesTotal)}</span>
        </div>
        <div className="flex justify-between dark:text-white">
          <span>Tax</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between font-bold dark:text-white">
          <span>Total</span>
          <span>{formatCurrency(total ?? totalFromItems)}</span>
        </div>

        {/* 💳 Payment Info */}
        {typeof amountGiven === "number" && (
          <>
            <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />
            <div className="flex justify-between dark:text-white">
              <span>Amount Given</span>
              <span>{formatCurrency(amountGiven)}</span>
            </div>
            <div className="flex justify-between dark:text-white">
              <span>Change</span>
              <span>{formatCurrency(change)}</span>
            </div>
          </>
        )}

        {status === "Unpaid" && (
          <div className="text-yellow-600 text-xs italic text-center mt-2">
            This invoice is marked as <strong>Unpaid</strong>. Payment can be
            settled later.
          </div>
        )}

        {/* 📱 QR Code */}
        {trackingUrl && (
          <div className="flex justify-center mt-3 print:hidden">
            <QRCode value={trackingUrl} size={64} />
          </div>
        )}
        <div className="text-center mt-1 text-xs dark:text-gray-300 print:hidden">
          Scan to track your laundry status
        </div>

        {/* 📝 Footer Note */}
        <div className="text-center mt-2 dark:text-gray-300">
          {settings.footerNote}
        </div>

        {/* 🖨️ Print Button */}
        <div className="text-center mt-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-[#3DD9B6] text-white px-4 py-2 rounded hover:bg-[#2fc3a4] dark:bg-[#007362] dark:hover:bg-[#00564e] shadow-md transition-transform hover:scale-105"
          >
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCard;