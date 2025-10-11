import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

const SkeletonLoader = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Stable Skeleton Loader Components
  const SkeletonCard = () => (
    <div
      className="rounded-xl border-2 p-5"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="rounded-lg p-2"
          style={{
            backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
          }}
        >
          <div className="h-6 w-6"></div>
        </div>
        <div className="text-right">
          <div className="h-6 w-20 rounded"
               style={{
                 backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
               }} />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="h-5 w-28 rounded"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }} />
      </div>
    </div>
  );

  const SkeletonTable = () => (
    <div
      className="rounded-xl border-2 p-5"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 rounded"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }} />
        <div className="h-4 w-24 rounded"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }} />
      </div>

      {/* Table Header Skeleton */}
      <div className="overflow-x-auto rounded-lg border-2 mb-4"
           style={{
             borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
           }}>
        <div className="min-w-full">
          <div className="grid grid-cols-10 gap-4 p-4"
               style={{
                 backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
               }}>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-4 rounded"
                   style={{
                     backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
                   }} />
            ))}
          </div>
        </div>
      </div>

      {/* Table Rows Skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-10 gap-4 p-4 rounded-lg border-2"
               style={{
                 backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3",
                 borderColor: isDarkMode ? "#2A524C" : "#E0EAE8",
               }}>
            {[...Array(10)].map((_, colIndex) => (
              <div key={colIndex} 
                   className={`h-4 rounded ${colIndex === 0 ? "w-4" : "w-full"}`}
                   style={{
                     backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8",
                   }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
      {/* Header Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-4"
      >
        <div
          className="rounded-lg p-2"
          style={{
            backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
          }}
        >
          <div className="h-6 w-6"></div>
        </div>
        <div>
          <div className="h-6 w-44 rounded mb-1"
               style={{
                 backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
               }} />
          <div className="h-4 w-60 rounded"
               style={{
                 backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
               }} />
        </div>
      </motion.div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <AnimatePresence mode="wait">
          {[...Array(4)].map((_, index) => (
            <motion.div
              key={`skeleton-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <SkeletonCard />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Table Skeleton */}
      <AnimatePresence mode="wait">
        <motion.div
          key="skeleton-table"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <SkeletonTable />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SkeletonLoader;