import { useState, useEffect, useMemo } from "react";
import { useFetch } from "../api";
import { usePeriod } from "../context/PeriodContext";
import {
  GraduationCap, Save, Check, ChevronRight,
  BookOpen
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/DataGrid";

export default function GradesPage() {
  const { fetchData, postData, putData } = useFetch();
  const { periodId } = usePeriod();
  const [classrooms, setClassrooms] = useState([]);
  const [activities, setActivities] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [scores, setScores] = useState({});

  useEffect(() => { loadClassrooms(); }, [periodId]);

  useEffect(() => {
    if (selectedClassroom) { loadActivities(); }
    else { setActivities([]); setSelectedActivity(""); }
  }, [selectedClassroom]);

  useEffect(() => {
    if (selectedClassroom && selectedActivity) { loadStudentsAndGrades(); }
    else { setStudents([]); setGrades([]); setScores({}); }
  }, [selectedClassroom, selectedActivity]);

  const loadClassrooms = async () => {
    const base = periodId ? `?period_id=${periodId}` : "";
    const c = await fetchData(`classrooms${base}`);
    setClassrooms(c);
    setIsLoading(false);
  };

  const loadActivities = async () => {
    const a = await fetchData(`activities?classroom_id=${selectedClassroom}`);
    setActivities(a);
    setSelectedActivity("");
  };

  const loadStudentsAndGrades = async () => {
    const [s, g] = await Promise.all([
      fetchData(`students?classroom_id=${selectedClassroom}`),
      fetchData(`grades?activity_id=${selectedActivity}`),
    ]);
    setStudents(s);
    setGrades(g);
    const map = {};
    for (const gr of g) map[gr.student_id] = gr.score;
    setScores(map);
  };

  const handleScoreChange = (studentId, value) => {
    setScores((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSave = async (studentId) => {
    const scoreValue = Number(scores[studentId]);
    if (isNaN(scoreValue)) return;
    setSavingId(studentId);
    const existing = gradesByStudent[studentId];
    const payload = { student_id: studentId, activity_id: selectedActivity, score: scoreValue };
    if (existing) {
      await putData(`grades/${existing.id}`, payload);
    } else {
      await postData("grades", payload);
    }
    setSavingId(null);
    loadStudentsAndGrades();
  };

  const gradedIds = useMemo(() => new Set(grades.map(g => g.student_id)), [grades]);
  const gradesByStudent = useMemo(() => {
    const map = {};
    for (const g of grades) map[g.student_id] = g;
    return map;
  }, [grades]);

  const selectedActivityData = activities.find((a) => String(a.id) === String(selectedActivity));

  return (
    <div className="page-enter">
      <PageHeader title="Grades" subtitle="Grade student activities" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={selectedClassroom}
          onChange={(e) => setSelectedClassroom(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all"
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
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all disabled:opacity-50"
        >
          <option value="">Select an activity</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
      </div>

      {!selectedClassroom || !selectedActivity ? (
        <EmptyState
          icon={GraduationCap}
          title={!selectedClassroom ? "Select a classroom" : "Select an activity"}
          description={!selectedClassroom ? "Choose a classroom to start grading" : "Choose an activity to grade"}
        />
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 skeleton rounded-lg" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No students"
          description="This classroom has no students enrolled"
        />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {selectedActivityData && (
            <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <ChevronRight size={15} className="text-brand-500" />
                {selectedActivityData.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Max score: {selectedActivityData.max_score}
                {selectedActivityData.due_date ? ` · Due: ${new Date(selectedActivityData.due_date).toLocaleDateString()}` : ""}
              </p>
            </div>
          )}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {students.map((stu) => (
              <div
                key={stu.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                      {stu.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{stu.name}</p>
                    {stu.identifier && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">ID: {stu.identifier}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {gradedIds.has(stu.id) && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check size={12} /> Saved
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={selectedActivityData?.max_score || 100}
                      step="0.5"
                      value={scores[stu.id] ?? ""}
                      onChange={(e) => handleScoreChange(stu.id, e.target.value)}
                      placeholder="Score"
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm text-center focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 outline-none transition-all"
                    />
                    <button
                      onClick={() => handleSave(stu.id)}
                      disabled={savingId === stu.id || scores[stu.id] === undefined || scores[stu.id] === ""}
                      className="p-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
                    >
                      {savingId === stu.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
