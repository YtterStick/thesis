import React, { useState, useRef } from "react";
import { Printer } from "lucide-react";

const ServiceReceiptCard = ({ transaction, settings, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const receiptRef = useRef();

  if (!transaction || !settings) return null;

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

  const completionDate = transaction.loadAssignments?.reduce((latest, load) => {
    if (load.endTime) {
      const loadDate = new Date(load.endTime);
      return !latest || loadDate > latest ? loadDate : latest;
    }
    return latest;
  }, null);

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 dark:bg-black dark:bg-opacity-80">
      <div className="mx-auto max-w-md bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg">
        <div ref={receiptRef} className="printable-area">
          <div className="mx-auto max-w-md space-y-2 rounded-md border border-dashed bg-white dark:bg-slate-950 p-4 font-mono text-sm shadow-md dark:border-gray-600">
            
            {/* Store Info */}
            <div className="text-center text-lg font-bold dark:text-white">
              {settings.storeName}
            </div>
            <div className="text-center dark:text-gray-300">{settings.address}</div>
            <div className="text-center dark:text-gray-300">{settings.phone}</div>

            <hr className="my-2 border-gray-300 dark:border-gray-600" />

            {/* Receipt Header */}
            <div className="text-center font-bold text-md dark:text-white">
              LAUNDRY CLAIM RECEIPT
            </div>

            {/* Receipt Meta */}
            <div className="grid grid-cols-2 gap-1 text-xs dark:text-gray-300">
              <div>
                Transaction #: <span className="font-bold">{transaction.transactionId}</span>
              </div>
              <div className="text-right">
                Claim Date: <span className="font-bold">{formatDate(new Date())}</span>
              </div>
              <div>
                Customer: <span className="font-bold">{transaction.customerName}</span>
              </div>
              <div className="text-right">
                Contact: <span className="font-bold">{transaction.contact || "—"}</span>
              </div>
              <div>
                Completed On: <span className="font-bold">{completionDate ? formatDate(completionDate) : "N/A"}</span>
              </div>
              <div className="text-right">
                Service: <span className="font-bold">{transaction.serviceType}</span>
              </div>
            </div>

            <hr className="my-2 border-gray-300 dark:border-gray-600" />

            {/* Service Details */}
            <div className="space-y-1 dark:text-white">
              <div className="flex justify-between">
                <span>Service Type:</span>
                <span className="font-bold">{transaction.serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span>Number of Loads:</span>
                <span className="font-bold">{transaction.loadAssignments?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold text-green-600">CLAIMED</span>
              </div>
            </div>

            <hr className="my-2 border-gray-300 dark:border-gray-600" />

            {/* Claim Confirmation */}
            <div className="mt-2 text-xs text-slate-600 dark:text-gray-300">
              <strong className="mb-1 block text-sm text-slate-700 dark:text-slate-200">
                Claim Confirmation
              </strong>
              <p>
                This receipt confirms that {transaction.customerName} has claimed their laundry on {formatDate(new Date())}.
                All items have been verified and released to the customer.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-2 text-center text-xs dark:text-gray-300">
              {settings.footerNote || "Thank you for your business!"}
            </div>
          </div>
        </div>

        {/* Print Button Only */}
        <div className="mt-4 flex justify-center print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-white shadow-md transition-transform hover:scale-105 hover:bg-blue-600"
            disabled={isPrinting}
          >
            <Printer size={16} />
            {isPrinting ? "Printing..." : "Print Receipt"}
          </button>
        </div>
      </div>

      {/* Print styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-area, .printable-area * {
              visibility: visible;
            }
            .printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ServiceReceiptCard;
