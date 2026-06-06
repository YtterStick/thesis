import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, CheckCircle2, Bell, AlertTriangle, Clock, Phone, Eye, QrCode, X, ChevronLeft } from "lucide-react";

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

import { API_BASE_URL, getApiUrl } from "@/lib/api-config";
import { useSse } from "@/hooks/use-sse";

const ServiceTracking = ({ isVisible, isDarkMode, isMobile: propIsMobile, autoSearchId }) => {
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
    const [receiptData, setReceiptData] = useState(null);
    const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

    const mainCardRef = useRef(null);
    const refreshIntervalRef = useRef(null);

    useEffect(() => {
        if (autoSearchId && autoSearchId.trim()) {
            console.log("🚀 Auto-searching for:", autoSearchId);
            setReceiptNumber(autoSearchId);
            fetchTrackingData(autoSearchId);
            addToRecentSearches(autoSearchId);
        }
    }, [autoSearchId]);

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

    // Real-time updates via internal broadcast (to avoid duplicate SSE connections)
    useEffect(() => {
        const handleUpdate = () => {
            if (trackingData?.invoiceNumber && showStatus) {
                console.log("🚀 User Tracking: Update received via broadcast!");
                fetchTrackingData(trackingData.invoiceNumber, true);
            }
        };

        window.addEventListener('STARWASH_LAUNDRY_UPDATE', handleUpdate);
        window.addEventListener('STARWASH_TRANSACTION_UPDATE', handleUpdate);

        return () => {
            window.removeEventListener('STARWASH_LAUNDRY_UPDATE', handleUpdate);
            window.removeEventListener('STARWASH_TRANSACTION_UPDATE', handleUpdate);
        };
    }, [trackingData?.invoiceNumber, showStatus]);

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

    useEffect(() => {
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    const fetchTrackingData = async (invoiceNumber, isSilentRefresh = false) => {
        if (!isSilentRefresh) {
            setIsLoading(true);
        }
        setError(null);

        try {
            console.log(`🔍 ${isSilentRefresh ? "Refreshing" : "Fetching"} tracking data for: ${invoiceNumber}`);
            const response = await fetch(getApiUrl(`track/${invoiceNumber}`));

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Receipt number not found");
                }
                throw new Error("Failed to fetch tracking data");
            }

            const data = await response.json();
            console.log("✅ Tracking data received:", data);

            setTrackingData(data);

            if (!isSilentRefresh) {
                setShowStatus(true);
                setShowFullCustomerInfo(false);
                setCurrentLoadIndex(0);
            }
        } catch (err) {
            console.error(`❌ Error ${isSilentRefresh ? "refreshing" : "fetching"} tracking data:`, err);
            if (!isSilentRefresh) {
                setError(err.message);
                setShowStatus(false);
                setTrackingData(null);

                if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                    refreshIntervalRef.current = null;
                }
            }
        } finally {
            if (!isSilentRefresh) {
                setIsLoading(false);
            }
        }
    };

    const fetchReceiptData = async (invoiceNumber) => {
        setIsLoadingReceipt(true);
        try {
            console.log(`📄 Fetching receipt data for: ${invoiceNumber}`);
            
            const response = await fetch(getApiUrl(`track/${invoiceNumber}/receipt`));

            if (!response.ok) {
                throw new Error("Failed to fetch receipt data from tracking endpoint");
            }

            const data = await response.json();
            console.log("✅ Receipt data received from tracking endpoint:", data);
            
            const transformedData = {
                ...data,
                invoiceNumber: data.invoiceNumber || invoiceNumber,
                customerName: data.customerName,
                contact: data.contact,
                issueDate: data.issueDate,
                dueDate: data.dueDate,
                staffId: data.staffId,
                totalPrice: data.total,
                paymentMethod: data.paymentMethod,
                amountGiven: data.amountGiven || data.total || 0,
                change: data.change || 0,
                service: data.service,
                consumables: data.consumables,
                formatSettings: data.formatSettings,
                loads: data.loads || trackingData?.loads || 0,
                gcashReference: data.gcashReference || trackingData?.gcashReference
            };
            
            setReceiptData(transformedData);
            return transformedData;
        } catch (error) {
            console.error("❌ Error fetching receipt data from tracking endpoint:", error);
            const fallbackReceiptData = createReceiptDataFromTracking(trackingData);
            setReceiptData(fallbackReceiptData);
            return fallbackReceiptData;
        } finally {
            setIsLoadingReceipt(false);
        }
    };

    const createReceiptDataFromTracking = (trackingData) => {
        if (!trackingData) return null;

        return {
            invoiceNumber: trackingData.invoiceNumber,
            customerName: trackingData.customerName,
            contact: trackingData.contact,
            issueDate: trackingData.createdAt,
            dueDate: trackingData.dueDate,
            staffId: trackingData.staffId,
            totalPrice: trackingData.totalPrice,
            total: trackingData.totalPrice,
            paymentMethod: trackingData.paymentMethod,
            amountGiven: trackingData.amountGiven || trackingData.totalPrice,
            change: trackingData.change || 0,
            service: {
                name: trackingData.serviceName,
                price: trackingData.servicePrice,
                quantity: trackingData.loads,
            },
            consumables: [
                {
                    name: "Detergent",
                    price: 15,
                    quantity: trackingData.detergentQty || 0,
                },
                {
                    name: "Fabric Conditioner",
                    price: 10,
                    quantity: trackingData.fabricQty || 0,
                },
            ],
            formatSettings: trackingData.formatSettings || {
                storeName: "STARWASH LAUNDRY",
                address: "53 A Bonifacio Street, Sta Lucia, Novaliches",
                phone: "09150475513",
                footerNote: "Thank you for choosing Star Wash",
            },
            loads: trackingData.loads || 0,
            gcashReference: trackingData.gcashReference,
        };
    };

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

    const handleQRScanned = (receiptNumber, scannedUrl) => {
        console.log("✅ QR code scanned successfully!");
        console.log("🔗 Full scanned URL:", scannedUrl);
        console.log("📄 Receipt number extracted:", receiptNumber);

        setReceiptNumber(receiptNumber);
        addToRecentSearches(receiptNumber);
        fetchTrackingData(receiptNumber);
    };

    const handleCloseTracking = () => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }

        setShowStatus(false);
        setTrackingData(null);
        setReceiptNumber("");
        setError(null);
        setCurrentLoadIndex(0);
        setShowFullCustomerInfo(false);
        setReceiptData(null);
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

    const handleViewReceipt = async () => {
        if (!trackingData?.invoiceNumber) return;

        try {
            const receiptData = await fetchReceiptData(trackingData.invoiceNumber);
            setReceiptData(receiptData);
            setShowReceiptOptions(true);
        } catch (error) {
            console.error("Error handling receipt view:", error);
            const fallbackData = createReceiptDataFromTracking(trackingData);
            setReceiptData(fallbackData);
            setShowReceiptOptions(true);
        }
    };

    const handlePrintReceipt = async () => {
        if (!trackingData?.invoiceNumber) return;

        try {
            const receiptData = await fetchReceiptData(trackingData.invoiceNumber);
            setReceiptData(receiptData);
            setShowReceiptOptions(true);
            
            setTimeout(() => {
                const printButton = document.querySelector('[onClick*="handlePrint"]');
                if (printButton) {
                    printButton.click();
                }
            }, 100);
        } catch (error) {
            console.error("Error handling print receipt:", error);
            const fallbackData = createReceiptDataFromTracking(trackingData);
            setReceiptData(fallbackData);
            setShowReceiptOptions(true);
        }
    };

    const handleDownloadReceipt = () => {
        console.log("💾 Downloading receipt:", receiptData);
        setShowReceiptOptions(false);
    };

    const closeReceiptOptions = () => {
        setShowReceiptOptions(false);
    };

    const handleRecentSearchClick = (receiptNum) => {
        setReceiptNumber(receiptNum);
        fetchTrackingData(receiptNum);
    };

    const convertToLaundryLoads = (trackingData, isMobile) => {
        if (!trackingData?.loadAssignments) return [];

        return trackingData.loadAssignments.map((load, index) => {
            const status = load.status || "NOT_STARTED";
            console.log(`🔄 Load ${index + 1} status:`, status);

            const isDryAgain = status === "DRYING" && 
                              load.startTime && 
                              new Date(load.startTime) > new Date(Date.now() - 5 * 60 * 1000);
            if (isMobile) {
                const statusSteps = [
                    {
                        lottie: unwashed,
                        title: "Not Started",
                        description: "Your laundry is waiting to be processed",
                        active: status === "NOT_STARTED",
                        completed: ["WASHING", "WASHED", "DRYING", "DRIED", "FOLDING", "COMPLETED"].includes(status),
                        estimatedTime: "Waiting",
                    },
                    {
                        lottie: washingMachine,
                        title: "Washing",
                        description: status === "WASHED" 
                            ? "Your laundry has been washed" 
                            : "Your laundry is now being washed",
                        active: status === "WASHING" || status === "WASHED",
                        completed: ["WASHED", "DRYING", "DRIED", "FOLDING", "COMPLETED"].includes(status),
                        estimatedTime: "35 min",
                    },
                    {
                        lottie: dryerMachine,
                        title: isDryAgain ? "Drying Again" : "Drying",
                        description: isDryAgain 
                            ? "Your laundry is being dried again for better results"
                            : status === "DRIED" 
                                ? "Your laundry has been dried" 
                                : "Your laundry is now being dried",
                        active: status === "DRYING" || status === "DRIED",
                        completed: ["DRIED", "FOLDING", "COMPLETED"].includes(status) && !isDryAgain,
                        estimatedTime: isDryAgain ? "Additional drying time" : "40-60 min",
                        isDryAgain: isDryAgain,
                    },
                    {
                        lottie: clothes,
                        title: "Folding",
                        description: "Your laundry is now being folded",
                        active: status === "FOLDING",
                        completed: ["FOLDING", "COMPLETED"].includes(status),
                        estimatedTime: "20-30 min",
                    },
                    {
                        lottie: unwashed,
                        title: "Ready",
                        description: "Ready for pickup at the counter",
                        active: status === "COMPLETED",
                        completed: status === "COMPLETED",
                        estimatedTime: "5 min",
                    },
                ];

                return {
                    loadNumber: load.loadNumber || index + 1,
                    statusSteps,
                    fabricType: trackingData.fabricQty || 0,
                    detergent: trackingData.detergentQty || 0,
                    weight: "8 kg",
                    currentStatus: status,
                    isDryAgain: isDryAgain,
                };
            }

            const statusSteps = [
                {
                    lottie: washingMachine,
                    title: "Washing",
                    description: status === "WASHED" 
                        ? "Your laundry has been washed" 
                        : status === "WASHING"
                            ? "Your laundry is now being washed"
                            : ["DRYING", "DRIED", "FOLDING", "COMPLETED"].includes(status)
                                ? "Your laundry has been washed"
                                : "Your laundry will be washed soon",
                    active: status === "WASHING" || status === "WASHED",
                    completed: ["WASHED", "DRYING", "DRIED", "FOLDING", "COMPLETED"].includes(status),
                    estimatedTime: "35 min",
                },
                {
                    lottie: dryerMachine,
                    title: isDryAgain ? "Drying Again" : "Drying",
                    description: isDryAgain 
                        ? "Your laundry is being dried again for better results"
                        : status === "DRIED" 
                            ? "Your laundry has been dried" 
                            : status === "DRYING"
                                ? "Your laundry is now being dried"
                                : ["FOLDING", "COMPLETED"].includes(status)
                                    ? "Your laundry has been dried"
                                    : "Your laundry will be dried after washing",
                    active: status === "DRYING" || status === "DRIED",
                    completed: ["DRIED", "FOLDING", "COMPLETED"].includes(status) && !isDryAgain,
                    estimatedTime: isDryAgain ? "Additional drying time" : "40-60 min",
                    isDryAgain: isDryAgain,
                },
                {
                    lottie: clothes,
                    title: "Folding",
                    description: status === "FOLDING"
                        ? "Your laundry is now being folded"
                        : status === "COMPLETED"
                            ? "Your laundry has been folded"
                            : "Your laundry will be folded after drying",
                    active: status === "FOLDING",
                    completed: ["FOLDING", "COMPLETED"].includes(status),
                    estimatedTime: "20-30 min",
                },
                {
                    lottie: unwashed,
                    title: "Ready",
                    description: status === "COMPLETED"
                        ? "Ready for pickup at the counter"
                        : "Ready for pickup after folding",
                    active: status === "COMPLETED",
                    completed: status === "COMPLETED",
                    estimatedTime: "5 min",
                },
            ];

            return {
                loadNumber: load.loadNumber || index + 1,
                statusSteps,
                fabricType: trackingData.fabricQty || 0,
                detergent: trackingData.detergentQty || 0,
                weight: "8 kg",
                currentStatus: status,
                isDryAgain: isDryAgain,
            };
        });
    };

    const laundryLoads = convertToLaundryLoads(trackingData, isMobile);

    return (
        <>
            <ViewReceipt
                isVisible={showReceiptOptions}
                isDarkMode={isDarkMode}
                showReceiptOptions={showReceiptOptions}
                closeReceiptOptions={closeReceiptOptions}
                handlePrintReceipt={handlePrintReceipt}
                handleDownloadReceipt={handleDownloadReceipt}
                receiptData={receiptData}
            />

            {/* IMMERSIVE FOCUS LAUNDRY TRACKER PORTAL */}
            <AnimatePresence>
                {showStatus && trackingData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="fixed inset-0 z-50 overflow-y-auto w-full min-h-screen flex flex-col items-center justify-start py-8 px-4 md:py-12"
                        style={{
                            background: isDarkMode 
                                ? "radial-gradient(circle at 10% 20%, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))"
                                : "radial-gradient(circle at 10% 20%, rgba(241, 245, 249, 0.95), rgba(248, 250, 252, 0.98))",
                        }}
                    >
                        {/* Ambient decorative glowing backdrops */}
                        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] pointer-events-none" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] pointer-events-none" />

                        <div className="w-full max-w-7xl flex flex-col gap-6 md:gap-8 relative z-10">
                            {/* Immersive Glass Header Banner */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full rounded-2xl border p-4 md:p-6 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                                style={{
                                    backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.6)" : "rgba(255, 255, 255, 0.75)",
                                    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                                    color: isDarkMode ? "#cbd5e1" : "#475569",
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <motion.button
                                        onClick={handleCloseTracking}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200/50 dark:border-slate-800"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span>Back to Home</span>
                                    </motion.button>
                                    
                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Tracker Active</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Tracked Invoice Number</span>
                                    <span className="text-base md:text-lg font-mono font-black text-blue-500 dark:text-blue-400 tracking-wide mt-0.5">
                                        #{trackingData.invoiceNumber}
                                    </span>
                                </div>
                            </motion.div>

                            {/* Content Workspace Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start w-full">
                                {/* Timeline: Takes Center Stage */}
                                <div className="grid grid-cols-1 gap-6 md:gap-8 lg:col-span-2">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="rounded-3xl border p-6 md:p-8 shadow-2xl backdrop-blur-md"
                                        style={{
                                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.7)",
                                            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                                        }}
                                    >
                                        {laundryLoads.length > 0 ? (
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
                                        ) : (
                                            <div className="text-center py-12">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-3" />
                                                <p className="text-sm font-semibold">Preparing tracking details...</p>
                                            </div>
                                        )}
                                    </motion.div>
                                </div>

                                {/* Sidebar Customer / Store Info Cards */}
                                <div className="flex flex-col gap-6 md:gap-8">
                                    <CustomerInfo
                                        isVisible={showStatus}
                                        isDarkMode={isDarkMode}
                                        isMobile={isMobile}
                                        showFullCustomerInfo={showFullCustomerInfo}
                                        toggleFullCustomerInfo={toggleFullCustomerInfo}
                                        handleViewReceipt={handleViewReceipt}
                                        handlePrintReceipt={handlePrintReceipt}
                                        customerData={trackingData}
                                    />

                                    {/* Support Alert / Operating Hours */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-2xl border p-5 shadow-xl backdrop-blur-md"
                                        style={{
                                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.7)",
                                            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                                            color: isDarkMode ? "#cbd5e1" : "#475569",
                                        }}
                                    >
                                        <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Live Support & Hours</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/10 dark:bg-slate-100/5">
                                                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                                                    <Clock className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h5 className="text-xs font-bold" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>Daily Pickup Window</h5>
                                                    <p className="text-[11px] opacity-75 mt-0.5">Mon - Sun: 7:00 AM - 7:00 PM</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/10 dark:bg-slate-100/5">
                                                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h5 className="text-xs font-bold" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>Need Assistance?</h5>
                                                    <p className="text-[11px] opacity-75 mt-0.5">Contact counter staff or request help directly.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.section
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
                transition={{ duration: 0.8, delay: 1.6 }}
                className="px-4 py-8 md:py-10 transition-colors duration-300 bg-transparent"
                id="service_tracking"
            >
                <div className="mx-auto max-w-[90%]">
                    <motion.div
                        ref={mainCardRef}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 2.0 }}
                        className="mb-6 rounded-3xl border p-5 md:p-6 shadow-2xl backdrop-blur-md transition-all duration-300"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.7)",
                            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                            color: isDarkMode ? "#cbd5e1" : "#475569",
                        }}
                    >
                        <div className="mb-4">
                            <div className="mb-4 flex flex-col gap-2 text-center md:text-left">
                                <span
                                    className="mx-auto md:mx-0 w-fit rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]"
                                    style={{
                                        backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.14)" : "rgba(37, 99, 235, 0.1)",
                                        color: isDarkMode ? "#93c5fd" : "#1d4ed8",
                                    }}
                                >
                                    Laundry Tracking
                                </span>
                                <h3
                                    className="text-lg font-black tracking-tight md:text-2xl"
                                    style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}
                                >
                                    Enter Receipt Number
                                </h3>
                                <p
                                    className="text-xs md:text-sm"
                                    style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
                                >
                                    Type your invoice code or scan the QR printed on your receipt.
                                </p>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="rounded-2xl border p-3 md:p-4"
                                style={{
                                    backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.52)" : "rgba(248, 250, 252, 0.88)",
                                    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.1)",
                                }}
                            >
                                <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
                                    <div className="relative flex-1">
                                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform">
                                            <Search
                                                className="h-4 w-4"
                                                style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={receiptNumber}
                                            onChange={(e) => setReceiptNumber(e.target.value)}
                                            placeholder="Write receipt number here..."
                                            className="w-full rounded-xl border py-3 pl-10 pr-4 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                                            style={{
                                                backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.75)" : "#ffffff",
                                                borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.1)",
                                                color: isDarkMode ? "#f8fafc" : "#0f172a",
                                            }}
                                        />
                                    </div>

                                    <div className="flex w-full gap-2 md:w-auto">
                                        <motion.button
                                            type="submit"
                                            disabled={isLoading}
                                            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold shadow-md transition-all active:scale-95 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:brightness-110 text-white border-none md:flex-shrink-0 cursor-pointer ${
                                                isLoading ? "cursor-not-allowed opacity-50" : ""
                                            }`}
                                        >
                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                            {isLoading ? "Loading..." : "View"}
                                        </motion.button>

                                        <motion.button
                                            type="button"
                                            onClick={handleScanQR}
                                            disabled={isLoading || isScanning}
                                            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-5 py-3 text-sm font-bold shadow-md transition-all active:scale-95 md:flex-shrink-0 cursor-pointer ${
                                                isLoading ? "cursor-not-allowed opacity-50" : ""
                                            }`}
                                            style={{
                                                backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
                                                color: isDarkMode ? "#f8fafc" : "#0f172a",
                                                borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.1)",
                                            }}
                                        >
                                            {isScanning ? (
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            ) : (
                                                <QrCode className="h-4 w-4" />
                                            )}
                                            <span>{isScanning ? "Scanning..." : "Scan QR"}</span>
                                        </motion.button>
                                    </div>
                                </div>
                            </form>

                            {error && (
                                <div className="mt-3 text-center">
                                    <p className="text-sm font-medium text-red-500">{error}</p>
                                </div>
                            )}
                        </div>

                        <QRScanner
                            showScanner={showScanner}
                            setShowScanner={setShowScanner}
                            isScanning={isScanning}
                            setIsScanning={setIsScanning}
                            isDarkMode={isDarkMode}
                            isMobile={isMobile}
                            onQRScanned={handleQRScanned}
                        />
                    </motion.div>

                    <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12 lg:items-start">
                        <div className="lg:col-span-4 lg:order-2">
                            <RecentSearches
                                isDarkMode={isDarkMode}
                                recentSearches={recentSearches}
                                onRecentSearchClick={handleRecentSearchClick}
                            />
                        </div>

                        {!isMobile && (
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 2.6 }}
                                className="rounded-3xl border p-5 md:p-6 lg:col-span-8 lg:order-1 shadow-2xl backdrop-blur-md transition-all duration-300"
                                style={{
                                    backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.7)",
                                    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                                    color: isDarkMode ? "#cbd5e1" : "#475569",
                                }}
                            >
                                <div className="mb-5 flex items-end justify-between gap-3">
                                    <div>
                                        <p
                                            className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]"
                                            style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}
                                        >
                                            Service Guide
                                        </p>
                                        <h3 className="text-lg font-black tracking-tight md:text-xl" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>
                                            Reminder & Information
                                        </h3>
                                    </div>
                                    <span
                                        className="rounded-full px-3 py-1 text-xs font-semibold"
                                        style={{
                                            backgroundColor: isDarkMode ? "rgba(14, 165, 233, 0.16)" : "rgba(2, 132, 199, 0.1)",
                                            color: isDarkMode ? "#7dd3fc" : "#0369a1",
                                        }}
                                    >
                                        Alert Sequence
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                                            description: "Reminder if unclaimed after 3 days",
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
                                            whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                            className="rounded-2xl border p-4"
                                            style={{
                                                backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.45)" : "rgba(255, 255, 255, 0.92)",
                                                borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                                            }}
                                        >
                                            <div className="mb-2 flex items-center justify-between">
                                                <span
                                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                                                        item.color === "green"
                                                            ? isDarkMode
                                                                ? "bg-emerald-500/25 text-emerald-200"
                                                                : "bg-emerald-100 text-emerald-700"
                                                            : item.color === "yellow"
                                                              ? isDarkMode
                                                                  ? "bg-amber-500/25 text-amber-200"
                                                                  : "bg-amber-100 text-amber-700"
                                                              : isDarkMode
                                                                ? "bg-rose-500/25 text-rose-200"
                                                                : "bg-rose-100 text-rose-700"
                                                    }`}
                                                >
                                                    {index + 1}
                                                </span>
                                                <span
                                                    className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                                                    style={{
                                                        backgroundColor: isDarkMode ? "rgba(14, 165, 233, 0.16)" : "rgba(2, 132, 199, 0.1)",
                                                        color: isDarkMode ? "#7dd3fc" : "#0369a1",
                                                    }}
                                                >
                                                    {item.time}
                                                </span>
                                            </div>

                                            <div className="mb-2 flex items-center gap-2">
                                                <item.icon
                                                    className={`h-4 w-4 ${
                                                        item.color === "green"
                                                            ? isDarkMode
                                                                ? "text-emerald-300"
                                                                : "text-emerald-700"
                                                            : item.color === "yellow"
                                                              ? isDarkMode
                                                                  ? "text-amber-300"
                                                                  : "text-amber-700"
                                                              : isDarkMode
                                                                ? "text-rose-300"
                                                                : "text-rose-700"
                                                    }`}
                                                />
                                                <h5 className="text-sm font-bold md:text-base" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>
                                                    {item.text}
                                                </h5>
                                            </div>

                                            <p className="text-xs leading-relaxed md:text-sm" style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}>
                                                {item.description}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {isMobile && (
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 2.6 }}
                                className="rounded-3xl border p-6 shadow-2xl backdrop-blur-md transition-all duration-300"
                                style={{
                                    backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.7)",
                                    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                                    color: isDarkMode ? "#cbd5e1" : "#475569",
                                }}
                            >
                                <div className="mb-4 flex items-end justify-between gap-3">
                                    <div>
                                        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                                            Service Guide
                                        </p>
                                        <h3 className="text-lg font-black tracking-tight" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>
                                            Reminder & Information
                                        </h3>
                                    </div>
                                    <span
                                        className="rounded-full px-3 py-1 text-[11px] font-semibold"
                                        style={{
                                            backgroundColor: isDarkMode ? "rgba(14, 165, 233, 0.16)" : "rgba(2, 132, 199, 0.1)",
                                            color: isDarkMode ? "#7dd3fc" : "#0369a1",
                                        }}
                                    >
                                        3 Steps
                                    </span>
                                </div>

                                <div className="space-y-3">
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
                                            description: "Reminder if unclaimed after 3 days",
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
                                            transition={{ delay: index * 0.08 }}
                                            className="rounded-xl border p-3.5"
                                            style={{
                                                backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.45)" : "rgba(255, 255, 255, 0.92)",
                                                borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                                            }}
                                        >
                                            <div className="mb-1.5 flex items-center justify-between">
                                                <span
                                                    className={`flex h-5.5 w-5.5 items-center justify-center rounded-full text-[10px] font-black ${
                                                        item.color === "green"
                                                            ? isDarkMode
                                                                ? "bg-emerald-500/25 text-emerald-200"
                                                                : "bg-emerald-100 text-emerald-700"
                                                            : item.color === "yellow"
                                                              ? isDarkMode
                                                                  ? "bg-amber-500/25 text-amber-200"
                                                                  : "bg-amber-100 text-amber-700"
                                                              : isDarkMode
                                                                ? "bg-rose-500/25 text-rose-200"
                                                                : "bg-rose-100 text-rose-700"
                                                    }`}
                                                >
                                                    {index + 1}
                                                </span>
                                                <span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: isDarkMode ? "rgba(14,165,233,0.16)" : "rgba(2,132,199,0.1)", color: isDarkMode ? "#7dd3fc" : "#0369a1" }}>
                                                    {item.time}
                                                </span>
                                            </div>

                                            <div className="mb-1 flex items-center gap-2">
                                                <item.icon
                                                    className={`h-4 w-4 ${
                                                        item.color === "green"
                                                            ? isDarkMode
                                                                ? "text-emerald-300"
                                                                : "text-emerald-700"
                                                            : item.color === "yellow"
                                                              ? isDarkMode
                                                                  ? "text-amber-300"
                                                                  : "text-amber-700"
                                                              : isDarkMode
                                                                ? "text-rose-300"
                                                                : "text-rose-700"
                                                    }`}
                                                />
                                                <h5 className="text-sm font-bold" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>
                                                    {item.text}
                                                </h5>
                                            </div>

                                            <p className="text-xs leading-relaxed" style={{ color: isDarkMode ? "#94a3b8" : "#475569" }}>
                                                {item.description}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.section>
        </>
    );
};

export default ServiceTracking;