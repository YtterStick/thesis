import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { ChevronLeft, ChevronRight, Clock, Package, Pause } from "lucide-react";

const LaundryProgress = ({ isVisible, isDarkMode, isMobile, currentLoadIndex, laundryLoads, prevLoad, nextLoad, goToLoad }) => {
    if (!isVisible) return null;

    const currentLoad = laundryLoads[currentLoadIndex];
    const currentStep = currentLoad.statusSteps.find((step) => step.active) || currentLoad.statusSteps[0];
    const isNotStarted = currentStep.title === "Not Started";

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.5 }}
            className="mb-4"
        >
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <h3
                    className="text-center text-lg font-black tracking-tight sm:text-left md:text-xl"
                    style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}
                >
                    Laundry Progress
                </h3>

                <div className="flex flex-col items-center gap-3 sm:flex-row">
                    <div
                        className="rounded-xl border px-3 py-1.5 text-xs font-bold shadow-sm"
                        style={{
                            backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : "rgba(255, 255, 255, 0.4)",
                            color: isDarkMode ? "#3b82f6" : "#2563eb",
                            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                        }}
                    >
                        Load {currentLoadIndex + 1} of {laundryLoads.length}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={prevLoad}
                            disabled={currentLoadIndex === 0}
                            className="rounded-xl p-2 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                            style={{
                                backgroundColor: currentLoadIndex === 0 ? "rgba(15,23,42,0.1)" : isDarkMode ? "rgba(255,255,255,0.05)" : "#ffffff",
                                color: currentLoadIndex === 0 ? "#94a3b8" : isDarkMode ? "#f8fafc" : "#0f172a",
                                border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)"}`,
                            }}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="mx-2 flex gap-1.5 items-center">
                            {laundryLoads.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToLoad(index)}
                                    className={`h-2 rounded-full transition-all cursor-pointer ${
                                        index === currentLoadIndex
                                            ? "bg-blue-600 w-6 scale-110 shadow-md"
                                            : "bg-slate-300 dark:bg-slate-700 w-2 hover:bg-slate-400 dark:hover:bg-slate-600"
                                    }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={nextLoad}
                            disabled={currentLoadIndex === laundryLoads.length - 1}
                            className="rounded-xl p-2 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                            style={{
                                backgroundColor: currentLoadIndex === laundryLoads.length - 1 ? "rgba(15,23,42,0.1)" : isDarkMode ? "rgba(255,255,255,0.05)" : "#ffffff",
                                color: currentLoadIndex === laundryLoads.length - 1 ? "#94a3b8" : isDarkMode ? "#f8fafc" : "#0f172a",
                                border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)"}`,
                            }}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
            <div
                className="mb-3 rounded-xl border p-3.5 shadow-sm"
                style={{
                    backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.2)" : "rgba(255, 255, 255, 0.4)",
                    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(15, 23, 42, 0.06)",
                    color: isDarkMode ? "#cbd5e1" : "#475569",
                }}
            >
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Load Number</span>
                        <p className="font-bold text-sm mt-0.5" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>{currentLoad.loadNumber}</p>
                    </div>
                    <div className="flex flex-col items-center border-x" style={{ borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)" }}>
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Fabric</span>
                        <p className="font-bold text-sm mt-0.5" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>{currentLoad.fabricType}</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Detergent</span>
                        <p className="font-bold text-sm mt-0.5" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>{currentLoad.detergent}</p>
                    </div>
                </div>
            </div>
            {isMobile && (
                <div
                    className="relative rounded-xl border p-4 shadow-sm"
                    style={{
                        backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.3)" : "rgba(255, 255, 255, 0.65)",
                        borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                        color: isDarkMode ? "#cbd5e1" : "#475569",
                    }}
                >
                    {/* Blur overlay for not started state */}
                    {isNotStarted && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black bg-opacity-45 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 text-center"
                            >
                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 border border-slate-700 p-3 shadow-md">
                                    <Pause className="h-6 w-6 text-slate-300" />
                                </div>
                                <h4 className="mb-1 text-sm font-bold text-white">Laundry Not Started</h4>
                                <p className="text-xs text-white opacity-90">Your laundry is waiting in queue</p>
                            </motion.div>
                        </div>
                    )}

                    <div className="mb-3 text-center">
                        <div className="relative mx-auto mb-2 h-12 w-12">
                            <Lottie
                                animationData={currentStep.lottie}
                                loop={currentStep.active && !isNotStarted}
                                autoplay={!isNotStarted}
                            />
                            {isNotStarted && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Clock className="h-8 w-8 text-gray-400" />
                                </div>
                            )}
                        </div>
                        <h4 className="mb-1 text-sm font-semibold">{currentStep.title}</h4>
                        <p className="mb-2 text-xs">{currentStep.description}</p>
                    </div>

                    <div
                        className={`rounded-xl p-2.5 text-center text-xs border ${
                            isNotStarted 
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300/40" 
                              : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }`}
                    >
                        <div className="mb-1 flex items-center justify-center gap-1">
                            {isNotStarted ? (
                                <>
                                    <Clock className="h-3 w-3" />
                                    <span className="font-semibold">On Hold</span>
                                </>
                            ) : (
                                <>
                                    <div
                                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500"
                                    />
                                    <span className="font-semibold">Live</span>
                                </>
                            )}
                        </div>
                        <p className="font-semibold">{isNotStarted ? "Waiting to start" : `EST: ${currentStep.estimatedTime}`}</p>
                    </div>

                    {/* Additional info for not started state */}
                    {isNotStarted && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-3 rounded-xl border p-2 text-center"
                            style={{
                                backgroundColor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0, 0, 0, 0.02)",
                                borderColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(15, 23, 42, 0.06)",
                            }}
                        >
                            <div className="mb-1 flex items-center justify-center gap-2">
                               <Package className="h-3 w-3" />
                                <span className="text-xs font-semibold">Ready to Process</span>
                            </div>
                            <p className="text-xs opacity-75">Your laundry will begin washing soon</p>
                        </motion.div>
                    )}
                </div>
            )}

            
            {!isMobile && (
                <>
                    <div className="relative mb-4 mt-2">
                        <div className="absolute left-0 right-0 top-8 z-10 h-1 bg-slate-200 dark:bg-slate-800"></div>

                        {/* Progress bar - 0% when no active steps (NOT_STARTED) */}
                        <div
                            className="absolute left-0 top-8 z-20 h-1 transition-all duration-500"
                            style={{
                                width: `${
                                    currentLoad.statusSteps.findIndex((s) => s.active) >= 0
                                        ? ((currentLoad.statusSteps.findIndex((s) => s.active) + 1) / currentLoad.statusSteps.length) * 100
                                        : 0
                                }%`,
                                background: "linear-gradient(to right, #3b82f6, #6366f1)",
                            }}
                        ></div>

                        {/* Always 4 columns for desktop */}
                        <div className="relative z-30 grid grid-cols-4 gap-2">
                            {currentLoad.statusSteps.map((step, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col items-center"
                                >
                                    {/* Dot indicator - inactive when NOT_STARTED */}
                                    <div
                                        className={`z-30 mb-4 h-4.5 w-4.5 rounded-full border-4 transition-all duration-300 ${
                                            step.active
                                                ? "border-blue-500 bg-white scale-125 shadow-lg shadow-blue-500/50"
                                                : index < currentLoad.statusSteps.findIndex((s) => s.active)
                                                  ? "border-blue-600 bg-blue-600"
                                                  : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900"
                                        }`}
                                    ></div>

                                    {/* Animation - inactive when NOT_STARTED */}
                                    <div className={`mb-2 transition-all duration-300 ${step.active ? "scale-110" : "opacity-50 grayscale"}`}>
                                        <div className="flex h-12 w-12 items-center justify-center">
                                            <Lottie
                                                animationData={step.lottie}
                                                loop={step.active}
                                                autoplay={step.active}
                                                style={{
                                                    width: step.active ? 48 : 40,
                                                    height: step.active ? 48 : 40,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="w-full px-1 text-center">
                                        <h4
                                            className="mb-1 text-xs font-bold leading-tight"
                                            style={{
                                                color: step.active 
                                                    ? (isDarkMode ? "#f8fafc" : "#0f172a") 
                                                    : (isDarkMode ? "#64748b" : "#94a3b8")
                                            }}
                                        >
                                            {step.title}
                                        </h4>
                                        <p
                                            className="mb-2 text-[11px] leading-tight opacity-75"
                                            style={{
                                                color: step.active 
                                                    ? (isDarkMode ? "#cbd5e1" : "#475569") 
                                                    : (isDarkMode ? "#94a3b8" : "#cbd5e1")
                                            }}
                                        >
                                            {step.description}
                                        </p>

                                        <div
                                            className={`flex min-h-[2.2rem] items-center justify-center rounded-xl p-1 text-xs font-bold border transition-colors ${
                                                step.active 
                                                    ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                                                    : "bg-slate-100 dark:bg-slate-800/40 text-slate-500 border-slate-200/50 dark:border-slate-800"
                                            }`}
                                        >
                                            <span className="text-center leading-tight">EST: {step.estimatedTime}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </>
            )}
        </motion.div>
    );
};

export default LaundryProgress;
