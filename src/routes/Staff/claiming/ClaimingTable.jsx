import React from "react";
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
import { CheckCircle2, Clock, Loader, Calendar, Shirt } from "lucide-react";

const ClaimingTable = ({ transactions, isLoading, onClaim }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-600 dark:text-slate-300">
        <Loader className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading transactions...</span>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        <CheckCircle2 className="h-12 w-12 mb-4 text-slate-400 dark:text-slate-500" />
        <p className="text-lg font-medium">All laundry has been claimed!</p>
        <p className="text-sm">No unclaimed completed transactions found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700">
            <TableHead className="text-slate-600 dark:text-slate-300">Customer</TableHead>
            <TableHead className="text-slate-600 dark:text-slate-300">Contact</TableHead>
            <TableHead className="text-slate-600 dark:text-slate-300">Service</TableHead>
            <TableHead className="text-slate-600 dark:text-slate-300">Loads</TableHead>
            <TableHead className="text-slate-600 dark:text-slate-300">Date Completed</TableHead>
            <TableHead className="text-slate-600 dark:text-slate-300">Status</TableHead>
            <TableHead className="text-right text-slate-600 dark:text-slate-300">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const completionDate = transaction.loadAssignments?.reduce((latest, load) => {
              if (load.endTime) {
                const loadDate = new Date(load.endTime);
                return !latest || loadDate > latest ? loadDate : latest;
              }
              return latest;
            }, null);

            return (
              <TableRow
                key={transaction.id || transaction.transactionId}
                className="border-t border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              >
                {/* Customer */}
                <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                  <div className="flex items-center">
                    <Shirt className="h-4 w-4 mr-2 text-cyan-600 dark:text-cyan-400" />
                    {transaction.customerName}
                  </div>
                </TableCell>

                {/* Contact */}
                <TableCell className="text-slate-700 dark:text-slate-300">
                  {transaction.contact || "N/A"}
                </TableCell>

                {/* Service */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className="capitalize border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                  >
                    {transaction.serviceType?.toLowerCase() || "N/A"}
                  </Badge>
                </TableCell>

                {/* Loads */}
                <TableCell>
                  <div className="flex justify-center">
                    <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {transaction.loadAssignments ? transaction.loadAssignments.length : 0}
                    </Badge>
                  </div>
                </TableCell>

                {/* Date Completed */}
                <TableCell>
                  <div className="flex items-center text-slate-600 dark:text-slate-300">
                    <Calendar className="h-4 w-4 mr-1 text-slate-400 dark:text-slate-500" />
                    {completionDate ? completionDate.toLocaleDateString() : "N/A"}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  {transaction.pickupStatus === "UNCLAIMED" ? (
                    <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 flex items-center gap-1 justify-center w-24">
                      <Clock className="h-3 w-3" />
                      Unclaimed
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 flex items-center gap-1 justify-center w-24">
                      <CheckCircle2 className="h-3 w-3" />
                      Claimed
                    </Badge>
                  )}
                </TableCell>

                {/* Action */}
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => onClaim(transaction.transactionId || transaction.id)}
                    disabled={transaction.pickupStatus !== "UNCLAIMED"}
                    className="bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-600 text-white"
                  >
                    Mark as Claimed
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

ClaimingTable.propTypes = {
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      transactionId: PropTypes.string,
      customerName: PropTypes.string,
      contact: PropTypes.string,
      serviceType: PropTypes.string,
      loadAssignments: PropTypes.array,
      pickupStatus: PropTypes.string,
    })
  ).isRequired,
  isLoading: PropTypes.bool.isRequired,
  onClaim: PropTypes.func.isRequired,
};

export default ClaimingTable;
