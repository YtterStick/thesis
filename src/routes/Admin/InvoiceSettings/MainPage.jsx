import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QRCode from "react-qr-code";
import { ScrollText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function InvoiceSettingsPage() {
  const { toast } = useToast();

  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  // 🧪 Static preview data
  const detergentQty = 2;
  const fabricQty = 1;
  const plasticQty = 1;
  const invoiceNumber = "INV-2025-00123";
  const issueDate = "Aug 12, 2025";
  const dueDate = "Aug 19, 2025";
  const customerName = "Andrei Dilag";

  const sampleInvoiceId = "inv123";

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
      const res = await getAxiosWithAuth().get("/invoice-settings");
      const data = res.data;
      setStoreName(data.storeName || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setFooterNote(data.footerNote || "");
      setTrackingUrl(data.trackingUrl || "");
    } catch (error) {
      console.error("Failed to fetch invoice settings:", error);
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
      await getAxiosWithAuth().post("/invoice-settings", payload);
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
      console.error("Save error:", error);
    }
  };

  const previewTrackingLink = trackingUrl.includes("{id}")
    ? trackingUrl.replace("{id}", sampleInvoiceId)
    : trackingUrl;

  return (
    <main className="relative p-6">
      {/* 🧾 Header */}
      <div className="flex items-center gap-2 mb-4">
        <ScrollText className="w-6 h-6 text-[#3DD9B6]" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Invoice Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 🛠️ Settings Form */}
        <Card className="card bg-slate-100 dark:bg-slate-950 shadow-md h-[560px] flex flex-col justify-between">
          <CardHeader className="pb-1">
            <CardTitle className="text-slate-900 dark:text-slate-50 text-base">
              🛠️ Configure Invoice
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

        {/* 🧾 Invoice Preview */}
        <Card className="card bg-slate-100 dark:bg-slate-950 shadow-md print:border-none print:bg-white h-[560px] flex flex-col">
          <CardHeader className="pb-1">
            <CardTitle className="text-slate-900 dark:text-slate-50 text-base">
              🧾 Invoice Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 overflow-y-auto">
            <div className="bg-slate-100 dark:bg-slate-950 font-mono text-sm space-y-2 border border-dashed rounded-md dark:border-gray-600 print:border-gray-300 print:text-black p-4">
              {/* 🏪 Store Info */}
              <div className="text-center font-bold text-lg dark:text-white">{storeName}</div>
              <div className="text-center dark:text-gray-300">{address}</div>
              <div className="text-center dark:text-gray-300">{phone}</div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600 print:border-gray-300" />

              {/* 📄 Invoice Meta */}
              <div className="flex justify-between mt-2 text-xs dark:text-gray-300">
                <span>Invoice #: {invoiceNumber}</span>
                <span>Issued: {issueDate}</span>
              </div>
              <div className="flex justify-between text-xs dark:text-gray-300">
                <span>Due: {dueDate}</span>
                <span className="text-red-600 font-bold uppercase">Unpaid</span>
              </div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600 print:border-gray-300" />

              {/* 👤 Customer Info */}
              <div className="text-sm dark:text-white">
                <span>Customer: {customerName}</span>
              </div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600 print:border-gray-300" />

              {/* 📋 Itemized Services */}
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
              </div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600 print:border-gray-300" />

              {/* 💰 Totals */}
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

              {/* 📍 QR + Footer */}
              <div className="flex justify-center mt-3 print:hidden">
                <QRCode value={previewTrackingLink} size={64} />
              </div>
              <div className="text-center mt-1 text-xs dark:text-gray-300 print:hidden">
                Scan to track your laundry status
              </div>
              <div className="text-center mt-2 dark:text-gray-300">
                {footerNote}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}