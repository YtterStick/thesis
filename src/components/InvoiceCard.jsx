import React from "react";
import QRCode from "react-qr-code";

const InvoiceCard = ({ invoice, settings }) => {
  if (!invoice || !settings) return null;

  const {
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
    return isNaN(date) ? "Invalid Date" : date.toLocaleDateString("en-PH", {
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

  const trackingUrl = invoiceNumber
    ? `http://localhost:3000/track/${invoiceNumber}`
    : null;

  const statusBadge = (
    <span
      className={`rounded px-2 py-1 text-xs font-bold uppercase ${
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
      <div className="mx-auto max-w-md space-y-2 rounded-md border border-dashed bg-white p-4 font-mono text-sm shadow-md dark:border-gray-600 dark:bg-muted">
        <div className="text-center text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {status === "Unpaid" ? "Unpaid Invoice" : "Sales Invoice"}
        </div>

        <div className="text-center text-lg font-bold dark:text-white">
          {settings.storeName}
        </div>
        <div className="text-center dark:text-gray-300">{settings.address}</div>
        <div className="text-center dark:text-gray-300">{settings.phone}</div>

        <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

        <div className="space-y-1 text-xs dark:text-gray-300">
          <div className="flex justify-between">
            <span>Invoice #: {invoiceNumber || "Pending"}</span>
            <span>Issued: {formatDate(issueDate)}</span>
          </div>
          <div className="flex justify-between">
            <span>Due: {formatDate(dueDate)}</span>
            {statusBadge}
          </div>
        </div>

        <div className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
          Payment due within 7 days of issue date.
        </div>

        <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

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
          <div className="mt-2 text-center text-xs italic text-yellow-600">
            This invoice is marked as <strong>Unpaid</strong>. Payment can be
            settled later.
          </div>
        )}

        {trackingUrl ? (
          <div className="mt-3 flex justify-center">
            <QRCode value={trackingUrl} size={64} />
          </div>
        ) : (
          <div className="mt-3 text-center text-xs text-red-500">
            Tracking unavailable — missing invoice number
          </div>
        )}
        <div className="mt-1 text-center text-xs dark:text-gray-300">
          Scan to track your laundry status
        </div>

        <div className="mt-2 text-center dark:text-gray-300">
          {settings.footerNote}
        </div>

        <div className="mt-4 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded bg-[#3DD9B6] px-4 py-2 text-white shadow-md transition-transform hover:scale-105 hover:bg-[#2fc3a4] dark:bg-[#007362] dark:hover:bg-[#00564e]"
          >
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCard;