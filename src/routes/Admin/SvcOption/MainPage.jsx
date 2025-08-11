import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Settings } from "lucide-react";
import * as LucideIcons from "lucide-react";
import EditServiceModal from "./components/EditServiceModal";
import { Button } from "@/components/ui/button";

const MainPage = () => {
  const [services, setServices] = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [error, setError] = useState(null);

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
      const response = await fetch(
        `http://localhost:8080/api/services/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete service");

      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("❌ Error deleting service:", error.message);
      setError("Failed to delete service.");
    }
  };

  return (
    <main className="relative p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#3DD9B6]" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Service Options
          </h1>
        </div>

        {services.length > 0 && (
          <Button
            onClick={() => setEditTarget({})}
            className="bg-[#3DD9B6] text-white hover:bg-[#2fc3a4] dark:bg-[#007362] dark:hover:bg-[#00564e] shadow-md transition-transform hover:scale-105"
          >
            <Plus size={16} className="mr-2" />
            Add Service
          </Button>
        )}
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((s) => {
            const Icon = LucideIcons[s.icon] || LucideIcons["Circle"];
            return (
              <div key={s.id} className="card relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-5 h-5 text-[#3DD9B6]" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {s.name}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {s.description}
                    </p>
                    <p className="text-[#3DD9B6] font-bold mt-1">
                      ₱{s.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditTarget(s)}
                      className="hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Pencil
                        size={16}
                        className="text-slate-600 dark:text-slate-300"
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(s.id)}
                      className="hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2
                        size={16}
                        className="text-red-600 dark:text-red-400"
                      />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center mt-12 text-center">
          <img
            src="https://www.transparenttextures.com/patterns/stardust.png"
            alt="Empty"
            className="w-32 h-32 opacity-50 mb-4"
          />
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            No services added yet.
          </p>
          <Button
            onClick={() => setEditTarget({})}
            className="bg-[#3DD9B6] text-white hover:bg-[#2fc3a4] dark:bg-[#007362] dark:hover:bg-[#00564e]"
          >
            <Plus size={16} className="mr-2" />
            Add Your First Service
          </Button>
        </div>
      )}

      <EditServiceModal
        service={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
      />
    </main>
  );
};

export default MainPage;