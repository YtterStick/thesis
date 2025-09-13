import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Wallet, Smartphone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Switch from "./Switch"; // Import your custom Switch

const PaymentMethodsPage = () => {
    const { toast } = useToast();
    const [gcashEnabled, setGcashEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchPaymentSettings();
    }, []);

    const fetchPaymentSettings = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("authToken");

            // Simulate API call - replace with your actual backend endpoint
            const response = await fetch("http://localhost:8080/api/payment-settings", {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setGcashEnabled(data.gcashEnabled);
            } else {
                // Fallback if API is not available
                setGcashEnabled(true);
            }
        } catch (error) {
            console.error("Error fetching payment settings:", error);
            // Fallback if API call fails
            setGcashEnabled(true);
            toast({
                title: "Error",
                description: "Failed to load payment settings",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleGcash = async () => {
        try {
            setIsUpdating(true);
            const token = localStorage.getItem("authToken");
            const newStatus = !gcashEnabled;

            // Simulate API call - replace with your actual backend endpoint
            const response = await fetch("http://localhost:8080/api/payment-settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ gcashEnabled: newStatus }),
            });

            if (response.ok) {
                setGcashEnabled(newStatus);
                toast({
                    title: "Success",
                    description: `GCash has been ${newStatus ? "enabled" : "disabled"}`,
                });
            } else {
                throw new Error("Failed to update payment settings");
            }
        } catch (error) {
            console.error("Error updating payment settings:", error);
            toast({
                title: "Error",
                description: "Failed to update GCash setting",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Payment Methods</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">Manage available payment methods for customers</p>
            </div>

            <Card className="border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                <CardHeader className="rounded-t-lg bg-slate-100 dark:bg-slate-800">
                    <CardTitle className="text-slate-900 dark:text-slate-50">Available Payment Methods</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                        Cash is always available. GCash can be enabled or disabled.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="flex items-center justify-center text-slate-600 dark:text-slate-400">
                                <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                                <span>Loading settings...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {/* Cash (always enabled, no toggle) */}
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center space-x-4">
                                    <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                                        <Wallet className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900 dark:text-slate-100">Cash</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Pay with physical cash</p>
                                    </div>
                                </div>
                                <Badge variant="default">Enabled</Badge>
                            </div>

                            {/* GCash (toggleable) */}
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center space-x-4">
                                    <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                                        <Smartphone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-900 dark:text-slate-100">GCash</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Pay via GCash mobile wallet</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    {isUpdating ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="gcash-toggle"
                                                checked={gcashEnabled}
                                                onChange={handleToggleGcash}
                                            />
                                            <Label
                                                htmlFor="gcash-toggle"
                                                className="sr-only"
                                            >
                                                Toggle GCash
                                            </Label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentMethodsPage;
