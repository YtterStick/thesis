import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { motion } from "framer-motion";

const MissingForm = ({ 
    showReportDialog, 
    setShowReportDialog, 
    newItem, 
    setNewItem, 
    machines, 
    isLoadingMachines, 
    handleReportItem,
    isDarkMode 
}) => {
    const inputClass = `rounded-lg border-2 transition-all ${
        isDarkMode 
            ? "bg-white text-slate-900 border-slate-300 focus:border-cyan-500" 
            : "bg-white text-slate-900 border-slate-300 focus:border-cyan-500"
    }`;
    
    const selectTriggerClass = `rounded-lg border-2 transition-all ${
        isDarkMode 
            ? "bg-white text-slate-900 border-slate-300 focus:border-cyan-500" 
            : "bg-white text-slate-900 border-slate-300 focus:border-cyan-500"
    }`;

    const sortedMachines = [...machines].sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === "Washer" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    const handleNotesChange = (e) => {
        const value = e.target.value;
        if (value.length <= 30) {
            setNewItem({ ...newItem, notes: value });
        }
    };

    return (
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
            <DialogTrigger asChild>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button 
                        className="rounded-lg transition-all flex items-center gap-2"
                        style={{
                            backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                            color: "#F3EDE3",
                        }}
                    >
                        <Plus className="h-4 w-4" />
                        Report Missing Item
                    </Button>
                </motion.div>
            </DialogTrigger>
            <DialogContent 
                className="rounded-xl border-2 p-6"
                style={{
                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                }}
            >
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                        Report Missing Item
                    </DialogTitle>
                    <DialogDescription className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                        Enter details about the item found in the machine.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                            Item Description *
                        </label>
                        <Input
                            className={inputClass}
                            placeholder="e.g., Blue shirt, Black socks, etc."
                            value={newItem.itemDescription}
                            onChange={(e) => setNewItem({ ...newItem, itemDescription: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                            Machine Found In (Optional)
                        </label>
                        <Select
                            value={newItem.machineId}
                            onValueChange={(value) => setNewItem({ ...newItem, machineId: value === "none" ? "" : value })}
                        >
                            <SelectTrigger className={selectTriggerClass}>
                                <SelectValue placeholder="Select machine (optional)" />
                            </SelectTrigger>
                            <SelectContent 
                                className="rounded-lg border-2"
                                style={{
                                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                }}
                            >
                                <SelectItem value="none">Not associated with a machine</SelectItem>
                                {isLoadingMachines ? (
                                    <SelectItem value="loading" disabled>
                                        Loading machines...
                                    </SelectItem>
                                ) : machines.length === 0 ? (
                                    <SelectItem value="no-machines" disabled>
                                        No machines available
                                    </SelectItem>
                                ) : (
                                    sortedMachines.map((machine) => (
                                        <SelectItem key={machine.id} value={machine.id}>
                                            {machine.name} ({machine.type}) {machine.status !== "Available" && `- ${machine.status}`}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                                Notes (Optional)
                            </label>
                            <span className="text-xs" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>
                                {newItem.notes?.length || 0}/30 characters
                            </span>
                        </div>
                        <Textarea
                            className={inputClass}
                            placeholder="Additional details about the item (max 30 characters)..."
                            value={newItem.notes}
                            onChange={handleNotesChange}
                            maxLength={30}
                        />
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={handleReportItem}
                            className="w-full rounded-lg transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                                color: "#F3EDE3",
                            }}
                        >
                            Report Item
                        </Button>
                    </motion.div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MissingForm;