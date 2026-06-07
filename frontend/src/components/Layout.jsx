import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ darkMode, toggleDarkMode }) => {
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-dark-bg overflow-hidden transition-colors duration-300 print:block print:h-auto print:bg-white print:overflow-visible">
      <div className="print:hidden h-full flex">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 w-full overflow-hidden print:block print:overflow-visible">
        <div className="print:hidden">
          <Topbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 scroll-smooth print:overflow-visible print:p-0 print:m-0">
          <div className="max-w-7xl mx-auto animate-fade-in w-full print:max-w-none print:w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
