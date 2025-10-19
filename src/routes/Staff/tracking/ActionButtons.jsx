import React from "react";
import { Button } from "@/components/ui/button";
import DryAgainButton from "./DryAgainButton";
import NextButton from "./components/NextButton";
import StartButton from "./components/StartButton";
import ProceedToFoldingButton from "./components/ProceedToFoldingButton";
import Loader from "@/components/loader";
import { Check } from "lucide-react";

const ActionButtons = ({
    load,
    job,
    jobKey,
    loadIndex,
    isLoadRunning,
    startAction,
    advanceStatus,
    startDryingAgain,
    getMachineTypeForStep, // Add this prop
    machines // Add this prop to check available machines
}) => {
    if (isLoadRunning(load)) {
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

    // Check if the correct machine type is assigned for the current step
    const machineType = getMachineTypeForStep(load.status, job.serviceType);
    const hasCorrectMachine = machineType ? 
        (load.machineId && machines[machineType]?.some(m => m.id === load.machineId)) : 
        true;

    return (
        <div className="flex flex-col items-end gap-2">
            {load.status === "DRIED" ? (
                <>
                    <DryAgainButton
                        onClick={() => startDryingAgain(jobKey, loadIndex)}
                        disabled={load.pending}
                    />
                    <ProceedToFoldingButton
                        onClick={() => advanceStatus(jobKey, loadIndex)}
                        disabled={load.pending}
                    />
                </>
            ) : job.serviceType === "Wash" && load.status === "WASHED" ? (
                <Button
                    onClick={() => advanceStatus(jobKey, loadIndex)}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                >
                    <Check className="mr-1 h-4 w-4" /> Done
                </Button>
            ) : ["UNWASHED", "WASHED"].includes(load.status) ? (
                <StartButton
                    onClick={() => startAction(jobKey, loadIndex)}
                    disabled={!hasCorrectMachine || load.pending} // Use hasCorrectMachine instead of !load.machineId
                    title={!hasCorrectMachine ? "Please assign a " + (machineType?.toLowerCase() || "machine") + " first" : ""}
                />
            ) : ["DRYING", "FOLDING"].includes(load.status) ? (
                <NextButton
                    onClick={() => advanceStatus(jobKey, loadIndex)}
                    disabled={load.pending}
                />
            ) : load.status === "COMPLETED" ? (
                <span className="flex items-center gap-1 text-green-600">
                    <Check className="h-4 w-4" /> Done
                </span>
            ) : null}
        </div>
    );
};

export default ActionButtons;