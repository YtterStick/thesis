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
                    className="text-center text-lg font-bold sm:text-left md:text-xl"
                    style={{ color: isDarkMode ? "#13151B" : "#F3EDE3" }}
                >
                    Laundry Progress
                </h3>

                <div className="flex flex-col items-center gap-3 sm:flex-row">
                    <div
                        className="rounded-lg border px-3 py-1 text-sm font-semibold"
                        style={{
                            backgroundColor: isDarkMode ? "#FFFFFF" : "#183D3D",
                            color: isDarkMode ? "#18442A" : "#F3EDE3",
                            borderColor: isDarkMode ? "#2A524C" : "#F3EDE3",
                        }}
                    >
                        Load {currentLoadIndex + 1} of {laundryLoads.length}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={prevLoad}
                            disabled={currentLoadIndex === 0}
                            className="rounded-lg p-2 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30"
                            style={{
                                backgroundColor: currentLoadIndex === 0 ? "#E5E7EB" : isDarkMode ? "#18442A" : "#F3EDE3",
                                color: currentLoadIndex === 0 ? "#6B7280" : isDarkMode ? "#FFFFFF" : "#183D3D",
                                border: `2px solid ${isDarkMode ? "#2A524C" : "#F3EDE3"}`,
                            }}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="mx-2 flex gap-1">
                            {laundryLoads.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToLoad(index)}
                                    className={`h-3 w-3 rounded-full border transition-all ${
                                        index === currentLoadIndex
                                            ? (isDarkMode ? "bg-[#18442A]" : "bg-[#F3EDE3]") + " scale-125 border-white shadow-lg"
                                            : "border-gray-400 bg-gray-300 hover:bg-gray-400"
                                    }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={nextLoad}
                            disabled={currentLoadIndex === laundryLoads.length - 1}
                            className="rounded-lg p-2 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30"
                            style={{
                                backgroundColor: currentLoadIndex === laundryLoads.length - 1 ? "#E5E7EB" : isDarkMode ? "#18442A" : "#F3EDE3",
                                color: currentLoadIndex === laundryLoads.length - 1 ? "#6B7280" : isDarkMode ? "#FFFFFF" : "#183D3D",
                                border: `2px solid ${isDarkMode ? "#2A524C" : "#F3EDE3"}`,
                            }}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
            <div
                className="mb-3 rounded-lg border-2 p-3"
                style={{
                    backgroundColor: isDarkMode ? "#FFFFFF" : "#183D3D",
                    borderColor: isDarkMode ? "#2A524C" : "#F3EDE3",
                    color: isDarkMode ? "#13151B" : "#F3EDE3",
                }}
            >
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div>
                        <span className="text-xs">Load Number</span>
                        <p className="font-semibold">{currentLoad.loadNumber}</p>
                    </div>
                    <div>
                        <span className="text-xs">Fabric</span>
                        <p className="font-semibold">{currentLoad.fabricType}</p>
                    </div>
                    <div>
                        <span className="text-xs">Detergent</span>
                        <p className="font-semibold">{currentLoad.detergent}</p>
                    </div>
                </div>
            </div>
            {isMobile && (
                <div
                    className="relative rounded-lg border-2 p-3"
                    style={{
                        backgroundColor: isDarkMode ? "#FFFFFF" : "#183D3D",
                        borderColor: isDarkMode ? "#2A524C" : "#F3EDE3",
                        color: isDarkMode ? "#13151B" : "#F3EDE3",
                    }}
                >
                    {/* Blur overlay for not started state */}
                    {isNotStarted && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black bg-opacity-40 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 text-center"
                            >
                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white p-3">
                                    <Pause className="h-6 w-6 text-gray-600" />
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
                        className={`rounded-lg p-2 text-center text-xs ${
                            isNotStarted ? "bg-gray-300 text-gray-600" : isDarkMode ? "bg-[#18442A] text-white" : "bg-[#F3EDE3] text-[#183D3D]"
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
                                        className="h-1 w-1 animate-pulse rounded-full"
                                        style={{ backgroundColor: isDarkMode ? "#FFFFFF" : "#183D3D" }}
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
                            className="mt-3 rounded-lg border p-2 text-center"
                            style={{
                                backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(24, 61, 61, 0.1)",
                                borderColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(24, 61, 61, 0.2)",
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
                    <div className="relative mb-4">
                        <div className="absolute left-0 right-0 top-8 z-10 h-1 bg-gray-300"></div>

                        {/* Progress bar - 0% when no active steps (NOT_STARTED) */}
                        <div
                            className="absolute left-0 top-8 z-20 h-1 transition-all duration-500"
                            style={{
                                width: `${
                                    currentLoad.statusSteps.findIndex((s) => s.active) >= 0
                                        ? ((currentLoad.statusSteps.findIndex((s) => s.active) + 1) / currentLoad.statusSteps.length) * 100
                                        : 0
                                }%`,
                                backgroundColor: isDarkMode ? "#18442A" : "#F3EDE3",
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
                                        className={`border-3 z-30 mb-4 h-4 w-4 rounded-full ${
                                            step.active
                                                ? (isDarkMode ? "border-[#18442A] bg-[#18442A]" : "border-[#F3EDE3] bg-[#F3EDE3]") + " scale-110"
                                                : index < currentLoad.statusSteps.findIndex((s) => s.active)
                                                  ? isDarkMode
                                                      ? "border-[#18442A] bg-[#18442A]"
                                                      : "border-[#F3EDE3] bg-[#F3EDE3]"
                                                  : "border-gray-300 bg-white"
                                        } transition-all duration-300`}
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
                                            className={`mb-1 text-xs font-semibold leading-tight ${
                                                step.active
                                                    ? isDarkMode
                                                        ? "text-[#13151B]"
                                                        : "text-[#F3EDE3]"
                                                    : isDarkMode
                                                      ? "text-[#6B7280]"
                                                      : "text-[#F3EDE3]"
                                            }`}
                                        >
                                            {step.title}
                                        </h4>
                                        <p
                                            className={`mb-2 text-xs leading-tight ${
                                                step.active
                                                    ? isDarkMode
                                                        ? "text-[#6B7280]"
                                                        : "text-[#F3EDE3]"
                                                    : isDarkMode
                                                      ? "text-[#93A29F]"
                                                      : "text-[#F3EDE3]"
                                            }`}
                                        >
                                            {step.description}
                                        </p>

                                        <div
                                            className={`flex min-h-[2rem] items-center justify-center rounded p-1 text-xs font-semibold ${
                                                step.active ? (isDarkMode ? "text-white" : "text-[#183D3D]") : "bg-gray-200 text-gray-600"
                                            }`}
                                            style={{
                                                backgroundColor: step.active ? (isDarkMode ? "#18442A" : "#F3EDE3") : undefined,
                                            }}
                                        >
                                            <span className="text-center leading-tight">EST: {step.estimatedTime}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop message for NOT_STARTED state */}
                    {currentLoad.statusSteps.every((step) => !step.active) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 rounded-lg border p-4 text-center"
                            style={{
                                backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(24, 61, 61, 0.05)",
                                borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(24, 61, 61, 0.1)",
                                color: isDarkMode ? "#F3EDE3" : "#183D3D",
                            }}
                        >
                            <div className="mb-2 flex items-center justify-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-semibold">Laundry Not Started Yet</span>
                            </div>
                            <p className="text-sm opacity-75">Your laundry is in queue and will begin processing soon</p>
                        </motion.div>
                    )}
                </>
            )}
        </motion.div>
    );
};

export default LaundryProgress;
