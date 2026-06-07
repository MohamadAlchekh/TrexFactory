import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import useStore from '../store/useStore';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

const machines = [
  { id: 'm1', name: 'Makine 1', uid: '3a1d1435-0bb7-86db-9c63-ca5b1272cbf3' },
  { id: 'm2', name: 'Makine 2', uid: '4b2e2546-1cc8-97ec-0d74-db6c2383dcf4' },
  { id: 'm3', name: 'Makine 3', uid: '5c3f3657-2dd9-08fd-1e85-ec7d3494ed05' },
  { id: 'm4', name: 'Makine 4', uid: '6d404768-3eea-19ge-2f96-fd8e4505fe16' },
  { id: 'm5', name: 'Makine 5', uid: '7e515879-4ffb-2ahf-3g07-ge9f5616gf27' },
  { id: 'm6', name: 'Makine 6', uid: '8f626980-5ggc-3big-4h18-hf0g6727hg38' },
  { id: 'm7', name: 'Makine 7', uid: '9g737a91-6hhd-4cjh-5i29-ig1h7838ih49' },
  { id: 'm8', name: 'Makine 8', uid: '0h848ba2-7iie-5dki-6j3a-jh2i8949ji5a' },
  { id: 'm9', name: 'Makine 9', uid: '1i959cb3-8jjf-6elj-7k4b-ki3j9050kj6b' },
  { id: 'm10', name: 'Makine 10', uid: '2j060dc4-9kkg-7fmk-8l5c-lj4k0161lk7c' },
  { id: 't400', name: 'TurboCut 400', uid: 'tc400-8899-xyz-1234' }
];

const timeSeriesData = [
  { date: 'Ağu 25', OEE: 0.82, A: 0.85, P: 0.96 },
  { date: 'Eyl 25', OEE: 0.79, A: 0.81, P: 0.98 },
  { date: 'Eki 25', OEE: 0.85, A: 0.88, P: 0.97 },
  { date: 'Kas 25', OEE: 0.74, A: 0.76, P: 0.97 },
  { date: 'Ara 25', OEE: 0.88, A: 0.92, P: 0.96 },
  { date: 'Oca 26', OEE: 0.81, A: 0.83, P: 0.98 },
  { date: 'Şub 26', OEE: 0.86, A: 0.89, P: 0.97 },
  { date: 'Mar 26', OEE: 0.80, A: 0.84, P: 0.95 },
  { date: 'Nis 26', OEE: 0.89, A: 0.91, P: 0.98 },
  { date: 'May 26', OEE: 0.85, A: 0.87, P: 0.98 },
];

const worstDaysData = [
  { date: '14 Kas 2025', downtime: '6 sa 45 dk', loss: '$1,200' },
  { date: '02 Mar 2026', downtime: '5 sa 30 dk', loss: '$950' },
  { date: '21 Eyl 2025', downtime: '4 sa 15 dk', loss: '$780' },
  { date: '08 Oca 2026', downtime: '3 sa 50 dk', loss: '$610' },
  { date: '29 Ağu 2025', downtime: '3 sa 10 dk', loss: '$450' },
  { date: '11 Şub 2026', downtime: '2 sa 45 dk', loss: '$390' },
  { date: '05 Eki 2025', downtime: '2 sa 20 dk', loss: '$310' },
  { date: '19 Ara 2025', downtime: '1 sa 55 dk', loss: '$240' },
  { date: '27 Nis 2026', downtime: '1 sa 30 dk', loss: '$180' },
  { date: '15 May 2026', downtime: '1 sa 10 dk', loss: '$120' },
];

const downtimeCategories = [
  { reason: 'AIR PRESSURE FAILED', hours: 45.5, isCritical: true },
  { reason: 'UNDEFINED STOPPAGE (Tanımsız Duruş)', hours: 32.0, isUndefined: true },
  { reason: 'SENSOR CALIBRATION', hours: 22.0, isCritical: false },
  { reason: 'MOTOR OVERLOAD', hours: 14.5, isCritical: false },
  { reason: 'MATERIAL SHORTAGE', hours: 8.5, isCritical: false },
  { reason: 'COOLANT LEAK', hours: 5.0, isCritical: false },
];

const CircularProgress = ({ value, label, size = 160, strokeWidth = 14, colorClass, isLarge = false }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
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
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="square"
          className={colorClass}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center inset-0">
        <span className={`${isLarge ? 'text-4xl' : 'text-2xl'} font-black font-mono text-gray-900 dark:text-white`}>
          {Math.round(value)}<span className="text-sm text-gray-500">%</span>
        </span>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{label}</span>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.isUndefined) {
      return (
        <div className="bg-gray-900 border-2 border-yellow-500 p-4 rounded-none shadow-[0_0_15px_rgba(234,179,8,0.3)] max-w-xs z-50 relative">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span className="text-yellow-500 font-bold uppercase tracking-wider text-xs">Tanımsız Duruş</span>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed text-justify">
            DİKKAT: Bu duruşlar makine kaynaklı değil, operatörün panelden duruş nedenini seçmemesinden kaynaklı veri kaybıdır. Üretim sürecine acilen dijital form entegrasyonu (operatör zorunlu seçimi) önerilmektedir.
          </p>
          <div className="mt-3 text-right">
            <span className="font-mono text-yellow-500 font-bold">{data.hours} Saat</span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-none z-50 relative">
        <p className="text-gray-300 text-xs font-bold mb-1">{label}</p>
        <p className="text-white text-sm font-mono font-bold">{payload[0].value} Saat</p>
      </div>
    );
  }
  return null;
};

const OEEAnalysis = () => {
  const oeeData = useStore(state => state.oeeData);
  
  // Use real backend oeeData for machine list — fallback to hardcoded machines if empty
  const machineList = React.useMemo(() => {
    if (oeeData && oeeData.length > 0) {
      return oeeData.map((m, i) => ({ id: `m${i}`, name: m.machineId, uid: m.unit_uid }));
    }
    return machines;
  }, [oeeData]);

  const [selectedMachineId, setSelectedMachineId] = useState(machineList[0]?.id || 'm0');
  
  // currentMetrics from real backend oeeData
  const currentMetrics = React.useMemo(() => {
    if (!oeeData || oeeData.length === 0) return { OEE: 0, A: 0, P: 0, Q: 100 };
    const selectedName = machineList.find(m => m.id === selectedMachineId)?.name;
    const match = oeeData.find(m => m.machineId === selectedName);
    if (match) {
      return {
        OEE: match.OEE,
        A: match.A,
        P: match.P,
        Q: match.Q
      };
    }
    return { OEE: oeeData[0].OEE, A: oeeData[0].A, P: oeeData[0].P, Q: oeeData[0].Q };
  }, [oeeData, selectedMachineId, machineList]);

  const selectedMachine = machineList.find(m => m.id === selectedMachineId) || machineList[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="p-6 h-full overflow-y-auto custom-scrollbar"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-sans text-gray-900 dark:text-white uppercase tracking-tight">OEE Baseline Dashboard</h2>
        <p className="text-sm font-mono text-gray-500 dark:text-dark-muted">Genel Ekipman Verimliliği Analizi</p>
      </div>

      {/* Machine Selector */}
      <motion.div variants={itemVariants} className="mb-10 bg-white dark:bg-dark-surface p-5 border border-gray-200 dark:border-dark-border rounded-none shadow-sm flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Makine / Hat Seçimi</label>
          <select 
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="w-full md:w-64 bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-none focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
          >
            {machineList.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col border-t md:border-t-0 md:border-l border-gray-200 dark:border-dark-border pt-4 md:pt-0 md:pl-6">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Seçili Birim UID</span>
          <span className="font-mono text-sm text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-dark-bg px-3 py-1 border border-gray-200 dark:border-gray-800">
            {selectedMachine.uid}
          </span>
        </div>
      </motion.div>

      {/* Gauges Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        
        {/* OEE Gauge (Largest) */}
        <div className="bg-white dark:bg-dark-surface border border-blue-200 dark:border-blue-900/30 p-8 rounded-none shadow-sm flex flex-col items-center justify-center col-span-1 h-full min-h-[300px]">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-6 text-center">Birleşik OEE</h3>
          <CircularProgress 
            value={currentMetrics.OEE} 
            label="OEE" 
            size={220} 
            strokeWidth={18} 
            colorClass="text-blue-500" 
            isLarge={true} 
          />
        </div>

        {/* APQ Gauges */}
        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          
          {/* Availability */}
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-6 rounded-none shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-4 text-center">Availability (A)</h3>
            <CircularProgress 
              value={currentMetrics.A} 
              label="Kullanılabilirlik" 
              size={140} 
              strokeWidth={12} 
              colorClass="text-yellow-500" 
            />
          </div>

          {/* Performance */}
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-6 rounded-none shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-4 text-center">Performance (P)</h3>
            <CircularProgress 
              value={currentMetrics.P} 
              label="Performans" 
              size={140} 
              strokeWidth={12} 
              colorClass="text-orange-500" 
            />
          </div>

          {/* Quality */}
          <div className="bg-white dark:bg-dark-surface border border-green-200 dark:border-green-900/30 p-6 rounded-none shadow-sm flex flex-col items-center justify-center relative">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-4 text-center flex flex-col items-center">
              Quality (Q)
              <span className="text-[9px] text-gray-400 mt-1 lowercase tracking-normal">(Simüle Edilmiş Sabit Değer)</span>
            </h3>
            <CircularProgress 
              value={currentMetrics.Q} 
              label="Kalite" 
              size={140} 
              strokeWidth={12} 
              colorClass="text-green-500" 
            />
            
            {/* IMPORTANT WARNING */}
            <div className="mt-6 w-full">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-500/50 px-3 py-2 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-green-800 dark:text-green-400 uppercase leading-snug">
                  Q = 100% <br/>(Hurda Takibi Aktif Değil)
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </motion.div>

      {/* BOTTOM ROW: Time Series & Worst Days */}
      <motion.div variants={itemVariants} className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left: Time Series Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-5 rounded-none shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase mb-4">OEE, A ve P Trendi (Ağu 2025 - May 2026)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                <XAxis dataKey="date" stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 1]} tickCount={6} stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#fff', borderRadius: '0px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="square" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="OEE" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="A" name="Availability (A)" stroke="#EAB308" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="P" name="Performance (P)" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Worst Days Table */}
        <div className="xl:col-span-1 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-0 rounded-none shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase">En Kötü Günler</h3>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Plansız Duruşa Göre Sıralı</p>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-dark-bg text-gray-500 dark:text-gray-400 text-xs uppercase sticky top-0">
                <tr>
                  <th className="px-4 py-2 font-bold">Tarih</th>
                  <th className="px-4 py-2 font-bold text-right">Duruş</th>
                  <th className="px-4 py-2 font-bold text-right">Kayıp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {worstDaysData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors group">
                    <td className="px-4 py-2 font-mono text-gray-800 dark:text-gray-200">{row.date}</td>
                    <td className="px-4 py-2 text-right font-mono text-orange-600 dark:text-orange-400 font-bold">{row.downtime}</td>
                    <td className="px-4 py-2 text-right font-mono text-red-600 dark:text-red-400 font-bold group-hover:text-red-500">{row.loss}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </motion.div>

      {/* VERY BOTTOM ROW: Unplanned Downtime Categories (Pareto) */}
      <motion.div variants={itemVariants} className="mt-6 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-5 rounded-none shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase mb-4">Plansız Duruş Kategorileri (Saat)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={downtimeCategories} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <defs>
                <pattern id="pattern-striped" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="8" height="8" fill="#EAB308" />
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#111827" strokeWidth="4" />
                </pattern>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" horizontal={false} />
              <XAxis type="number" stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="reason" type="category" stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} width={140} />
              <RechartsTooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={<CustomTooltip />}
              />
              <Bar dataKey="hours" name="Toplam Duruş (Saat)" radius={[0, 4, 4, 0]} barSize={24}>
                {downtimeCategories.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isUndefined ? 'url(#pattern-striped)' : (entry.isCritical ? '#EF4444' : '#6B7280')} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

    </motion.div>
  );
};

export default OEEAnalysis;
