import { useState, useEffect } from "react";
import { useFetch } from "../api";
import { usePeriod } from "../context/PeriodContext";
import { Plus, ClipboardList, Edit3, Trash2, Calendar, Target, MoreVertical } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import SearchFilter from "../components/ui/SearchFilter";
import CrudModal from "../components/ui/CrudModal";
import { SkeletonGrid, EmptyState, CardGrid } from "../components/ui/DataGrid";
import * as DropdownMenu from "../components/ui/DropdownMenu";
import * as Select from "../components/ui/Select";

export default function ActivitiesPage() {
  const { fetchData, postData, putData, deleteData } = useFetch();
  const [activities, setActivities] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", max_score: "", classroom_id: "" });
  const [saving, setSaving] = useState(false);
  const { periodId } = usePeriod();

  useEffect(() => { loadData(); }, [periodId]);

  const loadData = async () => {
    setIsLoading(true);
    const base = periodId ? `?period_id=${periodId}` : "";
    const [a, c] = await Promise.all([fetchData("activities"), fetchData(`classrooms${base}`)]);
    setActivities(a); setClassrooms(c); setIsLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ title: "", description: "", due_date: "", max_score: "", classroom_id: classrooms[0]?.id || "" }); setModalOpen(true); };
  const openEdit = (act) => { setEditing(act); setForm({ title: act.title, description: act.description || "", due_date: act.due_date ? act.due_date.slice(0, 10) : "", max_score: act.max_score ?? "", classroom_id: act.classroom_id || "" }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { ...form, max_score: Number(form.max_score) };
    if (editing) await putData(`activities/${editing.id}`, payload);
    else await postData("activities", payload);
    setSaving(false); setModalOpen(false); loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this activity?")) return;
    await deleteData(`activities/${id}`); loadData();
  };

  const filtered = activities.filter((a) => {
    const matchSearch = a.title?.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
    const matchClass = !classroomFilter || String(a.classroom_id) === classroomFilter;
    return matchSearch && matchClass;
  });

  return (
    <div className="page-enter">
      <PageHeader title="Activities" subtitle="Manage your activities" actions={
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"><Plus size={15} /> Add</button>
      } />

      <SearchFilter value={search} onChange={setSearch} placeholder="Search activities..." filters={
        <Select.Root value={classroomFilter} onValueChange={setClassroomFilter}>
          <Select.Trigger placeholder="All classrooms" className="w-44" />
          <Select.Content>
            <Select.Item value="">All classrooms</Select.Item>
            {classrooms.map((c) => <Select.Item key={c.id} value={c.id}>{c.name}</Select.Item>)}
          </Select.Content>
        </Select.Root>
      } />

      {isLoading ? <SkeletonGrid /> : filtered.length > 0 ? (
        <CardGrid>
          {filtered.map((act) => (
            <div key={act.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all relative group">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"><ClipboardList size={18} /></div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{act.title}</h3>
                      {act.classroom_name && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{act.classroom_name}</p>}
                    </div>
                  </div>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100 text-gray-400"><MoreVertical size={15} /></button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item onClick={() => openEdit(act)}><Edit3 size={14} /> Edit</DropdownMenu.Item>
                      <DropdownMenu.Item onClick={() => handleDelete(act.id)} danger><Trash2 size={14} /> Delete</DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
                {act.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 line-clamp-2 leading-relaxed">{act.description}</p>}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {act.due_date && <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(act.due_date).toLocaleDateString()}</span>}
                  {act.max_score != null && <span className="flex items-center gap-1"><Target size={11} /> {act.max_score} pts</span>}
                </div>
              </div>
            </div>
          ))}
        </CardGrid>
      ) : (
        <EmptyState icon={ClipboardList} title="No activities found" description={search ? "Try a different search term" : "Create your first activity to get started"} action={
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"><Plus size={15} /> Create</button>
        } />
      )}

      <CrudModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Edit Activity" : "New Activity"} onSave={handleSave} saving={saving} saveLabel={editing ? "Update" : "Create"}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all" placeholder="Activity title" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all resize-none" placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Max Score</label>
              <input type="number" min="0" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all" placeholder="100" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Classroom</label>
            <Select.Root value={form.classroom_id} onValueChange={(v) => setForm({ ...form, classroom_id: v })}>
              <Select.Trigger placeholder="Select a classroom" />
              <Select.Content>
                {classrooms.map((c) => <Select.Item key={c.id} value={c.id}>{c.name}</Select.Item>)}
              </Select.Content>
            </Select.Root>
          </div>
        </div>
      </CrudModal>
    </div>
  );
}
