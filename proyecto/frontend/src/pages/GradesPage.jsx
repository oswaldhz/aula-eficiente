import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useFetch } from "../api";
import { usePeriod } from "../context/PeriodContext";
import {
  GraduationCap, Save, Check, X, ChevronRight,
  Search, BookOpen
} from "lucide-react";

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
    if (selectedClassroom && selectedActivity) {
      loadStudentsAndGrades();
    } else {
      setStudents([]);
      setGrades([]);
      setScores({});
    }
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
    for (const gr of g) {
      map[gr.student_id] = gr.score;
    }
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
    const payload = {
      student_id: studentId,
      activity_id: selectedActivity,
      score: scoreValue,
    };
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
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Grades</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Grade student activities</p>
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
          <GraduationCap size={56} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {!selectedClassroom ? "Select a classroom" : "Select an activity"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {!selectedClassroom
              ? "Choose a classroom to start grading"
              : "Choose an activity to grade"}
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No students</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">This classroom has no students enrolled</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-brand-400 to-accent-400 rounded-t-2xl" />
          {selectedActivityData && (
            <div className="px-6 pt-5 pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ChevronRight size={18} className="text-brand-500" />
                {selectedActivityData.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Max score: {selectedActivityData.max_score} &middot;{" "}
                {selectedActivityData.due_date
                  ? `Due: ${new Date(selectedActivityData.due_date).toLocaleDateString()}`
                  : "No due date"}
              </p>
            </div>
          )}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {students.map((stu, i) => (
              <motion.div
                key={stu.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                      {stu.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{stu.name}</p>
                    {stu.identifier && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">ID: {stu.identifier}</p>
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
                      className="w-24 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm text-center"
                    />
                    <button
                      onClick={() => handleSave(stu.id)}
                      disabled={savingId === stu.id || scores[stu.id] === undefined || scores[stu.id] === ""}
                      className="p-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
                    >
                      {savingId === stu.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
