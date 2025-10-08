import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { 
  QrCode, 
  Search, 
  Camera, 
  Upload, 
  X,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Phone,
  Loader2
} from "lucide-react";

// Import components
import ViewReceipt from "./ViewReceipt";
import CustomerInfo from "./CustomerInfo";
import LaundryProgress from "./LaundryProgress";

// Import Lottie animations
import washingMachine from "@/assets/lottie/washing-machine.json";
import dryerMachine from "@/assets/lottie/dryer-machine.json";
import clothes from "@/assets/lottie/clothes.json";
import unwashed from "@/assets/lottie/unwashed.json";

const ServiceTracking = ({ isVisible, isDarkMode }) => {
  const [receiptNumber, setReceiptNumber] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMethod, setScanMethod] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFullCustomerInfo, setShowFullCustomerInfo] = useState(false);
  const [currentLoadIndex, setCurrentLoadIndex] = useState(0);
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const progressSectionRef = useRef(null);
  const mainCardRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentLaundrySearches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 5));
        }
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }
  }, []);

  // Auto-scroll to show the entire main card when status is shown
  useEffect(() => {
    if (showStatus && mainCardRef.current) {
      setTimeout(() => {
        mainCardRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }, 100);
    }
  }, [showStatus]);

  // Fetch tracking data from backend
  const fetchTrackingData = async (invoiceNumber) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8080/api/track/${invoiceNumber}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Receipt number not found');
        }
        throw new Error('Failed to fetch tracking data');
      }
      
      const data = await response.json();
      setTrackingData(data);
      setShowStatus(true);
      setShowFullCustomerInfo(false);
      setCurrentLoadIndex(0);
      
    } catch (err) {
      setError(err.message);
      setShowStatus(false);
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Search by customer name
  const searchByCustomerName = async (customerName) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8080/api/track/search?customerName=${encodeURIComponent(customerName)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search by customer name');
      }
      
      const data = await response.json();
      // Handle multiple results - for now, take the first one
      if (data.length > 0) {
        setTrackingData(data[0]);
        setShowStatus(true);
        setShowFullCustomerInfo(false);
        setCurrentLoadIndex(0);
        
        // Add to recent searches
        addToRecentSearches(data[0].invoiceNumber);
      } else {
        setError('No transactions found for this customer name');
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { number: "50", label: "Total No. of Laundry" },
    { number: "50", label: "Total No. of Washing" },
    { number: "50", label: "Total No. of Drying" }
  ];

  // Function to add receipt to recent searches
  const addToRecentSearches = (receiptNum) => {
    if (!receiptNum?.trim()) return;
    
    try {
      const newSearch = {
        receiptNumber: receiptNum.trim(),
        searchedAt: new Date().toLocaleDateString(),
        timestamp: Date.now()
      };

      setRecentSearches(prev => {
        const filtered = prev.filter(item => 
          item.receiptNumber !== newSearch.receiptNumber
        );
        const updated = [newSearch, ...filtered].slice(0, 5);
        
        // Save to localStorage
        localStorage.setItem('recentLaundrySearches', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.warn('Failed to save recent search:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!receiptNumber.trim()) {
      setError('Please enter a receipt number');
      return;
    }
    
    console.log("Receipt submitted:", receiptNumber);
    fetchTrackingData(receiptNumber);
    
    // Save to recent searches
    addToRecentSearches(receiptNumber);
  };

  const handleScanQR = () => {
    setShowScanner(true);
    setScanMethod(null);
  };

  const startCameraScan = async () => {
    try {
      setIsScanning(true);
      setScanMethod('camera');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera not supported in your browser. Please try file upload.");
        setIsScanning(false);
        setScanMethod(null);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Simulate QR scan - in real implementation, you'd use a QR scanner library
      setTimeout(() => {
        const scannedReceipt = "INV-MGFFH82K"; // Example from your transaction
        setReceiptNumber(scannedReceipt);
        addToRecentSearches(scannedReceipt);
        closeScanner();
        fetchTrackingData(scannedReceipt);
      }, 3000);

    } catch (error) {
      console.error("Camera error:", error);
      alert("Cannot access camera. Please check permissions or try file upload.");
      setIsScanning(false);
      setScanMethod(null);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsScanning(true);
      setScanMethod('file');
      
      console.log("Processing file:", file.name);
      
      // Simulate QR scan from file - in real implementation, process the image
      setTimeout(() => {
        const scannedReceipt = "INV-MGFFH82K"; // Example from your transaction
        setReceiptNumber(scannedReceipt);
        addToRecentSearches(scannedReceipt);
        closeScanner();
        fetchTrackingData(scannedReceipt);
        
        event.target.value = '';
      }, 2000);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const closeScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setShowScanner(false);
    setIsScanning(false);
    setScanMethod(null);
  };

  const toggleFullCustomerInfo = () => {
    setShowFullCustomerInfo(!showFullCustomerInfo);
  };

  const nextLoad = () => {
    if (trackingData?.loadAssignments && currentLoadIndex < trackingData.loadAssignments.length - 1) {
      setCurrentLoadIndex(currentLoadIndex + 1);
    }
  };

  const prevLoad = () => {
    if (currentLoadIndex > 0) {
      setCurrentLoadIndex(currentLoadIndex - 1);
    }
  };

  const goToLoad = (index) => {
    setCurrentLoadIndex(index);
  };

  const handleViewReceipt = () => {
    setShowReceiptOptions(true);
  };

  const handlePrintReceipt = () => {
    console.log("Printing receipt:", trackingData);
    alert("Printing receipt...");
    setShowReceiptOptions(false);
  };

  const handleDownloadReceipt = () => {
    console.log("Downloading receipt:", trackingData);
    alert("Downloading receipt as PDF...");
    setShowReceiptOptions(false);
  };

  const closeReceiptOptions = () => {
    setShowReceiptOptions(false);
  };

  // Function to handle clicking on a recent search item
  const handleRecentSearchClick = (receiptNum) => {
    setReceiptNumber(receiptNum);
    fetchTrackingData(receiptNum);
  };

  // Convert backend data to frontend format for laundry progress
  const convertToLaundryLoads = (trackingData) => {
    if (!trackingData?.loadAssignments) return [];

    return trackingData.loadAssignments.map((load, index) => {
      const status = load.status || 'NOT_STARTED';
      
      // Map backend status to frontend steps
      const statusSteps = [
        {
          lottie: washingMachine,
          title: "Washing",
          description: "Your laundry is now being washed",
          active: status === 'WASHING',
          estimatedTime: "35 min",
          startedAt: load.startTime ? new Date(load.startTime).toLocaleTimeString() : undefined
        },
        {
          lottie: dryerMachine,
          title: "Drying", 
          description: "Your laundry is now being dried",
          active: status === 'DRYING',
          estimatedTime: "40-60 min",
          startedAt: load.startTime ? new Date(load.startTime).toLocaleTimeString() : undefined
        },
        {
          lottie: clothes,
          title: "Folding",
          description: "Your laundry is now being folded",
          active: status === 'FOLDING',
          estimatedTime: "20-30 min",
          startedAt: load.startTime ? new Date(load.startTime).toLocaleTimeString() : undefined
        },
        {
          lottie: unwashed,
          title: "Ready",
          description: "Ready for pickup at the counter",
          active: status === 'COMPLETED',
          estimatedTime: "5 min"
        }
      ];

      return {
        loadNumber: load.loadNumber || index + 1,
        statusSteps,
        fabricType: trackingData.fabricQty || 1,
        detergent: trackingData.detergentQty || 1,
        weight: "5 kg" // Default weight, you can calculate based on your business logic
      };
    });
  };

  const laundryLoads = convertToLaundryLoads(trackingData);

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
      transition={{ duration: 0.8, delay: 1.6 }}
      className={`py-12 md:py-16 px-4 ${
        isDarkMode ? 'bg-[#0B2B26]' : 'bg-[#E0EAE8]'
      }`}
      id="service_tracking"
    >
      <div className="max-w-[90%] mx-auto">
        <motion.div
          ref={mainCardRef}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.0 }}
          className="rounded-xl p-4 md:p-6 border-2 mb-8"
          style={{
            backgroundColor: isDarkMode ? '#F3EDE3' : '#183D3D',
            borderColor: isDarkMode ? '#2A524C' : '#183D3D',
            color: isDarkMode ? '#13151B' : '#F3EDE3'
          }}
        >
          {/* Receipt Input Section */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
              <h3 className="text-base md:text-xl font-bold whitespace-nowrap" 
                style={{ color: isDarkMode ? '#13151B' : '#F3EDE3' }}>
                ENTER RECEIPT NUMBER:
              </h3>
              
              <form onSubmit={handleSubmit} className="flex flex-1 max-w-2xl w-full items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Search className="w-4 h-4" style={{ color: isDarkMode ? '#6B7280' : '#F3EDE3' }} />
                  </div>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="Write here..."
                    className="w-full pl-9 pr-3 py-2 border-2 rounded-lg placeholder-gray-500 focus:outline-none text-sm"
                    style={{ 
                      backgroundColor: '#FFFFFF',
                      borderColor: isDarkMode ? '#2A524C' : '#F3EDE3',
                      color: '#13151B'
                    }}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`py-2 px-3 font-semibold rounded-lg transition-all text-sm border shadow flex items-center justify-center gap-1 whitespace-nowrap flex-shrink-0 ${
                    isDarkMode ? 'hover:bg-[#2A524C]' : 'hover:bg-[#D5DCDB]'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ 
                    backgroundColor: isDarkMode ? '#18442AF5' : '#F3EDE3',
                    color: isDarkMode ? '#D5DCDB' : '#183D3D',
                    borderColor: isDarkMode ? '#18442AF5' : '#F3EDE3'
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {isLoading ? 'Loading...' : 'View'}
                </button>

                <button
                  type="button"
                  onClick={handleScanQR}
                  disabled={isLoading || isScanning}
                  className={`py-2 px-3 font-semibold rounded-lg transition-all text-sm border shadow flex items-center justify-center gap-1 whitespace-nowrap flex-shrink-0 ${
                    isDarkMode ? 'hover:bg-[#2A524C]' : 'hover:bg-[#D5DCDB]'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ 
                    backgroundColor: isDarkMode ? '#2A524C' : '#F3EDE3',
                    color: isDarkMode ? '#D5DCDB' : '#183D3D',
                    borderColor: isDarkMode ? '#2A524C' : '#F3EDE3'
                  }}
                >
                  {isScanning ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isScanning ? 'Scanning...' : 'Scan QR'}
                  </span>
                </button>
              </form>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-3 text-center">
                <p className="text-red-500 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* QR Scanner Modal */}
          {showScanner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            >
              <div 
                className="p-4 rounded-xl max-w-md w-full mx-4 relative border-2"
                style={{
                  backgroundColor: isDarkMode ? '#F3EDE3' : '#183D3D',
                  borderColor: isDarkMode ? '#2A524C' : '#183D3D',
                  color: isDarkMode ? '#13151B' : '#F3EDE3'
                }}
              >
                <button
                  onClick={closeScanner}
                  className="absolute top-2 right-2 transition-colors hover:opacity-70"
                  style={{ color: isDarkMode ? '#13151B' : '#F3EDE3' }}
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 
                  className="text-lg font-bold mb-3 text-center"
                  style={{ color: isDarkMode ? '#13151B' : '#F3EDE3' }}
                >
                  Scan QR Code
                </h3>
                
                {!scanMethod && (
                  <div className="space-y-3">
                    <p 
                      className="text-center text-sm mb-3"
                      style={{ color: isDarkMode ? '#6B7280' : '#F3EDE3' }}
                    >
                      Choose how you want to scan the QR code:
                    </p>
                    
                    <button
                      onClick={startCameraScan}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                        isDarkMode ? 'hover:bg-[#2A524C]' : 'hover:bg-[#D5DCDB]'
                      }`}
                      style={{
                        backgroundColor: isDarkMode ? '#18442A' : '#F3EDE3',
                        color: isDarkMode ? '#D5DCDB' : '#183D3D'
                      }}
                    >
                      <Camera className="w-4 h-4" />
                      Use Camera
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={handleUploadClick}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                          isDarkMode ? 'hover:bg-[#2A524C]' : 'hover:bg-[#D5DCDB]'
                        }`}
                        style={{
                          backgroundColor: isDarkMode ? '#2A524C' : '#F3EDE3',
                          color: isDarkMode ? '#D5DCDB' : '#183D3D'
                        }}
                      >
                        <Upload className="w-4 h-4" />
                        Upload Image
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {scanMethod === 'camera' && (
                  <>
                    <div className="w-full h-48 bg-black rounded-lg mb-3 relative overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 border-2 border-green-400 border-dashed rounded-lg"></div>
                      </div>
                      
                      {isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="text-center text-white">
                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-sm">Scanning QR code...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center mb-3">
                      <p 
                        className="text-xs"
                        style={{ color: isDarkMode ? '#6B7280' : '#F3EDE3' }}
                      >
                        Position the QR code within the frame
                      </p>
                    </div>
                  </>
                )}

                {scanMethod === 'file' && isScanning && (
                  <div 
                    className="w-full h-48 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: isDarkMode ? '#E5E7EB' : '#2A524C' }}
                  >
                    <div className="text-center">
                      <div 
                        className="w-6 h-6 border-4 rounded-full animate-spin mx-auto mb-2"
                        style={{ 
                          borderColor: isDarkMode ? '#6B7280' : '#F3EDE3',
                          borderTopColor: 'transparent'
                        }}
                      />
                      <p style={{ color: isDarkMode ? '#6B7280' : '#F3EDE3' }}>
                        Processing image...
                      </p>
                      <p 
                        className="text-xs mt-1"
                        style={{ color: isDarkMode ? '#6B7280' : '#F3EDE3' }}
                      >
                        Detecting QR code...
                      </p>
                    </div>
                  </div>
                )}

                {scanMethod && (
                  <button
                    onClick={closeScanner}
                    className={`w-full py-2 rounded-lg font-semibold transition-colors text-sm ${
                      isDarkMode ? 'hover:bg-[#2A524C]' : 'hover:bg-[#D5DCDB]'
                    }`}
                    style={{
                      backgroundColor: isDarkMode ? '#6B7280' : '#2A524C',
                      color: '#FFFFFF'
                    }}
                  >
                    Cancel Scan
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Customer Information & Laundry Progress */}
          {showStatus && trackingData && (
            <motion.div
              ref={progressSectionRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5 }}
              className="border-t pt-4"
              style={{ borderColor: isDarkMode ? '#2A524C' : '#F3EDE3' }}
            >
              <CustomerInfo
                isVisible={showStatus}
                isDarkMode={isDarkMode}
                isMobile={isMobile}
                showFullCustomerInfo={showFullCustomerInfo}
                toggleFullCustomerInfo={toggleFullCustomerInfo}
                handleViewReceipt={handleViewReceipt}
                customerData={trackingData}
              />

              {laundryLoads.length > 0 && (
                <LaundryProgress
                  isVisible={showStatus}
                  isDarkMode={isDarkMode}
                  isMobile={isMobile}
                  currentLoadIndex={currentLoadIndex}
                  laundryLoads={laundryLoads}
                  prevLoad={prevLoad}
                  nextLoad={nextLoad}
                  goToLoad={goToLoad}
                />
              )}
            </motion.div>
          )}
        </motion.div>

        {/* View Receipt Modal */}
        <ViewReceipt
          isVisible={isVisible}
          isDarkMode={isDarkMode}
          showReceiptOptions={showReceiptOptions}
          closeReceiptOptions={closeReceiptOptions}
          handlePrintReceipt={handlePrintReceipt}
          handleDownloadReceipt={handleDownloadReceipt}
          receiptData={trackingData}
        />

        {/* Bottom Section - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Recent Searches Cards */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 2.2 }}
            className="rounded-2xl p-4 md:p-6 border-2"
            style={{
              backgroundColor: isDarkMode ? '#F3EDE3' : '#183D3D',
              borderColor: isDarkMode ? '#2A524C' : '#183D3D',
              color: isDarkMode ? '#13151B' : '#F3EDE3'
            }}
          >
            <h3 className="text-lg md:text-xl font-bold mb-4">
              Recent Searches
            </h3>
            
            <div className="max-h-80 md:max-h-96 overflow-y-auto space-y-3 md:space-y-4 pr-2">
              {recentSearches.length > 0 ? (
                recentSearches.map((item, index) => (
                  <div
                    key={index}
                    className={`rounded-xl p-3 md:p-4 border cursor-pointer transition-all ${
                      isDarkMode ? 'hover:bg-[#2A524C]' : 'hover:bg-[#D5DCDB]'
                    }`}
                    style={{
                      backgroundColor: isDarkMode ? '#FFFFFF' : '#F3EDE3',
                      borderColor: isDarkMode ? '#2A524C' : '#183D3D',
                      color: isDarkMode ? '#13151B' : '#183D3D'
                    }}
                    onClick={() => handleRecentSearchClick(item.receiptNumber)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-mono font-semibold text-sm md:text-base"
                        style={{ color: isDarkMode ? '#18442A' : '#183D3D' }}>
                        {item.receiptNumber}
                      </p>
                    </div>
                    <h4 className="text-base md:text-lg font-semibold mb-1"
                      style={{ color: isDarkMode ? '#13151B' : '#183D3D' }}>
                      Click to track again
                    </h4>
                    <p className="text-xs md:text-sm"
                      style={{ color: isDarkMode ? '#6B7280' : '#183D3D' }}>
                      Last searched: {item.searchedAt}
                    </p>
                  </div>
                ))
              ) : (
                <div 
                  className="text-center p-4 rounded-xl border"
                  style={{
                    backgroundColor: isDarkMode ? '#FFFFFF' : '#F3EDE3',
                    borderColor: isDarkMode ? '#2A524C' : '#183D3D',
                    color: isDarkMode ? '#13151B' : '#183D3D'
                  }}
                >
                  <p className="text-sm md:text-base">
                    No recent searches yet
                  </p>
                  <p className="text-xs mt-1 opacity-70">
                    Your searched receipts will appear here
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Middle Column - Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.4 }}
            className="flex flex-col space-y-4 md:space-y-6"
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`rounded-2xl p-4 md:p-6 border-2 text-center flex-1 transition-all ${
                  isDarkMode ? 'hover:bg-[#2A524C]' : 'hover:bg-[#D5DCDB]'
                }`}
                style={{
                  backgroundColor: isDarkMode ? '#F3EDE3' : '#183D3D',
                  borderColor: isDarkMode ? '#2A524C' : '#183D3D',
                  color: isDarkMode ? '#13151B' : '#F3EDE3'
                }}
              >
                <div className="text-2xl md:text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-sm md:text-lg font-semibold">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Right Column - Reminder Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 2.6 }}
            className="rounded-2xl p-4 md:p-6 border-2"
            style={{
              backgroundColor: isDarkMode ? '#F3EDE3' : '#183D3D',
              borderColor: isDarkMode ? '#2A524C' : '#183D3D',
              color: isDarkMode ? '#13151B' : '#F3EDE3'
            }}
          >
            <h3 className="text-lg md:text-xl font-bold mb-4">
              Reminder:
            </h3>
            
            <p className="mb-4 leading-relaxed text-sm md:text-base">
              We value your trust in our laundry service. To keep you updated, we have a Notification System in place:
            </p>
            
            <div className="space-y-3 mb-4">
              {[
                { icon: CheckCircle2, text: "You will receive an SMS notification once your laundry is ready for pickup." },
                { icon: Bell, text: "If your laundry remains unclaimed for 3 days, you will receive a reminder notification." },
                { icon: AlertTriangle, text: "If your laundry is still uncollected after 7 days, a final notice will be sent, stating that your laundry will be disposed of." }
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <item.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-xs md:text-sm flex-1 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
            
            <div 
              className={`p-3 rounded-xl border mb-3 transition-all ${
                isDarkMode ? 'hover:bg-[#2A524C]' : 'hover:bg-[#D5DCDB]'
              }`}
              style={{
                backgroundColor: isDarkMode ? '#FFFFFF' : '#2A524C',
                borderColor: isDarkMode ? '#2A524C' : '#F3EDE3'
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <Phone className="w-4 h-4" />
                <p className="text-center text-xs md:text-sm leading-relaxed">
                  Please make sure your contact number is accurate and active to receive updates.
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="italic text-xs md:text-sm font-semibold">
                Thank you for your cooperation!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default ServiceTracking;