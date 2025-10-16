import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Search, Loader2, CheckCircle2,Bell,AlertTriangle,Clock,Phone} from "lucide-react";

// Import components
import ViewReceipt from "./ViewReceipt";
import CustomerInfo from "./CustomerInfo";
import LaundryProgress from "./LaundryProgress";
import QRScanner from "./QRScanner";
import RecentSearches from "./RecentSearches";

// Import Lottie animations
import washingMachine from "@/assets/lottie/washing-machine.json";
import dryerMachine from "@/assets/lottie/dryer-machine.json";
import clothes from "@/assets/lottie/clothes.json";
import unwashed from "@/assets/lottie/unwashed.json";

const API_BASE_URL = "https://thesis-g0pr.onrender.com/api";

const ServiceTracking = ({ isVisible, isDarkMode, isMobile: propIsMobile }) => {
    const [receiptNumber, setReceiptNumber] = useState("");
    const [showStatus, setShowStatus] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isMobile, setIsMobile] = useState(propIsMobile || false);
    const [showFullCustomerInfo, setShowFullCustomerInfo] = useState(false);
    const [currentLoadIndex, setCurrentLoadIndex] = useState(0);
    const [showReceiptOptions, setShowReceiptOptions] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [trackingData, setTrackingData] = useState(null);

    const mainCardRef = useRef(null);

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);

        return () => {
            window.removeEventListener("resize", checkMobile);
        };
    }, []);

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

    // Auto-scroll to show the entire main card when status is shown
    useEffect(() => {
        if (showStatus && mainCardRef.current) {
            setTimeout(() => {
                mainCardRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "nearest",
                });
            }, 100);
        }
    }, [showStatus]);

    // Fetch tracking data
    const fetchTrackingData = async (invoiceNumber) => {
        setIsLoading(true);
        setError(null);

        try {
            console.log(`🔍 Fetching tracking data for: ${invoiceNumber}`);
            const response = await fetch(`${API_BASE_URL}/api/track/${invoiceNumber}`);

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
    };

    // Handle QR scan result
    const handleQRScanned = (receiptNumber, scannedUrl) => {
        console.log("✅ QR code scanned successfully!");
        console.log("🔗 Full scanned URL:", scannedUrl);
        console.log("📄 Receipt number extracted:", receiptNumber);

        setReceiptNumber(receiptNumber);
        addToRecentSearches(receiptNumber);
        fetchTrackingData(receiptNumber);
    };

    // Close tracking function
    const handleCloseTracking = () => {
        setShowStatus(false);
        setTrackingData(null);
        setReceiptNumber("");
        setError(null);
        setCurrentLoadIndex(0);
        setShowFullCustomerInfo(false);
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
                },
                {
                    lottie: dryerMachine,
                    title: "Drying",
                    description: "Your laundry is now being dried",
                    active: status === "DRYING",
                    estimatedTime: "40-60 min",
                },
                {
                    lottie: clothes,
                    title: "Folding",
                    description: "Your laundry is now being folded",
                    active: status === "FOLDING",
                    estimatedTime: "20-30 min",
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
                    ref={mainCardRef}
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
                    {/* Receipt Input Section - Mobile Optimized */}
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
                                className="flex w-full max-w-2xl flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-2"
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
                                        className="w-full rounded-lg border-2 py-3 pl-9 pr-3 text-sm placeholder-gray-500 focus:outline-none sm:py-2"
                                        style={{
                                            backgroundColor: "#FFFFFF",
                                            borderColor: isDarkMode ? "#2A524C" : "#F3EDE3",
                                            color: "#13151B",
                                        }}
                                    />
                                </div>

                                <div className="flex w-full gap-2 sm:w-auto">
                                    <motion.button
                                        type="submit"
                                        disabled={isLoading}
                                        whileHover={{ 
                                            scale: 1.05,
                                            backgroundColor: isDarkMode ? "#2A524C" : "#D5DCDB",
                                            transition: { duration: 0.2 }
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-4 py-3 text-sm font-semibold shadow sm:flex-shrink-0 sm:py-2 ${
                                            isLoading ? "cursor-not-allowed opacity-50" : ""
                                        }`}
                                        style={{
                                            backgroundColor: isDarkMode ? "#18442AF5" : "#F3EDE3",
                                            color: isDarkMode ? "#D5DCDB" : "#183D3D",
                                            borderColor: isDarkMode ? "#18442AF5" : "#F3EDE3",
                                        }}
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        {isLoading ? "Loading..." : "View"}
                                    </motion.button>

                                    <motion.button
                                        type="button"
                                        onClick={handleScanQR}
                                        disabled={isLoading || isScanning}
                                        whileHover={{ 
                                            scale: 1.05,
                                            backgroundColor: isDarkMode ? "#3A635C" : "#E8F0EF",
                                            transition: { duration: 0.2 }
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-4 py-3 text-sm font-semibold shadow sm:flex-shrink-0 sm:py-2 ${
                                            isLoading ? "cursor-not-allowed opacity-50" : ""
                                        }`}
                                        style={{
                                            backgroundColor: isDarkMode ? "#2A524C" : "#F3EDE3",
                                            color: isDarkMode ? "#D5DCDB" : "#183D3D",
                                            borderColor: isDarkMode ? "#2A524C" : "#F3EDE3",
                                        }}
                                    >
                                        {isScanning ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                        <span>{isScanning ? "Scanning..." : "Scan QR"}</span>
                                    </motion.button>
                                </div>
                            </form>
                        </div>

                        {error && (
                            <div className="mt-3 text-center">
                                <p className="text-sm font-medium text-red-500">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* QR Scanner Modal */}
                    <QRScanner
                        showScanner={showScanner}
                        setShowScanner={setShowScanner}
                        isScanning={isScanning}
                        setIsScanning={setIsScanning}
                        isDarkMode={isDarkMode}
                        isMobile={isMobile}
                        onQRScanned={handleQRScanned}
                    />

                    {/* Customer Information & Laundry Progress */}
                    <AnimatePresence>
                        {showStatus && trackingData && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.5 }}
                                className="border-t pt-4"
                                style={{ borderColor: isDarkMode ? "#2A524C" : "#F3EDE3" }}
                            >
                                {/* Close Tracking Button */}
                                <div className="mb-4 flex justify-end">
                                    <motion.button
                                        onClick={handleCloseTracking}
                                        whileHover={{ 
                                            scale: 1.05,
                                            backgroundColor: isDarkMode ? "#EF4444" : "#DC2626",
                                            transition: { duration: 0.2 }
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg"
                                        style={{
                                            backgroundColor: isDarkMode ? "#DC2626" : "#EF4444",
                                        }}
                                    >
                                        <Search className="h-4 w-4" />
                                        Close Tracking
                                    </motion.button>
                                </div>

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
                    </AnimatePresence>
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

                {/* Bottom Section - 3 Columns (Recent Searches: 1, Reminder: 2) */}
                <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
                    {/* Recent Searches - Takes 1 column */}
                    <RecentSearches
                        isDarkMode={isDarkMode}
                        recentSearches={recentSearches}
                        onRecentSearchClick={handleRecentSearchClick}
                    />

                    {/* Reminder Card - Takes 2 columns (wider) */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 2.6 }}
                        className="rounded-2xl border-2 p-4 md:p-6 lg:col-span-2"
                        style={{
                            backgroundColor: isDarkMode ? "#F3EDE3" : "#183D3D",
                            borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                            color: isDarkMode ? "#13151B" : "#F3EDE3",
                        }}
                    >
                        <h3 className="mb-4 text-lg font-bold md:text-xl">Reminder & Information</h3>

                        <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                            {/* Notification System */}
                            <div className="flex flex-col">
                                <h4 className="mb-3 text-sm font-semibold md:text-base">Notification System:</h4>
                                <div className="flex-1 space-y-3">
                                    {[
                                        {
                                            icon: CheckCircle2,
                                            text: "Ready for Pickup",
                                            description: "SMS notification when your laundry is ready",
                                            time: "Immediate",
                                            color: "green",
                                        },
                                        {
                                            icon: Bell,
                                            text: "3-Day Reminder",
                                            description: "Reminder notification if unclaimed after 3 days",
                                            time: "72 hours",
                                            color: "yellow",
                                        },
                                        {
                                            icon: AlertTriangle,
                                            text: "Final Notice",
                                            description: "Final notice before disposal after 7 days",
                                            time: "7 days",
                                            color: "red",
                                        },
                                    ].map((item, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ 
                                                scale: 1.02,
                                                y: -2,
                                                transition: { duration: 0.2 }
                                            }}
                                            className={`rounded-xl border p-3 transition-all ${
                                                isDarkMode ? "hover:bg-[#2A524C]" : "hover:bg-[#D5DCDB]"
                                            }`}
                                            style={{
                                                backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                                borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                                                color: isDarkMode ? "#13151B" : "#183D3D",
                                            }}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <motion.div
                                                    whileHover={{ scale: 1.1 }}
                                                    className={`rounded-full p-2 ${
                                                        item.color === "green"
                                                            ? isDarkMode
                                                                ? "bg-green-100 text-green-600"
                                                                : "bg-green-50 text-green-700"
                                                            : item.color === "yellow"
                                                              ? isDarkMode
                                                                  ? "bg-yellow-100 text-yellow-600"
                                                                  : "bg-yellow-50 text-yellow-700"
                                                              : isDarkMode
                                                                ? "bg-red-100 text-red-600"
                                                                : "bg-red-50 text-red-700"
                                                    }`}
                                                >
                                                    <item.icon className="h-4 w-4" />
                                                </motion.div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h5
                                                            className="text-sm font-bold md:text-base"
                                                            style={{ color: isDarkMode ? "#13151B" : "#183D3D" }}
                                                        >
                                                            {item.text}
                                                        </h5>
                                                        <motion.span
                                                            whileHover={{ scale: 1.05 }}
                                                            className="rounded-full px-2 py-1 text-xs font-medium"
                                                            style={{
                                                                backgroundColor: isDarkMode ? "rgba(0,0,0,0.1)" : "rgba(24, 61, 61, 0.1)",
                                                                color: isDarkMode ? "#13151B" : "#183D3D",
                                                            }}
                                                        >
                                                            {item.time}
                                                        </motion.span>
                                                    </div>
                                                    <p
                                                        className="mt-1 text-xs leading-relaxed md:text-sm"
                                                        style={{ color: isDarkMode ? "#6B7280" : "#183D3D" }}
                                                    >
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Operating Hours & Contact */}
                            <div className="flex flex-col">
                                <h4 className="mb-3 text-sm font-semibold md:text-base">Store Information:</h4>
                                <div className="flex-1 space-y-4">
                                    {/* Operating Hours */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        whileHover={{ 
                                            scale: 1.02,
                                            y: -2,
                                            transition: { duration: 0.2 }
                                        }}
                                        className={`rounded-xl border p-4 transition-all ${
                                            isDarkMode ? "hover:bg-[#2A524C]" : "hover:bg-[#D5DCDB]"
                                        }`}
                                        style={{
                                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                            borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                                            color: isDarkMode ? "#13151B" : "#183D3D",
                                        }}
                                    >
                                        <div className="mb-3 flex items-center space-x-2">
                                            <motion.div
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                className={`rounded-full p-2 ${
                                                    isDarkMode ? "bg-blue-100 text-blue-600" : "bg-blue-50 text-blue-700"
                                                }`}
                                            >
                                                <Clock className="h-4 w-4" />
                                            </motion.div>
                                            <h5
                                                className="text-sm font-bold md:text-base"
                                                style={{ color: isDarkMode ? "#13151B" : "#183D3D" }}
                                            >
                                                Operating Hours
                                            </h5>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center justify-between py-1">
                                                <span
                                                    className="font-medium"
                                                    style={{ color: isDarkMode ? "#13151B" : "#183D3D" }}
                                                >
                                                    Mon - Sun
                                                </span>
                                                <motion.span
                                                    whileHover={{ scale: 1.05 }}
                                                    className="font-semibold"
                                                    style={{ color: isDarkMode ? "#18442A" : "#18442A" }}
                                                >
                                                    7:00 AM - 7:00 PM
                                                </motion.span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Contact Info */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        whileHover={{ 
                                            scale: 1.02,
                                            y: -2,
                                            transition: { duration: 0.2 }
                                        }}
                                        className={`rounded-xl border p-4 transition-all ${
                                            isDarkMode ? "hover:bg-[#2A524C]" : "hover:bg-[#D5DCDB]"
                                        }`}
                                        style={{
                                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                            borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                                            color: isDarkMode ? "#13151B" : "#183D3D",
                                        }}
                                    >
                                        <div className="mb-3 flex items-center space-x-2">
                                            <motion.div
                                                whileHover={{ scale: 1.1, rotate: -5 }}
                                                className={`rounded-full p-2 ${
                                                    isDarkMode ? "bg-purple-100 text-purple-600" : "bg-purple-50 text-purple-700"
                                                }`}
                                            >
                                                <Phone className="h-4 w-4" />
                                            </motion.div>
                                            <h5
                                                className="text-sm font-bold md:text-base"
                                                style={{ color: isDarkMode ? "#13151B" : "#183D3D" }}
                                            >
                                                Contact Information
                                            </h5>
                                        </div>
                                        <p
                                            className="text-sm leading-relaxed"
                                            style={{ color: isDarkMode ? "#6B7280" : "#183D3D" }}
                                        >
                                            Ensure your contact number is accurate to receive service updates and notifications.
                                        </p>
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            className="mt-3 rounded-lg p-2 text-center"
                                            style={{
                                                backgroundColor: isDarkMode ? "rgba(0,0,0,0.1)" : "rgba(24, 61, 61, 0.1)",
                                            }}
                                        >
                                            <p
                                                className="text-xs font-semibold"
                                                style={{ color: isDarkMode ? "#13151B" : "#183D3D" }}
                                            >
                                                📱 Keep your phone active for updates
                                            </p>
                                        </motion.div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
};

export default ServiceTracking;