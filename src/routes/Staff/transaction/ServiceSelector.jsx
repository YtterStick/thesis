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
      <Label className="mb-1 block" style={{ color: 'rgb(11, 43, 38)' }}>Service Type</Label>
      <Select
        value={serviceId}
        onValueChange={(value) => onChange("serviceId", value)}
        disabled={isLocked}
      >
        <SelectTrigger className="rounded-lg border-2 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      style={{
                        borderColor: 'rgb(11, 43, 38)',
                        backgroundColor: 'rgb(255, 255, 255)',
                        color: 'rgb(11, 43, 38)'
                      }}>
          <SelectValue placeholder="Select service" />
        </SelectTrigger>
        <SelectContent className="rounded-lg border-2 bg-white text-slate-900"
                      style={{
                        borderColor: 'rgb(11, 43, 38)',
                        backgroundColor: 'rgb(255, 255, 255)'
                      }}>
          {services.map((service) => (
            <SelectItem
              key={service.id}
              value={service.id}
              className="cursor-pointer hover:bg-slate-100"
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