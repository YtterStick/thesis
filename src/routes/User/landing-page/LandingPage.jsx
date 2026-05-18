import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/routes/User/layouts/Header";
import Footer from "@/routes/User/layouts/Footer";
import Services from "./services";
import ServiceTracking from "./ServiceTracking";
import TermsCondition from "./TermsCondition";
import { useScrollSpy } from "./useScrollSpy";
import assetLanding from "@/assets/USER_ASSET/asset_landing.jpg";
import { useTheme } from "@/hooks/use-theme";
import { getApiUrl } from "@/lib/api-config";

const AnimatedNumber = ({ value, isChanging }) => {
    if (!isChanging) {
        return <span>{value}</span>;
    }

    return (
        <div className="relative inline-block">
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={value}
                    initial={{
                        opacity: 0,
                        y: 30,
                        scale: 1.2,
                        rotateX: 90,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotateX: 0,
                    }}
                    exit={{
                        opacity: 0,
                        y: -30,
                        scale: 0.8,
                        rotateX: -90,
                    }}
                    transition={{
                        duration: 0.6,
                        ease: "easeOut",
                    }}
                    className="inline-block"
                    style={{
                        transformStyle: "preserve-3d",
                    }}
                >
                    {value}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};
const LandingPage = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [stats, setStats] = useState([
        { number: "0", label: "Total Laundry Load", changing: false },
        { number: "0", label: "Total No. of Washing", changing: false },
        { number: "0", label: "Total No. of Drying", changing: false },
    ]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const [autoSearchId, setAutoSearchId] = useState("");
    const [hasAutoSearched, setHasAutoSearched] = useState(false);

    // Use your theme hook
    const { theme } = useTheme();

    // Calculate isDarkMode based on theme
    const isDarkMode =
        theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const sectionIds = ["home", "services", "service_tracking", "terms"];
    const { activeSection, isScrolling } = useScrollSpy(sectionIds, {
        throttle: 150,
    });

    useEffect(() => {
        setIsVisible(true);

        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);

        // Check for auto-search parameter in URL
        const handleAutoSearch = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const searchParam = urlParams.get("search");

            if (searchParam && !hasAutoSearched) {
                console.log("🔍 Auto-search detected:", searchParam);
                setAutoSearchId(searchParam);
                setHasAutoSearched(true);

                // Scroll to service tracking section after a short delay to ensure component is mounted
                setTimeout(() => {
                    const trackingElement = document.getElementById("service_tracking");
                    if (trackingElement) {
                        console.log("📍 Scrolling to service tracking section");
                        trackingElement.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                    }
                }, 1000);
            }
        };

        // Check if we're already at the service_tracking section
        const checkHash = () => {
            if (window.location.hash === "#service_tracking") {
                console.log("📍 Already at service tracking section");
                handleAutoSearch();
            }
        };

        // Handle initial load
        if (window.location.hash === "#service_tracking" || window.location.search.includes("search=")) {
            handleAutoSearch();
        }

        // Also check hash changes
        window.addEventListener("hashchange", checkHash);

        return () => {
            window.removeEventListener("resize", checkMobile);
            window.removeEventListener("hashchange", checkHash);
        };
    }, [hasAutoSearched]);

    useEffect(() => {
        fetchLaundryStats();
    }, [refreshCounter]);

    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshCounter((prev) => prev + 1);
        }, 15000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const fetchLaundryStats = async () => {
        let controller = null;

        try {
            setIsRefreshing(true);

            controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(getApiUrl("laundry-jobs"), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const laundryJobs = await response.json();

            let totalUnwashed = 0;
            let totalWashing = 0;
            let totalDrying = 0;

            laundryJobs.forEach((job) => {
                if (job.loadAssignments && job.loadAssignments.length > 0) {
                    job.loadAssignments.forEach((load) => {
                        const status = load.status?.toUpperCase();

                        switch (status) {
                            case "NOT_STARTED":
                                totalUnwashed++;
                                break;
                            case "WASHING":
                                totalWashing++;
                                break;
                            case "DRYING":
                                totalDrying++;
                                break;
                            default:
                                break;
                        }
                    });
                }
            });

            setStats((prevStats) => {
                const newUnwashed = totalUnwashed.toString();
                const newWashing = totalWashing.toString();
                const newDrying = totalDrying.toString();

                const newStats = [
                    {
                        number: newUnwashed,
                        label: "Total Laundry Load",
                        changing: newUnwashed !== prevStats[0].number,
                    },
                    {
                        number: newWashing,
                        label: "Total No. of Washing",
                        changing: newWashing !== prevStats[1].number,
                    },
                    {
                        number: newDrying,
                        label: "Total No. of Drying",
                        changing: newDrying !== prevStats[2].number,
                    },
                ];

                const hasChanged = newStats.some((stat) => stat.changing);

                if (hasChanged) {
                    setTimeout(() => {
                        setStats((currentStats) => currentStats.map((stat) => ({ ...stat, changing: false })));
                    }, 1000);

                    return newStats;
                } else {
                    return prevStats;
                }
            });
        } catch (error) {
            if (error.name !== "AbortError") {
                setStats([
                    { number: "0", label: "Total Laundry Load", changing: false },
                    { number: "0", label: "Total No. of Washing", changing: false },
                    { number: "0", label: "Total No. of Drying", changing: false },
                ]);
            }
        } finally {
            setIsRefreshing(false);
            controller = null;
        }
    };

    const handleOurServiceClick = () => {
        setTimeout(() => {
            const servicesElement = document.getElementById("services");
            if (servicesElement) {
                servicesElement.scrollIntoView({ behavior: "smooth" });
            }
        }, 100);
    };

    const handleMyLaundryClick = () => {
        setTimeout(() => {
            const trackingElement = document.getElementById("service_tracking");
            if (trackingElement) {
                trackingElement.scrollIntoView({ behavior: "smooth" });
            }
        }, 100);
    };

    return (
        <div
            className={`min-h-screen transition-colors duration-500 overflow-hidden relative ${
                isDarkMode ? "bg-[#030712] text-slate-100" : "bg-[#f8fafc] text-slate-900"
            } font-poppins`}
            id="home"
        >
            {/* Ambient background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] pointer-events-none" />



            {/* Header layout */}
            <Header activeSection={activeSection} />

            <div className="h-24" />

            {/* HERO: INTERACTIVE TRACKING HUB */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: isVisible ? 1 : 0 }}
                transition={{ duration: 0.8 }}
                className="relative py-12 md:py-20 z-10"
            >
                <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left Column: Title & Launch Console */}
                    <div className="lg:col-span-7 flex flex-col justify-center">

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black tracking-tight leading-none"
                            style={{ color: isDarkMode ? "#ffffff" : "#0f172a" }}
                        >
                            Track Your
                            <br />
                            <span className="font-extrabold bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
                                Laundry Freshness
                            </span>
                            <br />
                            In Real Time.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-base md:text-lg text-slate-400 dark:text-slate-500 leading-relaxed mt-6 max-w-xl"
                        >
                            Skip the phone calls and guesswork. Use our state-of-the-art live tracking engine to watch your garments go from washing, to drying, to folding, and ready for pickup.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-4 mt-8"
                        >
                            <button
                                onClick={handleMyLaundryClick}
                                className="px-8 py-4 rounded-xl text-base font-bold shadow-xl transition-all hover:scale-105 active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer text-center"
                            >
                                Track My Laundry Now
                            </button>
                            <button
                                onClick={handleOurServiceClick}
                                className="px-8 py-4 rounded-xl text-base font-bold border transition-all hover:scale-105 active:scale-95 cursor-pointer text-center bg-slate-100/50 dark:bg-slate-900/50 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                                style={{
                                    color: isDarkMode ? "#ffffff" : "#0f172a",
                                }}
                            >
                                View Pricing & Services
                            </button>
                        </motion.div>
                    </div>

                    {/* Right Column: Live Shop Monitor Dashboard */}
                    <div className="lg:col-span-5 relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="w-full rounded-3xl border p-6 md:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden"
                            style={{
                                backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.7)",
                                borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
                            }}
                        >
                            {/* Decorative ambient background grid for deep styling */}
                            <div 
                                className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none" 
                                style={{
                                    backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 1px, transparent 1px)',
                                    backgroundSize: '16px 16px'
                                }}
                            />

                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">
                                LIVE SHOP ACTIVITY
                            </h3>

                            <div className="flex flex-col gap-6">
                                {/* Washing Machine Live Card */}
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 backdrop-blur-sm">
                                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                                        <svg
                                            className="h-7 w-7 animate-spin"
                                            style={{ animationDuration: '6s' }}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeDasharray="4 4" />
                                            <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" fill="currentColor" fillOpacity={0.2} />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Washing Station</h4>
                                        <div className="text-xl font-black tracking-tight mt-0.5" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>
                                            <AnimatedNumber value={stats[1].number} isChanging={stats[1].changing} /> Machines Active
                                        </div>
                                    </div>
                                </div>

                                {/* Dryer Machine Live Card */}
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-sm">
                                    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
                                        <svg
                                            className="h-7 w-7 animate-pulse"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Dryer Station</h4>
                                        <div className="text-xl font-black tracking-tight mt-0.5" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>
                                            <AnimatedNumber value={stats[2].number} isChanging={stats[2].changing} /> Machines Drying
                                        </div>
                                    </div>
                                </div>

                                {/* Active Queue Counter */}
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-sm">
                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                                        <svg
                                            className="h-7 w-7"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Loads In Queue</h4>
                                        <div className="text-xl font-black tracking-tight mt-0.5" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>
                                            <AnimatedNumber value={stats[0].number} isChanging={stats[0].changing} /> In Assembly
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* LIVE ACTION PORTAL: SERVICE TRACKING (Centerpiece) */}
            <div id="service_tracking" className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 mb-16">
                <div className="text-center mb-8">
                    <h2 className="text-xs font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-2">Live Query Portal</h2>
                    <p className="text-2xl md:text-4xl font-black tracking-tight" style={{ color: isDarkMode ? "#f8fafc" : "#0f172a" }}>Track Your Service</p>
                </div>
                
                <ServiceTracking
                    isVisible={isVisible}
                    isDarkMode={isDarkMode}
                    autoSearchId={autoSearchId}
                />
            </div>

            {/* SERVICE CATALOG & PRICING */}
            <div id="services" className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 mb-16">
                <Services
                    isVisible={isVisible}
                    isMobile={isMobile}
                    isDarkMode={isDarkMode}
                />
            </div>

            {/* TERMS, DISCLOSURES & FAQs */}
            <div id="terms" className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 mb-20">
                <TermsCondition
                    isVisible={isVisible}
                    isMobile={isMobile}
                    isDarkMode={isDarkMode}
                />
            </div>

            {/* FOOTER */}
            <Footer isDarkMode={isDarkMode} />
        </div>
    );
};

export default LandingPage;
