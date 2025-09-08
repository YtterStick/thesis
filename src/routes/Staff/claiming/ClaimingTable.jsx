import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Loader, Calendar, Shirt } from 'lucide-react';

const ClaimingTable = ({ transactions, isLoading, onClaim }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-700 dark:text-gray-200">
        <Loader className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading transactions...</span>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground dark:text-gray-400">
        <CheckCircle className="h-12 w-12 mb-4 text-gray-500 dark:text-gray-300" />
        <p className="text-lg font-medium">All laundry has been claimed!</p>
        <p className="text-sm">No unclaimed completed transactions found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100 dark:bg-gray-800">
            <TableHead className="text-gray-700 dark:text-gray-300">Customer</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300">Contact</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300">Service</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300">Loads</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300">Date Completed</TableHead>
            <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
            <TableHead className="text-right text-gray-700 dark:text-gray-300">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const completionDate = transaction.loadAssignments?.reduce((latest, load) => {
              if (load.endTime) {
                const loadDate = new Date(load.endTime);
                return (!latest || loadDate > latest) ? loadDate : latest;
              }
              return latest;
            }, null);

            return (
              <TableRow
                key={transaction.id || transaction.transactionId}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                  <div className="flex items-center">
                    <Shirt className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                    {transaction.customerName}
                  </div>
                </TableCell>
                <TableCell className="text-gray-800 dark:text-gray-200">
                  {transaction.contact || 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize dark:border-gray-600 dark:text-gray-200">
                    {transaction.serviceType?.toLowerCase() || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-200">
                      {transaction.loadAssignments ? transaction.loadAssignments.length : 0}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                    {completionDate ? completionDate.toLocaleDateString() : 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={transaction.pickupStatus === 'UNCLAIMED' ? 'secondary' : 'default'}
                    className={`flex items-center gap-1 w-24 justify-center 
                      ${transaction.pickupStatus === 'UNCLAIMED'
                        ? 'dark:bg-gray-700 dark:text-gray-300'
                        : 'dark:bg-green-700 dark:text-white'}`}
                  >
                    {transaction.pickupStatus === 'UNCLAIMED' ? (
                      <>
                        <Clock className="h-3 w-3" />
                        Unclaimed
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Claimed
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => onClaim(transaction.transactionId || transaction.id)}
                    disabled={transaction.pickupStatus !== 'UNCLAIMED'}
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
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
