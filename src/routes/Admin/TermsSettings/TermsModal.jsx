"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

const TermsModal = ({ open, onClose, onSubmit, initialData }) => {
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
    }
  }, [initialData]);

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
    onClose();
  };

  if (!open) return null;

  const inputClass =
    "bg-white dark:bg-slate-950 text-slate-700 dark:text-muted-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

  const buttonClass =
    "bg-[#0891B2] hover:bg-[#0E7490] text-white rounded-md px-4 py-2 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-w-lg w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-md text-slate-900 dark:text-white p-6 rounded-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData?.id ? "Edit Clause" : "Add New Clause"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-slate-700 dark:text-muted-foreground mb-1 block">
              Title
            </Label>
            <Input
              placeholder="Clause title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <Label className="text-slate-700 dark:text-muted-foreground mb-1 block">
              Content
            </Label>
            <Textarea
              placeholder="Write the clause content here..."
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
              rows={6}
              required
              className={inputClass}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className={buttonClass}>
              <Save className="w-4 h-4" />
              {initialData?.id ? "Update Clause" : "Save Clause"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TermsModal;