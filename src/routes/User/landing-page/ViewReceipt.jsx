import { motion } from "framer-motion";
import { X, Printer, FileText } from "lucide-react";

const ViewReceipt = ({ 
  isVisible, 
  isDarkMode, 
  showReceiptOptions, 
  closeReceiptOptions, 
  handlePrintReceipt, 
  handleDownloadReceipt, 
  receiptData 
}) => {
  if (!showReceiptOptions) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
    >
      <div 
        className="p-6 rounded-xl max-w-md w-full mx-4 relative border-2"
        style={{
          backgroundColor: isDarkMode ? '#F3EDE3' : '#183D3D',
          borderColor: isDarkMode ? '#2A524C' : '#183D3D',
          color: isDarkMode ? '#13151B' : '#F3EDE3'
        }}
      >
        <button
          onClick={closeReceiptOptions}
          className="absolute top-3 right-3 transition-colors hover:opacity-70"
          style={{ color: isDarkMode ? '#13151B' : '#F3EDE3' }}
        >
          <X className="w-5 h-5" />
        </button>

        <h3 
          className="text-lg font-bold mb-4 text-center"
          style={{ color: isDarkMode ? '#13151B' : '#F3EDE3' }}
        >
          Receipt Options
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={handlePrintReceipt}
            className="w-full py-3 px-4 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-3 text-sm"
            style={{
              backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3',
              color: isDarkMode ? '#D5DCDB' : '#183D3D'
            }}
          >
            <Printer className="w-5 h-5" />
            Print Receipt
          </button>
          
          <button
            onClick={handleDownloadReceipt}
            className="w-full py-3 px-4 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-3 text-sm"
            style={{
              backgroundColor: isDarkMode ? '#2A524C' : '#F3EDE3',
              color: isDarkMode ? '#D5DCDB' : '#183D3D'
            }}
          >
            <FileText className="w-5 h-5" />
            Download PDF
          </button>
        </div>

        <div 
          className="mt-4 p-4 rounded-lg border"
          style={{
            backgroundColor: isDarkMode ? '#FFFFFF' : '#2A524C',
            borderColor: isDarkMode ? '#2A524C' : '#F3EDE3'
          }}
        >
          <h4 
            className="font-semibold text-center mb-2"
            style={{ color: isDarkMode ? '#13151B' : '#F3EDE3' }}
          >
            Receipt Preview
          </h4>
          <div className="text-xs space-y-1">
            <p>
              <strong style={{ color: isDarkMode ? '#13151B' : '#F3EDE3' }}>
                Receipt #:
              </strong> 
              <span style={{ color: isDarkMode ? '#6B7280' : '#F3EDE3' }}>
                {" "}{receiptData.receiptNumber}
              </span>
            </p>
            <p>
              <strong style={{ color: isDarkMode ? '#13151B' : '#F3EDE3' }}>
                Date:
              </strong> 
              <span style={{ color: isDarkMode ? '#6B7280' : '#F3EDE3' }}>
                {" "}{receiptData.dateCreated}
              </span>
            </p>
            <p>
              <strong style={{ color: isDarkMode ? '#13151B' : '#F3EDE3' }}>
                Customer:
              </strong> 
              <span style={{ color: isDarkMode ? '#6B7280' : '#F3EDE3' }}>
                {" "}{receiptData.customerName}
              </span>
            </p>
            <p>
              <strong style={{ color: isDarkMode ? '#13151B' : '#F3EDE3' }}>
                Total:
              </strong> 
              <span style={{ color: isDarkMode ? '#6B7280' : '#F3EDE3' }}>
                {" "}${receiptData.total.toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ViewReceipt;