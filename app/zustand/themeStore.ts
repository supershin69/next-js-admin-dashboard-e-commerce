"use client"
import { create } from "zustand";
import { themeStore } from "../types/themeType";

const getTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const useTheme = create<themeStore>((set) => ({
    isDark: getTheme(),
    toggleTheme: () => set((state) => ({ isDark: !state.isDark})),
}));

export default useTheme;