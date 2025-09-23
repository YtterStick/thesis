import React, { useState, useRef } from "react";
import { Printer, X } from "lucide-react";

const ServiceReceiptCard = ({ transaction, settings, onClose }) => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 dark:bg-black dark:bg-opacity-80">
            <div className="relative mx-auto max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900">
                <button
                    onClick={onClose}
                    className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-red-500 transition-all duration-200 print:hidden"
                    aria-label="Close receipt"
                >
                    <X size={20} className="transition-transform duration-200 hover:scale-110" />
                </button>

                <div
                    ref={receiptRef}
                    className="printable-area"
                >
                    <div className="mx-auto max-w-md space-y-2 rounded-md border border-dashed bg-white p-4 font-mono text-sm shadow-md dark:border-gray-600 dark:bg-slate-950">
                        {/* Store Info */}
                        <div className="text-center text-lg font-bold dark:text-white">{settings.storeName}</div>
                        <div className="text-center dark:text-gray-300">{settings.address}</div>
                        <div className="text-center dark:text-gray-300">{settings.phone}</div>

                        <hr className="my-2 border-gray-300 dark:border-gray-600" />

                        {/* Receipt Header */}
                        <div className="text-md text-center font-bold dark:text-white">LAUNDRY CLAIM RECEIPT</div>

                        {/* Receipt Meta*/}
                        <div className="grid grid-cols-2 gap-1 text-xs dark:text-gray-300">
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

                        <hr className="my-2 border-gray-300 dark:border-gray-600" />

                        <div className="space-y-1 dark:text-white">
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
                                <span className="font-bold text-green-600">CLAIMED</span>
                            </div>
                        </div>

                        <hr className="my-2 border-gray-300 dark:border-gray-600" />

                        <div className="space-y-1 text-xs dark:text-gray-300">
                            <div className="flex justify-between">
                                <span>Laundry Completed:</span>
                                <span className="font-bold">{formatDateTime(completionDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Claimed On:</span>
                                <span className="font-bold">{formatDateTime(claimDate)}</span>
                            </div>
                        </div>

                        <hr className="my-2 border-gray-300 dark:border-gray-600" />

                        {/* Claim Confirmation */}
                        <div className="mt-2 text-xs text-slate-600 dark:text-gray-300">
                            <strong className="mb-1 block text-sm text-slate-700 dark:text-slate-200">Claim Confirmation</strong>
                            <p>
                                This receipt confirms that {transaction.customerName} has claimed their laundry on {formatDate(claimDate)}. All items
                                have been verified and released to the customer. Laundry was completed on {formatDate(completionDate)}.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="mt-2 text-center text-xs dark:text-gray-300">{settings.footerNote || "Thank you for your business!"}</div>
                    </div>
                </div>

                <div className="mt-4 flex justify-center print:hidden">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        disabled={isPrinting}
                    >
                        <Printer size={18} />
                        {isPrinting ? "Printing..." : "Print Receipt"}
                    </button>
                </div>
            </div>

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
        </div>
    );
};

export default ServiceReceiptCard;