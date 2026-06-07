import React from 'react';
import { Bell, User, Search, Moon, Sun, Menu } from 'lucide-react';

const Topbar = ({ darkMode, toggleDarkMode }) => {
  return (
    <header className="h-16 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-border flex items-center justify-between px-6 transition-colors duration-300 z-10 sticky top-0">
      <div className="flex items-center">
        <button className="p-2 mr-3 md:hidden rounded-sm hover:bg-gray-100 dark:hover:bg-dark-border text-gray-500 dark:text-dark-muted">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex flex-col">
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">Makine 1 — Fanuc CNC <span className="text-gray-400 dark:text-gray-500 font-normal">| Demo Plant</span></h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-none bg-[#22C55E] animate-pulse"></span>
            <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 tracking-widest uppercase">Veri Dönemi: Ağu 2025 – May 2026</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-dark-border text-gray-500 dark:text-dark-muted transition-colors"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button className="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-dark-border text-gray-500 dark:text-dark-muted transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-sm border-2 border-white dark:border-dark-surface"></span>
        </button>
        <div className="h-8 w-8 rounded-sm bg-gradient-to-tr from-primary-500 to-accent-500 p-[2px] cursor-pointer">
          <div className="h-full w-full rounded-sm bg-white dark:bg-dark-surface flex items-center justify-center overflow-hidden">
            <User className="w-4 h-4 text-gray-500 dark:text-dark-muted" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
