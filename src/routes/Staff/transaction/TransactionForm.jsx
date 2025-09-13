import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import PaymentSection from "./PaymentSection";
import ServiceSelector from "./ServiceSelector";
import ConsumablesSection from "./ConsumablesSection";

const TransactionForm = forwardRef(({ onSubmit, onPreviewChange, isSubmitting, isLocked }, ref) => {
    const [form, setForm] = useState({
        name: "",
        contact: "",
        serviceId: "",
        amountGiven: 0,
        paymentMethod: "Cash",
    });

    const [loads, setLoads] = useState(1);
    const [supplySource, setSupplySource] = useState("in-store");
    const [consumables, setConsumables] = useState({});
    const [plasticOverrides, setPlasticOverrides] = useState({});
    const [services, setServices] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState(["Cash"]); // Default to Cash only
    const { toast } = useToast();

    useImperativeHandle(ref, () => ({
        resetForm: () => {
            const defaultService = services[0];
            setForm({
                name: "",
                contact: "",
                serviceId: defaultService?.id || "",
                amountGiven: 0,
                paymentMethod: "Cash",
            });
            setLoads(1);
            setSupplySource("in-store");
            setPlasticOverrides({});
            const initialConsumables = {};
            stockItems.forEach((item) => {
                initialConsumables[item.name] = item.name.toLowerCase().includes("plastic") ? 1 : 0;
            });
            setConsumables(initialConsumables);
            onPreviewChange?.(null);
        },
    }));

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token || typeof token !== "string" || !token.includes(".")) {
            toast({
                title: "Authentication Error",
                description: "Invalid or missing token. Please log in again.",
                variant: "destructive",
            });
            window.location.href = "/login";
            return;
        }

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
                if (data.length > 0) {
                    setForm((prev) => ({ ...prev, serviceId: data[0].id }));
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
                    initial[item.name] = item.name.toLowerCase().includes("plastic") ? loads : 0;
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

        const fetchPaymentSettings = async () => {
            try {
                const res = await fetch("http://localhost:8080/api/payment-settings", {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                if (res.ok) {
                    const data = await res.json();
                    // Build payment methods array based on settings
                    const methods = ["Cash"];
                    if (data.gcashEnabled) {
                        methods.push("GCash");
                    }
                    setPaymentMethods(methods);
                    
                    // If current payment method is GCash but it's disabled, switch to Cash
                    if (form.paymentMethod === "GCash" && !data.gcashEnabled) {
                        setForm(prev => ({ ...prev, paymentMethod: "Cash" }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch payment settings:", error);
                // Keep default payment methods (Cash only) if fetch fails
            }
        };

        fetchServices();
        fetchStockItems();
        fetchPaymentSettings();
    }, []);

    useEffect(() => {
        if (!stockItems.length) return;

        const expected = parseInt(loads) || 1;
        const plasticItems = stockItems.filter((item) => item.name.toLowerCase().includes("plastic"));

        let changed = false;
        const updated = { ...consumables };

        plasticItems.forEach((item) => {
            const name = item.name;
            if (!plasticOverrides[name] && consumables[name] !== expected) {
                updated[name] = expected;
                changed = true;
            }
        });

        if (changed) {
            setConsumables(updated);
        }
    }, [loads, stockItems, plasticOverrides, consumables]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleConsumableChange = (name, value) => {
        setConsumables((prev) => ({
            ...prev,
            [name]: parseInt(value) || 0,
        }));

        if (name.toLowerCase().includes("plastic")) {
            setPlasticOverrides((prev) => ({
                ...prev,
                [name]: true,
            }));
        }
    };

    const selectedService = services.find((s) => s.id === form.serviceId);
    const servicePrice = selectedService?.price || 0;
    const serviceTotal = servicePrice * parseInt(loads);

    const consumablesTotal = Object.entries(consumables).reduce((sum, [name, qty]) => {
        const item = stockItems.find((i) => i.name === name);
        return sum + (item?.price || 0) * qty;
    }, 0);

    const totalAmount = serviceTotal + consumablesTotal;

    useEffect(() => {
        const parsedAmount = parseFloat(form.amountGiven || 0);
        const change = parsedAmount - totalAmount;

        onPreviewChange?.({
            totalAmount,
            amountGiven: parsedAmount,
            change,
        });
    }, [form.amountGiven, totalAmount]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!form.name || !form.contact || !form.serviceId) {
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

        if (parseFloat(form.amountGiven || 0) < totalAmount) {
            toast({
                title: "Insufficient Payment",
                description: `Amount given (₱${form.amountGiven}) is less than total (₱${totalAmount.toFixed(2)}).`,
                variant: "destructive",
            });
            return;
        }

        const consumableQuantities = Object.entries(consumables).reduce((acc, [name, qty]) => {
            acc[name] = qty;
            return acc;
        }, {});

        const payload = {
            customerName: form.name,
            contact: form.contact,
            serviceId: form.serviceId,
            serviceName: selectedService?.name || "—",
            servicePrice,
            loads: parseInt(loads),
            serviceTotal,
            consumables: Object.entries(consumables).map(([name, qty]) => {
                const item = stockItems.find((i) => i.name === name);
                return {
                    name,
                    quantity: qty,
                    price: item?.price || 0,
                };
            }),
            consumableQuantities,
            consumablesPrice: consumablesTotal,
            paymentMethod: form.paymentMethod,
            amountGiven: parseFloat(form.amountGiven) || 0,
            change: parseFloat(form.amountGiven || 0) - totalAmount,
            totalPrice: totalAmount,
            issueDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        onSubmit(payload);
    };

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
                    {/* 👤 Customer Info */}
                    <div>
                        <Label className="mb-1 block">Name</Label>
                        <Input
                            placeholder="Customer Name"
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            required
                            disabled={isLocked}
                            className="input"
                        />
                    </div>

                    <div>
                        <Label className="mb-1 block">Contact Number</Label>
                        <Input
                            type="tel"
                            inputMode="numeric"
                            pattern={"^09\\d{9}$"}
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
                            disabled={isLocked}
                            className="input"
                        />
                    </div>

                    {/* 🧼 Service Selection */}
                    <ServiceSelector
                        services={services}
                        serviceId={form.serviceId}
                        onChange={handleChange}
                        isLocked={isLocked}
                    />

                    {/* 🧺 Supply Source Selector */}
                    <div className="space-y-2 pt-4">
                        <Label className="mb-1 block">Supply Source</Label>
                        <Select
                            value={supplySource}
                            onValueChange={setSupplySource}
                            disabled={isLocked}
                        >
                            <SelectTrigger className="border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-950">
                                <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent className="border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                                <SelectItem
                                    value="in-store"
                                    className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    In-store
                                </SelectItem>
                                <SelectItem
                                    value="customer"
                                    className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Customer-provided
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 🧼 Loads + Consumables */}
                    <ConsumablesSection
                        stockItems={stockItems}
                        consumables={consumables}
                        loads={loads}
                        onLoadsChange={setLoads}
                        onConsumableChange={handleConsumableChange}
                        plasticOverrides={plasticOverrides}
                        setPlasticOverrides={setPlasticOverrides}
                        supplySource={supplySource}
                        isLocked={isLocked}
                    />

                    {/* 💳 Payment Section */}
                    <PaymentSection
                        paymentMethod={form.paymentMethod}
                        amountGiven={form.amountGiven}
                        totalAmount={totalAmount}
                        onMethodChange={(value) => handleChange("paymentMethod", value)}
                        onAmountChange={(value) => handleChange("amountGiven", value)}
                        isLocked={isLocked}
                        paymentMethods={paymentMethods} // ✅ Pass enabled payment methods
                    />

                    <Button
                        type="submit"
                        disabled={isSubmitting || isLocked}
                        className="mt-2 w-full rounded-md bg-[#60A5FA] px-4 py-2 text-white transition-colors hover:bg-[#3B82F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-950"
                    >
                        {isSubmitting ? "Processing..." : "Save Transaction"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
});

TransactionForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onPreviewChange: PropTypes.func,
    isSubmitting: PropTypes.bool,
    isLocked: PropTypes.bool,
};

export default TransactionForm;