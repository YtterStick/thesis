import { useState, useEffect } from "react";
import { Trash2, Plus, Settings, WashingMachine, X } from "lucide-react";
import EditServiceModal from "./components/EditServiceModal";
import { Button } from "@/components/ui/button";
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
    const token = localStorage.getItem("authToken");

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
export default function MainPage() {
    const { toast } = useToast();
    const [services, setServices] = useState([]);
    const [editTarget, setEditTarget] = useState(null);
    const [error, setError] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const data = await secureFetch("/services");
                setServices(data);
            } catch (err) {
                console.error("❌ Error fetching services:", err.message);
                setError("Failed to load services. Make sure you're logged in.");
            }
        };

        fetchServices();
    }, []);

    const handleSave = async (updated) => {
        const method = updated.id ? "PUT" : "POST";
        const endpoint = updated.id ? `/services/${updated.id}` : "/services";

        try {
            const saved = await secureFetch(endpoint, method, updated);

            setServices((prev) => {
                const exists = prev.some((s) => s.id === saved.id);
                return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved];
            });

            toast({
                title: updated.id ? "Service updated" : "Service added",
                description: `${saved.name} has been ${updated.id ? "updated" : "added"}.`,
            });

            setEditTarget(null);
        } catch (error) {
            console.error("❌ Error saving service:", error.message);
            setError("Failed to save service.");
            toast({
                title: "Save failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };
    const handleDelete = async (id) => {
        try {
            await secureFetch(`/services/${id}`, "DELETE");
            setServices((prev) => prev.filter((s) => s.id !== id));
            setConfirmDeleteId(null);

            toast({
                title: "Service deleted",
                description: "The service has been removed successfully.",
            });
        } catch (error) {
            console.error("❌ Error deleting service:", error.message);
            setError("Failed to delete service.");
            toast({
                title: "Delete failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };
    const renderServiceCard = (service) => (
        <div
            key={service.id}
            onClick={() => setEditTarget(service)}
            className="relative rounded-md border border-cyan-500 bg-white p-4 text-slate-900 transition-transform duration-200 hover:scale-[1.02] hover:cursor-pointer dark:bg-slate-900 dark:text-white"
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(service.id);
                }}
                className="absolute right-2 top-2 rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-800"
                title="Delete service"
            >
                <X
                    size={16}
                    className="text-red-500 dark:text-red-400"
                />
            </button>

            <div className="mb-2 flex items-center gap-2">
                <WashingMachine className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                <h3 className="text-base font-semibold">{service.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground dark:text-slate-400">{service.description}</p>
            <p className="mt-2 font-bold text-cyan-600 dark:text-cyan-400">₱{service.price.toFixed(2)}</p>
        </div>
    );

    return (
        <div className="space-y-6 overflow-visible px-6 pb-6 pt-4">
            {/* 🧢 Section Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings className="h-6 w-6 text-[#00B7C2] dark:text-[#00B7C2]" />
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Service Options</h1>
                </div>
                <button
                    onClick={() => setEditTarget({})}
                    className="flex items-center gap-2 text-slate-900 transition-colors hover:text-cyan-600 dark:text-white dark:hover:text-cyan-400"
                >
                    <Plus size={18} />
                    <span className="text-sm font-medium">Add Service</span>
                </button>
            </div>

            {/* 🔥 Error Message */}
            {error && <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>}

            {/* 🧼 Service Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.map(renderServiceCard)}</div>

            {/* ✏️ Edit Modal */}
            <EditServiceModal
                service={editTarget}
                onClose={() => setEditTarget(null)}
                onSave={handleSave}
            />

            {/* ❓ Confirm Delete */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm rounded-md border border-slate-300 bg-white p-6 text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                        <h3 className="mb-2 text-lg font-semibold">Delete Service</h3>
                        <p className="mb-4 text-sm">Are you sure you want to delete this service?</p>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleDelete(confirmDeleteId)}
                                className="bg-red-600 text-white hover:bg-red-700"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
