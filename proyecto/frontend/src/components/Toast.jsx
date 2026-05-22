import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, status = "success", duration = 3000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, description, status, duration }]);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => removeToast(toasts[0].id), toasts[0].duration);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
  };

  const colors = {
    success: "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
    error: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
    warning: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
  };

  const iconColors = {
    success: "text-emerald-500",
    error: "text-red-500",
    warning: "text-amber-500",
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icons[t.status];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100 }}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${colors[t.status]}`}
              >
                <Icon size={20} className={`flex-shrink-0 mt-0.5 ${iconColors[t.status]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{t.title}</p>
                  {t.description && <p className="text-xs mt-0.5 opacity-80">{t.description}</p>}
                </div>
                <button onClick={() => removeToast(t.id)} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
