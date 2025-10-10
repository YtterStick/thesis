import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const InventoryForm = ({ item, onAdd, onClose, existingItems = [] }) => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
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
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-50 w-full max-w-md rounded-xl border-2 p-6 shadow-xl transition-all"
                style={{
                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                    color: isDarkMode ? "#13151B" : "#0B2B26",
                }}
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                        {isEditMode ? "Edit Item" : "Add New Item"}
                    </h2>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="rounded-lg p-1 transition-colors hover:opacity-80"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                        }}
                    >
                        <X className="h-4 w-4" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }} />
                    </motion.button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="name"
                            className="text-sm font-medium mb-2 block"
                            style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
                        >
                            Item Name
                        </label>
                        <Input
                            id="name"
                            placeholder="Item name"
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            required
                            className="rounded-lg border-2 transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                color: isDarkMode ? "#13151B" : "#0B2B26",
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="quantity"
                            className="text-sm font-medium mb-2 block"
                            style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
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
                            className="rounded-lg border-2 transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                color: isDarkMode ? "#13151B" : "#0B2B26",
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="price"
                            className="text-sm font-medium mb-2 block"
                            style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
                        >
                            Price
                        </label>
                        <div className="flex items-center rounded-lg border-2 transition-all"
                             style={{
                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                             }}>
                            <span className="px-3" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }}>₱</span>
                            <Input
                                id="price"
                                type="number"
                                placeholder="Price"
                                value={form.price}
                                onChange={(e) => handleChange("price", e.target.value)}
                                required
                                min="0"
                                step="0.01"
                                className="flex-1 border-none bg-transparent transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
                                style={{
                                    color: isDarkMode ? "#13151B" : "#0B2B26",
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="unit"
                            className="text-sm font-medium mb-2 block"
                            style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
                        >
                            Unit
                        </label>
                        <Select
                            value={form.unit}
                            onValueChange={(value) => handleChange("unit", value)}
                        >
                            <SelectTrigger
                                id="unit"
                                className="rounded-lg border-2 transition-all"
                                style={{
                                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                    color: isDarkMode ? "#13151B" : "#0B2B26",
                                }}
                            >
                                <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent 
                                className="rounded-lg border-2 transition-all"
                                style={{
                                    backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                    borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                    color: isDarkMode ? "#13151B" : "#0B2B26",
                                }}
                            >
                                {units.map((u) => (
                                    <SelectItem
                                        key={u}
                                        value={u}
                                        className="cursor-pointer transition-colors hover:opacity-80"
                                        style={{
                                            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                        }}
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
                            className="text-sm font-medium mb-2 block"
                            style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
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
                            className="rounded-lg border-2 transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                color: isDarkMode ? "#13151B" : "#0B2B26",
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="adequateStockThreshold"
                            className="text-sm font-medium mb-2 block"
                            style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
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
                            className="rounded-lg border-2 transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                color: isDarkMode ? "#13151B" : "#0B2B26",
                            }}
                        />
                    </div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="pt-2"
                    >
                        <Button
                            type="submit"
                            className="w-full rounded-lg px-4 py-2 text-white transition-all"
                            style={{
                                backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
                            }}
                        >
                            {isEditMode ? "Update Item" : "Save Item"}
                        </Button>
                    </motion.div>
                </form>
            </motion.div>
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