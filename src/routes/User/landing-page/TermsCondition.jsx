import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ScrollText } from "lucide-react";

const API_BASE_URL = "https://thesis-g0pr.onrender.com/api";

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
      
      const response = await fetch(`${API_BASE_URL}/api/terms`);
      
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
        className={`py-12 md:py-16 px-4 ${
          isDarkMode ? 'bg-[#0B2B26]' : 'bg-[#E0EAE8]'
        }`}
        id="terms"
      >
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl overflow-hidden border-2 p-8 text-center"
            style={{
              backgroundColor: isDarkMode ? '#F3EDE3' : '#183D3D',
              borderColor: isDarkMode ? '#2A524C' : '#183D3D',
              color: isDarkMode ? '#13151B' : '#F3EDE3'
            }}
          >
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2"
                style={{ borderColor: isDarkMode ? '#18442A' : '#F3EDE3' }}></div>
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
        className={`py-12 md:py-16 px-4 ${
          isDarkMode ? 'bg-[#0B2B26]' : 'bg-[#E0EAE8]'
        }`}
        id="terms"
      >
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl overflow-hidden border-2 p-8 text-center"
            style={{
              backgroundColor: isDarkMode ? '#F3EDE3' : '#183D3D',
              borderColor: isDarkMode ? '#2A524C' : '#183D3D',
              color: isDarkMode ? '#13151B' : '#F3EDE3'
            }}
          >
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchTerms}
              className="px-6 py-2 rounded-lg font-semibold border-2 transition-all transform hover:scale-105"
              style={{
                backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3',
                color: isDarkMode ? '#FFFFFF' : '#183D3D',
                borderColor: isDarkMode ? '#18442A' : '#F3EDE3'
              }}
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
      className={`py-12 md:py-16 px-4 ${
        isDarkMode ? 'bg-[#0B2B26]' : 'bg-[#E0EAE8]'
      }`}
      id="terms"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.4 }}
          className="rounded-2xl overflow-hidden border-2"
          style={{
            backgroundColor: isDarkMode ? '#F3EDE3' : '#183D3D',
            borderColor: isDarkMode ? '#2A524C' : '#183D3D'
          }}
        >
          <button
            onClick={toggleSection}
            className="w-full p-6 md:p-8 text-left flex items-center justify-between transition-colors"
            style={{ 
              color: isDarkMode ? '#13151B' : '#F3EDE3',
              backgroundColor: isDarkMode ? '#F3EDE3' : '#183D3D'
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3' }}>
                <ScrollText className="w-6 h-6" 
                  style={{ color: isDarkMode ? '#FFFFFF' : '#183D3D' }} />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold">Terms & Conditions</h3>
                <p className="mt-1"
                  style={{ color: isDarkMode ? '#6B7280' : '#F3EDE3' }}>
                  {termsData.length} terms and conditions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm"
                style={{ color: isDarkMode ? '#6B7280' : '#F3EDE3' }}>
                {isOpen ? 'Collapse' : 'Expand'}
              </span>
              {isOpen ? (
                <ChevronUp className="w-5 h-5" style={{ color: isDarkMode ? '#18442A' : '#F3EDE3' }} />
              ) : (
                <ChevronDown className="w-5 h-5" style={{ color: isDarkMode ? '#18442A' : '#F3EDE3' }} />
              )}
            </div>
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t"
                style={{ borderColor: isDarkMode ? '#2A524C' : '#F3EDE3' }}
              >
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-6">
                    {termsData.length === 0 ? (
                      <div className="text-center py-8"
                        style={{ color: isDarkMode ? '#6B7280' : '#183D3D' }}>
                        <p>No terms and conditions available.</p>
                        <button
                          onClick={fetchTerms}
                          className="mt-4 px-4 py-2 rounded-lg font-semibold border transition-all"
                          style={{
                            backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3',
                            color: isDarkMode ? '#FFFFFF' : '#183D3D',
                            borderColor: isDarkMode ? '#18442A' : '#F3EDE3'
                          }}
                        >
                          Refresh
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {termsData.map((term, index) => (
                          <div 
                            key={term.id || index} 
                            className="border rounded-lg overflow-hidden"
                            style={{
                              backgroundColor: isDarkMode ? '#FFFFFF' : '#F3EDE3',
                              borderColor: isDarkMode ? '#2A524C' : '#183D3D'
                            }}
                          >
                            <button
                              onClick={() => toggleTerm(index)}
                              className="w-full p-4 text-left flex items-center justify-between transition-colors hover:opacity-90"
                              style={{ 
                                color: isDarkMode ? '#13151B' : '#183D3D',
                                backgroundColor: isDarkMode ? '#FFFFFF' : '#F3EDE3'
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ 
                                    backgroundColor: isDarkMode ? '#18442A' : '#183D3D',
                                    color: isDarkMode ? '#FFFFFF' : '#F3EDE3'
                                  }}>
                                  <span className="font-semibold text-sm">
                                    {index + 1}
                                  </span>
                                </div>
                                <span className="font-semibold text-left">
                                  {term.title}
                                </span>
                              </div>
                              {activeTerm === index ? (
                                <ChevronUp className="w-5 h-5 flex-shrink-0" 
                                  style={{ color: isDarkMode ? '#18442A' : '#183D3D' }} />
                              ) : (
                                <ChevronDown className="w-5 h-5 flex-shrink-0"
                                  style={{ color: isDarkMode ? '#18442A' : '#183D3D' }} />
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
                                  <div className="p-4 border-t"
                                    style={{ 
                                      borderColor: isDarkMode ? '#2A524C' : '#183D3D',
                                      backgroundColor: isDarkMode ? '#F8FAFC' : '#FFFFFF',
                                      color: isDarkMode ? '#6B7280' : '#183D3D'
                                    }}>
                                    <p className="leading-relaxed">
                                      {term.content}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t p-4"
                  style={{ 
                    borderColor: isDarkMode ? '#2A524C' : '#F3EDE3',
                    backgroundColor: isDarkMode ? '#FFFFFF' : '#183D3D'
                  }}>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-center sm:text-left"
                      style={{ color: isDarkMode ? '#6B7280' : '#F3EDE3' }}>
                      Last updated: {new Date().toLocaleDateString()}
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="px-6 py-2 rounded-lg font-semibold border-2 transition-all transform hover:scale-105"
                        style={{
                          backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3',
                          color: isDarkMode ? '#FFFFFF' : '#183D3D',
                          borderColor: isDarkMode ? '#18442A' : '#F3EDE3'
                        }}
                      >
                        I Understand
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default TermsCondition;