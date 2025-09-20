import React, { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, CheckCircle, AlertCircle, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const MissingTable = ({
    allItems,
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
}) => {
    const [expandedNotes, setExpandedNotes] = useState({});

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

    const filteredItems = allItems.filter((item) => {
        const machineName = getMachineName(item.machineId);
        const matchesSearch =
            item.itemDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus =
            statusFilter === "all" || (statusFilter === "unclaimed" && !item.claimed) || (statusFilter === "claimed" && item.claimed);

        return matchesSearch && matchesStatus;
    });

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
                            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} found
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
                            ) : filteredItems.length === 0 ? (
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
                                filteredItems.map((item) => {
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
                                                            if (!open) setShowClaimDialog(false);
                                                        }}
                                                    >
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
                                                                <CheckCircle className="mr-1 h-4 w-4" />
                                                                Claim
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950">
                                                            <DialogHeader>
                                                                <DialogTitle className="text-slate-900 dark:text-slate-50">Claim Item</DialogTitle>
                                                                <DialogDescription className="text-slate-600 dark:text-slate-400">
                                                                    Enter the name of the person claiming this item.
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
                                                                        onChange={(e) => setClaimName(e.target.value)}
                                                                    />
                                                                </div>
                                                                <Button
                                                                    onClick={handleClaimItem}
                                                                    className={`w-full ${buttonClass}`}
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
            </CardContent>
        </>
    );
};

export default MissingTable;
