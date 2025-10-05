import { motion } from "framer-motion";
import { useState, useEffect } from "react";

// Assets
import assetClothing from "@/assets/USER_ASSET/asset_clothing.png";

const Services = ({ isVisible, isMobile, isDarkMode }) => {
  const [selectedService, setSelectedService] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const services = [
    {
      title: "Wash Only",
      description: "Get your clothes professionally washed with your preferred detergent. Includes free folding and plastic packaging for fresh, ready-to-wear laundry.",
      basePrice: 65,
      details: {
        pricing: [
          { item: "Base Service Cost", price: 65 },
          { item: "Plastic Packaging", price: 3, note: "per load" },
          { item: "Folding Service", price: 0, note: "free" }
        ],
        customerOptions: {
          title: "Customer Provided Items",
          description: "You can bring your own detergent and fabric softener. If not provided, we offer:",
          items: [
            { name: "Detergent", price: 14, note: "per use" },
            { name: "Fabric Softener", price: 18, note: "per use" }
          ]
        },
        machineInfo: {
          capacity: "8kg capacity per load"
        }
      }
    },
    {
      title: "Dry Only",
      description: "Perfect for pre-washed clothes! We'll dry, neatly fold, and pack your laundry. Includes free professional folding and plastic packaging.",
      basePrice: 65,
      details: {
        pricing: [
          { item: "Base Service Cost", price: 65 },
          { item: "Plastic Packaging", price: 3, note: "per load" },
          { item: "Folding Service", price: 0, note: "free" }
        ],
        machineInfo: {
          capacity: "8kg capacity per load"
        }
      }
    },
    {
      title: "Wash and Dry",
      description: "The complete solution! We wash, dry, and professionally fold your clothes. All-in-one service with free folding and plastic packaging included.",
      basePrice: 130,
      details: {
        pricing: [
          { item: "Base Service Cost", price: 130 },
          { item: "Plastic Packaging", price: 3, note: "per load" },
          { item: "Folding Service", price: 0, note: "free" }
        ],
        customerOptions: {
          title: "Customer Provided Items",
          description: "You can bring your own detergent and fabric softener. If not provided, we offer:",
          items: [
            { name: "Detergent", price: 14, note: "per use" },
            { name: "Fabric Softener", price: 18, note: "per use" }
          ]
        },
        machineInfo: {
          washer: { capacity: "8kg capacity" },
          dryer: { capacity: "8kg capacity" }
        }
      }
    }
  ];

  const handleDetailsClick = (service) => {
    setSelectedService(service);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedService(null);
  };

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
              
              <div className="flex flex-col gap-4 md:gap-4">
                {services.map((service, index) => (
                  <motion.div
                    key={service.title}
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
                        {service.title}
                      </h3>
                      <div className="text-right">
                        <span 
                          className="text-lg md:text-xl font-bold block"
                          style={{ color: isDarkMode ? '#2A524C' : '#FFFFFF' }}
                        >
                          ₱{service.basePrice}
                        </span>
                        <span 
                          className="text-xs block mt-1"
                          style={{ color: isDarkMode ? '#6B7280' : '#E0EAE8' }}
                        >
                          + ₱3 for plastic
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
            </div>
          </div>
        </div>
      </motion.section>

      {/* Pricing Modal */}
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
              <h3 className="text-2xl font-bold">{selectedService.title} - Pricing</h3>
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
                {selectedService.details.pricing.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg border"
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.05)',
                      borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
                    }}
                  >
                    <div>
                      <span className="font-medium">{item.item}</span>
                      {item.note && <span className="text-sm ml-2" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}>
                        ({item.note})
                      </span>}
                    </div>
                    <span className="font-semibold" style={{ color: isDarkMode ? '#2A524C' : '#0B2B26' }}>
                      {item.price === 0 ? 'FREE' : `₱${item.price}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Provided Items */}
            {selectedService.details.customerOptions && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3">{selectedService.details.customerOptions.title}</h4>
                <p className="mb-3 text-sm">{selectedService.details.customerOptions.description}</p>
                <div className="space-y-2">
                  {selectedService.details.customerOptions.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg border"
                      style={{
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.05)',
                        borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
                      }}
                    >
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {item.note && <span className="text-sm ml-2" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}>
                          ({item.note})
                        </span>}
                      </div>
                      <span className="font-semibold" style={{ color: isDarkMode ? '#2A524C' : '#0B2B26' }}>
                        ₱{item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Machine Capacity */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Machine Capacity</h4>
              {selectedService.title === "Wash and Dry" ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.05)',
                      borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
                    }}
                  >
                    <p className="font-medium">Washing Machine</p>
                    <p style={{ color: isDarkMode ? '#2A524C' : '#0B2B26' }} className="font-medium">
                      {selectedService.details.machineInfo.washer.capacity}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.05)',
                      borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
                    }}
                  >
                    <p className="font-medium">Dryer Machine</p>
                    <p style={{ color: isDarkMode ? '#2A524C' : '#0B2B26' }} className="font-medium">
                      {selectedService.details.machineInfo.dryer.capacity}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
                  }}
                >
                  <p style={{ color: isDarkMode ? '#2A524C' : '#0B2B26' }} className="font-medium">
                    {selectedService.details.machineInfo.capacity}
                  </p>
                </div>
              )}
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