import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    Clock,
    Loader,
    Calendar,
    Shirt,
    Printer,
    Trash2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
} from "lucide-react";
import ServiceReceiptCard from "@/components/ServiceReceiptCard";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-config";

// Skeleton Loader Components
const SkeletonRow = ({ isExpiredTab, isDarkMode }) => (
    <TableRow 
        className="border-t transition-all"
        style={{
            borderColor: isDarkMode ? "#334155" : "#e2e8f0",
            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "#f8fafc",
        }}
    >
        <TableCell className="py-4">
            <div className="flex items-center">
                <div 
                    className="skeleton h-4 w-4 rounded mr-2"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0"
                    }}
                ></div>
                <div 
                    className="skeleton h-4 w-32 rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0"
                    }}
                ></div>
            </div>
        </TableCell>
        <TableCell>
            <div 
                className="skeleton h-4 w-24 rounded"
                style={{
                    backgroundColor: isDarkMode ? "#475569" : "#e2e8f0"
                }}
            ></div>
        </TableCell>
        <TableCell>
            <div 
                className="skeleton h-6 w-20 rounded-full"
                style={{
                    backgroundColor: isDarkMode ? "#475569" : "#e2e8f0"
                }}
            ></div>
        </TableCell>
        <TableCell>
            <div className="flex justify-center">
                <div 
                    className="skeleton h-6 w-8 rounded-full"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0"
                    }}
                ></div>
            </div>
        </TableCell>
        <TableCell>
            <div className="flex items-center">
                <div 
                    className="skeleton h-4 w-4 rounded mr-1"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0"
                    }}
                ></div>
                <div 
                    className="skeleton h-4 w-28 rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0"
                    }}
                ></div>
            </div>
        </TableCell>
        {!isExpiredTab && (
            <TableCell>
                <div 
                    className="skeleton h-4 w-28 rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0"
                    }}
                ></div>
            </TableCell>
        )}
        {isExpiredTab && (
            <TableCell>
                <div 
                    className="skeleton h-4 w-28 rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#475569" : "#e2e8f0"
                    }}
                ></div>
            </TableCell>
        )}
        <TableCell>
            <div 
                className="skeleton h-6 w-24 rounded-full"
                style={{
                    backgroundColor: isDarkMode ? "#475569" : "#e2e8f0"
                }}
            ></div>
        </TableCell>
        <TableCell>
            <div 
                className="skeleton h-8 w-full rounded"
                style={{
                    backgroundColor: isDarkMode ? "#475569" : "#e2e8f0"
                }}
            ></div>
        </TableCell>
    </TableRow>
);

const ClaimingTable = ({ transactions, isLoading, hasFetched, onClaim, onDispose, isExpiredTab, hasUnfilteredData, isDarkMode }) => {
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [loadingTransactionId, setLoadingTransactionId] = useState(null);
    const [disposingTransactionId, setDisposingTransactionId] = useState(null);
    const [formatSettings, setFormatSettings] = useState(null);
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [showDisposeConfirm, setShowDisposeConfirm] = useState(false);
    const [transactionToDispose, setTransactionToDispose] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    useEffect(() => {
        fetchFormatSettings();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [transactions]);

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";

        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const fetchFormatSettings = async () => {
        try {
            setLoadingSettings(true);
            const settings = await api.get("/format-settings");
            setFormatSettings(settings);
        } catch (error) {
            console.error("Error fetching format settings:", error);
            setFormatSettings({
                storeName: "StarWash Laundry",
                address: "123 Laundry Street, City",
                phone: "(123) 456-7890",
                footerNote: "Thank you for choosing our service!",
            });
        } finally {
            setLoadingSettings(false);
        }
    };

    if (isLoading) {
        return (
            <div 
                className="rounded-lg border-2 shadow-sm"
                style={{
                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                }}
            >
                <Table>
                    <TableHeader>
                        <TableRow 
                            className="border-b"
                            style={{
                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                            }}
                        >
                            <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Customer</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Contact</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Service</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Loads</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Date Completed</TableHead>
                            {!isExpiredTab && <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Due Date</TableHead>}
                            {isExpiredTab && <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Past Due On</TableHead>}
                            <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Status</TableHead>
                            <TableHead className="text-right" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: itemsPerPage }).map((_, index) => (
                            <SkeletonRow key={index} isExpiredTab={isExpiredTab} isDarkMode={isDarkMode} />
                        ))}
                    </TableBody>
                </Table>
                
                <style jsx>{`
                    .skeleton {
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 200% 100%;
                        animation: loading 1.5s infinite;
                    }
                    
                    .dark .skeleton {
                        background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
                        background-size: 200% 100%;
                    }
                    
                    @keyframes loading {
                        0% {
                            background-position: 200% 0;
                        }
                        100% {
                            background-position: -200% 0;
                        }
                    }
                `}</style>
            </div>
        );
    }

    if (!hasFetched) return null;

    const totalItems = transactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentItems = transactions.slice(startIndex, endIndex);

    const handleClaimClick = async (transaction) => {
        setLoadingTransactionId(transaction.id);

        try {
            const claimedTransaction = await onClaim(transaction.id);
            if (claimedTransaction) {
                setSelectedTransaction(claimedTransaction);
                setShowReceipt(true);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingTransactionId(null);
        }
    };

    const handleDisposeClick = (transaction) => {
        setTransactionToDispose(transaction);
        setShowDisposeConfirm(true);
    };

    const confirmDispose = async () => {
        if (!transactionToDispose) return;

        setDisposingTransactionId(transactionToDispose.id);
        try {
            await onDispose(transactionToDispose.id);
        } catch (error) {
            console.error(error);
        } finally {
            setDisposingTransactionId(null);
            setShowDisposeConfirm(false);
            setTransactionToDispose(null);
        }
    };

    const cancelDispose = () => {
        setShowDisposeConfirm(false);
        setTransactionToDispose(null);
    };

    const handleViewReceipt = (transaction) => {
        setSelectedTransaction(transaction);
        setShowReceipt(true);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
    };

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    };

    return (
        <>
            <div 
                className="rounded-lg border-2 shadow-sm"
                style={{
                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                }}
            >
                <Table>
                    <TableHeader>
                        <TableRow 
                            className="border-b"
                            style={{
                                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                                backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
                            }}
                        >
                            <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Customer</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Contact</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Service</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Loads</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Date Completed</TableHead>
                            {!isExpiredTab && <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Due Date</TableHead>}
                            {isExpiredTab && <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Past Due On</TableHead>}
                            <TableHead style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Status</TableHead>
                            <TableHead className="text-right" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 && !hasUnfilteredData ? (
                            <TableRow>
                                <TableCell
                                    colSpan={isExpiredTab ? 8 : 8}
                                    className="py-16 text-center"
                                >
                                    <div className="flex flex-col items-center justify-center" style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}>
                                        <CheckCircle2 className="mb-4 h-12 w-12" style={{ color: isDarkMode ? '#94a3b8' : '#475569' }} />
                                        <p className="text-lg font-medium">
                                            {isExpiredTab ? "No past due laundry!" : "All laundry has been claimed!"}
                                        </p>
                                        <p className="text-sm">
                                            {isExpiredTab ? "No past due transactions found." : "No unclaimed completed transactions found."}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : transactions.length === 0 && hasUnfilteredData ? (
                            <TableRow>
                                <TableCell
                                    colSpan={isExpiredTab ? 8 : 8}
                                    className="py-16 text-center"
                                >
                                    <div className="flex flex-col items-center justify-center" style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}>
                                        <Search className="mb-4 h-12 w-12" style={{ color: isDarkMode ? '#94a3b8' : '#475569' }} />
                                        <p className="text-lg font-medium">No matching transactions found</p>
                                        <p className="text-sm">Try adjusting your search or filter criteria</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentItems.map((transaction) => {
                                const completionDate = transaction.loadAssignments?.reduce(
                                    (latest, load) => (load.endTime ? (new Date(load.endTime) > latest ? new Date(load.endTime) : latest) : latest),
                                    null,
                                );

                                const dueDate = transaction.dueDate ? new Date(transaction.dueDate) : null;
                                const isExpired = transaction.expired || (dueDate && dueDate < new Date());

                                return (
                                    <TableRow
                                        key={transaction.id || transaction.transactionId}
                                        className={`border-t transition-all hover:opacity-90 ${
                                            isExpired ? "bg-rose-50 dark:bg-rose-950/30" : ""
                                        }`}
                                        style={{
                                            borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                                            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "#f8fafc",
                                        }}
                                    >
                                        <TableCell className="flex items-center font-medium" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                            <Shirt className="mr-2 h-4 w-4" style={{ color: isDarkMode ? '#3DD9B6' : '#0891B2' }} />
                                            {transaction.customerName}
                                        </TableCell>
                                        <TableCell style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>{transaction.contact || "N/A"}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="border-2 capitalize transition-all"
                                                style={{
                                                    borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                                                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                                    backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                                }}
                                            >
                                                {transaction.serviceType?.toLowerCase() || "N/A"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-center">
                                                <Badge 
                                                    className="transition-all"
                                                    style={{
                                                        backgroundColor: isDarkMode ? "#0f172a" : "#0f172a",
                                                        color: "#f1f5f9",
                                                    }}
                                                >
                                                    {transaction.loadAssignments?.length || 0}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="flex items-center" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                            <Calendar className="mr-1 h-4 w-4" style={{ color: isDarkMode ? '#94a3b8' : '#475569' }} />
                                            {completionDate ? formatDateTime(completionDate) : "N/A"}
                                        </TableCell>
                                        {!isExpiredTab && (
                                            <TableCell style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                                {dueDate ? formatDateTime(dueDate) : "N/A"}
                                            </TableCell>
                                        )}
                                        {isExpiredTab && (
                                            <TableCell style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                                {dueDate ? formatDateTime(dueDate) : "N/A"}
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            {isExpired ? (
                                                <Badge 
                                                    className="flex w-24 items-center justify-center gap-1 transition-all"
                                                    style={{
                                                        backgroundColor: '#FEF2F2',
                                                        color: '#DC2626',
                                                    }}
                                                >
                                                    <AlertTriangle className="h-3 w-3" /> Past Due
                                                </Badge>
                                            ) : transaction.pickupStatus === "UNCLAIMED" ? (
                                                <Badge 
                                                    className="flex w-24 items-center justify-center gap-1 transition-all"
                                                    style={{
                                                        backgroundColor: '#FFFBEB',
                                                        color: '#D97706',
                                                    }}
                                                >
                                                    <Clock className="h-3 w-3" /> Unclaimed
                                                </Badge>
                                            ) : (
                                                <Badge 
                                                    className="flex w-24 items-center justify-center gap-1 transition-all"
                                                    style={{
                                                        backgroundColor: '#F0FDF4',
                                                        color: '#059669',
                                                    }}
                                                >
                                                    <CheckCircle2 className="h-3 w-3" /> Claimed
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="flex flex-col gap-2 text-right">
                                            {isExpired ? (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleDisposeClick(transaction)}
                                                    disabled={disposingTransactionId === transaction.id}
                                                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                                                    style={{
                                                        backgroundColor: '#EF4444',
                                                        color: '#FFFFFF',
                                                    }}
                                                >
                                                    {disposingTransactionId === transaction.id ? (
                                                        <>
                                                            <Loader className="mr-1 h-3 w-3 animate-spin" />
                                                            Disposing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Trash2 className="mr-1 h-3 w-3" />
                                                            Dispose
                                                        </>
                                                    )}
                                                </motion.button>
                                            ) : transaction.pickupStatus === "UNCLAIMED" ? (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleClaimClick(transaction)}
                                                    disabled={loadingTransactionId === transaction.id}
                                                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                                                    style={{
                                                        backgroundColor: isDarkMode ? "#0f172a" : "#0f172a",
                                                        color: "#f1f5f9",
                                                    }}
                                                >
                                                    {loadingTransactionId === transaction.id ? (
                                                        <>
                                                            <Loader className="mr-1 h-3 w-3 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        "Mark as Claimed"
                                                    )}
                                                </motion.button>
                                            ) : (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleViewReceipt(transaction)}
                                                    className="flex items-center gap-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all"
                                                    style={{
                                                        borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                                                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                                        backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                                    }}
                                                >
                                                    <Printer className="h-3 w-3" />
                                                    Receipt
                                                </motion.button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                {!isLoading && transactions.length > 0 && (
                    <div 
                        className="flex flex-col items-center justify-between border-t p-4 sm:flex-row"
                        style={{
                            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                        }}
                    >
                        <div className="mb-4 flex items-center space-x-2 sm:mb-0">
                            <p className="text-sm" style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}>Rows per page</p>
                            <select
                                className="h-8 w-16 rounded-lg border-2 text-sm transition-all"
                                style={{
                                    borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                }}
                                value={itemsPerPage}
                                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <div className="text-sm" style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}>
                                {startIndex + 1}-{endIndex} of {totalItems}
                            </div>

                            <div className="flex space-x-1">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all"
                                    style={{
                                        borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                    }}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all"
                                    style={{
                                        borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                    }}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all"
                                    style={{
                                        borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                    }}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all"
                                    style={{
                                        borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                                        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                    }}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Dispose Confirmation Modal */}
            <AnimatePresence>
                {showDisposeConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md rounded-xl border-2 p-6 shadow-2xl"
                            style={{
                                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                                borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                            }}
                        >
                            <div className="mb-4 flex items-center gap-3">
                                <div 
                                    className="flex h-12 w-12 items-center justify-center rounded-full"
                                    style={{
                                        backgroundColor: '#FEF2F2',
                                    }}
                                >
                                    <AlertTriangle className="h-6 w-6" style={{ color: '#EF4444' }} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Confirm Disposal</h3>
                                    <p className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>This action cannot be undone</p>
                                </div>
                            </div>

                            <p className="mb-6" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                This laundry item was not claimed by the customer. Are you sure you want to dispose it?
                            </p>

                            <div className="flex justify-end gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={cancelDispose}
                                    className="rounded-lg border-2 px-5 py-2 transition-all"
                                    style={{
                                        borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                        backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                    }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={confirmDispose}
                                    disabled={disposingTransactionId === transactionToDispose?.id}
                                    className="rounded-lg px-5 py-2 text-white transition-all"
                                    style={{
                                        backgroundColor: '#EF4444',
                                    }}
                                >
                                    {disposingTransactionId === transactionToDispose?.id ? (
                                        <>
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            Disposing...
                                        </>
                                    ) : (
                                        "Yes, Dispose"
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showReceipt && selectedTransaction && formatSettings && (
                <ServiceReceiptCard
                    transaction={selectedTransaction}
                    settings={formatSettings}
                    onClose={() => setShowReceipt(false)}
                    isDarkMode={isDarkMode}
                />
            )}

            {loadingSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div 
                        className="rounded-xl border-2 p-6 shadow-lg"
                        style={{
                            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                            borderColor: isDarkMode ? "#475569" : "#cbd5e1",
                        }}
                    >
                        <Loader className="mx-auto mb-4 h-8 w-8 animate-spin" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }} />
                        <p className="text-center" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Loading receipt settings...</p>
                    </div>
                </div>
            )}
        </>
    );
};

ClaimingTable.propTypes = {
    transactions: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
    hasFetched: PropTypes.bool.isRequired,
    onClaim: PropTypes.func.isRequired,
    onDispose: PropTypes.func.isRequired,
    isExpiredTab: PropTypes.bool,
    hasUnfilteredData: PropTypes.bool,
    isDarkMode: PropTypes.bool,
};

ClaimingTable.defaultProps = {
    isExpiredTab: false,
    hasUnfilteredData: false,
    isDarkMode: false,
};

export default ClaimingTable;