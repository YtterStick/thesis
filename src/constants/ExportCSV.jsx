const ExportCSV = ({ data, filename = "export.csv" }) => {
  const exportData = () => {
    if (!data || data.length === 0) return;

    const header = Object.keys(data[0]).join(",");
    const body = data.map((row) => Object.values(row).join(",")).join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <button
      onClick={exportData}
      className="w-full sm:w-auto h-[38px] flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700"
    >
      Export to CSV
    </button>
  );
};

export default ExportCSV;