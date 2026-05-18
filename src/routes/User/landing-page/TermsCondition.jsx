import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ScrollText } from "lucide-react";
import { getApiUrl } from "@/lib/api-config";

const TermsCondition = ({ isVisible, isMobile, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTerm, setActiveTerm] = useState(0);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [termsData, setTermsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch terms from backend API
  const fetchTerms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(getApiUrl("terms"));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch terms: ${response.status}`);
      }
      
      const terms = await response.json();
      setTermsData(terms);
    } catch (err) {
      console.error('Error fetching terms:', err);
      setError('Failed to load terms and conditions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  const toggleTerm = (index) => {
    setHasUserInteracted(true);
    setActiveTerm(activeTerm === index ? null : index);
  };

  useEffect(() => {
    if (isVisible) {
      setIsOpen(true);
      if (!hasUserInteracted && activeTerm === null && termsData.length > 0) {
        setActiveTerm(0);
      }
    } else {
      setIsOpen(false);
    }
  }, [isVisible, hasUserInteracted, activeTerm, termsData]);

  // Refresh terms data when section is opened
  useEffect(() => {
    if (isOpen && termsData.length === 0 && !loading) {
      fetchTerms();
    }
  }, [isOpen]);

  if (loading && termsData.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 2.0 }}
        className="py-12 md:py-16 px-4 transition-colors duration-300 bg-transparent"
        id="terms"
      >
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl overflow-hidden border p-8 text-center shadow-xl backdrop-blur-md"
            style={{
              backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.75)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
              color: isDarkMode ? '#cbd5e1' : '#475569'
            }}
          >
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <p className="mt-4">Loading terms and conditions...</p>
          </div>
        </div>
      </motion.section>
    );
  }

  if (error && termsData.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 2.0 }}
        className="py-12 md:py-16 px-4 transition-colors duration-300 bg-transparent"
        id="terms"
      >
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl overflow-hidden border p-8 text-center shadow-xl backdrop-blur-md"
            style={{
              backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.75)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
              color: isDarkMode ? '#cbd5e1' : '#475569'
            }}
          >
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchTerms}
              className="px-6 py-2 rounded-xl font-bold shadow-md active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-none cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.8, delay: 2.0 }}
      className="py-16 px-4 transition-colors duration-300 bg-transparent"
      id="terms"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-500 text-xs font-black tracking-wider uppercase mb-3"
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Guidelines & Policies</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Terms & Conditions
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Please review our store policies to ensure a seamless and pleasant service experience.
          </p>
        </div>

        {isMobile ? (
          /* Mobile Accordion Layout */
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.4 }}
            className="rounded-3xl border shadow-2xl backdrop-blur-md p-5 space-y-3"
            style={{
              backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.7)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'
            }}
          >
            {termsData.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>Loading terms and conditions...</p>
              </div>
            ) : (
              termsData.map((term, index) => (
                <div 
                  key={term.id || index} 
                  className="border rounded-2xl overflow-hidden transition-all duration-200"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)'
                  }}
                >
                  <button
                    onClick={() => toggleTerm(index)}
                    className="w-full p-4 text-left flex items-center justify-between transition-colors hover:opacity-90 cursor-pointer"
                    style={{ 
                      color: isDarkMode ? '#cbd5e1' : '#475569',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ 
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                          color: isDarkMode ? '#3b82f6' : '#2563eb'
                        }}>
                        <span className="font-semibold text-xs">
                          {index + 1}
                        </span>
                      </div>
                      <span className="font-bold text-left text-sm" style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
                        {term.title}
                      </span>
                    </div>
                    {activeTerm === index ? (
                      <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: isDarkMode ? '#3b82f6' : '#2563eb' }} />
                    ) : (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: isDarkMode ? '#3b82f6' : '#2563eb' }} />
                    )}
                  </button>
                  <AnimatePresence>
                    {activeTerm === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-4 border-t text-xs md:text-sm leading-relaxed"
                          style={{ 
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
                            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                            color: isDarkMode ? '#cbd5e1' : '#475569'
                          }}>
                          <p className="leading-relaxed">
                            {term.content}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          /* Desktop Interactive Split-Deck Guidelines Board */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Nav Deck */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 2.4 }}
              className="rounded-3xl border shadow-2xl backdrop-blur-md p-6 space-y-2.5 lg:col-span-1"
              style={{
                backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.7)',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'
              }}
            >
              <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 px-2 mb-4">
                Policy Chapters
              </h3>
              {termsData.map((term, index) => {
                const isActive = activeTerm === index;
                return (
                  <motion.button
                    key={term.id || index}
                    onClick={() => setActiveTerm(index)}
                    whileHover={{ x: 4 }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                      isActive 
                        ? 'border-blue-500/30 shadow-md' 
                        : 'border-transparent hover:bg-slate-100/30 dark:hover:bg-slate-800/30'
                    }`}
                    style={{
                      backgroundColor: isActive 
                        ? (isDarkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(37, 99, 235, 0.05)')
                        : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isActive 
                          ? 'bg-blue-500 text-white' 
                          : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`font-bold text-sm transition-colors ${
                        isActive 
                          ? 'text-blue-500 dark:text-blue-400' 
                          : (isDarkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900')
                      }`}>
                        {term.title}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Right Guideline Viewport */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 2.5 }}
              className="rounded-3xl border shadow-2xl backdrop-blur-md p-8 lg:col-span-2 min-h-[400px] flex flex-col justify-between"
              style={{
                backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.7)',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'
              }}
            >
              {termsData.length > 0 && activeTerm !== null && termsData[activeTerm] ? (
                <div>
                  <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-blue-500 mb-3">
                    <span>SECTION {activeTerm + 1}</span>
                    <span>•</span>
                    <span>STORE RULES</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
                    {termsData[activeTerm].title}
                  </h3>
                  <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                    {termsData[activeTerm].content}
                  </p>

                  <div className="mt-8 p-5 rounded-2xl border flex items-start gap-4"
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(37, 99, 235, 0.03)',
                      borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.15)'
                    }}
                  >
                    <ScrollText className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white text-sm">Official StarWash Directive</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        This store policy is strictly implemented to maintain operational efficiency and fair service distribution.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <p>Select a chapter from the checklist to view details.</p>
                </div>
              )}

              <div className="border-t pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-slate-200 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  Last updated: {new Date().toLocaleDateString()}
                </span>
                <button
                  onClick={() => setActiveTerm((prev) => (prev + 1) % termsData.length)}
                  className="px-6 py-3 rounded-2xl font-black text-xs transition-all border shadow-md active:scale-95 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Next Chapter →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default TermsCondition;