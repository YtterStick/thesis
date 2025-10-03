import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Lottie from "lottie-react";
import { QrCode, Search, Camera, Upload, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

// Import Lottie animations
import washingMachine from "@/assets/lottie/washing-machine.json";
import dryerMachine from "@/assets/lottie/dryer-machine.json";
import clothes from "@/assets/lottie/clothes.json";
import unwashed from "@/assets/lottie/unwashed.json";

const ServiceTracking = ({ isVisible }) => {
  const [receiptNumber, setReceiptNumber] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMethod, setScanMethod] = useState(null); // 'camera' or 'file'
  const [isMobile, setIsMobile] = useState(false);
  const [showFullCustomerInfo, setShowFullCustomerInfo] = useState(false);
  const [currentLoadIndex, setCurrentLoadIndex] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const progressSectionRef = useRef(null);

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

  // Auto-scroll to progress section when status is shown
  useEffect(() => {
    if (showStatus && progressSectionRef.current) {
      setTimeout(() => {
        progressSectionRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 300);
    }
  }, [showStatus]);

  // Sample history data
  const historyItems = [
    { receiptNumber: "R-meh77tu", status: "Your laundry has been picked up", date: "09/22/2025" },
    { receiptNumber: "R-meh74tu", status: "Your laundry has been picked up", date: "09/21/2025" },
    { receiptNumber: "R-meh72tu", status: "Your laundry has been picked up", date: "09/20/2025" },
    { receiptNumber: "R-meh70tu", status: "Your laundry has been picked up", date: "09/19/2025" },
    { receiptNumber: "R-meh68tu", status: "Your laundry has been picked up", date: "09/18/2025" },
  ];

  const stats = [
    { number: "50", label: "Total No. of Laundry" },
    { number: "50", label: "Total No. of Washing" },
    { number: "50", label: "Total No. of Drying" }
  ];

  // Sample customer data - updated to use counts
  const customerData = {
    name: "Andrei",
    loads: 3,
    detergent: 2, // Now just a count
    fabric: 3, // Now just a count
    dateCreated: "10-04-2024",
    staffProcessedBy: "staffandrei"
  };

  // Sample laundry loads with different statuses - updated to use counts
  const laundryLoads = [
    {
      loadNumber: 1,
      statusSteps: [
        {
          lottie: washingMachine,
          title: "Washing",
          description: "Your laundry is now being washed",
          active: true,
          estimatedTime: "35 min",
          startedAt: "10:00 AM"
        },
        {
          lottie: dryerMachine,
          title: "Drying", 
          description: "Your laundry is now being dried",
          active: false,
          estimatedTime: "40-60 min"
        },
        {
          lottie: clothes,
          title: "Folding",
          description: "Your laundry is now being folded",
          active: false,
          estimatedTime: "20-30 min"
        },
        {
          lottie: unwashed,
          title: "Ready",
          description: "Ready for pickup at the counter",
          active: false,
          estimatedTime: "5 min"
        }
      ],
      fabricType: 2, // Now just a count
      detergent: 1, // Now just a count
      weight: "5 kg"
    },
    {
      loadNumber: 2,
      statusSteps: [
        {
          lottie: washingMachine,
          title: "Washing",
          description: "Your laundry is now being washed",
          active: false,
          estimatedTime: "35 min"
        },
        {
          lottie: dryerMachine,
          title: "Drying", 
          description: "Your laundry is now being dried",
          active: true,
          estimatedTime: "40-60 min",
          startedAt: "11:15 AM"
        },
        {
          lottie: clothes,
          title: "Folding",
          description: "Your laundry is now being folded",
          active: false,
          estimatedTime: "20-30 min"
        },
        {
          lottie: unwashed,
          title: "Ready",
          description: "Ready for pickup at the counter",
          active: false,
          estimatedTime: "5 min"
        }
      ],
      fabricType: 1, // Now just a count
      detergent: 2, // Now just a count
      weight: "3 kg"
    },
    {
      loadNumber: 3,
      statusSteps: [
        {
          lottie: washingMachine,
          title: "Washing",
          description: "Your laundry is now being washed",
          active: false,
          estimatedTime: "35 min"
        },
        {
          lottie: dryerMachine,
          title: "Drying", 
          description: "Your laundry is now being dried",
          active: false,
          estimatedTime: "40-60 min"
        },
        {
          lottie: clothes,
          title: "Folding",
          description: "Your laundry is now being folded",
          active: true,
          estimatedTime: "20-30 min",
          startedAt: "12:30 PM"
        },
        {
          lottie: unwashed,
          title: "Ready",
          description: "Ready for pickup at the counter",
          active: false,
          estimatedTime: "5 min"
        }
      ],
      fabricType: 3, // Now just a count
      detergent: 1, // Now just a count
      weight: "7 kg"
    }
  ];

  const currentLoad = laundryLoads[currentLoadIndex];
  const currentStep = currentLoad.statusSteps.find(step => step.active) || currentLoad.statusSteps[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle receipt submission
    console.log("Receipt submitted:", receiptNumber);
    setShowStatus(true);
    setShowFullCustomerInfo(false);
    setCurrentLoadIndex(0); // Reset to first load
  };

  const handleScanQR = () => {
    setShowScanner(true);
    setScanMethod(null); // Reset to show choice modal
  };

  const startCameraScan = async () => {
    try {
      setIsScanning(true);
      setScanMethod('camera');
      
      // Check if browser supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera not supported in your browser. Please try file upload.");
        setIsScanning(false);
        setScanMethod(null);
        return;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      
      // Display camera stream in video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Simulate QR code scanning process
      setTimeout(() => {
        const scannedReceipt = "R-meh77tu"; // Simulated scanned receipt
        setReceiptNumber(scannedReceipt);
        closeScanner();
        setShowStatus(true);
        setShowFullCustomerInfo(false);
        setCurrentLoadIndex(0);
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
      
      // Simulate file processing and QR/barcode detection
      console.log("Processing file:", file.name);
      
      setTimeout(() => {
        const scannedReceipt = "R-meh77tu"; // Simulated scanned receipt from file
        setReceiptNumber(scannedReceipt);
        closeScanner();
        setShowStatus(true);
        setShowFullCustomerInfo(false);
        setCurrentLoadIndex(0);
        
        // Reset file input
        event.target.value = '';
      }, 2000);
    }
  };

  const closeScanner = () => {
    // Stop camera stream if active
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
    if (currentLoadIndex < laundryLoads.length - 1) {
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

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
      transition={{ duration: 0.8, delay: 1.6 }}
      className="py-12 md:py-16 px-4 bg-[#0B2B26]"
      id="service_tracking"
    >
      <div className="max-w-[90%] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.0 }}
          className="rounded-2xl p-6 md:p-8 border-2 mb-8"
          style={{
            backgroundColor: '#F3EDE3',
            borderColor: '#2A524C',
            color: '#13151B'
          }}
        >
          {/* Receipt Input Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
              {/* "ENTER RECEIPT NUMBER:" text */}
              <h3 className="text-lg md:text-2xl font-bold whitespace-nowrap" style={{ color: '#13151B' }}>
                ENTER RECEIPT NUMBER:
              </h3>
              
              {/* Input and Button Container */}
              <form onSubmit={handleSubmit} className="flex flex-1 max-w-2xl w-full items-center gap-2 md:gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2">
                    <Search className="w-4 h-4 md:w-5 md:h-5 text-[#6B7280]" />
                  </div>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="Write here..."
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 bg-white border-2 border-[#2A524C] rounded-xl text-[#13151B] placeholder-[#6B7280] focus:outline-none focus:border-[#4A756D] text-sm md:text-base"
                    style={{ backgroundColor: '#FFFFFF' }}
                  />
                </div>
                
                {/* View Button for Manual Input */}
                <button
                  type="submit"
                  className="py-2 md:py-3 px-4 md:px-6 font-semibold rounded-xl transition-all transform hover:scale-105 text-sm md:text-base border-2 shadow-lg flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap flex-shrink-0"
                  style={{ 
                    backgroundColor: '#18442AF5',
                    color: '#D5DCDB',
                    borderColor: '#18442AF5'
                  }}
                >
                  <Search className="w-4 h-4 md:w-5 md:h-5" />
                  View
                </button>

                {/* QR Code Scanner Button */}
                <button
                  type="button"
                  onClick={handleScanQR}
                  className="py-2 md:py-3 px-3 md:px-4 font-semibold rounded-xl transition-all transform hover:scale-105 text-sm md:text-base border-2 shadow-lg flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap flex-shrink-0"
                  style={{ 
                    backgroundColor: '#2A524C',
                    color: '#D5DCDB',
                    borderColor: '#2A524C'
                  }}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                  <span className="hidden sm:inline">Scan QR</span>
                </button>
              </form>
            </div>
          </div>

          {/* QR Scanner Modal */}
          {showScanner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white p-4 md:p-6 rounded-2xl max-w-md w-full mx-4 relative">
                {/* Close Button */}
                <button
                  onClick={closeScanner}
                  className="absolute top-2 right-2 md:top-4 md:right-4 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                <h3 className="text-lg md:text-xl font-bold mb-4 text-center">Scan QR Code</h3>
                
                {/* Choice Modal - Show when no method selected */}
                {!scanMethod && (
                  <div className="space-y-3 md:space-y-4">
                    <p className="text-gray-600 text-center text-sm md:text-base mb-4">
                      Choose how you want to scan the QR code:
                    </p>
                    
                    <button
                      onClick={startCameraScan}
                      className="w-full py-3 md:py-4 px-4 md:px-6 bg-[#18442A] text-white rounded-xl font-semibold hover:bg-[#2A524C] transition-colors flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base"
                    >
                      <Camera className="w-4 h-4 md:w-6 md:h-6" />
                      Use Camera
                    </button>
                    
                    <label className="block w-full py-3 md:py-4 px-4 md:px-6 bg-[#2A524C] text-white rounded-xl font-semibold hover:bg-[#3A635C] transition-colors flex items-center justify-center gap-2 md:gap-3 cursor-pointer text-sm md:text-base">
                      <Upload className="w-4 h-4 md:w-6 md:h-6" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Camera Preview */}
                {scanMethod === 'camera' && (
                  <>
                    <div className="w-full h-48 md:h-64 bg-black rounded-lg mb-4 relative overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      
                      {/* QR Scanner Frame Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 md:w-48 md:h-48 border-2 border-green-400 border-dashed rounded-lg"></div>
                      </div>
                      
                      {isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="text-center text-white">
                            <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-sm md:text-base">Scanning QR code...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center mb-4">
                      <p className="text-xs md:text-sm text-gray-600">
                        Position the QR code within the frame
                      </p>
                    </div>
                  </>
                )}

                {/* File Upload Preview */}
                {scanMethod === 'file' && isScanning && (
                  <div className="w-full h-48 md:h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-[#18442A] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-gray-600 text-sm md:text-base">Processing image...</p>
                      <p className="text-gray-500 text-xs md:text-sm mt-2">Detecting QR code...</p>
                    </div>
                  </div>
                )}

                {/* Cancel Button */}
                {scanMethod && (
                  <button
                    onClick={closeScanner}
                    className="w-full py-2 md:py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors text-sm md:text-base"
                  >
                    Cancel Scan
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Customer Information & Laundry Progress - Only show when View is clicked */}
          {showStatus && (
            <motion.div
              ref={progressSectionRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5 }}
              className="border-t border-[#2A524C] pt-6 md:pt-8"
            >
              {/* Customer Information Section */}
              <div className="mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center" style={{ color: '#13151B' }}>
                  Customer Information
                </h3>
                
                {/* Mobile View - Compact Customer Info */}
                {isMobile && !showFullCustomerInfo && (
                  <div className="bg-white rounded-xl border-2 border-[#2A524C] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#18442A] rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {customerData.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#13151B] text-base">
                            {customerData.name}
                          </h4>
                          <p className="text-[#6B7280] text-xs">
                            {customerData.loads} loads • {customerData.detergent} detergent • {customerData.fabric} fabric
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={toggleFullCustomerInfo}
                        className="flex items-center gap-1 text-[#18442A] font-semibold text-sm"
                      >
                        View All
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile View - Full Customer Info (when expanded) */}
                {isMobile && showFullCustomerInfo && (
                  <div className="bg-white rounded-xl border-2 border-[#2A524C] p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-[#13151B]">Customer Details</h4>
                      <button
                        onClick={toggleFullCustomerInfo}
                        className="flex items-center gap-1 text-[#18442A] font-semibold text-sm"
                      >
                        Show Less
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#6B7280] text-sm">Customer Name</span>
                        <span className="font-semibold text-[#13151B]">{customerData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280] text-sm">Number of Loads</span>
                        <span className="font-semibold text-[#13151B]">{customerData.loads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280] text-sm">Detergent</span>
                        <span className="font-semibold text-[#13151B]">{customerData.detergent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280] text-sm">Fabric</span>
                        <span className="font-semibold text-[#13151B]">{customerData.fabric}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280] text-sm">Date Created</span>
                        <span className="font-semibold text-[#13151B]">{customerData.dateCreated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280] text-sm">Staff Processed By</span>
                        <span className="font-semibold text-[#13151B]">{customerData.staffProcessedBy}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Desktop View - Full Customer Info */}
                {!isMobile && (
                  <div className="bg-white rounded-xl border-2 border-[#2A524C] p-4 md:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs md:text-sm text-[#6B7280] font-medium">Customer Name</span>
                        <span className="text-base md:text-lg font-semibold text-[#13151B]">{customerData.name}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-xs md:text-sm text-[#6B7280] font-medium">Number of Loads</span>
                        <span className="text-base md:text-lg font-semibold text-[#13151B]">{customerData.loads}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-xs md:text-sm text-[#6B7280] font-medium">Detergent</span>
                        <span className="text-base md:text-lg font-semibold text-[#13151B]">{customerData.detergent}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-xs md:text-sm text-[#6B7280] font-medium">Fabric</span>
                        <span className="text-base md:text-lg font-semibold text-[#13151B]">{customerData.fabric}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-xs md:text-sm text-[#6B7280] font-medium">Date Created</span>
                        <span className="text-base md:text-lg font-semibold text-[#13151B]">{customerData.dateCreated}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-xs md:text-sm text-[#6B7280] font-medium">Staff Processed By</span>
                        <span className="text-base md:text-lg font-semibold text-[#13151B]">{customerData.staffProcessedBy}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Laundry Progress Section */}
              <div className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-xl md:text-2xl font-bold" style={{ color: '#13151B' }}>
                    Laundry Progress
                  </h3>
                  
                  {/* Load Navigation */}
                  <div className="flex items-center gap-2 md:gap-4">
                    <span className="text-sm md:text-base text-[#6B7280]">
                      Load {currentLoadIndex + 1} of {laundryLoads.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={prevLoad}
                        disabled={currentLoadIndex === 0}
                        className="p-1 md:p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        style={{ 
                          backgroundColor: currentLoadIndex === 0 ? '#E5E7EB' : '#18442A',
                          color: currentLoadIndex === 0 ? '#9CA3AF' : 'white'
                        }}
                      >
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={nextLoad}
                        disabled={currentLoadIndex === laundryLoads.length - 1}
                        className="p-1 md:p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        style={{ 
                          backgroundColor: currentLoadIndex === laundryLoads.length - 1 ? '#E5E7EB' : '#18442A',
                          color: currentLoadIndex === laundryLoads.length - 1 ? '#9CA3AF' : 'white'
                        }}
                      >
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Load Details */}
                <div className="bg-white rounded-xl border-2 border-[#2A524C] p-4 mb-4 md:mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 text-center">
                    <div>
                      <span className="text-xs md:text-sm text-[#6B7280]">Load Number</span>
                      <p className="font-semibold text-[#13151B] text-lg md:text-xl">{currentLoad.loadNumber}</p>
                    </div>
                    <div>
                      <span className="text-xs md:text-sm text-[#6B7280]">Fabric Type</span>
                      <p className="font-semibold text-[#13151B]">{currentLoad.fabricType}</p>
                    </div>
                    <div>
                      <span className="text-xs md:text-sm text-[#6B7280]">Detergent</span>
                      <p className="font-semibold text-[#13151B]">{currentLoad.detergent}</p>
                    </div>
                  </div>
                </div>

                {/* Load Progress Dots */}
                <div className="flex justify-center mb-4 md:mb-6">
                  <div className="flex gap-2">
                    {laundryLoads.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToLoad(index)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index === currentLoadIndex 
                            ? 'bg-[#18442A] scale-125' 
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Mobile View - Current Step Only */}
                {isMobile && (
                  <div className="bg-white rounded-xl border-2 border-[#2A524C] p-4">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 mx-auto mb-3">
                        <Lottie 
                          animationData={currentStep.lottie}
                          loop={currentStep.active}
                          autoplay={true}
                        />
                      </div>
                      <h4 className="font-semibold text-[#13151B] text-lg mb-1">
                        {currentStep.title}
                      </h4>
                      <p className="text-[#6B7280] text-sm mb-3">
                        {currentStep.description}
                      </p>
                      {currentStep.startedAt && (
                        <p className="text-xs text-[#18442A] font-semibold">
                          Started at: {currentStep.startedAt}
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-[#18442A] text-white p-3 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-sm font-semibold">Live</span>
                      </div>
                      <p className="text-sm font-semibold">EST: {currentStep.estimatedTime}</p>
                    </div>
                  </div>
                )}

                {/* Desktop View - Full Horizontal Timeline */}
                {!isMobile && (
                  <>
                    {/* Improved Horizontal Progress Steps */}
                    <div className="relative mb-6 md:mb-8">
                      {/* Progress Line */}
                      <div className="absolute top-12 left-0 right-0 h-1 bg-gray-300 z-10"></div>
                      <div 
                        className="absolute top-12 left-0 h-1 bg-[#18442A] z-20 transition-all duration-500"
                        style={{ 
                          width: `${(currentLoad.statusSteps.findIndex(s => s.active) + 1) / currentLoad.statusSteps.length * 100}%` 
                        }}
                      ></div>

                      {/* Steps Container */}
                      <div className="relative z-30 grid grid-cols-4 gap-2 md:gap-4">
                        {currentLoad.statusSteps.map((step, index) => (
                          <div key={index} className="flex flex-col items-center">
                            {/* Progress Circle */}
                            <div className={`w-6 h-6 rounded-full border-4 mb-6 z-30 ${
                              step.active 
                                ? 'bg-[#18442A] border-[#18442A] scale-110' 
                                : index < currentLoad.statusSteps.findIndex(s => s.active) 
                                  ? 'bg-[#18442A] border-[#18442A]' 
                                  : 'bg-white border-gray-300'
                            } transition-all duration-300`}></div>

                            {/* Lottie Icon */}
                            <div className={`mb-4 transition-all duration-300 ${
                              step.active ? 'scale-110' : 'opacity-50 grayscale'
                            }`}>
                              <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                                <Lottie 
                                  animationData={step.lottie}
                                  loop={step.active}
                                  autoplay={true}
                                  style={{ 
                                    width: step.active ? 80 : 64,
                                    height: step.active ? 80 : 64
                                  }}
                                />
                              </div>
                            </div>

                            {/* Step Content */}
                            <div className="text-center w-full px-1">
                              <h4 className={`font-semibold mb-2 text-xs md:text-sm leading-tight ${
                                step.active ? "text-[#13151B]" : "text-[#6B7280]"
                              }`}>
                                {step.title}
                              </h4>
                              <p className={`text-xs mb-3 leading-tight ${
                                step.active ? "text-[#6B7280]" : "text-[#93A29F]"
                              }`}>
                                {step.description}
                              </p>
                              
                              {/* Started Time */}
                              {step.startedAt && (
                                <p className="text-xs text-[#18442A] font-semibold mb-2">
                                  Started: {step.startedAt}
                                </p>
                              )}
                              
                              {/* Estimated Time */}
                              <div className={`p-2 rounded-lg font-semibold text-xs min-h-[2.5rem] flex items-center justify-center ${
                                step.active 
                                  ? "bg-[#18442A] text-white" 
                                  : "bg-gray-200 text-gray-600"
                              }`}>
                                <span className="text-center leading-tight">
                                  EST: {step.estimatedTime}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Estimated Time Summary */}
                    <div className="mt-6 p-4 bg-white rounded-xl border border-[#2A524C] text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-3 h-3 bg-[#18442A] rounded-full animate-pulse" />
                        <p className="text-[#18442A] font-semibold text-base md:text-lg">
                          Total Estimated Time: ~2 hours
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Bottom Section - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - History Cards with Scroll */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 2.2 }}
            className="rounded-2xl p-4 md:p-6 border-2"
            style={{
              backgroundColor: '#F3EDE3',
              borderColor: '#2A524C',
              color: '#13151B'
            }}
          >
            <h3 className="text-lg md:text-xl font-bold mb-4" style={{ color: '#13151B' }}>
              Recent History
            </h3>
            
            {/* Scrollable Container */}
            <div className="max-h-80 md:max-h-96 overflow-y-auto space-y-3 md:space-y-4 pr-2">
              {historyItems.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl p-3 md:p-4 border border-[#2A524C] bg-white"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-mono text-[#18442A] font-semibold text-sm md:text-base">
                      {item.receiptNumber}
                    </p>
                  </div>
                  <h4 className="text-base md:text-lg font-semibold mb-1" style={{ color: '#13151B' }}>
                    {item.status}
                  </h4>
                  <p className="text-[#6B7280] text-xs md:text-sm">{item.date}</p>
                </div>
              ))}
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
                className="rounded-2xl p-4 md:p-6 border-2 text-center flex-1"
                style={{
                  backgroundColor: '#F3EDE3',
                  borderColor: '#2A524C',
                  color: '#13151B'
                }}
              >
                <div className="text-2xl md:text-4xl font-bold mb-2" style={{ color: '#18442A' }}>
                  {stat.number}
                </div>
                <div className="text-sm md:text-lg font-semibold text-[#6B7280]">
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
              backgroundColor: '#F3EDE3',
              borderColor: '#2A524C',
              color: '#13151B'
            }}
          >
            <h3 className="text-lg md:text-xl font-bold mb-4" style={{ color: '#13151B' }}>
              Reminder:
            </h3>
            
            <p className="text-[#6B7280] mb-4 leading-relaxed text-sm md:text-base">
              We value your trust in our laundry service. To keep you updated, we have a Notification System in place:
            </p>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-start space-x-3">
                <div className="text-[#18442A] text-lg mt-0.5">☑</div>
                <p className="text-[#6B7280] text-xs md:text-sm flex-1 leading-relaxed">
                  You will receive an SMS notification once your laundry is ready for pickup.
                </p>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-[#18442A] text-lg mt-0.5">☑</div>
                <p className="text-[#6B7280] text-xs md:text-sm flex-1 leading-relaxed">
                  If your laundry remains unclaimed for 3 days, you will receive a reminder notification.
                </p>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-[#E53E3E] text-lg mt-0.5">▲</div>
                <p className="text-[#6B7280] text-xs md:text-sm flex-1 leading-relaxed">
                  If your laundry is still uncollected after 7 days, a final notice will be sent, stating that your laundry will be disposed of.
                </p>
              </div>
            </div>
            
            <div className="p-3 bg-white rounded-xl border border-[#2A524C] mb-3">
              <p className="text-[#6B7280] text-center text-xs md:text-sm leading-relaxed">
                Please make sure your contact number is accurate and active to receive updates.
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-[#18442A] italic text-xs md:text-sm font-semibold">
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