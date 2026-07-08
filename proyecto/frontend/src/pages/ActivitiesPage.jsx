import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useFetch } from "../api";
import { usePeriod } from "../context/PeriodContext";
import {
  Plus, Search, ClipboardList, Edit3, Trash2, X, Save,
  MoreVertical, Calendar, Target
} from "lucide-react";

export default function ActivitiesPage() {
  const { fetchData, postData, putData, deleteData } = useFetch();
  const [activities, setActivities] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", max_score: "", classroom_id: "" });
  const [saving, setSaving] = useState(false);

  const { periodId } = usePeriod();

  useEffect(() => { loadData(); }, [periodId]);

  const loadData = async () => {
    setIsLoading(true);
    const base = periodId ? `?period_id=${periodId}` : "";
    const [a, c] = await Promise.all([
      fetchData("activities"),
      fetchData(`classrooms${base}`),
    ]);
    setActivities(a);
    setClassrooms(c);
    setIsLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", due_date: "", max_score: "", classroom_id: classrooms[0]?.id || "" });
    setModalOpen(true);
  };

  const openEdit = (act) => {
    setEditing(act);
    setForm({
      title: act.title,
      description: act.description || "",
      due_date: act.due_date ? act.due_date.slice(0, 10) : "",
      max_score: act.max_score ?? "",
      classroom_id: act.classroom_id || "",
    });
    setModalOpen(true);
    setMenuOpen(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      max_score: Number(form.max_score),
    };
    if (editing) {
      await putData(`activities/${editing.id}`, payload);
    } else {
      await postData("activities", payload);
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this activity?")) return;
    await deleteData(`activities/${id}`);
    setMenuOpen(null);
    loadData();
  };

  const filtered = activities.filter((a) => {
    const matchSearch =
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());
    const matchClass = !classroomFilter || String(a.classroom_id) === classroomFilter;
    return matchSearch && matchClass;
  });

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Activities</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your activities</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Add Activity
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
          />
        </div>
        <select
          value={classroomFilter}
          onChange={(e) => setClassroomFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
        >
          <option value="">All classrooms</option>
          {classrooms.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="h-1 bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((act, i) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all relative group"
            >
              <div className="h-1 bg-gradient-to-r from-brand-400 to-accent-400 rounded-t-2xl" />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/50">
                      <ClipboardList size={20} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{act.title}</h3>
                      {act.classroom_name && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{act.classroom_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === act.id ? null : act.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                    {menuOpen === act.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg z-10 py-1">
                        <button
                          onClick={() => openEdit(act)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(act.id)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {act.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 line-clamp-2">{act.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
                  {act.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {new Date(act.due_date).toLocaleDateString()}
                    </span>
                  )}
                  {act.max_score != null && (
                    <span className="flex items-center gap-1">
                      <Target size={12} /> {act.max_score} pts
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <ClipboardList size={56} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No activities found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {search ? "Try a different search term" : "Create your first activity to get started"}
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Create Activity
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl w-full max-w-md mx-4 overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-brand-400 to-accent-400 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {editing ? "Edit Activity" : "New Activity"}
                </h2>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                    placeholder="Activity title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm resize-none"
                    placeholder="Optional description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Due Date</label>
                    <input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Max Score</label>
                    <input
                      type="number"
                      min="0"
                      value={form.max_score}
                      onChange={(e) => setForm({ ...form, max_score: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                      placeholder="100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Classroom</label>
                  <select
                    value={form.classroom_id}
                    onChange={(e) => setForm({ ...form, classroom_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                  >
                    <option value="">Select a classroom</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
