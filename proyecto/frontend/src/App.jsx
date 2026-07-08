import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BASE_URL } from "./api";
import { PeriodProvider, usePeriod } from "./context/PeriodContext";
import * as Select from "./components/ui/Select";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

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

function PeriodSelector({ periodos }) {
  const { periodId, setPeriodId } = usePeriod();
  return (
    <Select.Root value={periodId} onValueChange={setPeriodId}>
      <Select.Trigger placeholder="Select period" />
      <Select.Content>
        {periodos.map((p) => (
          <Select.Item key={p.id} value={p.id}>
            {p.name} - {p.year}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

function AppContent() {
  const [periodos, setPeriodos] = useState([]);
  const { periodId, setPeriodId } = usePeriod();
  const { getToken } = useAuth();

  useEffect(() => { loadPeriodos(); }, []);

  useEffect(() => {
    if (periodos.length > 0 && !periodos.find((p) => p.id.toString() === periodId?.toString())) {
      setPeriodId(periodos[0]?.id || "");
    }
  }, [periodos, periodId, setPeriodId]);

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
        <Layout periodSelector={<PeriodSelector periodos={periodos} />}>
          <ErrorBoundary>
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
          </ErrorBoundary>
        </Layout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PeriodProvider>
        <AppContent />
      </PeriodProvider>
    </QueryClientProvider>
  );
}
