import { Calendar } from "lucide-react";

export default function DateInput({ value, onChange, className = "", ...props }) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="date"
        value={value}
        onChange={onChange}
        {...props}
        className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
      />
      <Calendar
        size={15}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
}
