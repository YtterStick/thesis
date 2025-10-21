import { motion } from "framer-motion";
import { X, Printer, Download } from "lucide-react";
import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import QR from "qrcode";

const ViewReceipt = ({ 
  isVisible, 
  isDarkMode, 
  showReceiptOptions, 
  closeReceiptOptions, 
  handleDownloadReceipt, 
  receiptData 
}) => {
  const [qrImage, setQrImage] = useState(null);

  // Format currency
  const formatCurrency = (value) => {
    if (value == null) return "₱0.00";
    const numValue = typeof value === "number" ? value : parseFloat(value) || 0;
    return `₱${numValue.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime())
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

  // Generate QR code
  useEffect(() => {
    if (receiptData?.invoiceNumber) {
      const qrValue = `https://www.starwashph.com/?search=${encodeURIComponent(receiptData.invoiceNumber)}#service_tracking`;
      
      const generateQR = async () => {
        try {
          const url = await QR.toDataURL(qrValue, { width: 80 });
          setQrImage(url);
        } catch (err) {
          console.error("QR generation error:", err);
        }
      };

      generateQR();
    }
  }, [receiptData?.invoiceNumber]);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Calculate totals with proper null checks
  const calculateTotals = () => {
    if (!receiptData) return { consumableTotal: 0, loadsTotal: 0, finalTotal: 0 };

    const consumableTotal = (receiptData.consumables || []).reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0), 
      0
    );
    
    const servicePrice = receiptData.service?.price || 0;
    const loadsCount = receiptData.loads || 0;
    const loadsTotal = loadsCount * servicePrice;
    
    // Use 'total' field from receiptData, fallback to calculation
    const finalTotal = receiptData.total != null ? receiptData.total : consumableTotal + loadsTotal;

    return { consumableTotal, loadsTotal, finalTotal };
  };

  const { consumableTotal, loadsTotal, finalTotal } = calculateTotals();

  // Settings for receipt
  const settings = receiptData?.formatSettings || {
    storeName: "STARWASH LAUNDRY",
    address: "123 Laundry Street, City, State 12345",
    phone: "Tel: (123) 456-7890",
    footerNote: "Thank you for your business!",
  };

  // Don't render anything if not visible
  if (!showReceiptOptions) return null;

  return (
    <>
      {/* Receipt Modal - Now shows the actual receipt directly */}
      {showReceiptOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="mx-auto w-full max-w-sm printable-area">
            {/* Close Button */}
            <div className="mb-2 flex justify-end print:hidden">
              <button
                onClick={closeReceiptOptions}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-white transition-colors hover:bg-gray-700"
                title="Close receipt"
              >
                <X size={18} />
              </button>
            </div>

            {/* Compact Receipt */}
            <div className="mx-auto max-w-sm space-y-2 rounded border border-dashed border-gray-300 bg-white p-3 font-mono text-xs shadow-md">
              {/* Store Header */}
              <div className="text-center">
                <div className="text-base font-bold uppercase text-gray-900">{settings.storeName}</div>
                <div className="text-[10px] text-gray-600">{settings.address}</div>
                <div className="text-[10px] text-gray-600">{settings.phone}</div>
              </div>

              <hr className="my-1 border-gray-300" />

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div className="text-gray-700">
                  Invoice #: <span className="font-bold text-gray-900">{receiptData?.invoiceNumber || "—"}</span>
                </div>
                <div className="text-right text-gray-700">
                  Date: <span className="font-bold text-gray-900">{receiptData?.issueDate ? formatDate(receiptData.issueDate) : "—"}</span>
                </div>
                <div className="text-gray-700">
                  Customer: <span className="font-bold text-gray-900">{receiptData?.customerName || "—"}</span>
                </div>
                <div className="text-right text-gray-700">
                  Contact: <span className="font-bold text-gray-900">{receiptData?.contact || "—"}</span>
                </div>
                <div className="text-gray-700">
                  Staff: <span className="font-bold text-gray-900">{receiptData?.staffId || "—"}</span>
                </div>
                <div className="text-right text-gray-700">
                  Payment: <span className="font-bold text-gray-900">{receiptData?.paymentMethod || "—"}</span>
                </div>

                {receiptData?.paymentMethod === "GCash" && receiptData?.gcashReference && (
                  <div className="col-span-2 flex justify-between rounded bg-yellow-50 px-1 py-0.5 text-[9px]">
                    <span className="text-gray-700">GCash Ref:</span>
                    <span className="font-mono text-gray-900">{receiptData.gcashReference}</span>
                  </div>
                )}

                <div className="col-span-2 flex justify-between text-[10px] font-bold text-red-600">
                  <span>Due Date:</span>
                  <span>{receiptData?.dueDate ? formatDate(receiptData.dueDate) : "—"}</span>
                </div>
              </div>

              <hr className="my-1 border-gray-300" />

              {/* Service Details */}
              <div>
                <div className="mb-0.5 text-[10px] font-bold uppercase text-gray-900">Service Details</div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-gray-700">
                    <span>
                      {receiptData?.service?.name || "Service"}: {receiptData?.loads || 0}
                    </span>
                    <span className="text-gray-900">{formatCurrency(loadsTotal)}</span>
                  </div>
                  {(receiptData?.service?.price || 0) > 0 && (
                    <div className="pl-1 text-[9px] text-gray-600">
                      Rate: {formatCurrency(receiptData.service.price)} per load
                    </div>
                  )}
                </div>
              </div>

              {/* Consumables */}
              {receiptData?.consumables && receiptData.consumables.length > 0 && (
                <div>
                  <div className="mb-0.5 text-[10px] font-bold uppercase text-gray-900">Consumables</div>
                  <div className="space-y-0.5">
                    {receiptData.consumables.map((item, index) => (
                      <div key={index} className="flex justify-between text-gray-700">
                        <span>
                          {item.name}: {item.quantity || 0}
                        </span>
                        <span className="text-gray-900">
                          {formatCurrency((item.price || 0) * (item.quantity || 0))}
                        </span>
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
                  <span>{formatCurrency(receiptData?.amountGiven || 0)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Change:</span>
                  <span>{formatCurrency(receiptData?.change || 0)}</span>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="mt-1 rounded bg-gray-100 p-1 text-[9px]">
                <div className="mb-0.5 font-bold text-gray-900">Terms & Conditions</div>
                <p className="text-gray-700">
                  Laundry must be claimed within 7 days. Unclaimed items may be subject to disposal. Please retain your invoice for verification.
                </p>
              </div>

              {/* QR Code Section */}
              {receiptData?.invoiceNumber && (
                <div className="mt-1 text-center">
                  <div className="flex justify-center">
                    <div className="rounded border border-gray-300 bg-white p-1">
                      {/* Screen QR Code */}
                      <div className="print:hidden">
                        <QRCode
                          value={`https://www.starwashph.com/?search=${encodeURIComponent(receiptData.invoiceNumber)}#service_tracking`}
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

              {/* Footer */}
              <div className="mt-1 border-t border-gray-300 pt-1 text-center text-[9px] text-gray-600">
                {settings.footerNote}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex justify-center gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
              >
                <Printer size={16} />
                Print Receipt
              </button>

              <button
                onClick={handleDownloadReceipt}
                className="inline-flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700"
              >
                <Download size={16} />
                Download PDF
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

                .max-w-sm {
                  max-width: 100% !important;
                  margin: 0 auto;
                }

                .print\\:hidden {
                  display: none !important;
                }

                .text-xs {
                  font-size: 11px;
                }
                .text-\\[10px\\] {
                  font-size: 10px;
                }
                .text-\\[9px\\] {
                  font-size: 9px;
                }

                .text-gray-600,
                .text-gray-700 {
                  color: #4b5563 !important;
                }

                .text-gray-900 {
                  color: #000 !important;
                }

                .bg-yellow-50,
                .bg-gray-100 {
                  background: #f9fafb !important;
                }

                .hidden.print\\:block {
                  display: block !important;
                }
                .print\\:hidden {
                  display: none !important;
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewReceipt;