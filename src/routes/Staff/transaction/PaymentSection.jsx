import React from "react";
import PropTypes from "prop-types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const paymentOptions = ["Unpaid", "Paid"];

const PaymentSection = ({
  paymentStatus,
  amountGiven,
  totalAmount,
  onStatusChange,
  onAmountChange,
}) => {
  const isUnderpaid =
    paymentStatus === "Paid" &&
    typeof totalAmount === "number" &&
    amountGiven < totalAmount;

  return (
    <div className="space-y-3 pt-4">
      {/* 🔘 Payment Status Selector */}
      <div>
        <Label className="mb-1 block">Payment Status</Label>
        <Select value={paymentStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
            {paymentOptions.map((status) => (
              <SelectItem
                key={status}
                value={status}
                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 💰 Amount Given (only if Paid) */}
      <div>
        <Label className="mb-1 block">Amount Given</Label>
        <div className={`flex items-center border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-slate-950 ${paymentStatus !== "Paid" ? "opacity-50 cursor-not-allowed" : ""}`}>
          <span className="px-3 text-slate-500 dark:text-slate-400">₱</span>
          <Input
            type="text"
            inputMode="decimal"
            pattern="^\d*\.?\d*$"
            value={
              paymentStatus === "Paid"
                ? amountGiven?.toString() ?? ""
                : ""
            }
            onChange={(e) => {
              const raw = e.target.value;
              const cleaned = raw.replace(/[^\d.]/g, "");
              const numeric = parseFloat(cleaned);
              onAmountChange(isNaN(numeric) ? 0 : numeric);
            }}
            disabled={paymentStatus !== "Paid"}
            aria-disabled={paymentStatus !== "Paid"}
            placeholder={
              paymentStatus === "Paid"
                ? "Enter amount"
                : "Disabled until paid"
            }
            className="flex-1 border-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none"
          />
        </div>
      </div>

      {/* 🟡 Unpaid Notice */}
      {paymentStatus === "Unpaid" && (
        <div className="text-sm italic text-yellow-600">
          This transaction will be saved as <strong>Unpaid</strong>. You can
          settle payment later.
        </div>
      )}

      {/* 🔴 Underpayment Warning */}
      {isUnderpaid && (
        <div className="text-sm italic text-red-600">
          Amount given is less than the total. Please collect full payment or
          mark as <strong>Unpaid</strong>.
        </div>
      )}
    </div>
  );
};

PaymentSection.propTypes = {
  paymentStatus: PropTypes.oneOf(paymentOptions).isRequired,
  amountGiven: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  totalAmount: PropTypes.number.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onAmountChange: PropTypes.func.isRequired,
};

export default PaymentSection;