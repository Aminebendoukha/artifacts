import React, { createContext, useContext, useMemo, useState } from "react";

const RoleContext = createContext(null);

export function RoleProvider({ children, initialRole = "client" }) {
  const [role, setRole] = useState(initialRole);

  const value = useMemo(() => ({ role, setRole }), [role]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }

  return context;
}