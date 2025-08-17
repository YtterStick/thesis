import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WashingMachine, Sparkles, Flame, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddMachineModal from "./AddMachineModal";
import { Button } from "@/components/ui/button";

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
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [error, setError] = useState(null);
    const { toast } = useToast();

    const token = localStorage.getItem("token");
    const washerRef = useRef(null);
    const dryerRef = useRef(null);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [open]);

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

    useEffect(() => {
        if (!token) {
            setError("No token found. Please log in.");
            return;
        }

        const fetchMachines = async () => {
            try {
                const response = await fetch("http://localhost:8080/api/machines", {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch machines");

                const data = await response.json();
                setMachines(data);
            } catch (err) {
                console.error("❌ Error fetching machines:", err.message);
                setError("Failed to load machines. Make sure you're logged in.");
            }
        };

        fetchMachines();
    }, [token]);

    const handleSubmit = async () => {
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

        const method = form.id ? "PUT" : "POST";
        const url = form.id ? `http://localhost:8080/api/machines/${form.id}` : "http://localhost:8080/api/machines";

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...form,
                    capacityKg: parseFloat(form.capacityKg),
                }),
            });

            if (!response.ok) throw new Error("Failed to save machine");

            const saved = await response.json();

            setMachines((prev) => {
                const exists = prev.some((m) => m.id === saved.id);
                return exists ? prev.map((m) => (m.id === saved.id ? saved : m)) : [...prev, saved];
            });

            toast({
                title: form.id ? "Machine updated" : "Machine added",
                description: `${saved.name} has been ${form.id ? "updated" : "saved"}.`,
            });

            setForm(initialForm);
            setSelectedMachine(null);
            setOpen(false);
        } catch (error) {
            console.error("❌ Error saving machine:", error.message);
            setError("Failed to save machine.");
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://localhost:8080/api/machines/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to delete machine");

            setMachines((prev) => prev.filter((m) => m.id !== id));
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("❌ Error deleting machine:", error.message);
            setError("Failed to delete machine.");
        }
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

    const renderMachineCard = (machine) => {
        const statusColor = statusColorMap[machine.status] || "text-muted-foreground";
        const typeColor = typeColorMap[machine.type] || "border-slate-800 bg-slate-900";
        const iconColor = iconColorMap[machine.type] || "text-white";

        return (
            <Card
                key={machine.id}
                onClick={() => {
                    setSelectedMachine(machine);
                    setForm({
                        id: machine.id,
                        name: machine.name,
                        type: machine.type,
                        capacityKg: machine.capacityKg.toString(),
                        status: machine.status,
                    });
                    setOpen(true);
                }}
                className={`scroll-snap-align-start relative w-[300px] shrink-0 rounded-md border ${typeColor} text-white transition-transform duration-200 hover:scale-[1.04] hover:cursor-pointer`}
                style={{ transformOrigin: "center" }}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(machine.id);
                    }}
                    className="absolute right-2 top-2 rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-800"
                    title="Delete machine"
                >
                    <X
                        size={16}
                        className="text-red-500 dark:text-red-400"
                    />
                </button>

                <CardHeader className="flex items-center gap-2">
                    {machine.type === "Washer" ? <Sparkles className={`h-5 w-5 ${iconColor}`} /> : <Flame className={`h-5 w-5 ${iconColor}`} />}
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
        <div className="space-y-6 overflow-visible px-6 pb-6 pt-4">
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

            {error && <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>}

            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-blue-400">Washers</h3>
                <div
                    ref={washerRef}
                    className="relative z-0 overflow-x-auto scroll-smooth px-4 py-2"
                >
                    <div
                        className="flex flex-nowrap gap-4"
                        style={{ scrollSnapType: "x mandatory", touchAction: "pan-y" }}
                    >
                        {washers.length > 0 ? washers.map(renderMachineCard) : <p className="text-muted-foreground">No washers added yet.</p>}
                    </div>
                </div>
            </div>

            {/* Dryer Section */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-orange-400">Dryers</h3>
                <div
                    ref={dryerRef}
                    className="relative z-0 overflow-x-auto scroll-smooth px-4 py-2"
                >
                    <div
                        className="flex flex-nowrap gap-4"
                        style={{
                            scrollSnapType: "x mandatory",
                            touchAction: "pan-y",
                            overflow: "visible",
                        }}
                    >
                        {dryers.length > 0 ? dryers.map(renderMachineCard) : <p className="text-muted-foreground">No dryers added yet.</p>}
                    </div>
                </div>
            </div>

            {/* ❓ Confirm Delete */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm rounded-md border border-slate-300 bg-white p-6 text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                        <h3 className="mb-2 text-lg font-semibold">Delete Machine</h3>
                        <p className="mb-4 text-sm">Are you sure you want to delete this machine?</p>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleDelete(confirmDeleteId)}
                                className="bg-red-600 text-white hover:bg-red-700"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
