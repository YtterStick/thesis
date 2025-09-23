import React, { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, CheckCircle, AlertCircle, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
const MissingTable = ({
    allItems,
    totalItems,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    unclaimedItems,
    claimedItems,
    showClaimDialog,
    setShowClaimDialog,
    selectedItem,
    setSelectedItem,
    claimName,
    setClaimName,
    handleClaimItem,
    machines,

    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
}) => {
    const [expandedNotes, setExpandedNotes] = useState({});
    const [laundryJobSearchResults, setLaundryJobSearchResults] = useState([]);
    const [isSearchingLaundryJobs, setIsSearchingLaundryJobs] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Add items per page options handler
    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    const searchLaundryJobs = async (name) => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const newTimeout = setTimeout(async () => {
            if (name.length < 2) {
                setLaundryJobSearchResults([]);
                return;
            }

            setIsSearchingLaundryJobs(true);
            try {
                const token = localStorage.getItem("authToken");
                const response = await fetch(`http://localhost:8080/api/laundry-jobs/search-by-customer?customerName=${encodeURIComponent(name)}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setLaundryJobSearchResults(data);
                }
            } catch (error) {
                console.error("Error searching laundry jobs:", error);
            } finally {
                setIsSearchingLaundryJobs(false);
            }
        }, 300);

        setSearchTimeout(newTimeout);
    };

    const getMachineNamesFromJob = (job) => {
        if (!job.loadAssignments) return [];

        const machineIds = job.loadAssignments.map((load) => load.machineId).filter((id) => id !== null);

        return machineIds.map((id) => {
            const machine = machines.find((m) => m.id === id);
            return machine ? machine.name : id;
        });
    };

    const highlightMatch = (text, searchTerm) => {
        if (!searchTerm || !text) return text;

        const regex = new RegExp(`(${searchTerm})`, "gi");
        return text.replace(regex, "<mark>$1</mark>");
    };

    const getMachineName = (machineId) => {
        const machine = machines.find((m) => m.id === machineId);
        return machine ? machine.name : machineId;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString();
    };

    const toggleNoteExpansion = (itemId) => {
        setExpandedNotes((prev) => ({
            ...prev,
            [itemId]: !prev[itemId],
        }));
    };

    const isLongNote = (note) => {
        if (!note) return false;
        return note.length > 10;
    };

    const truncateNote = (note) => {
        if (!note) return "-";
        return note.length > 10 ? `${note.substring(0, 10)}...` : note;
    };

    // REMOVED the filteredItems calculation since it's now done in the parent

    const inputClass =
        "bg-white dark:bg-slate-950 text-slate-700 dark:text-muted-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";
    const buttonClass = "bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-600 text-white";

    return (
        <>
            <CardHeader className="rounded-t-lg bg-slate-100 dark:bg-slate-800">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <CardTitle className="text-slate-900 dark:text-slate-50">Missing Items</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                            {/* Updated to use allItems.length (which is the filtered items count) */}
                            {allItems.length} item{allItems.length !== 1 ? "s" : ""} found
                            {statusFilter !== "all" &&
                                ` (${statusFilter === "unclaimed" ? unclaimedItems.length : claimedItems.length} ${statusFilter})`}
                        </CardDescription>
                    </div>
                    <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <Input
                                placeholder="Search items..."
                                className="w-full border-slate-300 pl-8 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 sm:w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50">
                                    <SelectValue placeholder="Filter status" />
                                </SelectTrigger>
                                <SelectContent className="border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950">
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
                <div className="rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80">
                                <TableHead className="text-slate-900 dark:text-slate-100">Item Description</TableHead>
                                <TableHead className="text-slate-900 dark:text-slate-100">Found In Machine</TableHead>
                                <TableHead className="text-slate-900 dark:text-slate-100">Reported By</TableHead>
                                <TableHead className="text-slate-900 dark:text-slate-100">Found Date</TableHead>
                                <TableHead className="text-slate-900 dark:text-slate-100">Claimed By</TableHead>
                                <TableHead className="text-slate-900 dark:text-slate-100">Claimed Date</TableHead>
                                <TableHead className="text-slate-900 dark:text-slate-100">Notes</TableHead>
                                <TableHead className="text-slate-900 dark:text-slate-100">Status</TableHead>
                                <TableHead className="text-right text-slate-900 dark:text-slate-100">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
                                        className="py-16 text-center"
                                    >
                                        <div className="flex items-center justify-center text-slate-600 dark:text-slate-400">
                                            <Clock className="mr-2 h-8 w-8 animate-spin" />
                                            Loading items...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : allItems.length === 0 ? ( // Changed from filteredItems to allItems
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
                                        className="py-16 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                                            <AlertCircle className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-500" />
                                            <p className="text-lg font-medium">No missing items found</p>
                                            <p className="text-sm">Try adjusting your search or filters</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                allItems.map((item) => {
                                    // Changed from filteredItems to allItems
                                    const machineName = getMachineName(item.machineId);
                                    const isExpanded = expandedNotes[item.id];
                                    const shouldTruncate = isLongNote(item.notes) && !isExpanded;

                                    return (
                                        <TableRow
                                            key={item.id}
                                            className="border-t border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800/50"
                                        >
                                            <TableCell className="font-medium text-slate-900 dark:text-slate-100">{item.itemDescription}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                                                >
                                                    {machineName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-600 dark:text-slate-300">{item.foundByStaffId}</TableCell>
                                            <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(item.foundDate)}</TableCell>
                                            <TableCell className="text-slate-600 dark:text-slate-300">{item.claimedByName || "-"}</TableCell>
                                            <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(item.claimDate)}</TableCell>
                                            <TableCell className="max-w-xs text-slate-600 dark:text-slate-300">
                                                <div className="flex items-start gap-1">
                                                    <div className="flex-1">{shouldTruncate ? truncateNote(item.notes) : item.notes || "-"}</div>
                                                    {isLongNote(item.notes) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => toggleNoteExpansion(item.id)}
                                                            title={isExpanded ? "Show less" : "Show more"}
                                                        >
                                                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                        </Button>
                                                    )}
                                                </div>
                                                {isLongNote(item.notes) && !isExpanded && (
                                                    <div
                                                        className="mt-1 cursor-pointer text-xs text-blue-500"
                                                        onClick={() => toggleNoteExpansion(item.id)}
                                                    >
                                                        View more
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.claimed ? (
                                                    <Badge className="flex items-center justify-center gap-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                        <CheckCircle className="h-3 w-3" /> Claimed
                                                    </Badge>
                                                ) : (
                                                    <Badge className="flex items-center justify-center gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                                                        <Clock className="h-3 w-3" /> Unclaimed
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!item.claimed && (
                                                    <Dialog
                                                        open={showClaimDialog && selectedItem?.id === item.id}
                                                        onOpenChange={(open) => {
                                                            if (!open) {
                                                                setShowClaimDialog(false);
                                                                setLaundryJobSearchResults([]);
                                                            }
                                                        }}
                                                    >
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedItem(item);
                                                                    setShowClaimDialog(true);
                                                                    setLaundryJobSearchResults([]);
                                                                    setClaimName("");
                                                                }}
                                                                className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                                                            >
                                                                <CheckCircle className="mr-1 h-4 w-4" />
                                                                Claim
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950">
                                                            <DialogHeader>
                                                                <DialogTitle className="text-slate-900 dark:text-slate-50">Claim Item</DialogTitle>
                                                                <DialogDescription className="text-slate-600 dark:text-slate-400">
                                                                    Enter the name of the person claiming this item. Matching laundry jobs will appear
                                                                    below.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="text-sm font-medium text-slate-700 dark:text-muted-foreground">
                                                                        Claimant Name
                                                                    </label>
                                                                    <Input
                                                                        className={inputClass}
                                                                        placeholder="Enter full name"
                                                                        value={claimName}
                                                                        onChange={(e) => {
                                                                            setClaimName(e.target.value);
                                                                            searchLaundryJobs(e.target.value);
                                                                        }}
                                                                    />
                                                                </div>

                                                                {/* Laundry job search results */}
                                                                {isSearchingLaundryJobs && (
                                                                    <div className="flex items-center text-sm text-slate-500">
                                                                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                                                                        Searching laundry jobs...
                                                                    </div>
                                                                )}

                                                                {laundryJobSearchResults.length > 0 && (
                                                                    <div className="mt-4">
                                                                        <h4 className="mb-2 text-sm font-medium">
                                                                            Matching Laundry Jobs ({laundryJobSearchResults.length}):
                                                                        </h4>
                                                                        <div className="max-h-60 divide-y overflow-y-auto rounded-md border">
                                                                            {laundryJobSearchResults.map((job) => {
                                                                                const machineNames = getMachineNamesFromJob(job);
                                                                                // Case-sensitive exact match
                                                                                const isExactMatch = job.customerName === claimName;

                                                                                return (
                                                                                    <div
                                                                                        key={job.id}
                                                                                        className={`p-3 text-sm ${isExactMatch ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                                                                                    >
                                                                                        <div
                                                                                            className="font-medium"
                                                                                            dangerouslySetInnerHTML={{
                                                                                                __html: highlightMatch(job.customerName, claimName),
                                                                                            }}
                                                                                        />
                                                                                        <div>Transaction ID: {job.transactionId}</div>
                                                                                        <div>Service Type: {job.serviceType}</div>
                                                                                        <div>
                                                                                            Machines:{" "}
                                                                                            {machineNames.length > 0
                                                                                                ? machineNames.join(", ")
                                                                                                : "No machine info"}
                                                                                        </div>
                                                                                        <div>
                                                                                            Pickup Status:
                                                                                            <span
                                                                                                className={
                                                                                                    job.pickupStatus === "CLAIMED"
                                                                                                        ? "ml-1 text-green-600"
                                                                                                        : "ml-1 text-orange-600"
                                                                                                }
                                                                                            >
                                                                                                {job.pickupStatus}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div>
                                                                                            Claim Date:{" "}
                                                                                            {job.pickupStatus === "CLAIMED"
                                                                                                ? job.claimDate
                                                                                                    ? new Date(job.claimDate).toLocaleDateString()
                                                                                                    : "N/A"
                                                                                                : "Not claimed"}
                                                                                        </div>
                                                                                        {isExactMatch && (
                                                                                            <div className="mt-1 flex items-center font-semibold text-blue-600">
                                                                                                <CheckCircle className="mr-1 h-4 w-4" />
                                                                                                Exact name match
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <Button
                                                                    onClick={handleClaimItem}
                                                                    className={`w-full ${buttonClass}`}
                                                                    disabled={!claimName.trim()}
                                                                >
                                                                    Mark as Claimed
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                {totalItems > 0 && (
                    <div className="flex items-center justify-between border-t border-slate-300 px-4 py-3 dark:border-slate-700">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Items per page:</span>
                                <Select
                                    value={itemsPerPage.toString()}
                                    onValueChange={handleItemsPerPageChange}
                                >
                                    <SelectTrigger className="h-8 w-16">
                                        <SelectValue placeholder={itemsPerPage} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5</SelectItem>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    className="h-8 px-2"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="h-8 px-2"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </>
    );
};

export default MissingTable;
