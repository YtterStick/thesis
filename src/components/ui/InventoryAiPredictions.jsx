import { useState } from "react";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-config";
import { Button } from "@/components/ui/button";

export function InventoryAiPredictions() {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePredict = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get("/stock/ai-predictions");
            setPrediction(response.prediction);
        } catch (err) {
            console.error("Failed to fetch AI inventory predictions:", err);
            setError("Failed to load restock predictions.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full mt-4 p-4 rounded-xl border border-violet-200 bg-violet-50/50 dark:border-violet-900/50 dark:bg-violet-900/10 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-violet-700 dark:text-violet-400 mb-1">
                    <Sparkles className="w-4 h-4" /> 
                    AI Restock Predictor
                </h4>
                {prediction ? (
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                        {prediction}
                    </p>
                ) : error ? (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </p>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Click the button to let Gemini analyze your current inventory and suggest restock amounts based on thresholds.
                    </p>
                )}
            </div>

            <Button 
                onClick={handlePredict} 
                disabled={loading}
                className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 whitespace-nowrap"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                )}
                {loading ? "Analyzing..." : "Predict Restock"}
            </Button>
        </div>
    );
}
