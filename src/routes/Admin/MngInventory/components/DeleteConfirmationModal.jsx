import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DeleteConfirmationModal = ({ 
  item, 
  onConfirm, 
  onCancel, 
  loading = false 
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-50 w-full max-w-md rounded-xl border-2 p-6 shadow-xl transition-all"
        style={{
          backgroundColor: isDarkMode ? "#1e293b" : "#FFFFFF",
          borderColor: isDarkMode ? "#334155" : "#cbd5e1",
          color: isDarkMode ? "#f1f5f9" : "#0f172a",
        }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2" style={{
              backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
            }}>
              <AlertTriangle className="h-5 w-5" style={{ color: '#ef4444' }} />
            </div>
            <h2 className="text-lg font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
              Delete Item
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg p-1 transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isDarkMode ? "rgba(51, 65, 85, 0.3)" : "rgba(11, 43, 38, 0.1)",
            }}
          >
            <X className="h-4 w-4" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }} />
          </motion.button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
            Are you sure you want to delete <strong style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>"{item.name}"</strong>? This action cannot be undone and will permanently remove this item from your inventory.
          </p>

          {/* Item Details */}
          <div className="rounded-lg border-2 p-3" style={{
            backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "rgba(248, 250, 252, 0.8)",
            borderColor: isDarkMode ? "#334155" : "#e2e8f0",
          }}>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Current Quantity:</span>
                <p className="font-medium" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                  {item.quantity} {item.unit}
                </p>
              </div>
              <div>
                <span style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Price:</span>
                <p className="font-medium" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                  ₱{item.price?.toFixed(2) ?? "0.00"}
                </p>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="rounded-lg p-3" style={{
            backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(254, 226, 226, 0.8)",
            border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(254, 202, 202, 0.8)'}`,
          }}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
              <p className="text-xs" style={{ color: isDarkMode ? '#fca5a5' : '#dc2626' }}>
                This action cannot be undone. All data associated with this item will be permanently deleted.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onCancel}
              disabled={loading}
              variant="outline"
              className="flex-1 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isDarkMode ? "transparent" : "#FFFFFF",
                borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(item)}
              disabled={loading}
              className="flex-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
              }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </div>
              ) : (
                "Delete Item"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteConfirmationModal;