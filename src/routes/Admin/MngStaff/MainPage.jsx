import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import StaffForm from "./StaffForm";
import StaffTable from "./StaffTable";
import { 
  ShieldCheck, Users, User, Plus, 
  AlertTriangle, CheckCircle, XCircle 
} from "lucide-react";
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
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const data = await api.get("/accounts");
      const activeAccounts = data.filter((acc) => acc.status !== "Inactive");
      setAccountList(activeAccounts);
    } catch (error) {
      console.error("❌ Error fetching accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = useCallback(async (id, newStatus) => {
    try {
      await api.patch(`/accounts/${id}/status`, { status: newStatus });
      setAccountList(prev => 
        prev.map(acc => acc.id === id ? { ...acc, status: newStatus } : acc)
      );
      toast({
        title: "Success",
        description: `Account ${newStatus.toLowerCase()} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleStaffUpdate = useCallback((updatedStaff) => {
    setAccountList(prev => 
      prev.map(acc => acc.id === updatedStaff.id ? updatedStaff : acc)
    );
  }, []);

  const handleAddAccount = useCallback((savedUser) => {
    setAccountList((prev) => [...prev, { ...savedUser, status: "Active" }]);
    toast({
      title: "Success",
      description: "Account created successfully",
    });
  }, [toast]);

  const handleDeleteRequest = useCallback((account) => {
    setAccountToDelete(account);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!accountToDelete || deleting) return;
    setDeleting(true);
    try {
      await api.patch(`/accounts/${accountToDelete.id}/status`, { status: "Inactive" });
      setAccountList(prev => prev.filter(acc => acc.id !== accountToDelete.id));
      toast({
        title: "Success",
        description: `Account "${accountToDelete.username}" deleted`,
      });
      setShowDeleteModal(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate account",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }, [accountToDelete, deleting, toast]);

  const totalAccounts = accountList.length;
  const adminCount = accountList.filter(acc => acc.role === "ADMIN").length;
  const staffCount = accountList.filter(acc => acc.role === "STAFF").length;

  const summaryCards = [
    { title: "Total Accounts", icon: <Users size={20} />, value: totalAccounts, color: "var(--admin-accent)" },
    { title: "Admins", icon: <ShieldCheck size={20} />, value: adminCount, color: "#10b981" },
    { title: "Staff", icon: <User size={20} />, value: staffCount, color: "#3b82f6" },
  ];

  return (
    <div className="space-y-6 px-6 pb-6 pt-4" style={{ backgroundColor: "var(--admin-bg)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg p-2 shadow-sm" style={{ backgroundColor: "var(--admin-accent)", color: "var(--admin-card-bg)" }}>
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--admin-text-primary)" }}>Account Management</h1>
          <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>Manage system access and roles</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card, i) => (
          <Card key={i} className="border shadow-sm" style={{ backgroundColor: "var(--admin-card-bg)", borderColor: "var(--admin-card-border)" }}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--admin-text-secondary)" }}>{card.title}</p>
                <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
              </div>
              <div className="rounded-lg p-2" style={{ backgroundColor: card.color + '15', color: card.color }}>{card.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      <Card className="border shadow-sm" style={{ backgroundColor: "var(--admin-card-bg)", borderColor: "var(--admin-card-border)" }}>
        <CardHeader className="flex flex-row items-center justify-between p-6" style={{ backgroundColor: "var(--admin-accent-soft)" }}>
          <div>
            <CardTitle style={{ color: "var(--admin-accent)" }}>User Accounts</CardTitle>
            <CardDescription>View and manage staff permissions</CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)} style={{ backgroundColor: "var(--admin-accent)", color: "white" }}>
            <Plus className="mr-2 h-4 w-4" /> Add Account
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-admin-accent border-t-transparent mx-auto mb-4" />
              <p className="text-sm font-medium" style={{ color: "var(--admin-text-secondary)" }}>Loading accounts...</p>
            </div>
          ) : (
            <StaffTable 
              staff={accountList} 
              onStatusChange={handleStatusChange}
              onStaffUpdate={handleStaffUpdate}
              onDeleteRequest={handleDeleteRequest}
            />
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {showForm && (
          <StaffForm
            onAdd={handleAddAccount}
            onClose={() => setShowForm(false)}
            existingUsernames={accountList.map((acc) => acc.username)}
          />
        )}
        
        {showDeleteModal && accountToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="rounded-xl border shadow-xl w-full max-w-sm transition-all overflow-hidden"
              style={{
                backgroundColor: "var(--admin-card-bg)",
                borderColor: "var(--admin-card-border)",
              }}
            >
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Delete Account?</h3>
                <p className="text-sm mb-6" style={{ color: "var(--admin-text-secondary)" }}>
                  Are you sure you want to delete <b>{accountToDelete.username}</b>? This user will no longer be able to log in.
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="ghost" 
                    className="flex-1" 
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white" 
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainPage;