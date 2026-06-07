import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from 'recharts';
import { Bell, ArrowDownRight, Printer, Download, Monitor, Calendar, AlertOctagon, Activity, CheckCircle2, ArrowRight, ArrowDown, Search, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useStore from '../store/useStore';

const pathLoadData = [
  { time: '14:10:00', load: 85 },
  { time: '14:12:00', load: 88 },
  { time: '14:15:00', load: 86 },
  { time: '14:18:00', load: 92 },
  { time: '14:20:00', load: 95 },
  { time: '14:22:00', load: 98 },
  { time: '14:24:00', load: 99 },
  { time: '14:25:00', load: 105 },
  { time: '14:25:50', load: 120 },
  { time: '14:26:00', load: 0 },
  { time: '14:28:00', load: 0 },
  { time: '14:30:00', load: 0 },
];

const timelineEvents = [
  { id: 1, time: '14:15:20', type: 'cascade', message: 'Sensör Kalibrasyon Sapması (Minor)' },
  { id: 2, time: '14:20:10', type: 'cascade', message: 'Hava Basıncı Düşüş Eğilimi' },
  { id: 3, time: '14:24:05', type: 'cascade', message: 'Motor Akım Yükü %99 Kritik Sınır' },
  { id: 4, time: '14:25:50', type: 'alarm', message: 'MOTOR OVERLOAD!' },
  { id: 5, time: '14:25:51', type: 'alarm', message: 'Hattın Otomatik Durdurulması (Safety Lock)' }
];

const paretoData = [
  { name: 'AIR PRESSURE FAILED', count: 42, color: '#EF4444' },
  { name: 'MOTOR OVERLOAD', count: 28, color: '#F97316' },
  { name: 'Z AXIS ERROR', count: 15, color: '#6B7280' },
  { name: 'DOOR INTERLOCK', count: 8, color: '#6B7280' },
  { name: 'SPINDLE TEMP', count: 4, color: '#6B7280' }
];

const hypotheses = [
  { id: 1, title: 'Yetersiz Yağlama / Pnömatik Sızıntı', proof: 'Basınç düşüş logları doğruluyor', confidence: 85 },
  { id: 2, title: 'Eski Takım Ucu Aşınması', proof: 'Tork artışı kısmen eşleşiyor', confidence: 62 },
  { id: 3, title: 'Şebeke Voltaj Dalgalanması', proof: 'Kanıt Yok', confidence: 15 }
];

const RCA = () => {
  const { alerts, oeeData } = useStore();
  const selectedAlert = alerts[0] || { id: 'ALT-001', machineId: 'Makine 1', message: 'MOTOR OVERLOAD!', timestamp: '2026-01-21T14:25:50.000Z', type: 'critical' };

  const machineList = React.useMemo(() => {
    if (oeeData && oeeData.length > 0) {
      return oeeData.map((m, i) => ({ id: `m${i}`, name: m.machineId, uid: m.unit_uid }));
    }
    return [
      { id: 'm1', name: 'Makine 1', uid: '3a1d1435-0bb7-86db-9c63-ca5b1272cbf3' },
      { id: 'm2', name: 'Makine 2', uid: '4b2e2546-1cc8-97ec-0d74-da6c2383dc04' },
    ];
  }, [oeeData]);

  const [selectedMachineId, setSelectedMachineId] = useState('m1');
  const selectedMachine = React.useMemo(() => {
    return machineList.find(m => m.id === selectedMachineId) || machineList[0];
  }, [machineList, selectedMachineId]);

  const [startDate, setStartDate] = useState("2026-01-21");
  const [endDate, setEndDate] = useState("2026-01-21");
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildLogs, setRebuildLogs] = useState([]);
  const [isRebuilt, setIsRebuilt] = useState(false);

  const hasData = React.useMemo(() => {
    return startDate !== "" && /^\d{4}-\d{2}-\d{2}$/.test(startDate);
  }, [startDate]);

  const filteredParetoData = React.useMemo(() => {
    if (!hasData) {
      return paretoData.map(item => ({ ...item, count: 0 }));
    }
    // Generate deterministic values based on selected dates
    const seed = (startDate + endDate).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return paretoData.map((item, index) => {
      const multiplier = 0.4 + ((seed * (index + 2)) % 100) / 90;
      return {
        ...item,
        count: Math.max(1, Math.round(item.count * multiplier))
      };
    });
  }, [startDate, endDate, hasData]);

  const filteredTimelineEvents = React.useMemo(() => {
    if (!hasData) return [];
    return timelineEvents.map(event => ({
      ...event,
      time: `${startDate} ${event.time}`
    }));
  }, [startDate, hasData]);

  const shiftStats = React.useMemo(() => {
    if (!hasData) {
      return {
        stoppage: 0,
        counter: 0,
        oee: "0.0",
        loss: "0.0"
      };
    }
    // Generate deterministic values based on selected dates to simulate DB records
    const seed = (startDate + endDate).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const stoppage = 8 + (seed % 15); // 8 to 22
    const counter = 2500 + ((seed * 23) % 4500); // 2500 to 7000
    const oeeVal = 65 + (seed % 20) + (seed % 10) / 10; // 65% to 85.9%
    const lossVal = 100 - oeeVal;
    return {
      stoppage,
      counter: new Intl.NumberFormat('tr-TR').format(counter),
      oee: oeeVal.toFixed(1),
      loss: lossVal.toFixed(1)
    };
  }, [startDate, endDate, hasData]);

  const filteredPathLoadData = React.useMemo(() => {
    const times = ['14:10:00', '14:12:00', '14:15:00', '14:18:00', '14:20:00', '14:22:00', '14:24:00', '14:25:50', '14:26:00', '14:28:00', '14:30:00'];
    if (!hasData) {
      return times.map(t => ({ time: t, load: 0 }));
    }
    const seed = startDate.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseLoads = [85, 88, 86, 92, 95, 98, 99, 120, 0, 0, 0];

    return times.map((t, idx) => {
      const baseLoad = baseLoads[idx];
      let load = baseLoad;
      if (baseLoad > 0 && baseLoad < 120) {
        // Add a small shift based on seed and index
        const fluctuation = ((seed * (idx + 1)) % 15) - 7; // -7 to +7
        load = Math.max(10, Math.min(115, baseLoad + fluctuation));
      }
      return {
        time: t,
        load: load
      };
    });
  }, [startDate, hasData]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('TREX CLOUD - TEKNIK SERVIS RAPORU', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Rapor Tarihi: ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`, 14, 30);
    doc.text(`Rapor No: RCA-${selectedAlert.id}-${Date.now().toString().slice(-4)}`, 14, 35);

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, 40, 196, 40);

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Ariza/Durus Bilgileri', 14, 50);

    autoTable(doc, {
      startY: 55,
      head: [['Parametre', 'Deger']],
      body: [
        ['Makine / Hat', selectedAlert.machineId],
        ['Alarm Kodu', selectedAlert.id],
        ['Hata Mesaji', selectedAlert.message],
        ['Zaman Damgasi', new Date(selectedAlert.timestamp).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })],
        ['Kritiklik Seviyesi', selectedAlert.type.toUpperCase()]
      ],
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14 }
    });

    const currentY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('2. Kok Neden Analizi (AI Teshisi)', 14, currentY);

    doc.setFontSize(10);
    doc.setTextColor(70);
    const splitText = doc.splitTextToSize("Sensor telemetrisi, basinc dususunun kritik alarm esiginden yaklasik 4 dakika once ivme kazandigini gostermektedir. Titresim verilerindeki artislar mekanik bir strese isaret etmektedir. Olasilikla Pnomatik valf contasi yirtilmasi veya kacak mevcut.", 180);
    doc.text(splitText, 14, currentY + 10);

    const actionY = currentY + 10 + (splitText.length * 5) + 10;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('3. Onerilen Aksiyon', 14, actionY);

    doc.setFontSize(10);
    doc.setTextColor(70);
    doc.text(`- Ilgili makine (${selectedAlert.machineId}) hattan alinip bakima alinmali.\n- Pnomatik valf contalari kontrol edilmeli ve gerekirse degistirilmeli.\n- Ariza onlenerek tahmini %+4.2 OEE geri kazanimi hedeflenmelidir.`, 14, actionY + 10);

    doc.setLineWidth(0.2);
    doc.line(14, 270, 70, 270);
    doc.text('Teknik Servis Uzmani', 20, 275);
    doc.line(140, 270, 196, 270);
    doc.text('Onaylayan Yonetici', 148, 275);

  };

  const handleRebuildShift = () => {
    setIsRebuilding(true);
    setIsRebuilt(false);
    setRebuildLogs([]);

    let logs = [];
    if (hasData) {
      logs = [
        `[SORGULAMA] ${startDate} ile ${endDate} aralığındaki 'stoppage_slice' kayıtları veritabanından çekiliyor...`,
        `[SORGULAMA] ${startDate} ile ${endDate} aralığındaki 'counter_slice' kayıtları veritabanından çekiliyor...`,
        `[HESAPLAMA] Zaman aralığı analizi yapılıyor...`,
        `[İŞLEME] Shift verisi sıfırdan inşa ediliyor...`,
        `[TAMAMLANDI] ${startDate} - ${endDate} dönemine ait shift verisi başarıyla sıfırdan inşa edildi ve istatistiklere yansıtıldı!`
      ];
    } else {
      logs = [
        `[SORGULAMA] ${startDate} ile ${endDate} aralığındaki 'stoppage_slice' kayıtları veritabanından çekiliyor...`,
        `[UYARI] Girilen zaman aralığında 'stoppage_slice' kaydı bulunamadı (0 adet).`,
        `[SORGULAMA] ${startDate} ile ${endDate} aralığındaki 'counter_slice' kayıtları veritabanından çekiliyor...`,
        `[UYARI] Girilen zaman aralığında 'counter_slice' kaydı bulunamadı (0 adet).`,
        `[HATA] Seçilen tarih aralığında veritabanında ('stoppage_slice' veya 'counter_slice') aktif kayıt bulunamadı!`,
        `[BİLGİ] Lütfen geçerli veri tarihlerini deneyin (2026-01-12, 2026-01-21 veya 2026-02-25).`
      ];
    }

    // Simulate printing logs step-by-step
    logs.forEach((log, index) => {
      setTimeout(() => {
        setRebuildLogs(prev => [...prev, log]);
        if (index === logs.length - 1) {
          setIsRebuilding(false);
          setIsRebuilt(true);
        }
      }, (index + 1) * 600);
    });
  };

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
      className="p-6 h-full overflow-y-auto custom-scrollbar relative"
    >
      {/* NATIVE PRINT TEMPLATE (HIDDEN ON SCREEN) */}
      <div className="hidden print:block absolute inset-0 bg-white text-black p-8 z-50">
        {/* Keeping original print structure intact for PDF native printing */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-black p-2">
              <Activity className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">trexCloud</h1>
              <div className="text-xs font-bold tracking-widest uppercase">Analytics Platform</div>
            </div>
          </div>
          <div className="text-right flex flex-col gap-1 text-xs text-black">
            <div className="font-bold text-lg mb-2 uppercase border-b border-black pb-1 inline-block ml-auto">Teknik Servis Raporu</div>
            <div><span className="font-bold">Evrak No:</span> RCA-PRINT-{Date.now().toString().slice(-4)}</div>
            <div><span className="font-bold">Tarih/Saat:</span> {new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}</div>
          </div>
        </div>
        <div className="mb-6">
          <h2 className="bg-gray-200 text-black font-bold uppercase py-1 px-2 border border-black mb-2">1. Genel Bilgiler</h2>
          <table className="w-full text-sm border-collapse border border-black">
            <tbody>
              <tr>
                <td className="border border-black py-1 px-2 font-bold bg-white/5 w-1/4">Makine / Hat</td>
                <td className="border border-black py-1 px-2 font-mono">{selectedMachine?.name || "Makine 1"}</td>
              </tr>
              <tr>
                <td className="border border-black py-1 px-2 font-bold bg-white/5">Hata Mesajı</td>
                <td className="border border-black py-1 px-2 font-bold text-black uppercase">MOTOR OVERLOAD!</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <h2 className="bg-gray-200 text-black font-bold uppercase py-1 px-2 border border-black mb-2">2. Çapraz Makine Etki Analizi (Fleet Impact)</h2>
          <table className="w-full text-sm border-collapse border border-black text-center">
            <thead>
              <tr className="bg-white/5">
                <th className="border border-black py-1 px-2">Etkilenen Makine</th>
                <th className="border border-black py-1 px-2">Durum Özeti</th>
                <th className="border border-black py-1 px-2">Sistemik Risk</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black py-1 px-2 font-bold text-red-700">Makine 2</td>
                <td className="border border-black py-1 px-2 font-mono">Benzer Basınç Düşüşü Tespit Edildi (%85 Eşleşme)</td>
                <td className="border border-black py-1 px-2 font-bold uppercase text-orange-700" rowSpan="2">Ortak Pnömatik Hatta Kaçak İhtimali</td>
              </tr>
              <tr>
                <td className="border border-black py-1 px-2 font-bold text-green-700">Makine 5</td>
                <td className="border border-black py-1 px-2 font-mono">Normal Değerler</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <h2 className="bg-gray-200 text-black font-bold uppercase py-1 px-2 border border-black mb-2">3. Yönetim Kurulu Karar Özeti</h2>
          <div className="border border-black p-4 font-mono text-sm leading-relaxed text-justify bg-[#1a2235]">
            Makine 1, 2 ve 5 için toplam $2,400 yatırım ile ortak havalandırma regülatörü alınması durumunda, tesis genelinde yıllık OEE artışı +%2.88, Toplam Net Fayda: $9,600/yıl olacaktır.
          </div>
          <div className="mt-16 flex justify-between px-10">
            <div className="text-center">
              <div className="border-b border-black w-40 mb-1"></div>
              <div className="font-bold text-xs uppercase">Teknik Sorumlu Onayı</div>
            </div>
            <div className="text-center">
              <div className="border-b border-black w-40 mb-1"></div>
              <div className="font-bold text-xs uppercase">Yönetim Kurulu Onayı</div>
            </div>
          </div>
        </div>
      </div>

      <div className="print:hidden">
        {/* HEADER / TOP MENU */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold font-sans text-white uppercase tracking-tight">Platin RCA Zaman Çizelgesi</h2>
            <p className="text-sm font-mono text-white">Kök Neden ve Kaskad Analizi</p>
          </div>

          <div className="flex gap-2">
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-1.5 bg-[#1a2235] border border-white/10 rounded-none text-sm font-bold text-white text-white hover:bg-[#1a2235] dark:hover:bg-dark-bg transition-colors">
              <Printer className="w-4 h-4 text-white" /> Yazdır
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-3 py-1.5 bg-[#1a2235] border border-white/10 rounded-none text-sm font-bold text-white text-white hover:bg-[#1a2235] dark:hover:bg-dark-bg transition-colors">
              <Download className="w-4 h-4 text-blue-500" /> PDF İndir
            </button>
          </div>
        </motion.div>

        {/* SELECTOR MENU */}
        <motion.div variants={itemVariants} className="bg-[#1a2235] p-4 border border-white/10 rounded-none shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-white tracking-wider flex items-center gap-1"><Monitor className="w-3 h-3" /> Makine</label>
            <select
              value={selectedMachineId}
              onChange={e => setSelectedMachineId(e.target.value)}
              className="w-full bg-[#1a2235] border border-gray-300 dark:border-gray-700 text-sm p-2 outline-none text-white font-medium rounded-none"
            >
              {machineList.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-white tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" /> Başlangıç Tarihi</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-[#1a2235] border border-gray-300 dark:border-gray-700 text-sm p-2 outline-none text-white font-medium rounded-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-white tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" /> Bitiş Tarihi</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-[#1a2235] border border-gray-300 dark:border-gray-700 text-sm p-2 outline-none text-white font-medium rounded-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-white tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" /> Olay Tarihi</label>
            <select className="w-full bg-[#1a2235] border border-gray-300 dark:border-gray-700 text-sm p-2 outline-none text-white font-medium rounded-none">
              <option>{startDate} 14:25:50</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-white tracking-wider flex items-center gap-1"><AlertOctagon className="w-3 h-3" /> Alarm/Olay</label>
            <select className="w-full bg-[#1a2235] border border-red-300 dark:border-red-900/50 text-sm p-2 outline-none text-red-600 dark:text-red-400 font-bold rounded-none">
              <option>MOTOR OVERLOAD!</option>
            </select>
          </div>
        </motion.div>

        {/* DATABASE SHIFT REBUILDER MODULE */}
        <motion.div variants={itemVariants} className="bg-[#1a2235] border border-blue-500/30 p-5 mb-6 rounded-none relative overflow-hidden font-mono text-xs shadow-lg">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] uppercase font-bold px-3 py-1">
            DB ENGINE v2.4
          </div>
          <h3 className="text-sm font-bold text-blue-400 uppercase mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 animate-pulse" /> Shift Verisi Sıfırdan İnşa Motoru
          </h3>
          <p className="text-white mb-4 font-sans leading-relaxed text-left">
            İlgili zaman aralığındaki tüm <span className="text-yellow-400 font-bold">stoppage_slice</span> ve <span className="text-yellow-400 font-bold">counter_slice</span> olaylarını veritabanından çekerek seçilen dönemin shift verisini sıfırdan inşa edin.
          </p>

          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <div className="flex-1 bg-black/80 border border-gray-800 p-4 h-36 overflow-y-auto custom-scrollbar flex flex-col gap-1 text-green-400 font-mono">
              {rebuildLogs.length === 0 ? (
                <span className="text-white text-left">&gt; Hazır. Başlatmak için sağdaki butona tıklayın...</span>
              ) : (
                rebuildLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 text-left">
                    <span className="text-blue-500">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))
              )}
              {isRebuilding && (
                <div className="flex gap-1 items-center text-blue-400 mt-1">
                  <span className="animate-pulse">_</span>
                </div>
              )}
            </div>

            <div className="md:w-64 shrink-0 flex flex-col justify-between border border-gray-800 bg-gray-900/50 p-4">
              <div className="space-y-2">
                <div className="text-[10px] text-white uppercase font-bold text-left">Aktif Zaman Dilimi</div>
                <div className="text-white text-xs font-bold font-mono bg-black/50 p-2 border border-gray-800 text-left">
                  {startDate} / {endDate}
                </div>
              </div>

              <button
                onClick={handleRebuildShift}
                disabled={isRebuilding}
                className={`w-full py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-all duration-300 rounded-none shadow-md mt-4 ${isRebuilding
                    ? 'bg-gray-800 text-white cursor-not-allowed border border-gray-700'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-blue-500/20'
                  }`}
              >
                {isRebuilding ? "İnşa Ediliyor..." : "Shift Verisini Sıfırdan İnşa Et"}
              </button>
            </div>
          </div>

          {/* Stats displaying after Rebuilt */}
          {isRebuilt && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-left"
            >
              <div className="bg-black/40 p-2.5 border border-gray-900">
                <span className="text-[9px] text-white uppercase font-bold block mb-1">Çekilen stoppage_slice</span>
                <span className="text-sm font-bold text-yellow-500 font-mono">{shiftStats.stoppage} adet dilim</span>
              </div>
              <div className="bg-black/40 p-2.5 border border-gray-900">
                <span className="text-[9px] text-white uppercase font-bold block mb-1">Çekilen counter_slice</span>
                <span className="text-sm font-bold text-blue-500 font-mono">{shiftStats.counter} adet veri</span>
              </div>
              <div className="bg-black/40 p-2.5 border border-gray-900">
                <span className="text-[9px] text-white uppercase font-bold block mb-1">Hesaplanan OEE Ort.</span>
                <span className="text-sm font-bold text-green-500 font-mono">%{shiftStats.oee}</span>
              </div>
              <div className="bg-black/40 p-2.5 border border-gray-900">
                <span className="text-[9px] text-white uppercase font-bold block mb-1">Kayıp Zaman Oranı</span>
                <span className="text-sm font-bold text-red-500 font-mono">%{shiftStats.loss}</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* SPLIT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT: TIMELINE */}
          <motion.div variants={itemVariants} className="bg-[#1a2235] p-6 border border-white/10 rounded-none shadow-sm h-full">
            <h3 className="text-sm font-bold text-white uppercase mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" /> Kaskad Olay Akışı
            </h3>

            <div className="relative border-l-2 border-white/10 dark:border-gray-800 ml-4 space-y-8">
              {filteredTimelineEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white font-mono">
                  <AlertCircle className="w-8 h-8 text-amber-500 mb-2 animate-bounce" />
                  <span>Seçilen tarihte olay veya alarm kaydı bulunmuyor.</span>
                  <span className="text-[10px] text-white mt-1">Geçerli tarihler: 2026-01-12, 2026-01-21, 2026-02-25</span>
                </div>
              ) : (
                filteredTimelineEvents.map((event, idx) => (
                  <div key={event.id} className="relative pl-8">
                    {/* Icon Marker */}
                    <div className={`absolute -left-[17px] top-0.5 w-8 h-8 flex items-center justify-center bg-[#1a2235] border-2 rounded-full z-10 ${event.type === 'alarm' ? 'border-red-500' : 'border-orange-500'
                      }`}>
                      {event.type === 'alarm' ? (
                        <Bell className="w-4 h-4 text-red-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-orange-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div>
                      <span className="font-mono text-xs font-bold text-white">{event.time}</span>
                      <h4 className={`text-sm font-bold mt-1 uppercase ${event.type === 'alarm' ? 'text-red-600 dark:text-red-500' : 'text-orange-600 dark:text-orange-500'
                        }`}>
                        {event.message}
                      </h4>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="relative bg-[#1a2235] p-6 border border-white/10 rounded-none shadow-sm h-full flex flex-col">
            {!hasData && (
              <div className="absolute inset-0 bg-white/95 dark:bg-[#1a2235]/95 flex flex-col items-center justify-center z-30 p-4">
                <AlertCircle className="w-10 h-10 text-red-500 mb-2 animate-pulse" />
                <span className="text-sm font-bold text-white font-mono uppercase">AKTİF TELEMETRİ KAYDI BULUNAMADI</span>
                <span className="text-xs text-white mt-1 font-mono text-center">Girilen tarihte makine aktif üretim yapmamıştır veya kayıt yoktur.<br />Lütfen 2026-01-12, 2026-01-21 veya 2026-02-25 tarihlerini seçin.</span>
              </div>
            )}

            {/* Optimization Badge */}
            <div className="absolute top-4 right-4 flex items-center group/badge cursor-help z-20">
              <div className="px-2 py-1 border border-green-400 bg-green-500/10 text-green-400 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_10px_rgba(74,222,128,0.2)] rounded-none">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                Optimized Time-Window: ±15 Min
              </div>

              {/* Hover Tooltip */}
              <div className="opacity-0 invisible group-hover/badge:opacity-100 group-hover/badge:visible absolute right-0 top-8 w-64 bg-gray-900 border border-green-500 p-3 shadow-2xl transition-all z-50 rounded-none">
                <p className="text-xs text-green-400 leading-relaxed text-justify font-mono">
                  Sistem performansı için milyonlarca satırlık tam tarama (full-scan) engellenmiş, sorgu sadece olay anının dar çerçevesine odaklanmıştır.
                </p>
              </div>
            </div>

            <h3 className="text-sm font-bold text-white uppercase mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Sensör Trendi: PATH_LOAD %
            </h3>
            <p className="text-[10px] text-white uppercase tracking-widest font-bold mb-6">Zaman Aralığı: {startDate} 14:10 - {endDate} 14:30</p>

            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredPathLoadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#30363d" />
                  <XAxis dataKey="time" stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 150]} stroke="#8b949e" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#fff', borderRadius: '0px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />

                  {/* Threshold Line at 100% */}
                  <ReferenceLine y={100} stroke="#EAB308" strokeDasharray="3 3" strokeWidth={2}>
                  </ReferenceLine>

                  {/* Red Vertical Line at Alarm Moment */}
                  <ReferenceLine x="14:25:50" stroke="#EF4444" strokeWidth={2}>
                  </ReferenceLine>

                  <Area
                    type="monotone"
                    dataKey="load"
                    name="PATH_LOAD (%)"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorLoad)"
                    activeDot={{ r: 6, fill: '#3B82F6' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-yellow-500 border border-yellow-500 border-dashed"></div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">%100 Eşik Çizgisi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-4 bg-red-500"></div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Alarm Anı (14:25:50)</span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* BOTTOM SECTION: Cascade Diagram & Hypotheses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

          {/* Cascade Diagram */}
          <motion.div variants={itemVariants} className="bg-[#1a2235] p-6 border border-white/10 rounded-none shadow-sm flex flex-col justify-center">
            <h3 className="text-sm font-bold text-white uppercase mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-white" /> Kaskad Hata Zinciri Diyagramı
            </h3>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full px-4">
              <div className="bg-white/5 dark:bg-gray-800 border-2 border-gray-400 p-3 text-center flex-1 w-full md:w-auto relative group">
                <span className="text-xs font-bold text-white uppercase">Aşama 1</span>
                <p className="font-bold text-white dark:text-gray-200 text-sm mt-1">Takım Aşınması</p>
                <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <div className="block md:hidden absolute -bottom-5 left-1/2 -translate-x-1/2 z-10">
                  <ArrowDown className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500 p-3 text-center flex-1 w-full md:w-auto relative group">
                <span className="text-xs font-bold text-orange-500 uppercase">Aşama 2 (Uyarı)</span>
                <p className="font-bold text-orange-700 dark:text-orange-400 text-sm mt-1">Isı/Tork Artışı</p>
                <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-6 h-6 text-orange-500" />
                </div>
                <div className="block md:hidden absolute -bottom-5 left-1/2 -translate-x-1/2 z-10">
                  <ArrowDown className="w-6 h-6 text-orange-500" />
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 p-3 text-center flex-1 w-full md:w-auto relative group shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <span className="text-xs font-bold text-red-500 uppercase">Aşama 3 (Kritik)</span>
                <p className="font-bold text-red-700 dark:text-red-400 text-sm mt-1">MOTOR OVERLOAD</p>
                <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-6 h-6 text-red-500" />
                </div>
                <div className="block md:hidden absolute -bottom-5 left-1/2 -translate-x-1/2 z-10">
                  <ArrowDown className="w-6 h-6 text-red-500" />
                </div>
              </div>

              <div className="bg-gray-900 border-2 border-black p-3 text-center flex-1 w-full md:w-auto">
                <span className="text-xs font-bold text-white uppercase">Sonuç</span>
                <p className="font-bold text-white text-sm mt-1">14 Saat Duruş</p>
                <p className="text-xs text-red-400 font-mono mt-1">Maliyet: $2,126</p>
              </div>
            </div>
          </motion.div>

          {/* Hypotheses */}
          <motion.div variants={itemVariants} className="bg-[#1a2235] p-6 border border-white/10 rounded-none shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" /> RCA Hipotez Kartları (AI Tahmini)
            </h3>

            {hypotheses.map(hyp => (
              <div key={hyp.id} className="border border-white/10 p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#1a2235]">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">{hyp.title}</h4>
                  <p className="text-xs text-white mt-1 uppercase">Kanıt: <span className="font-mono">{hyp.proof}</span></p>
                </div>
                <div className="w-full md:w-48">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-bold text-white">Güven Puanı</span>
                    <span className={`text-sm font-mono font-bold ${hyp.confidence > 80 ? 'text-green-500' : hyp.confidence > 50 ? 'text-orange-500' : 'text-red-500'}`}>%{hyp.confidence}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full ${hyp.confidence > 80 ? 'bg-green-500' : hyp.confidence > 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                      style={{ width: `${hyp.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

        </div>

        {/* BOTTOM PARETO */}
        <motion.div variants={itemVariants} className="bg-[#1a2235] p-6 border border-white/10 rounded-none shadow-sm mt-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" /> Alarm Pareto Grafiği (Filtreleme)
              </h3>
              <span className="text-[10px] text-white font-mono">Filtrelenen Dönem: {startDate} - {endDate}</span>
            </div>
            <span className="text-[10px] text-white font-bold uppercase tracking-widest border border-white/10 px-2 py-1">Tıklanabilir</span>
          </div>

          <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredParetoData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#30363d" opacity={0.3} />
                <XAxis type="number" stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} width={120} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#fff', borderRadius: '0px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="count" name="Olay Sayısı" radius={[0, 4, 4, 0]} barSize={20} className="cursor-pointer">
                  {filteredParetoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        {/* PLATINUM FLEET IMPACT MODULE */}
        <motion.div variants={itemVariants} className="mt-6 border-4 border-[#111827] bg-[#1a2235] p-6 shadow-2xl relative overflow-hidden">
          {/* Decorative Background Element */}
          <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
            <Activity className="w-64 h-64 text-[#111827]" />
          </div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="bg-[#111827] p-2">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#111827] text-white uppercase tracking-tighter">Çapraz Makine Etki Analizi</h3>
              <p className="text-xs font-mono text-white font-bold tracking-widest uppercase">Tesis Geneli (Fleet Impact) Değerlendirmesi | Dönem: {startDate} - {endDate}</p>
            </div>
          </div>

          {/* 3-Column Matrix Scroll Wrapper */}
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="grid grid-cols-3 gap-6 relative z-10 min-w-[800px] xl:min-w-0">
              {/* Column 1 */}
              <div className="flex flex-col border-2 border-red-500 bg-[#1a2235] p-4 rounded-none shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 border-b border-red-500/30 pb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Kritik Eşleşme
                </h4>
                <div className="mt-2 flex-1">
                  <span className="text-sm font-bold text-white block mb-1">Makine 2</span>
                  <p className="text-xs text-gray-300 font-mono">
                    Benzer Basınç Düşüşü Tespit Edildi
                    <span className="block mt-2 text-red-400 font-black text-lg">%85 Eşleşme</span>
                  </p>
                </div>
              </div>

              {/* Column 2 */}
              <div className="flex flex-col border-2 border-green-500 bg-[#1a2235] p-4 rounded-none">
                <h4 className="text-xs font-bold text-green-500 uppercase tracking-wider mb-2 border-b border-green-500/30 pb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Durum Kontrolü
                </h4>
                <div className="mt-2 flex-1">
                  <span className="text-sm font-bold text-white block mb-1">Makine 5</span>
                  <p className="text-xs text-gray-300 font-mono">
                    Telemetri analizi yapıldı.
                    <span className="block mt-2 text-green-400 font-black text-lg">Normal Değerler</span>
                  </p>
                </div>
              </div>

              {/* Column 3 */}
              <div className="flex flex-col border-2 border-orange-500 bg-[#1a2235] p-4 rounded-none shadow-[0_0_15px_rgba(249,115,22,0.2)] relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <AlertOctagon className="w-24 h-24 text-orange-500" />
                </div>
                <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2 border-b border-orange-500/30 pb-2 flex items-center gap-2 relative z-10">
                  <AlertOctagon className="w-4 h-4" /> Sistemik Risk Uyarısı
                </h4>
                <div className="mt-2 flex-1 relative z-10">
                  <span className="text-sm font-bold text-white block mb-1">Tesis Geneli Tehdit</span>
                  <p className="text-xs text-gray-300 font-mono leading-relaxed">
                    İhracat süreçlerindeki gibi bir eksiğin tüm sevkiyatı etkilemesi riskine benzer durum.
                    <span className="block mt-2 text-orange-400 font-black text-sm uppercase">Ortak Pnömatik Hatta Kaçak İhtimali</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RCA;
