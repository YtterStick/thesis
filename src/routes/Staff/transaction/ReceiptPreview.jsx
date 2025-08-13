import PropTypes from "prop-types";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";

const ReceiptPreview = ({ transaction }) => {
  const {
    name,
    contact,
    service,
    detergent,
    fabricSoftener,
    loads,
    plasticCount,
    totalAmount,
    amountGiven,
    change,
    receiptCode,
    settings,
  } = transaction;

  const handlePrint = () => {
    window.print();
  };

  const qrValue =
    receiptCode && settings?.trackingUrl
      ? `${settings.trackingUrl}/receipt/${receiptCode}`
      : settings?.trackingUrl;

  return (
    <div className="bg-white dark:bg-muted shadow-md rounded-md p-4 border border-dashed dark:border-gray-600 font-mono text-sm space-y-2 max-w-md mx-auto">
      {/* 🏪 Store Info */}
      {settings && (
        <>
          <div className="text-center font-bold text-lg dark:text-white">
            {settings.storeName}
          </div>
          <div className="text-center dark:text-gray-300">{settings.address}</div>
          <div className="text-center dark:text-gray-300">{settings.phone}</div>
          <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />
        </>
      )}

      {/* 📄 Receipt Metadata */}
      <div className="flex justify-between text-xs dark:text-gray-300">
        <span>Receipt #: {receiptCode ?? "Not Assigned"}</span>
        <span>Loads: {loads}</span>
      </div>

      {/* 👤 Customer Info */}
      <div className="space-y-1 dark:text-white">
        <div className="flex justify-between"><span>Name</span><span>{name}</span></div>
        <div className="flex justify-between"><span>Contact</span><span>{contact}</span></div>
        <div className="flex justify-between"><span>Service</span><span>{service}</span></div>
        <div className="flex justify-between"><span>Plastic Count</span><span>{plasticCount}</span></div>
        <div className="flex justify-between"><span>Detergent</span><span>{detergent} pcs</span></div>
        <div className="flex justify-between"><span>Fabric Softener</span><span>{fabricSoftener} pcs</span></div>
      </div>

      <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

      {/* 💰 Totals */}
      <div className="flex justify-between dark:text-white">
        <span>Total</span>
        <span>₱{totalAmount.toFixed(2)}</span>
      </div>
      <div className="flex justify-between dark:text-white">
        <span>Amount Given</span>
        <span>₱{parseFloat(amountGiven).toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-bold dark:text-white">
        <span>Change</span>
        <span>₱{change.toFixed(2)}</span>
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

      {settings?.footerNote && (
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
          Print Receipt
        </Button>
      </div>
    </div>
  );
};

ReceiptPreview.propTypes = {
  transaction: PropTypes.object.isRequired,
};

export default ReceiptPreview;