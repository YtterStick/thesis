import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QRCode from "react-qr-code";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ALLOWED_SKEW_MS = 5000;

const isTokenExpired = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp * 1000;
    const now = Date.now();
    return exp + ALLOWED_SKEW_MS < now;
  } catch (err) {
    console.warn("❌ Failed to decode token:", err);
    return true;
  }
};

const secureFetch = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem("authToken");

  if (!token || isTokenExpired(token)) {
    console.warn("⛔ Token expired. Redirecting to login.");
    window.location.href = "/login";
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`http://localhost:8080/api${endpoint}`, options);

  if (!response.ok) {
    console.error(`❌ ${method} ${endpoint} failed:`, response.status);
    throw new Error(`Request failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  } else {
    return response.text(); // fallback for plain string responses
  }
};

export default function ReceiptSettingsPage() {
  const { toast } = useToast();

  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  const sampleReceiptItem = {
    id: "abc123",
    customerName: "Andrei",
    detergentQty: 2,
    fabricQty: 1,
    plasticQty: 1,
    loads: 3,
    total: 180.0,
    paymentMethod: "Cash",
    createdAt: "Aug 12, 2025 10:45 AM",
    staffName: "Sheena",
  };

  const fetchSettings = async () => {
    try {
      const data = await secureFetch("/receipt-settings");
      setStoreName(data.storeName || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setFooterNote(data.footerNote || "");
      setTrackingUrl(data.trackingUrl || "");
    } catch (error) {
      console.error("Failed to fetch receipt settings:", error.message);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      const payload = { storeName, address, phone, footerNote, trackingUrl };
      const result = await secureFetch("/receipt-settings", "POST", payload);
      console.log("✅ Save response:", result);

      toast({
        title: "Saved",
        description: "Receipt settings updated successfully.",
      });

      await fetchSettings(); // Refresh preview
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save receipt settings.",
        variant: "destructive",
      });
      console.error("Save error:", error.message);
    }
  };

  const previewTrackingLink = trackingUrl.includes("{id}")
    ? trackingUrl.replace("{id}", sampleReceiptItem.id)
    : trackingUrl;

  return (
    <main className="relative px-6 pb-6 pt-4 space-y-6">
      {/* 🧾 Admin Header */}
      <div className="flex items-center gap-2">
        <Settings className="w-6 h-6 text-[#00B7C2] dark:text-[#00B7C2]" />
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          Receipt Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 🛠️ Editable Settings Form */}
        <Card className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-md h-[560px] flex flex-col justify-between">
          <CardHeader className="pb-1">
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">
              🛠️ Receipt Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm px-6">
            {[
              { label: "Store Name", value: storeName, setter: setStoreName },
              { label: "Address", value: address, setter: setAddress },
              { label: "Phone Number", value: phone, setter: setPhone },
              { label: "Footer Note", value: footerNote, setter: setFooterNote },
              { label: "Tracking URL", value: trackingUrl, setter: setTrackingUrl },
            ].map(({ label, value, setter }, i) => (
              <div key={i} className="space-y-1">
                <Label className="text-slate-700 dark:text-slate-300">{label}</Label>
                <Input
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  aria-label={label}
                  className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7C2] dark:focus-visible:ring-[#00B7C2] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
                />
              </div>
            ))}
          </CardContent>
          <div className="flex justify-end px-6 pb-4">
            <Button
              onClick={handleSave}
              className="bg-[#00B7C2] text-white hover:bg-[#0097A6] dark:bg-[#007A8C] dark:hover:bg-[#005F6B] shadow-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7C2] dark:focus-visible:ring-[#00B7C2] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
            >
              Save Settings
            </Button>
          </div>
        </Card>

        {/* 🧾 Receipt Preview */}
        <Card className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-md h-[560px] flex flex-col">
          <CardHeader className="pb-1">
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">
              🧾 Receipt Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-950 border border-gray-300 dark:border-gray-600 rounded-md p-4 font-mono text-sm space-y-2 print:text-black print:border-gray-300">
              <div className="text-center font-bold text-lg dark:text-white">{storeName || "Store Name"}</div>
              <div className="text-center dark:text-gray-300">{address || "Store Address"}</div>
              <div className="text-center dark:text-gray-300">{phone || "Phone Number"}</div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

              <div className="grid grid-cols-2 gap-1 dark:text-white">
                <div>Receipt #: <span className="font-bold">{sampleReceiptItem.id}</span></div>
                <div className="text-right">Date: <span className="font-bold">{sampleReceiptItem.createdAt}</span></div>
                <div>Customer: <span className="font-bold">{sampleReceiptItem.customerName}</span></div>
                <div className="text-right">Staff: <span className="font-bold">{sampleReceiptItem.staffName}</span></div>
                <div>Payment: <span className="font-bold">{sampleReceiptItem.paymentMethod}</span></div>
              </div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

              <div className="space-y-1 dark:text-white">
                                <div className="flex justify-between">
                  <span>Detergents × {sampleReceiptItem.detergentQty}</span>
                  <span>₱{(sampleReceiptItem.detergentQty * 30).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fabric Softeners × {sampleReceiptItem.fabricQty}</span>
                  <span>₱{(sampleReceiptItem.fabricQty * 30).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plastic × {sampleReceiptItem.plasticQty}</span>
                  <span>₱{(sampleReceiptItem.plasticQty * 10).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Wash & Dry × {sampleReceiptItem.loads}</span>
                  <span>₱{(sampleReceiptItem.loads * 50).toFixed(2)}</span>
                </div>
              </div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

              <div className="flex justify-between font-bold dark:text-white">
                <span>Total</span>
                <span>₱{sampleReceiptItem.total.toFixed(2)}</span>
              </div>

              <div className="flex justify-center mt-3 print:hidden">
                <QRCode value={previewTrackingLink} size={64} />
              </div>
              <div className="text-center mt-1 text-xs text-slate-600 dark:text-gray-300 print:hidden">
                Scan to track your laundry status
              </div>
              <div className="text-center mt-2 text-xs text-slate-600 dark:text-gray-300">
                {footerNote || "Thank you for choosing our service!"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}