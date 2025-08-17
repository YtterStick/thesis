"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Plus, X } from "lucide-react";
import TermsModal from "./TermsModal";

const MainPage = () => {
  const [terms, setTerms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [error, setError] = useState(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      setError("No token found. Please log in.");
      return;
    }

    const fetchTerms = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/terms", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch terms");

        const data = await response.json();
        setTerms(data);
      } catch (err) {
        console.error("❌ Error fetching terms:", err.message);
        setError("Failed to load terms.");
      }
    };

    fetchTerms();
  }, [token]);

  const handleAddTerm = async (newTerm) => {
    try {
      const response = await fetch("http://localhost:8080/api/terms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTerm),
      });

      if (!response.ok) throw new Error("Failed to save term");

      const saved = await response.json();
      setTerms((prev) => [...prev, saved]);
      setIsModalOpen(false);
    } catch (err) {
      console.error("❌ Error saving term:", err.message);
      setError("Failed to save term.");
    }
  };

  const handleEditTerm = async (updatedTerm) => {
    try {
      const response = await fetch(`http://localhost:8080/api/terms/${updatedTerm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedTerm),
      });

      if (!response.ok) throw new Error("Failed to update term");

      const saved = await response.json();
      setTerms((prev) => prev.map((term) => (term.id === saved.id ? saved : term)));
      setEditingTerm(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("❌ Error updating term:", err.message);
      setError("Failed to update term.");
    }
  };

  const handleDeleteTerm = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/terms/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete term");

      setTerms((prev) => prev.filter((term) => term.id !== id));
    } catch (err) {
      console.error("❌ Error deleting term:", err.message);
      setError("Failed to delete term.");
    }
  };

  const openEditModal = (term) => {
    setEditingTerm(term);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        {/* ✅ Header with Icon */}
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
            Terms & Conditions Settings
          </h1>
        </div>

        {/* ✅ Add Terms Button with hover text color */}
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
          {/* ✅ Removed Icon from Clause List */}
          <CardTitle className="text-base">
            Clause List
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {terms.length > 0 ? (
              terms.map((term, idx) => (
                <div className="relative" key={term.id || idx}>
                  {/* ❌ Delete Button */}
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

                  {/* 🧾 Clause Card with wrapping content */}
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