import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Components
import Header from "@/routes/User/layouts/Header";
import Footer from "@/routes/User/layouts/Footer";
import Services from "./services";
import ServiceTracking from "./ServiceTracking";
import TermsCondition from "./TermsCondition";

// Assets
import assetLanding from "@/assets/USER_ASSET/asset_landing.jpg";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    
    // Check if mobile on component mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Check system preference for dark mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const stats = [
    { number: "50", label: "Total Laundry Load" },
    { number: "15", label: "Total No. of Washing" },
    { number: "10", label: "Total No. of Drying" }
  ];

  const handleThemeChange = (darkMode) => {
    setIsDarkMode(darkMode);
  };

  // Function to handle Our Service button click
  const handleOurServiceClick = () => {
    setActiveSection("services");
    // Scroll to services section
    setTimeout(() => {
      const servicesElement = document.getElementById("services");
      if (servicesElement) {
        servicesElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Function to handle My Laundry button click
  const handleMyLaundryClick = () => {
    setActiveSection("service_tracking");
    // Scroll to service tracking section
    setTimeout(() => {
      const trackingElement = document.getElementById("service_tracking");
      if (trackingElement) {
        trackingElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0B2B26] text-white' : 'bg-[#E0EAE8] text-[#0B2B26]'
    } font-poppins`} id="home">
      <Header activeSection={activeSection} setActiveSection={setActiveSection} onThemeChange={handleThemeChange} />

      <div className="h-24" />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className={`relative w-full mt-0 ${
          isDarkMode ? 'bg-[#0B2B26]' : 'bg-[#E0EAE8]'
        }`}
      >
        <div className={`relative max-w-[90%] mx-auto overflow-hidden rounded-tl-2xl rounded-tr-2xl ${
          isDarkMode ? 'bg-[#0B2B26]' : 'bg-[#E0EAE8]'
        }`}>
          
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
                style={{ color: isDarkMode ? '#183D3D' : '#18442AF5' }}
              >
                Fresh Laundry,<br />
                <span className="font-light" style={{ color: isDarkMode ? '#183D3D' : '#18442AF5' }}>
                  Made Easy.
                </span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center"
              >
                <button 
                  onClick={handleOurServiceClick}
                  className="px-6 py-3 md:px-10 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all transform hover:scale-105 border-2 shadow-lg"
                  style={{ 
                    backgroundColor: '#D5DCDB',
                    color: '#183D3D',
                    borderColor: '#D5DCDB'
                  }}
                >
                  Our Service
                </button>
                <button 
                  onClick={handleMyLaundryClick}
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

          {/* Desktop Stats */}
          <div className="hidden md:block absolute bottom-0 right-0 w-[500px] h-[180px] overflow-hidden">
            <svg
              className="absolute bottom-0 right-0 w-full h-full"
              viewBox="0 0 500 180"
              preserveAspectRatio="none"
            >
              <path
                d="M500,180 L500,100 Q500,0 500,0 L0,0 L0,180 Z"
                fill={isDarkMode ? '#0B2B26' : '#E0EAE8'}
              />
            </svg>

            <div className="absolute bottom-8 right-12 flex items-end justify-end space-x-12 z-10">
              {stats.map((stat, i) => (
                <div key={i} className="text-center flex flex-col items-center">
                  <div className={`text-6xl font-bold mb-1 ${
                    isDarkMode ? 'text-white' : 'text-[#1C3F3A]'
                  }`}>
                    {stat.number}
                  </div>
                  <div className={`text-sm font-normal max-w-[140px] leading-tight ${
                    isDarkMode ? 'text-white/80' : 'text-[#1C3F3A]/80'
                  }`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className={`md:hidden w-full py-8 ${
          isDarkMode ? 'bg-[#0B2B26]' : 'bg-[#E0EAE8]'
        }`}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 gap-6">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i} 
                  className="text-center flex flex-col items-center p-6 rounded-2xl border-2"
                  style={{
                    backgroundColor: isDarkMode ? '#1C3F3A' : '#FFFFFF',
                    borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                >
                  <div className={`text-4xl font-bold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-[#1C3F3A]'
                  }`}>
                    {stat.number}
                  </div>
                  <div className={`text-base font-normal leading-tight ${
                    isDarkMode ? 'text-white/80' : 'text-[#1C3F3A]/80'
                  }`}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Services Section */}
      <div id="services">
        <Services isVisible={isVisible} isMobile={isMobile} isDarkMode={isDarkMode} />
      </div>

      {/* Service Tracking Section */}
      <div id="service_tracking">
        <ServiceTracking isVisible={isVisible} isDarkMode={isDarkMode} />
      </div>

      {/* Terms & Conditions Section */}
      <TermsCondition isVisible={isVisible} isMobile={isMobile} isDarkMode={isDarkMode} />

      <Footer isDarkMode={isDarkMode} />
    </div>
  );
};

export default LandingPage;