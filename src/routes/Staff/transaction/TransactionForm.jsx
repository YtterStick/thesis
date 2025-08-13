import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PaymentSection from "./PaymentSection";

const TransactionForm = ({ onSubmit }) => {
  const [form, setForm] = useState({
    transactionId: "",
    name: "",
    contact: "",
    serviceId: "",
    loads: 1,
    paymentStatus: "Unpaid",
    amountGiven: "",
  });

  const [consumables, setConsumables] = useState({});
  const [services, setServices] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const { toast } = useToast();

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
        const safeItems = Array.isArray(data) ? data : data.items ?? [];
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

  // ✅ Calculate totalAmount before render
  const selectedService = services.find((s) => s.id === form.serviceId);
  const serviceTotal = selectedService ? selectedService.price * form.loads : 0;

  const consumablesTotal = Object.entries(consumables).reduce((sum, [name, qty]) => {
    const item = stockItems.find((i) => i.name === name);
    return sum + (item?.price || 0) * qty;
  }, 0);

  const totalAmount = serviceTotal + consumablesTotal;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.contact ||
      !form.serviceId ||
      form.loads < 1
    ) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (
      form.paymentStatus === "Paid" &&
      parseFloat(form.amountGiven || 0) < totalAmount
    ) {
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
      const change =
        form.paymentStatus === "Paid"
          ? parseFloat(form.amountGiven || 0) - transaction.totalPrice
          : 0;

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

  const nonPlasticItems = stockItems.filter(
    (item) => !item.name.toLowerCase().includes("plastic")
  );
  const chunkedConsumables = [];
  for (let i = 0; i < nonPlasticItems.length; i += 2) {
    chunkedConsumables.push(nonPlasticItems.slice(i, i + 2));
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base text-slate-800 dark:text-slate-100">
          <Receipt size={18} />
          New Transaction
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 px-6 pb-6 text-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {/* 👤 Customer Info */}
            <div>
              <Label className="mb-1 block">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label className="mb-1 block">Contact Number</Label>
              <Input
                value={form.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
                required
              />
            </div>

            {/* 🧼 Service Selection */}
            <div>
              <Label className="mb-1 block">Service Type</Label>
              <Select
                value={form.serviceId}
                onValueChange={(value) => handleChange("serviceId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
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
                  min={1}
                  value={form.loads}
                  onChange={(e) =>
                    handleChange("loads", parseInt(e.target.value) || 1)
                  }
                  required
                />
              </div>

              {stockItems
                .filter((item) =>
                  item.name.toLowerCase().includes("plastic")
                )
                .map((item) => (
                  <div key={item.id}>
                    <Label className="mb-1 block">{item.name}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={consumables[item.name] || 0}
                      onChange={(e) =>
                        handleConsumableChange(item.name, e.target.value)
                      }
                    />
                  </div>
                ))}
            </div>

                      {/* 🧼 Other Consumables */}
            {chunkedConsumables.map((pair, index) => (
              <div key={index} className="grid grid-cols-2 gap-4">
                {pair.map((item) => (
                  <div key={item.id}>
                    <Label className="mb-1 block">{item.name}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={consumables[item.name] || 0}
                      onChange={(e) =>
                        handleConsumableChange(item.name, e.target.value)
                      }
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
              onStatusChange={(value) => handleChange("paymentStatus", value)}
              onAmountChange={(value) => handleChange("amountGiven", value)}
            />
          </div>

          <Button
            type="submit"
            className="mt-2 w-full bg-[#3DD9B6] text-white hover:bg-[#2fc3a4]"
          >
            Save Transaction
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

TransactionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default TransactionForm;