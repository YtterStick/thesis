import PropTypes from "prop-types";
import { Eye } from "lucide-react";

const TotalPreviewCard = ({ amount, amountGiven, change }) => {
  const isPaid = amountGiven > 0;
  const isUnderpaid = isPaid && change < 0;
  const isOverpaid = isPaid && change >= 0;

  const changeColor = isUnderpaid
    ? "text-red-600 dark:text-red-400"
    : isOverpaid
    ? "text-green-700 dark:text-green-400"
    : "text-slate-700 dark:text-slate-300";

  const currencyDisplay = (value) => (
    <div className="flex items-center justify-end gap-1">
      <span className="text-slate-500 dark:text-slate-400">₱</span>
      <span className="font-bold text-slate-900 dark:text-white">
        {value.toFixed(2)}
      </span>
    </div>
  );

  return (
    <div className="rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-md bg-blue-50 px-4 py-2 dark:bg-blue-900">
        <Eye className="h-4 w-4 text-blue-600 dark:text-blue-300" />
        <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
          Transaction Preview
        </h2>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span>Total Amount:</span>
          {currencyDisplay(amount)}
        </div>

        <div className="flex justify-between items-center">
          <span>Amount Given:</span>
          {currencyDisplay(amountGiven)}
        </div>

        {isPaid && (
          <div className="flex justify-between items-center">
            <span>Change:</span>
            <div className={`flex items-center gap-1 ${changeColor}`}>
              <span>{change < 0 ? "−" : "₱"}</span>
              <span className="font-bold">{Math.abs(change).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-slate-200 px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
        <Eye className="h-3 w-3" />
        <span>This is a live preview. No transaction has been saved yet.</span>
      </div>
    </div>
  );
};

TotalPreviewCard.propTypes = {
  amount: PropTypes.number.isRequired,
  amountGiven: PropTypes.number.isRequired,
  change: PropTypes.number.isRequired,
};

export default TotalPreviewCard;