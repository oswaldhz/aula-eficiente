import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from "@clerk/clerk-react";
import { BASE_URL } from "./api";


import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import ClassroomsPage from "./pages/ClassroomsPage";
import StudentsPage from "./pages/StudentsPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import GradesPage from "./pages/GradesPage";
import ReportsPage from "./pages/ReportsPage";
import PeriodsPage from "./pages/PeriodsPage";
import ProfilePage from "./pages/ProfilePage";

function PeriodSelector({ selectedPeriodo, setSelectedPeriodo, periodos }) {
  return (
    <select
      value={selectedPeriodo}
      onChange={(e) => {
        setSelectedPeriodo(e.target.value);
        localStorage.setItem("periodo", e.target.value);
      }}
      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
    >
      {periodos.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} - {p.year}
        </option>
      ))}
    </select>
  );
}

export default function App() {
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState(
    localStorage.getItem("periodo") || ""
  );
  const { getToken } = useAuth();

  useEffect(() => {
    loadPeriodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      periodos.length > 0 &&
      !periodos.find((p) => p.id.toString() === selectedPeriodo?.toString())
    ) {
      const firstId = periodos[0]?.id || "";
      setSelectedPeriodo(firstId);
      localStorage.setItem("periodo", firstId);
    }
  }, [periodos, selectedPeriodo]);

  const loadPeriodos = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/periods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPeriodos(await res.json());
    } catch {}
  };

  return (
    <>
      <SignedIn>
        <Layout
          periodSelector={
            <PeriodSelector
              selectedPeriodo={selectedPeriodo}
              setSelectedPeriodo={setSelectedPeriodo}
              periodos={periodos}
            />
          }
        >
          <ErrorBoundary>
            <div key={selectedPeriodo}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/classrooms" element={<ClassroomsPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/activities" element={<ActivitiesPage />} />
                <Route path="/grades" element={<GradesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/periods" element={<PeriodsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </ErrorBoundary>
        </Layout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
