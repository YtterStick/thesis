import PropTypes from "prop-types";
import { Eye } from "lucide-react";

const TotalPreviewCard = ({ amount = 0, amountGiven = 0, change = 0 }) => {
  const isPaid = amountGiven > 0;
  const isUnderpaid = isPaid && change < 0;
  const isOverpaid = isPaid && change > 0;

  const changeColor = isUnderpaid
    ? "text-red-600 dark:text-red-400"
    : isOverpaid
    ? "text-green-700 dark:text-green-400"
    : "text-slate-700 dark:text-slate-300";

  const currencyDisplay = (value, colorClass = "") => (
    <div className={`flex items-center justify-end gap-1 ${colorClass}`}>
      <span className="text-slate-500 dark:text-slate-400">₱</span>
      <span className="font-bold">{value.toFixed(2)}</span>
    </div>
  );

  return (
    <div className="rounded-xl border-2 p-5 transition-all cursor-pointer hover:scale-105"
         style={{
           backgroundColor: 'rgb(243, 237, 227)',
           borderColor: 'rgb(11, 43, 38)',
           color: 'rgb(11, 43, 38)'
         }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg p-2"
             style={{
               backgroundColor: 'rgb(11, 43, 38)',
               color: 'rgb(243, 237, 227)',
             }}>
          <Eye size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Transaction Preview</h3>
          <p className="text-sm opacity-70">Live payment summary</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="rounded-lg p-4 space-y-3"
           style={{
             backgroundColor: 'rgb(255, 255, 255)',
           }}>
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Amount:</span>
          {currencyDisplay(amount)}
        </div>

        <div className="flex justify-between items-center">
          <span className="font-medium">Amount Given:</span>
          {currencyDisplay(amountGiven)}
        </div>

        {isPaid && (
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="font-semibold">Change:</span>
            <div className={`flex items-center gap-1 font-semibold ${changeColor}`}>
              <span>{change < 0 ? "−₱" : "₱"}</span>
              <span>{Math.abs(change).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-3 text-xs opacity-70">
        <Eye className="h-3 w-3" />
        <span>Live preview - No transaction saved yet</span>
      </div>
    </div>
  );
};

TotalPreviewCard.propTypes = {
  amount: PropTypes.number,
  amountGiven: PropTypes.number,
  change: PropTypes.number,
};

export default TotalPreviewCard;