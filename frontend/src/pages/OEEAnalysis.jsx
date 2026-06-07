import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Clock, Zap, Shield, BarChart2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, Cell, ReferenceLine,
} from 'recharts';

// ─── HARDCODED MOCK DATASET ───────────────────────────────────────────────────
const MACHINE_DATA = {
  'Makine 1': {
    uid: '3a1d1435-0bb7-86db-9c63-ca5b1272cbf3',
    oee: 78.4, availability: 83.2, performance: 94.3, quality: 100,
    totalDowntimeHrs: 18.7,
    plannedHrs: 480,
    unplannedStoppages: 14,
    shiftData: [
      { shift: 'Gündüz 1', oee: 82, a: 86, p: 95 },
      { shift: 'Gündüz 2', oee: 75, a: 79, p: 95 },
      { shift: 'Gece',    oee: 79, a: 84, p: 94 },
    ],
    trend: [
      { date: 'Ağu 25', OEE: 75.2, A: 79.1, P: 95.1 },
      { date: 'Eyl 25', OEE: 72.8, A: 76.3, P: 95.4 },
      { date: 'Eki 25', OEE: 80.1, A: 84.5, P: 94.8 },
      { date: 'Kas 25', OEE: 68.3, A: 72.0, P: 94.9 },
      { date: 'Ara 25', OEE: 84.2, A: 87.9, P: 95.8 },
      { date: 'Oca 26', OEE: 77.5, A: 81.4, P: 95.2 },
      { date: 'Şub 26', OEE: 81.3, A: 85.6, P: 94.9 },
      { date: 'Mar 26', OEE: 76.0, A: 80.2, P: 94.8 },
      { date: 'Nis 26', OEE: 83.8, A: 87.1, P: 96.2 },
      { date: 'May 26', OEE: 78.4, A: 83.2, P: 94.3 },
    ],
    pareto: [
      { reason: 'AIR PRESSURE FAILED',  hours: 7.2, isCritical: true },
      { reason: 'MOTOR OVERLOAD',        hours: 4.5, isCritical: true },
      { reason: 'SENSOR CALIBRATION',   hours: 3.1, isCritical: false },
      { reason: 'UNDEFINED STOPPAGE',   hours: 2.8, isUndefined: true },
      { reason: 'MATERIAL SHORTAGE',    hours: 0.9, isCritical: false },
      { reason: 'COOLANT LEAK',         hours: 0.2, isCritical: false },
    ],
    worstDays: [
      { date: '21 Oca 2026', downtime: '4 sa 25 dk', loss: '$820' },
      { date: '14 Kas 2025', downtime: '3 sa 10 dk', loss: '$590' },
      { date: '02 Mar 2026', downtime: '2 sa 45 dk', loss: '$510' },
      { date: '08 Eyl 2025', downtime: '2 sa 15 dk', loss: '$420' },
      { date: '29 Ağu 2025', downtime: '1 sa 55 dk', loss: '$360' },
    ],
  },
  'Makine 2': {
    uid: '3a1d1435-0afb-41a7-2d12-5eb77c185258',
    oee: 71.9, availability: 76.4, performance: 94.1, quality: 100,
    totalDowntimeHrs: 24.3,
    plannedHrs: 480,
    unplannedStoppages: 19,
    shiftData: [
      { shift: 'Gündüz 1', oee: 74, a: 78, p: 95 },
      { shift: 'Gündüz 2', oee: 69, a: 74, p: 93 },
      { shift: 'Gece',    oee: 72, a: 77, p: 94 },
    ],
    trend: [
      { date: 'Ağu 25', OEE: 68.4, A: 72.6, P: 94.2 },
      { date: 'Eyl 25', OEE: 65.1, A: 69.0, P: 94.4 },
      { date: 'Eki 25', OEE: 73.2, A: 77.8, P: 94.1 },
      { date: 'Kas 25', OEE: 60.9, A: 64.7, P: 94.1 },
      { date: 'Ara 25', OEE: 77.0, A: 81.9, P: 94.0 },
      { date: 'Oca 26', OEE: 70.2, A: 74.5, P: 94.2 },
      { date: 'Şub 26', OEE: 74.5, A: 79.1, P: 94.2 },
      { date: 'Mar 26', OEE: 69.8, A: 74.2, P: 94.1 },
      { date: 'Nis 26', OEE: 76.3, A: 81.0, P: 94.2 },
      { date: 'May 26', OEE: 71.9, A: 76.4, P: 94.1 },
    ],
    pareto: [
      { reason: 'Z AXIS ERROR',         hours: 9.1, isCritical: true },
      { reason: 'UNDEFINED STOPPAGE',   hours: 6.2, isUndefined: true },
      { reason: 'AIR PRESSURE FAILED',  hours: 4.0, isCritical: true },
      { reason: 'SENSOR CALIBRATION',   hours: 3.1, isCritical: false },
      { reason: 'DOOR INTERLOCK',       hours: 1.9, isCritical: false },
    ],
    worstDays: [
      { date: '21 Oca 2026', downtime: '5 sa 10 dk', loss: '$960' },
      { date: '11 Kas 2025', downtime: '4 sa 00 dk', loss: '$740' },
      { date: '25 Şub 2026', downtime: '3 sa 30 dk', loss: '$650' },
      { date: '18 Eyl 2025', downtime: '2 sa 50 dk', loss: '$520' },
      { date: '07 Ara 2025', downtime: '2 sa 05 dk', loss: '$380' },
    ],
  },
  'Makine 3': {
    uid: '3a1d8054-94bd-747d-0e30-05d4ca302199',
    oee: 85.6, availability: 90.1, performance: 95.0, quality: 100,
    totalDowntimeHrs: 11.4,
    plannedHrs: 480,
    unplannedStoppages: 8,
    shiftData: [
      { shift: 'Gündüz 1', oee: 88, a: 92, p: 96 },
      { shift: 'Gündüz 2', oee: 83, a: 88, p: 94 },
      { shift: 'Gece',    oee: 86, a: 90, p: 96 },
    ],
    trend: [
      { date: 'Ağu 25', OEE: 82.1, A: 86.4, P: 95.0 },
      { date: 'Eyl 25', OEE: 79.8, A: 84.0, P: 95.0 },
      { date: 'Eki 25', OEE: 87.3, A: 91.9, P: 95.0 },
      { date: 'Kas 25', OEE: 76.4, A: 80.4, P: 95.0 },
      { date: 'Ara 25', OEE: 89.1, A: 93.8, P: 95.0 },
      { date: 'Oca 26', OEE: 83.7, A: 88.1, P: 95.0 },
      { date: 'Şub 26', OEE: 87.2, A: 91.8, P: 95.0 },
      { date: 'Mar 26', OEE: 81.9, A: 86.2, P: 95.0 },
      { date: 'Nis 26', OEE: 88.4, A: 93.0, P: 95.0 },
      { date: 'May 26', OEE: 85.6, A: 90.1, P: 95.0 },
    ],
    pareto: [
      { reason: 'HYDRAULIC PRESSURE',   hours: 4.3, isCritical: true },
      { reason: 'UNDEFINED STOPPAGE',   hours: 3.5, isUndefined: true },
      { reason: 'COOLANT LEAK',         hours: 2.1, isCritical: false },
      { reason: 'SENSOR CALIBRATION',   hours: 1.5, isCritical: false },
    ],
    worstDays: [
      { date: '25 Şub 2026', downtime: '3 sa 40 dk', loss: '$680' },
      { date: '05 Eki 2025', downtime: '2 sa 20 dk', loss: '$430' },
      { date: '14 Oca 2026', downtime: '1 sa 55 dk', loss: '$360' },
      { date: '22 Ara 2025', downtime: '1 sa 30 dk', loss: '$280' },
      { date: '10 Ağu 2025', downtime: '1 sa 10 dk', loss: '$210' },
    ],
  },
  'Makine 4': {
    uid: '3a1debd9-c20c-53ca-b094-d32a1e422887',
    oee: 66.2, availability: 70.5, performance: 93.9, quality: 100,
    totalDowntimeHrs: 33.6,
    plannedHrs: 480,
    unplannedStoppages: 26,
    shiftData: [
      { shift: 'Gündüz 1', oee: 69, a: 73, p: 94 },
      { shift: 'Gündüz 2', oee: 63, a: 67, p: 94 },
      { shift: 'Gece',    oee: 66, a: 71, p: 93 },
    ],
    trend: [
      { date: 'Ağu 25', OEE: 63.2, A: 67.3, P: 93.9 },
      { date: 'Eyl 25', OEE: 59.8, A: 63.7, P: 93.9 },
      { date: 'Eki 25', OEE: 67.4, A: 71.8, P: 93.9 },
      { date: 'Kas 25', OEE: 55.0, A: 58.6, P: 93.9 },
      { date: 'Ara 25', OEE: 71.1, A: 75.7, P: 93.9 },
      { date: 'Oca 26', OEE: 64.5, A: 68.7, P: 93.9 },
      { date: 'Şub 26', OEE: 68.2, A: 72.6, P: 93.9 },
      { date: 'Mar 26', OEE: 63.0, A: 67.1, P: 93.9 },
      { date: 'Nis 26', OEE: 70.1, A: 74.6, P: 93.9 },
      { date: 'May 26', OEE: 66.2, A: 70.5, P: 93.9 },
    ],
    pareto: [
      { reason: 'UNDEFINED STOPPAGE',   hours: 12.5, isUndefined: true },
      { reason: 'MOTOR OVERLOAD',        hours: 8.3, isCritical: true },
      { reason: 'AIR PRESSURE FAILED',  hours: 6.1, isCritical: true },
      { reason: 'MATERIAL SHORTAGE',    hours: 4.2, isCritical: false },
      { reason: 'DOOR INTERLOCK',       hours: 2.5, isCritical: false },
    ],
    worstDays: [
      { date: '08 Kas 2025', downtime: '7 sa 15 dk', loss: '$1,340' },
      { date: '21 Oca 2026', downtime: '5 sa 50 dk', loss: '$1,080' },
      { date: '17 Mar 2026', downtime: '4 sa 10 dk', loss: '$770' },
      { date: '03 Eyl 2025', downtime: '3 sa 30 dk', loss: '$650' },
      { date: '29 Ara 2025', downtime: '2 sa 40 dk', loss: '$490' },
    ],
  },
  'Makine 5': {
    uid: '3a1debd9-412d-74b3-b3f9-832a50f89a94',
    oee: 80.1, availability: 84.7, performance: 94.6, quality: 100,
    totalDowntimeHrs: 17.0,
    plannedHrs: 480,
    unplannedStoppages: 12,
    shiftData: [
      { shift: 'Gündüz 1', oee: 83, a: 87, p: 95 },
      { shift: 'Gündüz 2', oee: 77, a: 81, p: 95 },
      { shift: 'Gece',    oee: 80, a: 85, p: 94 },
    ],
    trend: [
      { date: 'Ağu 25', OEE: 77.2, A: 81.5, P: 94.7 },
      { date: 'Eyl 25', OEE: 74.1, A: 78.3, P: 94.6 },
      { date: 'Eki 25', OEE: 81.9, A: 86.5, P: 94.7 },
      { date: 'Kas 25', OEE: 70.5, A: 74.5, P: 94.6 },
      { date: 'Ara 25', OEE: 85.3, A: 90.1, P: 94.7 },
      { date: 'Oca 26', OEE: 79.0, A: 83.4, P: 94.7 },
      { date: 'Şub 26', OEE: 82.6, A: 87.2, P: 94.7 },
      { date: 'Mar 26', OEE: 77.8, A: 82.2, P: 94.6 },
      { date: 'Nis 26', OEE: 84.5, A: 89.3, P: 94.6 },
      { date: 'May 26', OEE: 80.1, A: 84.7, P: 94.6 },
    ],
    pareto: [
      { reason: 'VOLTAJ DALGALANMASI',  hours: 5.8, isCritical: true },
      { reason: 'PALET SIKIŞ',          hours: 4.1, isCritical: true },
      { reason: 'UNDEFINED STOPPAGE',   hours: 3.9, isUndefined: true },
      { reason: 'SENSOR CALIBRATION',   hours: 2.1, isCritical: false },
      { reason: 'MATERIAL SHORTAGE',    hours: 1.1, isCritical: false },
    ],
    worstDays: [
      { date: '12 Oca 2026', downtime: '3 sa 35 dk', loss: '$660' },
      { date: '25 Şub 2026', downtime: '2 sa 55 dk', loss: '$540' },
      { date: '07 Kas 2025', downtime: '2 sa 10 dk', loss: '$400' },
      { date: '18 Ağu 2025', downtime: '1 sa 50 dk', loss: '$340' },
      { date: '02 Nis 2026', downtime: '1 sa 20 dk', loss: '$250' },
    ],
  },
  'Makine 6': {
    uid: '3a1debed-c5e4-2f15-1576-2551d5f4bcbf',
    oee: 73.5, availability: 78.0, performance: 94.2, quality: 100,
    totalDowntimeHrs: 22.0,
    plannedHrs: 480,
    unplannedStoppages: 17,
    shiftData: [
      { shift: 'Gündüz 1', oee: 76, a: 80, p: 95 },
      { shift: 'Gündüz 2', oee: 70, a: 75, p: 93 },
      { shift: 'Gece',    oee: 74, a: 79, p: 94 },
    ],
    trend: [
      { date: 'Ağu 25', OEE: 70.5, A: 74.8, P: 94.2 },
      { date: 'Eyl 25', OEE: 67.2, A: 71.4, P: 94.1 },
      { date: 'Eki 25', OEE: 75.3, A: 79.9, P: 94.2 },
      { date: 'Kas 25', OEE: 63.0, A: 66.9, P: 94.2 },
      { date: 'Ara 25', OEE: 78.8, A: 83.7, P: 94.2 },
      { date: 'Oca 26', OEE: 72.2, A: 76.6, P: 94.2 },
      { date: 'Şub 26', OEE: 75.7, A: 80.4, P: 94.1 },
      { date: 'Mar 26', OEE: 71.0, A: 75.4, P: 94.2 },
      { date: 'Nis 26', OEE: 77.2, A: 82.0, P: 94.2 },
      { date: 'May 26', OEE: 73.5, A: 78.0, P: 94.2 },
    ],
    pareto: [
      { reason: 'UNDEFINED STOPPAGE',   hours: 8.1, isUndefined: true },
      { reason: 'SENSOR CALIBRATION',   hours: 5.8, isCritical: false },
      { reason: 'MOTOR OVERLOAD',        hours: 4.3, isCritical: true },
      { reason: 'DOOR INTERLOCK',       hours: 2.4, isCritical: false },
      { reason: 'COOLANT LEAK',         hours: 1.4, isCritical: false },
    ],
    worstDays: [
      { date: '14 Kas 2025', downtime: '4 sa 50 dk', loss: '$895' },
      { date: '02 Oca 2026', downtime: '3 sa 40 dk', loss: '$680' },
      { date: '19 Mar 2026', downtime: '2 sa 55 dk', loss: '$540' },
      { date: '28 Ağu 2025', downtime: '2 sa 20 dk', loss: '$430' },
      { date: '11 Şub 2026', downtime: '1 sa 45 dk', loss: '$320' },
    ],
  },
  'TurboCut 400': {
    uid: '3a1bd958-3763-b086-5e4a-1a4d1755b0e9',
    oee: 61.8, availability: 66.0, performance: 93.6, quality: 100,
    totalDowntimeHrs: 41.4,
    plannedHrs: 480,
    unplannedStoppages: 31,
    shiftData: [
      { shift: 'Gündüz 1', oee: 65, a: 69, p: 94 },
      { shift: 'Gündüz 2', oee: 58, a: 62, p: 94 },
      { shift: 'Gece',    oee: 62, a: 67, p: 93 },
    ],
    trend: [
      { date: 'Ağu 25', OEE: 58.3, A: 62.3, P: 93.6 },
      { date: 'Eyl 25', OEE: 54.9, A: 58.7, P: 93.5 },
      { date: 'Eki 25', OEE: 62.5, A: 66.8, P: 93.6 },
      { date: 'Kas 25', OEE: 49.2, A: 52.6, P: 93.5 },
      { date: 'Ara 25', OEE: 66.8, A: 71.4, P: 93.6 },
      { date: 'Oca 26', OEE: 59.2, A: 63.2, P: 93.6 },
      { date: 'Şub 26', OEE: 63.5, A: 67.9, P: 93.6 },
      { date: 'Mar 26', OEE: 57.5, A: 61.5, P: 93.5 },
      { date: 'Nis 26', OEE: 65.4, A: 69.9, P: 93.6 },
      { date: 'May 26', OEE: 61.8, A: 66.0, P: 93.6 },
    ],
    pareto: [
      { reason: 'KONVEYÖR TIKANMA',     hours: 16.2, isCritical: true },
      { reason: 'UNDEFINED STOPPAGE',   hours: 11.5, isUndefined: true },
      { reason: 'AIR PRESSURE FAILED',  hours: 6.8, isCritical: true },
      { reason: 'MOTOR OVERLOAD',        hours: 4.3, isCritical: true },
      { reason: 'SENSOR CALIBRATION',   hours: 2.6, isCritical: false },
    ],
    worstDays: [
      { date: '21 Oca 2026', downtime: '8 sa 20 dk', loss: '$1,540' },
      { date: '04 Kas 2025', downtime: '6 sa 45 dk', loss: '$1,250' },
      { date: '16 Mar 2026', downtime: '5 sa 30 dk', loss: '$1,020' },
      { date: '29 Ara 2025', downtime: '4 sa 05 dk', loss: '$755' },
      { date: '11 Eyl 2025', downtime: '3 sa 10 dk', loss: '$585' },
    ],
  },
};

const MACHINE_LIST = Object.keys(MACHINE_DATA);
const WORLD_CLASS_OEE = 85;

// ─── CIRCULAR GAUGE ────────────────────────────────────────────────────────────
const CircularGauge = ({ value, label, size = 160, strokeWidth = 14, color, isLarge = false }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1e293b" strokeWidth={strokeWidth} fill="transparent" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          strokeLinecap="butt"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center inset-0">
        <span className={`${isLarge ? 'text-4xl' : 'text-2xl'} font-black font-mono text-white`}>
          {value.toFixed(1)}<span className="text-sm text-gray-400">%</span>
        </span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</span>
      </div>
    </div>
  );
};

// ─── KPI CARD ──────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, color, delta }) => (
  <div className="bg-[#161b22] border border-white/10 rounded-lg p-4 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded ${color} bg-opacity-15`}>
          <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      </div>
      {delta !== undefined && (
        <span className={`flex items-center gap-0.5 text-[11px] font-bold ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(delta)}%
        </span>
      )}
    </div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-black text-white font-mono">{value}</span>
      {sub && <span className="text-xs text-gray-500 mb-0.5">{sub}</span>}
    </div>
  </div>
);

// ─── CUSTOM TOOLTIP ────────────────────────────────────────────────────────────
const ParetoTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (d.isUndefined) {
    return (
      <div className="bg-gray-900 border-2 border-yellow-500 p-3 rounded shadow-xl max-w-[260px]">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-bold text-xs uppercase">Tanımsız Duruş</span>
        </div>
        <p className="text-gray-300 text-xs leading-relaxed">
          Operatör duruş nedeni panelden seçmemiştir. Dijital form entegrasyonu önerilmektedir.
        </p>
        <div className="mt-2 text-right font-mono text-yellow-400 font-bold text-sm">{d.hours} Saat</div>
      </div>
    );
  }
  return (
    <div className="bg-[#1a2235] border border-white/20 p-3 rounded shadow-xl">
      <p className="text-gray-300 text-xs font-semibold mb-1">{label}</p>
      <p className="text-white font-mono font-bold">{payload[0].value} Saat</p>
    </div>
  );
};

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2235] border border-white/20 p-3 rounded shadow-xl text-xs">
      <p className="text-gray-400 font-semibold mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="text-white font-mono font-bold">{p.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

// ─── SHIFT BAR CHART ───────────────────────────────────────────────────────────
const ShiftTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2235] border border-white/20 p-3 rounded shadow-xl text-xs">
      <p className="text-gray-400 font-semibold mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="text-white font-mono font-bold">{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
const OEEAnalysis = () => {
  const [selectedMachine, setSelectedMachine] = useState('Makine 1');
  const data = MACHINE_DATA[selectedMachine];

  const oeeColor = data.oee >= WORLD_CLASS_OEE ? '#22c55e' : data.oee >= 75 ? '#eab308' : '#ef4444';
  const aColor   = data.availability >= 90 ? '#22c55e' : data.availability >= 78 ? '#eab308' : '#ef4444';
  const pColor   = '#f97316';

  const efficiencyLoss = (100 - data.oee).toFixed(1);
  const oeeVsPrev = useMemo(() => {
    const len = data.trend.length;
    if (len < 2) return 0;
    return parseFloat((data.trend[len - 1].OEE - data.trend[len - 2].OEE).toFixed(1));
  }, [data]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
  };

  return (
    <motion.div
      className="p-6 h-full overflow-y-auto bg-[#0d1117] text-white min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">OEE Analizi</h1>
          <p className="text-sm text-gray-400 mt-1">Genel Ekipman Verimliliği — Ağu 2025 – May 2026</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 bg-[#161b22] text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Dünya Standardı OEE Eşiği: <span className="text-green-400 font-bold ml-1">{WORLD_CLASS_OEE}%</span>
        </div>
      </motion.div>

      {/* ── MACHINE SELECTOR ─────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="bg-[#161b22] border border-white/10 rounded-lg p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Makine / Hat Seçimi
          </label>
          <select
            id="oee-machine-select"
            value={selectedMachine}
            onChange={e => setSelectedMachine(e.target.value)}
            className="w-full md:w-72 bg-[#0d1117] border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            {MACHINE_LIST.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="md:border-l md:border-white/10 md:pl-6 flex flex-col gap-1">
          <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-widest">Birim UID</span>
          <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">{data.uid}</span>
        </div>
      </motion.div>

      {/* ── KPI CARDS ────────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={BarChart2} label="Toplam OEE" value={`${data.oee}%`} color="bg-blue-500" delta={oeeVsPrev} />
        <KpiCard icon={Clock} label="Toplam Duruş" value={`${data.totalDowntimeHrs} sa`} sub={`${data.unplannedStoppages} olay`} color="bg-red-500" />
        <KpiCard icon={Zap} label="Verimlilik Kaybı" value={`${efficiencyLoss}%`} sub="hedeften sapma" color="bg-yellow-500" />
        <KpiCard icon={Shield} label="Kalite (Q)" value="100%" sub="hurda takibi yok" color="bg-green-500" />
      </motion.div>

      {/* ── GAUGES ROW ───────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">

        {/* OEE Gauge */}
        <div className="bg-[#161b22] border border-white/10 rounded-lg p-6 flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <Activity className="w-full h-full text-blue-500" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Birleşik OEE</p>
          <CircularGauge value={data.oee} label="OEE" size={200} strokeWidth={18} color={oeeColor} isLarge />
          <div className="mt-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${data.oee >= WORLD_CLASS_OEE ? 'bg-green-500' : 'bg-yellow-400'}`} />
            <span className="text-xs text-gray-400">
              {data.oee >= WORLD_CLASS_OEE ? 'Dünya Standardı ✓' : `Hedefe ${(WORLD_CLASS_OEE - data.oee).toFixed(1)}% eksik`}
            </span>
          </div>
        </div>

        {/* A, P, Q Gauges */}
        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* A */}
          <div className="bg-[#161b22] border border-white/10 rounded-lg p-5 flex flex-col items-center justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Availability (A)</p>
            <CircularGauge value={data.availability} label="Kullanılabilirlik" size={140} strokeWidth={13} color={aColor} />
            <p className="text-[11px] text-gray-500 text-center">
              Planlanan sürenin <span className="text-white font-semibold">{data.availability}%</span>'inde makine üretimde
            </p>
          </div>
          {/* P */}
          <div className="bg-[#161b22] border border-white/10 rounded-lg p-5 flex flex-col items-center justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Performance (P)</p>
            <CircularGauge value={data.performance} label="Performans" size={140} strokeWidth={13} color={pColor} />
            <p className="text-[11px] text-gray-500 text-center">
              Teorik kapasiteye göre <span className="text-white font-semibold">{data.performance}%</span> hız
            </p>
          </div>
          {/* Q */}
          <div className="bg-[#161b22] border border-green-500/20 rounded-lg p-5 flex flex-col items-center justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Quality (Q)</p>
            <CircularGauge value={100} label="Kalite" size={140} strokeWidth={13} color="#22c55e" />
            <div className="w-full bg-green-900/20 border border-green-500/30 rounded px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <p className="text-[11px] text-green-400 font-semibold uppercase">Q = 100% — Hurda Takibi Aktif Değil</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── TREND CHART + WORST DAYS ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

        {/* Trend chart */}
        <div className="xl:col-span-2 bg-[#161b22] border border-white/10 rounded-lg p-5 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            OEE / A / P Trendi — Son 10 Ay
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[45, 100]} stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={v => `${v}%`} />
                <RechartsTooltip content={<TrendTooltip />} />
                <ReferenceLine y={WORLD_CLASS_OEE} stroke="#22c55e" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: 'Hedef', position: 'right', fill: '#22c55e', fontSize: 10 }} />
                <Legend iconType="square" wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                <Line type="monotone" dataKey="OEE" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="A" name="Availability" stroke="#eab308" strokeWidth={2} dot={{ r: 3, fill: '#eab308', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="P" name="Performance" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Worst Days */}
        <div className="xl:col-span-1 bg-[#161b22] border border-white/10 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">En Kötü Günler</h3>
            <p className="text-[10px] text-gray-600 mt-0.5 uppercase">Plansız duruşa göre sıralı</p>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0d1117] text-gray-500 text-[10px] uppercase sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Tarih</th>
                  <th className="px-4 py-2 text-right font-semibold">Duruş</th>
                  <th className="px-4 py-2 text-right font-semibold">Kayıp</th>
                </tr>
              </thead>
              <tbody>
                {data.worstDays.map((row, idx) => (
                  <tr key={idx} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-300">{row.date}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-orange-400 font-bold">{row.downtime}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-red-400 font-bold">{row.loss}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ── SHIFT PERFORMANCE + PARETO ───────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Shift grouped bar */}
        <div className="xl:col-span-2 bg-[#161b22] border border-white/10 rounded-lg p-5 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            Vardiya Performansı
          </h3>
          <div className="flex-1 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.shiftData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="shift" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[50, 100]} stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <RechartsTooltip content={<ShiftTooltip />} />
                <Legend iconType="square" wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                <ReferenceLine y={WORLD_CLASS_OEE} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1.5} />
                <Bar dataKey="oee" name="OEE" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={18} />
                <Bar dataKey="a"   name="A" fill="#eab308"  radius={[3, 3, 0, 0]} barSize={18} />
                <Bar dataKey="p"   name="P" fill="#f97316"  radius={[3, 3, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pareto */}
        <div className="xl:col-span-3 bg-[#161b22] border border-white/10 rounded-lg p-5 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            Plansız Duruş Kategorileri (Saat)
          </h3>
          <div className="flex-1 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pareto} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <pattern id="stripe-yellow" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="8" height="8" fill="#eab308" />
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#0d1117" strokeWidth="4" />
                  </pattern>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="reason" type="category" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} width={160} />
                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ParetoTooltip />} />
                <Bar dataKey="hours" name="Saat" radius={[0, 4, 4, 0]} barSize={22}>
                  {data.pareto.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.isUndefined ? 'url(#stripe-yellow)' : entry.isCritical ? '#ef4444' : '#6b7280'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <div className="w-3 h-3 rounded-sm bg-red-500" /> Kritik Arıza
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <div className="w-3 h-3 rounded-sm bg-gray-500" /> Diğer Duruş
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <div className="w-3 h-3 rounded-sm" style={{ background: 'repeating-linear-gradient(45deg, #eab308, #eab308 2px, #0d1117 2px, #0d1117 6px)' }} />
              Tanımsız Duruş
            </div>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};

export default OEEAnalysis;
