import React from "react";
import PropTypes from "prop-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import { Info, AlertCircle } from "lucide-react";

const ConsumablesSection = ({
  stockItems,
  consumables,
  loads,
  onLoadsChange,
  onConsumableChange,
  onPlasticChange,
  plasticOverrides,
  setPlasticOverrides,
  detergentOverrides,
  setDetergentOverrides,
  fabricOverrides,
  setFabricOverrides,
  supplySource,
  isLocked,
  insufficientStockItems = []
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const plasticItems = stockItems.filter((item) =>
    item.name.toLowerCase().includes("plastic")
  );
  
  const detergentItems = stockItems.filter((item) =>
    item.name.toLowerCase().includes("detergent")
  );
  
  const fabricItems = stockItems.filter((item) =>
    item.name.toLowerCase().includes("fabric")
  );
  
  const nonConsumableItems = stockItems.filter(
    (item) => 
      !item.name.toLowerCase().includes("plastic") &&
      !item.name.toLowerCase().includes("detergent") &&
      !item.name.toLowerCase().includes("fabric")
  );

  // UPDATED: Enhanced plastic change handler
  const handlePlasticChange = (name, value, raw) => {
    const numericValue = parseInt(value) || 0;
    
    // Only set as manual override if value is different from loads value
    const expectedValue = parseInt(loads) || 1;
    
    if (numericValue !== expectedValue) {
      setPlasticOverrides((prev) => ({
        ...prev,
        [name]: true,
      }));
      console.log("🔧 Manual plastic override:", numericValue);
    } else {
      // If value matches expected, clear the override
      setPlasticOverrides((prev) => ({
        ...prev,
        [name]: false,
      }));
      console.log("🔧 Plastic matches expected value - clearing override");
    }
    
    onPlasticChange(name, numericValue);
  };

  const handleDetergentChange = (name, value, raw) => {
    setDetergentOverrides((prev) => ({
      ...prev,
      [name]: true,
    }));
    onConsumableChange(name, value);
  };

  const handleFabricChange = (name, value, raw) => {
    setFabricOverrides((prev) => ({
      ...prev,
      [name]: true,
    }));
    onConsumableChange(name, value);
  };

  const isManuallySet = (itemName, type) => {
    if (type === "plastic") {
      return plasticOverrides[itemName];
    } else if (type === "detergent") {
      return detergentOverrides[itemName];
    } else if (type === "fabric") {
      return fabricOverrides[itemName];
    }
    return false;
  };

  // Check if an item has insufficient stock
  const isInsufficientStock = (itemName) => {
    return insufficientStockItems.some(item => 
      item.toLowerCase().includes(itemName.toLowerCase()) || 
      itemName.toLowerCase().includes(item.toLowerCase())
    );
  };

  // NEW: Function to add "pcs" label for specific items
  const getItemLabel = (item, type = "other") => {
    const insufficient = isInsufficientStock(item.name);
    
    return (
      <div key={item.id} className="relative">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Label 
              style={{ 
                color: insufficient 
                  ? '#ef4444' 
                  : (isDarkMode ? '#f1f5f9' : '#0f172a') 
              }}
            >
              {item.name}
            </Label>
            {/* ADDED: "pcs" label for plastic, detergent, and fabric items */}
            {(type === "plastic" || type === "detergent" || type === "fabric") && (
              <span 
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.1)',
                  color: isDarkMode ? '#cbd5e1' : '#64748b'
                }}
              >
                pcs
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {insufficient && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle size={12} />
                <span>Insufficient</span>
              </div>
            )}
            {/* Show "Manual" for all types when manually set */}
            {isManuallySet(item.name, type) && !insufficient && (
              <div className="flex items-center gap-1 text-xs" style={{ color: isDarkMode ? '#60a5fa' : '#2563eb' }}>
                <Info size={12} />
                <span>Manual</span>
              </div>
            )}
          </div>
        </div>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={consumables[item.name]?.toString() ?? "0"}
          onChange={(e) => {
            const raw = e.target.value;
            const cleaned = raw.replace(/^0+/, "") || "0";
            const numeric = parseInt(cleaned, 10);

            if (type === "plastic") {
              handlePlasticChange(item.name, isNaN(numeric) ? 0 : numeric, raw);
            } else if (type === "detergent") {
              handleDetergentChange(item.name, isNaN(numeric) ? 0 : numeric, raw);
            } else if (type === "fabric") {
              handleFabricChange(item.name, isNaN(numeric) ? 0 : numeric, raw);
            } else {
              onConsumableChange(item.name, isNaN(numeric) ? 0 : numeric);
            }
          }}
          disabled={isLocked}
          className={`rounded-lg border-2 focus-visible:ring-2 ${
            insufficient 
              ? 'border-red-500 focus-visible:ring-red-500' 
              : 'focus-visible:ring-blue-500'
          }`}
          style={{
            borderColor: insufficient 
              ? '#ef4444' 
              : (isDarkMode ? '#334155' : '#cbd5e1'),
            backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
            color: isDarkMode ? '#f1f5f9' : '#0f172a'
          }}
        />
        {insufficient && (
          <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle size={10} />
            <span>Not enough stock available</span>
          </div>
        )}
      </div>
    );
  };

  // Show different content based on supply source
  if (supplySource === "customer") {
    return (
      <div className="space-y-4">
        {/* 🔁 Loads + Plastic Only (always show plastic even for customer-provided) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Loads</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={loads}
              onChange={(e) => {
                const raw = e.target.value;
                const cleaned = raw.replace(/^0+/, "") || "1";
                onLoadsChange(cleaned);
              }}
              onBlur={(e) => {
                const numeric = parseInt(e.target.value, 10);
                onLoadsChange(isNaN(numeric) || numeric < 1 ? 1 : numeric);
              }}
              required
              disabled={isLocked}
              className="rounded-lg border-2 focus-visible:ring-2 focus-visible:ring-blue-500"
              style={{
                borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                color: isDarkMode ? '#f1f5f9' : '#0f172a'
              }}
            />
          </div>

          {/* Plastic Items Only (always show) */}
          {plasticItems.map((item) => getItemLabel(item, "plastic"))}
        </div>
      </div>
    );
  }

  // In-store supply source - show all consumables
  return (
    <div className="space-y-4">
      {/* 🔁 Loads + Auto-increment Items */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Loads</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={loads}
            onChange={(e) => {
              const raw = e.target.value;
              const cleaned = raw.replace(/^0+/, "") || "1";
              onLoadsChange(cleaned);
            }}
            onBlur={(e) => {
              const numeric = parseInt(e.target.value, 10);
              onLoadsChange(isNaN(numeric) || numeric < 1 ? 1 : numeric);
            }}
            required
            disabled={isLocked}
            className="rounded-lg border-2 focus-visible:ring-2 focus-visible:ring-blue-500"
            style={{
              borderColor: isDarkMode ? '#334155' : '#cbd5e1',
              backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
              color: isDarkMode ? '#f1f5f9' : '#0f172a'
            }}
          />
        </div>

        {/* Plastic Items */}
        {plasticItems.map((item) => getItemLabel(item, "plastic"))}
        
        {/* Detergent Items */}
        {detergentItems.map((item) => getItemLabel(item, "detergent"))}
        
        {/* Fabric Softener Items */}
        {fabricItems.map((item) => getItemLabel(item, "fabric"))}
      </div>

      {/* 🧼 Non-Consumable Items — only if supplySource is in-store */}
      {nonConsumableItems.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {nonConsumableItems.map((item) => getItemLabel(item, "other"))}
        </div>
      )}
    </div>
  );
};

ConsumablesSection.propTypes = {
  stockItems: PropTypes.array.isRequired,
  consumables: PropTypes.object.isRequired,
  loads: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onConsumableChange: PropTypes.func.isRequired,
  onPlasticChange: PropTypes.func.isRequired,
  onLoadsChange: PropTypes.func.isRequired,
  plasticOverrides: PropTypes.object.isRequired,
  setPlasticOverrides: PropTypes.func.isRequired,
  detergentOverrides: PropTypes.object.isRequired,
  setDetergentOverrides: PropTypes.func.isRequired,
  fabricOverrides: PropTypes.object.isRequired,
  setFabricOverrides: PropTypes.func.isRequired,
  supplySource: PropTypes.string.isRequired,
  isLocked: PropTypes.bool,
  insufficientStockItems: PropTypes.array,
};

export default ConsumablesSection;