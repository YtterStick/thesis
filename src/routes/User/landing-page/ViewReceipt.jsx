import { motion } from "framer-motion";
import { X, Printer, FileText } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import QR from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const ViewReceipt = ({ 
  isVisible, 
  isDarkMode, 
  showReceiptOptions, 
  closeReceiptOptions, 
  handlePrintReceipt, 
  handleDownloadReceipt, 
  receiptData 
}) => {
  const [qrImage, setQrImage] = useState(null);
  const receiptRef = useRef(null);

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
          const url = await QR.toDataURL(qrValue, { width: 60 });
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

  // Download as PDF - EXACT copy of receipt appearance
  const downloadAsPDF = async () => {
    if (!receiptRef.current) return;

    try {
      // Capture the receipt as image
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3, // High resolution
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: receiptRef.current.scrollWidth,
        height: receiptRef.current.scrollHeight,
      });

      // Create PDF with exact receipt dimensions
      const imgWidth = 80; // mm - standard receipt width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [imgWidth, imgHeight]
      });

      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png');
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Download with receipt filename
      pdf.save(`receipt-${receiptData?.invoiceNumber || 'unknown'}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback: use the manual PDF creation
      createManualPDF();
    }
  };

  // Fallback manual PDF creation
  const createManualPDF = () => {
    if (!receiptData) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 297] // Standard receipt size
    });

    let yPosition = 5;

    // Store Header - Match your receipt style
    pdf.setFont("courier", "bold");
    pdf.setFontSize(10);
    pdf.text(settings.storeName, 40, yPosition, { align: "center" });
    yPosition += 4;

    pdf.setFont("courier", "normal");
    pdf.setFontSize(7);
    pdf.text(settings.address, 40, yPosition, { align: "center" });
    yPosition += 3;
    pdf.text(settings.phone, 40, yPosition, { align: "center" });
    yPosition += 5;

    // Separator line
    pdf.line(5, yPosition, 75, yPosition);
    yPosition += 3;

    // Invoice Details - Match your layout exactly
    pdf.setFontSize(8);
    pdf.text(`Invoice #: ${receiptData?.invoiceNumber || "—"}`, 5, yPosition);
    pdf.text(`Date: ${receiptData?.issueDate ? formatDate(receiptData.issueDate) : "—"}`, 45, yPosition);
    yPosition += 4;

    pdf.text(`Customer: ${receiptData?.customerName || "—"}`, 5, yPosition);
    pdf.text(`Contact: ${receiptData?.contact || "—"}`, 45, yPosition);
    yPosition += 4;

    pdf.text(`Staff: ${receiptData?.staffId || "—"}`, 5, yPosition);
    pdf.text(`Payment: ${receiptData?.paymentMethod || "—"}`, 45, yPosition);
    yPosition += 4;

    if (receiptData?.paymentMethod === "GCash" && receiptData?.gcashReference) {
      pdf.text(`GCash Ref: ${receiptData.gcashReference}`, 5, yPosition);
      yPosition += 4;
    }

    pdf.setFont("courier", "bold");
    pdf.setTextColor(255, 0, 0);
    pdf.text(`Due Date: ${receiptData?.dueDate ? formatDate(receiptData.dueDate) : "—"}`, 5, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 5;

    // Separator line
    pdf.line(5, yPosition, 75, yPosition);
    yPosition += 3;

    // Service Details
    pdf.setFont("courier", "bold");
    pdf.text("SERVICE DETAILS", 5, yPosition);
    yPosition += 4;

    pdf.setFont("courier", "normal");
    const serviceName = `${receiptData?.service?.name || "Service"}: ${receiptData?.loads || 0}`;
    pdf.text(serviceName, 5, yPosition);
    pdf.text(formatCurrency(loadsTotal), 70, yPosition, { align: "right" });
    yPosition += 3;

    if ((receiptData?.service?.price || 0) > 0) {
      pdf.setFontSize(7);
      pdf.text(`Rate: ${formatCurrency(receiptData.service.price)} per load`, 5, yPosition);
      yPosition += 3;
    }

    pdf.setFontSize(8);

    // Consumables
    if (receiptData?.consumables && receiptData.consumables.length > 0) {
      yPosition += 2;
      pdf.setFont("courier", "bold");
      pdf.text("CONSUMABLES", 5, yPosition);
      yPosition += 4;

      pdf.setFont("courier", "normal");
      receiptData.consumables.forEach((item) => {
        const itemText = `${item.name}: ${item.quantity || 0}`;
        pdf.text(itemText, 5, yPosition);
        pdf.text(formatCurrency((item.price || 0) * (item.quantity || 0)), 70, yPosition, { align: "right" });
        yPosition += 3;
      });
    }

    yPosition += 2;
    pdf.line(5, yPosition, 75, yPosition);
    yPosition += 3;

    // Totals
    pdf.setFont("courier", "bold");
    pdf.text("Total Amount:", 5, yPosition);
    pdf.text(formatCurrency(finalTotal), 70, yPosition, { align: "right" });
    yPosition += 4;

    pdf.setFont("courier", "normal");
    pdf.text("Amount Given:", 5, yPosition);
    pdf.text(formatCurrency(receiptData?.amountGiven || 0), 70, yPosition, { align: "right" });
    yPosition += 3;

    pdf.text("Change:", 5, yPosition);
    pdf.text(formatCurrency(receiptData?.change || 0), 70, yPosition, { align: "right" });
    yPosition += 6;

    // Terms & Conditions
    pdf.setFontSize(6);
    pdf.text("Terms & Conditions:", 5, yPosition);
    yPosition += 3;
    
    const termsText = "Laundry must be claimed within 7 days. Unclaimed items may be subject to disposal. Please retain your invoice for verification.";
    const splitTerms = pdf.splitTextToSize(termsText, 70);
    pdf.text(splitTerms, 5, yPosition);
    yPosition += 12;

    // QR Code
    if (qrImage) {
      pdf.addImage(qrImage, 'PNG', 30, yPosition, 20, 20);
      yPosition += 22;
      
      pdf.setFontSize(6);
      pdf.text("Scan to track your laundry status", 40, yPosition, { align: "center" });
      yPosition += 4;
    }

    // Footer
    pdf.setFontSize(6);
    pdf.text(settings.footerNote, 40, yPosition, { align: "center" });

    // Download
    pdf.save(`receipt-${receiptData?.invoiceNumber || 'unknown'}.pdf`);
  };

  // Calculate totals with proper null checks - UPDATED TO MATCH PrintableReceipt
  // Calculate totals with proper null checks - FIXED VERSION
const calculateTotals = () => {
    if (!receiptData) return { consumableTotal: 0, loadsTotal: 0, finalTotal: 0 };

    const consumableTotal = (receiptData.consumables || []).reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0), 
        0
    );
    
    const servicePrice = receiptData.service?.price || 0;
    const loadsCount = receiptData.loads || 0;
    const loadsTotal = loadsCount * servicePrice;
    
    // Use totalPrice if available, otherwise calculate from components
    const finalTotal = receiptData.totalPrice != null ? receiptData.totalPrice : 
                      receiptData.total != null ? receiptData.total : 
                      consumableTotal + loadsTotal;

    return { consumableTotal, loadsTotal, finalTotal };
};

const { consumableTotal, loadsTotal, finalTotal } = calculateTotals();

// Get amount given and change from receiptData (not from trackingData)
const amountGiven = receiptData?.amountGiven || 0;
const change = receiptData?.change || 0;

  const { consumableTotal, loadsTotal, finalTotal } = calculateTotals();

  // Settings for receipt - UPDATED TO MATCH PrintableReceipt STRUCTURE
  const settings = receiptData?.formatSettings || {
    storeName: "STAR WASH",
    address: "53 A Bonifacio Street, Sta Lucia, Novaliches",
    phone: "09150475513",
    footerNote: "Thank you for choosing Star Wash",
  };

  // Get amount given and change - UPDATED TO MATCH PrintableReceipt
  const amountGiven = receiptData?.amountGiven || 0;
  const change = receiptData?.change || 0;

  // Don't render anything if not visible
  if (!showReceiptOptions) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
        onClick={closeReceiptOptions}
      >
        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          {/* Modal Content */}
          <div 
            className="rounded-xl p-4"
            style={{
              backgroundColor: isDarkMode ? '#F3EDE3' : '#183D3D',
              borderColor: isDarkMode ? '#2A524C' : '#183D3D',
              color: isDarkMode ? '#13151B' : '#F3EDE3'
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeReceiptOptions}
              className="absolute right-3 top-3 z-10 transition-colors hover:opacity-70 print:hidden"
              style={{ color: isDarkMode ? '#13151B' : '#F3EDE3' }}
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Printable Receipt */}
            <div 
              ref={receiptRef}
              className="mx-auto max-w-xs space-y-1 rounded border border-dashed border-gray-300 bg-white p-2 font-mono text-xs shadow-md mb-4"
            >
              {/* Store Header */}
              <div className="text-center">
                <div className="text-sm font-bold uppercase text-gray-900">{settings.storeName}</div>
                <div className="text-[9px] text-gray-600">{settings.address}</div>
                <div className="text-[9px] text-gray-600">{settings.phone}</div>
              </div>

              <hr className="my-1 border-gray-300" />

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-1 text-[9px]">
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
                  <div className="col-span-2 flex justify-between rounded bg-yellow-50 px-1 py-0.5 text-[8px]">
                    <span className="text-gray-700">GCash Ref:</span>
                    <span className="font-mono text-gray-900">{receiptData.gcashReference}</span>
                  </div>
                )}

                <div className="col-span-2 flex justify-between text-[9px] font-bold text-red-600">
                  <span>Due Date:</span>
                  <span>{receiptData?.dueDate ? formatDate(receiptData.dueDate) : "—"}</span>
                </div>
              </div>

              <hr className="my-1 border-gray-300" />

              {/* Service Details */}
              <div>
                <div className="mb-0.5 text-[9px] font-bold uppercase text-gray-900">Service Details</div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-gray-700">
                    <span>
                      {receiptData?.service?.name || "Service"}: {receiptData?.loads || 0}
                    </span>
                    <span className="text-gray-900">{formatCurrency(loadsTotal)}</span>
                  </div>
                  {(receiptData?.service?.price || 0) > 0 && (
                    <div className="pl-1 text-[8px] text-gray-600">
                      Rate: {formatCurrency(receiptData.service.price)} per load
                    </div>
                  )}
                </div>
              </div>

              {/* Consumables */}
              {receiptData?.consumables && receiptData.consumables.length > 0 && (
                <div>
                  <div className="mb-0.5 text-[9px] font-bold uppercase text-gray-900">Consumables</div>
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

              {/* Totals - UPDATED TO MATCH PrintableReceipt */}
              <div className="space-y-0.5">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
                
                {/* Amount Given and Change - UPDATED TO MATCH PrintableReceipt */}
                {amountGiven > 0 && (
                  <>
                    <div className="flex justify-between text-[9px] text-gray-700">
                      <span>Amount Given:</span>
                      <span className="font-semibold">{formatCurrency(amountGiven)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-700">
                      <span>Change:</span>
                      <span className="font-semibold">{formatCurrency(change)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="mt-1 rounded bg-gray-100 p-1 text-[8px]">
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
                          size={50}
                        />
                      </div>
                      {/* Print QR Code */}
                      {qrImage && (
                        <div className="hidden print:block">
                          <img 
                            src={qrImage} 
                            alt="QR Code" 
                            className="h-[50px] w-[50px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-0.5 text-[8px] text-gray-600">
                    Scan to track your laundry status
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-1 border-t border-gray-300 pt-1 text-center text-[8px] text-gray-600">
                {settings.footerNote}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 print:hidden">
              <button
                onClick={handlePrint}
                className="w-full py-2 px-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-xs"
                style={{
                  backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3',
                  color: isDarkMode ? '#D5DCDB' : '#183D3D'
                }}
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              
              <button
                onClick={downloadAsPDF}
                className="w-full py-2 px-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-xs"
                style={{
                  backgroundColor: isDarkMode ? '#2A524C' : '#F3EDE3',
                  color: isDarkMode ? '#D5DCDB' : '#183D3D'
                }}
              >
                <FileText className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            margin: 0.05in;
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
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }

          .max-w-xs {
            max-width: 100% !important;
            margin: 0 auto;
          }

          .print\\:hidden {
            display: none !important;
          }

          .text-xs {
            font-size: 10px;
          }
          .text-\\[9px\\] {
            font-size: 8px;
          }
          .text-\\[8px\\] {
            font-size: 7px;
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
    </>
  );
};

export default ViewReceipt;