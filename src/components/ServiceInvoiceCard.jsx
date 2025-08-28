import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import QR from "qrcode";
import { Printer } from "lucide-react";

const ServiceInvoiceCard = ({ transaction, settings }) => {
  if (!transaction || !settings) return null;

  const {
    invoiceNumber,
    transactionId,
    issueDate,
    dueDate,
    customerName,
    contact,
    staffName,
    amountGiven = 0,
    change = 0,
    paymentMethod,
    totalPrice,
    loads = 0,
    serviceName = "",
    servicePrice = 0,
    consumables = [],
  } = transaction;

  const formatCurrency = (value) =>
    typeof value === "number" ? `₱${value.toFixed(2)}` : "₱0.00";

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date)
      ? "Invalid Date"
      : date.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  };

  const qrValue =
    settings.trackingUrl && (invoiceNumber || transactionId)
      ? settings.trackingUrl.includes("{id}")
        ? settings.trackingUrl.replace("{id}", invoiceNumber || transactionId)
        : `http://localhost:3000/track/${invoiceNumber || transactionId}`
      : null;

  if (qrValue) {
    console.log("[QR Destination]", qrValue);
  }

  const [qrImage, setQrImage] = useState(null);

  useEffect(() => {
    if (qrValue) {
      QR.toDataURL(qrValue, { width: 128 }, (err, url) => {
        if (!err) setQrImage(url);
      });
    }
  }, [qrValue]);

  const consumableTotal = consumables.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );

  const loadsTotal = loads * servicePrice;
  const computedTotal = consumableTotal + loadsTotal;
  const finalTotal = totalPrice != null ? totalPrice : computedTotal;

  return (
    <div className="printable-area">
      <div className="mx-auto max-w-md space-y-2 rounded-md border border-dashed bg-white p-4 font-mono text-sm shadow-md dark:border-gray-600 dark:bg-slate-950">
        {/* 🏪 Store Info */}
        <div className="text-center text-lg font-bold dark:text-white">
          {settings.storeName}
        </div>
        <div className="text-center dark:text-gray-300">{settings.address}</div>
        <div className="text-center dark:text-gray-300">{settings.phone}</div>

        <hr className="my-2 border-gray-300 dark:border-gray-600" />

        {/* 📄 Invoice Meta */}
        <div className="grid grid-cols-2 gap-1 text-xs dark:text-gray-300">
          <div>
            Service Invoice #:{" "}
            <span className="font-bold">{invoiceNumber || transactionId}</span>
          </div>
          <div className="text-right">
            Date: <span className="font-bold">{formatDate(issueDate)}</span>
          </div>
          <div>
            Customer: <span className="font-bold">{customerName}</span>
          </div>
          <div className="text-right">
            Contact: <span className="font-bold">{contact || "—"}</span>
          </div>
          <div>
            Staff: <span className="font-bold">{staffName}</span>
          </div>
          <div className="text-right">
            Payment: <span className="font-bold">{paymentMethod}</span>
          </div>
          <div className="col-span-2 flex justify-between">
            <span>Due Date to Claim:</span>
            <span className="font-bold text-red-600 dark:text-red-400">
              {formatDate(dueDate)}
            </span>
          </div>
          <div className="col-span-2 flex justify-between">
            <span>Service Type:</span>
            <span className="font-bold">
              {serviceName || "—"}{" "}
              {servicePrice ? `(${formatCurrency(servicePrice)} per load)` : ""}
            </span>
          </div>
        </div>

        <hr className="my-2 border-gray-300 dark:border-gray-600" />

        {/* 📋 Itemized Breakdown */}
        <div className="space-y-1 dark:text-white">
          {consumables.map((item) => (
            <div key={item.name} className="flex justify-between">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>
                {formatCurrency((item.price || 0) * (item.quantity || 0))}
              </span>
            </div>
          ))}
          <div className="flex justify-between">
            <span>Loads × {loads}</span>
            <span>{formatCurrency(loadsTotal)}</span>
          </div>
        </div>

        <hr className="my-2 border-gray-300 dark:border-gray-600" />

        {/* 💰 Total */}
        <div className="flex justify-between font-bold dark:text-white">
          <span>Total</span>
          <span>{formatCurrency(finalTotal)}</span>
        </div>

        {/* 💳 Payment Summary */}
        <hr className="my-2 border-gray-300 dark:border-gray-600" />
        <div className="flex justify-between dark:text-white">
          <span>Amount Given</span>
          <span>{formatCurrency(amountGiven)}</span>
        </div>
        <div className="flex justify-between dark:text-white">
          <span>Change</span>
          <span>{formatCurrency(change)}</span>
        </div>

        {/* 📜 Terms & Conditions */}
        <hr className="my-2 border-gray-300 dark:border-gray-600" />
        <div className="mt-2 text-xs text-slate-600 dark:text-gray-300">
          <strong className="mb-1 block text-sm text-slate-700 dark:text-slate-200">
            Terms & Conditions
          </strong>
          <p>
            Laundry must be claimed within 7 days. Unclaimed items may be
            subject to disposal or storage fees. Please retain your invoice for
            verification.
          </p>
        </div>

        {/* 📱 QR Code + Footer */}
        {qrValue && (
          <>
            {/* Screen-only SVG */}
            <div className="mt-3 flex justify-center print:hidden">
              <QRCode value={qrValue} size={64} />
            </div>

            {/* Print-only PNG fallback */}
            {qrImage && (
              <div className="mt-3 hidden justify-center print:flex">
                <img
                  src={qrImage}
                  alt="QR Code"
                  style={{
                    width: "64px",
                    height: "64px",
                    margin: "8px auto",
                  }}
                />
              </div>
            )}

            <div className="mt-1 text-center text-xs dark:text-gray-300 print:hidden">
              Scan to track your laundry status
            </div>
          </>
        )}

        <div className="mt-2 text-center text-xs dark:text-gray-300">
          {settings.footerNote}
        </div>

        {/* 🖨️ Print Button */}
        <div className="mt-4 text-center print:hidden">
          <button
            aria-label="Print invoice"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-white shadow-md transition-transform hover:scale-105 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Printer size={16} />
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceInvoiceCard;