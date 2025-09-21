import React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import Lottie from "lottie-react";
import washingAnimation from "@/assets/lottie/washing-machine.json";
import unwashedAnimation from "@/assets/lottie/unwashed.json";
import dryingAnimation from "@/assets/lottie/dryer-machine.json";
import foldingAnimation from "@/assets/lottie/clothes.json";
import loaderAnimation from "@/assets/lottie/loader.json";

// Add constants directly in the file
const STATUS_ICONS = {
    UNWASHED: { label: "Not Started", animation: unwashedAnimation },
    WASHING: { label: "Washing", animation: washingAnimation },
    WASHED: { label: "Washed", animation: washingAnimation },
    DRYING: { label: "Drying", animation: dryingAnimation },
    DRIED: { label: "Dried", animation: dryingAnimation },
    FOLDING: { label: "Folding", animation: foldingAnimation },
    COMPLETED: { label: "Completed", animation: foldingAnimation },
};

const STATUS_LABEL_COLORS = {
    UNWASHED: "text-gray-500",
    WASHING: "text-blue-500",
    WASHED: "text-green-500",
    DRYING: "text-orange-500",
    DRIED: "text-green-600",
    FOLDING: "text-orange-600",
    COMPLETED: "text-green-700",
};

const StatusIndicator = ({ load, now, getRemainingTime }) => {
    const statusConfig = STATUS_ICONS[load.status] || STATUS_ICONS.UNWASHED;
    const remaining = getRemainingTime(load);

    return (
        <Tooltip>
            <TooltipTrigger>
                <div className="flex items-center gap-2">
                    <Lottie
                        animationData={statusConfig.animation}
                        loop
                        style={{ width: 40, height: 40 }}
                    />
                    <span
                        className={`font-semibold ${
                            STATUS_LABEL_COLORS[load.status] || "text-gray-500"
                        }`}
                    >
                        {statusConfig.label}
                    </span>
                    {load.pending && (
                        <Lottie
                            animationData={loaderAnimation}
                            loop
                            style={{ width: 24, height: 24 }}
                        />
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                {remaining !== null && remaining > 0
                    ? `${Math.ceil(remaining / 60)} min remaining`
                    : load.status === "COMPLETED"
                      ? "Complete"
                      : "Idle"}
            </TooltipContent>
        </Tooltip>
    );
};

export default StatusIndicator;