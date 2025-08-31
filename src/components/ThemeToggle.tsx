"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark(!dark)}
      className="fixed top-4 right-4 z-20 rounded border px-3 py-1 text-sm bg-white/80 dark:bg-gray-800/80"
    >
      {dark ? "Light" : "Dark"}
    </button>
  );
}
