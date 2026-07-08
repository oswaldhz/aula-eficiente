import { createContext, useContext, useState, useEffect } from "react";

const PeriodContext = createContext();

export function PeriodProvider({ children }) {
  const [periodId, setPeriodId] = useState(() => localStorage.getItem("periodo") || "");

  useEffect(() => {
    if (periodId) {
      localStorage.setItem("periodo", periodId);
    } else {
      localStorage.removeItem("periodo");
    }
  }, [periodId]);

  return (
    <PeriodContext.Provider value={{ periodId, setPeriodId }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  return useContext(PeriodContext);
}
