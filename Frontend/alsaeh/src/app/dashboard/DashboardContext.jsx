"use client";

import { createContext, useContext } from "react";

const DashboardContext = createContext({
  user: null,
  token: null,
  plans: null,
  setPlans: () => {},
  initLoaded: false,
});


export function DashboardProvider({ value, children }) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
