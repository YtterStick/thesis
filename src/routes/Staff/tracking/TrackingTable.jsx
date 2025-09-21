import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ArrowDown, ArrowUp, CheckCircle } from "lucide-react";
import MachineSelector from "./MachineSelector";
import StatusIndicator from "./StatusIndicator";
import ActionButtons from "./ActionButtons";

const TrackingTable = ({
    jobs,
    expandedJobs,
    setExpandedJobs,
    machines,
    now,
    assignMachine,
    updateDuration,
    startAction,
    advanceStatus,
    startDryingAgain,
    getJobKey,
    getRemainingTime,
    getMachineTypeForStep,
    isLoadRunning,
    maskContact
}) => {
    return (
        <div className="rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80">
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Fabric</TableHead>
                        <TableHead>Detergent</TableHead>
                        <TableHead>Load</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Machine</TableHead>
                        <TableHead className="text-center">Duration</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {jobs.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={10}
                                className="py-16"
                            >
                                <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                                    <CheckCircle className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-500" />
                                    <p className="text-lg font-medium">No laundry jobs found</p>
                                    <p className="text-sm">All jobs have been completed or no jobs are scheduled.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        jobs.map((job) => {
                            const jobKey = getJobKey(job);
                            const expanded = expandedJobs[jobKey] || false;
                            const visibleLoads = expanded ? job.loads : job.loads.slice(0, 1);

                            return (
                                <React.Fragment key={jobKey}>
                                    {visibleLoads.map((load, i) => {
                                        const machineType = getMachineTypeForStep(load.status, job.serviceType);
                                        const options =
                                            machineType === "WASHER"
                                                ? machines.WASHER
                                                : machineType === "DRYER"
                                                  ? machines.DRYER
                                                  : [];

                                        return (
                                            <TableRow
                                                key={`${jobKey}-load${i + 1}`}
                                                className="border-t border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800/50"
                                            >
                                                <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                                    {job.customerName}
                                                </TableCell>
                                                <TableCell className="text-slate-700 dark:text-slate-300">
                                                    {job.contact ? maskContact(job.contact) : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className="border-slate-300 capitalize text-slate-700 dark:border-slate-600 dark:text-slate-300"
                                                    >
                                                        {job.serviceType?.toLowerCase() || "—"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-700 dark:text-slate-300">
                                                    {Math.ceil(job.fabricQty ?? 0)}
                                                </TableCell>
                                                <TableCell className="text-slate-700 dark:text-slate-300">
                                                    {Math.ceil(job.detergentQty ?? 0)}
                                                </TableCell>
                                                <TableCell className="text-slate-700 dark:text-slate-300">Load {load.loadNumber}</TableCell>
                                                <TableCell>
                                                    <StatusIndicator
                                                        load={load}
                                                        now={now}
                                                        getRemainingTime={getRemainingTime}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {!["FOLDING", "COMPLETED"].includes(load.status) && (
                                                        <MachineSelector
                                                            load={load}
                                                            options={options}
                                                            jobs={jobs}
                                                            assignMachine={(machineId) => assignMachine(jobKey, i, machineId)}
                                                            disabled={
                                                                isLoadRunning(load) || load.status === "FOLDING" || load.status === "COMPLETED"
                                                            }
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {isLoadRunning(load) ? (
                                                        <span className="font-semibold text-blue-600">
                                                            {(() => {
                                                                const remaining = getRemainingTime(load);
                                                                return remaining < 60
                                                                    ? `${remaining}s`
                                                                    : `${Math.floor(remaining / 60)}m ${(remaining % 60)
                                                                          .toString()
                                                                          .padStart(2, "0")}s`;
                                                            })()}
                                                        </span>
                                                    ) : (
                                                        !(
                                                            (job.serviceType === "Wash & Dry" || job.serviceType === "Dry") &&
                                                            (load.status === "FOLDING" || load.status === "COMPLETED")
                                                        ) && (
                                                            <Select
                                                                value={load.duration?.toString() ?? ""}
                                                                onValueChange={(val) => updateDuration(jobKey, i, parseInt(val))}
                                                                disabled={load.status === "FOLDING" || load.status === "COMPLETED"}
                                                            >
                                                                <SelectTrigger className="mx-auto w-[120px] border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-950">
                                                                    <SelectValue placeholder="Duration" />
                                                                </SelectTrigger>
                                                                <SelectContent className="border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                                                                    {[1, 20, 25, 30, 35, 40, 45, 50, 60].map((d) => (
                                                                        <SelectItem
                                                                            key={`${jobKey}-${i}-${d}`}
                                                                            value={d.toString()}
                                                                            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                        >
                                                                            {d} mins
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <ActionButtons
                                                        load={load}
                                                        job={job}
                                                        jobKey={jobKey}
                                                        loadIndex={i}
                                                        isLoadRunning={isLoadRunning}
                                                        startAction={startAction}
                                                        advanceStatus={advanceStatus}
                                                        startDryingAgain={startDryingAgain}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    {job.loads.length > 1 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={10}
                                                className="p-2"
                                            >
                                                <div className="flex justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() =>
                                                            setExpandedJobs((prev) => ({
                                                                ...prev,
                                                                [jobKey]: !expanded,
                                                            }))
                                                        }
                                                        className="flex items-center gap-1 text-blue-600 hover:underline"
                                                    >
                                                        {expanded ? (
                                                            <>
                                                                See less <ArrowUp className="h-4 w-4" />
                                                        </>
                                                        ) : (
                                                            <>
                                                                See more <ArrowDown className="h-4 w-4" />
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default TrackingTable;