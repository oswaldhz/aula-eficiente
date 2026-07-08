import { useState, useEffect } from "react";
import { useFetch } from "../api";
import { usePeriod } from "../context/PeriodContext";
import {
  Plus, School, Edit3, Trash2, BookOpen,
  MoreVertical
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import SearchFilter from "../components/ui/SearchFilter";
import CrudModal from "../components/ui/CrudModal";
import { SkeletonGrid, EmptyState, CardGrid } from "../components/ui/DataGrid";
import ContextMenu from "../components/ui/ContextMenu";

export default function ClassroomsPage() {
  const { fetchData, postData, putData, deleteData } = useFetch();
  const [classrooms, setClassrooms] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", period_id: "" });
  const [saving, setSaving] = useState(false);

  const { periodId } = usePeriod();

  useEffect(() => { loadData(); }, [periodId]);

  const loadData = async () => {
    setIsLoading(true);
    const base = periodId ? `?period_id=${periodId}` : "";
    const [c, p] = await Promise.all([
      fetchData(`classrooms${base}`),
      fetchData("periods"),
    ]);
    setClassrooms(c);
    setPeriods(p);
    setIsLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", period_id: periodId || periods[0]?.id || "" });
    setModalOpen(true);
  };

  const openEdit = (cls) => {
    setEditing(cls);
    setForm({ name: cls.name, description: cls.description || "", period_id: cls.period_id || "" });
    setModalOpen(true);
    setMenuOpen(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editing) {
      await putData(`classrooms/${editing.id}`, form);
    } else {
      await postData("classrooms", form);
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this classroom?")) return;
    await deleteData(`classrooms/${id}`);
    setMenuOpen(null);
    loadData();
  };

  const filtered = classrooms.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-enter">
      <PageHeader
        title="Classrooms"
        subtitle="Manage your classrooms"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus size={15} /> Add
          </button>
        }
      />

      <SearchFilter
        value={search}
        onChange={setSearch}
        placeholder="Search classrooms..."
      />

      {isLoading ? (
        <SkeletonGrid />
      ) : filtered.length > 0 ? (
        <CardGrid>
          {filtered.map((cls) => (
            <div
              key={cls.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all relative group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                      <School size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cls.name}</h3>
                      {cls.period_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cls.period_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === cls.id ? null : cls.id)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100 text-gray-400"
                    >
                      <MoreVertical size={15} />
                    </button>
                    <ContextMenu
                      open={menuOpen === cls.id}
                      onClose={() => setMenuOpen(null)}
                      items={[
                        { icon: <Edit3 size={14} />, label: "Edit", onClick: () => openEdit(cls) },
                        { icon: <Trash2 size={14} />, label: "Delete", onClick: () => handleDelete(cls.id), danger: true },
                      ]}
                    />
                  </div>
                </div>
                {cls.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 line-clamp-2 leading-relaxed">
                    {cls.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No classrooms found"
          description={search ? "Try a different search term" : "Get started by creating your first classroom"}
          action={
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              <Plus size={15} /> Create
            </button>
          }
        />
      )}

      <CrudModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Classroom" : "New Classroom"}
        onSave={handleSave}
        saving={saving}
        saveLabel={editing ? "Update" : "Create"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all placeholder:text-gray-400"
              placeholder="Classroom name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all placeholder:text-gray-400 resize-none"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Period</label>
            <select
              value={form.period_id}
              onChange={(e) => setForm({ ...form, period_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all"
            >
              <option value="">Select a period</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </CrudModal>
    </div>
  );
}
