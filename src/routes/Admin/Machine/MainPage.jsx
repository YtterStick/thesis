import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WashingMachine, Sparkles, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddMachineModal from "./AddMachineModal";

const initialForm = {
  name: "",
  type: "",
  capacityKg: "",
  status: "Available",
};

export default function MachineMainPage() {
  const [form, setForm] = useState(initialForm);
  const [machines, setMachines] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const { toast } = useToast();

  const washerRef = useRef(null);
  const dryerRef = useRef(null);

  useEffect(() => {
    const handleWheel = (e, ref) => {
      if (ref.current && ref.current.contains(e.target)) {
        e.preventDefault();
        ref.current.scrollLeft += e.deltaY;
      }
    };

    const onWheel = (e) => {
      handleWheel(e, washerRef);
      handleWheel(e, dryerRef);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  const handleSubmit = () => {
    if (!form.name || !form.type || !form.capacityKg) {
      toast({
        title: "Missing required fields",
        description: "Please fill in name, type, and capacity.",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(form.capacityKg) <= 0) {
      toast({
        title: "Invalid capacity",
        description: "Capacity must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (selectedMachine !== null) {
      const updated = [...machines];
      updated[selectedMachine.index] = form;
      setMachines(updated);
      toast({
        title: "Machine updated",
        description: `${form.name} has been updated.`,
      });
    } else {
      setMachines((prev) => [...prev, form]);
      toast({
        title: "Machine added",
        description: `${form.name} has been saved.`,
      });
    }

    setForm(initialForm);
    setSelectedMachine(null);
    setOpen(false);
  };

  const washers = machines.filter((m) => m.type === "Washer");
  const dryers = machines.filter((m) => m.type === "Dryer");

  const statusColorMap = {
    Available: "text-[#3DD9B6] dark:text-[#28b99a]",
    "In Use": "text-yellow-500 dark:text-yellow-400",
    Maintenance: "text-red-500 dark:text-red-400",
  };

  const typeColorMap = {
    Washer: "border-blue-400 bg-slate-900",
    Dryer: "border-orange-400 bg-slate-900",
  };

  const iconColorMap = {
    Washer: "text-blue-400",
    Dryer: "text-orange-400",
  };

  const renderMachineCard = (machine, index) => {
    const statusColor = statusColorMap[machine.status] || "text-muted-foreground";
    const typeColor = typeColorMap[machine.type] || "border-slate-800 bg-slate-900";
    const iconColor = iconColorMap[machine.type] || "text-white";

    return (
      <Card
        key={index}
        onClick={() => {
          setSelectedMachine({ ...machine, index });
          setForm(machine);
          setOpen(true);
        }}
        className={`scroll-snap-align-start w-[300px] shrink-0 rounded-md border ${typeColor} text-white transition-transform duration-200 hover:scale-[1.04] hover:cursor-pointer ${
          machine.type === "Washer" ? "hover:border-blue-400" : "hover:border-orange-400"
        }`}
        style={{ transformOrigin: "center" }}
      >
        <CardHeader className="flex items-center gap-2">
          {machine.type === "Washer" ? (
            <Sparkles className={`h-5 w-5 ${iconColor}`} />
          ) : (
            <Flame className={`h-5 w-5 ${iconColor}`} />
          )}
          <CardTitle className="text-base font-semibold">{machine.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <div>Type: {machine.type}</div>
          <div>Capacity: {machine.capacityKg} kg</div>
          <div>
            Status: <span className={`font-medium ${statusColor}`}>{machine.status}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 px-6 pb-6 pt-4 overflow-visible">
      {/* Header + Add Button */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WashingMachine className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Laundry Machines</h2>
        </div>
        <AddMachineModal
          open={open}
          setOpen={(value) => {
            setOpen(value);
            if (!value) {
              setSelectedMachine(null);
              setForm(initialForm);
            }
          }}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Washer Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-blue-400">Washers</h3>
        <div
          ref={washerRef}
          className="relative z-0 overflow-x-auto scroll-smooth px-4 py-2"
          style={{ overflowY: "visible" }}
        >
          <div
            className="flex flex-nowrap gap-4"
            style={{
              scrollSnapType: "x mandatory",
              touchAction: "pan-y",
              overflow: "visible",
            }}
          >
            {washers.length > 0 ? (
              washers.map((machine, index) => renderMachineCard(machine, index))
            ) : (
              <p className="text-muted-foreground">No washers added yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Dryer Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-orange-400">Dryers</h3>
        <div
          ref={dryerRef}
          className="relative z-0 overflow-x-auto scroll-smooth px-4 py-2"
          style={{ overflowY: "visible" }}
        >
          <div
            className="flex flex-nowrap gap-4"
            style={{
              scrollSnapType: "x mandatory",
              touchAction: "pan-y",
              overflow: "visible",
            }}
          >
            {dryers.length > 0 ? (
              dryers.map((machine, index) => renderMachineCard(machine, index))
            ) : (
              <p className="text-muted-foreground">No dryers added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}