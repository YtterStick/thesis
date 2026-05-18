import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getApiUrl } from "@/lib/api-config";

// Assets
import assetClothing from "@/assets/USER_ASSET/asset_clothing.png";

const Services = ({ isVisible, isMobile, isDarkMode }) => {
  const [selectedService, setSelectedService] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [services, setServices] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Prevent scroll of main body when modal is active
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  // Fetch services from backend
  const fetchServices = async () => {
    try {
      setLoading(true);
      console.log("🔄 Starting to fetch services from backend...");
      
      const response = await fetch(getApiUrl("services"));
      
      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Response not OK. Response text:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const servicesData = await response.json();
      console.log('✅ Successfully fetched services:', servicesData);
      setServices(servicesData);
      
    } catch (err) {
      console.error('❌ Error fetching services:', err);
      console.error('❌ Error message:', err.message);
      setServices([]);
    }
  };

  // Fetch stock items from backend
  const fetchStockItems = async () => {
    try {
      console.log("🔄 Fetching stock items...");
      const response = await fetch(getApiUrl("stock"));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stockData = await response.json();
      console.log('✅ Successfully fetched stock items:', stockData);
      setStockItems(stockData);
    } catch (err) {
      console.error('❌ Error fetching stock items:', err);
      setStockItems([]);
    }
  };

  // Fetch machines from backend
  const fetchMachines = async () => {
    try {
      console.log("🔄 Fetching machines...");
      const response = await fetch(getApiUrl("machines"));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const machinesData = await response.json();
      console.log('✅ Successfully fetched machines:', machinesData);
      setMachines(machinesData);
    } catch (err) {
      console.error('❌ Error fetching machines:', err);
      setMachines([]);
    }
  };

  // Get plastic price from inventory
  const getPlasticPrice = () => {
    const plasticItem = stockItems.find(item => 
      item.name.toLowerCase().includes('plastic')
    );
    return plasticItem ? plasticItem.price : 3; // Default to 3 PHP if not found
  };

  // Get customer provided items (excluding plastic)
  const getCustomerProvidedItems = () => {
    return stockItems.filter(item => 
      !item.name.toLowerCase().includes('plastic')
    );
  };

  // Get highest machine capacity
  const getHighestMachineCapacity = () => {
    if (machines.length === 0) return "8kg"; // Default fallback
    
    const capacities = machines
      .map(machine => machine.capacityKg)
      .filter(capacity => capacity != null);
    
    if (capacities.length === 0) return "8kg"; // Default fallback
    
    const maxCapacity = Math.max(...capacities);
    return `${maxCapacity}kg`;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchServices(),
          fetchStockItems(),
          fetchMachines()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleDetailsClick = (service) => {
    setSelectedService(service);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedService(null);
  };

  const plasticPrice = getPlasticPrice();
  const customerItems = getCustomerProvidedItems();
  const machineCapacity = getHighestMachineCapacity();

  return (
    <>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="py-16 md:py-24 px-4 transition-colors duration-300 bg-transparent"
        id="services"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header Section (Centered) */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-500 text-xs font-black tracking-wider uppercase mb-4"
            >
              <span>Our Laundry Portfolio</span>
            </motion.div>
            <motion.h2
              className="text-4xl md:text-5xl font-black tracking-tight"
              style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              Premium Services & Pricing
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.5 }}
              className="mt-3 text-sm md:text-base text-slate-400 dark:text-slate-500 max-w-xl mx-auto font-medium"
            >
              Professional wash packages, self-service options, and customized care solutions tailored to your garments.
            </motion.p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                  Loading available services...
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && services.length === 0 && (
            <div className="text-center py-20">
              <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                No services available at the moment.
              </p>
            </div>
          )}

          {/* Full-width Services Grid */}
          {!loading && services.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.5 + index * 0.1 }}
                  className="rounded-3xl p-6 md:p-8 border shadow-xl backdrop-blur-md transition-all duration-300 w-full hover:-translate-y-2 hover:shadow-2xl hover:border-blue-500/30 group cursor-default flex flex-col justify-between"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.7)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
                    color: isDarkMode ? '#cbd5e1' : '#475569'
                  }}
                >
                  <div>
                    {/* Header: Service Name & Price Tag */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-2 border border-blue-500/20 bg-blue-500/5 text-blue-500">
                          Package {index + 1}
                        </div>
                        <h3 
                          className="text-xl md:text-2xl font-black tracking-tight transition-colors group-hover:text-blue-500 truncate"
                          style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
                        >
                          {service.name}
                        </h3>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span 
                          className="text-2xl font-black block tracking-tight"
                          style={{ color: isDarkMode ? '#3b82f6' : '#2563eb' }}
                        >
                          ₱{service.price}
                        </span>
                        <span 
                          className="text-[10px] block mt-0.5 font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                        >
                          Base Price
                        </span>
                      </div>
                    </div>

                    <p 
                      className="leading-relaxed text-xs md:text-sm mb-8 font-medium transition-colors"
                      style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                    >
                      {service.description}
                    </p>
                  </div>

                  {/* Pricing Action Capsule */}
                  <div className="border-t pt-6 border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between gap-4 mt-auto">
                    <span 
                      className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
                    >
                      + ₱{plasticPrice} plastic load
                    </span>
                    <button 
                      onClick={() => handleDetailsClick(service)}
                      className="font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 px-4 py-2.5 rounded-xl border bg-slate-100/50 dark:bg-slate-900/50 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:scale-105 active:scale-95 cursor-pointer"
                      style={{ 
                        color: isDarkMode ? '#f8fafc' : '#0f172a',
                      }}
                    >
                      <span>Options</span>
                      <span className="text-blue-500 font-extrabold text-xs">→</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* Pricing Modal - Dynamic content */}
      {showModal && selectedService && typeof document !== 'undefined' && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fade-in"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="backdrop-blur-2xl rounded-3xl p-6 md:p-8 max-w-xl w-full max-h-[92vh] overflow-y-auto border shadow-2xl transition-colors duration-300 modal-scroll"
            style={{ 
              backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
              color: isDarkMode ? '#cbd5e1' : '#475569',
              scrollbarWidth: 'thin',
              scrollbarColor: isDarkMode ? 'rgba(255, 255, 255, 0.15) transparent' : 'rgba(15, 23, 42, 0.1) transparent',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              .modal-scroll::-webkit-scrollbar {
                width: 6px;
              }
              .modal-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .modal-scroll::-webkit-scrollbar-thumb {
                background: ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.1)'};
                border-radius: 9999px;
              }
              .modal-scroll::-webkit-scrollbar-thumb:hover {
                background: ${isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(15, 23, 42, 0.2)'};
              }
            `}</style>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl md:text-2xl font-black tracking-tight" style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
                {selectedService.name}
              </h3>
              <button
                onClick={closeModal}
                className="text-2xl font-bold hover:text-red-500 transition-all w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
              >
                &times;
              </button>
            </div>

            {/* Free Folding Highlight */}
            <div className="mb-6 p-4 rounded-2xl border flex flex-col gap-1 shadow-sm"
              style={{
                backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.06)' : 'rgba(37, 99, 235, 0.04)',
                borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.2)'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold flex items-center gap-1.5 text-sm md:text-base" style={{ color: isDarkMode ? '#60a5fa' : '#2563eb' }}>
                  ✨ Free Folding Service Included
                </span>
              </div>
              <p className="text-xs md:text-sm mt-0.5" style={{ color: isDarkMode ? '#93c5fd' : '#1d4ed8' }}>
                All your clothes will be professionally folded at no extra cost
              </p>
            </div>

            {/* Pricing Breakdown */}
            <div className="mb-6">
              <h4 className="text-xs font-black mb-3 uppercase tracking-wider text-slate-400 dark:text-slate-500" style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                Pricing Details
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-4 rounded-2xl border transition-all hover:bg-slate-100/30 dark:hover:bg-slate-800/30"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)'
                  }}
                >
                  <div>
                    <span className="font-semibold text-sm md:text-base" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Base Service Cost</span>
                  </div>
                  <span className="font-black text-sm md:text-base" style={{ color: isDarkMode ? '#3b82f6' : '#2563eb' }}>
                    ₱{selectedService.price}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-2xl border transition-all hover:bg-slate-100/30 dark:hover:bg-slate-800/30"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)'
                  }}
                >
                  <div>
                    <span className="font-semibold text-sm md:text-base" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Plastic Packaging</span>
                    <span className="text-xs ml-2 opacity-60">
                      (per load)
                    </span>
                  </div>
                  <span className="font-black text-sm md:text-base" style={{ color: isDarkMode ? '#3b82f6' : '#2563eb' }}>
                    ₱{plasticPrice}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-2xl border transition-all hover:bg-slate-100/30 dark:hover:bg-slate-800/30"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)'
                  }}
                >
                  <div>
                    <span className="font-semibold text-sm md:text-base" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Folding Service</span>
                    <span className="text-xs ml-2 opacity-70">
                      (free)
                    </span>
                  </div>
                  <span className="font-black text-sm md:text-base text-blue-500 dark:text-blue-400">
                    FREE
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Provided Items */}
            <div className="mb-6">
              <h4 className="text-xs font-black mb-3 uppercase tracking-wider text-slate-400 dark:text-slate-500" style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                Add-ons & Options
              </h4>
              <p className="mb-3 text-xs md:text-sm text-slate-400 dark:text-slate-500">Choose to bring your own detergents/add-ons, or purchase from our selection:</p>
              <div className="space-y-2">
                {customerItems.length > 0 ? (
                  customerItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex justify-between items-center p-4 rounded-2xl border transition-all hover:bg-slate-100/30 dark:hover:bg-slate-800/30"
                      style={{
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)'
                      }}
                    >
                      <div>
                        <span className="font-semibold capitalize text-sm md:text-base" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>{item.name}</span>
                        <span className="text-xs ml-2 opacity-70">
                          (per use)
                        </span>
                      </div>
                      <span className="font-black text-sm md:text-base" style={{ color: isDarkMode ? '#3b82f6' : '#2563eb' }}>
                        ₱{item.price}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm opacity-60">
                    No additional items available at the moment.
                  </div>
                )}
              </div>
            </div>

            {/* Machine Capacity */}
            <div className="mb-6">
              <h4 className="text-xs font-black mb-3 uppercase tracking-wider text-slate-400 dark:text-slate-500" style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                Machine Capacity
              </h4>
              <div className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)'
                }}
              >
                <p className="font-semibold text-sm md:text-base" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                  Maximum load weight of <span className="font-black text-blue-500 dark:text-blue-400">{machineCapacity}</span> per cycle
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={closeModal}
                className="px-6 py-3 rounded-2xl font-black text-sm transition-all border shadow-lg hover:shadow-xl active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-none cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </>
  );
};

export default Services;