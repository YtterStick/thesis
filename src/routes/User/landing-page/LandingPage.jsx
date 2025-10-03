import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Components
import Header from "@/routes/User/layouts/Header";
import Footer from "@/routes/User/layouts/Footer";
import Services from "./services";
import ServiceTracking from "./ServiceTracking"; // New component

// Assets
import assetLanding from "@/assets/USER_ASSET/asset_landing.jpg";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState("home"); // Track active section

  useEffect(() => {
    setIsVisible(true);
    
    // Check if mobile on component mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const stats = [
    { number: "50", label: "Total Laundry Load" },
    { number: "15", label: "Total No. of Washing" },
    { number: "10", label: "Total No. of Drying" }
  ];

  return (
    <div className="min-h-screen bg-[#0B2B26] text-white font-poppins" id="home">
      <Header activeSection={activeSection} setActiveSection={setActiveSection} />

      <div className="h-24" />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="relative w-full bg-[#0B2B26] mt-0"
      >
        <div className="relative max-w-[90%] mx-auto overflow-hidden bg-[#0B2B26] rounded-tl-2xl rounded-tr-2xl">
          
          <div className="relative">
            <img
              src={assetLanding}
              alt="Laundry scene"
              className="w-full h-[300px] md:h-[650px] object-cover rounded-tl-2xl rounded-tr-2xl"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <motion.h2
                className="text-3xl md:text-6xl font-bold mb-8 md:mb-12 leading-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                style={{ color: '#183D3D' }}
              >
                Fresh Laundry,<br />
                <span className="font-light" style={{ color: '#183D3D' }}>Made Easy.</span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center"
              >
                <button 
                  onClick={() => setActiveSection("services")}
                  className="px-6 py-3 md:px-10 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all transform hover:scale-105 border-2 shadow-lg"
                  style={{ 
                    backgroundColor: '#D5DCDB',
                    color: '#183D3D',
                    borderColor: '#183D3D'
                  }}
                >
                  Our Service
                </button>
                <button 
                  onClick={() => setActiveSection("service_tracking")}
                  className="px-6 py-3 md:px-10 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all transform hover:scale-105 border-2 shadow-lg"
                  style={{ 
                    backgroundColor: '#18442AF5',
                    color: '#D5DCDB',
                    borderColor: '#18442AF5'
                  }}
                >
                  My Laundry
                </button>
              </motion.div>
            </div>
          </div>

          {/* Desktop Stats - Hidden on mobile */}
          <div className="hidden md:block absolute bottom-0 right-0 w-[500px] h-[180px] overflow-hidden">
            <svg
              className="absolute bottom-0 right-0 w-full h-full"
              viewBox="0 0 500 180"
              preserveAspectRatio="none"
            >
              <path
                d="M500,180 L500,100 Q500,0 500,0 L0,0 L0,180 Z"
                fill="#0B2B26"
              />
            </svg>

            <div className="absolute bottom-8 right-12 flex items-end justify-end space-x-12 z-10">
              {stats.map((stat, i) => (
                <div key={i} className="text-center flex flex-col items-center">
                  <div className="text-6xl font-bold text-white mb-1">{stat.number}</div>
                  <div className="text-sm font-normal text-white/80 max-w-[140px] leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Stats - Only visible on mobile */}
        <div className="md:hidden w-full bg-[#0B2B26] py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 gap-6">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i} 
                  className="text-center flex flex-col items-center p-6 bg-[#1C3F3A] rounded-2xl border-2 border-[#2A524C]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                >
                  <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-base font-normal text-white/80 leading-tight">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Services Section */}
      <Services isVisible={isVisible} isMobile={isMobile} />

      {/* Service Tracking Section */}
      <ServiceTracking isVisible={isVisible} />

      <Footer />
    </div>
  );
};

export default LandingPage;