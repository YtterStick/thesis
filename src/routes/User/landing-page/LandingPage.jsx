import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/routes/User/layouts/Header";
import Footer from "@/routes/User/layouts/Footer";
import Services from "./services";
import ServiceTracking from "./ServiceTracking";
import TermsCondition from "./TermsCondition";
import { useScrollSpy } from "./useScrollSpy";
import assetLanding from "@/assets/USER_ASSET/asset_landing.jpg";
import { useTheme } from "@/hooks/use-theme";
import { publicApi } from "@/lib/public-api-config"; // Import the public API utility

const AnimatedNumber = ({ value, isChanging }) => {
  if (!isChanging) {
    return <span>{value}</span>;
  }

  return (
    <div className="relative inline-block">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ 
            opacity: 0, 
            y: 30,
            scale: 1.2,
            rotateX: 90
          }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: 1,
            rotateX: 0
          }}
          exit={{ 
            opacity: 0, 
            y: -30,
            scale: 0.8,
            rotateX: -90
          }}
          transition={{ 
            duration: 0.6,
            ease: "easeOut"
          }}
          className="inline-block"
          style={{
            transformStyle: "preserve-3d"
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState([
    { number: "0", label: "Total Laundry Load", changing: false },
    { number: "0", label: "Total No. of Washing", changing: false },
    { number: "0", label: "Total No. of Drying", changing: false }
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Use your theme hook
  const { theme } = useTheme();
  
  // Calculate isDarkMode based on theme
  const isDarkMode = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const sectionIds = ['home', 'services', 'service_tracking', 'terms'];
  const { activeSection, isScrolling } = useScrollSpy(sectionIds, {
    throttle: 150
  });

  useEffect(() => {
    setIsVisible(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    fetchLaundryStats();
  }, [refreshCounter]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchLaundryStats = async () => {
    try {
      setIsRefreshing(true);
      
      // Use the public API utility instead of direct fetch
      const laundryJobs = await publicApi.get("laundry-jobs");

      let totalUnwashed = 0;
      let totalWashing = 0;
      let totalDrying = 0;

      laundryJobs.forEach(job => {
        if (job.loadAssignments && job.loadAssignments.length > 0) {
          job.loadAssignments.forEach(load => {
            const status = load.status?.toUpperCase();
            
            switch (status) {
              case "NOT_STARTED":
                totalUnwashed++;
                break;
              case "WASHING":
                totalWashing++;
                break;
              case "DRYING":
                totalDrying++;
                break;
              default:
                break;
            }
          });
        }
      });

      setStats(prevStats => {
        const newUnwashed = totalUnwashed.toString();
        const newWashing = totalWashing.toString();
        const newDrying = totalDrying.toString();

        const newStats = [
          { 
            number: newUnwashed, 
            label: "Total Laundry Load", 
            changing: newUnwashed !== prevStats[0].number 
          },
          { 
            number: newWashing, 
            label: "Total No. of Washing", 
            changing: newWashing !== prevStats[1].number 
          },
          { 
            number: newDrying, 
            label: "Total No. of Drying", 
            changing: newDrying !== prevStats[2].number 
          }
        ];
        
        const hasChanged = newStats.some(stat => stat.changing);
        
        if (hasChanged) {
          setTimeout(() => {
            setStats(currentStats => 
              currentStats.map(stat => ({ ...stat, changing: false }))
            );
          }, 1000);
          
          return newStats;
        } else {
          return prevStats;
        }
      });

    } catch (error) {
      console.error("Error fetching laundry stats:", error);
      setStats([
        { number: "0", label: "Total Laundry Load", changing: false },
        { number: "0", label: "Total No. of Washing", changing: false },
        { number: "0", label: "Total No. of Drying", changing: false }
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOurServiceClick = () => {
    setTimeout(() => {
      const servicesElement = document.getElementById("services");
      if (servicesElement) {
        servicesElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleMyLaundryClick = () => {
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
      {/* Remove onThemeChange prop since Header now uses the theme hook internally */}
      <Header activeSection={activeSection} />

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
                    <AnimatedNumber 
                      value={stat.number} 
                      isChanging={stat.changing} 
                    />
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
                    <AnimatedNumber 
                      value={stat.number} 
                      isChanging={stat.changing} 
                    />
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

      <div id="services">
        <Services isVisible={isVisible} isMobile={isMobile} isDarkMode={isDarkMode} />
      </div>

      <div id="service_tracking">
        <ServiceTracking isVisible={isVisible} isDarkMode={isDarkMode} />
      </div>

      <div id="terms">
        <TermsCondition isVisible={isVisible} isMobile={isMobile} isDarkMode={isDarkMode} />
      </div>

      <Footer isDarkMode={isDarkMode} />
    </div>
  );
};

export default LandingPage;