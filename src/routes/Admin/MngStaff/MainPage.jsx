import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import StaffTable from "./StaffTable";
import StaffForm from "./StaffForm";
import { ShieldCheck, Users, User, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-config"; // Import the api utility

const MainPage = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [accountList, setAccountList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const activeAccounts = accountList.filter(acc => acc.status === "Active");
  
  const totalAdmins = activeAccounts.filter((acc) => acc.role === "ADMIN").length;
  const totalStaff = activeAccounts.filter((acc) => acc.role === "STAFF").length;

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        // Use the api utility instead of secureFetch
        const data = await api.get("api/accounts");
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
      // Use the api utility instead of direct fetch
      await api.patch(`api/accounts/${id}/status`, { status: newStatus });

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

  // Skeleton Loader Components
  const SkeletonCard = ({ index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl border-2 p-5 transition-all"
      style={{
        backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
        borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
      }}
    >
      <div className="flex items-center gap-x-3 mb-4">
        <div className="w-fit rounded-lg p-2 animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}>
          <div className="h-6 w-6"></div>
        </div>
        <div className="h-5 w-28 rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
      <div className="rounded-lg p-3 animate-pulse"
           style={{
             backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3"
           }}>
        <div className="h-8 w-32 rounded"
             style={{
               backgroundColor: isDarkMode ? "#2A524C" : "#E0EAE8"
             }}></div>
      </div>
    </motion.div>
  );

  const summaryCards = [
    {
      title: "Active Accounts",
      icon: <Users size={26} />,
      value: activeAccounts.length,
      color: "#3DD9B6",
      description: "Total active accounts",
    },
    {
      title: "Active Admins",
      icon: <ShieldCheck size={26} />,
      value: totalAdmins,
      color: "#60A5FA",
      description: "Administrator accounts",
    },
    {
      title: "Active Staff",
      icon: <User size={26} />,
      value: totalStaff,
      color: "#FB923C",
      description: "Staff member accounts",
    },
  ];

  return (
    <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-3"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="rounded-lg p-2"
            style={{
              backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
              color: "#F3EDE3",
            }}
          >
            <ShieldCheck size={22} />
          </motion.div>
          <div>
            <p className="text-xl font-bold" style={{ color: isDarkMode ? '#F3EDE3' : '#0B2B26' }}>
              Manage Accounts
            </p>
            <p className="text-sm" style={{ color: isDarkMode ? '#F3EDE3/70' : '#0B2B26/70' }}>
              Manage staff and administrator accounts
            </p>
          </div>
        </div>
        
        {!loading && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
            style={{
              backgroundColor: isDarkMode ? "#18442AF5" : "#0B2B26",
              color: "#F3EDE3",
            }}
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Add Account</span>
          </motion.button>
        )}
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 p-4 transition-all"
          style={{
            backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
            borderColor: isDarkMode ? "#EF4444" : "#EF4444",
            color: isDarkMode ? "#EF4444" : "#DC2626",
          }}
        >
          {error}
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {loading ? (
          [...Array(3)].map((_, index) => (
            <SkeletonCard key={index} index={index} />
          ))
        ) : (
          summaryCards.map(({ title, icon, value, color, description }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.03,
                y: -2,
                transition: { duration: 0.2 }
              }}
              className="rounded-xl border-2 p-5 transition-all cursor-pointer"
              style={{
                backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
                borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="rounded-lg p-2"
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                  }}
                >
                  {icon}
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="text-right"
                >
                  <p className="text-2xl font-bold" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                    {value}
                  </p>
                </motion.div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#13151B' : '#0B2B26' }}>
                  {title}
                </h3>
                <p className="text-sm" style={{ color: isDarkMode ? '#6B7280' : '#0B2B26/80' }}>
                  {description}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Staff Table */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 p-5 transition-all"
          style={{
            backgroundColor: isDarkMode ? "#F3EDE3" : "#FFFFFF",
            borderColor: isDarkMode ? "#2A524C" : "#0B2B26",
          }}
        >
          <div className="h-64 animate-pulse rounded-lg"
               style={{
                 backgroundColor: isDarkMode ? "#FFFFFF" : "#F3EDE3"
               }}></div>
        </motion.div>
      ) : (
        <StaffTable 
          staff={activeAccounts} 
          onStatusChange={handleStatusChange}
          onStaffUpdate={handleStaffUpdate}
        />
      )}

      {/* Add Form */}
      {showForm && (
        <StaffForm
          onAdd={handleAddAccount}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default MainPage;