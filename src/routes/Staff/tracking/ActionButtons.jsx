import React from "react";
import { motion } from "framer-motion";
import { Check, Play, ArrowRight, RefreshCw } from "lucide-react";
import Loader from "@/components/loader";

const ActionButtons = ({
    load,
    job,
    jobKey,
    loadIndex,
    isLoadRunning,
    startAction,
    advanceStatus,
    startDryingAgain,
    getMachineTypeForStep,
    machines,
    isDarkMode,
    onCompletion,
    globalLoading = false, // Add this prop
    pendingRequests = new Set(), // Add this prop
}) => {
    // Create request IDs for this specific button
    const startRequestId = `start-${job.id}-${load.loadNumber}`;
    const advanceRequestId = `advance-${job.id}-${load.loadNumber}`;
    const dryAgainRequestId = `dry-again-${job.id}-${load.loadNumber}`;

    // Check if this specific button is loading
    const isStartLoading = pendingRequests.has(startRequestId);
    const isAdvanceLoading = pendingRequests.has(advanceRequestId);
    const isDryAgainLoading = pendingRequests.has(dryAgainRequestId);

    // Show loader for running loads and pending state
    if (isLoadRunning(load) || load.pending || isStartLoading || isAdvanceLoading || isDryAgainLoading) {
        return (
            <div className="flex justify-end">
                <div className="flex h-10 min-w-[80px] items-center justify-center">
                    <div style={{ transform: "scale(0.5)" }}>
                        <Loader />
                    </div>
                </div>
            </div>
        );
    }

    const normalizedServiceType = job.serviceType?.replace(" Only", "") || job.serviceType;

    const machineType = getMachineTypeForStep(load.status, normalizedServiceType);
    const hasCorrectMachine = machineType ? load.machineId && machines[machineType]?.some((m) => m.id === load.machineId) : true;

    // More strict check for start button
    const canStart =
        !load.pending &&
        !isLoadRunning(load) &&
        load.status !== "WASHING" &&
        load.status !== "DRYING" &&
        hasCorrectMachine &&
        (load.status === "UNWASHED" || load.status === "WASHED");

    const CustomButton = ({ onClick, disabled, children, icon: Icon, variant = "primary", title, size = "md", isLoading = false }) => (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            onClick={() => {
                if (!disabled && !isLoading) {
                    onClick();
                }
            }}
            disabled={disabled || isLoading}
            title={title}
            className={`flex items-center gap-2 rounded-lg font-medium transition-all ${disabled || isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-90"} ${size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"} ${
                variant === "primary"
                    ? "text-white"
                    : variant === "secondary"
                      ? "border-2"
                      : variant === "success"
                        ? "text-white"
                        : variant === "warning"
                          ? "text-white"
                          : ""
            } `}
            style={{
                backgroundColor:
                    variant === "primary"
                        ? isDarkMode
                            ? "#0f172a"
                            : "#0f172a"
                        : variant === "success"
                          ? "#10B981"
                          : variant === "warning"
                            ? "#F59E0B"
                            : "transparent",
                borderColor: variant === "secondary" ? (isDarkMode ? "#334155" : "#cbd5e1") : "transparent",
                color:
                    variant === "secondary"
                        ? isDarkMode
                            ? "#f1f5f9"
                            : "#0f172a"
                        : variant === "success"
                          ? "white"
                          : variant === "warning"
                            ? "white"
                            : "#f1f5f9",
            }}
        >
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <div style={{ transform: "scale(0.4)" }}>
                        <Loader />
                    </div>
                    <span>Loading...</span>
                </div>
            ) : (
                <>
                    {Icon && <Icon className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />}
                    {children}
                </>
            )}
        </motion.button>
    );

    // Handle completion with immediate UI update
    const handleCompletion = async () => {
        // Trigger completion animation immediately
        if (onCompletion) {
            onCompletion(jobKey, loadIndex);
        }

        // Call advanceStatus to mark as COMPLETED
        await advanceStatus(jobKey, loadIndex);
    };

    return (
        <div className="flex flex-col items-end gap-2">
            {load.status === "DRIED" ? (
                <div className="flex flex-col items-end gap-2">
                    <CustomButton
                        onClick={() => startDryingAgain(jobKey, loadIndex)}
                        disabled={load.pending || globalLoading}
                        icon={RefreshCw}
                        variant="warning"
                        size="sm"
                        isLoading={pendingRequests.has(`dry-again-${job.id}-${load.loadNumber}`)}
                    >
                        Again
                    </CustomButton>
                    <CustomButton
                        onClick={() => advanceStatus(jobKey, loadIndex)}
                        disabled={load.pending || globalLoading}
                        icon={ArrowRight}
                        variant="primary"
                        isLoading={pendingRequests.has(`advance-${job.id}-${load.loadNumber}`)}
                    >
                        Fold
                    </CustomButton>
                </div>
            ) : load.status === "FOLDING" ? (
                <CustomButton
                    onClick={handleCompletion}
                    disabled={load.pending || isAdvanceLoading}
                    icon={Check}
                    variant="success"
                    isLoading={isAdvanceLoading}
                >
                    {isAdvanceLoading ? "Loading..." : "Done"}
                </CustomButton>
            ) : normalizedServiceType === "Wash" && load.status === "WASHED" ? (
                <CustomButton
                    onClick={handleCompletion}
                    disabled={load.pending || isAdvanceLoading}
                    icon={Check}
                    variant="success"
                    isLoading={isAdvanceLoading}
                >
                    {isAdvanceLoading ? "Loading..." : "Done"}
                </CustomButton>
            ) : ["UNWASHED", "WASHED"].includes(load.status) ? (
                <CustomButton
                    onClick={() => startAction(jobKey, loadIndex)}
                    disabled={!canStart || isStartLoading}
                    icon={Play}
                    variant="primary"
                    title={!hasCorrectMachine ? `Please assign a ${machineType?.toLowerCase() || "machine"} first` : ""}
                    isLoading={isStartLoading}
                >
                    {isStartLoading ? "Starting..." : "Start"}
                </CustomButton>
            ) : load.status === "DRYING" ? (
                // Show loader animation during DRYING
                <div className="flex justify-end">
                    <div className="flex h-10 min-w-[80px] items-center justify-center">
                        <div style={{ transform: "scale(0.5)" }}>
                            <Loader />
                        </div>
                    </div>
                </div>
            ) : load.status === "COMPLETED" ? (
                <span className="flex items-center gap-1 font-medium text-green-600">
                    <Check className="h-4 w-4" />
                    <span style={{ color: isDarkMode ? "#10B981" : "#059669" }}>Done</span>
                </span>
            ) : null}
        </div>
    );
};

export default ActionButtons;
