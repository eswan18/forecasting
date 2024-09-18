'use client';

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure the component is mounted before rendering (to prevent hydration mismatch).
  useEffect(() => setMounted(true), []);

  const sizeStyle = "w-9 h-9";

  if (!mounted) return <div className={sizeStyle} />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`p-2 rounded-md bg-primary-foreground text-primary-background ${sizeStyle}`}
    >
      {theme === "dark" ? <Moon /> : <Sun />}
    </button>
  );
}