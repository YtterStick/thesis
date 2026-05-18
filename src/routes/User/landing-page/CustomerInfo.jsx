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
      <h3 className="text-lg md:text-xl font-black mb-3 text-center tracking-tight" 
        style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
        Customer Information
      </h3>
      
      {isMobile && !showFullCustomerInfo && (
        <div 
          className="rounded-xl border p-3 shadow-md transition-all duration-300"
          style={{
            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.65)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
            color: isDarkMode ? '#cbd5e1' : '#475569'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  color: isDarkMode ? '#3b82f6' : '#2563eb'
                }}
              >
                <span className="font-bold text-xs">
                  {customerData.customerName?.charAt(0) || 'C'}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm" style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
                  {customerData.customerName || '—'}
                </h4>
                <p className="text-xs opacity-70">
                  {customerData.loads || 0} loads • {customerData.detergentQty || 0} detergent • {customerData.fabricQty || 0} fabric
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleViewReceipt}
                className="py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-none cursor-pointer"
              >
                <Receipt className="w-3 h-3" />
                Receipt
              </button>
              <button
                onClick={toggleFullCustomerInfo}
                className="flex items-center gap-1 font-bold text-xs transition-colors hover:opacity-70 cursor-pointer"
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
          className="rounded-xl border p-3 shadow-md transition-all duration-300"
          style={{
            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.65)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
            color: isDarkMode ? '#cbd5e1' : '#475569'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm" style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
              Customer Details
            </h4>
            <button
              onClick={toggleFullCustomerInfo}
              className="flex items-center gap-1 font-bold text-xs transition-colors hover:opacity-70 cursor-pointer"
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
              <div key={key} className="flex justify-between p-2 rounded-lg" style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                <span className="text-xs opacity-75">{key}</span>
                <span className="font-bold text-xs" style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t" style={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)' }}>
            <button
              onClick={handleViewReceipt}
              className="w-full py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-none cursor-pointer text-sm"
            >
              <Receipt className="w-4 h-4" />
              View Receipt
            </button>
          </div>
        </div>
      )}

      {!isMobile && (
        <div 
          className="rounded-2xl border p-5 shadow-xl backdrop-blur-md transition-all duration-300"
          style={{
            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.65)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
            color: isDarkMode ? '#cbd5e1' : '#475569'
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
              <div key={key} className="flex flex-col p-2.5 rounded-xl border transition-colors hover:bg-slate-800/10 dark:hover:bg-slate-100/5"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.25)',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)'
                }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-60 mb-0.5">{key}</span>
                <span className="font-semibold text-sm" style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={handleViewReceipt}
              className="py-2.5 px-6 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-none cursor-pointer text-sm"
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