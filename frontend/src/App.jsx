import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import WhatIfAnalysis from './pages/WhatIfAnalysis';
import RCA from './pages/RCA';
import DigitalFactoryHub from './pages/DigitalFactoryHub';
import OEEAnalysis from './pages/OEEAnalysis';
import FinancialReport from './pages/FinancialReport';
import useStore from './store/useStore';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Force dark mode by default per user request
    if (localStorage.theme === 'light') return false;
    return true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const fetchInitialData = useStore(state => state.fetchInitialData);
  const isLoading = useStore(state => state.isLoading);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0d1117] text-[#00ff00]">
        <div className="font-mono text-xl animate-pulse">Initializing Digital Twin API...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}>
          <Route index element={<DigitalFactoryHub />} />
          <Route path="oee" element={<OEEAnalysis />} />
          <Route path="what-if" element={<WhatIfAnalysis />} />
          <Route path="rca" element={<RCA />} />
          <Route path="financial-report" element={<FinancialReport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
