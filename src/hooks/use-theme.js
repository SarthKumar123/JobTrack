import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("jobtrack-theme") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("jobtrack-theme", theme);
    } catch {
      // The theme still works when browser storage is unavailable.
    }
  }, [theme]);

  return [theme, (dark) => setTheme(dark ? "dark" : "light")];
}
