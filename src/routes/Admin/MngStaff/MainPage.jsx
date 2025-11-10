import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import StaffTable from "./StaffTable";
import StaffForm from "./StaffForm";
import { ShieldCheck, Users, User, Plus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MainPage = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [accountList, setAccountList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const activeAccounts = accountList.filter(acc => acc.status === "Active");
  
  const totalAdmins = activeAccounts.filter((acc) => acc.role === "ADMIN").length;
  const totalStaff = activeAccounts.filter((acc) => acc.role === "STAFF").length;

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await api.get("/accounts");
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
      await api.patch(`/accounts/${id}/status`, { status: newStatus });

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

  // Handle delete account request
  const handleDeleteRequest = useCallback((account) => {
    setAccountToDelete(account);
    setShowDeleteModal(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!accountToDelete || deleting) return;

    setDeleting(true);
    try {
      // First deactivate the account
      await api.patch(`/accounts/${accountToDelete.id}/status`, { status: "Inactive" });

      // Update local state
      setAccountList(prev => 
        prev.map(acc => 
          acc.id === accountToDelete.id ? { ...acc, status: "Inactive" } : acc
        )
      );

      toast({
        title: "Success",
        description: `Account "${accountToDelete.username}" has been deactivated successfully`,
      });

      setShowDeleteModal(false);
      setAccountToDelete(null);
    } catch (error) {
      console.error("❌ Error deactivating account:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate account",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }, [accountToDelete, deleting, toast]);

  // Handle delete cancellation
  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setAccountToDelete(null);
  }, []);

  // Delete Confirmation Modal Component
  const DeleteConfirmationModal = () => {
    if (!showDeleteModal || !accountToDelete) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={handleDeleteCancel}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-50 w-full max-w-md mx-4"
        >
          <Card className="rounded-xl border-2 shadow-2xl"
            style={{
              backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
              borderColor: isDarkMode ? "#334155" : "#0B2B26",
            }}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100"
                style={{
                  backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
                }}
              >
                <AlertTriangle 
                  className="h-6 w-6 text-red-600" 
                  style={{
                    color: isDarkMode ? "#EF4444" : "#DC2626",
                  }}
                />
              </div>
              <CardTitle className="text-lg font-semibold"
                style={{
                  color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                }}
              >
                Deactivate Account
              </CardTitle>
              <CardDescription className="text-sm"
                style={{
                  color: isDarkMode ? "#cbd5e1" : "#475569",
                }}
              >
                Are you sure you want to deactivate this account?
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Account Details */}
              <div className="rounded-lg border-2 p-3"
                style={{
                  backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "rgba(243, 237, 227, 0.3)",
                  borderColor: isDarkMode ? "#334155" : "#E0EAE8",
                }}
              >
                <div className="text-center">
                  <p className="font-medium text-sm"
                    style={{
                      color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                    }}
                  >
                    {accountToDelete.username}
                  </p>
                  <p className="text-xs"
                    style={{
                      color: isDarkMode ? "#cbd5e1" : "#475569",
                    }}
                  >
                    {accountToDelete.role} • {accountToDelete.contact || 'No contact'}
                  </p>
                </div>
              </div>

              {/* Warning Message */}
              <div className="rounded-lg border-2 p-3"
                style={{
                  backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(254, 226, 226, 0.5)",
                  borderColor: isDarkMode ? "#EF4444" : "#FECACA",
                }}
              >
                <p className="text-xs text-center"
                  style={{
                    color: isDarkMode ? "#FCA5A5" : "#DC2626",
                  }}
                >
                  ⚠️ This action will deactivate the account. The user will no longer be able to access the system.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  className="flex-1 rounded-lg border-2 transition-all hover:opacity-80"
                  style={{
                    borderColor: isDarkMode ? "#334155" : "#0B2B26",
                    backgroundColor: isDarkMode ? "#0f172a" : "#F3EDE3",
                    color: isDarkMode ? "#f1f5f9" : "#0B2B26",
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 rounded-lg transition-all hover:opacity-80"
                  style={{
                    backgroundColor: isDarkMode ? "#EF4444" : "#DC2626",
                    color: "#FFFFFF",
                  }}
                >
                  {deleting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Deactivating...
                    </div>
                  ) : (
                    "Deactivate Account"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  };

  // Skeleton Loader Components
  const SkeletonCard = ({ index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl border-2 p-5 transition-all"
      style={{
        backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
        borderColor: isDarkMode ? "#334155" : "#0B2B26",
      }}
    >
      <div className="flex items-center gap-x-3 mb-4">
        <div className="w-fit rounded-lg p-2 animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#E0EAE8"
             }}>
          <div className="h-6 w-6"></div>
        </div>
        <div className="h-5 w-28 rounded animate-pulse"
             style={{
               backgroundColor: isDarkMode ? "#334155" : "#E0EAE8"
             }}></div>
      </div>
      <div className="rounded-lg p-3 animate-pulse"
           style={{
             backgroundColor: isDarkMode ? "#334155" : "#F3EDE3"
           }}>
        <div className="h-8 w-32 rounded"
             style={{
               backgroundColor: isDarkMode ? "#475569" : "#E0EAE8"
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
    <div className="space-y-5 px-6 pb-5 pt-4 overflow-visible" style={{
      backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
    }}>
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
              backgroundColor: isDarkMode ? "#1e293b" : "#0B2B26",
              color: "#f1f5f9",
            }}
          >
            <ShieldCheck size={22} />
          </motion.div>
          <div>
            <p className="text-xl font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
              Manage Accounts
            </p>
            <p className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
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
              backgroundColor: isDarkMode ? "#1e293b" : "#0B2B26",
              color: "#f1f5f9",
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
                backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
                borderColor: isDarkMode ? "#334155" : "#0B2B26",
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
                  <p className="text-2xl font-bold" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
                    {value}
                  </p>
                </motion.div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#f1f5f9' : '#0B2B26' }}>
                  {title}
                </h3>
                <p className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
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
            backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
            borderColor: isDarkMode ? "#334155" : "#0B2B26",
          }}
        >
          <div className="h-64 animate-pulse rounded-lg"
               style={{
                 backgroundColor: isDarkMode ? "#334155" : "#F3EDE3"
               }}></div>
        </motion.div>
      ) : (
        <StaffTable 
          staff={activeAccounts} 
          onStatusChange={handleStatusChange}
          onStaffUpdate={handleStaffUpdate}
          onDeleteRequest={handleDeleteRequest} // Pass delete handler to StaffTable
        />
      )}

      {/* Add Form */}
      {showForm && (
        <StaffForm
          onAdd={handleAddAccount}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
    </div>
  );
};

export default MainPage;