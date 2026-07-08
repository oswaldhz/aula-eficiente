import { useState, useEffect } from "react";
import { useFetch } from "../api";
import { Plus, Calendar, Edit3, Trash2, Clock, MoreVertical } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import SearchFilter from "../components/ui/SearchFilter";
import CrudModal from "../components/ui/CrudModal";
import { SkeletonGrid, EmptyState, CardGrid } from "../components/ui/DataGrid";
import * as DropdownMenu from "../components/ui/DropdownMenu";
import { usePeriod } from "../context/PeriodContext";

export default function PeriodsPage() {
  const { fetchData, postData, putData, deleteData } = useFetch();
  const { triggerRefresh } = usePeriod();
  const [periods, setPeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", year: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    setPeriods(await fetchData("periods"));
    setIsLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ name: "", year: "" }); setModalOpen(true); };
  const openEdit = (per) => { setEditing(per); setForm({ name: per.name, year: per.year ?? "" }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { ...form, year: Number(form.year) || new Date().getFullYear() };
    if (editing) await putData(`periods/${editing.id}`, payload);
    else await postData("periods", payload);
    setSaving(false); setModalOpen(false); loadData(); triggerRefresh();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this period?")) return;
    await deleteData(`periods/${id}`); loadData(); triggerRefresh();
  };

  const filtered = periods.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()) || String(p.year).includes(search));

  return (
    <div className="page-enter">
      <PageHeader title="Periods" subtitle="Manage academic periods" actions={
        <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"><Plus size={15} /> Add</button>
      } />

      <SearchFilter value={search} onChange={setSearch} placeholder="Search periods..." />

      {isLoading ? <SkeletonGrid /> : filtered.length > 0 ? (
        <CardGrid>
          {filtered.map((per) => (
            <div key={per.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all relative group">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"><Calendar size={18} /></div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{per.name}</h3>
                      {per.year && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={11} /> Year {per.year}</p>}
                    </div>
                  </div>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100 text-gray-400"><MoreVertical size={15} /></button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item onClick={() => openEdit(per)}><Edit3 size={14} /> Edit</DropdownMenu.Item>
                      <DropdownMenu.Item onClick={() => handleDelete(per.id)} danger><Trash2 size={14} /> Delete</DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              </div>
            </div>
          ))}
        </CardGrid>
      ) : (
        <EmptyState icon={Calendar} title="No periods found" description={search ? "Try a different search term" : "Create your first academic period"} action={
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"><Plus size={15} /> Create</button>
        } />
      )}

      <CrudModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Edit Period" : "New Period"} onSave={handleSave} saving={saving} saveLabel={editing ? "Update" : "Create"}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all" placeholder="e.g. Fall Semester 2026" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Year</label>
            <input type="number" min={2000} max={2100} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all" placeholder={String(new Date().getFullYear())} />
          </div>
        </div>
      </CrudModal>
    </div>
  );
}
