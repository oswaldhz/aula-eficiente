import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useFetch } from "../api";
import {
  BookOpen, Users, ClipboardList, GraduationCap,
  Calendar, TrendingUp, ArrowRight, Plus, School
} from "lucide-react";

const statCards = [
  { key: "classrooms", label: "Classrooms", icon: BookOpen, color: "blue", link: "/classrooms", gradient: "from-blue-500 to-indigo-500", bg: "bg-blue-50 dark:bg-blue-950" },
  { key: "students", label: "Students", icon: Users, color: "green", link: "/students", gradient: "from-emerald-500 to-green-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
  { key: "activities", label: "Activities", icon: ClipboardList, color: "orange", link: "/activities", gradient: "from-amber-500 to-orange-600", bg: "bg-amber-50 dark:bg-amber-950" },
  { key: "grades", label: "Grades", icon: GraduationCap, color: "purple", link: "/grades", gradient: "from-purple-500 to-violet-600", bg: "bg-purple-50 dark:bg-purple-950" },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ classrooms: 0, students: 0, activities: 0, grades: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchData } = useFetch();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const p = localStorage.getItem("periodo");
    const base = p ? `?period_id=${p}` : "";
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
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your academic period</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <Link to={s.link} className="block bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${s.gradient}`} />
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{s.label}</p>
                    {isLoading ? (
                      <div className="h-9 w-16 mt-1 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats[s.key]}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl ${s.bg}`}>
                    <s.icon size={22} className={`text-${s.color}-600 dark:text-${s.color}-400`} />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors">
                  View details <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-brand-400 to-accent-400 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Calendar size={20} className="text-brand-500" /> Recent Activities
                </h2>
                <Link to="/activities" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium flex items-center gap-1">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-2">
                  {recentActivities.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors cursor-default"
                    >
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{a.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300">
                        {a.max_score} pts
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No activities registered</p>
                  <Link to="/activities" className="inline-flex items-center gap-1 mt-3 text-sm text-brand-600 dark:text-brand-400 font-medium">
                    <Plus size={14} /> Create activity
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-accent-400 to-brand-400" />
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5">Quick Actions</h2>
              <div className="space-y-3">
                {[
                  { to: "/classrooms", icon: School, label: "Manage Classrooms", desc: "Create and organize your classrooms" },
                  { to: "/students", icon: Users, label: "Manage Students", desc: "Add students and import from Excel" },
                  { to: "/grades", icon: GraduationCap, label: "Grade Activities", desc: "Evaluate student submissions" },
                  { to: "/reports", icon: TrendingUp, label: "Generate Reports", desc: "Export PDF or Excel reports" },
                ].map((item, i) => (
                  <motion.div key={i} whileHover={{ x: 4 }}>
                    <Link
                      to={item.to}
                      className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 transition-all"
                    >
                      <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/50">
                        <item.icon size={20} className="text-brand-600 dark:text-brand-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
