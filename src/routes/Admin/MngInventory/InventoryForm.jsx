import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const InventoryForm = ({ item, onAdd, onClose, existingItems = [] }) => {
    const [form, setForm] = useState({
        name: "",
        quantity: "",
        unit: "pcs",
        price: "",
        lowStockThreshold: "",
        adequateStockThreshold: "",
    });

    const { toast } = useToast();
    const units = ["pcs", "kg", "L"];
    const isEditMode = Boolean(item);

    useEffect(() => {
        if (item) {
            setForm({
                name: item.name,
                quantity: item.quantity.toString(),
                unit: item.unit,
                price: item.price?.toString() ?? "",
                lowStockThreshold: item.lowStockThreshold?.toString() ?? "",
                adequateStockThreshold: item.adequateStockThreshold?.toString() ?? "",
            });
        }
    }, [item]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const { name, quantity, unit, price, lowStockThreshold, adequateStockThreshold } = form;

        if (!name || quantity === "" || price === "" || isNaN(quantity) || isNaN(price)) {
            toast({
                title: "Missing Fields",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        const low = parseInt(lowStockThreshold);
        const adequate = parseInt(adequateStockThreshold);

        if (isNaN(low) || low <= 0) {
            toast({
                title: "Invalid Low Stock Threshold",
                description: "Low stock threshold must be a number greater than zero.",
                variant: "destructive",
            });
            return;
        }

        if (isNaN(adequate) || adequate <= low) {
            toast({
                title: "Invalid Adequate Threshold",
                description: "Adequate stock threshold must be greater than low stock threshold.",
                variant: "destructive",
            });
            return;
        }

        const normalizedName = name.trim().toLowerCase();
        const isDuplicate = existingItems.some((i) => i.name.trim().toLowerCase() === normalizedName && (!isEditMode || i.id !== item.id));

        if (isDuplicate) {
            toast({
                title: "Duplicate Item",
                description: "An item with this name already exists.",
                variant: "destructive",
            });
            return;
        }

        const result = {
            name: name.trim(),
            quantity: parseInt(quantity),
            unit,
            price: parseFloat(price),
            lowStockThreshold: low,
            adequateStockThreshold: adequate,
            ...(isEditMode ? {} : { lastRestock: new Date().toISOString() }),
        };

        onAdd(result);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative z-50 w-full max-w-md rounded-lg border border-slate-300 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        {isEditMode ? "Edit Item" : "Add New Item"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-sm p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="name"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Item Name
                        </label>
                        <Input
                            id="name"
                            placeholder="Item name"
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            required
                            className="mt-1 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="quantity"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Quantity
                        </label>
                        <Input
                            id="quantity"
                            type="number"
                            placeholder="Quantity"
                            value={form.quantity}
                            onChange={(e) => handleChange("quantity", e.target.value)}
                            required
                            min="0"
                            step="1"
                            className="mt-1 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="price"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Price
                        </label>
                        <div className="mt-1 flex items-center rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
                            <span className="px-3 text-slate-500 dark:text-slate-400">₱</span>
                            <Input
                                id="price"
                                type="number"
                                placeholder="Price"
                                value={form.price}
                                onChange={(e) => handleChange("price", e.target.value)}
                                required
                                min="0"
                                step="0.01"
                                className="flex-1 border-none bg-transparent text-slate-900 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="unit"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Unit
                        </label>
                        <Select
                            value={form.unit}
                            onValueChange={(value) => handleChange("unit", value)}
                        >
                            <SelectTrigger
                                id="unit"
                                className="mt-1 border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            >
                                <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent className="border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
                                {units.map((u) => (
                                    <SelectItem
                                        key={u}
                                        value={u}
                                        className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        {u}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label
                            htmlFor="lowStockThreshold"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Low Stock Threshold
                        </label>
                        <Input
                            id="lowStockThreshold"
                            type="number"
                            placeholder="Low Stock Threshold"
                            value={form.lowStockThreshold}
                            onChange={(e) => handleChange("lowStockThreshold", e.target.value)}
                            min="1"
                            step="1"
                            className="mt-1 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="adequateStockThreshold"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Adequate Stock Threshold
                        </label>
                        <Input
                            id="adequateStockThreshold"
                            type="number"
                            placeholder="Adequate Stock Threshold"
                            value={form.adequateStockThreshold}
                            onChange={(e) => handleChange("adequateStockThreshold", e.target.value)}
                            min="1"
                            step="1"
                            className="mt-1 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full rounded-md bg-[#0891B2] px-4 py-2 text-white transition-colors hover:bg-[#0E7490]"
                    >
                        {isEditMode ? "Update Item" : "Save Item"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

InventoryForm.propTypes = {
    item: PropTypes.object,
    onAdd: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    existingItems: PropTypes.array,
};

export default InventoryForm;