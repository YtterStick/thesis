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
import { useTheme } from "@/hooks/use-theme";

const ServiceSelector = ({ services, serviceId, onChange, isLocked }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="space-y-2 pt-4">
      <Label className="mb-1 block" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Service Type</Label>
      <Select
        value={serviceId}
        onValueChange={(value) => onChange("serviceId", value)}
        disabled={isLocked}
      >
        <SelectTrigger className="rounded-lg border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      style={{
                        borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                        backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF',
                        color: isDarkMode ? '#f1f5f9' : '#0f172a'
                      }}>
          <SelectValue placeholder="Select service" />
        </SelectTrigger>
        <SelectContent className="rounded-lg border-2"
                      style={{
                        borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                        backgroundColor: isDarkMode ? '#1e293b' : '#FFFFFF'
                      }}>
          {services.map((service) => (
            <SelectItem
              key={service.id}
              value={service.id}
              className="cursor-pointer"
              style={{
                color: isDarkMode ? '#f1f5f9' : '#0f172a'
              }}
            >
              {service.name}
            </SelectItem>
          ))} 
        </SelectContent>
      </Select>
    </div>
  );
};

ServiceSelector.propTypes = {
  services: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  serviceId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  isLocked: PropTypes.bool,
};

export default ServiceSelector;