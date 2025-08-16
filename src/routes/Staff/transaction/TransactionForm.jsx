import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PaymentSection from "./PaymentSection";

const TransactionForm = forwardRef(({ onSubmit, onPreviewChange }, ref) => {
    const [form, setForm] = useState({
        transactionId: "",
        name: "",
        contact: "",
        serviceId: "",
        loads: 1,
        paymentStatus: "Unpaid",
        amountGiven: 0,
    });

    const [consumables, setConsumables] = useState({});
    const [services, setServices] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const { toast } = useToast();

    useImperativeHandle(ref, () => ({
        resetForm: () => {
            const defaultService = services[0]; // ✅ First service in the list

            setForm({
                transactionId: "",
                name: "",
                contact: "",
                serviceId: defaultService?.id || "",
                loads: 1,
                paymentStatus: "Unpaid",
                amountGiven: 0,
            });

            const initialConsumables = {};
            stockItems.forEach((item) => {
                const isPlastic = item.name.toLowerCase().includes("plastic");
                initialConsumables[item.name] = isPlastic ? 1 : 0;
            });
            setConsumables(initialConsumables);
            onPreviewChange?.(null);
        },
    }));

    useEffect(() => {
        setConsumables((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((key) => {
                if (key.toLowerCase().includes("plastic")) {
                    updated[key] = form.loads;
                }
            });
            return updated;
        });
    }, [form.loads]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        const fetchServices = async () => {
            try {
                const res = await fetch("http://localhost:8080/api/services", {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                setServices(data);

                const defaultService = data.find((s) => s.name.toLowerCase().includes("wash & dry"));
                if (data.length > 0) {
                    setForm((prev) => ({
                        ...prev,
                        serviceId: data[0].id, // ✅ Select first service by default
                    }));
                }
            } catch {
                toast({
                    title: "Service Fetch Error",
                    description: "Unable to load service list.",
                    variant: "destructive",
                });
            }
        };

        const fetchStockItems = async () => {
            try {
                const res = await fetch("http://localhost:8080/api/stock", {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                const safeItems = Array.isArray(data) ? data : (data.items ?? []);
                setStockItems(safeItems);

                const initial = {};
                safeItems.forEach((item) => {
                    const isPlastic = item.name.toLowerCase().includes("plastic");
                    initial[item.name] = isPlastic ? form.loads : 0;
                });
                setConsumables(initial);
            } catch {
                toast({
                    title: "Inventory Fetch Error",
                    description: "Unable to load consumables.",
                    variant: "destructive",
                });
            }
        };

        fetchServices();
        fetchStockItems();
    }, []);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleConsumableChange = (name, value) => {
        setConsumables((prev) => ({
            ...prev,
            [name]: parseInt(value) || 0,
        }));
    };

    const selectedService = services.find((s) => s.id === form.serviceId);
    const serviceTotal = selectedService ? selectedService.price * form.loads : 0;

    const consumablesTotal = Object.entries(consumables).reduce((sum, [name, qty]) => {
        const item = stockItems.find((i) => i.name === name);
        return sum + (item?.price || 0) * qty;
    }, 0);

    const totalAmount = serviceTotal + consumablesTotal;

    useEffect(() => {
        const isValid = form.name && form.contact && form.serviceId && form.loads >= 1 && Object.keys(consumables).length > 0;

        if (isValid) {
            const change = form.paymentStatus === "Paid" ? parseFloat(form.amountGiven || 0) - totalAmount : 0;

            onPreviewChange?.({
                totalAmount,
                amountGiven: parseFloat(form.amountGiven || 0),
                change,
            });
        }
    }, [form, consumablesTotal, serviceTotal]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name || !form.contact || !form.serviceId || form.loads < 1) {
            toast({
                title: "Missing Fields",
                description: "Please fill all required fields.",
                variant: "destructive",
            });
            return;
        }

        const isValidContact = /^09\d{9}$/.test(form.contact);
        if (!isValidContact) {
            toast({
                title: "Invalid Contact Number",
                description: "Invalid contact number format. Use 09XXXXXXXXX.",
                variant: "destructive",
            });
            return;
        }

        if (form.paymentStatus === "Paid" && parseFloat(form.amountGiven || 0) < totalAmount) {
            toast({
                title: "Insufficient Payment",
                description: `Amount given (₱${form.amountGiven}) is less than total (₱${totalAmount.toFixed(2)}).`,
                variant: "destructive",
            });
            return;
        }

        const payload = {
            transactionId: form.transactionId,
            customerName: form.name,
            contact: form.contact,
            serviceId: form.serviceId,
            loads: form.loads,
            consumableQuantities: { ...consumables },
            status: form.paymentStatus,
            amountGiven: parseFloat(form.amountGiven) || 0,
            issueDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Transaction failed");

            const transaction = await res.json();
            const change = form.paymentStatus === "Paid" ? parseFloat(form.amountGiven || 0) - transaction.totalPrice : 0;

            onSubmit({
                ...transaction,
                paymentStatus: form.paymentStatus,
                amountGiven: parseFloat(form.amountGiven) || 0,
                change,
            });
        } catch (error) {
            toast({
                title: "Transaction Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const nonPlasticItems = stockItems.filter((item) => !item.name.toLowerCase().includes("plastic"));
    const chunkedConsumables = [];
    for (let i = 0; i < nonPlasticItems.length; i += 2) {
        chunkedConsumables.push(nonPlasticItems.slice(i, i + 2));
    }

    return (
        <Card className="card max-h-[620px] overflow-y-auto border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
            <CardHeader className="pb-1">
                <CardTitle className="flex items-center gap-2 text-base text-slate-800 dark:text-slate-100">
                    <Receipt size={18} />
                    New Transaction
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5 px-6 pb-6 text-sm">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <div className="space-y-3">
                        {/* 👤 Customer Info */}
                        <div>
                            <Label className="mb-1 block">Name</Label>
                            <Input
                                placeholder="Customer Name"
                                value={form.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                required
                                className="border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-950"
                            />
                        </div>

                        <div>
                            <Label className="mb-1 block">Contact Number</Label>
                            <Input
                                type="tel"
                                inputMode="numeric"
                                pattern="^09\d{9}$"
                                maxLength={11}
                                placeholder="09XXXXXXXXX"
                                value={form.contact}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d{0,11}$/.test(value)) {
                                        handleChange("contact", value);
                                    }
                                }}
                                required
                                className="border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-950"
                            />
                        </div>

                        {/* 🧼 Service Selection */}
                        <div>
                            <Label className="mb-1 block">Service Type</Label>
                            <Select
                                value={form.serviceId}
                                onValueChange={(value) => handleChange("serviceId", value)}
                            >
                                <SelectTrigger className="border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-950">
                                    <SelectValue placeholder="Select service" />
                                </SelectTrigger>
                                <SelectContent className="border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                                    {services.map((service) => (
                                        <SelectItem
                                            key={service.id}
                                            value={service.id}
                                            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            {service.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 🧼 Loads + Plastic */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="mb-1 block">Loads</Label>
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    value={form.loads}
                                    onChange={(e) => {
                                        const raw = e.target.value;
                                        const cleaned = raw.replace(/^0+/, "") || "1";
                                        handleChange("loads", cleaned);
                                    }}
                                    onBlur={(e) => {
                                        const numeric = parseInt(e.target.value, 10);
                                        handleChange("loads", isNaN(numeric) || numeric < 1 ? 1 : numeric);
                                    }}
                                    required
                                    className="border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-950"
                                />
                            </div>

                            {stockItems
                                .filter((item) => item.name.toLowerCase().includes("plastic"))
                                .map((item) => (
                                    <div key={item.id}>
                                        <Label className="mb-1 block">{item.name}</Label>
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            min={0}
                                            value={consumables[item.name]?.toString() ?? "0"}
                                            onChange={(e) => {
                                                const raw = e.target.value;
                                                handleConsumableChange(item.name, raw);
                                            }}
                                            onBlur={(e) => {
                                                const cleaned = e.target.value.replace(/^0+/, "") || "0";
                                                const numeric = parseInt(cleaned, 10);
                                                handleConsumableChange(item.name, isNaN(numeric) ? 0 : numeric);
                                            }}
                                            className="border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-950"
                                        />
                                    </div>
                                ))}
                        </div>

                        {/* 🧼 Other Consumables */}
                        {chunkedConsumables.map((pair, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-2 gap-4"
                            >
                                {pair.map((item) => (
                                    <div key={item.id}>
                                        <Label className="mb-1 block">{item.name}</Label>
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            min={0}
                                            value={consumables[item.name]?.toString() ?? "0"}
                                            onChange={(e) => {
                                                handleConsumableChange(item.name, e.target.value);
                                            }}
                                            onBlur={(e) => {
                                                const cleaned = e.target.value.replace(/^0+/, "") || "0";
                                                const numeric = parseInt(cleaned, 10);
                                                handleConsumableChange(item.name, isNaN(numeric) ? 0 : numeric);
                                            }}
                                            className="border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-950"
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}

                        {/* 💳 Payment Section */}
                        <PaymentSection
                            paymentStatus={form.paymentStatus}
                            amountGiven={form.amountGiven}
                            totalAmount={totalAmount}
                            onStatusChange={(value) => {
                                handleChange("paymentStatus", value);
                                if (value === "Unpaid") {
                                    handleChange("amountGiven", 0);
                                }
                            }}
                            onAmountChange={(value) => handleChange("amountGiven", value)}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 w-full rounded-md bg-[#60A5FA] px-4 py-2 text-white transition-colors hover:bg-[#3B82F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-950"
                    >
                        Save Transaction
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
});

TransactionForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onPreviewChange: PropTypes.func,
};

export default TransactionForm;
