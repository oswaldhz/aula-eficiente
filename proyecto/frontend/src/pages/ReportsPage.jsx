import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useFetch } from "../api";
import { usePeriod } from "../context/PeriodContext";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import {
  FileText, FileSpreadsheet, Download, TrendingUp,
  Search, ChevronRight
} from "lucide-react";

export default function ReportsPage() {
  const { fetchData } = useFetch();
  const { periodId } = usePeriod();
  const [classrooms, setClassrooms] = useState([]);
  const [activities, setActivities] = useState([]);
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");

  useEffect(() => {
    loadClassrooms();
  }, [periodId]);

  useEffect(() => {
    if (selectedClassroom) {
      loadActivities();
    } else {
      setActivities([]);
      setSelectedActivity("");
    }
  }, [selectedClassroom]);

  useEffect(() => {
    if (selectedActivity) {
      loadReportData();
    } else {
      setGrades([]);
      setStudents([]);
    }
  }, [selectedActivity]);

  const loadClassrooms = async () => {
    const base = periodId ? `?period_id=${periodId}` : "";
    const c = await fetchData(`classrooms${base}`);
    setClassrooms(c);
  };

  const loadActivities = async () => {
    const a = await fetchData(`activities?classroom_id=${selectedClassroom}`);
    setActivities(a);
    setSelectedActivity("");
  };

  const loadReportData = async () => {
    setIsLoading(true);
    const [g, s] = await Promise.all([
      fetchData(`grades?activity_id=${selectedActivity}`),
      fetchData(`students?classroom_id=${selectedClassroom}`),
    ]);
    setGrades(g);
    setStudents(s);
    setIsLoading(false);
  };

  const selectedActivityData = activities.find((a) => String(a.id) === String(selectedActivity));
  const selectedClassroomData = classrooms.find((c) => String(c.id) === String(selectedClassroom));

  const getStudentName = (studentId) => {
    return students.find((s) => String(s.id) === String(studentId))?.name || "Unknown";
  };

  const getStudentIdentifier = (studentId) => {
    return students.find((s) => String(s.id) === String(studentId))?.identifier || "";
  };

  const reportRows = grades.map((g) => ({
    name: getStudentName(g.student_id),
    identifier: getStudentIdentifier(g.student_id),
    activity: selectedActivityData?.title || "",
    score: g.score,
    max: selectedActivityData?.max_score || "-",
    classroom: selectedClassroomData?.name || "",
  }));

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Grades Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Classroom: ${selectedClassroomData?.name || ""}`, 14, 28);
    doc.text(`Activity: ${selectedActivityData?.title || ""}`, 14, 34);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);

    doc.autoTable({
      startY: 46,
      head: [["Student", "ID", "Activity", "Score", "Max", "Classroom"]],
      body: reportRows.map((r) => [r.name, r.identifier, r.activity, r.score, r.max, r.classroom]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save("grades_report.pdf");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Grades");
    XLSX.writeFile(wb, "grades_report.xlsx");
  };

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Export grades to PDF or Excel</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={selectedClassroom}
          onChange={(e) => setSelectedClassroom(e.target.value)}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
        >
          <option value="">Select a classroom</option>
          {classrooms.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={selectedActivity}
          onChange={(e) => setSelectedActivity(e.target.value)}
          disabled={!selectedClassroom}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm disabled:opacity-50"
        >
          <option value="">Select an activity</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
      </div>

      {!selectedClassroom || !selectedActivity ? (
        <div className="text-center py-16">
          <TrendingUp size={56} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {!selectedClassroom ? "Select a classroom" : "Select an activity"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose filters to generate a report
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      ) : reportRows.length === 0 ? (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No grades found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">No grades have been recorded for this activity</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-brand-400 to-accent-400 rounded-t-2xl" />
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ChevronRight size={18} className="text-brand-500" />
                {selectedActivityData?.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {selectedClassroomData?.name} &middot; {reportRows.length} student(s)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FileText size={16} /> PDF
              </button>
              <button
                onClick={exportExcel}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activity</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Max</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Classroom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {reportRows.map((row, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{row.identifier}</td>
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{row.activity}</td>
                    <td className="px-6 py-3 text-center font-semibold text-gray-900 dark:text-gray-100">{row.score}</td>
                    <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">{row.max}</td>
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{row.classroom}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <span>{reportRows.length} record(s)</span>
            <div className="flex gap-2">
              <button
                onClick={exportPDF}
                className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium"
              >
                <Download size={14} /> PDF
              </button>
              <button
                onClick={exportExcel}
                className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium"
              >
                <Download size={14} /> Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
