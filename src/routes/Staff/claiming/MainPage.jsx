import React, { useState, useEffect } from 'react';
import ClaimingTable from './ClaimingTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MainPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchCompletedTransactions();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchCompletedTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, dateFilter]);

  const fetchCompletedTransactions = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('http://localhost:8080/api/claiming/completed-unclaimed', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch completed transactions');
      }
      
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load completed transactions',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.customerName.toLowerCase().includes(term) ||
        (transaction.contact && transaction.contact.toLowerCase().includes(term)) ||
        (transaction.transactionId && transaction.transactionId.toLowerCase().includes(term))
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      
      filtered = filtered.filter(transaction => {
        // Find the most recent completion date
        const completionDate = transaction.loadAssignments?.reduce((latest, load) => {
          if (load.endTime) {
            const loadDate = new Date(load.endTime);
            return (!latest || loadDate > latest) ? loadDate : latest;
          }
          return latest;
        }, null);

        if (!completionDate) return false;
        
        switch (dateFilter) {
          case 'today':
            return completionDate.toDateString() === today.toDateString();
          case 'week':
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return completionDate >= oneWeekAgo;
          case 'month':
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return completionDate >= oneMonthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredTransactions(filtered);
  };

  const handleClaim = async (transactionId) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:8080/api/claiming/${transactionId}/claim`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to claim transaction');
      }
      
      // Update local state by removing the claimed transaction
      setTransactions(prev => 
        prev.filter(transaction => transaction.transactionId !== transactionId)
      );
      
      toast({
        title: 'Success',
        description: 'Laundry claimed successfully',
      });
    } catch (error) {
      console.error('Error claiming transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to claim laundry',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laundry Claiming</h1>
          <p className="text-gray-600 mt-1">Manage completed laundry ready for pickup</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          Auto-refreshing every 30 seconds
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader className="bg-gray-50 rounded-t-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Completed & Unclaimed Laundry</CardTitle>
              <CardDescription>
                {filteredTransactions.length} item{filteredTransactions.length !== 1 ? 's' : ''} ready for pickup
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  className="pl-8 w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ClaimingTable 
            transactions={filteredTransactions}
            isLoading={isLoading}
            onClaim={handleClaim}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MainPage;