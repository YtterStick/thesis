import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { QrCode, Search, Camera, Upload, X, CheckCircle2, AlertTriangle, Bell, Phone, Loader2 } from "lucide-react";

// Import components
import ViewReceipt from "./ViewReceipt";
import CustomerInfo from "./CustomerInfo";
import LaundryProgress from "./LaundryProgress";

// Import Lottie animations
import washingMachine from "@/assets/lottie/washing-machine.json";
import dryerMachine from "@/assets/lottie/dryer-machine.json";
import clothes from "@/assets/lottie/clothes.json";
import unwashed from "@/assets/lottie/unwashed.json";

const ServiceTracking = ({ isVisible, isDarkMode, isMobile: propIsMobile }) => {
    const [receiptNumber, setReceiptNumber] = useState("");
    const [showStatus, setShowStatus] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMethod, setScanMethod] = useState(null);
    const [isMobile, setIsMobile] = useState(propIsMobile || false);
    const [showFullCustomerInfo, setShowFullCustomerInfo] = useState(false);
    const [currentLoadIndex, setCurrentLoadIndex] = useState(0);
    const [showReceiptOptions, setShowReceiptOptions] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [trackingData, setTrackingData] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [qrError, setQrError] = useState(null);
    const [scannedUrl, setScannedUrl] = useState(null);

    const fileInputRef = useRef(null);
    const scannerRef = useRef(null);
    const scannerInstanceRef = useRef(null);

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("recentLaundrySearches");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setRecentSearches(parsed.slice(0, 5));
                }
            }
        } catch (error) {
            console.warn("Failed to load recent searches:", error);
        }
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    // Fetch tracking data
    const fetchTrackingData = async (invoiceNumber) => {
        setIsLoading(true);
        setError(null);

        try {
            console.log(`🔍 Fetching tracking data for: ${invoiceNumber}`);
            const response = await fetch(`http://localhost:8080/api/track/${invoiceNumber}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Receipt number not found");
                }
                throw new Error("Failed to fetch tracking data");
            }

            const data = await response.json();
            console.log("✅ Tracking data received:", data);
            setTrackingData(data);
            setShowStatus(true);
            setShowFullCustomerInfo(false);
            setCurrentLoadIndex(0);
        } catch (err) {
            console.error("❌ Error fetching tracking data:", err);
            setError(err.message);
            setShowStatus(false);
            setTrackingData(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Add to recent searches
    const addToRecentSearches = (receiptNum) => {
        if (!receiptNum?.trim()) return;

        try {
            const newSearch = {
                receiptNumber: receiptNum.trim(),
                searchedAt: new Date().toLocaleDateString(),
                timestamp: Date.now(),
            };

            setRecentSearches((prev) => {
                const filtered = prev.filter((item) => item.receiptNumber !== newSearch.receiptNumber);
                const updated = [newSearch, ...filtered].slice(0, 5);
                localStorage.setItem("recentLaundrySearches", JSON.stringify(updated));
                return updated;
            });
        } catch (error) {
            console.warn("Failed to save recent search:", error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!receiptNumber.trim()) {
            setError("Please enter a receipt number");
            return;
        }

        console.log("📄 Receipt submitted:", receiptNumber);
        fetchTrackingData(receiptNumber);
        addToRecentSearches(receiptNumber);
    };

    const handleScanQR = () => {
        setShowScanner(true);
        setScanMethod(null);
        setQrError(null);
        setScannedUrl(null);
    };

    // Camera Scanner with Html5Qrcode - UPDATED VERSION
    const startCameraScan = async () => {
        try {
            setIsScanning(true);
            setScanMethod("camera");
            setQrLoading(true);
            setQrError(null);
            setScannedUrl(null);

            // Wait for DOM to update
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                const { Html5Qrcode } = await import("html5-qrcode");
                console.log("✅ Html5Qrcode loaded successfully");

                const scannerElementId = "html5qr-code-scanner";
                const scannerElement = document.getElementById(scannerElementId);
                
                if (!scannerElement) {
                    throw new Error("Scanner element not found");
                }

                console.log("🎥 Starting camera with Html5Qrcode...");
                
                // Create scanner instance
                const scanner = new Html5Qrcode(scannerElementId);
                scannerInstanceRef.current = scanner;

                await scanner.start(
                    { 
                        facingMode: "environment" 
                    },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    (decodedText) => {
                        console.log("✅ QR Code detected:", decodedText);
                        handleScannedQRCode(decodedText);
                    },
                    (errorMessage) => {
                        // This is normal - it's called when no QR code is found
                        console.log("🔍 Scanning...", errorMessage);
                    }
                ).catch(error => {
                    console.error("❌ Scanner start error:", error);
                    setQrError("Failed to start camera: " + error.message);
                    setQrLoading(false);
                    setIsScanning(false);
                });

                setQrLoading(false);
                console.log("✅ Camera started successfully");

            } catch (error) {
                console.error("❌ Camera error:", error);
                setQrError("Cannot access camera. Please check permissions.");
                setIsScanning(false);
                setScanMethod(null);
                setQrLoading(false);
            }
        } catch (error) {
            console.error("❌ Scanner setup error:", error);
            setQrError("Cannot start QR scanner.");
            setIsScanning(false);
            setScanMethod(null);
            setQrLoading(false);
        }
    };

    // File Upload with Html5Qrcode - UPDATED VERSION
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        console.log("📁 Processing image with Html5Qrcode:", file.name);
        setIsScanning(true);
        setScanMethod("file");
        setQrLoading(true);
        setQrError(null);
        setScannedUrl(null);

        try {
            event.target.value = "";

            if (!file.type.startsWith("image/")) {
                throw new Error("Please upload an image file");
            }

            const { Html5Qrcode } = await import("html5-qrcode");
            console.log("✅ Html5Qrcode loaded for file scan");
            
            // Create a temporary hidden element for file scanning
            const tempScannerId = "temp-file-scanner-" + Date.now();
            const tempDiv = document.createElement("div");
            tempDiv.id = tempScannerId;
            tempDiv.style.display = "none";
            document.body.appendChild(tempDiv);
            
            try {
                const scanner = new Html5Qrcode(tempScannerId);
                
                console.log("🔍 Scanning file with Html5Qrcode...");
                const decodedText = await scanner.scanFile(file, true);
                
                if (decodedText) {
                    console.log("🎉 QR CODE FOUND!", decodedText);
                    handleScannedQRCode(decodedText);
                } else {
                    console.log("❌ No QR code found in image");
                    setQrError("No QR code found. Please try a clearer image.");
                    setIsScanning(false);
                    setQrLoading(false);
                }
            } finally {
                // Always clean up the temporary element
                if (document.body.contains(tempDiv)) {
                    document.body.removeChild(tempDiv);
                }
            }
            
        } catch (error) {
            console.error("❌ Upload/scan error:", error);
            
            // Handle specific error cases
            let errorMessage = "Scan failed: " + error.message;
            if (error.message && typeof error.message === 'string') {
                if (error.message.includes("No MultiFormat Readers") || 
                    error.message.includes("NotFoundException")) {
                    errorMessage = "No QR code found in the image. Please try a clearer image.";
                } else if (error.message.includes("file format")) {
                    errorMessage = "Unsupported image format. Please use JPG, PNG, or WebP.";
                }
            }
            
            setQrError(errorMessage);
            setIsScanning(false);
            setQrLoading(false);
        }
    };

    // Handle scanned QR code data - UPDATED VERSION
    const handleScannedQRCode = (decodedText) => {
        console.log("📱 Raw QR data:", decodedText);
        
        // Set the scanned URL for logging
        setScannedUrl(decodedText);
        
        // Log the URL to console so you can see if it's working
        console.log("🎯 SCANNED URL:", decodedText);
        console.log("🔗 URL Type:", typeof decodedText);
        console.log("📏 URL Length:", decodedText.length);
        
        // Extract receipt number from URL if it's a full URL, otherwise use raw data
        let receiptNumber = decodedText.trim();
        
        // If it's a URL, try to extract the invoice number
        if (decodedText.includes('/')) {
            try {
                const url = new URL(decodedText);
                const pathParts = url.pathname.split('/');
                const lastPart = pathParts[pathParts.length - 1];
                
                if (lastPart && lastPart !== 'track') {
                    receiptNumber = lastPart;
                    console.log("📄 Extracted receipt number from URL:", receiptNumber);
                }
            } catch (e) {
                console.log("⚠️ Not a valid URL, using raw data as receipt number");
            }
        }
        
        console.log("🎯 Final receipt number to use:", receiptNumber);

        if (receiptNumber && receiptNumber.length > 0) {
            // Set the receipt number
            setReceiptNumber(receiptNumber);
            addToRecentSearches(receiptNumber);
            
            // Show success message with the scanned URL
            console.log("✅ QR code scanned successfully!");
            console.log("🔗 Full scanned URL:", decodedText);
            console.log("📄 Receipt number extracted:", receiptNumber);
            
            // Auto-fetch tracking data
            fetchTrackingData(receiptNumber);
            
            // Close scanner after short delay to show success
            setTimeout(() => {
                closeScanner();
            }, 1000);
        } else {
            console.error("❌ Invalid QR code - empty data");
            setQrError("Invalid QR code - no data found");
            setIsScanning(false);
            setQrLoading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const stopScanner = () => {
        if (scannerInstanceRef.current) {
            scannerInstanceRef.current.stop().then(() => {
                console.log("✅ Scanner stopped successfully");
                scannerInstanceRef.current.clear();
                scannerInstanceRef.current = null;
            }).catch(error => {
                console.warn("Scanner stop warning:", error);
                scannerInstanceRef.current = null;
            });
        }
    };

    const closeScanner = () => {
        stopScanner();
        setShowScanner(false);
        setIsScanning(false);
        setScanMethod(null);
        setQrLoading(false);
        setQrError(null);
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
        console.log("🖨️ Printing receipt:", trackingData);
        alert("Printing receipt...");
        setShowReceiptOptions(false);
    };

    const handleDownloadReceipt = () => {
        console.log("💾 Downloading receipt:", trackingData);
        alert("Downloading receipt as PDF...");
        setShowReceiptOptions(false);
    };

    const closeReceiptOptions = () => {
        setShowReceiptOptions(false);
    };

    const handleRecentSearchClick = (receiptNum) => {
        setReceiptNumber(receiptNum);
        fetchTrackingData(receiptNum);
    };

    // Convert backend data to frontend format for laundry progress
    const convertToLaundryLoads = (trackingData) => {
        if (!trackingData?.loadAssignments) return [];

        return trackingData.loadAssignments.map((load, index) => {
            const status = load.status || "NOT_STARTED";

            const statusSteps = [
                {
                    lottie: washingMachine,
                    title: "Washing",
                    description: "Your laundry is now being washed",
                    active: status === "WASHING",
                    estimatedTime: "35 min",
                    startedAt: load.startTime ? new Date(load.startTime).toLocaleTimeString() : undefined,
                },
                {
                    lottie: dryerMachine,
                    title: "Drying",
                    description: "Your laundry is now being dried",
                    active: status === "DRYING",
                    estimatedTime: "40-60 min",
                    startedAt: load.startTime ? new Date(load.startTime).toLocaleTimeString() : undefined,
                },
                {
                    lottie: clothes,
                    title: "Folding",
                    description: "Your laundry is now being folded",
                    active: status === "FOLDING",
                    estimatedTime: "20-30 min",
                    startedAt: load.startTime ? new Date(load.startTime).toLocaleTimeString() : undefined,
                },
                {
                    lottie: unwashed,
                    title: "Ready",
                    description: "Ready for pickup at the counter",
                    active: status === "COMPLETED",
                    estimatedTime: "5 min",
                },
            ];

            return {
                loadNumber: load.loadNumber || index + 1,
                statusSteps,
                fabricType: trackingData.fabricQty || 1,
                detergent: trackingData.detergentQty || 1,
                weight: "5 kg",
            };
        });
    };

    const stats = [
        { number: "50", label: "Total No. of Laundry" },
        { number: "50", label: "Total No. of Washing" },
        { number: "50", label: "Total No. of Drying" },
    ];

    const laundryLoads = convertToLaundryLoads(trackingData);

    return (
        <motion.section
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className={`px-4 py-12 md:py-16 ${isDarkMode ? "bg-[#0B2B26]" : "bg-[#E0EAE8]"}`}
            id="service_tracking"
        >
            <div className="mx-auto max-w-[90%]">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 2.0 }}
                    className="mb-8 rounded-xl border-2 p-4 md:p-6"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#183D3D",
                        borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                        color: isDarkMode ? "#13151B" : "#F3EDE3",
                    }}
                >
                    {/* Receipt Input Section */}
                    <div className="mb-6">
                        <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4">
                            <h3
                                className="whitespace-nowrap text-base font-bold md:text-xl"
                                style={{ color: isDarkMode ? "#13151B" : "#F3EDE3" }}
                            >
                                ENTER RECEIPT NUMBER:
                            </h3>

                            <form
                                onSubmit={handleSubmit}
                                className="flex w-full max-w-2xl flex-1 items-center gap-2"
                            >
                                <div className="relative flex-1">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 transform">
                                        <Search
                                            className="h-4 w-4"
                                            style={{ color: isDarkMode ? "#6B7280" : "#F3EDE3" }}
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={receiptNumber}
                                        onChange={(e) => setReceiptNumber(e.target.value)}
                                        placeholder="Write here..."
                                        className="w-full rounded-lg border-2 py-2 pl-9 pr-3 text-sm placeholder-gray-500 focus:outline-none"
                                        style={{
                                            backgroundColor: "#FFFFFF",
                                            borderColor: isDarkMode ? "#2A524C" : "#F3EDE3",
                                            color: "#13151B",
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`flex flex-shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold shadow transition-all ${
                                        isDarkMode ? "hover:bg-[#2A524C]" : "hover:bg-[#D5DCDB]"
                                    } ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
                                    style={{
                                        backgroundColor: isDarkMode ? "#18442AF5" : "#F3EDE3",
                                        color: isDarkMode ? "#D5DCDB" : "#183D3D",
                                        borderColor: isDarkMode ? "#18442AF5" : "#F3EDE3",
                                    }}
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    {isLoading ? "Loading..." : "View"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleScanQR}
                                    disabled={isLoading || isScanning}
                                    className={`flex flex-shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold shadow transition-all ${
                                        isDarkMode ? "hover:bg-[#2A524C]" : "hover:bg-[#D5DCDB]"
                                    } ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
                                    style={{
                                        backgroundColor: isDarkMode ? "#2A524C" : "#F3EDE3",
                                        color: isDarkMode ? "#D5DCDB" : "#183D3D",
                                        borderColor: isDarkMode ? "#2A524C" : "#F3EDE3",
                                    }}
                                >
                                    {isScanning ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <QrCode className="h-4 w-4" />
                                    )}
                                    <span className="hidden sm:inline">{isScanning ? "Scanning..." : "Scan QR"}</span>
                                </button>
                            </form>
                        </div>

                        {error && (
                            <div className="mt-3 text-center">
                                <p className="text-sm font-medium text-red-500">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* QR Scanner Modal */}
                    {showScanner && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
                        >
                            <div
                                className="relative mx-4 w-full max-w-md rounded-xl border-2 p-4"
                                style={{
                                    backgroundColor: isDarkMode ? "#F3EDE3" : "#183D3D",
                                    borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                                    color: isDarkMode ? "#13151B" : "#F3EDE3",
                                }}
                            >
                                <button
                                    onClick={closeScanner}
                                    className="absolute right-2 top-2 transition-colors hover:opacity-70"
                                    style={{ color: isDarkMode ? "#13151B" : "#F3EDE3" }}
                                >
                                    <X className="h-5 w-5" />
                                </button>

                                <h3
                                    className="mb-3 text-center text-lg font-bold"
                                    style={{ color: isDarkMode ? "#13151B" : "#F3EDE3" }}
                                >
                                    Scan QR Code
                                </h3>

                                {!scanMethod && (
                                    <div className="space-y-3">
                                        <p
                                            className="mb-3 text-center text-sm"
                                            style={{ color: isDarkMode ? "#6B7280" : "#F3EDE3" }}
                                        >
                                            Choose how you want to scan the QR code:
                                        </p>

                                        <button
                                            onClick={startCameraScan}
                                            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                                                isDarkMode ? "hover:bg-[#2A524C]" : "hover:bg-[#D5DCDB]"
                                            }`}
                                            style={{
                                                backgroundColor: isDarkMode ? "#18442A" : "#F3EDE3",
                                                color: isDarkMode ? "#D5DCDB" : "#183D3D",
                                            }}
                                        >
                                            <Camera className="h-4 w-4" />
                                            Use Camera
                                        </button>

                                        <div className="relative">
                                            <button
                                                onClick={handleUploadClick}
                                                className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                                                    isDarkMode ? "hover:bg-[#2A524C]" : "hover:bg-[#D5DCDB]"
                                                }`}
                                                style={{
                                                    backgroundColor: isDarkMode ? "#2A524C" : "#F3EDE3",
                                                    color: isDarkMode ? "#D5DCDB" : "#183D3D",
                                                }}
                                            >
                                                <Upload className="h-4 w-4" />
                                                Upload Image
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                )}

                                {scanMethod === "camera" && (
                                    <>
                                        <div className="relative mb-3 h-64 w-full overflow-hidden rounded-lg bg-black">
                                            <div 
                                                id="html5qr-code-scanner"
                                                className="h-full w-full"
                                            />
                                            
                                            {qrLoading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                                    <div className="text-center text-white">
                                                        <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                                                        <p>Loading Camera...</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {scannedUrl && (
                                            <div className="mb-3 p-2 rounded bg-green-100 border border-green-400">
                                                <p className="text-green-700 text-xs font-medium">QR Code Scanned Successfully!</p>
                                                <p className="text-green-600 text-xs break-all mt-1">URL: {scannedUrl}</p>
                                            </div>
                                        )}

                                        {qrError && (
                                            <div className="mb-3 text-center">
                                                <p className="text-sm text-red-500">{qrError}</p>
                                            </div>
                                        )}

                                        {isScanning && !qrLoading && !qrError && !scannedUrl && (
                                            <div className="text-center">
                                                <p
                                                    className="text-xs"
                                                    style={{ color: isDarkMode ? "#6B7280" : "#F3EDE3" }}
                                                >
                                                    Position the QR code within the frame
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}

                                {scanMethod === "file" && (
                                    <div className="mb-3 text-center">
                                        {qrLoading ? (
                                            <div className="flex h-64 items-center justify-center rounded-lg bg-gray-100">
                                                <div className="text-center">
                                                    <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                                                    <p>Processing image...</p>
                                                    <p className="text-xs mt-1 text-gray-600">Checking for QR code</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-64 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <p className="text-gray-600">Select an image containing QR code</p>
                                            </div>
                                        )}
                                        
                                        {scannedUrl && (
                                            <div className="mt-3 p-2 rounded bg-green-100 border border-green-400">
                                                <p className="text-green-700 text-xs font-medium">QR Code Scanned Successfully!</p>
                                                <p className="text-green-600 text-xs break-all mt-1">URL: {scannedUrl}</p>
                                            </div>
                                        )}
                                        
                                        {qrError && (
                                            <div className="mt-2 text-center">
                                                <p className="text-sm text-red-500">{qrError}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {scanMethod && (
                                    <button
                                        onClick={closeScanner}
                                        className={`mt-3 w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
                                            isDarkMode ? "hover:bg-[#2A524C]" : "hover:bg-[#D5DCDB]"
                                        }`}
                                        style={{
                                            backgroundColor: isDarkMode ? "#6B7280" : "#2A524C",
                                            color: "#FFFFFF",
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
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.5 }}
                            className="border-t pt-4"
                            style={{ borderColor: isDarkMode ? "#2A524C" : "#F3EDE3" }}
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
                <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
                    {/* Recent Searches */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 2.2 }}
                        className="rounded-2xl border-2 p-4 md:p-6"
                        style={{
                            backgroundColor: isDarkMode ? "#F3EDE3" : "#183D3D",
                            borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                            color: isDarkMode ? "#13151B" : "#F3EDE3",
                        }}
                    >
                        <h3 className="mb-4 text-lg font-bold md:text-xl">Recent Searches</h3>
                        <div className="max-h-80 space-y-3 overflow-y-auto pr-2 md:max-h-96 md:space-y-4">
                            {recentSearches.length > 0 ? (
                                recentSearches.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`cursor-pointer rounded-xl border p-3 transition-all md:p-4 ${
                                            isDarkMode ? "hover:bg-[#2A524C]" : "hover:bg-[#D5DCDB]"
                                        }`}
                                        style={{
                                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                            borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                                            color: isDarkMode ? "#13151B" : "#183D3D",
                                        }}
                                        onClick={() => handleRecentSearchClick(item.receiptNumber)}
                                    >
                                        <div className="mb-2 flex items-start justify-between">
                                            <p
                                                className="font-mono text-sm font-semibold md:text-base"
                                                style={{ color: isDarkMode ? "#18442A" : "#183D3D" }}
                                            >
                                                {item.receiptNumber}
                                            </p>
                                        </div>
                                        <h4
                                            className="mb-1 text-base font-semibold md:text-lg"
                                            style={{ color: isDarkMode ? "#13151B" : "#183D3D" }}
                                        >
                                            Click to track again
                                        </h4>
                                        <p
                                            className="text-xs md:text-sm"
                                            style={{ color: isDarkMode ? "#6B7280" : "#183D3D" }}
                                        >
                                            Last searched: {item.searchedAt}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div
                                    className="rounded-xl border p-4 text-center"
                                    style={{
                                        backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                        borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                                        color: isDarkMode ? "#13151B" : "#183D3D",
                                    }}
                                >
                                    <p className="text-sm md:text-base">No recent searches yet</p>
                                    <p className="mt-1 text-xs opacity-70">Your searched receipts will appear here</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Stats Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 2.4 }}
                        className="flex flex-col space-y-4 md:space-y-6"
                    >
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className={`flex-1 rounded-2xl border-2 p-4 text-center transition-all md:p-6 ${
                                    isDarkMode ? "hover:bg-[#2A524C]" : "hover:bg-[#D5DCDB]"
                                }`}
                                style={{
                                    backgroundColor: isDarkMode ? "#F3EDE3" : "#183D3D",
                                    borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                                    color: isDarkMode ? "#13151B" : "#F3EDE3",
                                }}
                            >
                                <div className="mb-2 text-2xl font-bold md:text-4xl">{stat.number}</div>
                                <div className="text-sm font-semibold md:text-lg">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Reminder Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 2.6 }}
                        className="rounded-2xl border-2 p-4 md:p-6"
                        style={{
                            backgroundColor: isDarkMode ? "#F3EDE3" : "#183D3D",
                            borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                            color: isDarkMode ? "#13151B" : "#F3EDE3",
                        }}
                    >
                        <h3 className="mb-4 text-lg font-bold md:text-xl">Reminder:</h3>
                        <p className="mb-4 text-sm leading-relaxed md:text-base">
                            We value your trust in our laundry service. To keep you updated, we have a Notification System in place:
                        </p>
                        <div className="mb-4 space-y-3">
                            {[
                                { icon: CheckCircle2, text: "You will receive an SMS notification once your laundry is ready for pickup." },
                                { icon: Bell, text: "If your laundry remains unclaimed for 3 days, you will receive a reminder notification." },
                                {
                                    icon: AlertTriangle,
                                    text: "If your laundry is still uncollected after 7 days, a final notice will be sent, stating that your laundry will be disposed of.",
                                },
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-start space-x-3"
                                >
                                    <item.icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                    <p className="flex-1 text-xs leading-relaxed md:text-sm">{item.text}</p>
                                </div>
                            ))}
                        </div>
                        <div
                            className={`mb-3 rounded-xl border p-3 transition-all ${isDarkMode ? "hover:bg-[#2A524C]" : "hover:bg-[#D5DCDB]"}`}
                            style={{
                                backgroundColor: isDarkMode ? "#FFFFFF" : "#2A524C",
                                borderColor: isDarkMode ? "#2A524C" : "#F3EDE3",
                            }}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <Phone className="h-4 w-4" />
                                <p className="text-center text-xs leading-relaxed md:text-sm">
                                    Please make sure your contact number is accurate and active to receive updates.
                                </p>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-semibold italic md:text-sm">Thank you for your cooperation!</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
};

export default ServiceTracking;