import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const statusBadge = (status) => {
  switch (status) {
    case "Completed":
      return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300";
    case "Pending":
      return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300";
    case "Cancelled":
      return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  }
};

const ReceiptPreviewModal = ({ open, onClose, receipt, settings, loading }) => {
  if (!receipt) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">
            Receipt Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            Loading receipt settings...
          </div>
        ) : (
          <>
            {/* 🏪 Store Info */}
            {settings && (
              <div className="mb-2 text-center text-xs text-slate-500 dark:text-slate-400">
                <div className="font-semibold text-slate-700 dark:text-slate-200">
                  {settings.storeName}
                </div>
                <div>{settings.address}</div>
                <div>{settings.phone}</div>
              </div>
            )}

            {/* 📄 Receipt Metadata */}
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <div>
                <span className="font-semibold">Receipt #:</span> {receipt.id}
              </div>
              <div>
                <span className="font-semibold">Customer:</span> {receipt.customer}
              </div>
              <div>
                <span className="font-semibold">Date:</span> {receipt.date}
              </div>
              <div>
                <span className="font-semibold">Total:</span>{" "}
                <span className="font-bold text-blue-600 dark:text-blue-300">
                  ₱{receipt.total.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="font-semibold">Status:</span>{" "}
                <Badge className={statusBadge(receipt.status)}>{receipt.status}</Badge>
              </div>
            </div>

            {/* 📝 Footer Note */}
            {settings?.footerNote && (
              <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                {settings.footerNote}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

ReceiptPreviewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  receipt: PropTypes.object,
  settings: PropTypes.object,
  loading: PropTypes.bool,
};

export default ReceiptPreviewModal;