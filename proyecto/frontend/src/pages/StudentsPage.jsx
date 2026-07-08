import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useFetch } from "../api";
import { usePeriod } from "../context/PeriodContext";
import * as XLSX from "xlsx";
import {
  Plus, Search, Users, Edit3, Trash2, X, Save,
  MoreVertical, Upload, Download, FileSpreadsheet, User
} from "lucide-react";

export default function StudentsPage() {
  const { fetchData, postData, putData, deleteData } = useFetch();
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [form, setForm] = useState({ name: "", identifier: "", classroom_id: "" });
  const [saving, setSaving] = useState(false);
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
    const [s, c] = await Promise.all([
      fetchData("students"),
      fetchData(`classrooms${base}`),
    ]);
    setStudents(s);
    setClassrooms(c);
    setIsLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", identifier: "", classroom_id: classrooms[0]?.id || "" });
    setModalOpen(true);
  };

  const openEdit = (stu) => {
    setEditing(stu);
    setForm({ name: stu.name, identifier: stu.identifier || "", classroom_id: stu.classroom_id || "" });
    setModalOpen(true);
    setMenuOpen(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editing) {
      await putData(`students/${editing.id}`, form);
    } else {
      await postData("students", form);
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    await deleteData(`students/${id}`);
    setMenuOpen(null);
    loadData();
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { name: "", identifier: "" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students_template.xlsx");
  };

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);
      setImportData(json);
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
    setSaving(false);
    setImportOpen(false);
    setImportData([]);
    setImportClassroom("");
    loadData();
  };

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.identifier?.toLowerCase().includes(search.toLowerCase());
    const matchClass = !classroomFilter || String(s.classroom_id) === classroomFilter;
    return matchSearch && matchClass;
  });

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Students</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your students</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <Upload size={16} /> Import
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
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
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((stu, i) => (
            <motion.div
              key={stu.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all relative group"
            >
              <div className="h-1 bg-gradient-to-r from-brand-400 to-accent-400 rounded-t-2xl" />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/50">
                      <User size={20} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stu.name}</h3>
                      {stu.identifier && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">ID: {stu.identifier}</p>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === stu.id ? null : stu.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                    {menuOpen === stu.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg z-10 py-1">
                        <button
                          onClick={() => openEdit(stu)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(stu.id)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {stu.classroom_name && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1">
                    <Users size={12} /> {stu.classroom_name}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Users size={56} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No students found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {search ? "Try a different search term" : "Add students manually or import from Excel"}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} /> Add Student
            </button>
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <Upload size={16} /> Import
            </button>
          </div>
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
                  {editing ? "Edit Student" : "New Student"}
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
                    placeholder="Student name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Identifier</label>
                  <input
                    value={form.identifier}
                    onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                    placeholder="Student ID"
                  />
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

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl w-full max-w-lg mx-4 overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-brand-400 to-accent-400 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Import Students</h2>
                <button onClick={() => { setImportOpen(false); setImportData([]); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Target Classroom</label>
                  <select
                    value={importClassroom}
                    onChange={(e) => setImportClassroom(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                  >
                    <option value="">Select a classroom</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                    dragOver
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30"
                      : "border-gray-300 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-600"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={36} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Drop your Excel file here or click to browse
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">.xlsx files supported</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileDrop}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium"
                  >
                    <Download size={14} /> Download template
                  </button>
                </div>

                {importData.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {importData.length} row(s) detected
                    </p>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Identifier</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {importData.map((row, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{row.name || row.Name || row.NOMBRE || ""}</td>
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{row.identifier || row.Identifier || row.ID || ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setImportOpen(false); setImportData([]); }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={saving || !importClassroom || importData.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileSpreadsheet size={16} />
                  )}
                  Import {importData.length > 0 ? `(${importData.length})` : ""}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
