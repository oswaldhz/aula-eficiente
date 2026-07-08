import { useState, useEffect, useRef, useCallback } from "react";
import { useFetch } from "../api";
import { usePeriod } from "../context/PeriodContext";
import * as XLSX from "xlsx";
import { Plus, Users, Edit3, Trash2, Upload, Download, MoreVertical, X, User, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "../components/ui/PageHeader";
import SearchFilter from "../components/ui/SearchFilter";
import CrudModal from "../components/ui/CrudModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import NoPeriodGuide from "../components/NoPeriodGuide";
import { SkeletonGrid, EmptyState, CardGrid } from "../components/ui/DataGrid";
import * as DropdownMenu from "../components/ui/DropdownMenu";
import * as Select from "../components/ui/Select";

export default function StudentsPage() {
  const { fetchData, postData, putData, deleteData } = useFetch();
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", identifier: "", classroom_id: "" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importClassroom, setImportClassroom] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const { periodId } = usePeriod();

  useEffect(() => { loadData(); }, [periodId]);

  const loadData = async () => {
    setIsLoading(true);
    const base = periodId ? `?period_id=${periodId}` : "";
    const [s, c] = await Promise.all([fetchData("students"), fetchData(`classrooms${base}`)]);
    setStudents(s); setClassrooms(c); setIsLoading(false);
  };

  const openCreate = () => {
    setEditing(null); setForm({ name: "", identifier: "", classroom_id: classrooms[0]?.id || "" }); setModalOpen(true);
  };

  const openEdit = (stu) => {
    setEditing(stu); setForm({ name: stu.name, identifier: stu.identifier || "", classroom_id: stu.classroom_id || "" }); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editing) await putData(`students/${editing.id}`, form);
    else await postData("students", form);
    setSaving(false); setModalOpen(false); loadData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteData(`students/${deleteTarget}`); loadData();
    setDeleteTarget(null);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: "", identifier: "" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students_template.xlsx");
  };

  const handleFileDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      setImportData(XLSX.utils.sheet_to_json(ws));
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleImport = async () => {
    if (!importClassroom || importData.length === 0) return;
    setSaving(true);
    for (const row of importData) {
      if (row.name || row.Name || row.NOMBRE) {
        await postData("students", {
          name: row.name || row.Name || row.NOMBRE,
          identifier: String(row.identifier || row.Identifier || row.ID || ""),
          classroom_id: importClassroom,
        });
      }
    }
    setSaving(false); setImportOpen(false); setImportData([]); setImportClassroom(""); loadData();
  };

  const filtered = students.filter((s) => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.identifier?.toLowerCase().includes(search.toLowerCase());
    const matchClass = !classroomFilter || String(s.classroom_id) === classroomFilter;
    return matchSearch && matchClass;
  });

  return (
    <div className="page-enter">
      <PageHeader title="Students" subtitle="Manage your students" actions={
        <>
          <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium">
            <Upload size={15} /> Import
          </button>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
            <Plus size={15} /> Add
          </button>
        </>
      } />

      <NoPeriodGuide>
        <SearchFilter value={search} onChange={setSearch} placeholder="Search students..." filters={
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
          {filtered.map((stu) => (
            <div key={stu.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all relative group">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stu.name}</h3>
                      {stu.identifier && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ID: {stu.identifier}</p>}
                    </div>
                  </div>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100 text-gray-400">
                        <MoreVertical size={15} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item onClick={() => openEdit(stu)}><Edit3 size={14} /> Edit</DropdownMenu.Item>
                      <DropdownMenu.Item onClick={() => setDeleteTarget(stu.id)} danger><Trash2 size={14} /> Delete</DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
                {stu.classroom_name && <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1"><Users size={12} /> {stu.classroom_name}</p>}
              </div>
            </div>
          ))}
        </CardGrid>
      ) : (
        <EmptyState icon={Users} title="No students found" description={search ? "Try a different search term" : "Add students manually or import from Excel"} action={
          <div className="flex justify-center gap-3">
            <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"><Plus size={15} /> Add</button>
            <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"><Upload size={15} /> Import</button>
          </div>
        } />
      )}
      </NoPeriodGuide>

      <CrudModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Edit Student" : "New Student"} onSave={handleSave} saving={saving} saveLabel={editing ? "Update" : "Create"}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all placeholder:text-gray-400" placeholder="Student name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Identifier</label>
            <input value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all" placeholder="Student ID" />
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete student"
        message="Are you sure you want to delete this student? Their grades and records will be permanently removed."
        onConfirm={handleDelete}
      />

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Import Students</h2>
              <button onClick={() => { setImportOpen(false); setImportData([]); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400"><X size={16} /></button>
            </div>
            <div className="px-5 pb-2 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Target Classroom</label>
                <Select.Root value={importClassroom} onValueChange={setImportClassroom}>
                  <Select.Trigger placeholder="Select a classroom" />
                  <Select.Content>
                    {classrooms.map((c) => <Select.Item key={c.id} value={c.id}>{c.name}</Select.Item>)}
                  </Select.Content>
                </Select.Root>
              </div>
              <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragOver ? "border-brand-400 bg-brand-50 dark:bg-brand-900/20" : "border-gray-300 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-600"}`}
                onClick={() => fileInputRef.current?.click()}>
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drop your Excel file here or click to browse</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">.xlsx files supported</p>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileDrop} />
              </div>
              <div className="flex items-center">
                <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium"><Download size={13} /> Download template</button>
              </div>
              {importData.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{importData.length} row(s) detected</p>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr><th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Name</th><th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Identifier</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {importData.map((row, i) => (
                          <tr key={i}><td className="px-3 py-2 text-gray-900 dark:text-gray-100">{row.name || row.Name || row.NOMBRE || ""}</td><td className="px-3 py-2 text-gray-500 dark:text-gray-400">{row.identifier || row.Identifier || row.ID || ""}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => { setImportOpen(false); setImportData([]); }} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleImport} disabled={saving || !importClassroom || importData.length === 0} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FileSpreadsheet size={14} />}
                Import {importData.length > 0 ? `(${importData.length})` : ""}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
