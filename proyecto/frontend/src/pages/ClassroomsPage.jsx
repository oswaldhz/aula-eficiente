import { useState, useEffect } from "react";
import { useFetch } from "../api";
import { usePeriod } from "../context/PeriodContext";
import { Plus, School, Edit3, Trash2, BookOpen, MoreVertical } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import SearchFilter from "../components/ui/SearchFilter";
import CrudModal from "../components/ui/CrudModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import NoPeriodGuide from "../components/NoPeriodGuide";
import { SkeletonGrid, EmptyState, CardGrid } from "../components/ui/DataGrid";
import * as DropdownMenu from "../components/ui/DropdownMenu";
import * as Select from "../components/ui/Select";

export default function ClassroomsPage() {
  const { fetchData, postData, putData, deleteData } = useFetch();
  const [classrooms, setClassrooms] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", period_id: "" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { periodId } = usePeriod();

  useEffect(() => { loadData(); }, [periodId]);

  const loadData = async () => {
    setIsLoading(true);
    const base = periodId ? `?period_id=${periodId}` : "";
    const [c, p] = await Promise.all([fetchData(`classrooms${base}`), fetchData("periods")]);
    setClassrooms(c); setPeriods(p); setIsLoading(false);
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
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editing) await putData(`classrooms/${editing.id}`, form);
    else await postData("classrooms", form);
    setSaving(false); setModalOpen(false); loadData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteData(`classrooms/${deleteTarget}`); loadData();
    setDeleteTarget(null);
  };

  const filtered = classrooms.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-enter">
      <PageHeader title="Classrooms" subtitle="Manage your classrooms" actions={
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
          <Plus size={15} /> Add
        </button>
      } />

      <NoPeriodGuide>
        <SearchFilter value={search} onChange={setSearch} placeholder="Search classrooms..." />

        {isLoading ? <SkeletonGrid /> : filtered.length > 0 ? (
        <CardGrid>
          {filtered.map((cls) => (
            <div key={cls.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all relative group">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                      <School size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cls.name}</h3>
                      {cls.period_name && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cls.period_name}</p>}
                    </div>
                  </div>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100 text-gray-400">
                        <MoreVertical size={15} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item onClick={() => openEdit(cls)}>
                        <Edit3 size={14} /> Edit
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onClick={() => setDeleteTarget(cls.id)} danger>
                        <Trash2 size={14} /> Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
                {cls.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 line-clamp-2 leading-relaxed">{cls.description}</p>}
              </div>
            </div>
          ))}
        </CardGrid>
      ) : (
        <EmptyState icon={BookOpen} title="No classrooms found" description={search ? "Try a different search term" : "Get started by creating your first classroom"} action={
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
            <Plus size={15} /> Create
          </button>
        } />
      )}
      </NoPeriodGuide>

      <CrudModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Edit Classroom" : "New Classroom"} onSave={handleSave} saving={saving} saveLabel={editing ? "Update" : "Create"}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all placeholder:text-gray-400" placeholder="Classroom name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all placeholder:text-gray-400 resize-none" placeholder="Optional description" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Period</label>
            <Select.Root value={form.period_id} onValueChange={(v) => setForm({ ...form, period_id: v })}>
              <Select.Trigger placeholder="Select a period" />
              <Select.Content>
                {periods.map((p) => (
                  <Select.Item key={p.id} value={p.id}>{p.name}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete classroom"
        message="Are you sure you want to delete this classroom? All students and activities associated with it will be affected."
        onConfirm={handleDelete}
      />
    </div>
  );
}
