import { useEffect } from "react";

const ToastMessage = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-700 shadow-md dark:border-red-800 dark:bg-slate-900 dark:text-red-300">
      {message}
    </div>
  );
};

export default ToastMessage;