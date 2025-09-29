import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if dark mode is preferred or already set
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { href: "#home", label: "Home" },
    { href: "#services", label: "Services" },
    { href: "#service_tracking", label: "Service Tracking" },
    { href: "#receipt", label: "Receipt Management" },
  ];

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#0B2B26]/95 backdrop-blur-md border-b border-[#1C3F3A] dark:bg-[#0B2B26]/95 light:bg-white/95"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Button - Left side, only on mobile */}
            <div className="flex items-center md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg bg-[#1C3F3A] dark:bg-[#1C3F3A] light:bg-[#F3EDE3] hover:bg-[#2A524C] dark:hover:bg-[#2A524C] light:hover:bg-[#E8E0D5] transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  // Close icon
                  <svg className="w-5 h-5 text-[#F3EDE3] light:text-[#0B2B26]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  // Hamburger icon
                  <svg className="w-5 h-5 text-[#F3EDE3] light:text-[#0B2B26]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>

            {/* Logo - Centered on mobile, normal position on desktop */}
            <div className="flex items-center space-x-3 absolute left-1/2 transform -translate-x-1/2 md:static md:left-auto md:transform-none">
              <div className="w-9 h-9 bg-[#F3EDE3] dark:bg-[#F3EDE3] light:bg-[#0B2B26] rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-[#0B2B26] dark:text-[#0B2B26] light:text-[#F3EDE3] font-bold text-sm">SW</span>
              </div>
              <span className="font-deathstar text-xl text-[#F3EDE3] dark:text-[#F3EDE3] light:text-[#0B2B26] tracking-wider">
                STAR WASH
              </span>
            </div>

            {/* Desktop Navigation - Right side, hidden on mobile */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <a 
                  key={item.href}
                  href={item.href} 
                  className="text-[#F3EDE3] dark:text-[#F3EDE3] light:text-[#0B2B26] hover:text-white dark:hover:text-white light:hover:text-[#1C3F3A] transition-colors text-base font-medium"
                >
                  {item.label}
                </a>
              ))}
              
              {/* Dark/Light Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-[#1C3F3A] dark:bg-[#1C3F3A] light:bg-[#F3EDE3] hover:bg-[#2A524C] dark:hover:bg-[#2A524C] light:hover:bg-[#E8E0D5] transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  // Sun icon for light mode
                  <svg className="w-5 h-5 text-[#F3EDE3] light:text-[#0B2B26]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  // Moon icon for dark mode
                  <svg className="w-5 h-5 text-[#0B2B26] dark:text-[#F3EDE3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </nav>

            {/* Dark Mode Toggle for Mobile - Right side, hidden on desktop */}
            <div className="flex items-center space-x-4 md:hidden">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-[#1C3F3A] dark:bg-[#1C3F3A] light:bg-[#F3EDE3] hover:bg-[#2A524C] dark:hover:bg-[#2A524C] light:hover:bg-[#E8E0D5] transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-[#F3EDE3] light:text-[#0B2B26]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#0B2B26] dark:text-[#F3EDE3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            
            {/* Mobile Menu Panel - Left side */}
            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-16 left-0 z-50 w-64 h-[calc(100vh-4rem)] bg-[#0B2B26] dark:bg-[#0B2B26] light:bg-white border-r border-[#1C3F3A] shadow-2xl md:hidden"
            >
              <nav className="flex flex-col p-6 space-y-6">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className="text-[#F3EDE3] dark:text-[#F3EDE3] light:text-[#0B2B26] hover:text-white dark:hover:text-white light:hover:text-[#1C3F3A] transition-colors text-lg font-medium py-2 border-b border-[#1C3F3A]/30"
                  >
                    {item.label}
                  </a>
                ))}
                
                {/* Additional mobile menu items if needed */}
                <div className="pt-6 mt-6 border-t border-[#1C3F3A]/30">
                  <div className="text-[#F3EDE3]/70 dark:text-[#F3EDE3]/70 light:text-[#0B2B26]/70 text-sm">
                    Star Wash Laundry
                  </div>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;