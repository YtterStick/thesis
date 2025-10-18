import React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import Lottie from "lottie-react";
import washingAnimation from "@/assets/lottie/washing-machine.json";
import unwashedAnimation from "@/assets/lottie/unwashed.json";
import dryingAnimation from "@/assets/lottie/dryer-machine.json";
import foldingAnimation from "@/assets/lottie/clothes.json";
import loaderAnimation from "@/assets/lottie/loader.json";

// Updated status icons with static versions for completed states
const STATUS_ICONS = {
    UNWASHED: {
        label: "Not Started",
        animation: unwashedAnimation,
        loop: true,
    },
    NOT_STARTED: {
        // Add this for backend status
        label: "Not Started",
        animation: unwashedAnimation,
        loop: true,
    },
    WASHING: {
        label: "Washing",
        animation: washingAnimation,
        loop: true,
    },
    WASHED: {
        label: "Washed",
        animation: washingAnimation,
        loop: false,
        staticFrame: 50,
    },
    DRYING: {
        label: "Drying",
        animation: dryingAnimation,
        loop: true,
    },
    DRIED: {
        label: "Dried",
        animation: dryingAnimation,
        loop: false,
        staticFrame: 30,
    },
    FOLDING: {
        label: "Folding",
        animation: foldingAnimation,
        loop: true,
    },
    COMPLETED: {
        label: "Completed",
        animation: foldingAnimation,
        loop: false,
        staticFrame: 20,
    },
};

const STATUS_LABEL_COLORS = {
    UNWASHED: "#6B7280",
    NOT_STARTED: "#6B7280",
    WASHING: "#0891B2",
    WASHED: "#10B981",
    DRYING: "#FB923C",
    DRIED: "#059669",
    FOLDING: "#A78BFA",
    COMPLETED: "#059669",
};

const StatusIndicator = ({ load, now, getRemainingTime, isDarkMode }) => {
    // Map NOT_STARTED to UNWASHED for icon lookup
    const displayStatus = load.status === "NOT_STARTED" ? "UNWASHED" : load.status;
    const statusConfig = STATUS_ICONS[displayStatus] || STATUS_ICONS.UNWASHED;

    // Use the actual remaining time calculation
    const remaining = getRemainingTime(load);
    const isTimerRunning = (load.status === "WASHING" || load.status === "DRYING") && remaining !== null && remaining > 0;

    // Determine if we should show static animation (for completed states)
    const shouldShowStatic = !statusConfig.loop && statusConfig.staticFrame !== undefined && !isTimerRunning;

    console.log(`🎯 StatusIndicator for load ${load.loadNumber}:`, {
        displayStatus,
        remaining,
        isTimerRunning,
        shouldShowStatic,
        startTime: load.startTime,
        endTime: load.endTime,
        duration: load.duration,
    });

    return (
        <Tooltip>
            <TooltipTrigger>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Lottie
                            animationData={statusConfig.animation}
                            loop={isTimerRunning}
                            style={{ width: 40, height: 40 }}
                            {...(shouldShowStatic && {
                                initialSegment: [statusConfig.staticFrame, statusConfig.staticFrame],
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
                    <div className="flex flex-col">
                        <span
                            className="font-semibold"
                            style={{
                                color: STATUS_LABEL_COLORS[displayStatus] || STATUS_LABEL_COLORS.UNWASHED,
                            }}
                        >
                            {statusConfig.label}
                        </span>
                        {isTimerRunning && remaining !== null && (
                            <span className="text-xs text-gray-500">
                                {Math.floor(remaining / 60)}m {remaining % 60}s remaining
                            </span>
                        )}
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent
                style={{
                    backgroundColor: isDarkMode ? "#0B2B26" : "#FFFFFF",
                    color: isDarkMode ? "#F3EDE3" : "#0B2B26",
                    borderColor: isDarkMode ? "#1C3F3A" : "#0B2B26",
                }}
            >
                {isTimerRunning && remaining !== null
                    ? `${Math.floor(remaining / 60)} min ${remaining % 60} sec remaining`
                    : displayStatus === "COMPLETED"
                      ? "Complete"
                      : "Ready for next step"}
            </TooltipContent>
        </Tooltip>
    );
};

export default StatusIndicator;
