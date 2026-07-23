"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SiteTheme = "ap" | "cyberpunk" | "luxury" | "pastel";

const STORAGE_KEY = "ke-site-theme";
const THEMES: SiteTheme[] = ["ap", "cyberpunk", "luxury", "pastel"];

type ThemeContextValue = {
  theme: SiteTheme;
  setTheme: (theme: SiteTheme) => void;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isSiteTheme(value: string | null): value is SiteTheme {
  return !!value && THEMES.includes(value as SiteTheme);
}

function applyTheme(theme: SiteTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>("ap");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const next: SiteTheme = isSiteTheme(stored) ? stored : "ap";
    setThemeState(next);
    applyTheme(next);
  }, []);

  const setTheme = useCallback((next: SiteTheme) => {
    setThemeState(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const cycleTheme = useCallback(() => {
    const index = THEMES.indexOf(theme);
    setTheme(THEMES[(index + 1) % THEMES.length]);
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, cycleTheme }),
    [theme, setTheme, cycleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useSiteTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useSiteTheme must be used within ThemeProvider");
  return ctx;
}
