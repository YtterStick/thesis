import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getApiUrl, api } from "@/lib/api-config";

// Assets
import assetClothing from "@/assets/USER_ASSET/asset_clothing.png";

const Services = ({ isVisible, isMobile, isDarkMode }) => {
  const [selectedService, setSelectedService] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [services, setServices] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch services from backend
  const fetchServices = async () => {
    try {
      setLoading(true);
      console.log("🔄 Starting to fetch services from backend...");
      
      const servicesData = await api.get('services');
      console.log('✅ Successfully fetched services:', servicesData);
      setServices(servicesData);
      
    } catch (err) {
      console.error('❌ Error fetching services:', err);
      setServices([]);
    }
  };

  // Fetch stock items from backend
  const fetchStockItems = async () => {
    try {
      console.log("🔄 Fetching stock items...");
      const stockData = await api.get('stock');
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
      const machinesData = await api.get('machines');
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
        className={`py-16 md:py-20 px-4 ${
          isDarkMode ? 'bg-[#0B2B26]' : 'bg-[#E0EAE8]'
        }`}
        id="services"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-8 md:gap-12">
            {/* Left Side - Title and Asset Image (Hidden on mobile) */}
            {!isMobile && (
              <div className="w-full lg:w-2/5">
                <motion.h2
                  className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-left mt-0 md:mt-4"
                  style={{ color: isDarkMode ? 'white' : '#183D3D' }}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.3 }}
                >
                  Our <span className="font-light" style={{ color: isDarkMode ? 'white' : '#183D3D' }}>
                    Services
                  </span>
                </motion.h2>
                
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                  className="mt-8 md:mt-12"
                >
                  <img
                    src={assetClothing}
                    alt="Clothing items"
                    className="w-full h-80 md:h-[500px] object-contain rounded-lg"
                  />
                </motion.div>
              </div>
            )}

            {/* Right Side - Services Cards in Vertical Layout */}
            <div className={`w-full ${isMobile ? 'lg:w-full' : 'lg:w-3/5'} mt-8 md:mt-12`}>
              {/* Show title on mobile if image is hidden */}
              {isMobile && (
                <motion.h2
                  className="text-3xl md:text-5xl font-bold mb-6 md:mb-8 text-center"
                  style={{ color: isDarkMode ? 'white' : '#183D3D' }}
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.3 }}
                >
                  Our <span className="font-light" style={{ color: isDarkMode ? 'white' : '#183D3D' }}>
                    Services
                  </span>
                </motion.h2>
              )}
              
              {/* Loading State */}
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#183D3D] mx-auto mb-4"></div>
                    <p className={isDarkMode ? 'text-white' : 'text-[#183D3D]'}>
                      Loading services...
                    </p>
                  </div>
                </div>
              )}
              
              {/* Empty State - No services loaded */}
              {!loading && services.length === 0 && (
                <div className="text-center py-12">
                  <p className={isDarkMode ? 'text-white' : 'text-[#183D3D]'}>
                    No services available at the moment.
                  </p>
                </div>
              )}
              
              {/* Services Cards */}
              {!loading && services.length > 0 && (
                <div className="flex flex-col gap-4 md:gap-4">
                  {services.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.5 + index * 0.2 }}
                      className="rounded-lg p-5 md:p-6 border-2 hover:shadow-lg transition-all duration-300 w-full cursor-default"
                      style={{
                        backgroundColor: isDarkMode ? '#F3EDE3' : '#1C3F3A',
                        borderColor: isDarkMode ? '#2A524C' : '#1C3F3A',
                        color: isDarkMode ? '#13151B' : '#FFFFFF'
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 
                          className="text-lg md:text-xl font-bold"
                          style={{ color: isDarkMode ? '#13151B' : '#FFFFFF' }}
                        >
                          {service.name}
                        </h3>
                        <div className="text-right">
                          <span 
                            className="text-lg md:text-xl font-bold block"
                            style={{ color: isDarkMode ? '#2A524C' : '#FFFFFF' }}
                          >
                            ₱{service.price}
                          </span>
                          <span 
                            className="text-xs block mt-1"
                            style={{ color: isDarkMode ? '#6B7280' : '#E0EAE8' }}
                          >
                            + ₱{plasticPrice} for plastic
                          </span>
                        </div>
                      </div>
                      <p 
                        className="leading-relaxed text-sm md:text-base mb-4"
                        style={{ color: isDarkMode ? '#13151B' : '#FFFFFF' }}
                      >
                        {service.description}
                      </p>
                      <div className="text-left">
                        <button 
                          onClick={() => handleDetailsClick(service)}
                          className="font-semibold text-sm md:text-base border-b-2 transition-all py-1 hover:scale-105 transform cursor-pointer"
                          style={{ 
                            color: isDarkMode ? '#13151B' : '#FFFFFF',
                            borderColor: isDarkMode ? '#13151B' : '#FFFFFF'
                          }}
                        >
                          Pricing →
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Pricing Modal - Dynamic content */}
      {showModal && selectedService && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ 
              backgroundColor: isDarkMode ? '#F3EDE3' : '#FFFFFF',
              color: isDarkMode ? '#13151B' : '#0B2B26'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">{selectedService.name} - Pricing</h3>
              <button
                onClick={closeModal}
                className="text-2xl font-bold hover:opacity-70 transition-colors"
                style={{ color: isDarkMode ? '#13151B' : '#13151B' }}
              >
                ×
              </button>
            </div>

            {/* Free Folding Highlight */}
            <div className="mb-4 p-3 rounded-lg border"
              style={{
                backgroundColor: isDarkMode ? '#E8F5E8' : '#F0F8F0',
                borderColor: isDarkMode ? '#4CAF50' : '#2E7D32'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: isDarkMode ? '#2E7D32' : '#1B5E20' }}>
                  🎉 Free Folding Service Included
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: isDarkMode ? '#2E7D32' : '#1B5E20' }}>
                All your clothes will be professionally folded at no extra cost
              </p>
            </div>

            {/* Pricing Breakdown */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Service Pricing</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 rounded-lg border"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
                  }}
                >
                  <div>
                    <span className="font-medium">Base Service Cost</span>
                  </div>
                  <span className="font-semibold" style={{ color: isDarkMode ? '#2A524C' : '#0B2B26' }}>
                    ₱{selectedService.price}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg border"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
                  }}
                >
                  <div>
                    <span className="font-medium">Plastic Packaging</span>
                    <span className="text-sm ml-2" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}>
                      (per load)
                    </span>
                  </div>
                  <span className="font-semibold" style={{ color: isDarkMode ? '#2A524C' : '#0B2B26' }}>
                    ₱{plasticPrice}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg border"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
                  }}
                >
                  <div>
                    <span className="font-medium">Folding Service</span>
                    <span className="text-sm ml-2" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}>
                      (free)
                    </span>
                  </div>
                  <span className="font-semibold" style={{ color: isDarkMode ? '#2A524C' : '#0B2B26' }}>
                    FREE
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Provided Items */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Customer Provided Items</h4>
              <p className="mb-3 text-sm">You can bring your own items. If not provided, we offer:</p>
              <div className="space-y-2">
                {customerItems.length > 0 ? (
                  customerItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex justify-between items-center p-3 rounded-lg border"
                      style={{
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.05)',
                        borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
                      }}
                    >
                      <div>
                        <span className="font-medium capitalize">{item.name}</span>
                        <span className="text-sm ml-2" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}>
                          (per use)
                        </span>
                      </div>
                      <span className="font-semibold" style={{ color: isDarkMode ? '#2A524C' : '#0B2B26' }}>
                        ₱{item.price}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}>
                    No additional items available at the moment.
                  </div>
                )}
              </div>
            </div>

            {/* Machine Capacity */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Machine Capacity</h4>
              <div className="p-3 rounded-lg border"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.05)',
                  borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
                }}
              >
                <p style={{ color: isDarkMode ? '#2A524C' : '#0B2B26' }} className="font-medium">
                  {machineCapacity} capacity per load
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeModal}
                className="px-6 py-2 rounded-lg font-semibold transition-all border-2 hover:scale-105 transform"
                style={{ 
                  backgroundColor: isDarkMode ? '#2A524C' : '#0B2B26',
                  color: isDarkMode ? '#F3EDE3' : '#FFFFFF',
                  borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default Services;