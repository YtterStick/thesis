import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QRCode from "react-qr-code";
import { Settings } from "lucide-react";

export default function ReceiptSettingsPage() {
  const [storeName, setStoreName] = useState("Starwash Laundry");
  const [address, setAddress] = useState("123 Katipunan Ave, Quezon City");
  const [phone, setPhone] = useState("(02) 1234-5678");
  const [footerNote, setFooterNote] = useState("Thank you for trusting Starwash!");
  const [trackingUrl, setTrackingUrl] = useState("https://starwashlaundry.com/track/ABC123");

  const detergentQty = 2;
  const fabricQty = 1;
  const plasticQty = 1;

  return (
    <main className="relative p-6">
      {/* 🧾 Header */}
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-6 h-6 text-[#3DD9B6]" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Receipt Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 🛠️ Settings Form */}
        <Card className="shadow-md h-[560px] flex flex-col justify-between">
          <CardHeader className="pb-1">
            <CardTitle className="text-slate-900 dark:text-slate-50 text-base">🛠️ Configure Receipt</CardTitle>
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

          {/* 📍 Save Button Bottom-Right */}
          <div className="flex justify-end px-6 pb-4">
            <Button
              className="bg-[#3DD9B6] text-white hover:bg-[#2fc3a4] dark:bg-[#007362] dark:hover:bg-[#00564e] shadow-md transition-transform hover:scale-105"
            >
              Save Settings
            </Button>
          </div>
        </Card>

        {/* 🧾 Receipt Preview */}
        <Card className="bg-white dark:bg-muted shadow-md print:border-none print:bg-white h-[560px]">
          <CardHeader className="pb-1">
            <CardTitle className="text-slate-900 dark:text-slate-50 text-base">🧾 Receipt Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="font-mono text-sm space-y-2 border border-dashed rounded-md dark:border-gray-600 print:border-gray-300 print:text-black p-4">
              <div className="text-center font-bold text-lg dark:text-white">{storeName}</div>
              <div className="text-center dark:text-gray-300">{address}</div>
              <div className="text-center dark:text-gray-300">{phone}</div>
              <hr className="my-2 border-t border-gray-300 dark:border-gray-600 print:border-gray-300" />

              {/* 🧺 Laundry Details */}
              <div className="space-y-1 dark:text-white">
                <div className="flex justify-between">
                  <span>Service Type</span>
                  <span>Wash & Dry</span>
                </div>
                <div className="flex justify-between">
                  <span>Detergent Used</span>
                  <span>{detergentQty} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span>Fabric Softener</span>
                  <span>{fabricQty} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span>Plastic Bags</span>
                  <span>{plasticQty}</span>
                </div>
              </div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600 print:border-gray-300" />

              {/* 💰 Sample Item */}
              <div className="flex justify-between dark:text-white">
                <span>3kg Laundry</span>
                <span>₱180.00</span>
              </div>

              <hr className="my-2 border-t border-gray-300 dark:border-gray-600 print:border-gray-300" />
              <div className="flex justify-between font-bold dark:text-white">
                <span>Total</span>
                <span>₱180.00</span>
              </div>

              {/* 📦 QR Code */}
              <div className="flex justify-center mt-3 print:hidden">
                <QRCode value={trackingUrl} size={64} />
              </div>
              <div className="text-center mt-1 text-xs dark:text-gray-300 print:hidden">
                Scan to track your laundry status
              </div>

              {/* 🧾 Footer */}
              <div className="text-center mt-2 dark:text-gray-300">{footerNote}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}