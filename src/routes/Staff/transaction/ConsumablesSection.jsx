import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";

const ConsumablesSection = ({
  stockItems,
  consumables,
  loads,
  onLoadsChange,
  onConsumableChange,
  plasticOverrides,
  setPlasticOverrides,
  supplySource,
  isLocked,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const plasticItems = stockItems.filter((item) =>
    item.name.toLowerCase().includes("plastic")
  );
  const nonPlasticItems = stockItems.filter(
    (item) => !item.name.toLowerCase().includes("plastic")
  );

  const hasInitialized = useRef(false);
  const lastLoadsRef = useRef(parseInt(loads) || 1);
  const currentLoads = parseInt(loads) || 1;

  useEffect(() => {
    if (!hasInitialized.current && plasticItems.length) {
      plasticItems.forEach((item) => {
        const name = item.name;
        const current = consumables[name];
        if (current === undefined) {
          onConsumableChange(name, currentLoads);
        }
      });
      hasInitialized.current = true;
    }
  }, [plasticItems, consumables, currentLoads, onConsumableChange]);

  useEffect(() => {
    const previousLoads = lastLoadsRef.current;
    const delta = currentLoads - previousLoads;

    if (delta !== 0) {
      plasticItems.forEach((item) => {
        const name = item.name;
        const current = consumables[name] ?? 0;
        const updated = Math.max(0, current + delta);
        onConsumableChange(name, updated);
      });
      lastLoadsRef.current = currentLoads;
    }
  }, [currentLoads, plasticItems, consumables, onConsumableChange]);

  const handlePlasticChange = (name, value, raw) => {
    setPlasticOverrides((prev) => ({
      ...prev,
      [name]: raw === "" ? false : true,
    }));
    onConsumableChange(name, value);
  };

  const renderInput = (item, isPlastic = false) => (
    <div key={item.id}>
      <Label className="mb-1 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>{item.name}</Label>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        value={consumables[item.name]?.toString() ?? "0"}
        onChange={(e) => {
          const raw = e.target.value;
          const cleaned = raw.replace(/^0+/, "") || "0";
          const numeric = parseInt(cleaned, 10);

          if (isPlastic) {
            handlePlasticChange(item.name, isNaN(numeric) ? 0 : numeric, raw);
          } else {
            onConsumableChange(item.name, isNaN(numeric) ? 0 : numeric);
          }
        }}
        disabled={isLocked}
        className="rounded-lg border-2 focus-visible:ring-2 focus-visible:ring-blue-500"
        style={{
          borderColor: isDarkMode ? '#334155' : '#cbd5e1',
          backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
          color: isDarkMode ? '#f1f5f9' : '#0f172a'
        }}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 🔁 Loads + Plastic Items */}
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

        {plasticItems.map((item) => renderInput(item, true))}
      </div>

      {/* 🧼 Non-Plastic Items — only if supplySource is in-store */}
      {supplySource === "in-store" && (
        <div className="grid grid-cols-2 gap-4">
          {nonPlasticItems.map((item) => renderInput(item))}
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
  onLoadsChange: PropTypes.func.isRequired,
  plasticOverrides: PropTypes.object.isRequired,
  setPlasticOverrides: PropTypes.func.isRequired,
  supplySource: PropTypes.string.isRequired,
  isLocked: PropTypes.bool,
};

export default ConsumablesSection;