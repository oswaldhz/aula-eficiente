import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../api";
import { usePeriod } from "../context/PeriodContext";
import {
  BookOpen, Users, ClipboardList, GraduationCap,
  Calendar, ArrowRight, Plus, School, TrendingUp
} from "lucide-react";
import StatsCard from "../components/ui/StatsCard";
import PageHeader from "../components/ui/PageHeader";

const statCards = [
  { key: "classrooms", label: "Classrooms", icon: BookOpen, link: "/classrooms" },
  { key: "students", label: "Students", icon: Users, link: "/students" },
  { key: "activities", label: "Activities", icon: ClipboardList, link: "/activities" },
  { key: "grades", label: "Grades", icon: GraduationCap, link: "/grades" },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ classrooms: 0, students: 0, activities: 0, grades: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchData } = useFetch();
  const { periodId } = usePeriod();

  useEffect(() => { loadData(); }, [periodId]);

  const loadData = async () => {
    setIsLoading(true);
    const base = periodId ? `?period_id=${periodId}` : "";
    try {
      const [classrooms, students, activities, grades] = await Promise.all([
        fetchData(`classrooms${base}`),
        fetchData(`students${base}`),
        fetchData(`activities${base}`),
        fetchData(`grades${base}`),
      ]);
      setStats({
        classrooms: classrooms.length,
        students: students.length,
        activities: activities.length,
        grades: grades.length,
      });
      setRecentActivities(
        [...activities]
          .sort((a, b) => new Date(b.due_date) - new Date(a.due_date))
          .slice(0, 5)
      );
    } catch {}
    setIsLoading(false);
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your academic period"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <StatsCard
            key={s.key}
            label={s.label}
            value={stats[s.key]}
            icon={s.icon}
            href={s.link}
            loading={isLoading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calendar size={16} className="text-brand-500" />
                Recent Activities
              </h2>
              <Link
                to="/activities"
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 skeleton rounded-lg" />
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-1">
                {recentActivities.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{a.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                      {a.max_score} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <ClipboardList size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No activities registered</p>
                <Link
                  to="/activities"
                  className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-medium"
                >
                  <Plus size={12} /> Create activity
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                { to: "/classrooms", icon: School, label: "Manage Classrooms", desc: "Create and organize your classrooms" },
                { to: "/students", icon: Users, label: "Manage Students", desc: "Add students and import from Excel" },
                { to: "/grades", icon: GraduationCap, label: "Grade Activities", desc: "Evaluate student submissions" },
                { to: "/reports", icon: TrendingUp, label: "Generate Reports", desc: "Export PDF or Excel reports" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-all"
                >
                  <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
