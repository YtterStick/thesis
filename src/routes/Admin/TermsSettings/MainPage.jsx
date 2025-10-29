"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Plus, X, Edit2, Trash2 } from "lucide-react";
import TermsModal from "./TermsModal";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-config";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Initialize cache properly
const initializeCache = () => {
  try {
    const stored = localStorage.getItem('termsCache');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        console.log("📦 Initializing terms from stored cache");
        return parsed;
      } else {
        console.log("🗑️ Stored terms cache expired");
      }
    }
  } catch (error) {
    console.warn('Failed to load terms cache from storage:', error);
  }
  return null;
};

// Global cache instances
let termsCache = initializeCache();
let cacheTimestamp = termsCache?.timestamp || null;

// Save cache to localStorage for persistence
const saveCacheToStorage = (data) => {
  try {
    localStorage.setItem('termsCache', JSON.stringify({
      data: data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to save terms cache to storage:', error);
  }
};

const MainPage = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  const [terms, setTerms] = useState(() => {
    if (termsCache && termsCache.data) {
      console.log("🎯 Initializing terms state with cached data");
      return termsCache.data;
    }
    return [];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!termsCache);
  const [initialLoad, setInitialLoad] = useState(!termsCache);
  const isMountedRef = useRef(true);
  const { toast } = useToast();

  // Function to check if data has actually changed
  const hasDataChanged = (newData, oldData) => {
    if (!oldData) return true;
    return JSON.stringify(newData) !== JSON.stringify(oldData);
  };

  const fetchTerms = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    try {
      const now = Date.now();
      
      if (!forceRefresh && termsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log("📦 Using cached terms data");
        
        setTerms(termsCache.data);
        setLoading(false);
        setInitialLoad(false);
        return;
      }

      await fetchFreshTerms();
    } catch (err) {
      console.error("❌ Error fetching terms:", err.message);
      if (!isMountedRef.current) return;
      
      if (termsCache) {
        console.log("⚠️ Fetch failed, falling back to cached terms data");
        setTerms(termsCache.data);
        setError("Failed to refresh terms. Showing cached data.");
      } else {
        setError("Failed to load terms. Make sure you're logged in.");
      }
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  const fetchFreshTerms = async () => {
    console.log("🔄 Fetching fresh terms data");
    if (isMountedRef.current) {
      setLoading(true);
    }

    try {
      const data = await api.get("api/terms");
      const newTerms = data || [];
      
      const currentTime = Date.now();

      if (!termsCache || hasDataChanged(newTerms, termsCache.data)) {
        console.log("🔄 Terms data updated with fresh data");
        
        termsCache = {
          data: newTerms,
          timestamp: currentTime
        };
        cacheTimestamp = currentTime;
        
        saveCacheToStorage(newTerms);
        
        if (isMountedRef.current) {
          setTerms(newTerms);
          setError(null);
        }
      } else {
        console.log("✅ No changes in terms data, updating timestamp only");
        cacheTimestamp = currentTime;
        termsCache.timestamp = currentTime;
        saveCacheToStorage(termsCache.data);
      }

      if (isMountedRef.current) {
        setLoading(false);
        setInitialLoad(false);
      }
    } catch (error) {
      console.error("❌ Error in fetchFreshTerms:", error);
      if (isMountedRef.current) {
        setLoading(false);
        setInitialLoad(false);
        throw error;
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    if (termsCache) {
      console.log("🚀 Showing cached terms data immediately");
      setTerms(termsCache.data);
      setLoading(false);
      setInitialLoad(false);
    }
    
    fetchTerms();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTerms]);

  const handleAddTerm = async (newTerm) => {
    try {
      const saved = await api.post("api/terms", newTerm);
      
      setTerms((prev) => {
        const newTerms = [...prev, saved];
        
        termsCache = {
          data: newTerms,
          timestamp: Date.now()
        };
        cacheTimestamp = Date.now();
        saveCacheToStorage(newTerms);
        
        return newTerms;
      });
      
      setIsModalOpen(false);

      toast({
        title: "Terms added",
        description: `${saved.title} has been added successfully.`,
      });
    } catch (err) {
      console.error("❌ Error saving term:", err.message);
      setError("Failed to save terms.");
      toast({
        title: "Save failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleEditTerm = async (updatedTerm) => {
    try {
      const saved = await api.put(`api/terms/${updatedTerm.id}`, updatedTerm);
      
      setTerms((prev) => {
        const newTerms = prev.map((term) => (term.id === saved.id ? saved : term));
        
        termsCache = {
          data: newTerms,
          timestamp: Date.now()
        };
        cacheTimestamp = Date.now();
        saveCacheToStorage(newTerms);
        
        return newTerms;
      });
      
      setEditingTerm(null);
      setIsModalOpen(false);

      toast({
        title: "Terms updated",
        description: `${saved.title} has been updated successfully.`,
      });
    } catch (err) {
      console.error("❌ Error updating term:", err.message);
      setError("Failed to update terms.");
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTerm = async (id, title) => {
    try {
      await api.delete(`api/terms/${id}`);
      
      setTerms((prev) => {
        const newTerms = prev.filter((term) => term.id !== id);
        
        termsCache = {
          data: newTerms,
          timestamp: Date.now()
        };
        cacheTimestamp = Date.now();
        saveCacheToStorage(newTerms);
        
        return newTerms;
      });

      toast({
        title: "Terms deleted",
        description: `${title} has been removed successfully.`,
      });
    } catch (err) {
      console.error("❌ Error deleting term:", err.message);
      setError("Failed to delete terms.");
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const openEditModal = (term) => {
    setEditingTerm(term);
    setIsModalOpen(true);
  };

  // Skeleton Loader
  const SkeletonCard = ({ index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl border-2 p-6 transition-all"
      style={{
        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
        borderColor: isDarkMode ? "#334155" : "#cbd5e1",
      }}
    >
      <div className="flex items-center gap-x-3 mb-4">
        <div className="w-fit rounded-lg p-2 animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
             }}>
          <div className="h-6 w-6"></div>
        </div>
        <div className="h-5 w-28 rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
             }}></div>
      </div>
      <div className="space-y-3">
        <div className="h-6 w-48 rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
             }}></div>
        <div className="h-4 w-full rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
             }}></div>
        <div className="h-4 w-3/4 rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
             }}></div>
      </div>
    </motion.div>
  );

  // Show skeleton loader only during initial load AND when no cached data is available
  if (initialLoad && !termsCache) {
    return (
      <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible" style={{
        backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
      }}>
        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg animate-pulse"
                 style={{
                   backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                 }}></div>
            <div className="space-y-2">
              <div className="h-6 w-44 rounded-lg animate-pulse"
                   style={{
                     backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                   }}></div>
              <div className="h-4 w-56 rounded animate-pulse"
                   style={{
                     backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                   }}></div>
            </div>
          </div>
          <div className="h-10 w-32 rounded-lg animate-pulse"
               style={{
                 backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
               }}></div>
        </motion.div>

        {/* Terms List Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="rounded-xl border-2 transition-all"
            style={{
              backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
              borderColor: isDarkMode ? "#334155" : "#cbd5e1",
            }}
          >
            <CardHeader className="rounded-t-xl pb-4"
              style={{
                backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
              }}
            >
              <div className="h-6 w-32 rounded animate-pulse"
                   style={{
                     backgroundColor: isDarkMode ? "#334155" : "#f1f5f9"
                   }}></div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <SkeletonCard key={index} index={index} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible" style={{
      backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-3"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="rounded-lg p-2"
            style={{
              backgroundColor: isDarkMode ? "#1e293b" : "#0f172a",
              color: "#f1f5f9",
            }}
          >
            <FileText size={22} />
          </motion.div>
          <div>
            <p className="text-xl font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
              Terms & Conditions
            </p>
            <p className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
              Manage your terms and conditions
            </p>
          </div>
        </div>
        
        {!loading && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingTerm(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
            style={{
              backgroundColor: "#0f172a",
              color: "#f1f5f9",
            }}
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Add Terms</span>
          </motion.button>
        )}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border-2 p-4"
          style={{
            backgroundColor: "#FEF2F2",
            borderColor: "#FECACA",
            color: "#DC2626",
          }}
        >
          <div className="flex items-center gap-2">
            <X size={16} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Terms List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="rounded-xl border-2 transition-all"
          style={{
            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
            borderColor: isDarkMode ? "#334155" : "#cbd5e1",
          }}
        >
          <CardHeader className="rounded-t-xl pb-4"
            style={{
              backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(11, 43, 38, 0.1)",
            }}
          >
            <CardTitle className="text-base" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
              Terms List
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-4">
              {loading ? (
                [...Array(3)].map((_, index) => (
                  <SkeletonCard key={index} index={index} />
                ))
              ) : terms.length > 0 ? (
                <AnimatePresence>
                  {terms.map((term, idx) => (
                    <motion.div
                      key={term.id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative group"
                    >
                      <motion.div
                        whileHover={{ 
                          scale: 1.01,
                          y: -2,
                          transition: { duration: 0.2 }
                        }}
                        className="rounded-xl border-2 p-6 transition-all cursor-pointer"
                        style={{
                          backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                          borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                        }}
                        onClick={() => openEditModal(term)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-2 flex-1">
                            <h4 className="text-lg font-semibold" 
                                style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                              {term.title}
                            </h4>
                            <p className="whitespace-pre-line break-words text-sm leading-relaxed"
                               style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                              {term.content}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(term);
                              }}
                              className="rounded-lg p-2 transition-colors"
                              style={{
                                backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
                                color: isDarkMode ? "#f1f5f9" : "#0f172a",
                              }}
                            >
                              <Edit2 size={16} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTerm(term.id, term.title);
                              }}
                              className="rounded-lg p-2 transition-colors"
                              style={{
                                backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                color: "#EF4444",
                              }}
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border-2 p-8 text-center transition-all"
                  style={{
                    backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="mb-4 h-16 w-16 opacity-50" 
                             style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }} />
                    <p className="mb-2 text-lg font-semibold" 
                       style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                      No terms added yet
                    </p>
                    <p className="mb-4 text-sm" 
                       style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                      Start by creating your first terms and conditions
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setEditingTerm(null);
                        setIsModalOpen(true);
                      }}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
                      style={{
                        backgroundColor: "#0f172a",
                        color: "#f1f5f9",
                      }}
                    >
                      <Plus size={18} />
                      <span className="text-sm font-medium">Add Your First Terms</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <TermsModal
            open={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingTerm(null);
            }}
            onSubmit={editingTerm ? handleEditTerm : handleAddTerm}
            initialData={editingTerm}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainPage;