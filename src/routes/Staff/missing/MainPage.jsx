import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Calendar, Clock, User, CheckCircle, AlertCircle, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const MissingItemsPage = () => {
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("unclaimed");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newItem, setNewItem] = useState({
    itemDescription: "",
    machineId: "",
    notes: ""
  });
  const [claimName, setClaimName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchMissingItems();
    fetchMachines();
  }, []);

  const fetchMissingItems = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "http://localhost:8080/api/missing-items",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch missing items");
      const data = await response.json();
      setAllItems(data);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load missing items", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      setIsLoadingMachines(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "http://localhost:8080/api/machines",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch machines");
      const data = await response.json();
      setMachines(data);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load machines", variant: "destructive" });
    } finally {
      setIsLoadingMachines(false);
    }
  };

  const handleReportItem = async () => {
    try {
      if (!newItem.machineId) {
        toast({ title: "Error", description: "Please select a machine", variant: "destructive" });
        return;
      }

      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "http://localhost:8080/api/missing-items",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newItem),
        }
      );

      if (!response.ok) throw new Error("Failed to report missing item");

      toast({
        title: "Success",
        description: "Missing item reported successfully",
      });

      setShowReportDialog(false);
      setNewItem({ itemDescription: "", machineId: "", notes: "" });
      fetchMissingItems();

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to report missing item", variant: "destructive" });
    }
  };

  const handleClaimItem = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:8080/api/missing-items/${selectedItem.id}/claim`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ claimedByName: claimName }),
        }
      );

      if (!response.ok) throw new Error("Failed to claim item");

      toast({
        title: "Success",
        description: "Item claimed successfully",
      });

      setShowClaimDialog(false);
      setClaimName("");
      setSelectedItem(null);
      fetchMissingItems();

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to claim item", variant: "destructive" });
    }
  };

  // Filter items based on search term and status filter
  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.foundInMachineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "unclaimed" && !item.isClaimed) ||
                         (statusFilter === "claimed" && item.isClaimed);
    
    return matchesSearch && matchesStatus;
  });

  const unclaimedItems = allItems.filter(item => !item.isClaimed);
  const claimedItems = allItems.filter(item => item.isClaimed);

  const inputClass = "bg-white dark:bg-slate-950 text-slate-700 dark:text-muted-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";
  const selectTriggerClass = "bg-white dark:bg-slate-950 text-slate-700 dark:text-muted-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";
  const buttonClass = "bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-600 text-white";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Missing Items</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Track and manage lost and found items</p>
        </div>
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogTrigger asChild>
            <Button className={buttonClass}>
              <Plus className="h-4 w-4 mr-2" />
              Report Missing Item
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-slate-50">Report Missing Item</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Enter details about the item found in the machine.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-muted-foreground">Item Description *</label>
                <Input
                  className={inputClass}
                  placeholder="e.g., Blue shirt, Black socks, etc."
                  value={newItem.itemDescription}
                  onChange={e => setNewItem({...newItem, itemDescription: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-muted-foreground">Machine Found In *</label>
                <Select 
                  value={newItem.machineId} 
                  onValueChange={(value) => setNewItem({...newItem, machineId: value})}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Select machine" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800">
                    {isLoadingMachines ? (
                      <SelectItem value="loading" disabled>Loading machines...</SelectItem>
                    ) : machines.length === 0 ? (
                      <SelectItem value="none" disabled>No machines available</SelectItem>
                    ) : (
                      machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id || machine.name}>
                          {machine.name} ({machine.type}) {machine.status !== 'Available' && `- ${machine.status}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-muted-foreground">Notes (Optional)</label>
                <Textarea
                  className={inputClass}
                  placeholder="Additional details about the item..."
                  value={newItem.notes}
                  onChange={e => setNewItem({...newItem, notes: e.target.value})}
                />
              </div>
              <Button onClick={handleReportItem} className={`w-full ${buttonClass}`}>
                Report Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-100 dark:bg-slate-800 rounded-t-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-50">Missing Items</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} found
                {statusFilter !== "all" && ` (${statusFilter === "unclaimed" ? unclaimedItems.length : claimedItems.length} ${statusFilter})`}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                <Input
                  placeholder="Search items..."
                  className="pl-8 w-full sm:w-64 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800">
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="unclaimed">Unclaimed Only</SelectItem>
                    <SelectItem value="claimed">Claimed Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700">
                  <TableHead className="text-slate-900 dark:text-slate-100">Item Description</TableHead>
                  <TableHead className="text-slate-900 dark:text-slate-100">Found In Machine</TableHead>
                  <TableHead className="text-slate-900 dark:text-slate-100">Found Date</TableHead>
                  <TableHead className="text-slate-900 dark:text-slate-100">Reported By</TableHead>
                  <TableHead className="text-slate-900 dark:text-slate-100">Status</TableHead>
                  <TableHead className="text-right text-slate-900 dark:text-slate-100">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex items-center justify-center text-slate-600 dark:text-slate-400">
                        <Clock className="h-8 w-8 animate-spin mr-2" />
                        Loading items...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                        <AlertCircle className="h-12 w-12 mb-4 text-slate-400 dark:text-slate-500" />
                        <p className="text-lg font-medium">No missing items found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="border-t border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {item.itemDescription}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300">
                          {item.foundInMachineId}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">
                        {new Date(item.foundDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">
                        {item.foundByStaffId}
                      </TableCell>
                      <TableCell>
                        {item.isClaimed ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 flex items-center gap-1 justify-center">
                            <CheckCircle className="h-3 w-3" /> Claimed
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 flex items-center gap-1 justify-center">
                            <Clock className="h-3 w-3" /> Unclaimed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!item.isClaimed && (
                          <Dialog open={showClaimDialog && selectedItem?.id === item.id} onOpenChange={(open) => {
                            if (!open) setShowClaimDialog(false);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowClaimDialog(true);
                                }}
                                className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Claim
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800">
                              <DialogHeader>
                                <DialogTitle className="text-slate-900 dark:text-slate-50">Claim Item</DialogTitle>
                                <DialogDescription className="text-slate-600 dark:text-slate-400">
                                  Enter the name of the person claiming this item.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-slate-700 dark:text-muted-foreground">Claimant Name</label>
                                  <Input
                                    className={inputClass}
                                    placeholder="Enter full name"
                                    value={claimName}
                                    onChange={e => setClaimName(e.target.value)}
                                  />
                                </div>
                                <Button onClick={handleClaimItem} className={`w-full ${buttonClass}`}>
                                  Mark as Claimed
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-100 dark:bg-slate-800 rounded-t-lg">
          <CardTitle className="text-slate-900 dark:text-slate-50">Machine Usage Today</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            View which machines had missing items reported today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(allItems
              .filter(item => new Date(item.foundDate).toDateString() === new Date().toDateString())
              .map(item => item.foundInMachineId))
            ).map(machineId => {
              const machineItems = allItems.filter(item => 
                item.foundInMachineId === machineId && 
                new Date(item.foundDate).toDateString() === new Date().toDateString()
              );
              
              return (
                <Card key={machineId} className="border border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-slate-900 dark:text-slate-50">Machine {machineId}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {machineItems.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No items reported today</p>
                      ) : (
                        machineItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700 dark:text-slate-300">{item.itemDescription}</span>
                            <Badge 
                              variant={item.isClaimed ? "default" : "outline"}
                              className={item.isClaimed ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"}
                            >
                              {item.isClaimed ? "Claimed" : "Unclaimed"}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MissingItemsPage;