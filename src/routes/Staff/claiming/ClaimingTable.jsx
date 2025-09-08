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
import { CheckCircle, Clock, Loader } from 'lucide-react';

const ClaimingTable = ({ transactions, isLoading, onClaim }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading transactions...</span>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mb-4" />
        <p className="text-lg">All laundry has been claimed!</p>
        <p className="text-sm">No unclaimed completed transactions found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Loads</TableHead>
            <TableHead>Detergent</TableHead>
            <TableHead>Fabric Softener</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id || transaction.transactionId}>
              <TableCell className="font-medium">{transaction.customerName}</TableCell>
              <TableCell>{transaction.contact || 'N/A'}</TableCell>
              <TableCell>{transaction.serviceType || 'N/A'}</TableCell>
              <TableCell>{transaction.loadAssignments ? transaction.loadAssignments.length : 0}</TableCell>
              <TableCell>{transaction.detergentQty || 0}</TableCell>
              <TableCell>{transaction.fabricQty || 0}</TableCell>
              <TableCell>
                {transaction.issueDate ? new Date(transaction.issueDate).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={transaction.pickupStatus === 'UNCLAIMED' ? 'secondary' : 'default'}
                  className="flex items-center gap-1 w-24 justify-center"
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
                >
                  Mark as Claimed
                </Button>
              </TableCell>
            </TableRow>
          ))}
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
      detergentQty: PropTypes.number,
      fabricQty: PropTypes.number,
      issueDate: PropTypes.string,
      pickupStatus: PropTypes.string,
    })
  ).isRequired,
  isLoading: PropTypes.bool.isRequired,
  onClaim: PropTypes.func.isRequired,
};

export default ClaimingTable;