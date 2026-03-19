"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button className="h-12 w-12 rounded-2xl border border-border/60 bg-card/90 backdrop-blur-md shadow-lg" />
      </div>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={cycleTheme}
        title={`Theme: ${theme}`}
        className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-card/90 backdrop-blur-md shadow-lg transition-all duration-200 hover:scale-105 hover:border-primary/40 hover:shadow-xl"
      >
        {theme === "light" && (
          <Sun className="h-5 w-5 text-amber-500 transition-transform group-hover:rotate-12" />
        )}
        {theme === "dark" && (
          <Moon className="h-5 w-5 text-blue-400 transition-transform group-hover:-rotate-12" />
        )}
        {theme === "system" && (
          <Monitor className="h-5 w-5 text-muted-foreground transition-transform group-hover:scale-110" />
        )}
      </button>
    </div>
  );
}
