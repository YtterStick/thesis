import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QRCode from "react-qr-code";
import { ScrollText } from "lucide-react";
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

export default function InvoiceSettingsPage() {
  const { toast } = useToast();

  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  const detergentQty = 2;
  const fabricQty = 1;
  const plasticQty = 1;
  const invoiceNumber = "INV-2025-00123";
  const issueDate = "Aug 12, 2025";
  const dueDate = "Aug 19, 2025";
  const customerName = "Andrei Dilag";
  const sampleInvoiceId = "inv123";

  const fetchSettings = async () => {
    try {
      const data = await secureFetch("/invoice-settings");
      setStoreName(data.storeName || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setFooterNote(data.footerNote || "");
      setTrackingUrl(data.trackingUrl || "");
    } catch (error) {
      console.error("Failed to fetch invoice settings:", error.message);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      const payload = { storeName, address, phone, footerNote, trackingUrl };
      const result = await secureFetch("/invoice-settings", "POST", payload);
      console.log("✅ Save response:", result);

      toast({
        title: "Saved",
        description: "Invoice settings updated successfully.",
      });

      await fetchSettings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save invoice settings.",
        variant: "destructive",
      });
      console.error("Save error:", error.message);
    }
  };

  const previewTrackingLink = trackingUrl.includes("{id}")
    ? trackingUrl.replace("{id}", sampleInvoiceId)
    : trackingUrl;

  return (
    <main className="relative px-6 pb-6 pt-4 space-y-6">
      {/* 🧾 Header */}
      <div className="flex items-center gap-2">
        <ScrollText className="w-6 h-6 text-[#00B7C2] dark:text-[#00B7C2]" />
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          Invoice Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 🛠️ Settings Form */}
        <Card className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-md h-[560px] flex flex-col justify-between">
          <CardHeader className="pb-1">
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">
              🛠️ Configure Invoice
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

        {/* 🧾 Invoice Preview */}
        <Card className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-md h-[560px] flex flex-col">
          <CardHeader className="pb-1">
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">
              🧾 Invoice Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-950 font-mono text-sm space-y-2 border border-dashed rounded-md dark:border-gray-600 print:border-gray-300 print:text-black p-4">
              <div className="text-center font-bold text-lg dark:text-white">{storeName || "Store Name"}</div>
              <div className="text-center dark:text-gray-300">{address || "Store Address"}</div>
              <div className="text-center dark:text-gray-300">{phone || "Phone Number"}</div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600 print:border-gray-300" />

              <div className="flex justify-between mt-2 text-xs dark:text-gray-300">
                <span>Invoice #: {invoiceNumber}</span>
                <span>Issued: {issueDate}</span>
              </div>
              <div className="flex justify-between text-xs dark:text-gray-300">
                <span>Due: {dueDate}</span>
                <span className="text-red-600 dark:text-red-500 font-bold uppercase">Unpaid</span>
              </div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600 print:border-gray-300" />

              <div className="text-sm dark:text-white">
                <span>Customer: {customerName}</span>
              </div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600 print:border-gray-300" />

                            <div className="space-y-1 dark:text-white">
                <div className="flex justify-between">
                  <span>Wash & Dry (3 Loads)</span>
                  <span>₱150.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Detergent ({detergentQty} pcs)</span>
                  <span>₱20.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Fabric Softener ({fabricQty} pc)</span>
                  <span>₱10.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Plastic ({plasticQty} pc)</span>
                  <span>₱0.00</span>
                </div>
              </div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600 print:border-gray-300" />

              <div className="flex justify-between dark:text-white">
                <span>Subtotal</span>
                <span>₱180.00</span>
              </div>
              <div className="flex justify-between dark:text-white">
                <span>Tax (0%)</span>
                <span>₱0.00</span>
              </div>
              <div className="flex justify-between font-bold dark:text-white">
                <span>Total</span>
                <span>₱180.00</span>
              </div>

              <div className="flex justify-center mt-3 print:hidden">
                <QRCode value={previewTrackingLink} size={64} />
              </div>
              <div className="text-center mt-1 text-xs dark:text-gray-300 print:hidden">
                Scan to track your laundry status
              </div>
              <div className="text-center mt-2 text-xs dark:text-gray-300">
                {footerNote || "Thank you for your business!"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}