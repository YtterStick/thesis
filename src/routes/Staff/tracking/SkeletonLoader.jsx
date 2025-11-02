import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

const SkeletonLoader = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const SkeletonCard = () => (
    <div
      className="rounded-xl border-2 p-5"
      style={{
        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="rounded-lg p-2"
          style={{
            backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
          }}
        >
          <div className="h-6 w-6"></div>
        </div>
        <div className="text-right">
          <div className="h-6 w-20 rounded"
               style={{
                 backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
               }} />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="h-5 w-28 rounded"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
             }} />
      </div>
    </div>
  );

  const SkeletonTable = () => (
    <div
      className="rounded-xl border-2 p-5"
      style={{
        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 rounded"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
             }} />
        <div className="h-4 w-24 rounded"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
             }} />
      </div>

      <div className="overflow-x-auto rounded-lg border-2 mb-4"
           style={{
             borderColor: isDarkMode ? "#334155" : "#cbd5e1",
           }}>
        <div className="min-w-full">
          <div className="grid grid-cols-10 gap-4 p-4"
               style={{
                 backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
               }}>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-4 rounded"
                   style={{
                     backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                   }} />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {[...Array(5)].map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-10 gap-4 p-4 rounded-lg border-2"
               style={{
                 backgroundColor: isDarkMode ? "#334155" : "#f8fafc",
                 borderColor: isDarkMode ? "#475569" : "#e2e8f0",
               }}>
            {[...Array(10)].map((_, colIndex) => (
              <div key={colIndex} 
                   className={`h-4 rounded ${colIndex === 0 ? "w-4" : "w-full"}`}
                   style={{
                     backgroundColor: isDarkMode ? "#475569" : "#e2e8f0",
                   }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div 
      className="space-y-5 px-6 pb-5 pt-4 overflow-visible min-h-screen"
      style={{
        backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-4"
      >
        <div
          className="rounded-lg p-2"
          style={{
            backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
          }}
        >
          <div className="h-6 w-6"></div>
        </div>
        <div>
          <div className="h-6 w-44 rounded mb-1"
               style={{
                 backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
               }} />
          <div className="h-4 w-60 rounded"
               style={{
                 backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
               }} />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
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
      </div>

      <motion.div
        key="skeleton-table"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <SkeletonTable />
      </motion.div>
    </div>
  );
};

export default SkeletonLoader;