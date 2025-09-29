import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

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

  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#0B2B26]/95 backdrop-blur-md border-b border-[#1C3F3A] dark:bg-[#0B2B26]/95 light:bg-white/95"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#F3EDE3] dark:bg-[#F3EDE3] light:bg-[#0B2B26] rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-[#0B2B26] dark:text-[#0B2B26] light:text-[#F3EDE3] font-bold text-sm">SW</span>
            </div>
            <span className="font-deathstar text-xl text-[#F3EDE3] dark:text-[#F3EDE3] light:text-[#0B2B26] tracking-wider">
              STAR WASH
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-[#F3EDE3] dark:text-[#F3EDE3] light:text-[#0B2B26] hover:text-white dark:hover:text-white light:hover:text-[#1C3F3A] transition-colors text-base font-medium">Home</a>
            <a href="#services" className="text-[#F3EDE3] dark:text-[#F3EDE3] light:text-[#0B2B26] hover:text-white dark:hover:text-white light:hover:text-[#1C3F3A] transition-colors text-base font-medium">Services</a>
            <a href="#service_tracking" className="text-[#F3EDE3] dark:text-[#F3EDE3] light:text-[#0B2B26] hover:text-white dark:hover:text-white light:hover:text-[#1C3F3A] transition-colors text-base font-medium">Service Tracking</a>
            <a href="#receipt" className="text-[#F3EDE3] dark:text-[#F3EDE3] light:text-[#0B2B26] hover:text-white dark:hover:text-white light:hover:text-[#1C3F3A] transition-colors text-base font-medium">Receipt Management</a>
            
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

          {/* Mobile menu button and dark mode toggle for mobile */}
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
  );
};

export default Header;