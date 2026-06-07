import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  RefreshCw, 
  Sliders, 
  Calendar, 
  Monitor, 
  AlertCircle, 
  SlidersHorizontal,
  Gauge,
  Coins,
  CheckCircle2,
  ArrowRight,
  Thermometer,
  Zap
} from 'lucide-react';
import useStore from '../store/useStore';
import { api } from '../services/api';

// ─── Metric Comparison Card ──────────────────────────────────────────────────
const MetricComparisonCard = ({ title, baseline, simulated, accentColor, barColor, icon: Icon }) => {
  const delta = simulated - baseline;
  const isPositive = delta > 0;

  return (
    <div className="bg-[#1a2235] border border-white/15 p-5 flex flex-col justify-between hover:border-white/30 transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4`} style={{ color: accentColor }} />}
          {title}
        </span>
        {delta !== 0 ? (
          <span className={`text-xs px-2 py-0.5 font-black font-mono rounded-sm ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{delta.toFixed(1)}pp
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 font-bold font-mono text-white/40 bg-white/5">—</span>
        )}
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-black font-mono text-white">%{simulated.toFixed(1)}</span>
        <span className="text-sm font-mono text-white/70">mevcut: %{baseline.toFixed(1)}</span>
      </div>

      {/* Progress bar */}
      <div className="mt-4 w-full bg-white/10 h-3 relative overflow-hidden">
        <div
          className="absolute top-0 bottom-0 left-0 bg-white/20 transition-all duration-500"
          style={{ width: `${Math.min(baseline, 100)}%` }}
        />
        <div
          className="absolute top-0 bottom-0 left-0 transition-all duration-500 opacity-90"
          style={{ width: `${Math.min(simulated, 100)}%`, backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
};

// ─── Section Header ──────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, color, children }) => (
  <h3 className="text-xs font-black text-white/50 uppercase tracking-widest border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
    {Icon && <Icon className="w-4 h-4" style={{ color }} />}
    {children}
  </h3>
);

// ─── Left Panel Card ─────────────────────────────────────────────────────────
const PanelCard = ({ children, className = '' }) => (
  <div className={`bg-[#161b22] border border-white/10 p-5 space-y-4 ${className}`}>
    {children}
  </div>
);

// ─── Slider Row ──────────────────────────────────────────────────────────────
const SliderRow = ({ label, value, min, max, step = 1, onChange, accent, unit = '%', description }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm font-bold text-white uppercase tracking-wide">{label}</span>
      <span className="text-sm font-black font-mono" style={{ color: accent }}>{unit}{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10"
      style={{ accentColor: accent }}
    />
    {description && <p className="text-xs text-white/35 leading-relaxed">{description}</p>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const WhatIfAnalysis = () => {
  const { oeeData } = useStore();

  const machineList = useMemo(() => {
    if (oeeData && oeeData.length > 0) {
      return oeeData.map((m, i) => ({ id: `m${i}`, name: m.machineId, uid: m.unit_uid }));
    }
    return [
      { id: 'm1',  name: 'Makine 1',     uid: '3a1d1435-0bb7-86db-9c63-ca5b1272cbf3' },
      { id: 'm2',  name: 'Makine 2',     uid: '3a1d1435-0afb-41a7-2d12-5eb77c185258' },
      { id: 'm3',  name: 'Makine 3',     uid: '3a1d8054-94bd-747d-0e30-05d4ca302199' },
      { id: 'm4',  name: 'Makine 4',     uid: '3a1debd9-c20c-53ca-b094-d32a1e422887' },
      { id: 'm5',  name: 'Makine 5',     uid: '3a1debd9-412d-74b3-b3f9-832a50f89a94' },
      { id: 'm6',  name: 'Makine 6',     uid: '3a1debed-c5e4-2f15-1576-2551d5f4bcbf' },
      { id: 'm7',  name: 'Makine 7',     uid: '3a1d144a-0d22-ba9f-884c-18b40551ebd0' },
      { id: 'm8',  name: 'Makine 8',     uid: '3a1d144a-0eb8-8b07-8466-41f170d828de' },
      { id: 'm9',  name: 'Makine 9',     uid: '3a1d1435-0a17-9903-5c19-3d0f521b78ee' },
      { id: 'm10', name: 'Makine 10',    uid: '3a1debf8-841b-af4f-b67c-4aab557e9668' },
      { id: 't400',name: 'TurboCut 400', uid: '3a1bd958-3763-b086-5e4a-1a4d1755b0e9' }
    ];
  }, [oeeData]);

  const [selectedMachineId, setSelectedMachineId] = useState(machineList[0]?.id || 'm1');
  const [availableDates, setAvailableDates]         = useState([]);
  const [selectedDate, setSelectedDate]             = useState('');
  const [isDatesLoading, setIsDatesLoading]         = useState(false);

  // Simulation levers
  const [downtimeReduction, setDowntimeReduction] = useState(30);
  const [cycleSpeedup, setCycleSpeedup]           = useState(5);
  const [hourlyCost, setHourlyCost]               = useState(120);
  const [partMargin, setPartMargin]               = useState(45);

  // RCA Telemetry thresholds
  const [tempThreshold,     setTempThreshold]     = useState(2.5);
  const [pressureThreshold, setPressureThreshold] = useState(3.0);

  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating]         = useState(false);
  const [errorMsg, setErrorMsg]                 = useState('');

  const selectedMachine = useMemo(
    () => machineList.find(m => m.id === selectedMachineId) || machineList[0],
    [machineList, selectedMachineId]
  );

  // Load dates when machine changes
  useEffect(() => {
    const load = async () => {
      setIsDatesLoading(true);
      setErrorMsg('');
      try {
        const res = await api.getAvailableDates(selectedMachine.uid);
        if (res.status === 'success' && res.data?.length > 0) {
          setAvailableDates(res.data);
          setSelectedDate(res.data[0].date);
        } else {
          setAvailableDates([]);
          setSelectedDate('');
          setErrorMsg('Bu makine için veri bulunamadı.');
        }
      } catch {
        setErrorMsg('Tarih verisi yüklenirken hata oluştu.');
      } finally {
        setIsDatesLoading(false);
      }
    };
    load();
  }, [selectedMachine.uid]);

  // Run simulation
  const runSimulation = async () => {
    if (!selectedDate || !selectedMachine.uid) return;
    setIsSimulating(true);
    setErrorMsg('');
    try {
      const res = await api.simulate({
        unit_uid:                selectedMachine.uid,
        target_date:             selectedDate,
        downtimeReductionPercent: Number(downtimeReduction),
        cycleSpeedupPercent:      Number(cycleSpeedup),
        hourlyCost:               Number(hourlyCost),
        partMargin:               Number(partMargin),
        temperature:              Number(tempThreshold),
        pressure:                 Number(pressureThreshold),
      });
      if (res.status === 'success') setSimulationResult(res.data);
      else setErrorMsg('Simülasyon başarısız oldu.');
    } catch {
      setErrorMsg('Bağlantı hatası: Simülasyon yapılamadı.');
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(runSimulation, 200);
    return () => clearTimeout(t);
  }, [selectedMachine.uid, selectedDate, downtimeReduction, cycleSpeedup, hourlyCost, partMargin, tempThreshold, pressureThreshold]);

  const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar bg-[#0a0d12]">

      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">OEE What-If Simülatörü</h1>
          <p className="text-sm text-white/40 mt-0.5">İyileştirme Senaryoları · Finansal Değer Analizi</p>
        </div>
        <button
          onClick={runSimulation}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
          Hesapla
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 bg-red-900/30 border border-red-500/40 p-4 text-red-300 text-sm font-mono flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ════════════════════ LEFT PANEL ════════════════════ */}
        <div className="lg:col-span-1 space-y-4">

          {/* Machine & Date */}
          <PanelCard>
            <SectionHeader icon={Monitor} color="#3b82f6">Makine & Tarih</SectionHeader>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">Makine / Hat</label>
                <select
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="w-full bg-[#0d1117] border border-white/15 text-white text-sm p-2.5 outline-none font-medium"
                >
                  {machineList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">Simülasyon Tarihi</label>
                {isDatesLoading ? (
                  <div className="w-full bg-[#0d1117] p-2.5 text-center text-sm text-white/30 animate-pulse border border-white/10">
                    Yükleniyor...
                  </div>
                ) : (
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-[#0d1117] border border-white/15 text-white text-sm p-2.5 outline-none font-mono"
                    disabled={availableDates.length === 0}
                  >
                    {availableDates.map(d => <option key={d.date} value={d.date}>{d.date}</option>)}
                  </select>
                )}
              </div>
            </div>
          </PanelCard>

          {/* OEE Levers */}
          <PanelCard>
            <SectionHeader icon={Sliders} color="#f97316">Simülasyon Kolları</SectionHeader>
            <SliderRow
              label="Plansız Duruş Azaltımı"
              value={downtimeReduction}
              min={0} max={100}
              onChange={setDowntimeReduction}
              accent="#3b82f6"
              description="Bakım iyileştirme ve arıza giderimi ile duruş süresi hedefi."
            />
            <div className="border-t border-white/10 pt-4">
              <SliderRow
                label="Çevrim Hızı Artışı"
                value={cycleSpeedup}
                min={0} max={20} step={0.5}
                onChange={setCycleSpeedup}
                accent="#f97316"
                description="Mekanik sınırlar dahilinde makine hız artışı. (Maks %20)"
              />
            </div>
          </PanelCard>

          {/* RCA Telemetry Thresholds */}
          <PanelCard>
            <SectionHeader icon={Thermometer} color="#a855f7">RCA Telemetri Eşikleri</SectionHeader>
            <SliderRow
              label="Sıcaklık Z-Skoru"
              value={tempThreshold}
              min={0} max={5} step={0.1}
              onChange={setTempThreshold}
              accent="#a855f7"
              unit=""
              description="Anormal sıcaklık sapması eşiği (σ cinsinden). >2.5 = kritik."
            />
            <div className="border-t border-white/10 pt-4">
              <SliderRow
                label="Basınç Z-Skoru"
                value={pressureThreshold}
                min={0} max={6} step={0.1}
                onChange={setPressureThreshold}
                accent="#ec4899"
                unit=""
                description="Pnömatik basınç anormallik eşiği. >3.0 = AIR PRESSURE hatası riski."
              />
            </div>
            <div className="bg-purple-900/20 border border-purple-500/30 p-3 mt-2">
              <p className="text-xs font-bold text-purple-300 flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-400" />
                Bu eşikler RCA analizindeki telemetri anomali tespitinde kullanılır. Eşiği aşan sinyaller OEE kalite bileşenini etkiler.
              </p>
            </div>
          </PanelCard>

          {/* Financial Assumptions */}
          <PanelCard>
            <SectionHeader icon={DollarSign} color="#10b981">Finansal Parametreler</SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">Birim Marj (TL)</label>
                <input
                  type="number" value={partMargin}
                  onChange={(e) => setPartMargin(Number(e.target.value))}
                  className="w-full bg-[#0d1117] border border-white/15 text-white text-sm font-mono p-2 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">Saatlik Maliyet (TL)</label>
                <input
                  type="number" value={hourlyCost}
                  onChange={(e) => setHourlyCost(Number(e.target.value))}
                  className="w-full bg-[#0d1117] border border-white/15 text-white text-sm font-mono p-2 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </PanelCard>

          {/* Baseline snapshot */}
          {(() => {
            const d = availableDates.find(x => x.date === selectedDate);
            if (!d?.baseline) return null;
            const b = d.baseline;
            return (
              <PanelCard>
                <SectionHeader icon={Calendar} color="#6366f1">Seçili Gün Mevcut</SectionHeader>
                {[
                  { label: 'Kullanılabilirlik (A)', val: `%${b.A?.toFixed(1) ?? '-'}`,   color: '#eab308' },
                  { label: 'Performans (P)',         val: `%${b.P?.toFixed(1) ?? '-'}`,   color: '#f97316' },
                  { label: 'Kalite (Q)',             val: `%${b.Q?.toFixed(1) ?? '-'}`,   color: '#22c55e' },
                  { label: 'OEE',                   val: `%${b.OEE?.toFixed(1) ?? '-'}`, color: '#3b82f6' },
                  { label: 'Üretim',                val: `${b.good_count ?? '-'} adet`,  color: '#ffffff' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center py-0.5">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-wide">{r.label}</span>
                    <span className="text-sm font-black font-mono" style={{ color: r.color }}>{r.val}</span>
                  </div>
                ))}
              </PanelCard>
            );
          })()}
        </div>

        {/* ════════════════════ RIGHT PANEL ════════════════════ */}
        <div className="lg:col-span-2 space-y-5">

          {simulationResult ? (
            <>
              {/* ── Top Summary Cards ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* OEE Delta */}
                <div className="bg-gradient-to-br from-blue-950 to-[#0d1117] border border-blue-500/40 p-6 flex flex-col justify-between">
                  <span className="text-xs font-black text-blue-400 uppercase tracking-widest block mb-3">Genel OEE İyileşimi</span>
                  <div className="flex items-center gap-4">
                    <span className="text-5xl font-black font-mono text-white">
                      %{(simulationResult.simulated.OEE * 100).toFixed(1)}
                    </span>
                    <ArrowRight className="w-5 h-5 text-white/20" />
                    <div>
                      <span className="text-xs text-white/40 font-bold block uppercase">Mevcut</span>
                      <span className="text-xl font-mono text-white/50">
                        %{(simulationResult.baseline.OEE * 100).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm font-black text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    +{((simulationResult.simulated.OEE - simulationResult.baseline.OEE) * 100).toFixed(1)} pp Kazanç
                  </div>
                </div>

                {/* Freed Time */}
                <div className="bg-[#1a2235] border border-white/15 p-6 flex flex-col justify-between">
                  <span className="text-sm font-black text-white uppercase tracking-wide block mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" /> Geri Kazanılan Süre
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black font-mono text-white">{simulationResult.freed_minutes}</span>
                    <span className="text-base font-bold text-white/70 uppercase">Dakika</span>
                  </div>
                  <p className="mt-4 text-sm text-white/60">
                    Plansız duruş azaltımının üretime geri kazandırdığı süre.
                  </p>
                </div>
              </div>

              {/* Performance cap warning */}
              {simulationResult.p_capped && (
                <div className="bg-amber-900/20 border border-amber-500/40 p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="text-sm font-black text-amber-300 uppercase block mb-1">Performans Tavanı Aşıldı</span>
                    <span className="text-sm text-amber-200/70">Seçilen hız artışı mekanik limitlere ulaştı. P bileşeni %100'de sınırlandırıldı.</span>
                  </div>
                </div>
              )}

              {/* ── Metric Cards ── */}
              <div>
                <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Karşılaştırmalı Göstergeler — Mevcut vs Simüle
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MetricComparisonCard
                    title="Kullanılabilirlik (A)"
                    baseline={simulationResult.baseline.A * 100}
                    simulated={simulationResult.simulated.A * 100}
                    accentColor="#eab308"
                    barColor="#eab308"
                    icon={Clock}
                  />
                  <MetricComparisonCard
                    title="Performans (P)"
                    baseline={simulationResult.baseline.P * 100}
                    simulated={simulationResult.simulated.P * 100}
                    accentColor="#f97316"
                    barColor="#f97316"
                    icon={Activity}
                  />
                  <MetricComparisonCard
                    title="Kalite (Q)"
                    baseline={simulationResult.baseline.Q * 100}
                    simulated={simulationResult.simulated.Q * 100}
                    accentColor="#22c55e"
                    barColor="#22c55e"
                    icon={CheckCircle2}
                  />
                  <MetricComparisonCard
                    title="OEE — Ekipman Verimliliği"
                    baseline={simulationResult.baseline.OEE * 100}
                    simulated={simulationResult.simulated.OEE * 100}
                    accentColor="#3b82f6"
                    barColor="#3b82f6"
                    icon={Gauge}
                  />
                </div>
              </div>

              {/* ── Financial ROI ── */}
              <div className="bg-[#161b22] border border-white/10 p-5">
                <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  Finansal ROI Analizi
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#1a2235] border border-white/15 p-4">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">Ekstra Gelir / Gün</span>
                    <span className="text-lg font-black font-mono text-white">{fmt(simulationResult.financial.extra_revenue)}</span>
                  </div>
                  <div className="bg-[#1a2235] border border-white/15 p-4">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">Süre Tasarrufu / Gün</span>
                    <span className="text-lg font-black font-mono text-white">{fmt(simulationResult.financial.cost_saving)}</span>
                  </div>
                  <div className="bg-[#1a2235] border border-emerald-400/30 p-4">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">Aylık Net Fayda</span>
                    <span className="text-lg font-black font-mono text-emerald-400">{fmt(simulationResult.financial.monthly_impact)}</span>
                  </div>
                  <div className="bg-emerald-900/30 border border-emerald-400/40 p-4">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">Yıllık Etki</span>
                    <span className="text-xl font-black font-mono text-emerald-300">{fmt(simulationResult.financial.annual_impact)}</span>
                  </div>
                </div>
              </div>

              {/* ── Stoppage Table ── */}
              <div className="bg-[#161b22] border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0d1117]">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase">Bu Tarihe Ait Duruş Kayıtları</h3>
                    <p className="text-xs text-white/35 mt-0.5">Simülasyonda geri kazanılan duruşlar</p>
                  </div>
                  <span className="text-sm font-black font-mono text-white/40 bg-white/5 border border-white/10 px-3 py-1">
                    {simulationResult.stoppages.length} Kayıt
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-[#0d1117] text-white/40 text-xs font-black uppercase sticky top-0 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3">Duruş Kodu</th>
                        <th className="px-4 py-3">Açıklama</th>
                        <th className="px-4 py-3 text-right">Süre</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {simulationResult.stoppages.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-4 py-8 text-center text-sm text-white/30 font-mono">
                            Bu tarihte plansız duruş kaydedilmemiştir.
                          </td>
                        </tr>
                      ) : (
                        simulationResult.stoppages.map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/3 transition-colors">
                            <td className="px-4 py-3 font-mono text-sm font-black text-orange-400">{row.stoppage_code}</td>
                            <td className="px-4 py-3 text-sm text-white/70">{row.description}</td>
                            <td className="px-4 py-3 text-right font-mono text-sm font-black text-white">
                              {Math.round(row.duration_ms / 60000)} dk
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="min-h-[420px] bg-[#161b22] border border-white/10 flex flex-col items-center justify-center text-center p-10 gap-4">
              <SlidersHorizontal className="w-14 h-14 text-white/15 animate-pulse" />
              <h4 className="text-lg font-black text-white/50 uppercase">Simülasyon Bekleniyor</h4>
              <p className="text-sm text-white/25 max-w-xs font-mono">
                Makine ve tarih seçildikten sonra simülasyon otomatik başlar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatIfAnalysis;
