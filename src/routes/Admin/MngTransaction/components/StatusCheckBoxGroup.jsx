
const StatusCheckboxGroup = ({ label, options, selected, toggleFn, type }) => (
  <div className="flex flex-col gap-1 text-[12px]">
    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{label}</label>
    <div className="flex flex-col gap-[6px]">
      {options.map((option) => {
        const isChecked = selected.includes(option);
        return (
          <label
            key={option}
            className="relative flex cursor-pointer items-center gap-2 text-slate-700 dark:text-slate-100"
          >
            <input
              type="checkbox"
              value={option}
              checked={isChecked}
              onChange={() => toggleFn(type, option)}
              className="peer sr-only"
            />
            <div
              className={`flex h-[14px] w-[14px] items-center justify-center rounded-[3px] border transition-colors ${
                isChecked
                  ? "border-[#69cab1] bg-[#69cab1]"
                  : "border-slate-600 bg-slate-900 dark:border-slate-600 dark:bg-slate-700"
              }`}
            >
              {isChecked && (
                <svg className="h-[10px] w-[10px] text-white" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-[11px]">{option}</span>
          </label>
        );
      })}
    </div>
  </div>
);

export default StatusCheckboxGroup;