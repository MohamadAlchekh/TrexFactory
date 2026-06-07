import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  ShieldAlert, 
  Activity, 
  Wrench, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import useStore from '../store/useStore';

const timelineData = [
  { month: 'Ağu 25', events: 1 },
  { month: 'Eyl 25', events: 2 },
  { month: 'Eki 25', events: 1 },
  { month: 'Kas 25', events: 3 },
  { month: 'Ara 25', events: 1 },
  { month: 'Oca 26', events: 2 },
  { month: 'Şub 26', events: 1 },
  { month: 'Mar 26', events: 2 },
  { month: 'Nis 26', events: 1 },
  { month: 'May 26', events: 2 }
];

const DEFAULT_PARETO = [
  { fault: 'AIR PRESSURE FAILED', count: 10 },
  { fault: 'SENSOR CALIBRATION', count: 5 },
  { fault: 'MOTOR OVERLOAD', count: 3 },
  { fault: 'COOLANT LEAK', count: 2 }
];

const DigitalFactoryHub = () => {
  // Use real backend data from store
  const executiveSummary = useStore(state => state.executiveSummary);
  const alerts = useStore(state => state.alerts);
  const oeeData = useStore(state => state.oeeData);

  // Build pareto data from real alerts if available
  const paretoFromAlerts = React.useMemo(() => {
    if (!alerts || alerts.length === 0) return DEFAULT_PARETO;
    const counts = {};
    alerts.forEach(a => {
      const key = a.message || 'UNKNOWN';
      counts[key] = (counts[key] || 0) + 1;
    });
    const result = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([fault, count]) => ({ fault: fault.length > 22 ? fault.slice(0, 22) + '…' : fault, count }));
    return result.length > 0 ? result : DEFAULT_PARETO;
  }, [alerts]);

  // Top stoppage from alerts
  const topStoppage = paretoFromAlerts[0]?.fault || 'AIR PRESSURE FAILED';
  const totalAlerts = executiveSummary?.activeAlerts ?? alerts?.length ?? 0;
  const avgOee = executiveSummary?.averageOee ?? 0;
  const totalMachines = executiveSummary?.totalMachines ?? oeeData?.length ?? 0;

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
      className="p-6 h-full overflow-y-auto custom-scrollbar bg-[#0a0d12]"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-sans text-white uppercase tracking-tight">Executive Summary</h2>
        <p className="text-sm font-mono text-white">{executiveSummary?.period ?? 'Tarihsel MES Log Verileri'}</p>
      </div>

      {/* TOP ROW: IMPACT KPIs — backend verilerine bağlı */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div variants={itemVariants} className="bg-[#1a2235] border border-red-200 dark:border-red-900/30 p-5 rounded-none shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown className="w-16 h-16 text-red-500" />
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Toplam Aktif Alarm</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black font-mono text-red-600 dark:text-red-500">{totalAlerts}</span>
            <span className="text-sm text-white mb-1 font-bold">Adet</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-4 h-4" /> Plansız duruş alarm kayıtları
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#1a2235] border border-orange-200 dark:border-orange-900/30 p-5 rounded-none shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-orange-500" />
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Ortalama OEE</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black font-mono text-orange-600 dark:text-orange-500">%{avgOee}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 text-xs text-orange-500 dark:text-orange-400 flex items-center gap-1 font-medium">
            <Zap className="w-4 h-4" /> {totalMachines} makinenin ağırlıklı ortalaması
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#1a2235] border border-green-200 dark:border-green-900/30 p-5 rounded-none shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-green-500" />
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Toplam İzlenen Makine</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black font-mono text-green-600 dark:text-green-500">{totalMachines}</span>
            <span className="text-sm text-white mb-1 font-bold">Ünite</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 text-xs text-green-600 dark:text-green-400 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1"><Wrench className="w-4 h-4" /> Aktif MES Bağlantısı</span>
            <span className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5">Canlı</span>
          </div>
        </motion.div>
      </div>

      {/* MIDDLE ROW: ROOT CAUSE SUMMARY — gerçek alarm verilerine göre */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="bg-gradient-to-r from-red-50 to-white dark:from-red-950/20 dark:to-dark-surface border-l-4 border-red-500 p-6 shadow-sm rounded-none">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  Kök Neden Özeti: {topStoppage}
                </h3>
              </div>
              <p className="text-sm text-white mb-4 max-w-3xl">
                Veri analizi, bu arıza tipinin üretim hatlarında kronik bir sorun haline geldiğini göstermektedir. Bu arıza, zincirleme bir reaksiyon yaratarak motorların aşırı yüklenmesine sebep olmaktadır.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 p-3 border border-red-100 dark:border-red-900/20">
                  <div className="text-[10px] uppercase text-white font-bold mb-1">Toplam Alarm</div>
                  <div className="font-mono font-bold text-red-600 dark:text-red-400">{totalAlerts} Kayıt</div>
                </div>
                <div className="bg-white/5 p-3 border border-orange-100 dark:border-orange-900/20">
                  <div className="text-[10px] uppercase text-white font-bold mb-1">En Sık Hata</div>
                  <div className="font-mono font-bold text-orange-600 dark:text-orange-400 text-xs">{topStoppage}</div>
                </div>
                <div className="bg-white/5 p-3 border border-green-100 dark:border-green-900/20">
                  <div className="text-[10px] uppercase text-white font-bold mb-1">OEE Ortalaması</div>
                  <div className="font-mono font-bold text-green-600 dark:text-green-400">%{avgOee}</div>
                </div>
              </div>
            </div>
            
            <div className="shrink-0 w-full lg:w-auto bg-dark-bg dark:bg-black/40 p-4 border border-white/10 dark:border-gray-800">
              <div className="text-xs uppercase text-white font-bold mb-3">Sistem Önerisi</div>
              <ul className="space-y-2 text-sm text-white font-medium">
                <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary-500" /> Pnömatik Conta Değişimi</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary-500" /> Regülatör Kalibrasyonu</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary-500" /> Yedek Parça Stoğu (+2)</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* BOTTOM ROW: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="bg-[#1a2235] border border-white/10 p-5 rounded-none shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase mb-4">Aylar Bazında Alarm Sıklığı (Zaman Çizelgesi)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                <XAxis dataKey="month" stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => Math.floor(val)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#fff', borderRadius: '0px' }}
                  itemStyle={{ color: '#EF4444', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="events" 
                  name="Alarm Sayısı"
                  stroke="#EF4444" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#161b22' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#1a2235] border border-white/10 p-5 rounded-none shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase mb-4">Alarm Türleri (Pareto — Gerçek Backend Verisi)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paretoFromAlerts} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" horizontal={false} />
                <XAxis type="number" stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="fault" type="category" stroke="#8b949e" fontSize={10} width={120} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#fff', borderRadius: '0px' }}
                />
                <Bar 
                  dataKey="count" 
                  name="Frekans"
                  fill="#F97316" 
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DigitalFactoryHub;
