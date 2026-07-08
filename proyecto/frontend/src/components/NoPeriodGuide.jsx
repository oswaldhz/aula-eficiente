import { Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePeriod } from "../context/PeriodContext";

export default function NoPeriodGuide() {
  const { periodId } = usePeriod();
  const navigate = useNavigate();

  if (periodId) return null;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 rounded-full bg-brand-50 dark:bg-brand-900/30 mb-5">
        <Calendar size={32} className="text-brand-500" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No academic period selected
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
        You need to create an academic period before you can manage classrooms,
        students, activities, or grades. Periods organize your data by semester
        or school year.
      </p>
      <ol className="text-left text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-8">
        <li className="flex items-start gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 text-xs font-bold flex-shrink-0 mt-0.5">1</span>
          <span>Go to <strong>Periods</strong> and create your first period (e.g. "Fall Semester 2026")</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 text-xs font-bold flex-shrink-0 mt-0.5">2</span>
          <span>Select it from the period dropdown in the top bar</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 text-xs font-bold flex-shrink-0 mt-0.5">3</span>
          <span>Start creating classrooms, adding students, and more</span>
        </li>
      </ol>
      <button
        onClick={() => navigate("/periods")}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium shadow-sm"
      >
        Go to Periods <ArrowRight size={15} />
      </button>
    </div>
  );
}
