import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import MissingForm from "./MissingForm";
import MissingTable from "./MissingTable";

const MissingItemsPage = () => {
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
                `http://localhost:8080/api/missing-items?t=${new Date().getTime()}`, // Add timestamp to prevent caching
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    cache: "no-cache", // Explicitly disable caching
                },
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
            const response = await fetch("http://localhost:8080/api/machines", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
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
            if (!newItem.itemDescription || !newItem.machineId) {
                toast({
                    title: "Error",
                    description: "Please fill in all required fields",
                    variant: "destructive",
                });
                return;
            }

            const token = localStorage.getItem("authToken");
            const response = await fetch("http://localhost:8080/api/missing-items", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newItem),
            });

            if (!response.ok) throw new Error("Failed to report missing item");

            toast({
                title: "Success",
                description: "Missing item reported successfully",
            });

            setShowReportDialog(false);
            setNewItem({ itemDescription: "", machineId: "", notes: "" });
            // Refresh the items list after reporting
            fetchMissingItems();
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to report missing item", variant: "destructive" });
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

            const token = localStorage.getItem("authToken");
            const response = await fetch(`http://localhost:8080/api/missing-items/${selectedItem.id}/claim`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ claimedByName: claimName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to claim item");
            }

            const updatedItem = await response.json();
            console.log("Updated item from backend:", updatedItem);

            toast({
                title: "Success",
                description: "Item claimed successfully",
            });

            setShowClaimDialog(false);
            setClaimName("");
            setSelectedItem(null);

            // Update the UI with the data returned from the backend
            setAllItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === selectedItem.id ? { ...item, claimed: true, claimedByName: claimName, claimDate: new Date().toISOString() } : item,
                ),
            );
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: error.message || "Failed to claim item", variant: "destructive" });
        }
    };

    const unclaimedItems = allItems.filter((item) => !item.claimed);
    const claimedItems = allItems.filter((item) => item.claimed);

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Missing Items</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Track and manage lost and found items</p>
                </div>

                <MissingForm
                    showReportDialog={showReportDialog}
                    setShowReportDialog={setShowReportDialog}
                    newItem={newItem}
                    setNewItem={setNewItem}
                    machines={machines}
                    isLoadingMachines={isLoadingMachines}
                    handleReportItem={handleReportItem}
                />
            </div>

            <Card className="border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                <MissingTable
                    allItems={allItems}
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
                />
            </Card>
        </div>
    );
};

export default MissingItemsPage;
