const SummaryCard = ({ label, value, icon }) => (
  <div className="card flex-row items-center gap-x-4">
    <div className="rounded-lg bg-[#3DD9B6]/20 p-3 text-[#3DD9B6] dark:bg-[#007362]/30">
      {icon}
    </div>
    <div>
      <p className="card-title">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
        {value}
      </p>
    </div>
  </div>
);

export default SummaryCard;