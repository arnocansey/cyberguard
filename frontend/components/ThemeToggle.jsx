"use client";

import { useEffect, useState } from "react";

const resolveTheme = () => {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  return prefersLight ? "light" : "dark";
};

export default function ThemeToggle({ variant = "app" }) {
  // Keep SSR + first client render stable to avoid hydration mismatch.
  const [theme, setTheme] = useState("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = resolveTheme();
    setTheme(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const isLight = theme === "light";
    document.body.classList.toggle("light", isLight);
    document.documentElement.classList.toggle("light", isLight);
    localStorage.setItem("theme", theme);
  }, [theme, ready]);

  const variantClass = variant === "public" ? "theme-toggle-public" : "theme-toggle-app";

  return (
    <button
      className={`theme-toggle ${variantClass}`}
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      type="button"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
