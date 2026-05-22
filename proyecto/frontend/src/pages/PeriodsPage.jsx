import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useFetch } from "../api";
import {
  Plus, Search, Calendar, Edit3, Trash2, X, Save,
  MoreVertical, Clock
} from "lucide-react";

export default function PeriodsPage() {
  const { fetchData, postData, putData, deleteData } = useFetch();
  const [periods, setPeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [form, setForm] = useState({ name: "", year: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const p = await fetchData("periods");
    setPeriods(p);
    setIsLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", year: "" });
    setModalOpen(true);
  };

  const openEdit = (per) => {
    setEditing(per);
    setForm({ name: per.name, year: per.year ?? "" });
    setModalOpen(true);
    setMenuOpen(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { ...form, year: Number(form.year) || new Date().getFullYear() };
    if (editing) {
      await putData(`periods/${editing.id}`, payload);
    } else {
      await postData("periods", payload);
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this period?")) return;
    await deleteData(`periods/${id}`);
    setMenuOpen(null);
    loadData();
  };

  const filtered = periods.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      String(p.year).includes(search)
  );

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Periods</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage academic periods</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Add Period
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search periods..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="h-1 bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((per, i) => (
            <motion.div
              key={per.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all relative group"
            >
              <div className="h-1 bg-gradient-to-r from-brand-400 to-accent-400 rounded-t-2xl" />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/50">
                      <Calendar size={20} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{per.name}</h3>
                      {per.year && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                          <Clock size={11} /> Year {per.year}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === per.id ? null : per.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                    {menuOpen === per.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg z-10 py-1">
                        <button
                          onClick={() => openEdit(per)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(per.id)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Calendar size={56} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No periods found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {search ? "Try a different search term" : "Create your first academic period"}
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Create Period
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
                  {editing ? "Edit Period" : "New Period"}
                </h2>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                    placeholder="e.g. Fall Semester 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Year</label>
                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                    placeholder={String(new Date().getFullYear())}
                  />
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
                  disabled={saving || !form.name.trim()}
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
