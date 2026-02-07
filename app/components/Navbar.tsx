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
    <nav className={`flex justify-between items-center px-2 md:px-16 lg:px-navbar h-16 border-b border-gray-200 ${isDark && 'shadow-gray-300'}`}>
        <h1 className="text-xl md:text-3xl font-bold">DigitalHub</h1>
        <div className="flex gap-2 md:gap-4 justify-center items-center">
          <FontAwesomeIcon className={`text-lg md:text-2xl ${!isDark && 'text-yellow-500'}`} icon={faSun}/>
          <label className="relative inline-block w-15 h-8.5">
            <input type="checkbox" checked={isDark} onChange={toggleTheme} className="opacity-0 h-0 w-0 switch" />
            <span className="bg-gray-200 rounded-full absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-all duration-300 slider"></span>
            
        </label>
        <FontAwesomeIcon className={`text-lg md:text-2xl ${isDark && 'text-blue-400'}`} icon={faMoon}/>
        </div>
        
    </nav>
  )
}
export default Navbar