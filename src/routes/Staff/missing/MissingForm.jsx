import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const MissingForm = ({
  showReportDialog,
  setShowReportDialog,
  newItem,
  setNewItem,
  machines,
  isLoadingMachines,
  handleReportItem
}) => {
  const inputClass = "bg-white dark:bg-slate-950 text-slate-700 dark:text-muted-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";
  const selectTriggerClass = "bg-white dark:bg-slate-950 text-slate-700 dark:text-muted-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";
  const buttonClass = "bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-600 text-white";

  // Sort machines by type (Washer first, then Dryer) and then by name
  const sortedMachines = [...machines].sort((a, b) => {
    // First sort by type (Washer comes before Dryer)
    if (a.type !== b.type) {
      return a.type === "Washer" ? -1 : 1;
    }
    // Then sort by name
    return a.name.localeCompare(b.name);
  });

  // Handle notes input change with character limit
  const handleNotesChange = (e) => {
    const value = e.target.value;
    if (value.length <= 30) {
      setNewItem({...newItem, notes: value});
    }
  };

  return (
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
                  sortedMachines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name} ({machine.type}) {machine.status !== 'Available' && `- ${machine.status}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700 dark:text-muted-foreground">Notes (Optional)</label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
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
          <Button onClick={handleReportItem} className={`w-full ${buttonClass}`}>
            Report Item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MissingForm;