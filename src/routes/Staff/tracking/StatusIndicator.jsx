import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
    Clock, 
    Play, 
    CheckCircle, 
    Wind, 
    Droplets, 
    RotateCcw,
    CircleDashed
} from "lucide-react";

const STATUS_CONFIG = {
    UNWASHED: { 
        label: "Pending", 
        icon: Clock, 
        color: "bg-slate-500",
        textColor: "#6B7280"
    },
    WASHING: { 
        label: "Washing", 
        icon: Droplets, 
        color: "bg-blue-500",
        textColor: "#0891B2"
    },
    WASHED: { 
        label: "Washed", 
        icon: CheckCircle, 
        color: "bg-emerald-500",
        textColor: "#10B981"
    },
    DRYING: { 
        label: "Drying", 
        icon: Wind, 
        color: "bg-orange-500",
        textColor: "#FB923C"
    },
    DRIED: { 
        label: "Dried", 
        icon: CheckCircle, 
        color: "bg-green-600",
        textColor: "#059669"
    },
    FOLDING: { 
        label: "Folding", 
        icon: RotateCcw, 
        color: "bg-violet-500",
        textColor: "#A78BFA"
    },
    COMPLETED: { 
        label: "Completed", 
        icon: CheckCircle, 
        color: "bg-green-700",
        textColor: "#059669"
    },
};

const StatusIndicator = ({ load, isDarkMode }) => {
    const config = STATUS_CONFIG[load.status] || STATUS_CONFIG.UNWASHED;
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-2">
            <div 
                className="flex items-center justify-center rounded-full p-1.5"
                style={{ 
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    color: config.textColor 
                }}
            >
                {load.pending ? (
                    <CircleDashed className="h-4 w-4 animate-spin" />
                ) : (
                    <Icon className="h-4 w-4" />
                )}
            </div>
            <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: config.textColor }}
            >
                {config.label}
            </span>
        </div>
    );
};

export default StatusIndicator;