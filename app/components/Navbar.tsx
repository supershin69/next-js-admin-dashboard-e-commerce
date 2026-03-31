"use client";
import { useLayoutEffect } from "react";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useTheme from "../zustand/themeStore";

const Navbar = () => {
  // Safe to access window directly because of ssr: false
  const isDark = useTheme((state) => state.isDark);
  const toggleTheme = useTheme((state) => state.toggleTheme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <nav className="flex h-18 items-center justify-between border-b border-gray-200 bg-background px-4 md:px-8">
      <div className="leading-tight">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">DigitalHub</h1>
        <p className="text-xs text-gray-500 md:text-sm">Admin Dashboard</p>
      </div>

      <button
        type="button"
        aria-label="Toggle theme"
        onClick={toggleTheme}
        className="group inline-flex items-center gap-2 rounded-full border border-gray-300 bg-background px-2 py-1.5 text-sm shadow-sm transition-colors hover:bg-gray-50"
      >
        <span
          className={`grid h-7 w-7 place-items-center rounded-full text-xs transition-colors ${
            !isDark ? "bg-amber-100 text-amber-700" : "text-gray-400"
          }`}
        >
          <FontAwesomeIcon icon={faSun} />
        </span>
        <span className="relative h-6 w-12 overflow-hidden rounded-full border border-gray-300 bg-gray-100 transition-colors">
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              isDark ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </span>
        <span
          className={`grid h-7 w-7 place-items-center rounded-full text-xs transition-colors ${
            isDark ? "bg-blue-100 text-blue-700" : "text-gray-400"
          }`}
        >
          <FontAwesomeIcon icon={faMoon} />
        </span>
      </button>
    </nav>
  );
};

export default Navbar;
