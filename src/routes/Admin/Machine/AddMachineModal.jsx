import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PlusCircle, Save } from "lucide-react";

export default function AddMachineModal({ open, setOpen, form, setForm, onSubmit }) {
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const statusColorMap = {
    Available: "text-green-600 dark:text-green-400",
    "In Use": "text-yellow-600 dark:text-yellow-400",
    Maintenance: "text-red-600 dark:text-red-400",
  };

  const isEdit = form.name || form.type || form.capacityKg;

  const inputClass =
    "bg-white dark:bg-slate-950 text-slate-700 dark:text-muted-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

  const selectTriggerClass =
    "bg-white dark:bg-slate-950 text-slate-700 dark:text-muted-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

  const buttonClass =
    "bg-[#0891B2] hover:bg-[#0E7490] text-white rounded-md px-4 py-2 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Machine
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-md text-slate-900 dark:text-white">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Machine" : "Add New Machine"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Machine Type */}
          <div>
            <Label className="text-slate-700 dark:text-muted-foreground">Machine Type</Label>
            <Select value={form.type} onValueChange={(val) => handleChange("type", val)}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white">
                <SelectItem value="Washer">Washer</SelectItem>
                <SelectItem value="Dryer">Dryer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Machine Name */}
          <div>
            <Label className="text-slate-700 dark:text-muted-foreground">Machine Name</Label>
            <Input
              className={inputClass}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Washer #3"
            />
          </div>

          {/* Capacity */}
          <div>
            <Label className="text-slate-700 dark:text-muted-foreground">Capacity (kg)</Label>
            <Input
              type="number"
              className={inputClass}
              value={form.capacityKg}
              onChange={(e) => handleChange("capacityKg", e.target.value)}
              placeholder="e.g. 7.5"
            />
          </div>

          {/* Status */}
          <div>
            <Label className="text-slate-700 dark:text-muted-foreground">Status</Label>
            <Select value={form.status} onValueChange={(val) => handleChange("status", val)}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white">
                <SelectItem value="Available" className={statusColorMap["Available"]}>
                  Available
                </SelectItem>
                <SelectItem value="In Use" className={statusColorMap["In Use"]}>
                  In Use
                </SelectItem>
                <SelectItem value="Maintenance" className={statusColorMap["Maintenance"]}>
                  Maintenance
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={onSubmit} className={buttonClass}>
              <Save className="w-4 h-4" />
              {isEdit ? "Update Machine" : "Save Machine"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}