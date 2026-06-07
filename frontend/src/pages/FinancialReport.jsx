import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckSquare, Square, TrendingUp, AlertCircle, BarChart3, LineChart as LineChartIcon, Activity, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ReferenceLine, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const allScenarios = [
  { id: 'S0', name: 'Baseline (Mevcut Durum)', a: 82.5, p: 78.4, q: 100.0, oee: 64.6, deltaOee: 0.0, brutFayda: 0, roi: 0, amortisman: 0 },
  { id: 'S1', name: 'S1: Pnömatik Valf Revizyonu', a: 86.0, p: 79.0, q: 100.0, oee: 67.9, deltaOee: 3.3, brutFayda: 14500, roi: 145, amortisman: 180 },
  { id: 'S2', name: 'S2: Ana Motor Değişimi', a: 88.5, p: 85.0, q: 100.0, oee: 75.2, deltaOee: 10.6, brutFayda: 42000, roi: 85, amortisman: 420 },
  { id: 'S3', name: 'S3: AI Destekli Kestirimci Bakım', a: 85.0, p: 82.0, q: 100.0, oee: 69.7, deltaOee: 5.1, brutFayda: 21000, roi: 320, amortisman: 45 },
  { id: 'S4', name: 'S4: Tam Ekipman Yenileme', a: 95.0, p: 92.0, q: 100.0, oee: 87.4, deltaOee: 22.8, brutFayda: 95000, roi: 45, amortisman: 730 },
];

const breakevenData = Array.from({ length: 24 }, (_, i) => {
  const month = i + 1;
  const days = month * 30;
  return {
    days,
    S0: 0,
    S1: (14500 / 12) * month - 10000,
    S2: (42000 / 12) * month - 50000,
    S3: (21000 / 12) * month - 6500,
    S4: (95000 / 12) * month - 210000,
  };
});

const FinancialReport = () => {
  const [selectedIds, setSelectedIds] = useState(['S0', 'S1', 'S3']);

  const toggleScenario = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedData = allScenarios.filter(s => selectedIds.includes(s.id));

  const maxValues = {
    a: Math.max(...selectedData.map(d => d.a)),
    p: Math.max(...selectedData.map(d => d.p)),
    q: Math.max(...selectedData.map(d => d.q)),
    oee: Math.max(...selectedData.map(d => d.oee)),
    deltaOee: Math.max(...selectedData.map(d => d.deltaOee)),
    brutFayda: Math.max(...selectedData.map(d => d.brutFayda)),
    roi: Math.max(...selectedData.map(d => d.roi)),
  };
  const minAmortisman = Math.min(...selectedData.filter(d => d.id !== 'S0').map(d => d.amortisman));

  const handleExportCSV = () => {
    const headers = ['Senaryo', 'A(%)', 'P(%)', 'Q(%)', 'OEE(%)', 'Delta OEE(%)', 'Brüt Fayda($)', 'ROI(%)', 'Amortisman(Gün)'];
    const rows = selectedData.map(d => [
      d.name, d.a, d.p, d.q, d.oee, d.deltaOee, d.brutFayda, d.roi, d.amortisman
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'finansal_rapor.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Logo / Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('TREX CLOUD - YONETIM KURULU KARARI', 14, 24);
    
    // Date & Ref
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    const dateStr = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
    const refId = `TR-INV-${Date.now().toString().slice(-4)}`;
    doc.text(`Tarih: ${dateStr}   |   Karar Ref No: ${refId}`, 14, 32);
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, 45, 196, 45);
    
    // Section 1: Karar Ozeti
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('YONETIM KURULU KARAR OZETI', 14, 55);
    
    // Colored callout box for the Decision Text
    doc.setFillColor(240, 253, 244); // light green bg
    doc.setDrawColor(187, 247, 208); // green border
    doc.rect(14, 60, 182, 35, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61); // dark green text
    
    const decisionText = "Makine 1, 2 ve 5 icin toplam $2,400 yatirim ile ortak havalandirma regulatoru alinmasi durumunda, tesis genelinde yillik OEE artisi +%2.88, Toplam Net Fayda: $9,600/yil olacaktir. Bu kapsamda ilgili yatirimin yapilmasina, CAPEX butcesinden karsilanmasina ve aksiyonun hizlica baslatilmasina karar verilmistir.";
    const splitDecisionText = doc.splitTextToSize(decisionText, 174);
    doc.text(splitDecisionText, 18, 70);
    
    // Section 2: Yatirim Degerlendirme ve Ozet Tablo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('YATIRIM ANALIZI VE FINANSAL KAZANCLAR', 14, 110);
    
    autoTable(doc, {
      startY: 115,
      head: [['Metrik', 'Deger', 'Aciklama']],
      body: [
        ['Yatirim Tutari (CAPEX)', '$2,400', 'Makine 1, 2 ve 5 ortak havalandirma regulatoru maliyeti'],
        ['Yillik Net Kazanc (OPEX)', '$9,600 / yil', 'OEE artisi kaynakli ek uretim marji ve durus tasarrufu'],
        ['OEE Artis Hedefi', '+%2.88', 'Tesis geneli ortalama OEE verimlilik artisi'],
        ['Yatirim Geri Donus Suresi', '3 Ay', 'Amortisman ve ROI hesabi dogrultusunda basabas suresi'],
        ['Onaylanan Ekipmanlar', 'Makine 1, 2, 5', 'Risk altindaki pnomatik ekipmanlarin revizyonu']
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      bodyStyles: { textColor: [50, 50, 50], fontSize: 9 },
      margin: { left: 14 }
    });
    
    let currentY = doc.lastAutoTable.finalY + 15;
    
    // Section 3: Karsilastirmali Senaryolar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('AKTIF FINANSAL SENARYOLAR TABLOSU', 14, currentY);
    
    const tableBody = selectedData.map(d => [
      d.name,
      `${d.a.toFixed(1)}%`,
      `${d.p.toFixed(1)}%`,
      `${d.q.toFixed(1)}%`,
      `${d.oee.toFixed(1)}%`,
      `+$${new Intl.NumberFormat('en-US').format(d.brutFayda)}`,
      d.id === 'S0' ? '-' : `${d.amortisman} Gun`
    ]);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Senaryo', 'A (%)', 'P (%)', 'Q (%)', 'OEE (%)', 'Brut Fayda', 'Amortisman']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14 }
    });
    
    currentY = doc.lastAutoTable.finalY + 25;
    
    // Imza Bolumu
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('ONAY VE YURURLUK', 14, currentY - 5);
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, currentY, 80, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Teknik Servis Yoneticisi\n(Imza)', 14, currentY + 5);
    
    doc.line(130, currentY, 196, currentY);
    doc.text('Yonetim Kurulu Baskani\n(Onay / Imza)', 130, currentY + 5);
    
    doc.save(`Yonetim_Kurulu_Karar_Ozeti_${refId}.pdf`);
  };

  // Stacked Bar Data for Waterfall Concept
  const waterfallData = selectedData.map(d => ({
    name: d.id,
    A: d.a * 0.33,
    P: d.p * 0.33,
    Q: d.q * 0.33,
    total: d.oee
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 h-full overflow-y-auto custom-scrollbar"
    >
      {/* HEADER & RECOMMENDATION CARD */}
      <motion.div variants={itemVariants} className="flex flex-col xl:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Finansal Senaryo Raporu</h1>
          <p className="text-sm font-mono text-gray-500 dark:text-dark-muted mt-1">CAPEX / OPEX Yatırım Getirisi ve Başabaş (Breakeven) Analizi</p>
        </div>
        
        <div className="flex-1 max-w-3xl bg-[#0d1117] border border-gray-600 dark:border-gray-500 p-5 flex flex-col md:flex-row items-start md:items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="flex items-start gap-4 z-10 w-full">
            <div className="bg-gray-800 p-2 mt-1 shrink-0">
              <CheckSquare className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Yönetim Kurulu Karar Özeti</h3>
                <span className="text-[10px] font-mono text-gray-400">REF: TR-INV-{Date.now().toString().slice(-4)}</span>
              </div>
              <p className="text-[13px] text-emerald-400 font-mono leading-relaxed bg-emerald-950/30 p-3 border border-emerald-900/50">
                Makine 1, 2 ve 5 için toplam $2,400 yatırım ile ortak havalandırma regülatörü alınması durumunda, tesis genelinde yıllık OEE artışı +%2.88, Toplam Net Fayda: $9,600/yıl olacaktır.
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 md:ml-6 shrink-0 z-10 flex flex-col gap-2 w-full md:w-auto">
            <button className="w-full flex justify-center items-center gap-2 px-6 py-2 bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-emerald-500 transition-colors shadow-md">
              <CheckSquare className="w-4 h-4" /> Onayla
            </button>
            <button onClick={handleExportPDF} className="w-full flex justify-center items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wider transition-colors shadow-md">
              <FileText className="w-4 h-4" /> PDF İNDİR
            </button>
            <button onClick={handleExportCSV} className="w-full flex justify-center items-center gap-2 px-6 py-2 bg-gray-200 text-black font-bold text-[10px] uppercase tracking-wider hover:bg-white transition-colors shadow-md">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
      </motion.div>

      {/* SCENARIO SELECTORS */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface p-4 border border-gray-200 dark:border-dark-border mb-6 shadow-sm">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Senaryo Seçimi</h3>
        <div className="flex flex-wrap gap-4">
          {allScenarios.map(scen => {
            const isSelected = selectedIds.includes(scen.id);
            return (
              <button 
                key={scen.id}
                onClick={() => toggleScenario(scen.id)}
                className={`flex items-center gap-2 px-3 py-2 border text-sm font-bold transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                    : 'border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span className="uppercase">{scen.id}</span>
                <span className="font-mono text-xs opacity-70 ml-1 hidden sm:inline-block">({scen.name.split(':')[1] || 'Baseline'})</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* DATA TABLE */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border mb-6 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
            <tr>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-dark-border">Senaryo</th>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-dark-border text-right">A (%)</th>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-dark-border text-right">P (%)</th>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-dark-border text-right">
                Q (%) <br/><span className="text-[8px] opacity-70 lowercase font-normal">(Simüle Edilmiş Sabit Değer)</span>
              </th>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-dark-border text-right bg-blue-50/50 dark:bg-blue-900/10">OEE (%)</th>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-dark-border text-right">Delta OEE</th>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-dark-border text-right">Brüt Fayda ($)</th>
              <th className="px-4 py-3 border-b border-gray-200 dark:border-dark-border text-right">Amortisman</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
            {selectedData.map((d) => (
              <tr key={d.id} className={`${d.id === 'S0' ? 'bg-gray-100 dark:bg-gray-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${d.id === 'S0' ? 'bg-gray-400' : 'bg-blue-500'}`}></span>
                    {d.name}
                  </div>
                </td>
                <td className={`px-4 py-3 text-right font-mono ${d.a === maxValues.a && d.id !== 'S0' ? 'text-green-500 font-black' : 'text-gray-600 dark:text-gray-400'}`}>{d.a.toFixed(1)}</td>
                <td className={`px-4 py-3 text-right font-mono ${d.p === maxValues.p && d.id !== 'S0' ? 'text-green-500 font-black' : 'text-gray-600 dark:text-gray-400'}`}>{d.p.toFixed(1)}</td>
                <td className={`px-4 py-3 text-right font-mono ${d.q === maxValues.q && d.id !== 'S0' ? 'text-green-500 font-black' : 'text-gray-600 dark:text-gray-400'}`}>{d.q.toFixed(1)}</td>
                <td className={`px-4 py-3 text-right font-mono bg-blue-50/50 dark:bg-blue-900/10 ${d.oee === maxValues.oee && d.id !== 'S0' ? 'text-green-500 font-black text-base' : 'text-gray-900 dark:text-white font-bold'}`}>{d.oee.toFixed(1)}</td>
                <td className={`px-4 py-3 text-right font-mono ${d.deltaOee === maxValues.deltaOee && d.id !== 'S0' ? 'text-green-500 font-black' : 'text-gray-600 dark:text-gray-400'}`}>+{d.deltaOee.toFixed(1)}</td>
                <td className={`px-4 py-3 text-right font-mono ${d.brutFayda === maxValues.brutFayda && d.id !== 'S0' ? 'text-green-500 font-black' : 'text-gray-600 dark:text-gray-400'}`}>${new Intl.NumberFormat('en-US').format(d.brutFayda)}</td>
                <td className={`px-4 py-3 text-right font-mono ${d.amortisman === minAmortisman && d.id !== 'S0' ? 'text-green-500 font-black' : 'text-gray-600 dark:text-gray-400'}`}>{d.id === 'S0' ? '-' : `${d.amortisman} Gün`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* OEE Waterfall (Stacked Bar) */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface p-6 border border-gray-200 dark:border-dark-border shadow-sm flex flex-col h-[350px]">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" /> A-P-Q Katkı (OEE) Dağılımı
          </h3>
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#30363d" opacity={0.3} />
                <XAxis dataKey="name" stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="A" stackId="a" fill="#3B82F6" name="Availability" />
                <Bar dataKey="P" stackId="a" fill="#F59E0B" name="Performance" />
                <Bar dataKey="Q" stackId="a" fill="#10B981" name="Quality" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ROI Comparison (Radar) */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface p-6 border border-gray-200 dark:border-dark-border shadow-sm flex flex-col h-[350px]">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-500" /> ROI ve Etki Karşılaştırması
          </h3>
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius="70%" data={selectedData.filter(d => d.id !== 'S0').map(d => ({ name: d.id, ROI: d.roi, 'Delta OEE': d.deltaOee * 5 }))}>
                <PolarGrid stroke="#30363d" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#8b949e', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Radar name="ROI (%)" dataKey="ROI" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                <Radar name="Delta OEE (Ölçekli)" dataKey="Delta OEE" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Breakeven Chart */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark-surface p-6 border border-gray-200 dark:border-dark-border shadow-sm flex flex-col h-[350px]">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase mb-4 flex items-center gap-2">
            <LineChartIcon className="w-4 h-4 text-orange-500" /> Başabaş (Breakeven) Noktası
          </h3>
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-widest">Zaman: 720 Gün (24 Ay)</p>
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={breakevenData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#30363d" opacity={0.3} />
                <XAxis dataKey="days" stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}G`} />
                <YAxis stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  labelFormatter={(val) => `${val} Gün`}
                  formatter={(val) => [`$${Math.round(val)}`, 'Net Nakit Akışı']}
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#fff' }} 
                />
                <ReferenceLine y={0} stroke="#EF4444" strokeWidth={1} />
                
                {selectedIds.includes('S1') && <Line type="monotone" dataKey="S1" stroke="#3B82F6" strokeWidth={2} dot={false} />}
                {selectedIds.includes('S2') && <Line type="monotone" dataKey="S2" stroke="#F97316" strokeWidth={2} dot={false} />}
                {selectedIds.includes('S3') && <Line type="monotone" dataKey="S3" stroke="#10B981" strokeWidth={2} dot={false} />}
                {selectedIds.includes('S4') && <Line type="monotone" dataKey="S4" stroke="#8B5CF6" strokeWidth={2} dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default FinancialReport;
