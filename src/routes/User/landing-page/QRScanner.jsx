import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { QrCode, Camera, Upload, X, Loader2 } from "lucide-react";

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
    const [scannedUrl, setScannedUrl] = useState(null);

    const fileInputRef = useRef(null);
    const scannerRef = useRef(null);
    const scannerInstanceRef = useRef(null);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    const handleScanQR = () => {
        setShowScanner(true);
        setScanMethod(null);
        setQrError(null);
        setScannedUrl(null);
    };

    // Camera Scanner with Html5Qrcode
    const startCameraScan = async () => {
        try {
            setIsScanning(true);
            setScanMethod("camera");
            setQrLoading(true);
            setQrError(null);
            setScannedUrl(null);

            // Wait for DOM to update
            await new Promise((resolve) => setTimeout(resolve, 100));

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

                await scanner
                    .start(
                        {
                            facingMode: "environment",
                        },
                        {
                            fps: 10,
                            qrbox: isMobile ? { width: 200, height: 200 } : { width: 250, height: 250 },
                        },
                        (decodedText) => {
                            console.log("✅ QR Code detected:", decodedText);
                            handleScannedQRCode(decodedText);
                        },
                        (errorMessage) => {
                            // This is normal - it's called when no QR code is found
                            console.log("🔍 Scanning...", errorMessage);
                        },
                    )
                    .catch((error) => {
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

    // File Upload with Html5Qrcode
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
            if (error.message && typeof error.message === "string") {
                if (error.message.includes("No MultiFormat Readers") || error.message.includes("NotFoundException")) {
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

    // Handle scanned QR code data
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
        if (decodedText.includes("/")) {
            try {
                const url = new URL(decodedText);
                const pathParts = url.pathname.split("/");
                const lastPart = pathParts[pathParts.length - 1];

                if (lastPart && lastPart !== "track") {
                    receiptNumber = lastPart;
                    console.log("📄 Extracted receipt number from URL:", receiptNumber);
                }
            } catch (e) {
                console.log("⚠️ Not a valid URL, using raw data as receipt number");
            }
        }

        console.log("🎯 Final receipt number to use:", receiptNumber);

        if (receiptNumber && receiptNumber.length > 0) {
            // Call the parent callback with the scanned data
            onQRScanned(receiptNumber, decodedText);

            // Show success message with the scanned URL
            console.log("✅ QR code scanned successfully!");
            console.log("🔗 Full scanned URL:", decodedText);
            console.log("📄 Receipt number extracted:", receiptNumber);

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
            scannerInstanceRef.current
                .stop()
                .then(() => {
                    console.log("✅ Scanner stopped successfully");
                    scannerInstanceRef.current.clear();
                    scannerInstanceRef.current = null;
                })
                .catch((error) => {
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

    return (
        <AnimatePresence>
            {showScanner && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative mx-4 w-full max-w-md rounded-xl border-2 p-4"
                        style={{
                            backgroundColor: isDarkMode ? "#F3EDE3" : "#183D3D",
                            borderColor: isDarkMode ? "#2A524C" : "#183D3D",
                            color: isDarkMode ? "#13151B" : "#F3EDE3",
                        }}
                    >
                        <motion.button
                            onClick={closeScanner}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute right-2 top-2 transition-colors hover:opacity-70"
                            style={{ color: isDarkMode ? "#13151B" : "#F3EDE3" }}
                        >
                            <X className="h-5 w-5" />
                        </motion.button>

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

                                <motion.button
                                    onClick={startCameraScan}
                                    whileHover={{ 
                                        scale: 1.02,
                                        y: -2,
                                        backgroundColor: isDarkMode ? "#2A524C" : "#D5DCDB",
                                        transition: { duration: 0.2 }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all shadow-lg`}
                                    style={{
                                        backgroundColor: isDarkMode ? "#18442A" : "#F3EDE3",
                                        color: isDarkMode ? "#D5DCDB" : "#183D3D",
                                    }}
                                >
                                    <Camera className="h-4 w-4" />
                                    Use Camera
                                </motion.button>

                                <div className="relative">
                                    <motion.button
                                        onClick={handleUploadClick}
                                        whileHover={{ 
                                            scale: 1.02,
                                            y: -2,
                                            backgroundColor: isDarkMode ? "#3A635C" : "#E8F0EF",
                                            transition: { duration: 0.2 }
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all shadow-lg`}
                                        style={{
                                            backgroundColor: isDarkMode ? "#2A524C" : "#F3EDE3",
                                            color: isDarkMode ? "#D5DCDB" : "#183D3D",
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
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-3 rounded border border-green-400 bg-green-100 p-2"
                                    >
                                        <p className="text-xs font-medium text-green-700">QR Code Scanned Successfully!</p>
                                        <p className="mt-1 break-all text-xs text-green-600">URL: {scannedUrl}</p>
                                    </motion.div>
                                )}

                                {qrError && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-3 text-center"
                                    >
                                        <p className="text-sm text-red-500">{qrError}</p>
                                    </motion.div>
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
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex h-64 items-center justify-center rounded-lg bg-gray-100"
                                    >
                                        <div className="text-center">
                                            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                                            <p>Processing image...</p>
                                            <p className="mt-1 text-xs text-gray-600">Checking for QR code</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="flex h-64 items-center justify-center rounded-lg bg-gray-100">
                                        <p className="text-gray-600">Select an image containing QR code</p>
                                    </div>
                                )}

                                {scannedUrl && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-3 rounded border border-green-400 bg-green-100 p-2"
                                    >
                                        <p className="text-xs font-medium text-green-700">QR Code Scanned Successfully!</p>
                                        <p className="mt-1 break-all text-xs text-green-600">URL: {scannedUrl}</p>
                                    </motion.div>
                                )}

                                {qrError && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 text-center"
                                    >
                                        <p className="text-sm text-red-500">{qrError}</p>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {scanMethod && (
                            <motion.button
                                onClick={closeScanner}
                                whileHover={{ 
                                    scale: 1.02,
                                    backgroundColor: isDarkMode ? "#3A635C" : "#2A635C",
                                    transition: { duration: 0.2 }
                                }}
                                whileTap={{ scale: 0.98 }}
                                className={`mt-3 w-full rounded-lg py-3 text-sm font-semibold transition-colors shadow-lg sm:py-2`}
                                style={{
                                    backgroundColor: isDarkMode ? "#6B7280" : "#2A524C",
                                    color: "#FFFFFF",
                                }}
                            >
                                Cancel Scan
                            </motion.button>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QRScanner;