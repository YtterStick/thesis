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

const ServiceSelector = ({ services, serviceId, onChange, isLocked }) => {
  return (
    <div className="space-y-2 pt-4">
      <Label className="mb-1 block">Service Type</Label>
      <Select
        value={serviceId}
        onValueChange={(value) => onChange("serviceId", value)}
        disabled={isLocked}
      >
        <SelectTrigger className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950">
          <SelectValue placeholder="Select service" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
          {services.map((service) => (
            <SelectItem
              key={service.id}
              value={service.id}
              className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
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