const ConfirmDialog = ({ message, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
    <div className="card w-full max-w-sm">
      <p className="mb-2 text-base font-medium text-slate-800 dark:text-slate-100">
        {message}
      </p>
      <div className="flex justify-end gap-x-2 mt-4">
        <button
          onClick={onCancel}
          className="btn-ghost text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 px-4 py-2 text-sm font-medium text-white"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmDialog;