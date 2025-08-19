"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Plus, X } from "lucide-react";
import TermsModal from "./TermsModal";
import { useToast } from "@/hooks/use-toast";

const ALLOWED_SKEW_MS = 5000;

const isTokenExpired = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp * 1000;
    const now = Date.now();

    console.log("🔍 Token expiration check:");
    console.log("⏳ Exp:", new Date(exp).toLocaleString());
    console.log("🕒 Now:", new Date(now).toLocaleString());

    return exp + ALLOWED_SKEW_MS < now;
  } catch (err) {
    console.warn("❌ Failed to decode token:", err);
    return true;
  }
};

const secureFetch = async (endpoint, method = "GET", body = null) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  if (!token || isTokenExpired(token)) {
    console.warn("⛔ Token expired. Redirecting to login.");
    window.location.href = "/login";
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`http://localhost:8080/api${endpoint}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} - ${errorText}`);
  }

  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (err) {
      console.warn("Expected JSON but failed to parse:", err);
      return null;
    }
  }

  return null;
};

const MainPage = () => {
  const [terms, setTerms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const data = await secureFetch("/terms");
        setTerms(data || []);
      } catch (err) {
        console.error("❌ Error fetching terms:", err.message);
        setError("Failed to load terms.");
      }
    };

    fetchTerms();
  }, []);

  const handleAddTerm = async (newTerm) => {
    try {
      const saved = await secureFetch("/terms", "POST", newTerm);
      setTerms((prev) => [...prev, saved]);
      setIsModalOpen(false);

      toast({
        title: "Term added",
        description: `${saved.title} has been added.`,
      });
    } catch (err) {
      console.error("❌ Error saving term:", err.message);
      setError("Failed to save term.");
      toast({
        title: "Save failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleEditTerm = async (updatedTerm) => {
    try {
      const saved = await secureFetch(`/terms/${updatedTerm.id}`, "PUT", updatedTerm);
      setTerms((prev) => prev.map((term) => (term.id === saved.id ? saved : term)));
      setEditingTerm(null);
      setIsModalOpen(false);

      toast({
        title: "Term updated",
        description: `${saved.title} has been updated.`,
      });
    } catch (err) {
      console.error("❌ Error updating term:", err.message);
      setError("Failed to update term.");
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTerm = async (id) => {
    try {
      await secureFetch(`/terms/${id}`, "DELETE");
      setTerms((prev) => prev.filter((term) => term.id !== id));

      toast({
        title: "Term deleted",
        description: "The term has been removed successfully.",
      });
    } catch (err) {
      console.error("❌ Error deleting term:", err.message);
      setError("Failed to delete term.");
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
            Terms & Conditions Settings
          </h1>
        </div>

        <button
          onClick={() => {
            setEditingTerm(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Plus size={16} />
          <span className="text-sm font-medium">Add Terms</span>
        </button>
      </div>

      {error && <div className="text-red-600 dark:text-red-400">{error}</div>}

      <Card className="border border-slate-300 bg-white text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white">
        <CardHeader>
          <CardTitle className="text-base">Clause List</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {terms.length > 0 ? (
              terms.map((term, idx) => (
                <div className="relative" key={term.id || idx}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTerm(term.id);
                    }}
                    className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 shadow transition-colors hover:text-red-600 dark:bg-slate-950"
                    title="Delete clause"
                  >
                    <X size={16} />
                  </button>

                  <Card
                    onClick={() => openEditModal(term)}
                    className="group cursor-pointer border border-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 p-6 shadow-sm transition-all duration-200 hover:shadow-md transform hover:scale-[1.01] dark:border-slate-700 w-full"
                  >
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        Clause {idx + 1}: {term.title}
                      </h4>
                      <p className="whitespace-pre-line break-words text-sm text-slate-700 dark:text-slate-300">
                        {term.content}
                      </p>
                    </div>
                  </Card>
                </div>
              ))
            ) : (
              <p className="italic text-slate-400">No terms added yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <TermsModal
            open={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingTerm(null);
            }}
            onSubmit={editingTerm ? handleEditTerm : handleAddTerm}
            initialData={editingTerm}
          />
        </div>
      )}
    </div>
  );
};

export default MainPage;