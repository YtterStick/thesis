import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";

const QRScanner = ({ 
    showScanner, 
    setShowScanner, 
    isScanning, 
    setIsScanning, 
    isDarkMode, 
    isMobile, 
    onQRScanned 
}) => {
    const [scanMethod, setScanMethod] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [qrError, setQrError] = useState(null);
    const [scannedData, setScannedData] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [scanAttempts, setScanAttempts] = useState(0);

    const fileInputRef = useRef(null);
    const scannerInstanceRef = useRef(null);
    const scanTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            stopScanner();
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (showScanner) {
            setScanMethod(null);
            setQrError(null);
            setScannedData(null);
            setCameraReady(false);
            setScanAttempts(0);
        }
    }, [showScanner]);

    const startCameraScan = async () => {
        try {
            setIsScanning(true);
            setScanMethod("camera");
            setQrLoading(true);
            setQrError(null);
            setScannedData(null);
            setCameraReady(false);
            setScanAttempts(0);

            await new Promise((resolve) => setTimeout(resolve, 100));

            try {
                const { Html5Qrcode } = await import("html5-qrcode");
                console.log("✅ Html5Qrcode loaded successfully");

                const scannerElementId = "html5qr-code-scanner";

                const scanner = new Html5Qrcode(scannerElementId);
                scannerInstanceRef.current = scanner;

                // SIMPLIFIED CONFIGURATION - No undefined constants
                const config = {
                    fps: isMobile ? 10 : 5, // Lower FPS for better processing on desktop
                    qrbox: isMobile ? { width: 250, height: 250 } : { width: 300, height: 300 },
                    aspectRatio: 1.0,
                    focusMode: "continuous",
                    
                    // Simple experimental features
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                };

                // Simple camera constraints
                const cameraConstraints = {
                    facingMode: "environment"
                };

                await scanner
                    .start(
                        cameraConstraints,
                        config,
                        (decodedText) => {
                            console.log("✅ QR Code detected:", decodedText);
                            handleScannedQRCode(decodedText);
                        },
                        (errorMessage) => {
                            // Increment scan attempts for debugging
                            setScanAttempts(prev => prev + 1);
                        },
                    )
                    .then(() => {
                        setCameraReady(true);
                        setQrLoading(false);
                        console.log("✅ Camera started successfully");
                    })
                    .catch((error) => {
                        console.error("❌ Scanner start error:", error);
                        handleCameraError(error);
                    });

            } catch (error) {
                console.error("❌ Camera error:", error);
                handleCameraError(error);
            }
        } catch (error) {
            console.error("❌ Scanner setup error:", error);
            handleCameraError(error);
        }
    };

    const handleCameraError = (error) => {
        let errorMsg = "Camera failed to start";
        
        if (error.message?.includes("Permission") || error.includes("Permission")) {
            errorMsg = "Camera permission denied. Please allow camera access.";
        } else if (error.message?.includes("NotFound") || error.includes("NotFound")) {
            errorMsg = "No camera found on this device.";
        } else if (error.message?.includes("NotAllowed") || error.includes("NotAllowed")) {
            errorMsg = "Camera access denied. Please check permissions.";
        } else if (error.message?.includes("NotSupported") || error.includes("NotSupported")) {
            errorMsg = "QR scanning not supported in this browser.";
        }
        
        setQrError(errorMsg);
        setIsScanning(false);
        setScanMethod(null);
        setQrLoading(false);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        console.log("📁 Processing image");
        setIsScanning(true);
        setScanMethod("file");
        setQrLoading(true);
        setQrError(null);
        setScannedData(null);

        try {
            event.target.value = "";

            if (!file.type.startsWith("image/")) {
                throw new Error("Please upload an image file");
            }

            const { Html5Qrcode } = await import("html5-qrcode");

            const tempScannerId = "temp-file-scanner-" + Date.now();
            const tempDiv = document.createElement("div");
            tempDiv.id = tempScannerId;
            tempDiv.style.display = "none";
            document.body.appendChild(tempDiv);

            try {
                const scanner = new Html5Qrcode(tempScannerId);

                // Simple file scan
                const decodedText = await scanner.scanFile(file, true);

                if (decodedText) {
                    console.log("✅ QR CODE FOUND:", decodedText);
                    handleScannedQRCode(decodedText);
                } else {
                    throw new Error("No QR code detected");
                }

            } finally {
                if (document.body.contains(tempDiv)) {
                    document.body.removeChild(tempDiv);
                }
            }
        } catch (error) {
            console.error("❌ Upload/scan error:", error);
            setQrError("Cannot read QR code from this image. Try a clearer photo.");
            setIsScanning(false);
            setQrLoading(false);
        }
    };

    // Validate if it's a StarWash invoice QR code
    const isValidInvoiceQR = (decodedText) => {
        if (!decodedText) return false;
        
        const text = decodedText.trim();
        
        // Check if it's a StarWash URL with invoice
        if (text.includes("starwashph.com")) {
            return true;
        }
        
        // Check if it's just an invoice number starting with INV-
        if (text.startsWith('INV-')) {
            return true;
        }
        
        // Not a valid StarWash invoice QR code
        return false;
    };

    // Extract invoice number from valid QR code
    const extractInvoiceNumber = (decodedText) => {
        const text = decodedText.trim();
        
        // If it's just the invoice number
        if (text.startsWith('INV-')) {
            return text;
        }
        
        // If it's a URL, extract from search parameter
        if (text.includes("starwashph.com")) {
            try {
                const url = new URL(text);
                if (url.searchParams.has('search')) {
                    return url.searchParams.get('search');
                }
                // Extract from path like /track/INV-123
                const pathParts = url.pathname.split('/');
                for (let part of pathParts) {
                    if (part.startsWith('INV-')) {
                        return part;
                    }
                }
                // Last resort: get last part of path
                const lastPart = pathParts[pathParts.length - 1];
                if (lastPart && lastPart !== "track") {
                    return lastPart;
                }
            } catch (e) {
                // If URL parsing fails, try to extract INV- from the text
                const invMatch = text.match(/INV-\w+/);
                return invMatch ? invMatch[0] : null;
            }
        }
        
        return null;
    };

    const handleScannedQRCode = (decodedText) => {
        console.log("📱 PROCESSING SCANNED DATA:", decodedText);

        // Validate if it's a StarWash invoice QR code
        if (!isValidInvoiceQR(decodedText)) {
            setQrError("This is not a valid StarWash laundry QR code. Please scan a laundry receipt QR code.");
            setIsScanning(false);
            setQrLoading(false);
            return;
        }

        // Extract invoice number
        const invoiceNumber = extractInvoiceNumber(decodedText);
        
        if (invoiceNumber) {
            setScannedData(`Found: ${invoiceNumber}`);
            console.log("✅ VALID INVOICE - AUTO SEARCHING:", invoiceNumber);
            
            // INSTANT callback
            onQRScanned(invoiceNumber, decodedText);

            // Close immediately
            setTimeout(() => {
                closeScanner();
            }, 300);
        } else {
            setQrError("Could not extract invoice number. Please try again.");
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
                scannerInstanceRef.current.clear();
                scannerInstanceRef.current = null;
            }).catch(() => {
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
        setScannedData(null);
        setCameraReady(false);
        setScanAttempts(0);
    };

    const retryScan = () => {
        setQrError(null);
        if (scanMethod === "camera") {
            stopScanner();
            setTimeout(() => {
                startCameraScan();
            }, 500);
        }
    };

    // Enhanced scanner dimensions for desktop
    const getScannerDimensions = () => {
        if (isMobile) {
            return {
                width: 280,
                height: 280
            };
        }
        // Larger scanner for desktop for better printed QR code reading
        return {
            width: 400,
            height: 400
        };
    };

    const scannerDimensions = getScannerDimensions();

    const modalCardBg = isDarkMode ? "#0f172a" : "rgba(255, 255, 255, 0.96)";
    const modalCardBorder = isDarkMode ? "rgba(148, 163, 184, 0.35)" : "rgba(15, 23, 42, 0.1)";
    const modalTitle = isDarkMode ? "#f8fafc" : "#0f172a";
    const modalSubtitle = isDarkMode ? "#cbd5e1" : "#475569";
    const actionBg = isDarkMode ? "rgba(59, 130, 246, 0.18)" : "rgba(37, 99, 235, 0.1)";
    const actionText = isDarkMode ? "#bfdbfe" : "#1d4ed8";

    if (!showScanner || typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            <motion.div
                key="qr-scanner-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                >
                <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border p-5 md:p-6"
                        style={{
                            backgroundColor: modalCardBg,
                            borderColor: modalCardBorder,
                            color: modalTitle,
                        }}
                    >
                        <motion.button
                            onClick={closeScanner}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute right-4 top-4 z-10 rounded-full p-1.5 transition-colors"
                            style={{
                                backgroundColor: isDarkMode ? "rgba(2, 6, 23, 0.65)" : "rgba(15, 23, 42, 0.55)",
                                color: "#FFFFFF",
                            }}
                        >
                            <X className="h-4 w-4" />
                        </motion.button>

                        <h3
                            className="mb-3 text-center text-2xl font-black tracking-tight"
                            style={{ color: modalTitle }}
                        >
                            Scan QR Code
                        </h3>

                        {!scanMethod && (
                            <div className="space-y-3">
                                <p
                                    className="mb-5 text-center text-base"
                                    style={{ color: modalSubtitle }}
                                >
                                    Scan your laundry receipt QR code
                                </p>

                                <motion.button
                                    onClick={startCameraScan}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all`}
                                    style={{
                                        backgroundColor: actionBg,
                                        color: actionText,
                                    }}
                                >
                                    <Camera className="h-4 w-4" />
                                    Use Camera
                                </motion.button>

                                <div className="relative">
                                    <motion.button
                                        onClick={handleUploadClick}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all`}
                                        style={{
                                            backgroundColor: actionBg,
                                            color: actionText,
                                        }}
                                    >
                                        <Upload className="h-4 w-4" />
                                        Upload Image
                                    </motion.button>
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
                                <div className="relative mb-3 flex flex-col items-center">
                                    <div 
                                        className="relative overflow-hidden rounded-lg bg-black"
                                        style={{
                                            width: scannerDimensions.width,
                                            height: scannerDimensions.height
                                        }}
                                    >
                                        <div
                                            id="html5qr-code-scanner"
                                            className="h-full w-full"
                                        />

                                        {/* Enhanced scanning frame */}
                                        {cameraReady && (
                                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                <div className={`border-2 border-white border-opacity-70 rounded-lg ${isMobile ? 'w-48 h-48' : 'w-64 h-64'}`}>
                                                    {/* Corner markers */}
                                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400"></div>
                                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400"></div>
                                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400"></div>
                                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400"></div>
                                                    
                                                    {/* Scanning animation */}
                                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 animate-pulse"></div>
                                                </div>
                                            </div>
                                        )}

                                        {qrLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/70">
                                                <div className="text-center text-white">
                                                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                                                    <p className="text-xs">Starting camera...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {cameraReady && !qrLoading && !scannedData && (
                                        <div className="mt-2 text-center">
                                            <p className="text-xs" style={{ color: isDarkMode ? "#93c5fd" : "#2563eb" }}>
                                                Point at laundry QR code
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {scannedData && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-3 rounded-lg border p-2"
                                        style={{
                                            borderColor: isDarkMode ? "rgba(96, 165, 250, 0.45)" : "rgba(37, 99, 235, 0.45)",
                                            backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.14)" : "rgba(37, 99, 235, 0.1)",
                                        }}
                                    >
                                        <p className="text-xs font-medium" style={{ color: isDarkMode ? "#bfdbfe" : "#1e3a8a" }}>
                                            ✅ {scannedData}
                                        </p>
                                        <p className="mt-1 text-xs" style={{ color: isDarkMode ? "#93c5fd" : "#1d4ed8" }}>
                                            Auto-searching...
                                        </p>
                                    </motion.div>
                                )}

                                {qrError && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-3 text-center space-y-2"
                                    >
                                        <p className="text-xs" style={{ color: isDarkMode ? "#fda4af" : "#fecdd3" }}>{qrError}</p>
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={retryScan}
                                                className="rounded px-3 py-1 text-xs text-white"
                                                style={{ backgroundColor: "#2563eb" }}
                                            >
                                                Try again
                                            </button>
                                            <button
                                                onClick={() => setScanMethod(null)}
                                                className="rounded px-3 py-1 text-xs text-white"
                                                style={{ backgroundColor: "#475569" }}
                                            >
                                                Switch method
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}

                        {scanMethod === "file" && (
                            <div className="mb-3 text-center">
                                {qrLoading ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex h-40 flex-col items-center justify-center rounded-lg"
                                        style={{ backgroundColor: isDarkMode ? "rgba(226, 232, 240, 0.92)" : "rgba(244, 242, 232, 0.92)" }}
                                    >
                                        <div className="text-center">
                                            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={{ color: actionText }} />
                                            <p className="text-xs" style={{ color: actionText }}>Scanning image...</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div
                                        className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed"
                                        style={{
                                            backgroundColor: isDarkMode ? "rgba(226, 232, 240, 0.92)" : "rgba(244, 242, 232, 0.92)",
                                            borderColor: isDarkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(15, 23, 42, 0.2)",
                                        }}
                                    >
                                        <Upload className="mb-2 h-6 w-6" style={{ color: actionText }} />
                                        <p className="text-sm" style={{ color: actionText }}>Select QR code image</p>
                                    </div>
                                )}

                                {scannedData && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 rounded-lg border p-2"
                                        style={{
                                            borderColor: isDarkMode ? "rgba(96, 165, 250, 0.45)" : "rgba(37, 99, 235, 0.45)",
                                            backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.14)" : "rgba(37, 99, 235, 0.1)",
                                        }}
                                    >
                                        <p className="text-xs font-medium" style={{ color: isDarkMode ? "#bfdbfe" : "#1e3a8a" }}>
                                            ✅ {scannedData}
                                        </p>
                                    </motion.div>
                                )}

                                {qrError && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 text-center space-y-2"
                                    >
                                        <p className="text-xs" style={{ color: isDarkMode ? "#fda4af" : "#fecdd3" }}>{qrError}</p>
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={handleUploadClick}
                                                className="rounded px-3 py-1 text-xs text-white"
                                                style={{ backgroundColor: "#2563eb" }}
                                            >
                                                Try different image
                                            </button>
                                            <button
                                                onClick={() => setScanMethod(null)}
                                                className="rounded px-3 py-1 text-xs text-white"
                                                style={{ backgroundColor: "#475569" }}
                                            >
                                                Switch method
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {scanMethod && (
                            <motion.button
                                onClick={closeScanner}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors`}
                                style={{
                                    backgroundColor: isDarkMode ? "rgba(71, 85, 105, 0.9)" : "rgba(15, 23, 42, 0.5)",
                                    color: "#FFFFFF",
                                }}
                            >
                                Cancel
                            </motion.button>
                        )}
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body,
    );
};

export default QRScanner;