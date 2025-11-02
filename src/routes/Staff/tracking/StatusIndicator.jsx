import React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import Lottie from "lottie-react";
import washingAnimation from "@/assets/lottie/washing-machine.json";
import unwashedAnimation from "@/assets/lottie/unwashed.json";
import dryingAnimation from "@/assets/lottie/dryer-machine.json";
import foldingAnimation from "@/assets/lottie/clothes.json";
import loaderAnimation from "@/assets/lottie/loader.json";

const STATUS_ICONS = {
    UNWASHED: { 
        label: "Not Started", 
        animation: unwashedAnimation,
        loop: true 
    },
    WASHING: { 
        label: "Washing", 
        animation: washingAnimation,
        loop: true 
    },
    WASHED: { 
        label: "Washed", 
        animation: washingAnimation,
        loop: false,
        staticFrame: 50
    },
    DRYING: { 
        label: "Drying", 
        animation: dryingAnimation,
        loop: true 
    },
    DRIED: { 
        label: "Dried", 
        animation: dryingAnimation,
        loop: false,
        staticFrame: 30
    },
    FOLDING: { 
        label: "Folding", 
        animation: foldingAnimation,
        loop: true 
    },
    COMPLETED: { 
        label: "Completed", 
        animation: foldingAnimation,
        loop: false,
        staticFrame: 20
    },
};

const STATUS_LABEL_COLORS = {
    UNWASHED: "#6B7280",
    WASHING: "#0891B2",
    WASHED: "#10B981",
    DRYING: "#FB923C",
    DRIED: "#059669",
    FOLDING: "#A78BFA",
    COMPLETED: "#059669",
};

const StatusIndicator = ({ load, now, getRemainingTime, isDarkMode }) => {
    const statusConfig = STATUS_ICONS[load.status] || STATUS_ICONS.UNWASHED;
    const remaining = getRemainingTime(load);

    const shouldShowStatic = !statusConfig.loop && statusConfig.staticFrame !== undefined;
    
    return (
        <Tooltip>
            <TooltipTrigger>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Lottie
                            animationData={statusConfig.animation}
                            loop={statusConfig.loop}
                            style={{ width: 40, height: 40 }}
                            {...(shouldShowStatic && {
                                initialSegment: [statusConfig.staticFrame, statusConfig.staticFrame]
                            })}
                        />
                        {load.pending && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Lottie
                                    animationData={loaderAnimation}
                                    loop
                                    style={{ width: 24, height: 24 }}
                                />
                            </div>
                        )}
                    </div>
                    <span
                        className="font-semibold"
                        style={{ 
                            color: STATUS_LABEL_COLORS[load.status] || STATUS_LABEL_COLORS.UNWASHED
                        }}
                    >
                        {statusConfig.label}
                    </span>
                </div>
            </TooltipTrigger>
            <TooltipContent
                style={{
                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                    color: isDarkMode ? "#f1f5f9" : "#0f172a",
                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                }}
            >
                {remaining !== null && remaining > 0
                    ? `${Math.ceil(remaining / 60)} min remaining`
                    : load.status === "COMPLETED"
                      ? "Complete"
                      : "Ready for next step"}
            </TooltipContent>
        </Tooltip>
    );
};

export default StatusIndicator;