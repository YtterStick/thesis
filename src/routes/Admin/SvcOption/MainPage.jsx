import { useState, useEffect } from "react";
import {
  Trash2,
  Plus,
  Settings,
  WashingMachine,
  X,
} from "lucide-react";
import EditServiceModal from "./components/EditServiceModal";
import { Button } from "@/components/ui/button";

export default function MainPage() {
  const [services, setServices] = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [error, setError] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setError("No token found. Please log in.");
      return;
    }

    const fetchServices = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/services", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unauthorized or failed to fetch services.");
        }

        const data = await response.json();
        setServices(data);
      } catch (err) {
        console.error("❌ Error fetching services:", err.message);
        setError("Failed to load services. Make sure you're logged in.");
      }
    };

    fetchServices();
  }, [token]);

  const handleSave = async (updated) => {
    const method = updated.id ? "PUT" : "POST";
    const url = updated.id
      ? `http://localhost:8080/api/services/${updated.id}`
      : "http://localhost:8080/api/services";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });

      if (!response.ok) throw new Error("Failed to save service");

      const saved = await response.json();

      setServices((prev) => {
        const exists = prev.some((s) => s.id === saved.id);
        return exists
          ? prev.map((s) => (s.id === saved.id ? saved : s))
          : [...prev, saved];
      });

      setEditTarget(null);
    } catch (error) {
      console.error("❌ Error saving service:", error.message);
      setError("Failed to save service.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/services/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete service");

      setServices((prev) => prev.filter((s) => s.id !== id));
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("❌ Error deleting service:", error.message);
      setError("Failed to delete service.");
    }
  };

  const renderServiceCard = (service) => (
    <div
      key={service.id}
      onClick={() => setEditTarget(service)}
      className="relative rounded-md border border-cyan-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-transform duration-200 hover:scale-[1.02] hover:cursor-pointer p-4"
    >
      {/* ❌ Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setConfirmDeleteId(service.id);
        }}
        className="absolute right-2 top-2 rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-800"
        title="Delete service"
      >
        <X size={16} className="text-red-500 dark:text-red-400" />
      </button>

      <div className="flex items-center gap-2 mb-2">
        <WashingMachine className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
        <h3 className="text-base font-semibold">{service.name}</h3>
      </div>
      <p className="text-sm text-muted-foreground dark:text-slate-400">{service.description}</p>
      <p className="text-cyan-600 dark:text-cyan-400 font-bold mt-2">₱{service.price.toFixed(2)}</p>
    </div>
  );

  return (
    <div className="space-y-6 px-6 pb-6 pt-4 overflow-visible">
      {/* 🧢 Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#00B7C2] dark:text-[#00B7C2]" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Service Options
          </h1>
        </div>
        <button
          onClick={() => setEditTarget({})}
          className="flex items-center gap-2 text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
        >
          <Plus size={18} />
          <span className="text-sm font-medium">Add Service</span>
        </button>
      </div>

      {/* 🔥 Error Message */}
      {error && <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>}

      {/* 🧼 Service Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(renderServiceCard)}
      </div>

      {/* ✏️ Edit Modal */}
      <EditServiceModal
        service={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
      />

      {/* ❓ Confirm Delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-md bg-white dark:bg-slate-900 p-6 shadow-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Service</h3>
            <p className="text-sm mb-4">Are you sure you want to delete this service?</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmDeleteId(null)}
                className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white"
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