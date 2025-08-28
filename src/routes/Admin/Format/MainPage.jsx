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
  return contentType && contentType.includes("application/json")
    ? response.json()
    : response.text();
};

export default function MainPage() {
  const { toast } = useToast();

  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [activePreview, setActivePreview] = useState("invoice");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await secureFetch("/format-settings");
        setStoreName(data.storeName || "");
        setAddress(data.address || "");
        setPhone(data.phone || "");
        setFooterNote(data.footerNote || "");
        setTrackingUrl(data.trackingUrl || "");
      } catch (err) {
        console.error("Failed to fetch format settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      const payload = { storeName, address, phone, footerNote, trackingUrl };
      await secureFetch("/format-settings", "POST", payload);
      toast({ title: "Saved", description: "Format settings updated successfully." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    }
  };

  const sampleData = {
    id: "TXN-00123",
    createdAt: "Aug 21, 2025 10:45 AM",
    customerName: "Andrei",
    staffName: "Sheena",
    detergentQty: 2,
    fabricQty: 1,
    plasticQty: 1,
    loads: 3,
    total: 180.0,
    paymentMethod: "Cash",
  };

  const previewTrackingLink = trackingUrl.includes("{id}")
    ? trackingUrl.replace("{id}", sampleData.id)
    : trackingUrl;

  const formattedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const renderPreview = () => (
    <div className="bg-white dark:bg-slate-950 font-mono text-sm space-y-2 border border-dashed rounded-md dark:border-gray-600 print:border-gray-300 p-4">
      <div className="text-center font-bold text-lg dark:text-white">{storeName || "Store Name"}</div>
      <div className="text-center dark:text-gray-300">{address || "Store Address"}</div>
      <div className="text-center dark:text-gray-300">{phone || "Phone Number"}</div>

      <hr className="my-2 border-gray-300 dark:border-gray-600" />

      <div className="grid grid-cols-2 gap-1 text-xs dark:text-gray-300">
        <div>
          {activePreview === "invoice" ? "Service Invoice #:" : "Receipt #:"}{" "}
          <span className="font-bold">{sampleData.id}</span>
        </div>
        <div className="text-right">
          Date: <span className="font-bold">{sampleData.createdAt}</span>
        </div>
        <div>
          Customer: <span className="font-bold">{sampleData.customerName}</span>
        </div>
        <div className="text-right">
          Staff: <span className="font-bold">{sampleData.staffName}</span>
        </div>
        <div>
          Payment: <span className="font-bold">{sampleData.paymentMethod}</span>
        </div>
        {activePreview === "invoice" && (
          <div className="col-span-2 flex justify-between">
            <span>Due Date to Claim:</span>
            <span className="font-bold text-red-600">{formattedDueDate}</span>
          </div>
        )}
      </div>

      <hr className="my-2 border-gray-300 dark:border-gray-600" />

      <div className="space-y-1 dark:text-white">
        <div className="flex justify-between">
          <span>Detergents × {sampleData.detergentQty}</span>
          <span>₱{(sampleData.detergentQty * 30).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Fabric Softeners × {sampleData.fabricQty}</span>
          <span>₱{(sampleData.fabricQty * 30).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Plastic × {sampleData.plasticQty}</span>
          <span>₱{(sampleData.plasticQty * 10).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Wash & Dry × {sampleData.loads}</span>
          <span>₱{(sampleData.loads * 50).toFixed(2)}</span>
        </div>
      </div>

      <hr className="my-2 border-gray-300 dark:border-gray-600" />

      <div className="flex justify-between font-bold dark:text-white">
        <span>Total</span>
        <span>₱{sampleData.total.toFixed(2)}</span>
      </div>

      <div className="flex justify-center mt-3 print:hidden">
        <QRCode value={previewTrackingLink} size={64} />
      </div>
      <div className="text-center mt-1 text-xs dark:text-gray-300 print:hidden">
        Scan to track your laundry status
      </div>

      {activePreview === "invoice" && (
        <>
          <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />
          <div className="text-xs text-slate-600 dark:text-gray-300 mt-2">
            <strong className="block mb-1 text-sm text-slate-700 dark:text-slate-200">
              Terms & Conditions
            </strong>
            <p>
              Laundry must be claimed within 7 days. Unclaimed items may be subject to disposal or storage fees.
              Please retain your invoice for verification.
            </p>
          </div>
        </>
      )}

      <div className="text-center mt-2 text-xs dark:text-gray-300">
        {footerNote || "Thank you for choosing our service!"}
      </div>
    </div>
  );

  return (
    <main className="relative px-6 pb-6 pt-4 space-y-6">
      <div className="flex items-center gap-2">
        <ScrollText className="w-6 h-6 text-[#00B7C2]" />
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          Receipts & Invoice Format
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-md h-[560px] flex flex-col justify-between">
          <CardHeader className="pb-1">
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">
              🛠️ Document Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm px-6">
            {[{ label: "Store Name", value: storeName, setter: setStoreName },
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

        <Card className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-md h-[560px] flex flex-col">
          <CardHeader className="pb-1">
            <CardTitle className="text-base flex justify-between items-center text-slate-900 dark:text-slate-50">
              <span>📄 Preview</span>
              <div className="space-x-2">
                <Button
                  onClick={() => setActivePreview("invoice")}
                  className={`text-xs px-3 py-1 transition-colors ${
                    activePreview === "invoice"
                      ? "bg-[#00B7C2] text-white hover:bg-[#0097A6] dark:bg-[#007A8C] dark:hover:bg-[#005F6B]"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Service Invoice
                </Button>
                <Button
                  onClick={() => setActivePreview("receipt")}
                  className={`text-xs px-3 py-1 transition-colors ${
                    activePreview === "receipt"
                      ? "bg-[#00B7C2] text-white hover:bg-[#0097A6] dark:bg-[#007A8C] dark:hover:bg-[#005F6B]"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Receipt
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto">
            {renderPreview()}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}