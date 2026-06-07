import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Wrench, 
  Clock, 
  ArrowRight, 
  RefreshCw, 
  Sliders, 
  Calendar, 
  Monitor, 
  AlertCircle, 
  Percent, 
  ShieldAlert,
  SlidersHorizontal,
  Flame,
  Gauge
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import useStore from '../store/useStore';
import { api } from '../services/api';

const CircularProgress = ({ value, label, size = 120, strokeWidth = 10, colorClass, isLarge = false }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative animate-fade-in" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-dark-border"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          strokeLinecap="square"
          className={colorClass}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center inset-0">
        <span className={`${isLarge ? 'text-2xl' : 'text-lg'} font-black font-mono text-gray-900 dark:text-white`}>
          {Math.round(value)}<span className="text-[10px] text-gray-500">%</span>
        </span>
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{label}</span>
      </div>
    </div>
  );
};

const WhatIfAnalysis = () => {
  const { oeeData } = useStore();

  const machineList = useMemo(() => {
    if (oeeData && oeeData.length > 0) {
      return oeeData.map((m, i) => ({ id: `m${i}`, name: m.machineId, uid: m.unit_uid }));
    }
    return [
      { id: 'm1', name: 'Makine 1', uid: '3a1d1435-0bb7-86db-9c63-ca5b1272cbf3' },
      { id: 'm2', name: 'Makine 2', uid: '4b2e2546-1cc8-97ec-0d74-da6c2383dc04' },
      { id: 'm3', name: 'Makine 3', uid: '5c3f3657-2dd9-08fd-1e85-eb7d3494ed15' },
    ];
  }, [oeeData]);

  // States
  const [selectedMachineId, setSelectedMachineId] = useState(machineList[0]?.id || 'm1');
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [isDatesLoading, setIsDatesLoading] = useState(false);

  // Levers state
  const [downtimeReduction, setDowntimeReduction] = useState(30);
  const [cycleSpeedup, setCycleSpeedup] = useState(5);
  const [hourlyCost, setHourlyCost] = useState(120);
  const [partMargin, setPartMargin] = useState(45);
  const [tempZ, setTempZ] = useState(1.44);
  const [pressureZ, setPressureZ] = useState(1.20);

  // Simulation result state
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedMachine = useMemo(() => {
    return machineList.find(m => m.id === selectedMachineId) || machineList[0];
  }, [machineList, selectedMachineId]);

  // Fetch available dates for selected machine
  useEffect(() => {
    const loadDates = async () => {
      setIsDatesLoading(true);
      setErrorMsg('');
      try {
        const res = await api.getAvailableDates(selectedMachine.uid);
        if (res.status === 'success' && res.data && res.data.length > 0) {
          setAvailableDates(res.data);
          setSelectedDate(res.data[0].date);
        } else {
          setAvailableDates([]);
          setSelectedDate('');
          setErrorMsg('Bu makine için veri bulunamadı.');
        }
      } catch (err) {
        console.error("Failed to load dates:", err);
        setErrorMsg('Tarih verisi yüklenirken hata oluştu.');
      } finally {
        setIsDatesLoading(false);
      }
    };
    loadDates();
  }, [selectedMachine.uid]);

  // Set default telemetry values when date changes
  useEffect(() => {
    if (!selectedDate || availableDates.length === 0) return;
    const dateData = availableDates.find(d => d.date === selectedDate);
    if (dateData) {
      if (dateData.telemetry_available && dateData.telemetry) {
        setTempZ(dateData.telemetry.temp_zscore ?? 1.44);
        setPressureZ(dateData.telemetry.pressure_zscore ?? 1.20);
      } else {
        setTempZ(1.44);
        setPressureZ(1.20);
      }
    }
  }, [selectedDate, availableDates]);

  // Run simulation
  const runSimulation = async () => {
    if (!selectedDate || !selectedMachine.uid) return;
    setIsSimulating(true);
    setErrorMsg('');
    try {
      const payload = {
        unit_uid: selectedMachine.uid,
        target_date: selectedDate,
        downtimeReductionPercent: Number(downtimeReduction),
        cycleSpeedupPercent: Number(cycleSpeedup),
        hourlyCost: Number(hourlyCost),
        partMargin: Number(partMargin),
        temperature: Number(tempZ),
        pressure: Number(pressureZ)
      };
      
      const res = await api.simulate(payload);
      if (res.status === 'success') {
        setSimulationResult(res.data);
      } else {
        setErrorMsg('Simülasyon başarısız oldu.');
      }
    } catch (err) {
      console.error("Simulation error:", err);
      setErrorMsg('Bağlantı hatası: Simülasyon yapılamadı.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Run automatically when sliders change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      runSimulation();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [selectedMachine.uid, selectedDate, downtimeReduction, cycleSpeedup, hourlyCost, partMargin, tempZ, pressureZ]);

  const chartData = useMemo(() => {
    if (!simulationResult) return [];
    return [
      { name: 'Kullanılabilirlik (A)', Mevcut: Math.round(simulationResult.baseline.A * 100), Simüle: Math.round(simulationResult.simulated.A * 100) },
      { name: 'Performans (P)', Mevcut: Math.round(simulationResult.baseline.P * 100), Simüle: Math.round(simulationResult.simulated.P * 100) },
      { name: 'Kalite (Q)', Mevcut: Math.round(simulationResult.baseline.Q * 100), Simüle: Math.round(simulationResult.simulated.Q * 100) },
      { name: 'Genel OEE', Mevcut: Math.round(simulationResult.baseline.OEE * 100), Simüle: Math.round(simulationResult.simulated.OEE * 100) },
    ];
  }, [simulationResult]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 h-full overflow-y-auto custom-scrollbar"
    >
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans text-gray-900 dark:text-white uppercase tracking-tight">OEE What-If Simülatörü</h1>
          <p className="text-sm font-mono text-gray-500 dark:text-dark-muted">Kestirimci OEE İyileştirme ve Finansal ROI Analizi</p>
        </div>
        <button 
          onClick={runSimulation}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all rounded-none shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} /> Yeniden Hesapla
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 bg-red-950/20 border border-red-500/50 p-4 text-red-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Levers & Controllers */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Target Selection */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface p-5 border border-gray-200 dark:border-dark-border rounded-none shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-dark-border pb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-blue-500" /> Birim & Zaman Seçimi
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Makine / Hat</label>
                <select 
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-none p-2.5 outline-none font-medium"
                >
                  {machineList.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                {isDatesLoading ? (
                  <div className="w-full bg-gray-100 dark:bg-dark-bg p-2 text-center text-xs text-gray-500 animate-pulse font-mono border border-gray-200 dark:border-gray-800">
                    Tarihler Sorgulanıyor...
                  </div>
                ) : (
                  <select 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-none p-2.5 outline-none font-mono"
                    disabled={availableDates.length === 0}
                  >
                    {availableDates.map(d => (
                      <option key={d.date} value={d.date}>{d.date}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </motion.div>

          {/* OEE Levers */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface p-5 border border-gray-200 dark:border-dark-border rounded-none shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-dark-border pb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-500" /> Simülasyon Kolları (Levers)
            </h3>

            {/* Downtime Reduction */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-700 dark:text-gray-300">
                <span className="uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500" /> Plansız Duruş Azaltımı</span>
                <span className="font-mono text-blue-500">%{downtimeReduction}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={downtimeReduction} 
                onChange={(e) => setDowntimeReduction(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[10px] text-gray-400 leading-normal">
                Bakım iyileştirmeleri ve hızlı arıza giderme aksiyonları ile plansız duruş sürelerinin azaltılma oranı.
              </p>
            </div>

            {/* Cycle Speedup */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-700 dark:text-gray-300">
                <span className="uppercase tracking-wider flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-orange-500" /> Çevrim Hızı Artışı</span>
                <span className="font-mono text-orange-500">%{cycleSpeedup}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="0.5"
                value={cycleSpeedup} 
                onChange={(e) => setCycleSpeedup(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <p className="text-[10px] text-gray-400 leading-normal">
                Makine besleme ve çevrim süresinin hızlandırılması. Eş değer mekanik aşınma ve ısınma tetikler. (Maks %20)
              </p>
            </div>

            {/* Telemetry overrides */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-dark-border">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block flex items-center gap-1"><Flame className="w-3 h-3 text-red-500" /> RCA Telemetri Eşikleri (Z-Score)</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span>Sıcaklık Z-Skor</span>
                    <span className="font-mono text-red-400">{tempZ.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="5" 
                    step="0.05"
                    value={tempZ} 
                    onChange={(e) => setTempZ(Number(e.target.value))}
                    className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span>Basınç Z-Skor</span>
                    <span className="font-mono text-blue-400">{pressureZ.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="5" 
                    step="0.05"
                    value={pressureZ} 
                    onChange={(e) => setPressureZ(Number(e.target.value))}
                    className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
              <p className="text-[9px] text-gray-400 leading-normal">
                Sıcaklık veya Basınç z-skoru kritik eşiğin (2.0) üzerine çıkarsa hurda oranı (Quality kaybı) artış gösterir.
              </p>
            </div>
          </motion.div>

          {/* Financial Settings */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface p-5 border border-gray-200 dark:border-dark-border rounded-none shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-dark-border pb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Finansal Varsayımlar
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Parça Başı Marj (TL)</label>
                <input 
                  type="number" 
                  value={partMargin} 
                  onChange={(e) => setPartMargin(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-mono p-2 rounded-none outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saatlik Makine Maliyeti (TL)</label>
                <input 
                  type="number" 
                  value={hourlyCost} 
                  onChange={(e) => setHourlyCost(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-mono p-2 rounded-none outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </motion.div>

          {/* Baseline Data Card - Seçilen tarihe ait mevcut değerler */}
          {(() => {
            const dateData = availableDates.find(d => d.date === selectedDate);
            if (!dateData || !dateData.baseline) return null;
            const b = dateData.baseline;
            const rows = [
              { label: 'Kullanılabilirlik (A)', value: `%${b.A?.toFixed(1) ?? '-'}`, color: 'text-yellow-500' },
              { label: 'Performans (P)', value: `%${b.P?.toFixed(1) ?? '-'}`, color: 'text-orange-500' },
              { label: 'Kalite (Q)', value: `%${b.Q?.toFixed(1) ?? '-'}`, color: 'text-green-500' },
              { label: 'Genel OEE', value: `%${b.OEE?.toFixed(1) ?? '-'}`, color: 'text-blue-500' },
              { label: 'Gerçek Üretim', value: `${b.good_count ?? '-'} adet`, color: 'text-gray-300' },
            ];
            return (
              <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface p-5 border border-gray-200 dark:border-dark-border rounded-none shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-dark-border pb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" /> Seçili Gün Mevcut Değerler
                </h3>
                <div className="space-y-2">
                  {rows.map(r => (
                    <div key={r.label} className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{r.label}</span>
                      <span className={`text-sm font-black font-mono ${r.color}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
                {dateData.stoppages && dateData.stoppages.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 dark:border-dark-border">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Plansız Duruşlar</span>
                    <div className="space-y-1">
                      {dateData.stoppages.slice(0, 3).map((s, i) => (
                        <div key={i} className="flex justify-between text-[10px] font-mono">
                          <span className="text-red-400 font-bold truncate max-w-[130px]">{s.stoppage_code}</span>
                          <span className="text-gray-400">{Math.round(s.duration_ms / 60000)} dk</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })()}
        </div>

        {/* Right Columns - Simulation Results Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          
          {simulationResult ? (
            <>
              {/* OEE KPI Deltas */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* OEE Comparison */}
                <div className="bg-gradient-to-br from-[#0d1117] to-gray-900 border border-blue-500/30 p-5 rounded-none shadow-lg text-left flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-5">
                    <Gauge className="w-24 h-24 text-blue-500" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block mb-2">Genel OEE İyileşimi</span>
                  
                  <div className="flex items-baseline gap-4 mt-2">
                    <span className="text-4xl font-black font-mono text-white">
                      %{Math.round(simulationResult.simulated.OEE * 1000) / 10}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      Mevcut: %{Math.round(simulationResult.baseline.OEE * 1000) / 10}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-xs text-green-400 font-bold">
                    <TrendingUp className="w-4 h-4" />
                    <span>+{Math.round((simulationResult.simulated.OEE - simulationResult.baseline.OEE) * 1000) / 10} pp (Mutlak Fark)</span>
                  </div>
                </div>

                {/* Recovered Time */}
                <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-5 rounded-none shadow-sm text-left flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-2">Geri Kazanılan Üretim Süresi</span>
                  
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-black font-mono text-gray-900 dark:text-white">
                      {simulationResult.freed_minutes}
                    </span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dakika</span>
                  </div>

                  <div className="mt-4 text-xs font-mono text-gray-400">
                    Plansız Duruş Süresi Azaltılarak Üretime Dahil Edildi.
                  </div>
                </div>

                {/* Simulated Output Deltas */}
                <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-5 rounded-none shadow-sm text-left flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-2">Simüle Üretim Adetleri</span>
                  
                  <div className="flex flex-col gap-1 mt-2 font-mono">
                    <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                      <span>Ekstra Parça:</span>
                      <span className="font-bold text-green-500">+{simulationResult.extra_parts} adet</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                      <span>Hurda Parça:</span>
                      <span className="font-bold text-red-500">{simulationResult.scrap_count} adet</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-900 dark:text-white border-t border-gray-100 dark:border-dark-border pt-1 mt-1">
                      <span>Net İyi Parça:</span>
                      <span className="font-black text-blue-500">{simulationResult.final_good_count} / {simulationResult.good_count_base + simulationResult.extra_parts}</span>
                    </div>
                  </div>
                </div>

              </motion.div>

              {/* Physical limit warning alerts */}
              {simulationResult.p_capped && (
                <motion.div variants={itemVariants} className="bg-amber-950/20 border border-amber-500/50 p-4 text-amber-400 text-xs font-mono flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase mb-1">PERFORMANS EŞİĞİ AŞILDI (CAP LIMIT!)</span>
                    <span>Seçilen hız artışı fiziksel sınırlara ulaştı. Performans bileşeni %100 oranında sabitlendi. Çevrim süresi optimizasyonları maksimum verime ulaştı.</span>
                  </div>
                </motion.div>
              )}

              {/* Scrap anomalies alerts */}
              {simulationResult.scrap_count > 0 && (
                <motion.div variants={itemVariants} className="bg-red-950/20 border border-red-500/50 p-4 text-red-400 text-xs font-mono flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase mb-1">AI TESPİTİ: KRİTİK RCA ANOMALİ VE HURDA ARTIŞI!</span>
                    <span>Ayarlanan telemetri eşikleri z-score &gt; 2.0 sınırında. Kalite parametresi (Q) düşüş göstererek <span className="text-red-400 font-bold">{simulationResult.scrap_count} parça hurda</span> üretimine sebep oldu.</span>
                  </div>
                </motion.div>
              )}

              {/* Baseline vs Simulated Circular Gauges */}
              <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface p-6 border border-gray-200 dark:border-dark-border rounded-none shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" /> A-P-Q Karşılaştırmalı Göstergeler (Mevcut vs Simüle)
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Availability (A)</span>
                    <div className="flex gap-4">
                      <CircularProgress value={simulationResult.baseline.A * 100} label="Mevcut" size={80} strokeWidth={8} colorClass="text-gray-400" />
                      <CircularProgress value={simulationResult.simulated.A * 100} label="Simüle" size={80} strokeWidth={8} colorClass="text-yellow-500" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Performance (P)</span>
                    <div className="flex gap-4">
                      <CircularProgress value={simulationResult.baseline.P * 100} label="Mevcut" size={80} strokeWidth={8} colorClass="text-gray-400" />
                      <CircularProgress value={simulationResult.simulated.P * 100} label="Simüle" size={80} strokeWidth={8} colorClass="text-orange-500" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quality (Q)</span>
                    <div className="flex gap-4">
                      <CircularProgress value={simulationResult.baseline.Q * 100} label="Mevcut" size={80} strokeWidth={8} colorClass="text-gray-400" />
                      <CircularProgress value={simulationResult.simulated.Q * 100} label="Simüle" size={80} strokeWidth={8} colorClass="text-green-500" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Birleşik OEE</span>
                    <div className="flex gap-4">
                      <CircularProgress value={simulationResult.baseline.OEE * 100} label="Mevcut" size={80} strokeWidth={8} colorClass="text-gray-400" />
                      <CircularProgress value={simulationResult.simulated.OEE * 100} label="Simüle" size={80} strokeWidth={8} colorClass="text-blue-500 font-bold" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Financial Returns Matrix */}
              <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface p-6 border border-gray-200 dark:border-dark-border rounded-none shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> Tahmini Senaryo Finansal Katkı Matrisi
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-dark-bg/50 p-4 border border-gray-100 dark:border-gray-800">
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-1">Ekstra Üretim Geliri</span>
                    <span className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(simulationResult.financial.extra_revenue)} / gün
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-dark-bg/50 p-4 border border-gray-100 dark:border-gray-800">
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-1">Kazanılan Süre Tasarrufu</span>
                    <span className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(simulationResult.financial.cost_saving)} / gün
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-dark-bg/50 p-4 border border-gray-100 dark:border-gray-800">
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-1">Aylık Net Fayda (22 İş Günü)</span>
                    <span className="text-sm font-bold font-mono text-emerald-500">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(simulationResult.financial.monthly_impact)} / ay
                    </span>
                  </div>

                  <div className="bg-[#0f172a]/50 dark:bg-emerald-950/20 p-4 border border-emerald-500/20 relative overflow-hidden">
                    <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider block mb-1">Yıllık Tahmini Etki</span>
                    <span className="text-base font-black font-mono text-emerald-400">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(simulationResult.financial.annual_impact)} / yıl
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Stoppages List */}
              <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-0 rounded-none shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase">Bu Tarihe Ait Duruş Kayıtları</h3>
                    <p className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wider">Plansız Duruş Süresi Detayı</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-200 dark:bg-dark-border px-2 py-0.5">
                    {simulationResult.stoppages.length} Olay
                  </span>
                </div>
                
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-dark-bg text-gray-400 text-[9px] uppercase font-bold sticky top-0 border-b border-gray-100 dark:border-gray-800">
                      <tr>
                        <th className="px-4 py-2.5">Duruş Kodu</th>
                        <th className="px-4 py-2.5">Açıklama</th>
                        <th className="px-4 py-2.5 text-right">Süre (Dakika)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                      {simulationResult.stoppages.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-4 py-8 text-center text-gray-500 font-mono">
                            Bu tarihte plansız duruş kaydedilmemiştir.
                          </td>
                        </tr>
                      ) : (
                        simulationResult.stoppages.map((row, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/10 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-gray-900 dark:text-white font-bold">{row.stoppage_code}</td>
                            <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{row.description}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-orange-500 font-bold">
                              {Math.round(row.duration_ms / 60000)} dk
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          ) : (
            <div className="h-full min-h-[400px] bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border flex flex-col items-center justify-center text-center p-8">
              <SlidersHorizontal className="w-12 h-12 text-gray-400 animate-pulse mb-3" />
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">Simülasyon Hesaplanıyor...</h4>
              <p className="text-xs text-gray-500 dark:text-dark-muted mt-1 max-w-xs font-mono">
                Lütfen geçerli makine ve tarih seçildiğinden emin olun.
              </p>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
};

export default WhatIfAnalysis;
