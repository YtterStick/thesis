import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const Header = ({ activeSection, setActiveSection, onThemeChange }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [previousSection, setPreviousSection] = useState('');
  const [internalActiveSection, setInternalActiveSection] = useState('home');

  // Use internal state if prop is not provided
  const currentActiveSection = activeSection || internalActiveSection;

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  // Track section changes for animation direction
  useEffect(() => {
    if (currentActiveSection && currentActiveSection !== previousSection) {
      setPreviousSection(currentActiveSection);
    }
  }, [currentActiveSection, previousSection]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    
    if (onThemeChange) {
      onThemeChange(newDarkMode);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { href: "#home", label: "Home" },
    { href: "#services", label: "Services & Pricing" },
    { href: "#service_tracking", label: "Laundry Tracking" },
    { href: "#terms", label: "Terms & Condition" },
  ];

  const handleNavClick = (href, label) => {
    const sectionId = href.replace('#', '');
    
    // Use provided setActiveSection or fall back to internal state
    if (setActiveSection) {
      setActiveSection(sectionId);
    } else {
      setInternalActiveSection(sectionId);
    }
    
    // Scroll to section if setActiveSection isn't provided
    if (!setActiveSection) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    closeMobileMenu();
  };

  // Determine animation direction based on section order
  const getAnimationDirection = (sectionId) => {
    const sections = ['home', 'services', 'service_tracking', 'terms'];
    const currentIndex = sections.indexOf(currentActiveSection);
    const targetIndex = sections.indexOf(sectionId);
    
    if (currentIndex === -1 || targetIndex === -1) return 0;
    return targetIndex > currentIndex ? 1 : -1;
  };

  // Animation variants for desktop nav items
  const navItemVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 }
  };

  // Animation for active indicator
  const activeIndicatorVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 }
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300"
        style={{
          backgroundColor: isDarkMode ? 'rgba(11, 43, 38, 0.95)' : 'rgba(224, 234, 232, 0.95)',
          borderColor: isDarkMode ? '#1C3F3A' : '#0B2B26'
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <motion.button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: isDarkMode ? '#1C3F3A' : '#F3EDE3',
                  color: isDarkMode ? '#F3EDE3' : '#0B2B26'
                }}
                aria-label="Toggle mobile menu"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </motion.button>
            </div>

            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3 absolute left-1/2 transform -translate-x-1/2 md:static md:left-auto md:transform-none"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <motion.div 
                className="w-9 h-9 rounded-lg flex items-center justify-center shadow-lg transition-colors"
                style={{
                  backgroundColor: isDarkMode ? '#F3EDE3' : '#0B2B26'
                }}
                whileHover={{ rotate: 5 }}
                animate={{ rotate: [0, -2, 2, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 5 }}
              >
                <span className="font-bold text-sm transition-colors"
                  style={{
                    color: isDarkMode ? '#0B2B26' : '#F3EDE3'
                  }}>
                  SW
                </span>
              </motion.div>
              <motion.span 
                className="font-deathstar text-xl tracking-wider transition-colors"
                style={{
                  color: isDarkMode ? '#F3EDE3' : '#0B2B26'
                }}
                whileHover={{ scale: 1.02 }}
              >
                STAR WASH
              </motion.span>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const isActive = currentActiveSection === item.href.replace('#', '');
                const direction = getAnimationDirection(item.href.replace('#', ''));
                
                return (
                  <motion.div
                    key={item.href}
                    className="relative"
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                  >
                    <a 
                      href={item.href} 
                      onClick={() => handleNavClick(item.href, item.label)}
                      className="relative transition-colors text-base font-medium hover:opacity-80 py-2 px-1"
                      style={{
                        color: isDarkMode ? '#F3EDE3' : '#0B2B26',
                      }}
                    >
                      <AnimatePresence mode="wait">
                        {isActive && (
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{
                              backgroundColor: isDarkMode ? '#F3EDE3' : '#0B2B26'
                            }}
                            variants={activeIndicatorVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30
                            }}
                            layoutId="activeIndicator"
                          />
                        )}
                      </AnimatePresence>

                      <motion.span
                        className="relative z-10"
                        variants={navItemVariants}
                        initial="initial"
                        animate="animate"
                        transition={{
                          duration: 0.3,
                          delay: isActive ? 0.1 : 0
                        }}
                        whileHover={{ 
                          y: -2,
                          transition: { duration: 0.2 }
                        }}
                      >
                        {item.label}
                      </motion.span>

                      {/* Hover effect */}
                      <motion.div
                        className="absolute inset-0 rounded-lg -z-10"
                        style={{
                          backgroundColor: isDarkMode ? 'rgba(243, 237, 227, 0.1)' : 'rgba(11, 43, 38, 0.1)'
                        }}
                        variants={{
                          hover: { opacity: 1 },
                          initial: { opacity: 0 }
                        }}
                        transition={{ duration: 0.2 }}
                      />
                    </a>
                  </motion.div>
                );
              })}
              
              {/* Dark/Light Mode Toggle */}
              <motion.button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg transition-colors hover:opacity-80 relative"
                style={{
                  backgroundColor: isDarkMode ? '#1C3F3A' : '#F3EDE3',
                  color: isDarkMode ? '#F3EDE3' : '#0B2B26'
                }}
                aria-label="Toggle dark mode"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isDarkMode ? 'dark' : 'light'}
                    initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isDarkMode ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </nav>

            {/* Dark Mode Toggle for Mobile */}
            <div className="flex items-center space-x-4 md:hidden">
              <motion.button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{
                  backgroundColor: isDarkMode ? '#1C3F3A' : '#F3EDE3',
                  color: isDarkMode ? '#F3EDE3' : '#0B2B26'
                }}
                aria-label="Toggle dark mode"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              transition={{ duration: 0.3 }}
            />
            
            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ 
                type: "spring", 
                damping: 30, 
                stiffness: 300,
                duration: 0.5
              }}
              className="fixed top-16 left-0 z-50 w-64 h-[calc(100vh-4rem)] border-r shadow-2xl md:hidden transition-colors"
              style={{
                backgroundColor: isDarkMode ? '#0B2B26' : '#E0EAE8',
                borderColor: isDarkMode ? '#1C3F3A' : '#0B2B26'
              }}
            >
              <nav className="flex flex-col p-6 space-y-6">
                {navItems.map((item, index) => {
                  const isActive = currentActiveSection === item.href.replace('#', '');
                  
                  return (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      onClick={() => handleNavClick(item.href, item.label)}
                      className="transition-colors text-lg font-medium py-2 border-b hover:opacity-80 relative"
                      style={{
                        color: isDarkMode ? '#F3EDE3' : '#0B2B26',
                        borderColor: isDarkMode ? '#1C3F3A' : '#0B2B26'
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ 
                        x: 10,
                        transition: { duration: 0.2 }
                      }}
                    >
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-1/2 w-1 h-6 -translate-y-1/2 rounded-full"
                          style={{
                            backgroundColor: isDarkMode ? '#F3EDE3' : '#0B2B26'
                          }}
                          layoutId="mobileActiveIndicator"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                          }}
                        />
                      )}
                      <span className="ml-4">{item.label}</span>
                    </motion.a>
                  );
                })}
                
                <motion.div 
                  className="pt-6 mt-6 border-t"
                  style={{
                    borderColor: isDarkMode ? '#1C3F3A' : '#0B2B26'
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}  
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-sm opacity-70 transition-colors"
                    style={{
                      color: isDarkMode ? '#F3EDE3' : '#0B2B26'
                    }}>
                    Star Wash Laundry
                  </div>
                </motion.div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;