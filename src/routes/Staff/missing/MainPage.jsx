import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import MissingForm from "./MissingForm";
import MissingTable from "./MissingTable";
import { api } from "@/lib/api-config"; // Import the api utility

const MissingItemsPage = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    const [allItems, setAllItems] = useState([]);
    const [machines, setMachines] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMachines, setIsLoadingMachines] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [showClaimDialog, setShowClaimDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [newItem, setNewItem] = useState({
        itemDescription: "",
        machineId: "",
        notes: "",
    });
    const [claimName, setClaimName] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    
    // Get items per page from localStorage or default to 10
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const saved = localStorage.getItem('missingItemsPerPage');
        return saved ? parseInt(saved) : 10;
    });
    
    const { toast } = useToast();

    useEffect(() => {
        fetchMissingItems();
        fetchMachines();
    }, []);

    // Save items per page to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('missingItemsPerPage', itemsPerPage.toString());
    }, [itemsPerPage]);

    const fetchMissingItems = async () => {
        try {
            setIsLoading(true);
            // Use the api utility instead of direct fetch
            const data = await api.get("api/missing-items");
            
            // Sort by found date (newest first)
            const sortedData = data.sort((a, b) => {
                const dateA = new Date(a.foundDate || a.createdAt || 0);
                const dateB = new Date(b.foundDate || b.createdAt || 0);
                return dateB - dateA; // Newest first
            });
            
            setAllItems(sortedData);
        } catch (error) {
            console.error(error);
            toast({ 
                title: "Error", 
                description: "Failed to load missing items", 
                variant: "destructive" 
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMachines = async () => {
        try {
            setIsLoadingMachines(true);
            // Use the api utility instead of direct fetch
            const data = await api.get("api/machines");
            setMachines(data);
        } catch (error) {
            console.error(error);
            toast({ 
                title: "Error", 
                description: "Failed to load machines", 
                variant: "destructive" 
            });
        } finally {
            setIsLoadingMachines(false);
        }
    };

    const handleReportItem = async () => {
        try {
            if (!newItem.itemDescription) {
                toast({
                    title: "Error",
                    description: "Please provide an item description",
                    variant: "destructive",
                });
                return;
            }

            // Use the api utility instead of direct fetch
            await api.post("api/missing-items", newItem);

            toast({
                title: "Success",
                description: "Missing item reported successfully",
            });

            setShowReportDialog(false);
            setNewItem({ itemDescription: "", machineId: "", notes: "" });
            fetchMissingItems();
        } catch (error) {
            console.error(error);
            toast({ 
                title: "Error", 
                description: "Failed to report missing item", 
                variant: "destructive" 
            });
        }
    };

    const handleClaimItem = async () => {
        try {
            if (!claimName) {
                toast({
                    title: "Error",
                    description: "Please enter claimant name",
                    variant: "destructive",
                });
                return;
            }

            // Use the api utility instead of direct fetch
            await api.patch(`api/missing-items/${selectedItem.id}/claim`, { claimedByName: claimName });

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
            toast({ 
                title: "Error", 
                description: error.message || "Failed to claim item", 
                variant: "destructive" 
            });
        }
    };

    // Filter items based on search and status
    const getFilteredItems = () => {
        return allItems.filter((item) => {
            const machineName = getMachineName(item.machineId);
            const matchesSearch =
                item.itemDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus =
                statusFilter === "all" || 
                (statusFilter === "unclaimed" && !item.claimed) || 
                (statusFilter === "claimed" && item.claimed);

            return matchesSearch && matchesStatus;
        });
    };

    const getMachineName = (machineId) => {
        const machine = machines.find((m) => m.id === machineId);
        return machine ? machine.name : machineId;
    };

    const filteredItems = getFilteredItems();

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const unclaimedItems = allItems.filter((item) => !item.claimed);
    const claimedItems = allItems.filter((item) => item.claimed);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const refreshData = () => {
        fetchMissingItems();
    };

    return (
        <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-3"
            >
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="rounded-lg p-2"
                    style={{
                        backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                        color: "#F3EDE3",
                    }}
                >
                    <Package size={22} />
                </motion.div>
                <div>
                    <p className="text-xl font-bold" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
                        Missing Items
                    </p>
                    <p className="text-sm" style={{ color: isDarkMode ? '#F3EDE3/70' : '#0B2B26/70' }}>
                        Track and manage lost and found items
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card 
                    className="rounded-xl border-2 transition-all"
                    style={{
                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    }}
                >
                    <CardHeader 
                        className="rounded-t-xl p-6"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                        }}
                    >
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <CardTitle 
                                    className="text-lg font-bold"
                                    style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
                                >
                                    Missing Items
                                </CardTitle>
                                <CardDescription 
                                    className="text-sm"
                                    style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}
                                >
                                    {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} found
                                </CardDescription>
                            </div>
                            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
                                <div className="flex space-x-2">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                            statusFilter === "all"
                                                ? "text-white"
                                                : isDarkMode ? "text-slate-100" : "text-slate-700"
                                        }`}
                                        style={{
                                            backgroundColor: statusFilter === "all" 
                                                ? (isDarkMode ? "#18442AF5" : "#0B2B26")
                                                : (isDarkMode ? "rgba(42, 82, 76, 0.2)" : "rgba(11, 43, 38, 0.1)"),
                                        }}
                                        onClick={() => setStatusFilter("all")}
                                    >
                                        All ({allItems.length})
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                            statusFilter === "unclaimed"
                                                ? "text-white"
                                                : isDarkMode ? "text-slate-100" : "text-slate-700"
                                        }`}
                                        style={{
                                            backgroundColor: statusFilter === "unclaimed" 
                                                ? (isDarkMode ? "#18442AF5" : "#0B2B26")
                                                : (isDarkMode ? "rgba(42, 82, 76, 0.2)" : "rgba(11, 43, 38, 0.1)"),
                                        }}
                                        onClick={() => setStatusFilter("unclaimed")}
                                    >
                                        Unclaimed ({unclaimedItems.length})
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                            statusFilter === "claimed"
                                                ? "text-white"
                                                : isDarkMode ? "text-slate-100" : "text-slate-700"
                                        }`}
                                        style={{
                                            backgroundColor: statusFilter === "claimed" 
                                                ? (isDarkMode ? "#18442AF5" : "#0B2B26")
                                                : (isDarkMode ? "rgba(42, 82, 76, 0.2)" : "rgba(11, 43, 38, 0.1)"),
                                        }}
                                        onClick={() => setStatusFilter("claimed")}
                                    >
                                        Claimed ({claimedItems.length})
                                    </motion.button>
                                </div>
                                <div className="relative">
                                    <Search 
                                        className="absolute left-2 top-2.5 h-4 w-4" 
                                        style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}
                                    />
                                    <Input
                                        placeholder="Search items..."
                                        className="w-full border-2 pl-8 transition-all sm:w-64"
                                        style={{
                                            backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                                            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                            color: isDarkMode ? '#13151B' : '#0B2B26',
                                        }}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <MissingForm
                                    showReportDialog={showReportDialog}
                                    setShowReportDialog={setShowReportDialog}
                                    newItem={newItem}
                                    setNewItem={setNewItem}
                                    machines={machines}
                                    isLoadingMachines={isLoadingMachines}
                                    handleReportItem={handleReportItem}
                                    isDarkMode={isDarkMode}
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <MissingTable
                            allItems={currentItems}
                            totalItems={filteredItems.length}
                            isLoading={isLoading}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                            unclaimedItems={unclaimedItems}
                            claimedItems={claimedItems}
                            showClaimDialog={showClaimDialog}
                            setShowClaimDialog={setShowClaimDialog}
                            selectedItem={selectedItem}
                            setSelectedItem={setSelectedItem}
                            claimName={claimName}
                            setClaimName={setClaimName}
                            handleClaimItem={handleClaimItem}
                            machines={machines}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            setItemsPerPage={setItemsPerPage}
                            totalPages={totalPages}
                            isDarkMode={isDarkMode}
                            onRefresh={refreshData}
                            hasUnfilteredData={allItems.length > 0}
                        />
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default MissingItemsPage;