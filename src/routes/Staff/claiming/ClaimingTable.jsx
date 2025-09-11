import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Loader, Calendar, Shirt, Printer, Trash2, AlertTriangle } from "lucide-react";
import ServiceReceiptCard from "@/components/ServiceReceiptCard";

const ClaimingTable = ({ transactions, isLoading, hasFetched, onClaim, onDispose }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loadingTransactionId, setLoadingTransactionId] = useState(null);
  const [disposingTransactionId, setDisposingTransactionId] = useState(null);
  const [formatSettings, setFormatSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => {
    fetchFormatSettings();
  }, []);

  const fetchFormatSettings = async () => {
    try {
      setLoadingSettings(true);
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        "http://localhost:8080/api/format-settings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

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

  return (
    <>
      <div className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700">
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Loads</TableHead>
              <TableHead>Date Completed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <div className="text-slate-600 dark:text-slate-400">Loading transactions...</div>
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16">
                  <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="h-12 w-12 mb-4 text-slate-400 dark:text-slate-500" />
                    <p className="text-lg font-medium">All laundry has been claimed!</p>
                    <p className="text-sm">No unclaimed completed transactions found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => {
                const completionDate = transaction.loadAssignments?.reduce(
                  (latest, load) => (load.endTime ? new Date(load.endTime) > latest ? new Date(load.endTime) : latest : latest),
                  null
                );

                const isExpired = transaction.expired;

                return (
                  <TableRow
                    key={transaction.id || transaction.transactionId}
                    className={`border-t border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50 ${
                      isExpired ? "bg-rose-50 dark:bg-rose-950/30" : ""
                    }`}
                  >
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100 flex items-center">
                      <Shirt className="h-4 w-4 mr-2 text-cyan-600 dark:text-cyan-400" />
                      {transaction.customerName}
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">
                      {transaction.contact || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300">
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
                      <Calendar className="h-4 w-4 mr-1 text-slate-400 dark:text-slate-500" />
                      {completionDate ? completionDate.toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      {isExpired ? (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 flex items-center gap-1 justify-center w-24">
                          <AlertTriangle className="h-3 w-3" /> Expired
                        </Badge>
                      ) : transaction.pickupStatus === "UNCLAIMED" ? (
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 flex items-center gap-1 justify-center w-24">
                          <Clock className="h-3 w-3" /> Unclaimed
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 flex items-center gap-1 justify-center w-24">
                          <CheckCircle2 className="h-3 w-3" /> Claimed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right flex flex-col gap-2">
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
                              <Loader className="h-3 w-3 mr-1 animate-spin" />
                              Disposing...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Dispose
                            </>
                          )}
                        </Button>
                      ) : transaction.pickupStatus === "UNCLAIMED" ? (
                        <Button
                          size="sm"
                          onClick={() => handleClaimClick(transaction)}
                          disabled={loadingTransactionId === transaction.id}
                          className="bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-600 text-white"
                        >
                          {loadingTransactionId === transaction.id ? (
                            <>
                              <Loader className="h-3 w-3 mr-1 animate-spin" />
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
      </div>

      {showReceipt && selectedTransaction && formatSettings && (
        <ServiceReceiptCard
          transaction={selectedTransaction}
          settings={formatSettings}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {loadingSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
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
};

export default ClaimingTable;