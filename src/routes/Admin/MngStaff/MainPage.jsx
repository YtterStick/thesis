import { useState, useEffect, useCallback } from "react";
import StaffTable from "./StaffTable";
import StaffForm from "./StaffForm";
import { ShieldCheck, Users, User, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { secureFetch } from "@/lib/secureFetch";


const MainPage = () => {
  const [accountList, setAccountList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  // Filter to only show active accounts
  const activeAccounts = accountList.filter(acc => acc.status === "Active");
  
  const totalAdmins = activeAccounts.filter((acc) => acc.role === "ADMIN").length;
  const totalStaff = activeAccounts.filter((acc) => acc.role === "STAFF").length;

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await secureFetch("/accounts");
        const enriched = data.map((acc) => ({
          ...acc,
          status: acc.status || "Active",
        }));
        setAccountList(enriched);
      } catch (error) {
        console.error("❌ Error fetching accounts:", error.message);
        setError("Failed to load accounts. Make sure you're logged in as ADMIN.");
        toast({
          title: "Error",
          description: "Failed to load accounts",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [toast]);

  const handleStatusChange = useCallback(async (id, newStatus) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:8080/api/accounts/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }

      setAccountList(prev => 
        prev.map(acc => 
          acc.id === id ? { ...acc, status: newStatus } : acc
        )
      );

      toast({
        title: "Success",
        description: `Account ${newStatus.toLowerCase()} successfully`,
      });
    } catch (error) {
      console.error("❌ Error updating status:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Add this function to handle staff updates
  const handleStaffUpdate = useCallback((updatedStaff) => {
    setAccountList(prev => 
      prev.map(acc => 
        acc.id === updatedStaff.id ? updatedStaff : acc
      )
    );
  }, []);

  const handleAddAccount = useCallback((savedUser) => {
    setAccountList((prev) => [...prev, { ...savedUser, status: "Active" }]);
    toast({
      title: "Success",
      description: "Account created successfully",
    });
  }, [toast]);

  return (
    <main className="relative p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Manage Accounts
          </h1>
        </div>
        {activeAccounts.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Add Account</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 mb-6">
        {[
          {
            title: "Active Accounts",
            icon: <Users size={26} />,
            value: activeAccounts.length,
            color: "#3DD9B6",
          },
          {
            title: "Active Admins",
            icon: <ShieldCheck size={26} />,
            value: totalAdmins,
            color: "#60A5FA",
          },
          {
            title: "Active Staff",
            icon: <User size={26} />,
            value: totalStaff,
            color: "#FB923C",
          },
        ].map(({ title, icon, value, growth, color, growthColor }) => (
          <div key={title} className="card">
            <div className="card-header flex items-center gap-x-3">
              <div
                className="w-fit rounded-lg p-2"
                style={{
                  backgroundColor: `${color}33`,
                  color: color,
                }}
              >
                {icon}
              </div>
              <p className="card-title">{title}</p>
            </div>
            <div className="card-body bg-slate-100 dark:bg-slate-950 rounded-md p-4 transition-colors">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                {value}
              </p>
              <p className={`text-xs font-medium ${growthColor}`}>{growth}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && <div className="text-red-500 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">{error}</div>}

      {/* Staff Table or Skeleton Loader */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-[160px] rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <StaffTable 
          staff={activeAccounts} 
          onStatusChange={handleStatusChange}
          onStaffUpdate={handleStaffUpdate} // Add this prop
        />
      )}

      {/* Add Form */}
      {showForm && (
        <StaffForm
          onAdd={handleAddAccount}
          onClose={() => setShowForm(false)}
        />
      )}
    </main>
  );
};

export default MainPage;