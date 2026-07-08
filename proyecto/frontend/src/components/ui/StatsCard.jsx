import { Link } from "react-router-dom";

export default function StatsCard({ label, value, icon: Icon, href, loading }) {
  return (
    <Link
      to={href}
      className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          {loading ? (
            <div className="h-8 w-16 mt-1.5 skeleton rounded" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {value}
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
          <Icon size={20} />
        </div>
      </div>
    </Link>
  );
}
