import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  maskContact,
  isDarkMode
}) => {
  const [completingLoads, setCompletingLoads] = useState({});

  const handleCompletionAnimation = (jobKey, loadIndex) => {
    const completionKey = `${jobKey}-${loadIndex}`;
    setCompletingLoads(prev => ({
      ...prev,
      [completionKey]: true
    }));

    // Remove from completing state after animation
    setTimeout(() => {
      setCompletingLoads(prev => {
        const newState = { ...prev };
        delete newState[completionKey];
        return newState;
      });
    }, 5000);
  };

  const isLoadCompleting = (jobKey, loadIndex) => {
    return completingLoads[`${jobKey}-${loadIndex}`];
  };

  // Modified function to get visible loads - includes completing loads even if status is COMPLETED
  const getVisibleLoads = (job, expanded) => {
    const jobKey = getJobKey(job);
    
    // Get all loads that are either not completed OR are currently completing
    const visibleLoads = job.loads.filter(load => {
      const loadIndex = job.loads.findIndex(l => 
        l.loadNumber === load.loadNumber && l.status === load.status
      );
      const isCompleting = isLoadCompleting(jobKey, loadIndex);
      
      return load.status !== "COMPLETED" || isCompleting;
    });

    return expanded ? visibleLoads : visibleLoads.slice(0, 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 transition-all"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      }}
    >
      <div className="overflow-x-auto rounded-lg border-2"
        style={{
          borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
        }}>
        <table className="min-w-full table-auto text-sm">
          <thead style={{
            backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
          }}>
            <tr>
              {["Name", "Contact", "Service", "Fabric", "Detergent", "Load", "Status", "Machine", "Duration", "Action"].map((header) => (
                <th
                  key={header}
                  className="px-3 py-2 text-left text-xs font-medium"
                  style={{
                    color: isDarkMode ? '#13151B' : '#0B2B26',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-16 text-center text-sm"
                  style={{
                    color: isDarkMode ? '#6B7280' : '#0B2B26/70',
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/70' }} className="h-12 w-12" />
                    <span>No laundry jobs found</span>
                    <p className="text-sm">All jobs have been completed or no jobs are scheduled.</p>
                  </div>
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const jobKey = getJobKey(job);
                const expanded = expandedJobs[jobKey] || false;
                const visibleLoads = getVisibleLoads(job, expanded);

                if (visibleLoads.length === 0) return null;

                return (
                  <React.Fragment key={jobKey}>
                    {visibleLoads.map((load, i) => {
                      const originalIndex = job.loads.findIndex(
                        (l) => l.loadNumber === load.loadNumber && l.status === load.status,
                      );

                      const isCompleting = isLoadCompleting(jobKey, originalIndex);

                      // Normalize service type for machine selection
                      const normalizedServiceType = job.serviceType?.replace(' Only', '') || job.serviceType;
                      const machineType = getMachineTypeForStep(load.status, normalizedServiceType);
                      const options = machineType === "WASHER" ? machines.WASHER : machineType === "DRYER" ? machines.DRYER : [];

                      return (
                        <AnimatePresence key={`${jobKey}-load${load.loadNumber}`}>
                          <motion.tr
                            initial={false}
                            animate={{ 
                              scale: 1,
                              backgroundColor: isCompleting 
                                ? (isDarkMode ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.1)")
                                : (isDarkMode ? "#FFFFFF" : "#F3EDE3"),
                              borderColor: isCompleting 
                                ? "#10B981"
                                : (isDarkMode ? "#2A524C" : "#E0EAE8")
                            }}
                            exit={{ 
                              scale: 0.9, 
                              opacity: 0,
                              transition: { duration: 0.3 }
                            }}
                            transition={{ 
                              duration: 0.5,
                              ease: "easeOut"
                            }}
                            className="border-t transition-all hover:opacity-90"
                            style={{
                              borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                            }}
                          >
                            <td className="px-3 py-2 font-medium" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                              {job.customerName}
                            </td>
                            <td className="px-3 py-2" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                              {job.contact ? maskContact(job.contact) : "—"}
                            </td>
                            <td className="px-3 py-2">
                              <Badge
                                className="capitalize"
                                style={{
                                  backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.2)" : "rgba(11, 43, 38, 0.1)",
                                  color: isDarkMode ? '#13151B' : '#0B2B26',
                                  borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                }}
                              >
                                {/* Normalize display - show without "Only" suffix */}
                                {normalizedServiceType?.toLowerCase() || "—"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                              {Math.ceil(job.fabricQty ?? 0)}
                            </td>
                            <td className="px-3 py-2" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                              {Math.ceil(job.detergentQty ?? 0)}
                            </td>
                            <td className="px-3 py-2" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                              Load {load.loadNumber}
                            </td>
                            <td className="p-2">
                              <StatusIndicator
                                load={load}
                                now={now}
                                getRemainingTime={getRemainingTime}
                                isDarkMode={isDarkMode}
                              />
                            </td>
                            <td className="p-2">
                              {!["FOLDING", "COMPLETED"].includes(load.status) && (
                                <MachineSelector
                                  load={load}
                                  options={options}
                                  jobs={jobs}
                                  assignMachine={(machineId) => assignMachine(jobKey, originalIndex, machineId)}
                                  disabled={isLoadRunning(load) || load.status === "FOLDING" || load.status === "COMPLETED"}
                                  isDarkMode={isDarkMode}
                                />
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {isLoadRunning(load) ? (
                                <span className="font-semibold" style={{ color: '#0891B2' }}>
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
                                  (normalizedServiceType === "Wash & Dry" || normalizedServiceType === "Dry") &&
                                  (load.status === "FOLDING" || load.status === "COMPLETED")
                                ) && (
                                  <Select
                                    value={load.duration?.toString() ?? ""}
                                    onValueChange={(val) => updateDuration(jobKey, originalIndex, parseInt(val))}
                                    disabled={load.status === "FOLDING" || load.status === "COMPLETED"}
                                  >
                                    <SelectTrigger 
                                      className="mx-auto w-[120px] transition-all"
                                      style={{
                                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                        color: isDarkMode ? "#13151B" : "#0B2B26",
                                      }}
                                    >
                                      <SelectValue placeholder="Duration" />
                                    </SelectTrigger>
                                    <SelectContent
                                      style={{
                                        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                                        color: isDarkMode ? "#13151B" : "#0B2B26",
                                      }}
                                    >
                                      {[1, 20, 25, 30, 35, 40, 45, 50, 60].map((d) => (
                                        <SelectItem
                                          key={`${jobKey}-${originalIndex}-${d}`}
                                          value={d.toString()}
                                          className="cursor-pointer transition-colors"
                                          style={{
                                            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                                          }}
                                        >
                                          {d} mins
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )
                              )}
                            </td>
                            <td className="p-2 text-right">
                              <ActionButtons
                                load={load}
                                job={job}
                                jobKey={jobKey}
                                loadIndex={originalIndex}
                                isLoadRunning={isLoadRunning}
                                startAction={startAction}
                                advanceStatus={advanceStatus}
                                startDryingAgain={startDryingAgain}
                                getMachineTypeForStep={getMachineTypeForStep}
                                machines={machines}
                                isDarkMode={isDarkMode}
                                onCompletion={handleCompletionAnimation}
                              />
                            </td>
                          </motion.tr>
                        </AnimatePresence>
                      );
                    })}

                    {job.loads.length > 1 && (
                      <tr>
                        <td
                          colSpan={10}
                          className="p-2"
                        >
                          <div className="flex justify-center">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                setExpandedJobs((prev) => ({
                                  ...prev,
                                  [jobKey]: !expanded,
                                }))
                              }
                              className="flex items-center gap-1 px-3 py-1 rounded-lg transition-all"
                              style={{
                                backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                                color: isDarkMode ? '#13151B' : '#0B2B26',
                              }}
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
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default TrackingTable;