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
  const handleAmountChange = (e) => {
    let value = e.target.value;

    if (/^0[0-9]+/.test(value)) {
      value = value.replace(/^0+/, "");
    }

    const numeric = Math.max(0, Number(value));
    onAmountChange(numeric);
  };

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
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-100 shadow-md dark:bg-slate-950">
            {paymentOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 💰 Amount Given (only if Paid) */}
      <div>
        <Label className="mb-1 block">Amount Given</Label>
        <div className="flex items-center gap-1">
          <span className="px-2 py-1 bg-muted text-sm rounded text-gray-700 dark:text-gray-300">
            ₱
          </span>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            pattern="[0-9]*"
            value={paymentStatus === "Paid" ? amountGiven || "" : ""}
            onChange={handleAmountChange}
            disabled={paymentStatus !== "Paid"}
            aria-disabled={paymentStatus !== "Paid"}
            placeholder={
              paymentStatus === "Paid" ? "Enter amount" : "Disabled until paid"
            }
            className={`transition-all ${
              paymentStatus !== "Paid"
                ? "bg-muted cursor-not-allowed opacity-50"
                : ""
            }`}
          />
        </div>
      </div>

      {/* 🟡 Unpaid Notice */}
      {paymentStatus === "Unpaid" && (
        <div className="text-yellow-600 text-sm italic">
          This transaction will be saved as <strong>Unpaid</strong>. You can
          settle payment later.
        </div>
      )}

      {/* 🔴 Underpayment Warning */}
      {isUnderpaid && (
        <div className="text-red-600 text-sm italic">
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