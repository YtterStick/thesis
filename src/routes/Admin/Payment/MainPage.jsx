import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, Edit, Plus, Trash2, CreditCard, Smartphone, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PaymentMethodsPage = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [newMethod, setNewMethod] = useState({
    name: "",
    type: "digital", // 'cash' or 'digital'
    isEnabled: true,
    accountNumber: "",
    accountName: "",
    qrCode: "",
    feePercentage: 0,
    requiresConfirmation: false
  });
  const { toast } = useToast();

  // Sample initial data
  const initialMethods = [
    {
      id: 1,
      name: "Cash",
      type: "cash",
      isEnabled: true,
      isStatic: true,
      icon: "💰",
      description: "Pay with physical cash"
    },
    {
      id: 2,
      name: "GCash",
      type: "digital",
      isEnabled: true,
      isStatic: true,
      accountNumber: "09123456789",
      accountName: "StarWash Laundry",
      qrCode: "",
      feePercentage: 2.5,
      requiresConfirmation: true,
      icon: "📱",
      description: "Pay via GCash mobile wallet"
    }
  ];

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      // Simulate API call - replace with actual API endpoint
      setTimeout(() => {
        setPaymentMethods(initialMethods);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load payment methods", variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleToggleMethod = async (methodId) => {
    try {
      const updatedMethods = paymentMethods.map(method =>
        method.id === methodId ? { ...method, isEnabled: !method.isEnabled } : method
      );
      setPaymentMethods(updatedMethods);

      // Simulate API call to update status
      // await fetch(`/api/payment-methods/${methodId}/toggle`, { method: 'PATCH' });

      toast({
        title: "Success",
        description: "Payment method updated successfully",
      });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to update payment method", variant: "destructive" });
    }
  };

  const handleSaveMethod = async () => {
    try {
      if (!newMethod.name.trim()) {
        toast({ title: "Error", description: "Please enter a payment method name", variant: "destructive" });
        return;
      }

      if (editingMethod) {
        // Update existing method
        const updatedMethods = paymentMethods.map(method =>
          method.id === editingMethod.id ? { ...editingMethod, ...newMethod } : method
        );
        setPaymentMethods(updatedMethods);
        toast({
          title: "Success",
          description: "Payment method updated successfully",
        });
      } else {
        // Add new method
        const newMethodWithId = {
          ...newMethod,
          id: Date.now(),
          isStatic: false,
          icon: newMethod.type === "cash" ? "💰" : "💳"
        };
        setPaymentMethods([...paymentMethods, newMethodWithId]);
        toast({
          title: "Success",
          description: "Payment method added successfully",
        });
      }

      setShowAddDialog(false);
      setEditingMethod(null);
      setNewMethod({
        name: "",
        type: "digital",
        isEnabled: true,
        accountNumber: "",
        accountName: "",
        qrCode: "",
        feePercentage: 0,
        requiresConfirmation: false
      });

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save payment method", variant: "destructive" });
    }
  };

  const handleEditMethod = (method) => {
    if (method.isStatic && method.name === "Cash") {
      toast({ title: "Info", description: "Cash payment method cannot be edited" });
      return;
    }

    setEditingMethod(method);
    setNewMethod({
      name: method.name,
      type: method.type,
      isEnabled: method.isEnabled,
      accountNumber: method.accountNumber || "",
      accountName: method.accountName || "",
      qrCode: method.qrCode || "",
      feePercentage: method.feePercentage || 0,
      requiresConfirmation: method.requiresConfirmation || false
    });
    setShowAddDialog(true);
  };

  const handleDeleteMethod = async (methodId) => {
    try {
      if (paymentMethods.find(m => m.id === methodId)?.isStatic) {
        toast({ title: "Error", description: "Static payment methods cannot be deleted", variant: "destructive" });
        return;
      }

      const updatedMethods = paymentMethods.filter(method => method.id !== methodId);
      setPaymentMethods(updatedMethods);

      // Simulate API call to delete
      // await fetch(`/api/payment-methods/${methodId}`, { method: 'DELETE' });

      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to delete payment method", variant: "destructive" });
    }
  };

  const getMethodIcon = (type) => {
    switch (type) {
      case "cash": return <Wallet className="h-5 w-5" />;
      case "digital": return <Smartphone className="h-5 w-5" />;
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

  const getMethodBadgeVariant = (isEnabled) => {
    return isEnabled ? "default" : "secondary";
  };

  const getMethodBadgeText = (isEnabled) => {
    return isEnabled ? "Enabled" : "Disabled";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Payment Methods</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Manage available payment methods for customers</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingMethod(null);
            setNewMethod({
              name: "",
              type: "digital",
              isEnabled: true,
              accountNumber: "",
              accountName: "",
              qrCode: "",
              feePercentage: 0,
              requiresConfirmation: false
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-slate-50">
                {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                {editingMethod ? "Update the payment method details" : "Add a new payment method for customers"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-700 dark:text-muted-foreground">Method Name *</Label>
                <Input
                  value={newMethod.name}
                  onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                  placeholder="e.g., PayPal, Bank Transfer"
                  className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <Label className="text-slate-700 dark:text-muted-foreground">Method Type</Label>
                <select
                  value={newMethod.type}
                  onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="digital">Digital Payment</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              {newMethod.type === "digital" && (
                <>
                  <div>
                    <Label className="text-slate-700 dark:text-muted-foreground">Account Number</Label>
                    <Input
                      value={newMethod.accountNumber}
                      onChange={(e) => setNewMethod({ ...newMethod, accountNumber: e.target.value })}
                      placeholder="Account number or phone number"
                      className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-700 dark:text-muted-foreground">Account Name</Label>
                    <Input
                      value={newMethod.accountName}
                      onChange={(e) => setNewMethod({ ...newMethod, accountName: e.target.value })}
                      placeholder="Account holder name"
                      className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-700 dark:text-muted-foreground">Transaction Fee (%)</Label>
                    <Input
                      type="number"
                      value={newMethod.feePercentage}
                      onChange={(e) => setNewMethod({ ...newMethod, feePercentage: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      min="0"
                      max="10"
                      step="0.1"
                      className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newMethod.requiresConfirmation}
                      onCheckedChange={(checked) => setNewMethod({ ...newMethod, requiresConfirmation: checked })}
                    />
                    <Label className="text-slate-700 dark:text-muted-foreground">Requires manual confirmation</Label>
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newMethod.isEnabled}
                  onCheckedChange={(checked) => setNewMethod({ ...newMethod, isEnabled: checked })}
                />
                <Label className="text-slate-700 dark:text-muted-foreground">Enable this payment method</Label>
              </div>

              <Button onClick={handleSaveMethod} className="w-full bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-600 text-white">
                <Save className="h-4 w-4 mr-2" />
                {editingMethod ? "Update Method" : "Add Method"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-100 dark:bg-slate-800 rounded-t-lg">
          <CardTitle className="text-slate-900 dark:text-slate-50">Available Payment Methods</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Manage which payment methods are available to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-sm">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center text-slate-600 dark:text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                  <span className="ml-3">Loading payment methods...</span>
                </div>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                  <CreditCard className="h-12 w-12 mb-4 text-slate-400" />
                  <p className="text-lg font-medium">No payment methods configured</p>
                  <p className="text-sm">Add your first payment method to get started</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                        {getMethodIcon(method.type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100">
                            {method.name}
                          </h3>
                          {method.isStatic && (
                            <Badge variant="outline" className="text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {method.description || (method.type === 'cash' ? 'Cash payment' : 'Digital payment')}
                        </p>
                        {method.type === 'digital' && method.accountNumber && (
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            Account: {method.accountNumber}
                            {method.feePercentage > 0 && ` • ${method.feePercentage}% fee`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Badge variant={getMethodBadgeVariant(method.isEnabled)}>
                        {getMethodBadgeText(method.isEnabled)}
                      </Badge>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={method.isEnabled}
                          onCheckedChange={() => handleToggleMethod(method.id)}
                          disabled={method.isStatic && method.name === "Cash"}
                        />
                        
                        {!method.isStatic && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMethod(method)}
                              className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMethod(method.id)}
                              className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentMethodsPage;