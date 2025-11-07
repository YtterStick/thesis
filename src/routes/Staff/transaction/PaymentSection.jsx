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
import { useTheme } from "@/hooks/use-theme";

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
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const parsedAmount = parseFloat(amountGiven);
  const isUnderpaid =
    typeof totalAmount === "number" &&
    !isNaN(parsedAmount) &&
    parsedAmount < totalAmount;

  const handleInputChange = (e) => {
    const raw = e.target.value;
    // Remove leading zeros and non-numeric characters except decimal point
    const cleaned = raw.replace(/^0+(?=\d)/, '').replace(/[^\d.]/g, "");
    onAmountChange(cleaned);
  };

  const handleInputBlur = (e) => {
    const cleaned = e.target.value.replace(/^0+(?=\d)/, '').replace(/[^\d.]/g, "");
    const numeric = parseFloat(cleaned);
    onAmountChange(isNaN(numeric) ? "" : numeric.toString());
  };

  const handleGcashReferenceChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    onGcashReferenceChange(numericValue);
  };

  return (
    <div className="space-y-3 pt-4">
      {/* 💳 Payment Method Selector */}
      <div>
        <Label className="mb-1 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Payment Method</Label>
        <Select
          value={paymentMethod}
          onValueChange={onMethodChange}
          disabled={isLocked}
        >
          <SelectTrigger className="rounded-lg border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        style={{
                          borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                          backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                          color: isDarkMode ? '#f1f5f9' : '#0f172a'
                        }}>
            <SelectValue placeholder="Cash" />
          </SelectTrigger>
          <SelectContent className="rounded-lg border-2"
                        style={{
                          borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                          backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF'
                        }}>
            {paymentMethods.map((method) => (
              <SelectItem
                key={method}
                value={method}
                className="cursor-pointer"
                style={{
                  color: isDarkMode ? '#f1f5f9' : '#0f172a'
                }}
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
          <Label className="mb-1 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>GCash Reference Number</Label>
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
            className="rounded-lg border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            style={{
              borderColor: isDarkMode ? '#334155' : '#cbd5e1',
              backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
              color: isDarkMode ? '#f1f5f9' : '#0f172a'
            }}
          />
        </div>
      )}

      {/* 💰 Amount Given */}
      <div>
        <Label className="mb-1 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Amount Given</Label>
        <div className="flex items-center rounded-lg border-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
             style={{
               borderColor: isDarkMode ? '#334155' : '#cbd5e1',
               backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF'
             }}>
          <span className="px-3" style={{ color: isDarkMode ? '#94a3b8' : '#6B7280' }}>₱</span>
          <Input
            type="text"
            inputMode="decimal"
            pattern="^\d*\.?\d*$"
            value={amountGiven?.toString() ?? ""}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="Enter amount"
            disabled={isLocked}
            className="flex-1 border-none bg-transparent focus-visible:outline-none"
            style={{
              color: isDarkMode ? '#f1f5f9' : '#0f172a'
            }}
          />
        </div>
      </div>

      {/* 🔴 Underpayment Warning */}
      {isUnderpaid && (
        <div className="text-sm italic" style={{ color: isDarkMode ? '#F87171' : '#DC2626' }}>
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