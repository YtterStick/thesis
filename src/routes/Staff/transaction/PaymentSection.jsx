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

const PaymentSection = ({
  paymentMethod = "Cash",
  amountGiven,
  totalAmount,
  onMethodChange,
  onAmountChange,
  isLocked,
  paymentMethods = ["Cash"],
  gcashReference,
  onGcashReferenceChange
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

  const handleGcashReferenceChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    onGcashReferenceChange(numericValue);
  };

  return (
    <div className="space-y-3 pt-4">
      {/* 💳 Payment Method Selector */}
      <div>
        <Label className="mb-1 block" style={{ color: 'rgb(11, 43, 38)' }}>Payment Method</Label>
        <Select
          value={paymentMethod}
          onValueChange={onMethodChange}
          disabled={isLocked}
        >
          <SelectTrigger className="rounded-lg border-2 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        style={{
                          borderColor: 'rgb(11, 43, 38)',
                          backgroundColor: 'rgb(255, 255, 255)',
                          color: 'rgb(11, 43, 38)'
                        }}>
            <SelectValue placeholder="Cash" />
          </SelectTrigger>
          <SelectContent className="rounded-lg border-2 bg-white text-slate-900"
                        style={{
                          borderColor: 'rgb(11, 43, 38)',
                          backgroundColor: 'rgb(255, 255, 255)'
                        }}>
            {paymentMethods.map((method) => (
              <SelectItem
                key={method}
                value={method}
                className="cursor-pointer hover:bg-slate-100"
              >
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* GCash Reference Input (only show when GCash is selected) */}
      {paymentMethod === "GCash" && (
        <div>
          <Label className="mb-1 block" style={{ color: 'rgb(11, 43, 38)' }}>GCash Reference Number</Label>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={gcashReference || ""}
            onChange={(e) => handleGcashReferenceChange(e.target.value)}
            placeholder="Enter GCash reference number"
            disabled={isLocked}
            required={paymentMethod === "GCash"}
            maxLength={20}
            className="rounded-lg border-2 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            style={{
              borderColor: 'rgb(11, 43, 38)',
              backgroundColor: 'rgb(255, 255, 255)',
              color: 'rgb(11, 43, 38)'
            }}
          />
        </div>
      )}

      {/* 💰 Amount Given */}
      <div>
        <Label className="mb-1 block" style={{ color: 'rgb(11, 43, 38)' }}>Amount Given</Label>
        <div className="flex items-center rounded-lg border-2 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
             style={{
               borderColor: 'rgb(11, 43, 38)',
               backgroundColor: 'rgb(255, 255, 255)'
             }}>
          <span className="px-3 text-slate-500">₱</span>
          <Input
            type="text"
            inputMode="decimal"
            pattern="^\d*\.?\d*$"
            value={amountGiven?.toString() ?? ""}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="Enter amount"
            disabled={isLocked}
            className="flex-1 border-none bg-transparent text-slate-900 placeholder:text-slate-400 focus-visible:outline-none"
            style={{
              color: 'rgb(11, 43, 38)'
            }}
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
  paymentMethod: PropTypes.string,
  amountGiven: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  totalAmount: PropTypes.number,
  onMethodChange: PropTypes.func,
  onAmountChange: PropTypes.func,
  isLocked: PropTypes.bool,
  paymentMethods: PropTypes.arrayOf(PropTypes.string),
  gcashReference: PropTypes.string,
  onGcashReferenceChange: PropTypes.func
};

export default PaymentSection;