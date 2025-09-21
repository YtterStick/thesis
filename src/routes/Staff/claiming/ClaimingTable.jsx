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
    RefreshCw,
} from "lucide-react";
import ServiceReceiptCard from "@/components/ServiceReceiptCard";

const ClaimingTable = ({ transactions, isLoading, hasFetched, onClaim, onDispose, isExpiredTab }) => {
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [loadingTransactionId, setLoadingTransactionId] = useState(null);
    const [disposingTransactionId, setDisposingTransactionId] = useState(null);
    const [formatSettings, setFormatSettings] = useState(null);
    const [loadingSettings, setLoadingSettings] = useState(false);

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

    const formatDateOnly = (dateString) => {
        if (!dateString) return "N/A";

        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const fetchFormatSettings = async () => {
        try {
            setLoadingSettings(true);
            const token = localStorage.getItem("authToken");

            const response = await fetch("http://localhost:8080/api/format-settings", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const settings = await response.json();
                setFormatSettings(settings);
            } else {
                setFormatSettings({
                    storeName: "StarWash Laundry",
                    address: "123 Laundry Street, City",
                    phone: "(123) 456-7890",
                    footerNote: "Thank you for choosing our service!",
                });
            }
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

    if (!hasFetched) return null;

    const totalItems = transactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentItems = transactions.slice(startIndex, endIndex);

    const handleClaimClick = async (transaction) => {
        setLoadingTransactionId(transaction.id);
        setSelectedTransaction(transaction);

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

    const handleDisposeClick = async (transaction) => {
        console.log("Disposing transaction:", transaction);
        console.log("Transaction ID:", transaction.id);
        console.log("Transaction transactionId:", transaction.transactionId);

        setDisposingTransactionId(transaction.id);
        try {
            await onDispose(transaction.id);
        } catch (error) {
            console.error(error);
        } finally {
            setDisposingTransactionId(null);
        }
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
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    return (
        <>
            <div className="rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80">
                            <TableHead>Customer</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Loads</TableHead>
                            <TableHead>Date Completed</TableHead>
                            {!isExpiredTab && <TableHead>Due Date</TableHead>}
                            {isExpiredTab && <TableHead>Past Due On</TableHead>}
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={isExpiredTab ? 8 : 7}
                                    className="py-16 text-center"
                                >
                                    <Loader className="mx-auto mb-2 h-8 w-8 animate-spin" />
                                    <div className="text-slate-600 dark:text-slate-400">
                                        {isExpiredTab ? "Loading past due transactions..." : "Loading transactions..."}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={isExpiredTab ? 8 : 7}
                                    className="py-16 text-center"
                                >
                                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                                        <CheckCircle2 className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-500" />
                                        <p className="text-lg font-medium text-center">
                                            {isExpiredTab ? "No past due laundry!" : "All laundry has been claimed!"}
                                        </p>
                                        <p className="text-sm">
                                            {isExpiredTab ? "No past due transactions found." : "No unclaimed completed transactions found."}
                                        </p>
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
                                        className={`border-t border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800/50 ${
                                            isExpired ? "bg-rose-50 dark:bg-rose-950/30" : ""
                                        }`}
                                    >
                                        <TableCell className="flex items-center font-medium text-slate-900 dark:text-slate-100">
                                            <Shirt className="mr-2 h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                            {transaction.customerName}
                                        </TableCell>
                                        <TableCell className="text-slate-700 dark:text-slate-300">{transaction.contact || "N/A"}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="border-slate-300 capitalize text-slate-700 dark:border-slate-600 dark:text-slate-300"
                                            >
                                                {transaction.serviceType?.toLowerCase() || "N/A"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-center">
                                                <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                                    {transaction.loadAssignments?.length || 0}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="flex items-center text-slate-600 dark:text-slate-300">
                                            <Calendar className="mr-1 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                            {completionDate ? formatDateTime(completionDate) : "N/A"}
                                        </TableCell>
                                        {!isExpiredTab && (
                                            <TableCell className="text-slate-600 dark:text-slate-300">
                                                {dueDate ? formatDateTime(dueDate) : "N/A"}
                                            </TableCell>
                                        )}
                                        {isExpiredTab && (
                                            <TableCell className="text-slate-600 dark:text-slate-300">
                                                {dueDate ? formatDateTime(dueDate) : "N/A"}
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            {isExpired ? (
                                                <Badge className="flex w-24 items-center justify-center gap-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                                                    <AlertTriangle className="h-3 w-3" /> Past Due
                                                </Badge>
                                            ) : transaction.pickupStatus === "UNCLAIMED" ? (
                                                <Badge className="flex w-24 items-center justify-center gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                                                    <Clock className="h-3 w-3" /> Unclaimed
                                                </Badge>
                                            ) : (
                                                <Badge className="flex w-24 items-center justify-center gap-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                    <CheckCircle2 className="h-3 w-3" /> Claimed
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="flex flex-col gap-2 text-right">
                                            {isExpired ? (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDisposeClick(transaction)}
                                                    disabled={disposingTransactionId === transaction.id}
                                                    className="flex items-center gap-1"
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
                                                </Button>
                                            ) : transaction.pickupStatus === "UNCLAIMED" ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleClaimClick(transaction)}
                                                    disabled={loadingTransactionId === transaction.id}
                                                    className="bg-cyan-600 text-white hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-600"
                                                >
                                                    {loadingTransactionId === transaction.id ? (
                                                        <>
                                                            <Loader className="mr-1 h-3 w-3 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        "Mark as Claimed"
                                                    )}
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleViewReceipt(transaction)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Printer className="h-3 w-3" />
                                                    Receipt
                                                </Button>
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
                    <div className="flex flex-col items-center justify-between border-t border-slate-300 p-4 dark:border-slate-700 sm:flex-row">
                        <div className="mb-4 flex items-center space-x-2 sm:mb-0">
                            <p className="text-sm text-slate-600 dark:text-slate-400">Rows per page</p>
                            <select
                                className="h-8 w-16 rounded-md border border-slate-300 bg-white text-sm dark:border-slate-600 dark:bg-slate-800"
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
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                {startIndex + 1}-{endIndex} of {totalItems}
                            </div>

                            <div className="flex space-x-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showReceipt && selectedTransaction && formatSettings && (
                <ServiceReceiptCard
                    transaction={selectedTransaction}
                    settings={formatSettings}
                    onClose={() => setShowReceipt(false)}
                />
            )}

            {loadingSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
                        <Loader className="mx-auto mb-4 h-8 w-8 animate-spin" />
                        <p className="text-center">Loading receipt settings...</p>
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
};

ClaimingTable.defaultProps = {
    isExpiredTab: false,
};

export default ClaimingTable;