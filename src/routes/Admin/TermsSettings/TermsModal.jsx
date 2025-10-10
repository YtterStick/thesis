"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

const TermsModal = ({ open, onClose, onSubmit, initialData }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  const [form, setForm] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || "",
        content: initialData.content || "",
      });
    } else {
      setForm({ title: "", content: "" });
    }
  }, [initialData, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    const payload = {
      ...(initialData || {}),
      title: form.title.trim(),
      content: form.content.trim(),
    };
    onSubmit(payload);
    setForm({ title: "", content: "" });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-50 w-full max-w-2xl rounded-xl border-2 p-6 shadow-xl transition-all"
        style={{
          backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
          borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
          color: isDarkMode ? "#13151B" : "#0B2B26",
        }}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
            {initialData?.id ? "Edit Terms" : "Add New Terms"}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover:opacity-80"
            style={{
              backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
            }}
          >
            <X className="h-5 w-5" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label 
              className="text-sm font-medium mb-2 block"
              style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
            >
              Title
            </Label>
            <Input
              placeholder="Enter terms title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
              className="rounded-lg border-2 transition-all"
              style={{
                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                color: isDarkMode ? "#13151B" : "#0B2B26",
              }}
            />
          </div>

          <div>
            <Label 
              className="text-sm font-medium mb-2 block"
              style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}
            >
              Content
            </Label>
            <Textarea
              placeholder="Write your terms and conditions here..."
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
              rows={8}
              required
              className="rounded-lg border-2 transition-all resize-none"
              style={{
                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
                color: isDarkMode ? "#13151B" : "#0B2B26",
              }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor: isDarkMode ? "rgba(42, 82, 76, 0.1)" : "rgba(11, 43, 38, 0.1)",
                color: isDarkMode ? '#13151B' : '#0B2B26',
              }}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all"
              style={{
                backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
              }}
            >
              <Save className="h-4 w-4" />
              {initialData?.id ? "Update Terms" : "Save Terms"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default TermsModal;