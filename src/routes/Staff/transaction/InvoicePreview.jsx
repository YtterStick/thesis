import PropTypes from "prop-types";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";

const InvoicePreview = ({ invoice, settings }) => {
  if (!invoice || !settings) return null;

  const {
    invoiceNumber,
    issueDate,
    dueDate,
    customerName,
    items = [],
    subtotal = 0,
    tax = 0,
    discount = 0,
    total = 0,
    status,
    transactionId,
  } = invoice;

  const handlePrint = () => {
    window.print();
  };

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

  // ✅ Use invoiceNumber for QR tracking
  const qrValue =
    invoiceNumber && settings.trackingUrl
      ? `${settings.trackingUrl}/invoice/${invoiceNumber}`
      : settings.trackingUrl;

  return (
    <div className="bg-white dark:bg-muted shadow-md rounded-md p-4 border border-dashed dark:border-gray-600 font-mono text-sm space-y-2 max-w-md mx-auto">
      {/* 🏪 Store Info */}
      <div className="text-center font-bold text-lg dark:text-white">
        {settings.storeName}
      </div>
      <div className="text-center dark:text-gray-300">{settings.address}</div>
      <div className="text-center dark:text-gray-300">{settings.phone}</div>

      <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

      {/* 📄 Invoice Meta */}
      <div className="flex justify-between text-xs dark:text-gray-300">
        <span>Invoice #: {invoiceNumber ?? "Not Assigned"}</span>
        <span>Issued: {formatDate(issueDate)}</span>
      </div>
      <div className="flex justify-between text-xs dark:text-gray-300">
        <span>Due: {formatDate(dueDate)}</span>
        <span
          className={`font-bold uppercase ${
            status === "Unpaid" ? "text-red-600" : "text-green-600"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
        Payment due within 7 days of issue date.
      </div>

      <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

      {/* 👤 Customer Info */}
      <div className="text-sm dark:text-white">
        <span>Customer: {customerName}</span>
      </div>

      <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

      {/* 📋 Itemized Services */}
      <div className="space-y-1 dark:text-white">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span>{item.name}</span>
            <span>₱{item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

      {/* 💰 Totals */}
      <div className="flex justify-between dark:text-white">
        <span>Subtotal</span>
        <span>₱{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between dark:text-white">
        <span>Tax</span>
        <span>₱{tax.toFixed(2)}</span>
      </div>
      <div className="flex justify-between dark:text-white">
        <span>Discount</span>
        <span>-₱{discount.toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-bold dark:text-white">
        <span>Total</span>
        <span>₱{total.toFixed(2)}</span>
      </div>

      {/* 📱 QR Code + Footer */}
      {qrValue && (
        <div className="flex justify-center mt-3 print:hidden">
          <QRCode value={qrValue} size={64} />
        </div>
      )}
      <div className="text-center mt-1 text-xs dark:text-gray-300 print:hidden">
        Scan to track your laundry status
      </div>

      {settings.footerNote && (
        <div className="text-center mt-2 dark:text-gray-300">
          {settings.footerNote}
        </div>
      )}

      {/* 🖨️ Print Button */}
      <div className="text-center mt-4 print:hidden">
        <Button
          onClick={handlePrint}
          className="bg-[#007362] hover:bg-[#00564e] text-white"
        >
          <Printer size={16} className="mr-2" />
          Print Invoice
        </Button>
      </div>
    </div>
  );
};

InvoicePreview.propTypes = {
  invoice: PropTypes.object.isRequired,
  settings: PropTypes.object.isRequired,
};

export default InvoicePreview;