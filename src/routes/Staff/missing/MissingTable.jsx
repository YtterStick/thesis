import React, { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, CheckCircle, AlertCircle, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, RefreshCw, Calendar, User, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-config"; // Import the api utility

// Skeleton Loader Components
const SkeletonRow = ({ isDarkMode }) => (
    <TableRow 
        className="border-t transition-all"
        style={{
            borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
        }}
    >
        <TableCell className="py-4">
            <div className="flex items-center">
                <div 
                    className="skeleton h-4 w-4 rounded mr-2"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                    }}
                ></div>
                <div 
                    className="skeleton h-4 w-32 rounded"
                    style={{
                        backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                    }}
                ></div>
            </div>
        </TableCell>
        <TableCell>
            <div 
                className="skeleton h-4 w-24 rounded"
                style={{
                    backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                }}
            ></div>
        </TableCell>
        <TableCell>
            <div 
                className="skeleton h-4 w-20 rounded"
                style={{
                    backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                }}
            ></div>
        </TableCell>
        <TableCell>
            <div 
                className="skeleton h-4 w-28 rounded"
                style={{
                    backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                }}
            ></div>
        </TableCell>
        <TableCell>
            <div 
                className="skeleton h-4 w-20 rounded"
                style={{
                    backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                }}
            ></div>
        </TableCell>
        <TableCell>
            <div 
                className="skeleton h-4 w-28 rounded"
                style={{
                    backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                }}
            ></div>
        </TableCell>
        <TableCell>
            <div 
                className="skeleton h-4 w-20 rounded"
                style={{
                    backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                }}
            ></div>
        </TableCell>
        <TableCell>
            <div 
                className="skeleton h-6 w-24 rounded-full"
                style={{
                    backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                }}
            ></div>
        </TableCell>
        <TableCell>
            <div 
                className="skeleton h-8 w-full rounded"
                style={{
                    backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                }}
            ></div>
        </TableCell>
    </TableRow>
);

// View Details Modal Component
const ViewDetailsModal = ({ item, isOpen, onClose, machines, isDarkMode }) => {
    const getMachineName = (machineId) => {
        const machine = machines.find((m) => m.id === machineId);
        return machine ? machine.name : machineId;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Not available";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!item) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl rounded-xl border-2 p-6 shadow-xl transition-all"
                        style={{
                            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                    Item Details
                                </h2>
                                <p className="text-sm mt-1" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                    Complete information about this missing item
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="rounded-lg p-1 transition-colors hover:opacity-80"
                                style={{
                                    backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                                }}
                            >
                                <X className="w-5 h-5" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }} />
                            </motion.button>
                        </div>

                        {/* Content */}
                        <div className="space-y-6">
                            {/* Status Badge */}
                            <div className="flex justify-center">
                                {item.claimed ? (
                                    <Badge 
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base"
                                        style={{
                                            backgroundColor: '#F0FDF4',
                                            color: '#059669',
                                        }}
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Claimed
                                    </Badge>
                                ) : (
                                    <Badge 
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base"
                                        style={{
                                            backgroundColor: '#FFFBEB',
                                            color: '#D97706',
                                        }}
                                    >
                                        <Clock className="h-4 w-4" />
                                        Unclaimed
                                    </Badge>
                                )}
                            </div>

                            {/* Item Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                            <FileText className="inline w-4 h-4 mr-2" />
                                            Item Description
                                        </label>
                                        <div className="p-3 rounded-lg border-2" style={{ 
                                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                            backgroundColor: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(243, 237, 227, 0.5)",
                                            color: isDarkMode ? '#13151B' : '#0B2B26'
                                        }}>
                                            {item.itemDescription}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                            <User className="inline w-4 h-4 mr-2" />
                                            Reported By
                                        </label>
                                        <div className="p-3 rounded-lg border-2" style={{ 
                                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                            backgroundColor: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(243, 237, 227, 0.5)",
                                            color: isDarkMode ? '#13151B' : '#0B2B26'
                                        }}>
                                            {item.foundByStaffId || "Not specified"}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                            <Calendar className="inline w-4 h-4 mr-2" />
                                            Found Date
                                        </label>
                                        <div className="p-3 rounded-lg border-2" style={{ 
                                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                            backgroundColor: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(243, 237, 227, 0.5)",
                                            color: isDarkMode ? '#13151B' : '#0B2B26'
                                        }}>
                                            {formatDate(item.foundDate)}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                            Found In Machine
                                        </label>
                                        <div className="p-3 rounded-lg border-2" style={{ 
                                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                            backgroundColor: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(243, 237, 227, 0.5)",
                                            color: isDarkMode ? '#13151B' : '#0B2B26'
                                        }}>
                                            {getMachineName(item.machineId) || "Not associated with a machine"}
                                        </div>
                                    </div>

                                    {item.claimed && (
                                        <>
                                            <div>
                                                <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                                    <User className="inline w-4 h-4 mr-2" />
                                                    Claimed By
                                                </label>
                                                <div className="p-3 rounded-lg border-2" style={{ 
                                                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(243, 237, 227, 0.5)",
                                                    color: isDarkMode ? '#13151B' : '#0B2B26'
                                                }}>
                                                    {item.claimedByName}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                                    <Calendar className="inline w-4 h-4 mr-2" />
                                                    Claimed Date
                                                </label>
                                                <div className="p-3 rounded-lg border-2" style={{ 
                                                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(243, 237, 227, 0.5)",
                                                    color: isDarkMode ? '#13151B' : '#0B2B26'
                                                }}>
                                                    {formatDate(item.claimDate)}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                    Additional Notes
                                </label>
                                <div className="p-3 rounded-lg border-2 min-h-20" style={{ 
                                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(243, 237, 227, 0.5)",
                                    color: isDarkMode ? '#13151B' : '#0B2B26'
                                }}>
                                    {item.notes || "No additional notes provided"}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: isDarkMode ? "#2A524C" : "#0B2B26" }}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                                style={{
                                    backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                                    color: isDarkMode ? '#13151B' : '#0B2B26',
                                }}
                            >
                                Close
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

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
    isDarkMode,
    onRefresh,
    hasUnfilteredData,
}) => {
    const [expandedNotes, setExpandedNotes] = useState({});
    const [laundryJobSearchResults, setLaundryJobSearchResults] = useState([]);
    const [isSearchingLaundryJobs, setIsSearchingLaundryJobs] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedViewItem, setSelectedViewItem] = useState(null);

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

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
    };

    const handleViewDetails = (item) => {
        setSelectedViewItem(item);
        setViewModalOpen(true);
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
                // Use the api utility instead of direct fetch
                const data = await api.get(`api/laundry-jobs/search-by-customer?customerName=${encodeURIComponent(name)}`);
                setLaundryJobSearchResults(data);
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
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    const inputClass = `rounded-lg border-2 transition-all ${
        isDarkMode 
            ? "bg-white text-slate-900 border-slate-300 focus:border-cyan-500" 
            : "bg-white text-slate-900 border-slate-300 focus:border-cyan-500"
    }`;

    if (isLoading) {
        return (
            <div 
                className="rounded-lg border-2 shadow-sm"
                style={{
                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                }}
            >
                <Table>
                    <TableHeader>
                        <TableRow 
                            className="border-b"
                            style={{
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                            }}
                        >
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Item Description</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Found In Machine</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Reported By</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Found Date</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Claimed By</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Claimed Date</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Notes</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Status</TableHead>
                            <TableHead className="text-right" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: itemsPerPage }).map((_, index) => (
                            <SkeletonRow key={index} isDarkMode={isDarkMode} />
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

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    return (
        <>
            <div 
                className="rounded-lg border-2 shadow-sm"
                style={{
                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                }}
            >
                <Table>
                    <TableHeader>
                        <TableRow 
                            className="border-b"
                            style={{
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                            }}
                        >
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Item Description</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Found In Machine</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Reported By</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Found Date</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Claimed By</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Claimed Date</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Notes</TableHead>
                            <TableHead style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Status</TableHead>
                            <TableHead className="text-right" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allItems.length === 0 && !hasUnfilteredData ? (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    className="py-16 text-center"
                                >
                                    <div className="flex flex-col items-center justify-center" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                        <CheckCircle className="mb-4 h-12 w-12" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/50' }} />
                                        <p className="text-lg font-medium">
                                            No missing items found
                                        </p>
                                        <p className="text-sm">
                                            All items have been claimed or no items reported yet
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : allItems.length === 0 && hasUnfilteredData ? (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    className="py-16 text-center"
                                >
                                    <div className="flex flex-col items-center justify-center" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                        <Search className="mb-4 h-12 w-12" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/50' }} />
                                        <p className="text-lg font-medium">No matching items found</p>
                                        <p className="text-sm">Try adjusting your search or filter criteria</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            allItems.map((item) => {
                                const machineName = getMachineName(item.machineId);
                                const isExpanded = expandedNotes[item.id];
                                const shouldTruncate = isLongNote(item.notes) && !isExpanded;

                                return (
                                    <TableRow
                                        key={item.id}
                                        className={`border-t transition-all hover:opacity-90 ${
                                            item.claimed ? "bg-green-50 dark:bg-green-950/20" : ""
                                        }`}
                                        style={{
                                            borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                        }}
                                    >
                                        <TableCell className="font-medium" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                            {item.itemDescription}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="rounded-lg border-2 capitalize transition-all"
                                                style={{
                                                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                                    color: isDarkMode ? '#13151B' : '#0B2B26',
                                                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(243, 237, 227, 0.9)",
                                                }}
                                            >
                                                {machineName}
                                            </Badge>
                                        </TableCell>
                                        <TableCell style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                            {item.foundByStaffId}
                                        </TableCell>
                                        <TableCell style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                            {formatDate(item.foundDate)}
                                        </TableCell>
                                        <TableCell style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                            {item.claimedByName || "-"}
                                        </TableCell>
                                        <TableCell style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                            {item.claimed ? formatDate(item.claimDate) : "-"}
                                        </TableCell>
                                        <TableCell className="max-w-xs" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
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
                                                <Badge 
                                                    className="flex w-24 items-center justify-center gap-1 rounded-lg transition-all"
                                                    style={{
                                                        backgroundColor: '#F0FDF4',
                                                        color: '#059669',
                                                    }}
                                                >
                                                    <CheckCircle className="h-3 w-3" /> Claimed
                                                </Badge>
                                            ) : (
                                                <Badge 
                                                    className="flex w-24 items-center justify-center gap-1 rounded-lg transition-all"
                                                    style={{
                                                        backgroundColor: '#FFFBEB',
                                                        color: '#D97706',
                                                    }}
                                                >
                                                    <Clock className="h-3 w-3" /> Unclaimed
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {!item.claimed ? (
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
                                                            <motion.div
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                            >
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedItem(item);
                                                                        setShowClaimDialog(true);
                                                                        setLaundryJobSearchResults([]);
                                                                        setClaimName("");
                                                                    }}
                                                                    className="rounded-lg transition-all"
                                                                    style={{
                                                                        backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                                                        color: "#F3EDE3",
                                                                    }}
                                                                >
                                                                    <CheckCircle className="mr-1 h-4 w-4" />
                                                                    Claim
                                                                </Button>
                                                            </motion.div>
                                                        </DialogTrigger>
                                                        <DialogContent 
                                                            className="max-w-2xl rounded-xl border-2 p-6"
                                                            style={{
                                                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                                            }}
                                                        >
                                                            <DialogHeader>
                                                                <DialogTitle className="text-lg font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                                    Claim Item
                                                                </DialogTitle>
                                                                <DialogDescription className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                                                    Enter the name of the person claiming this item. Matching laundry jobs will appear below.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
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

                                                                {isSearchingLaundryJobs && (
                                                                    <div className="flex items-center text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                                                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                                                                        Searching laundry jobs...
                                                                    </div>
                                                                )}

                                                                {laundryJobSearchResults.length > 0 && (
                                                                    <div className="mt-4">
                                                                        <h4 className="mb-2 text-sm font-medium" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                                                            Matching Laundry Jobs ({laundryJobSearchResults.length}):
                                                                        </h4>
                                                                        <div 
                                                                            className="max-h-60 divide-y overflow-y-auto rounded-lg border-2"
                                                                            style={{
                                                                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                                                            }}
                                                                        >
                                                                            {laundryJobSearchResults.map((job) => {
                                                                                const machineNames = getMachineNamesFromJob(job);
                                                                                const isExactMatch = job.customerName === claimName;

                                                                                return (
                                                                                    <div
                                                                                        key={job.id}
                                                                                        className={`p-3 text-sm ${
                                                                                            isExactMatch ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                                                                        }`}
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

                                                                <motion.div
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                >
                                                                    <Button
                                                                        onClick={handleClaimItem}
                                                                        className="w-full rounded-lg transition-all"
                                                                        disabled={!claimName.trim()}
                                                                        style={{
                                                                            backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                                                            color: "#F3EDE3",
                                                                        }}
                                                                    >
                                                                        Mark as Claimed
                                                                    </Button>
                                                                </motion.div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                ) : (
                                                    <motion.div
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleViewDetails(item)}
                                                            className="rounded-lg border-2 transition-all"
                                                            style={{
                                                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                                                color: isDarkMode ? '#13151B' : '#0B2B26',
                                                                backgroundColor: isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(243, 237, 227, 0.9)",
                                                            }}
                                                        >
                                                            <Eye className="mr-1 h-4 w-4" />
                                                            View
                                                        </Button>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                {!isLoading && allItems.length > 0 && (
                    <div 
                        className="flex flex-col items-center justify-between border-t p-4 sm:flex-row"
                        style={{
                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                        }}
                    >
                        <div className="mb-4 flex items-center space-x-2 sm:mb-0">
                            <p className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>Rows per page</p>
                            <select
                                className="h-8 w-16 rounded-lg border-2 text-sm transition-all"
                                style={{
                                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                    backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                    color: isDarkMode ? '#13151B' : '#0B2B26',
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
                            <div className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                {startIndex + 1}-{endIndex} of {totalItems}
                            </div>

                            <div className="flex space-x-1">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all ${
                                        currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    style={{
                                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                        backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                        color: isDarkMode ? '#13151B' : '#0B2B26',
                                    }}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all ${
                                        currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    style={{
                                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                        backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                        color: isDarkMode ? '#13151B' : '#0B2B26',
                                    }}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all ${
                                        currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    style={{
                                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                        backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                        color: isDarkMode ? '#13151B' : '#0B2B26',
                                    }}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all ${
                                        currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    style={{
                                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                        backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                        color: isDarkMode ? '#13151B' : '#0B2B26',
                                    }}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            <ViewDetailsModal
                item={selectedViewItem}
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                machines={machines}
                isDarkMode={isDarkMode}
            />
        </>
    );
};

export default MissingTable;