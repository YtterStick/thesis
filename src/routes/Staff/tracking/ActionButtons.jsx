import React from "react";
import { Check, Play, ArrowRight, RefreshCw, Loader2 } from "lucide-react";

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
    globalLoading = false,
    pendingRequests = new Set(),
}) => {
    const startRequestId = `start-${job.id}-${load.loadNumber}`;
    const advanceRequestId = `advance-${job.id}-${load.loadNumber}`;
    const dryAgainRequestId = `dry-again-${job.id}-${load.loadNumber}`;

    const isStartLoading = pendingRequests.has(startRequestId);
    const isAdvanceLoading = pendingRequests.has(advanceRequestId);
    const isDryAgainLoading = pendingRequests.has(dryAgainRequestId);

    const normalizedServiceType = job.serviceType?.replace(" Only", "") || job.serviceType;
    const machineType = getMachineTypeForStep(load.status, normalizedServiceType);
    const hasCorrectMachine = machineType ? load.machineId && machines[machineType]?.some((m) => m.id === load.machineId) : true;

    const canStart = !load.pending && !isLoadRunning(load) && hasCorrectMachine && (load.status === "UNWASHED" || load.status === "WASHED");

    const ActionButton = ({ onClick, disabled, children, icon: Icon, variant = "primary" }) => (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onClick();
            }}
            disabled={disabled}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-tight transition-all active:scale-95 ${
                disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:brightness-110"
            } ${
                variant === "primary" ? "bg-slate-900 text-white" : 
                variant === "success" ? "bg-emerald-600 text-white" :
                variant === "warning" ? "bg-amber-500 text-white" : "border-2 border-slate-200"
            }`}
        >
            {disabled && (isStartLoading || isAdvanceLoading || isDryAgainLoading) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <>
                    {Icon && <Icon className="h-4 w-4" />}
                    {children}
                </>
            )}
        </button>
    );

    if (load.status === "COMPLETED") {
        return (
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs uppercase">
                <Check className="h-4 w-4" />
                Done
            </div>
        );
    }

    return (
        <div className="flex gap-2">
            {load.status === "DRIED" && (
                <>
                    <ActionButton
                        onClick={() => startDryingAgain(jobKey, loadIndex)}
                        disabled={load.pending || globalLoading || isDryAgainLoading}
                        icon={RefreshCw}
                        variant="warning"
                    >
                        Again
                    </ActionButton>
                    <ActionButton
                        onClick={() => advanceStatus(jobKey, loadIndex)}
                        disabled={load.pending || globalLoading || isAdvanceLoading}
                        icon={ArrowRight}
                    >
                        Fold
                    </ActionButton>
                </>
            )}

            {load.status === "FOLDING" && (
                <ActionButton
                    onClick={() => advanceStatus(jobKey, loadIndex)}
                    disabled={load.pending || globalLoading || isAdvanceLoading}
                    icon={Check}
                    variant="success"
                >
                    Finish
                </ActionButton>
            )}

            {normalizedServiceType === "Wash" && load.status === "WASHED" && (
                <ActionButton
                    onClick={() => advanceStatus(jobKey, loadIndex)}
                    disabled={load.pending || globalLoading || isAdvanceLoading}
                    icon={Check}
                    variant="success"
                >
                    Finish
                </ActionButton>
            )}

            {["UNWASHED", "WASHED"].includes(load.status) && (normalizedServiceType !== "Wash" || load.status !== "WASHED") && (
                <ActionButton
                    onClick={() => startAction(jobKey, loadIndex)}
                    disabled={!canStart || isStartLoading || globalLoading}
                    icon={Play}
                >
                    Start {machineType === "WASHER" ? "Wash" : machineType === "DRYER" ? "Dry" : ""}
                </ActionButton>
            )}

            {(load.status === "WASHING" || load.status === "DRYING") && (
                <ActionButton
                    onClick={() => advanceStatus(jobKey, loadIndex)}
                    disabled={load.pending || globalLoading || isAdvanceLoading}
                    icon={ArrowRight}
                >
                    Next
                </ActionButton>
            )}
        </div>
    );
};

export default ActionButtons;