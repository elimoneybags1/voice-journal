"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchProfile, updateProfile } from "./api";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // Load theme from localStorage on mount (instant, no flash)
  useEffect(() => {
    const stored = localStorage.getItem("vj-theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  // Sync theme from profile on mount (async, may override localStorage)
  useEffect(() => {
    fetchProfile()
      .then(({ profile }) => {
        const profileTheme = profile.preferences?.theme as Theme | undefined;
        if (profileTheme === "light" || profileTheme === "dark") {
          setTheme(profileTheme);
          document.documentElement.setAttribute("data-theme", profileTheme);
          localStorage.setItem("vj-theme", profileTheme);
        }
      })
      .catch(() => {
        // Not logged in or profile fetch failed — use localStorage
      });
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("vj-theme", next);

    // Persist to profile (fire and forget)
    updateProfile({ preferences: { theme: next } }).catch(() => {});
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
