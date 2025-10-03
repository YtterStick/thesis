import { motion } from "framer-motion";
import { useState, useEffect } from "react";

// Assets
import assetClothing from "@/assets/USER_ASSET/asset_clothing.png";

const Services = ({ isVisible, isMobile }) => {
  const services = [
    {
      title: "Wash Only",
      description:
        "Clothes are washed using your choice of detergent and softener (price may vary depending on the products used). Plastic packaging is already included for your clean laundry."
    },
    {
      title: "Dry Only",
      description:
        "Clothes are tumble-dried and neatly packed. Ideal for items that are already washed. Plastic packaging is included."
    },
    {
      title: "Wash and Dry",
      description:
        "Complete laundry care – clothes are washed with detergent and softener of your choice, then tumble-dried and packed. Pricing may vary depending on the products added. Plastic packaging is included."
    }
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.8, delay: 1.2 }}
      className="py-16 md:py-20 px-4 bg-[#0B2B26]"
      id="services"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-8 md:gap-12">
          {/* Left Side - Title and Asset Image (Hidden on mobile) */}
          {!isMobile && (
            <div className="w-full lg:w-2/5">
              <motion.h2
                className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-white text-left mt-0 md:mt-4"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.3 }}
              >
                Our <span className="text-white font-light">Services</span>
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
                className="text-3xl md:text-5xl font-bold mb-6 md:mb-8 text-white text-center"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.3 }}
              >
                Our <span className="text-white font-light">Services</span>
              </motion.h2>
            )}
            
            <div className="flex flex-col gap-4 md:gap-4">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.5 + index * 0.2 }}
                  className="rounded-lg p-5 md:p-6 border-2 hover:shadow-lg transition-all duration-300 w-full"
                  style={{
                    backgroundColor: '#F3EDE3',
                    borderColor: '#2A524C',
                    color: '#13151B'
                  }}
                >
                  <h3 
                    className="text-lg md:text-xl font-bold mb-3"
                    style={{ color: '#13151B' }}
                  >
                    {service.title}
                  </h3>
                  <p 
                    className="leading-relaxed text-sm md:text-base mb-4"
                    style={{ color: '#13151B' }}
                  >
                    {service.description}
                  </p>
                  <div className="text-left">
                    <button 
                      className="font-semibold text-sm md:text-base border-b-2 transition-all py-1 hover:scale-105 transform"
                      style={{ 
                        color: '#13151B',
                        borderColor: '#13151B'
                      }}
                    >
                      Details →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default Services;