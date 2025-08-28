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

const paymentMethods = ["Cash", "GCash"];

const PaymentSection = ({
  paymentMethod = "Cash",
  amountGiven,
  totalAmount,
  onMethodChange,
  onAmountChange,
  isLocked, // ✅ added
}) => {
  const parsedAmount = parseFloat(amountGiven);
  const isUnderpaid =
    typeof totalAmount === "number" &&
    !isNaN(parsedAmount) &&
    parsedAmount < totalAmount;

  const handleInputChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^\d.]/g, "");
    onAmountChange(cleaned);
  };

  const handleInputBlur = (e) => {
    const cleaned = e.target.value.replace(/[^\d.]/g, "");
    const numeric = parseFloat(cleaned);
    onAmountChange(isNaN(numeric) ? "0" : numeric.toString());
  };

  return (
    <div className="space-y-3 pt-4">
      {/* 💳 Payment Method Selector */}
      <div>
        <Label className="mb-1 block">Payment Method</Label>
        <Select
          value={paymentMethod}
          onValueChange={onMethodChange}
          disabled={isLocked} // ✅ lock selector
        >
          <SelectTrigger className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950">
            <SelectValue placeholder="Cash" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
            {paymentMethods.map((method) => (
              <SelectItem
                key={method}
                value={method}
                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 💰 Amount Given */}
      <div>
        <Label className="mb-1 block">Amount Given</Label>
        <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-slate-950">
          <span className="px-3 text-slate-500 dark:text-slate-400">₱</span>
          <Input
            type="text"
            inputMode="decimal"
            pattern="^\d*\.?\d*$"
            value={amountGiven?.toString() ?? ""}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="Enter amount"
            disabled={isLocked} // ✅ lock input
            className="flex-1 border-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none"
          />
        </div>
      </div>

      {/* 🔴 Underpayment Warning */}
      {isUnderpaid && (
        <div className="text-sm italic text-red-600">
          Amount given is less than the total. Please collect full payment.
        </div>
      )}
    </div>
  );
};

PaymentSection.propTypes = {
  paymentMethod: PropTypes.oneOf(paymentMethods),
  amountGiven: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  totalAmount: PropTypes.number.isRequired,
  onMethodChange: PropTypes.func.isRequired,
  onAmountChange: PropTypes.func.isRequired,
  isLocked: PropTypes.bool, // ✅ added
};

export default PaymentSection;