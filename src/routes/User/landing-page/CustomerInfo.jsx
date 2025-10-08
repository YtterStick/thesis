import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Receipt } from "lucide-react";

const CustomerInfo = ({ 
  isVisible,
  isDarkMode, 
  isMobile, 
  showFullCustomerInfo, 
  toggleFullCustomerInfo, 
  handleViewReceipt, 
  customerData 
}) => {
  if (!isVisible || !customerData) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.5 }}
      className="mb-4"
    >
      <h3 className="text-lg md:text-xl font-bold mb-3 text-center" 
        style={{ color: isDarkMode ? '#13151B' : '#F3EDE3' }}>
        Customer Information
      </h3>
      
      {isMobile && !showFullCustomerInfo && (
        <div 
          className="rounded-lg border-2 p-3"
          style={{
            backgroundColor: isDarkMode ? '#FFFFFF' : '#183D3D',
            borderColor: isDarkMode ? '#2A524C' : '#F3EDE3',
            color: isDarkMode ? '#13151B' : '#F3EDE3'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3',
                  color: isDarkMode ? '#FFFFFF' : '#183D3D'
                }}
              >
                <span className="font-semibold text-xs">
                  {customerData.customerName?.charAt(0) || 'C'}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-sm">
                  {customerData.customerName || '—'}
                </h4>
                <p className="text-xs">
                  {customerData.loads || 0} loads • {customerData.detergentQty || 0} detergent • {customerData.fabricQty || 0} fabric
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleViewReceipt}
                className="py-1 px-2 rounded text-xs font-semibold flex items-center gap-1 transition-all transform hover:scale-105"
                style={{
                  backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3',
                  color: isDarkMode ? '#FFFFFF' : '#183D3D'
                }}
              >
                <Receipt className="w-3 h-3" />
                Receipt
              </button>
              <button
                onClick={toggleFullCustomerInfo}
                className="flex items-center gap-1 font-semibold text-xs transition-colors hover:opacity-70"
              >
                View All
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isMobile && showFullCustomerInfo && (
        <div 
          className="rounded-lg border-2 p-3"
          style={{
            backgroundColor: isDarkMode ? '#FFFFFF' : '#183D3D',
            borderColor: isDarkMode ? '#2A524C' : '#F3EDE3',
            color: isDarkMode ? '#13151B' : '#F3EDE3'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">
              Customer Details
            </h4>
            <button
              onClick={toggleFullCustomerInfo}
              className="flex items-center gap-1 font-semibold text-xs transition-colors hover:opacity-70"
            >
              Show Less
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            {Object.entries({
              'Customer Name': customerData.customerName || '—',
              'Contact': customerData.contact || '—',
              'Number of Loads': customerData.loads || 0,
              'Detergent': customerData.detergentQty || 0,
              'Fabric': customerData.fabricQty || 0,
              'Service Type': customerData.serviceName || '—',
              'Date Created': formatDate(customerData.createdAt),
              'Due Date': formatDate(customerData.dueDate),
              'Staff Processed By': customerData.staffId || '—'
            }).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span>{key}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t" style={{ borderColor: isDarkMode ? '#2A524C' : '#F3EDE3' }}>
            <button
              onClick={handleViewReceipt}
              className="w-full py-2 rounded font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 text-sm"
              style={{
                backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3',
                color: isDarkMode ? '#FFFFFF' : '#183D3D'
              }}
            >
              <Receipt className="w-4 h-4" />
              View Receipt
            </button>
          </div>
        </div>
      )}

      {!isMobile && (
        <div 
          className="rounded-lg border-2 p-4"
          style={{
            backgroundColor: isDarkMode ? '#FFFFFF' : '#183D3D',
            borderColor: isDarkMode ? '#2A524C' : '#F3EDE3',
            color: isDarkMode ? '#13151B' : '#F3EDE3'
          }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {Object.entries({
              'Customer Name': customerData.customerName || '—',
              'Contact': customerData.contact || '—',
              'Number of Loads': customerData.loads || 0,
              'Detergent': customerData.detergentQty || 0,
              'Fabric': customerData.fabricQty || 0,
              'Service Type': customerData.serviceName || '—',
              'Date Created': formatDate(customerData.createdAt),
              'Due Date': formatDate(customerData.dueDate),
              'Staff Processed By': customerData.staffId || '—'
            }).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="text-xs font-medium">{key}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={handleViewReceipt}
              className="py-2 px-4 rounded-lg font-semibold flex items-center gap-2 transition-all transform hover:scale-105 text-sm"
              style={{
                backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3',
                color: isDarkMode ? '#FFFFFF' : '#183D3D'
              }}
            >
              <Receipt className="w-4 h-4" />
              View Receipt
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CustomerInfo;