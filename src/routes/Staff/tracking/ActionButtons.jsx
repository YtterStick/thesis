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
    onCompletion
}) => {
    if (isLoadRunning(load) || load.pending) {
        return (
            <div className="flex justify-end">
                <div
                    style={{
                        width: 40,
                        height: 40,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                    }}
                >
                    <div style={{ transform: "scale(0.5)" }}>
                        <Loader />
                    </div>
                </div>
            </div>
        );
    }

    const normalizedServiceType = job.serviceType?.replace(' Only', '') || job.serviceType;
    
    const machineType = getMachineTypeForStep(load.status, normalizedServiceType);
    const hasCorrectMachine = machineType ? 
        (load.machineId && machines[machineType]?.some(m => m.id === load.machineId)) : 
        true;

    const CustomButton = ({ 
        onClick, 
        disabled, 
        children, 
        icon: Icon, 
        variant = "primary",
        title,
        size = "md"
    }) => (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            onClick={() => {
                if (!disabled) {
                    if (onCompletion && variant === "success") {
                        onCompletion(jobKey, loadIndex);
                    }
                    onClick();
                }
            }}
            disabled={disabled}
            title={title}
            className={`
                flex items-center gap-2 font-medium transition-all rounded-lg
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}
                ${size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}
                ${
                    variant === 'primary' 
                    ? 'text-white' 
                    : variant === 'secondary'
                    ? 'border-2'
                    : variant === 'success'
                    ? 'text-white'
                    : variant === 'warning'
                    ? 'text-white'
                    : ''
                }
            `}
            style={{
                backgroundColor: 
                    variant === 'primary' ? (isDarkMode ? "#0f172a" : "#0f172a") :
                    variant === 'success' ? '#10B981' :
                    variant === 'warning' ? '#F59E0B' :
                    'transparent',
                borderColor: 
                    variant === 'secondary' ? (isDarkMode ? "#334155" : "#cbd5e1") :
                    'transparent',
                color: 
                    variant === 'secondary' ? (isDarkMode ? "#f1f5f9" : "#0f172a") :
                    variant === 'success' ? 'white' :
                    variant === 'warning' ? 'white' :
                    '#f1f5f9'
            }}
        >
            {Icon && <Icon className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />}
            {children}
        </motion.button>
    );

    return (
        <div className="flex flex-col items-end gap-2">
            {load.status === "DRIED" ? (
                <div className="flex flex-col gap-2 items-end">
                    <CustomButton
                        onClick={() => startDryingAgain(jobKey, loadIndex)}
                        disabled={load.pending}
                        icon={RefreshCw}
                        variant="warning"
                        size="sm"
                    >
                        Again
                    </CustomButton>
                    <CustomButton
                        onClick={() => advanceStatus(jobKey, loadIndex)}
                        disabled={load.pending}
                        icon={ArrowRight}
                        variant="primary"
                    >
                        Fold
                    </CustomButton>
                </div>
            ) : normalizedServiceType === "Wash" && load.status === "WASHED" ? (
                <CustomButton
                    onClick={() => advanceStatus(jobKey, loadIndex)}
                    disabled={load.pending}
                    icon={Check}
                    variant="success"
                >
                    Done
                </CustomButton>
            ) : ["UNWASHED", "WASHED"].includes(load.status) ? (
                <CustomButton
                    onClick={() => startAction(jobKey, loadIndex)}
                    disabled={!hasCorrectMachine || load.pending}
                    icon={Play}
                    variant="primary"
                    title={!hasCorrectMachine ? `Please assign a ${machineType?.toLowerCase() || "machine"} first` : ""}
                >
                    Start
                </CustomButton>
            ) : ["DRYING", "FOLDING"].includes(load.status) ? (
                <CustomButton
                    onClick={() => advanceStatus(jobKey, loadIndex)}
                    disabled={load.pending}
                    icon={ArrowRight}
                    variant="primary"
                >
                    Next
                </CustomButton>
            ) : load.status === "COMPLETED" ? (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                    <Check className="h-4 w-4" /> 
                    <span style={{ color: isDarkMode ? '#10B981' : '#059669' }}>
                        Done
                    </span>
                </span>
            ) : null}
        </div>
    );
};

export default ActionButtons;