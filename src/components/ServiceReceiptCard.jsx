import React, { useState, useRef } from "react";
import { Printer, X } from "lucide-react";
import { motion } from "framer-motion";

const ServiceReceiptCard = ({ transaction, settings, onClose, isDarkMode }) => {
    const [isPrinting, setIsPrinting] = useState(false);
    const receiptRef = useRef();

    if (!transaction || !settings) return null;

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return date.toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "Invalid Date";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const transactionNumber = transaction.originalInvoiceNumber || transaction.transactionId || "N/A";
    
    const staffId = transaction.claimedByStaff || transaction.claimedByStaffId || "Staff";
    
    const numberOfLoads = transaction.totalLoads || (transaction.loadAssignments ? transaction.loadAssignments.length : 0);

    const claimDate = transaction.claimDate ? new Date(transaction.claimDate) : new Date();

    const completionDate = transaction.completionDate 
        ? new Date(transaction.completionDate) 
        : (transaction.loadAssignments?.reduce((latest, load) => {
            if (load.endTime) {
                const loadDate = new Date(load.endTime);
                return !latest || loadDate > latest ? loadDate : latest;
            }
            return latest;
        }, null) || claimDate);

    const handlePrint = () => {
        setIsPrinting(true);
        window.print();
        setTimeout(() => {
            setIsPrinting(false);
        }, 1000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative mx-auto max-w-md rounded-xl border-2 p-6 shadow-xl"
                style={{
                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                }}
            >
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-200 print:hidden"
                    style={{
                        backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        color: isDarkMode ? '#13151B' : '#0B2B26',
                    }}
                    aria-label="Close receipt"
                >
                    <X size={20} />
                </motion.button>

                <div
                    ref={receiptRef}
                    className="printable-area"
                >
                    <div 
                        className="mx-auto max-w-md space-y-2 rounded-lg border-2 p-4 font-mono text-sm shadow-md"
                        style={{
                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        }}
                    >
                        {/* Store Info */}
                        <div 
                            className="text-center text-lg font-bold"
                            style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
                        >
                            {settings.storeName}
                        </div>
                        <div 
                            className="text-center"
                            style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}
                        >
                            {settings.address}
                        </div>
                        <div 
                            className="text-center"
                            style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}
                        >
                            {settings.phone}
                        </div>

                        <hr 
                            className="my-2"
                            style={{
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                            }}
                        />

                        {/* Receipt Header */}
                        <div 
                            className="text-md text-center font-bold"
                            style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
                        >
                            LAUNDRY CLAIM RECEIPT
                        </div>

                        {/* Receipt Meta*/}
                        <div 
                            className="grid grid-cols-2 gap-1 text-xs"
                            style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
                        >
                            <div>
                                Transaction #: <span className="font-bold">{transactionNumber}</span>
                            </div>
                            <div className="text-right">
                                Service: <span className="font-bold">{transaction.serviceType}</span>
                            </div>
                            <div>
                                Customer: <span className="font-bold">{transaction.customerName}</span>
                            </div>
                            <div className="text-right">
                                Contact: <span className="font-bold">{transaction.contact || "—"}</span>
                            </div>
                            <div className="col-span-2">
                                Processed By: <span className="font-bold">{staffId}</span>
                            </div>
                        </div>

                        <hr 
                            className="my-2"
                            style={{
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                            }}
                        />

                        <div 
                            className="space-y-1"
                            style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
                        >
                            <div className="flex justify-between">
                                <span>Service Type:</span>
                                <span className="font-bold">{transaction.serviceType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Number of Loads:</span>
                                <span className="font-bold">{numberOfLoads}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Status:</span>
                                <span 
                                    className="font-bold"
                                    style={{ color: '#059669' }}
                                >
                                    CLAIMED
                                </span>
                            </div>
                        </div>

                        <hr 
                            className="my-2"
                            style={{
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                            }}
                        />

                        <div 
                            className="space-y-1 text-xs"
                            style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
                        >
                            <div className="flex justify-between">
                                <span>Laundry Completed:</span>
                                <span className="font-bold">{formatDateTime(completionDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Claimed On:</span>
                                <span className="font-bold">{formatDateTime(claimDate)}</span>
                            </div>
                        </div>

                        <hr 
                            className="my-2"
                            style={{
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                            }}
                        />

                        {/* Claim Confirmation */}
                        <div 
                            className="mt-2 text-xs"
                            style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}
                        >
                            <strong 
                                className="mb-1 block text-sm"
                                style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
                            >
                                Claim Confirmation
                            </strong>
                            <p>
                                This receipt confirms that {transaction.customerName} has claimed their laundry on {formatDate(claimDate)}. All items
                                have been verified and released to the customer. Laundry was completed on {formatDate(completionDate)}.
                            </p>
                        </div>

                        {/* Footer */}
                        <div 
                            className="mt-2 text-center text-xs"
                            style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}
                        >
                            {settings.footerNote || "Thank you for your business!"}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex justify-center print:hidden">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-white shadow-md transition-all hover:shadow-lg focus:outline-none"
                        style={{
                            backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                        }}
                        disabled={isPrinting}
                    >
                        <Printer size={18} />
                        {isPrinting ? "Printing..." : "Print Receipt"}
                    </motion.button>
                </div>
            </motion.div>

            {/* Print styles */}
            <style>
                {`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-area, .printable-area * {
              visibility: visible;
            }
            .printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
            </style>
        </motion.div>
    );
};

export default ServiceReceiptCard;