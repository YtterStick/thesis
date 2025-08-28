import PropTypes from "prop-types";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";

const ServiceInvoicePreview = ({ invoice, settings }) => {
  if (!invoice || !settings) return null;

  const {
    invoiceNumber,
    issueDate,
    dueDate,
    customerName,
    staffName,
    detergentQty = 0,
    fabricQty = 0,
    plasticQty = 0,
    loads = 0,
    total = 0,
    transactionId,
    paymentMethod,
    amountGiven,
    change,
  } = invoice;

  const handlePrint = () => window.print();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime())
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
        : `${settings.trackingUrl}/${invoiceNumber || transactionId}`
      : null;

  return (
    <div className="bg-white dark:bg-slate-950 font-mono text-sm space-y-2 border border-dashed rounded-md dark:border-gray-600 print:border-gray-300 p-4 max-w-md mx-auto">
      {/* 🏪 Store Info */}
      <div className="text-center font-bold text-lg dark:text-white">{settings.storeName}</div>
      <div className="text-center dark:text-gray-300">{settings.address}</div>
      <div className="text-center dark:text-gray-300">{settings.phone}</div>

      <hr className="my-2 border-gray-300 dark:border-gray-600" />

      {/* 📄 Invoice Meta */}
      <div className="grid grid-cols-2 gap-1 text-xs dark:text-gray-300">
        <div>
          Service Invoice #: <span className="font-bold">{invoiceNumber || transactionId}</span>
        </div>
        <div className="text-right">
          Date: <span className="font-bold">{formatDate(issueDate)}</span>
        </div>
        <div>
          Customer: <span className="font-bold">{customerName}</span>
        </div>
        <div className="text-right">
          Staff: <span className="font-bold">{staffName}</span>
        </div>
        <div>
          Payment: <span className="font-bold">{paymentMethod}</span>
        </div>
      </div>

      <hr className="my-2 border-gray-300 dark:border-gray-600" />

      {/* 📋 Itemized Breakdown */}
      <div className="space-y-1 dark:text-white">
        <div className="flex justify-between">
          <span>Detergents × {detergentQty}</span>
          <span>₱{(detergentQty * 30).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Fabric Softeners × {fabricQty}</span>
          <span>₱{(fabricQty * 30).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Plastic × {plasticQty}</span>
          <span>₱{(plasticQty * 10).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Wash & Dry × {loads}</span>
          <span>₱{(loads * 50).toFixed(2)}</span>
        </div>
      </div>

      <hr className="my-2 border-gray-300 dark:border-gray-600" />

      {/* 💰 Total */}
      <div className="flex justify-between font-bold dark:text-white">
        <span>Total</span>
        <span>₱{total.toFixed(2)}</span>
      </div>

      {/* 💳 Payment Summary */}
      {typeof amountGiven === "number" && (
        <>
          <hr className="my-2 border-gray-300 dark:border-gray-600" />
          <div className="flex justify-between dark:text-white">
            <span>Amount Given</span>
            <span>₱{amountGiven.toFixed(2)}</span>
          </div>
          <div className="flex justify-between dark:text-white">
            <span>Change</span>
            <span>₱{change.toFixed(2)}</span>
          </div>
          {paymentMethod && (
            <div className="text-center text-xs mt-1 dark:text-gray-300">
              Payment Method: <strong>{paymentMethod}</strong>
            </div>
          )}
        </>
      )}

      {/* 📱 QR Code */}
      {qrValue && (
        <>
          <div className="flex justify-center mt-3 print:hidden">
            <QRCode value={qrValue} size={64} />
          </div>
          <div className="text-center mt-1 text-xs dark:text-gray-300 print:hidden">
            Scan to track your laundry status
          </div>
        </>
      )}

      {/* 🙏 Footer */}
      <div className="text-center mt-2 text-xs dark:text-gray-300">
        {settings.footerNote}
      </div>

      {/* 🖨️ Print Button */}
      <div className="text-center mt-4 print:hidden">
        <Button aria-label="Print invoice" onClick={handlePrint} className="bg-[#007362] hover:bg-[#00564e] text-white">
          <Printer size={16} className="mr-2" />
          Print Invoice
        </Button>
      </div>
    </div>
  );
};

ServiceInvoicePreview.propTypes = {
  invoice: PropTypes.object.isRequired,
  settings: PropTypes.object.isRequired,
};

export default ServiceInvoicePreview;