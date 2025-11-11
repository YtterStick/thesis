import { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Receipt, Info, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import PaymentSection from "./PaymentSection";
import ServiceSelector from "./ServiceSelector";
import ConsumablesSection from "./ConsumablesSection";
import { api } from "@/lib/api-config";
import { useTheme } from "@/hooks/use-theme";

// In TransactionForm
const CACHE_DURATION = 30 * 1000;
const POLLING_INTERVAL = 1000;

// Enhanced Manila time utility functions with detailed debugging
const getManilaTime = (date = new Date()) => {
    // Method 1: Direct calculation (UTC+8)
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const manilaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const manilaTime = new Date(utc + manilaOffset);
    
    // Method 2: Using toLocaleString for verification
    const localeManilaTime = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    
    console.log("🕒 Manila Time Calculation:");
    console.log("   Original Local:", date.toString());
    console.log("   Original ISO:", date.toISOString());
    console.log("   Calculated Manila:", manilaTime.toString());
    console.log("   Locale Manila:", localeManilaTime.toString());
    console.log("   Difference (ms):", manilaTime.getTime() - localeManilaTime.getTime());
    
    return manilaTime;
};

const formatToManilaISOString = (date = new Date()) => {
    const manilaDate = getManilaTime(date);
    const isoString = manilaDate.toISOString();
    
    console.log("🕒 Formatting Manila to ISO:");
    console.log("   Manila Date:", manilaDate.toString());
    console.log("   ISO String:", isoString);
    
    return isoString;
};

const addDaysManilaTime = (days, date = new Date()) => {
    const manilaDate = getManilaTime(date);
    const result = new Date(manilaDate.getTime() + days * 24 * 60 * 60 * 1000);
    
    console.log("🕒 Adding days to Manila time:");
    console.log("   Original Manila:", manilaDate.toString());
    console.log("   Added Days:", days);
    console.log("   Result:", result.toString());
    console.log("   Result ISO:", result.toISOString());
    
    return result;
};

// Cache initialization
const initializeCache = () => {
    try {
        const stored = localStorage.getItem('transactionFormCache');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Date.now() - parsed.timestamp < CACHE_DURATION) {
                console.log("📦 Initializing transaction form from stored cache");
                return parsed;
            } else {
                console.log("🗑️ Stored transaction form cache expired");
            }
        }
    } catch (error) {
        console.warn('Failed to load transaction form cache from storage:', error);
    }
    return null;
};

// Global cache instance
let transactionFormCache = initializeCache();
let cacheTimestamp = transactionFormCache?.timestamp || null;

const saveCacheToStorage = (data) => {
    try {
        localStorage.setItem('transactionFormCache', JSON.stringify({
            ...data,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.warn('Failed to save transaction form cache to storage:', error);
    }
};

const TransactionForm = forwardRef(({ onSubmit, onPreviewChange, isSubmitting, isLocked }, ref) => {
    const { theme } = useTheme();
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const [form, setForm] = useState({
        name: "",
        contact: "",
        serviceId: "",
        amountGiven: "",
        paymentMethod: "Cash",
        gcashReference: "",
    });

    const [loads, setLoads] = useState(1);
    const [supplySource, setSupplySource] = useState("in-store");
    const [consumables, setConsumables] = useState({});
    const [plasticOverrides, setPlasticOverrides] = useState({});
    const [detergentOverrides, setDetergentOverrides] = useState({});
    const [fabricOverrides, setFabricOverrides] = useState({});
    const [services, setServices] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState(["Cash"]);
    const [initialLoad, setInitialLoad] = useState(!transactionFormCache);
    const [insufficientStockItems, setInsufficientStockItems] = useState([]);
    
    // NEW STATES FOR AUTO-CALCULATION
    const [totalWeight, setTotalWeight] = useState("");
    const [autoCalculate, setAutoCalculate] = useState(true);
    const [calculatedLoads, setCalculatedLoads] = useState(1);
    const [machineInfo, setMachineInfo] = useState("");
    const [isCalculating, setIsCalculating] = useState(false);
    
    // Confirmation dialog states
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingPayload, setPendingPayload] = useState(null);
    
    const { toast } = useToast();
    const pollingIntervalRef = useRef(null);
    const isMountedRef = useRef(true);

    const selectedService = services.find((s) => s.id === form.serviceId);
    const isDryOnlyService = selectedService && selectedService.name.toLowerCase().includes("dry") && !selectedService.name.toLowerCase().includes("wash");

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));

        if (field === "paymentMethod" && value !== "GCash") {
            setForm((prev) => ({ ...prev, gcashReference: "" }));
        }
    };

    const handleServiceChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        
        // Check if this is a Dry Only service and auto-set supply source to customer
        if (field === "serviceId" && services.length > 0) {
            const selectedService = services.find(s => s.id === value);
            if (selectedService && selectedService.name.toLowerCase().includes("dry") && !selectedService.name.toLowerCase().includes("wash")) {
                console.log("🔄 Dry Only service selected - auto-setting supply source to customer");
                setSupplySource("customer");
            }
        }
    };

    const handleNameChange = (value) => {
        const cleanedValue = value.replace(/[0-9]/g, '');
        handleChange("name", cleanedValue);
    };

    useImperativeHandle(ref, () => ({
        resetForm: () => {
            const defaultService = services[0];
            setForm({
                name: "",
                contact: "",
                serviceId: defaultService?.id || "",
                amountGiven: "",
                paymentMethod: "Cash",
                gcashReference: "",
            });
            setLoads(1);
            setSupplySource("in-store");
            setPlasticOverrides({});
            setDetergentOverrides({});
            setFabricOverrides({});
            setInsufficientStockItems([]);
            setTotalWeight(""); // RESET WEIGHT
            setAutoCalculate(true); // RESET AUTO-CALCULATE
            setCalculatedLoads(1); // RESET CALCULATED LOADS
            setMachineInfo(""); // RESET MACHINE INFO
            
            const initialConsumables = {};
            stockItems.forEach((item) => {
                initialConsumables[item.name] = 
                    item.name.toLowerCase().includes("plastic") || 
                    item.name.toLowerCase().includes("detergent") || 
                    item.name.toLowerCase().includes("fabric") ? 1 : 0;
            });
            setConsumables(initialConsumables);
            onPreviewChange?.(null);
        },
    }));

    // NEW FUNCTION: Calculate loads automatically
    const calculateLoadsAutomatically = async (weight) => {
        if (!weight || weight <= 0) {
            setCalculatedLoads(1);
            setMachineInfo("");
            setLoads(1);
            return;
        }

        setIsCalculating(true);
        try {
            const response = await api.post("/machines/calculate-loads", {
                totalWeightKg: weight,
                machineType: "Washer"
            });

            const { loads: calculatedLoads, machineInfo, machineCapacity, plasticBags } = response;
            
            setCalculatedLoads(calculatedLoads);
            setMachineInfo(`${weight}kg = ${calculatedLoads} loads (${machineInfo})`);
            setLoads(calculatedLoads);
            
            // Auto-update plastic bags in consumables and clear manual override
            const plasticItem = stockItems.find(item => 
                item.name.toLowerCase().includes("plastic")
            );
            
            if (plasticItem && plasticBags > 0) {
                setConsumables(prev => ({
                    ...prev,
                    [plasticItem.name]: plasticBags
                }));
                // Clear manual override when auto-calculating
                setPlasticOverrides(prev => ({
                    ...prev,
                    [plasticItem.name]: false
                }));
            }

            toast({
                title: "Auto-calculation Complete",
                description: `Calculated ${calculatedLoads} loads for ${weight}kg`,
                variant: "default",
            });

        } catch (error) {
            console.error("Error calculating loads:", error);
            // Fallback to simple calculation
            const defaultCapacity = 8;
            const calculated = Math.ceil(weight / defaultCapacity);
            setCalculatedLoads(calculated);
            setMachineInfo(`${weight}kg = ${calculated} loads (${defaultCapacity}kg capacity)`);
            setLoads(calculated);
            
            toast({
                title: "Used Default Calculation",
                description: `Calculated ${calculated} loads using default machine capacity`,
                variant: "default",
            });
        } finally {
            setIsCalculating(false);
        }
    };

    // Reset plastic overrides when auto-calculate is toggled on
    useEffect(() => {
        if (autoCalculate && totalWeight && !isNaN(parseFloat(totalWeight))) {
            calculateLoadsAutomatically(parseFloat(totalWeight));
            
            // Clear plastic overrides when auto-calculate is enabled
            const plasticItem = stockItems.find(item => 
                item.name.toLowerCase().includes("plastic")
            );
            if (plasticItem) {
                setPlasticOverrides(prev => ({
                    ...prev,
                    [plasticItem.name]: false
                }));
            }
        }
    }, [autoCalculate]);

    const hasDataChanged = (newData, oldData) => {
        if (!oldData) return true;
        
        return (
            JSON.stringify(newData.services) !== JSON.stringify(oldData.services) ||
            JSON.stringify(newData.stockItems) !== JSON.stringify(oldData.stockItems) ||
            JSON.stringify(newData.paymentMethods) !== JSON.stringify(oldData.paymentMethods)
        );
    };

    const fetchData = useCallback(async (forceRefresh = false) => {
        if (!isMountedRef.current) return;

        try {
            const now = Date.now();
            
            if (!forceRefresh && transactionFormCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
                console.log("📦 Using cached transaction form data");
                
                const cachedData = transactionFormCache.data;
                setServices(cachedData.services || []);
                setStockItems(cachedData.stockItems || []);
                setPaymentMethods(cachedData.paymentMethods || ["Cash"]);
                
                if (cachedData.services.length > 0) {
                    setForm((prev) => ({ 
                        ...prev, 
                        serviceId: prev.serviceId || cachedData.services[0]?.id || "" 
                    }));
                }
                
                setInitialLoad(false);
                return;
            }

            await fetchFreshData();
        } catch (error) {
            console.error('Error in fetchData:', error);
            if (!isMountedRef.current) return;
            
            if (transactionFormCache) {
                console.log("⚠️ Fetch failed, falling back to cached data");
                const cachedData = transactionFormCache.data;
                setServices(cachedData.services || []);
                setStockItems(cachedData.stockItems || []);
                setPaymentMethods(cachedData.paymentMethods || ["Cash"]);
            }
            setInitialLoad(false);
        }
    }, []);

    const fetchFreshData = async () => {
    console.log("🔄 Fetching fresh transaction form data");
    
    try {
        // Use the api utility instead of direct fetch calls
        const [servicesData, stockData, paymentData] = await Promise.all([
            api.get("/services"),
            api.get("/stock"),
            api.get("/payment-settings")
        ]);

        const safeStockItems = Array.isArray(stockData) ? stockData : (stockData.items ?? []);

        // FIXED: Properly handle payment settings response
        let paymentMethodsData = ["Cash"];
        console.log("💳 Payment settings response:", paymentData);
        
        // Check if GCash is enabled in the payment settings
        if (paymentData && (paymentData.gcashEnabled === true || paymentData.gcashEnabled === "true")) {
            console.log("✅ GCash is enabled - adding to payment methods");
            paymentMethodsData.push("GCash");
        } else {
            console.log("❌ GCash is disabled - only Cash available");
        }

        console.log("💰 Available payment methods:", paymentMethodsData);

        const newData = {
            services: servicesData,
            stockItems: safeStockItems,
            paymentMethods: paymentMethodsData,
        };

        const currentTime = Date.now();

        if (!transactionFormCache || hasDataChanged(newData, transactionFormCache.data)) {
            console.log("🔄 Transaction form data updated with fresh data");
            
            transactionFormCache = {
                data: newData,
                timestamp: currentTime
            };
            cacheTimestamp = currentTime;
            saveCacheToStorage(transactionFormCache);
        } else {
            console.log("✅ No changes in transaction form data, updating timestamp only");
            cacheTimestamp = currentTime;
            transactionFormCache.timestamp = currentTime;
            saveCacheToStorage(transactionFormCache);
        }

        if (isMountedRef.current) {
            setServices(servicesData);
            setStockItems(safeStockItems);
            setPaymentMethods(paymentMethodsData);
            
            if (servicesData.length > 0) {
                setForm((prev) => ({ 
                    ...prev, 
                    serviceId: prev.serviceId || servicesData[0]?.id || "" 
                }));
            }
            
            const initialConsumables = {};
            safeStockItems.forEach((item) => {
                initialConsumables[item.name] = 
                    item.name.toLowerCase().includes("plastic") || 
                    item.name.toLowerCase().includes("detergent") || 
                    item.name.toLowerCase().includes("fabric") ? loads : 0;
            });
            setConsumables(initialConsumables);
            
            setInitialLoad(false);
        }

    } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
            title: "Data Fetch Error",
            description: "Unable to load required data.",
            variant: "destructive",
        });
    }
};

    useEffect(() => {
        isMountedRef.current = true;
        
        if (transactionFormCache) {
            console.log("🚀 Showing cached transaction form data immediately");
            const cachedData = transactionFormCache.data;
            setServices(cachedData.services || []);
            setStockItems(cachedData.stockItems || []);
            setPaymentMethods(cachedData.paymentMethods || ["Cash"]);
            
            if (cachedData.services.length > 0) {
                setForm((prev) => ({ 
                    ...prev, 
                    serviceId: prev.serviceId || cachedData.services[0]?.id || "" 
                }));
            }
            
            const initialConsumables = {};
            cachedData.stockItems.forEach((item) => {
                initialConsumables[item.name] = 
                    item.name.toLowerCase().includes("plastic") || 
                    item.name.toLowerCase().includes("detergent") || 
                    item.name.toLowerCase().includes("fabric") ? loads : 0;
            });
            setConsumables(initialConsumables);
            
            setInitialLoad(false);
        }
        
        fetchData();
        
        pollingIntervalRef.current = setInterval(() => {
            console.log("🔄 Auto-refreshing transaction form data...");
            fetchData(false);
        }, POLLING_INTERVAL);
        
        return () => {
            isMountedRef.current = false;
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [fetchData]);

    // Auto-set supply source based on service type
    useEffect(() => {
        if (form.serviceId && services.length > 0) {
            const selectedService = services.find(s => s.id === form.serviceId);
            if (selectedService && selectedService.name.toLowerCase().includes("dry") && !selectedService.name.toLowerCase().includes("wash")) {
                console.log("🔄 Dry Only service detected - setting supply source to customer");
                setSupplySource("customer");
            }
        }
    }, [form.serviceId, services]);

    // Handle supply source changes - set detergent and fabric to 0 when customer-provided
    useEffect(() => {
        if (supplySource === "customer" && stockItems.length > 0) {
            console.log("🔄 Customer provided selected - setting detergent and fabric to 0");
            
            const updatedConsumables = { ...consumables };
            let hasChanges = false;

            // Set all detergent items to 0
            stockItems.forEach((item) => {
                if (item.name.toLowerCase().includes("detergent")) {
                    if (updatedConsumables[item.name] !== 0) {
                        updatedConsumables[item.name] = 0;
                        hasChanges = true;
                        console.log(`✅ Set ${item.name} to 0`);
                    }
                    // Mark as manually set so it doesn't auto-sync
                    setDetergentOverrides((prev) => ({ ...prev, [item.name]: true }));
                }
            });

            // Set all fabric items to 0
            stockItems.forEach((item) => {
                if (item.name.toLowerCase().includes("fabric")) {
                    if (updatedConsumables[item.name] !== 0) {
                        updatedConsumables[item.name] = 0;
                        hasChanges = true;
                        console.log(`✅ Set ${item.name} to 0`);
                    }
                    // Mark as manually set so it doesn't auto-sync
                    setFabricOverrides((prev) => ({ ...prev, [item.name]: true }));
                }
            });

            if (hasChanges) {
                setConsumables(updatedConsumables);
            }
        }
    }, [supplySource, stockItems]);

    // Handle switching back to in-store - reset detergent and fabric to match loads
    useEffect(() => {
        if (supplySource === "in-store" && stockItems.length > 0) {
            console.log("🔄 In-store selected - resetting detergent and fabric to match loads");
            
            const expected = parseInt(loads) || 1;
            const updatedConsumables = { ...consumables };
            let hasChanges = false;

            // Reset detergent items to match loads and clear overrides
            stockItems.forEach((item) => {
                if (item.name.toLowerCase().includes("detergent")) {
                    if (updatedConsumables[item.name] !== expected) {
                        updatedConsumables[item.name] = expected;
                        hasChanges = true;
                        console.log(`✅ Reset ${item.name} to ${expected}`);
                    }
                    // Clear manual override so it can auto-sync
                    setDetergentOverrides((prev) => ({ ...prev, [item.name]: false }));
                }
            });

            // Reset fabric items to match loads and clear overrides
            stockItems.forEach((item) => {
                if (item.name.toLowerCase().includes("fabric")) {
                    if (updatedConsumables[item.name] !== expected) {
                        updatedConsumables[item.name] = expected;
                        hasChanges = true;
                        console.log(`✅ Reset ${item.name} to ${expected}`);
                    }
                    // Clear manual override so it can auto-sync
                    setFabricOverrides((prev) => ({ ...prev, [item.name]: false }));
                }
            });

            if (hasChanges) {
                setConsumables(updatedConsumables);
            }
        }
    }, [supplySource, stockItems, loads]);

    // Auto-sync logic for consumables - INCLUDING PLASTIC when auto-calculating
    useEffect(() => {
        if (!stockItems.length) return;

        const expected = autoCalculate && calculatedLoads > 0 ? calculatedLoads : parseInt(loads) || 1;
        
        const plasticItems = stockItems.filter((item) => item.name.toLowerCase().includes("plastic"));
        const detergentItems = stockItems.filter((item) => item.name.toLowerCase().includes("detergent"));
        const fabricItems = stockItems.filter((item) => item.name.toLowerCase().includes("fabric"));

        let changed = false;
        const updated = { ...consumables };

        // Update plastic items that aren't overridden (only if auto-calculating)
        if (autoCalculate) {
            plasticItems.forEach((item) => {
                const name = item.name;
                if (!plasticOverrides[name] && consumables[name] !== expected) {
                    updated[name] = expected;
                    changed = true;
                }
            });
        }

        // Update detergent items that aren't overridden (only if in-store)
        if (supplySource === "in-store") {
            detergentItems.forEach((item) => {
                const name = item.name;
                if (!detergentOverrides[name] && consumables[name] !== expected) {
                    updated[name] = expected;
                    changed = true;
                }
            });
        }

        // Update fabric items that aren't overridden (only if in-store)
        if (supplySource === "in-store") {
            fabricItems.forEach((item) => {
                const name = item.name;
                if (!fabricOverrides[name] && consumables[name] !== expected) {
                    updated[name] = expected;
                    changed = true;
                }
            });
        }

        if (changed) {
            setConsumables(updated);
        }
    }, [loads, calculatedLoads, autoCalculate, stockItems, plasticOverrides, detergentOverrides, fabricOverrides, consumables, supplySource]);

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
        } else if (name.toLowerCase().includes("detergent")) {
            setDetergentOverrides((prev) => ({
                ...prev,
                [name]: true,
            }));
        } else if (name.toLowerCase().includes("fabric")) {
            setFabricOverrides((prev) => ({
                ...prev,
                [name]: true,
            }));
        }
    };

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

    // Function to extract stock items from error response
    const extractInsufficientStockItems = (error) => {
        // Try to get the response data if available
        if (error.response && error.response.data) {
            const responseData = error.response.data;
            
            // If backend returns structured error with insufficientItems
            if (responseData.insufficientItems && Array.isArray(responseData.insufficientItems)) {
                return responseData.insufficientItems;
            }
            
            // If backend returns message with item names
            if (responseData.message && responseData.message.includes("Insufficient stock")) {
                const itemsMatch = responseData.message.match(/Insufficient stock for: (.+)$/);
                if (itemsMatch && itemsMatch[1]) {
                    return itemsMatch[1].split(', ').map(item => item.split(' (')[0].trim());
                }
            }
        }
        
        // Fallback: try to extract from error message
        if (error.message && error.message.includes("Insufficient stock")) {
            const itemsMatch = error.message.match(/Insufficient stock for: (.+)$/);
            if (itemsMatch && itemsMatch[1]) {
                return itemsMatch[1].split(', ').map(item => item.split(' (')[0].trim());
            }
        }
        
        // If we can't extract specific items, check all consumables against stock
        const insufficientItems = [];
        Object.entries(consumables).forEach(([itemName, quantity]) => {
            const stockItem = stockItems.find(item => item.name === itemName);
            if (stockItem && quantity > stockItem.quantity) {
                insufficientItems.push(itemName);
            }
        });
        
        return insufficientItems;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Clear previous insufficient stock errors
        setInsufficientStockItems([]);

        if (!form.name || !form.contact || !form.serviceId) {
            toast({
                title: "Missing Fields",
                description: "Please fill all required fields.",
                variant: "destructive",
            });
            return;
        }

        const nameHasNumbers = /[0-9]/.test(form.name);
        if (nameHasNumbers) {
            toast({
                title: "Invalid Name",
                description: "Customer name should not contain numbers.",
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

        if (form.paymentMethod === "GCash") {
            if (!form.gcashReference) {
                toast({
                    title: "Missing GCash Reference",
                    description: "Please enter GCash reference number.",
                    variant: "destructive",
                });
                return;
            }

            if (!/^\d+$/.test(form.gcashReference)) {
                toast({
                    title: "Invalid GCash Reference",
                    description: "GCash reference must contain numbers only.",
                    variant: "destructive",
                });
                return;
            }

            if (parseFloat(form.amountGiven || 0) !== totalAmount) {
                toast({
                    title: "Invalid Amount for GCash",
                    description: "For GCash payments, amount given must exactly match the total.",
                    variant: "destructive",
                });
                return;
            }
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

        // Enhanced Manila time debugging
        console.log("🕒 ========== DATE DEBUGGING START ==========");
        
        const currentLocal = new Date();
        const currentManila = getManilaTime();
        const manilaIssueDate = formatToManilaISOString();
        const manilaDueDate = addDaysManilaTime(7).toISOString();

        console.log("🕒 CURRENT TIME COMPARISON:");
        console.log("   Local Time:", currentLocal.toString());
        console.log("   Local ISO:", currentLocal.toISOString());
        console.log("   Manila Time:", currentManila.toString());
        console.log("   Manila ISO:", manilaIssueDate);
        console.log("   Due Date Manila:", manilaDueDate);

        const payload = {
            customerName: form.name,
            contact: form.contact,
            serviceId: form.serviceId,
            serviceName: selectedService?.name || "—",
            servicePrice,
            loads: autoCalculate && calculatedLoads > 0 ? calculatedLoads : parseInt(loads),
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
            gcashReference: form.paymentMethod === "GCash" ? form.gcashReference : null,
            change: parseFloat(form.amountGiven || 0) - totalAmount,
            totalPrice: totalAmount,
            // NEW: Include weight and auto-calculation info
            totalWeightKg: totalWeight ? parseFloat(totalWeight) : null,
            autoCalculateLoads: autoCalculate,
            // Use Manila time for dates
            issueDate: manilaIssueDate,
            dueDate: manilaDueDate,
            staffId: localStorage.getItem("staffId") || "Unknown",
        };

        console.log("📝 FINAL PAYLOAD DATES:");
        console.log("   Issue Date:", payload.issueDate);
        console.log("   Due Date:", payload.dueDate);
        console.log("   Auto-calculation:", payload.autoCalculateLoads);
        console.log("   Total Weight:", payload.totalWeightKg);
        console.log("   Calculated Loads:", payload.loads);
        console.log("🕒 ========== DATE DEBUGGING END ==========");

        // Show confirmation dialog instead of submitting immediately
        setPendingPayload(payload);
        setShowConfirmation(true);
    };

    // New function to handle confirmed submission
    const handleConfirmedSubmit = async () => {
        if (!pendingPayload) return;
        
        setShowConfirmation(false);
        
        try {
            await onSubmit(pendingPayload);
        } catch (error) {
            // Extract insufficient stock items from error
            const insufficientItems = extractInsufficientStockItems(error);
            if (insufficientItems.length > 0) {
                setInsufficientStockItems(insufficientItems);
            } else {
                throw error;
            }
        } finally {
            setPendingPayload(null);
        }
    };

    const handleCancelSubmit = () => {
        setShowConfirmation(false);
        setPendingPayload(null);
    };

    return (
        <Card className="rounded-xl border-2 transition-all"
              style={{
                  borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                  backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF'
              }}>
            <CardHeader className="pb-1">
                <CardTitle className="flex items-center gap-2 text-base"
                          style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
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
                        <Label className="mb-1 mt-4 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Name</Label>
                        <Input
                            placeholder="Customer Name"
                            value={form.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            required
                            disabled={isLocked}
                            className="rounded-lg border-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                            style={{
                                borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                                backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                                color: isDarkMode ? '#f1f5f9' : '#0f172a'
                            }}
                        />
                    </div>

                    <div>
                        <Label className="mb-1 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Contact Number</Label>
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
                            className="rounded-lg border-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                            style={{
                                borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                                backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                                color: isDarkMode ? '#f1f5f9' : '#0f172a'
                            }}
                        />
                    </div>

                    {/* 🧼 Service Selection */}
                    <ServiceSelector
                        services={services}
                        serviceId={form.serviceId}
                        onChange={handleServiceChange}
                        isLocked={isLocked}
                    />

                    {/* NEW: Weight Input and Auto-calculation */}
                    <div className="space-y-3 pt-4">
                        <div>
                            <Label className="mb-1 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                Total Weight (kg)
                            </Label>
                            <Input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.1"
                                placeholder="Enter total weight in kg"
                                value={totalWeight}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setTotalWeight(value);
                                    
                                    // Auto-calculate loads when weight changes
                                    if (autoCalculate && value && !isNaN(parseFloat(value))) {
                                        calculateLoadsAutomatically(parseFloat(value));
                                    }
                                }}
                                disabled={isLocked}
                                className="rounded-lg border-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                                style={{
                                    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                                    backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                                    color: isDarkMode ? '#f1f5f9' : '#0f172a'
                                }}
                            />
                        </div>

                        {/* Auto-calculation toggle */}
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="autoCalculate"
                                checked={autoCalculate}
                                onChange={(e) => {
                                    setAutoCalculate(e.target.checked);
                                    if (e.target.checked && totalWeight && !isNaN(parseFloat(totalWeight))) {
                                        calculateLoadsAutomatically(parseFloat(totalWeight));
                                    }
                                }}
                                disabled={isLocked}
                                className="rounded border-2 focus:ring-2 focus:ring-blue-500"
                                style={{
                                    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                                    backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                                }}
                            />
                            <Label htmlFor="autoCalculate" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                Auto-calculate loads from weight
                            </Label>
                        </div>

                        {/* Manual loads input (shown when auto-calculate is off) */}
                        {!autoCalculate && (
                            <div>
                                <Label className="mb-1 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Loads</Label>
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    min="1"
                                    value={loads}
                                    onChange={(e) => {
                                        const raw = e.target.value;
                                        const cleaned = raw.replace(/^0+/, "") || "1";
                                        setLoads(cleaned);
                                    }}
                                    onBlur={(e) => {
                                        const numeric = parseInt(e.target.value, 10);
                                        setLoads(isNaN(numeric) || numeric < 1 ? 1 : numeric);
                                    }}
                                    required
                                    disabled={isLocked}
                                    className="rounded-lg border-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                                    style={{
                                        borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                                        backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                                        color: isDarkMode ? '#f1f5f9' : '#0f172a'
                                    }}
                                />
                            </div>
                        )}

                        {/* Display calculation info */}
                        {machineInfo && autoCalculate && (
                            <div className="text-sm p-2 rounded flex items-center gap-2" style={{ 
                                backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                color: isDarkMode ? '#4ade80' : '#16a34a',
                                border: `1px solid ${isDarkMode ? '#4ade80' : '#16a34a'}`
                            }}>
                                <Calculator size={16} />
                                <div>
                                    <strong>Auto-calculated:</strong> {machineInfo}
                                    {isCalculating && " (Calculating...)"}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 🧺 Supply Source Selector */}
                    <div className="space-y-2 pt-4">
                        <div className="flex items-center gap-2">
                            <Label className="mb-1 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Supply Source</Label>
                            {isDryOnlyService && (
                                <div className="flex items-center gap-1 text-xs" style={{ color: isDarkMode ? '#60a5fa' : '#2563eb' }}>
                                    <Info size={12} />
                                    <span>Auto-set for Dry Only service</span>
                                </div>
                            )}
                        </div>
                        <Select
                            value={supplySource}
                            onValueChange={setSupplySource}
                            disabled={isLocked || isDryOnlyService}
                        >
                            <SelectTrigger className="rounded-lg border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                          style={{
                                              borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                                              backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                                              color: isDarkMode ? '#f1f5f9' : '#0f172a'
                                          }}>
                                <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-2"
                                          style={{
                                              borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                                              backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF'
                                          }}>
                                <SelectItem
                                    value="in-store"
                                    className="cursor-pointer"
                                    style={{
                                        color: isDarkMode ? '#f1f5f9' : '#0f172a'
                                    }}
                                >
                                    In-store
                                </SelectItem>
                                <SelectItem
                                    value="customer"
                                    className="cursor-pointer"
                                    style={{
                                        color: isDarkMode ? '#f1f5f9' : '#0f172a'
                                    }}
                                >
                                    Customer-provided
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {isDryOnlyService && (
                            <div className="text-xs" style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                                Supply source is automatically set to Customer-provided for Dry Only services
                            </div>
                        )}
                    </div>

                    {/* 🧼 Loads + Consumables */}
                    <ConsumablesSection
                        stockItems={stockItems}
                        consumables={consumables}
                        loads={autoCalculate && calculatedLoads > 0 ? calculatedLoads : loads}
                        onLoadsChange={setLoads}
                        onConsumableChange={handleConsumableChange}
                        plasticOverrides={plasticOverrides}
                        setPlasticOverrides={setPlasticOverrides}
                        detergentOverrides={detergentOverrides}
                        setDetergentOverrides={setDetergentOverrides}
                        fabricOverrides={fabricOverrides}
                        setFabricOverrides={setFabricOverrides}
                        supplySource={supplySource}
                        isLocked={isLocked}
                        insufficientStockItems={insufficientStockItems}
                    />

                    {/* 💳 Payment Section */}
                    <PaymentSection
                        paymentMethod={form.paymentMethod}
                        amountGiven={form.amountGiven}
                        totalAmount={totalAmount}
                        onMethodChange={(value) => handleChange("paymentMethod", value)}
                        onAmountChange={(value) => handleChange("amountGiven", value)}
                        isLocked={isLocked}
                        paymentMethods={paymentMethods}
                        gcashReference={form.gcashReference}
                        onGcashReferenceChange={(value) => handleChange("gcashReference", value)}
                    />

                    <Button
                        type="submit"
                        disabled={isSubmitting || isLocked || isCalculating}
                        className="mt-2 w-full rounded-lg px-4 py-2 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 hover:scale-105 transition-transform"
                        style={{
                            backgroundColor: isDarkMode ? '#0f172a' : '#0f172a',
                            color: '#f1f5f9'
                        }}
                    >
                        {isSubmitting ? "Processing..." : 
                         isCalculating ? "Calculating..." : "Save Transaction"}
                    </Button>
                </form>

                {/* Confirmation Dialog */}
                {showConfirmation && pendingPayload && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Backdrop */}
                        <div 
                            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                            onClick={handleCancelSubmit}
                        />
                        
                        {/* Modal Content */}
                        <div className="relative z-50 w-full max-w-md mx-4 rounded-xl border-2 p-6 shadow-xl"
                            style={{
                                borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                                backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                            }}
                        >
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                    Confirm Transaction
                                </h3>
                                <p style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
                                    Please review the transaction details before proceeding:
                                </p>
                            </div>

                            {/* Transaction Summary */}
                            <div className="space-y-3 mb-6 p-4 rounded-lg" 
                                style={{ 
                                    backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.3)' : 'rgba(241, 245, 249, 0.5)',
                                    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
                                }}>
                                <div className="flex justify-between">
                                    <span style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Customer:</span>
                                    <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>{pendingPayload.customerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Contact:</span>
                                    <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>{pendingPayload.contact}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Service:</span>
                                    <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>{pendingPayload.serviceName}</span>
                                </div>
                                {pendingPayload.totalWeightKg && (
                                    <div className="flex justify-between">
                                        <span style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Total Weight:</span>
                                        <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>{pendingPayload.totalWeightKg}kg</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Loads:</span>
                                    <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                                        {pendingPayload.loads} {pendingPayload.autoCalculateLoads ? "(Auto-calculated)" : "(Manual)"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Payment Method:</span>
                                    <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>{pendingPayload.paymentMethod}</span>
                                </div>
                                {pendingPayload.paymentMethod === "GCash" && (
                                    <div className="flex justify-between">
                                        <span style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>GCash Reference:</span>
                                        <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>{pendingPayload.gcashReference}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-semibold pt-2 border-t" 
                                    style={{ borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
                                    <span style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Total Amount:</span>
                                    <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>₱{pendingPayload.totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Amount Given:</span>
                                    <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>₱{pendingPayload.amountGiven.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>Change:</span>
                                    <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>₱{pendingPayload.change.toFixed(2)}</span>
                                </div>
                                {/* Date Information */}
                                <div className="pt-2 border-t" style={{ borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
                                    <div className="text-xs" style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                                        <div>Issue Date: {new Date(pendingPayload.issueDate).toLocaleString()}</div>
                                        <div>Due Date: {new Date(pendingPayload.dueDate).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleCancelSubmit}
                                    style={{
                                        borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                                        color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmedSubmit}
                                    style={{
                                        backgroundColor: isDarkMode ? '#0f172a' : '#0f172a',
                                        color: '#f1f5f9'
                                    }}
                                >
                                    Confirm & Proceed
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
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