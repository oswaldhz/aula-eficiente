import { useState, useEffect } from "react";
import { useFetch } from "../api";
import { usePeriod } from "../context/PeriodContext";
import * as Select from "../components/ui/Select";
import NoPeriodGuide from "../components/NoPeriodGuide";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import {
  FileText, FileSpreadsheet, Download, TrendingUp
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/DataGrid";

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

  useEffect(() => { loadClassrooms(); }, [periodId]);

  useEffect(() => {
    if (selectedClassroom) { loadActivities(); }
    else { setActivities([]); setSelectedActivity(""); }
  }, [selectedClassroom]);

  useEffect(() => {
    if (selectedActivity) { loadReportData(); }
    else { setGrades([]); setStudents([]); }
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

  const getStudentName = (studentId) => students.find((s) => String(s.id) === String(studentId))?.name || "Unknown";
  const getStudentIdentifier = (studentId) => students.find((s) => String(s.id) === String(studentId))?.identifier || "";

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
    autoTable(doc, {
      startY: 46,
      head: [["Student", "ID", "Activity", "Score", "Max", "Classroom"]],
      body: reportRows.map((r) => [r.name, r.identifier, r.activity, r.score, r.max, r.classroom]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [13, 148, 136] },
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
    <div className="page-enter">
      <PageHeader title="Reports" subtitle="Export grades to PDF or Excel" />

      <NoPeriodGuide />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select.Root value={selectedClassroom} onValueChange={setSelectedClassroom}>
          <Select.Trigger placeholder="Select a classroom" className="flex-1" />
          <Select.Content>
            {classrooms.map((c) => (
              <Select.Item key={c.id} value={c.id}>{c.name}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Select.Root value={selectedActivity} onValueChange={setSelectedActivity} disabled={!selectedClassroom}>
          <Select.Trigger placeholder="Select an activity" className="flex-1" />
          <Select.Content>
            {activities.map((a) => (
              <Select.Item key={a.id} value={a.id}>{a.title}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </div>

      {!selectedClassroom || !selectedActivity ? (
        <EmptyState
          icon={TrendingUp}
          title={!selectedClassroom ? "Select a classroom" : "Select an activity"}
          description="Choose filters to generate a report"
        />
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 skeleton rounded-lg" />
          ))}
        </div>
      ) : reportRows.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No grades found"
          description="No grades have been recorded for this activity"
        />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <TrendingUp size={15} className="text-brand-500" />
                {selectedActivityData?.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {selectedClassroomData?.name} &middot; {reportRows.length} student(s)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FileText size={14} /> PDF
              </button>
              <button
                onClick={exportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activity</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reportRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{row.identifier}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{row.activity}</td>
                    <td className="px-5 py-3 text-sm text-center font-semibold text-gray-900 dark:text-gray-100">{row.score}</td>
                    <td className="px-5 py-3 text-sm text-center text-gray-500 dark:text-gray-400">{row.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>{reportRows.length} record(s)</span>
            <div className="flex gap-3">
              <button onClick={exportPDF} className="flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium">
                <Download size={12} /> PDF
              </button>
              <button onClick={exportExcel} className="flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium">
                <Download size={12} /> Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
