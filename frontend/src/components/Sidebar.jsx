import React from 'react';
import { NavLink } from 'react-router-dom';
import { LineChart, Settings, Activity, Cpu, Grid, PieChart } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border hidden md:flex flex-col transition-colors duration-300 shadow-xl z-10">
      <div className="h-20 flex items-center px-6 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
        <div className="flex items-center gap-3">
          {/* Trex Logo SVG Recreation */}
          <svg width="40" height="40" viewBox="0 0 100 100" className="flex-shrink-0">
            <path d="M 20,20 L 50,50 L 20,80" fill="none" stroke="#22c55e" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 80,20 L 50,50 L 80,80" fill="none" stroke="#bbf7d0" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          </svg>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100 leading-none mb-1">trexCloud</span>
            <span className="text-[10px] uppercase font-medium text-gray-500 dark:text-gray-400 tracking-widest leading-none">Analytics</span>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-6">
          <p className="px-4 text-xs font-semibold text-gray-400 dark:text-dark-muted uppercase tracking-wider mb-2">
            Modüller
          </p>
          <nav className="space-y-1">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item')} end>
              <Grid className="w-5 h-5" />
              <span>Genel Bakış (Hub)</span>
            </NavLink>
            <NavLink to="/oee" className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item')}>
              <Activity className="w-5 h-5" />
              <span>OEE Analizi</span>
            </NavLink>
            <NavLink to="/rca" className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item')}>
              <Cpu className="w-5 h-5" />
              <span>Kök Neden (RCA)</span>
            </NavLink>
            <NavLink to="/what-if" className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item')}>
              <LineChart className="w-5 h-5" />
              <span>What-If Simülatörü</span>
            </NavLink>
            <NavLink to="/financial-report" className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item')}>
              <PieChart className="w-5 h-5" />
              <span>Finansal Rapor</span>
            </NavLink>
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-[#161b22]">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-[10px] font-mono text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-1">Engine</div>
          <div className="text-xs font-bold text-gray-600 dark:text-gray-300">Powered by DuckDB + Python</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
