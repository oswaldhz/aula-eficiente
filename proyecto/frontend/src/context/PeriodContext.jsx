import { createContext, useContext, useState, useEffect, useCallback } from "react";

const PeriodContext = createContext();

export function PeriodProvider({ children }) {
  const [periodId, setPeriodId] = useState(() => localStorage.getItem("periodo") || "");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (periodId) {
      localStorage.setItem("periodo", periodId);
    } else {
      localStorage.removeItem("periodo");
    }
  }, [periodId]);

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <PeriodContext.Provider value={{ periodId, setPeriodId, refreshKey, triggerRefresh }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  return useContext(PeriodContext);
}
