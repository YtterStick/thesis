"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Plus } from "lucide-react";
import TermsModal from "./TermsModal";

const MainPage = () => {
  const [terms, setTerms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddTerm = (newTerm) => {
    setTerms((prev) => [...prev, newTerm]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
          Terms & Conditions Settings
        </h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus size={16} />
          Add Terms
        </Button>
      </div>

      <Card className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText size={18} />
            Clause Preview
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[300px] rounded border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900 text-sm leading-relaxed text-slate-800 dark:text-slate-300">
            {terms.length > 0 ? (
              terms.map((term, idx) => (
                <div key={idx} className="mb-4">
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400">
                    Clause {idx + 1}: {term.title}
                  </h4>
                  <p className="mt-1 whitespace-pre-line">{term.content}</p>
                </div>
              ))
            ) : (
              <p className="italic text-slate-400">No terms added yet.</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <TermsModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTerm}
      />
    </div>
  );
};

export default MainPage;