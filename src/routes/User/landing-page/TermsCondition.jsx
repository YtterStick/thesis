import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ScrollText } from "lucide-react";

const TermsCondition = ({ isVisible, isMobile, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTerm, setActiveTerm] = useState(0);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

 const termsData = [
    {
      title: "Service Agreement",
      description: "By using our laundry services, you agree to abide by all terms and conditions outlined herein. Services are provided on a first-come, first-served basis."
    },
    {
      title: "Service Hours",
      description: "Our standard operating hours are 7:00 AM to 7:00 PM, Monday through Saturday. Holiday schedules may vary."
    },
    {
      title: "Service Pricing",
      description: "All prices are subject to change without prior notice. Current pricing is displayed at our facility and on our official platforms."
    },
    {
      title: "Payment Methods",
      description: "We accept cash, credit/debit cards, and digital payments. Payment is due upon completion of services."
    },
    {
      title: "Additional Charges",
      description: "Extra charges may apply for special treatments, stain removal, or oversized items. These will be communicated before processing."
    },
    {
      title: "Item Inspection",
      description: "All items are inspected upon receipt. Existing damages or stains should be reported at drop-off."
    },
    {
      title: "Cleaning Methods",
      description: "We reserve the right to determine the appropriate cleaning method based on fabric type and condition."
    },
    {
      title: "Unclaimed Items",
      description: "Items unclaimed after 30 days may be disposed of or donated at our discretion."
    },
    {
      title: "Damage Claims",
      description: "Claims for damaged items must be made within 24 hours of pickup. We are not liable for pre-existing conditions."
    },
    {
      title: "Lost Items",
      description: "While we take utmost care, we are not responsible for lost items unless due to proven negligence."
    },
    {
      title: "Valuables",
      description: "Remove all valuables from pockets. We are not responsible for items left in clothing."
    },
    {
      title: "Customer Responsibilities",
      description: "Customers are responsible for separating delicate items. Special handling requests should be specified at drop-off."
    },
    {
      title: "Hazardous Materials",
      description: "Do not include items contaminated with hazardous materials, chemicals, or biological waste."
    },
    {
      title: "Pickup Timing", 
      description: "Please collect your laundry within our operating hours. Late pickups may incur storage fees."
    },
    {
      title: "Service Cancellation",
      description: "Services may be cancelled before processing begins. Cancellation fees may apply for specialized services."
    },
    {
      title: "Refund Policy",
      description: "Refunds are provided at management's discretion for unsatisfactory services. Processing fees may be non-refundable."
    },
    {
      title: "Personal Information",
      description: "We collect necessary personal information for service provision and do not share it with third parties without consent."
    },
    {
      title: "Communication",
      description: "By providing contact information, you agree to receive service-related communications."
    }
  ];

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
      if (!hasUserInteracted && activeTerm === null) {
        setActiveTerm(0);
      }
    } else {
      setIsOpen(false);
    }
  }, [isVisible, hasUserInteracted, activeTerm]);

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
            backgroundColor: isDarkMode ? '#F3EDE3' : '#FFFFFF',
            borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
          }}
        >
          <button
            onClick={toggleSection}
            className="w-full p-6 md:p-8 text-left flex items-center justify-between transition-colors"
            style={{ 
              color: isDarkMode ? '#13151B' : '#0B2B26',
              backgroundColor: isDarkMode ? '#F3EDE3' : '#FFFFFF'
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isDarkMode ? '#18442A' : '#0B2B26' }}>
                <ScrollText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold">Terms & Conditions</h3>
                <p className="mt-1"
                  style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}>
                  {termsData.length} terms and conditions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm"
                style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}>
                {isOpen ? 'Collapse' : 'Expand'}
              </span>
              {isOpen ? (
                <ChevronUp className="w-5 h-5" style={{ color: isDarkMode ? '#18442A' : '#0B2B26' }} />
              ) : (
                <ChevronDown className="w-5 h-5" style={{ color: isDarkMode ? '#18442A' : '#0B2B26' }} />
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
                style={{ borderColor: isDarkMode ? '#2A524C' : '#0B2B26' }}
              >
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-6">
                    <div className="space-y-4">
                      {termsData.map((term, index) => (
                        <div 
                          key={index} 
                          className="border rounded-lg overflow-hidden"
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
                          }}
                        >
                          <button
                            onClick={() => toggleTerm(index)}
                            className="w-full p-4 text-left flex items-center justify-between transition-colors hover:bg-gray-50"
                            style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: isDarkMode ? '#18442A' : '#0B2B26' }}>
                                <span className="text-white font-semibold text-sm">
                                  {index + 1}
                                </span>
                              </div>
                              <span className="font-semibold text-left">
                                {term.title}
                              </span>
                            </div>
                            {activeTerm === index ? (
                              <ChevronUp className="w-5 h-5 flex-shrink-0" 
                                style={{ color: isDarkMode ? '#18442A' : '#0B2B26' }} />
                            ) : (
                              <ChevronDown className="w-5 h-5 flex-shrink-0"
                                style={{ color: isDarkMode ? '#18442A' : '#0B2B26' }} />
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
                                <div className="p-4 border-t bg-gray-50"
                                  style={{ borderColor: isDarkMode ? '#2A524C' : '#0B2B26' }}>
                                  <p className="leading-relaxed"
                                    style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}>
                                    {term.description}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t p-4 bg-white"
                  style={{ borderColor: isDarkMode ? '#2A524C' : '#0B2B26' }}>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-center sm:text-left"
                      style={{ color: isDarkMode ? '#6B7280' : '#0B2B26' }}>
                      Last updated: {new Date().toLocaleDateString()}
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="px-6 py-2 rounded-lg font-semibold border-2 transition-all hover:scale-105"
                        style={{
                          backgroundColor: isDarkMode ? '#2A524C' : '#0B2B26',
                          color: isDarkMode ? '#F3EDE3' : '#FFFFFF',
                          borderColor: isDarkMode ? '#2A524C' : '#0B2B26'
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