import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Switch from "./Switch";

const PaymentMethodsPage = () => {
  const { toast } = useToast();
  const [gcashEnabled, setGcashEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE_URL = "http://localhost:8080/api"; // Adjust to your Spring Boot port

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/payment-methods`);
      if (response.ok) {
        const data = await response.json();
        // Assuming your API returns an array of payment methods
        const gcashMethod = data.find(method => method.name === "GCASH");
        if (gcashMethod) {
          setGcashEnabled(gcashMethod.enabled);
        }
      } else {
        throw new Error("Failed to fetch payment methods");
      }
    } catch (error) {
      console.error(error);
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
      const newStatus = !gcashEnabled;
      // Optimistic UI update
      setGcashEnabled(newStatus);
      
      const response = await fetch(`${API_BASE_URL}/payment-methods/GCASH`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update GCash setting");
      }

      toast({
        title: "Success",
        description: `GCash has been ${newStatus ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      console.error(error);
      // Revert on error
      setGcashEnabled(!gcashEnabled);
      toast({
        title: "Error",
        description: "Failed to update GCash setting",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Payment Methods
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manage available payment methods for customers
        </p>
      </div>

      <Card className="shadow-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-100 dark:bg-slate-800 rounded-t-lg">
          <CardTitle className="text-slate-900 dark:text-slate-50">
            Available Payment Methods
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Cash is always available. GCash can be enabled or disabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center text-slate-600 dark:text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                <span className="ml-3">Loading settings...</span>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {/* Cash (always enabled, no toggle) */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">
                      Cash
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Pay with physical cash
                    </p>
                  </div>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>

              {/* GCash (toggleable) */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">
                      GCash
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Pay via GCash mobile wallet
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={gcashEnabled ? "default" : "secondary"}>
                    {gcashEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Switch 
                    checked={gcashEnabled} 
                    onChange={handleToggleGcash}
                    disabled={isLoading}
                  />
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