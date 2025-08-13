import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QRCode from "react-qr-code";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

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

  const getAxiosWithAuth = () => {
    const token = localStorage.getItem("token");
    return axios.create({
      baseURL: "http://localhost:8080/api",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const fetchSettings = async () => {
    try {
      const res = await getAxiosWithAuth().get("/receipt-settings");
      const data = res.data;
      setStoreName(data.storeName || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setFooterNote(data.footerNote || "");
      setTrackingUrl(data.trackingUrl || "");
    } catch (error) {
      console.error("Failed to fetch receipt settings:", error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      const payload = {
        storeName,
        address,
        phone,
        footerNote,
        trackingUrl,
      };
      await getAxiosWithAuth().post("/receipt-settings", payload);
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
      console.error("Save error:", error);
    }
  };

  const previewTrackingLink = trackingUrl.includes("{id}")
    ? trackingUrl.replace("{id}", sampleReceiptItem.id)
    : trackingUrl;

  return (
    <main className="relative p-6">
      {/* 🧾 Admin Header */}
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-6 h-6 text-[#3DD9B6]" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Receipt Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 🛠️ Editable Settings Form */}
        <Card className="card bg-slate-100 dark:bg-slate-950 shadow-md h-[560px] flex flex-col justify-between">
          <CardHeader className="pb-1">
            <CardTitle className="text-slate-900 dark:text-slate-50 text-base">
              🛠️ Receipt Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm px-6">
            <div>
              <Label>Store Name</Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Footer Note</Label>
              <Input value={footerNote} onChange={(e) => setFooterNote(e.target.value)} />
            </div>
            <div>
              <Label>Tracking URL</Label>
              <Input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
            </div>
          </CardContent>

          <div className="flex justify-end px-6 pb-4">
            <Button
              onClick={handleSave}
              className="bg-[#3DD9B6] text-white hover:bg-[#2fc3a4] dark:bg-[#007362] dark:hover:bg-[#00564e] shadow-md transition-transform hover:scale-105"
            >
              Save Settings
            </Button>
          </div>
        </Card>

        {/* 🧾 Receipt Preview (Staff-style layout) */}
        <Card className="card bg-slate-100 dark:bg-slate-950 shadow-md print:border-none print:bg-white h-[560px] flex flex-col">
          <CardHeader className="pb-1">
            <CardTitle className="text-slate-900 dark:text-slate-50 text-base">
              🧾 Receipt Preview
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 overflow-y-auto">
            <div className="bg-slate-100 dark:bg-slate-950 border border-gray-300 dark:border-gray-600 rounded-md p-4 font-mono text-sm space-y-2 print:text-black print:border-gray-300">
              {/* 🏪 Store Info */}
              <div className="text-center font-bold text-lg dark:text-white">{storeName}</div>
              <div className="text-center dark:text-gray-300">{address}</div>
              <div className="text-center dark:text-gray-300">{phone}</div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

              {/* 📄 Receipt Meta */}
              <div className="grid grid-cols-2 gap-1 dark:text-white">
                <div>Receipt #: <span className="font-bold">{sampleReceiptItem.id}</span></div>
                <div className="text-right">Date: <span className="font-bold">{sampleReceiptItem.createdAt}</span></div>
                <div>Customer: <span className="font-bold">{sampleReceiptItem.customerName}</span></div>
                <div className="text-right">Staff: <span className="font-bold">{sampleReceiptItem.staffName}</span></div>
                <div>Payment: <span className="font-bold">{sampleReceiptItem.paymentMethod}</span></div>
              </div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

              {/* 🧼 Service Breakdown */}
              <div className="space-y-1 dark:text-white">
                <div className="flex justify-between"><span>Detergents × {sampleReceiptItem.detergentQty}</span><span>₱{(sampleReceiptItem.detergentQty * 30).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Fabric Softeners × {sampleReceiptItem.fabricQty}</span><span>₱{(sampleReceiptItem.fabricQty * 30).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Plastic × {sampleReceiptItem.plasticQty}</span><span>₱{(sampleReceiptItem.plasticQty * 10).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Wash & Dry × {sampleReceiptItem.loads}</span><span>₱{(sampleReceiptItem.loads * 50).toFixed(2)}</span></div>
              </div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />

              {/* 💰 Totals */}
              <div className="flex justify-between font-bold dark:text-white">
                <span>Total</span>
                <span>₱{sampleReceiptItem.total.toFixed(2)}</span>
              </div>

              {/* 📱 QR Code */}
              <div className="flex justify-center mt-3 print:hidden">
                <QRCode value={previewTrackingLink} size={64} />
              </div>
              <div className="text-center mt-1 text-xs dark:text-gray-300 print:hidden">
                Scan to track your laundry status
              </div>

              {/* 📝 Footer Note */}
              <div className="text-center mt-2 dark:text-gray-300">{footerNote}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}