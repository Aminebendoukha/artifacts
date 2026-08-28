import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

function applyTheme(theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children, initialTheme = "light" }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return initialTheme;
    }

    return window.localStorage.getItem("orbit-theme") ?? initialTheme;
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem("orbit-theme", theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}