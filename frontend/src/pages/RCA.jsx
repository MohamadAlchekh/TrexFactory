import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Monitor, Calendar, AlertOctagon, Loader2, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── MOCK DATASET ───────────────────────────────────────────────────────────────
const MOCK_DATA = {
  'Makine 1': {
    '2026-01-21': [
      {
        id: 'stp-001',
        started_on: '2026-01-21 14:25:50',
        ended_on: '2026-01-21 15:39:50',
        duration_milliseconds: 4200000,
        rca: {
          rootCause: 'Pnömatik Sistem Arızası',
          timeline: [
            { rel: -14, desc: 'Hava basıncı düşüş eğilimi tespit edildi', severity: 'Warning' },
            { rel: -9, desc: 'Motor akım yükü %99 kritik sınıra ulaştı', severity: 'Critical' },
            { rel: -4, desc: 'Sensör kalibrasyon sapması (Minor) algılandı', severity: 'Info' },
            { rel: -1, desc: 'Titreşim verilerinde anormal artış gözlemlendi', severity: 'Warning' },
            { rel: 0, desc: 'MOTOR OVERLOAD — Hat Otomatik Durduruldu (Safety Lock)', severity: 'Critical' },
          ],
          whatif: {
            summary: 'Hava basıncı düşüşü ilk tespit edildiğinde müdahale edilseydi pnömatik valf değişimi zamanında yapılabilir, motor overload önlenebilirdi. Tahmini erken müdahale senaryosunda toplam duruş süresi %38 oranında azaltılabilirdi.',
            savedMinutes: 26.1,
            reductionPct: 38,
          },
        },
      },
      {
        id: 'stp-002',
        started_on: '2026-01-21 08:10:05',
        ended_on: '2026-01-21 08:42:05',
        duration_milliseconds: 1920000,
        rca: {
          rootCause: 'Takım Değişimi Gecikmesi',
          timeline: [
            { rel: -18, desc: 'Takım ömrü %90 doluluk uyarısı alındı', severity: 'Warning' },
            { rel: -10, desc: 'Tork değerlerinde yükseliş trendi başladı', severity: 'Warning' },
            { rel: -3, desc: 'Yüzey kalite sapması tespit edildi', severity: 'Info' },
            { rel: 0, desc: 'TAKIMDIR HATASI — Otomatik Durdurma Devreye Girdi', severity: 'Critical' },
          ],
          whatif: {
            summary: 'Takım ömrü uyarısı alındığında proaktif değişim yapılsaydı beklenmeyen duruş tamamen önlenebilirdi. Planlı bakım penceresine entegre edilmesi ile kaybedilen süre minimize edilebilir.',
            savedMinutes: 18.4,
            reductionPct: 57,
          },
        },
      },
    ],
    '2026-01-12': [
      {
        id: 'stp-003',
        started_on: '2026-01-12 11:05:30',
        ended_on: '2026-01-12 12:50:30',
        duration_milliseconds: 6300000,
        rca: {
          rootCause: 'Soğutma Sistemi Sıcaklık Aşımı',
          timeline: [
            { rel: -22, desc: 'Soğutma sıvısı akış hızında %15 düşüş', severity: 'Info' },
            { rel: -12, desc: 'Spindle sıcaklığı 68°C eşiğini geçti', severity: 'Warning' },
            { rel: -5, desc: 'Termal sensör kritik aralığa girdi (>85°C)', severity: 'Critical' },
            { rel: -1, desc: 'Otomatik güç kısıtlama devreye girdi', severity: 'Warning' },
            { rel: 0, desc: 'SPINDLE TEMP AŞIMI — Acil Durdurma Gerçekleşti', severity: 'Critical' },
          ],
          whatif: {
            summary: 'Soğutma sıvısı akış hızındaki düşüş anında müdahale edilseydi, spindle sıcaklığı kritik seviyeye ulaşmadan önce pompa kapasitesi artırılabilir ve duruş tamamen önlenebilirdi.',
            savedMinutes: 72.8,
            reductionPct: 69,
          },
        },
      },
    ],
  },
  'Makine 2': {
    '2026-01-21': [
      {
        id: 'stp-004',
        started_on: '2026-01-21 09:33:15',
        ended_on: '2026-01-21 10:18:15',
        duration_milliseconds: 2700000,
        rca: {
          rootCause: 'Z Ekseni Pozisyon Hatası',
          timeline: [
            { rel: -20, desc: 'Enkoder okuma tutarsızlıkları başladı', severity: 'Info' },
            { rel: -11, desc: 'Z ekseni referans sapması ±0.05mm aşıldı', severity: 'Warning' },
            { rel: -4, desc: 'CNC alarm kodu E-412 tetiklendi', severity: 'Critical' },
            { rel: 0, desc: 'Z EKSENİ HATASI — Güvenli Durdurma Yapıldı', severity: 'Critical' },
          ],
          whatif: {
            summary: 'Enkoder tutarsızlıkları gözlemlendiğinde kalibrasyon döngüsü otomatik tetiklenebilseydi Z ekseni pozisyon hatası oluşmadan üretim sürekliliği sağlanabilirdi.',
            savedMinutes: 31.5,
            reductionPct: 42,
          },
        },
      },
    ],
    '2026-02-25': [
      {
        id: 'stp-005',
        started_on: '2026-02-25 13:47:00',
        ended_on: '2026-02-25 14:22:00',
        duration_milliseconds: 2100000,
        rca: {
          rootCause: 'Kapı Kilitleme Sensörü Arızası',
          timeline: [
            { rel: -8, desc: 'Kapı sensörü intermittent sinyal kaybı', severity: 'Warning' },
            { rel: -3, desc: 'Güvenlik kontrol döngüsü yanıt süresi arttı', severity: 'Info' },
            { rel: 0, desc: 'DOOR INTERLOCK HATASI — Emniyet Devresi Açıldı', severity: 'Critical' },
          ],
          whatif: {
            summary: 'Sensör sinyali bozulması başladığında yedek sensör sistemi otomatik devreye girseydi güvenlik kilidi gereksiz yere tetiklenmezdi. Yedekli sensör altyapısı bu tür duruşları tamamen elimine edebilir.',
            savedMinutes: 21.0,
            reductionPct: 60,
          },
        },
      },
    ],
  },
  'Makine 3': {
    '2026-02-25': [
      {
        id: 'stp-006',
        started_on: '2026-02-25 07:15:45',
        ended_on: '2026-02-25 08:10:45',
        duration_milliseconds: 3300000,
        rca: {
          rootCause: 'Hidrolik Basınç Kaybı',
          timeline: [
            { rel: -30, desc: 'Hidrolik yağ seviyesi alt limit uyarısı', severity: 'Warning' },
            { rel: -18, desc: 'Basınç regülatöründe titreşim artışı', severity: 'Info' },
            { rel: -7, desc: 'Sistem basıncı 180 bar altına düştü', severity: 'Critical' },
            { rel: -2, desc: 'Sızdırmazlık kontrol alarmı devreye girdi', severity: 'Warning' },
            { rel: 0, desc: 'HİDROLİK BASINÇ KAYBI — Acil Emniyet Devreye Girdi', severity: 'Critical' },
          ],
          whatif: {
            summary: 'Hidrolik yağ seviyesi uyarısı alındığında yağ takviyesi yapılsaydı ve sızdırmazlık elemanları kontrol edilseydi basınç kaybı oluşmadan üretim devamlılığı sağlanabilirdi.',
            savedMinutes: 42.3,
            reductionPct: 51,
          },
        },
      },
    ],
  },
  'Makine 5': {
    '2026-01-12': [
      {
        id: 'stp-007',
        started_on: '2026-01-12 15:22:10',
        ended_on: '2026-01-12 15:58:10',
        duration_milliseconds: 2160000,
        rca: {
          rootCause: 'Şebeke Voltaj Dalgalanması',
          timeline: [
            { rel: -16, desc: 'Voltaj dalgalanması ±5V seviyesinde gözlemlendi', severity: 'Info' },
            { rel: -9, desc: 'Servo sürücü hata kodu F-07 kaydedildi', severity: 'Warning' },
            { rel: -3, desc: 'Ana kontrol kartı güç reset döngüsüne girdi', severity: 'Critical' },
            { rel: 0, desc: 'VOLTAJ DALGALANMASI — Servo Sürücü Kapandı', severity: 'Critical' },
          ],
          whatif: {
            summary: 'Voltaj dalgalanması tespitinde UPS ve güç kondisyoneri otomatik devreye alınsaydı servo sürücü resetlenmeden üretim sürdürülebilirdi. Güç kalite filtresi yatırımı bu tür olayları tamamen önleyebilir.',
            savedMinutes: 27.6,
            reductionPct: 45,
          },
        },
      },
    ],
    '2026-02-25': [
      {
        id: 'stp-008',
        started_on: '2026-02-25 10:05:00',
        ended_on: '2026-02-25 10:29:00',
        duration_milliseconds: 1440000,
        rca: {
          rootCause: 'Palet Değiştirici Mekanik Sıkışması',
          timeline: [
            { rel: -12, desc: 'Palet taşıma döngüsü süresinde %20 uzama', severity: 'Info' },
            { rel: -5, desc: 'Servo motor akım yükü artışı tespit edildi', severity: 'Warning' },
            { rel: 0, desc: 'PALET SIKIŞ ALAMI — ATC Hata Kodu Tetiklendi', severity: 'Critical' },
          ],
          whatif: {
            summary: 'Palet taşıma döngüsündeki süre uzaması anında tanımlanıp yağlama döngüsü tetiklenebilseydi mekanik sıkışma oluşmadan operasyon tamamlanabilirdi.',
            savedMinutes: 15.2,
            reductionPct: 63,
          },
        },
      },
    ],
  },
  'TurboCut 400': {
    '2026-01-21': [
      {
        id: 'stp-009',
        started_on: '2026-01-21 16:48:00',
        ended_on: '2026-01-21 18:12:00',
        duration_milliseconds: 5040000,
        rca: {
          rootCause: 'Talaş Taşıma Bandı Tıkanması',
          timeline: [
            { rel: -25, desc: 'Talaş konveyör motor akım yükü artışı', severity: 'Info' },
            { rel: -15, desc: 'Konveyör hız sensörü ani düşüş algıladı', severity: 'Warning' },
            { rel: -8, desc: 'Talaş sıkışma uyarısı (otomatik yavaşlama devrede)', severity: 'Warning' },
            { rel: -2, desc: 'Motor aşırı yük koruma alarmı tetiklendi', severity: 'Critical' },
            { rel: 0, desc: 'KONVEYÖR TIKANMA — Tüm Kesim Operasyonu Durduruldu', severity: 'Critical' },
          ],
          whatif: {
            summary: 'Konveyör motor akımındaki artış tespit edildiğinde otomatik temizleme döngüsü başlatılsaydı tıkanma oluşmadan önce talaşlar temizlenebilirdi. Periyodik otomatik temizleme rutini bu duruşu tamamen önleyebilir.',
            savedMinutes: 58.4,
            reductionPct: 55,
          },
        },
      },
    ],
  },
};

// Derive machine list from mock data
const MACHINE_LIST = Object.keys(MOCK_DATA);

// Severity color classes
const SEVERITY_DOT = {
  Critical: 'bg-red-500',
  Warning: 'bg-yellow-400',
  Info: 'bg-blue-400',
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────────
const RCA = () => {
  const navigate = useNavigate();

  // Selection state
  const [selectedMachine, setSelectedMachine] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableStoppages, setAvailableStoppages] = useState([]);
  const [selectedStoppageId, setSelectedStoppageId] = useState('');

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Populate dates when machine changes
  useEffect(() => {
    if (!selectedMachine) {
      setAvailableDates([]);
      setSelectedDate('');
      setAvailableStoppages([]);
      setSelectedStoppageId('');
      setResult(null);
      return;
    }
    const dates = Object.keys(MOCK_DATA[selectedMachine] || {});
    setAvailableDates(dates);
    setSelectedDate('');
    setAvailableStoppages([]);
    setSelectedStoppageId('');
    setResult(null);
  }, [selectedMachine]);

  // Populate stoppages when date changes
  useEffect(() => {
    if (!selectedMachine || !selectedDate) {
      setAvailableStoppages([]);
      setSelectedStoppageId('');
      setResult(null);
      return;
    }
    const stoppages = MOCK_DATA[selectedMachine]?.[selectedDate] || [];
    setAvailableStoppages(stoppages);
    setSelectedStoppageId('');
    setResult(null);
  }, [selectedMachine, selectedDate]);

  const selectedStoppage = availableStoppages.find(s => s.id === selectedStoppageId) || null;

  const canAnalyze = selectedMachine && selectedDate && selectedStoppageId && !isAnalyzing;

  const handleAnalyze = () => {
    if (!selectedStoppage) return;
    setError('');
    setResult(null);
    setIsAnalyzing(true);
    setTimeout(() => {
      try {
        setResult(selectedStoppage.rca);
      } catch (e) {
        setError('Analiz sırasında beklenmedik bir hata oluştu.');
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);
  };

  const handleWhatIfBridge = () => {
    if (!result || !selectedStoppage) return;
    const bridgeData = {
      machine: selectedMachine,
      date: selectedDate,
      stoppageId: selectedStoppageId,
      startedOn: selectedStoppage.started_on,
      durationMs: selectedStoppage.duration_milliseconds,
      rootCause: result.rootCause,
      savedMinutes: result.whatif.savedMinutes,
      reductionPct: result.whatif.reductionPct,
      summary: result.whatif.summary,
    };
    localStorage.setItem('rca_bridge', JSON.stringify(bridgeData));
    navigate('/what-if');
  };

  const handleExportPDF = () => {
    if (!result || !selectedStoppage) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('TREX CLOUD - KOK NEDEN ANALİZİ RAPORU', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Rapor Tarihi: ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`, 14, 30);
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, 36, 196, 36);
    autoTable(doc, {
      startY: 42,
      head: [['Parametre', 'Değer']],
      body: [
        ['Makine', selectedMachine],
        ['Tarih', selectedDate],
        ['Başlangıç', selectedStoppage.started_on],
        ['Süre (dk)', (selectedStoppage.duration_milliseconds / 60000).toFixed(1)],
        ['Kök Neden', result.rootCause],
        ['Kazanılabilir Süre', `${result.whatif.savedMinutes} dk`],
        ['Önerilen Azaltma', `%${result.whatif.reductionPct}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14 },
    });
    doc.save(`RCA_${selectedMachine}_${selectedDate}.pdf`);
  };

  const durationMinutes = selectedStoppage
    ? (selectedStoppage.duration_milliseconds / 60000).toFixed(1)
    : null;

  return (
    <div className="p-6 h-full overflow-y-auto bg-[#0d1117] text-white min-h-screen">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">
            Kök Neden Analizi (RCA)
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Makine duruş olayları için yapay zeka destekli kök neden tespiti
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={!result}
          title={!result ? 'Önce analiz yapın' : 'PDF İndir'}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded border transition-all duration-200 ${
            result
              ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500 text-white cursor-pointer'
              : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Download className="w-4 h-4" />
          PDF İndir
        </button>
      </div>

      {/* ── SECTION 1: SELECTION PANEL ──────────────────────────────────────── */}
      <div className="bg-[#161b22] border border-white/10 rounded-lg p-5 mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          Seçim Paneli
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {/* Machine Dropdown */}
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
              <Monitor className="w-3 h-3" /> Makine
            </label>
            <select
              id="rca-machine-select"
              value={selectedMachine}
              onChange={e => setSelectedMachine(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">— Makine Seçin —</option>
              {MACHINE_LIST.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Date Dropdown */}
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Tarih
            </label>
            <select
              id="rca-date-select"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              disabled={!selectedMachine}
              className="w-full bg-[#0d1117] border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <option value="">— Tarih Seçin —</option>
              {availableDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Stoppage Dropdown */}
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
              <AlertOctagon className="w-3 h-3" /> Duruş
            </label>
            <select
              id="rca-stoppage-select"
              value={selectedStoppageId}
              onChange={e => setSelectedStoppageId(e.target.value)}
              disabled={!selectedDate || availableStoppages.length === 0}
              className="w-full bg-[#0d1117] border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <option value="">— Duruş Seçin —</option>
              {availableStoppages.map(s => (
                <option key={s.id} value={s.id}>
                  {s.started_on} — {(s.duration_milliseconds / 60000).toFixed(1)} dk
                </option>
              ))}
            </select>
          </div>

          {/* Analyze Button */}
          <div className="shrink-0">
            <button
              id="rca-analyze-btn"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded transition-all duration-200 whitespace-nowrap ${
                canAnalyze
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analiz çalışıyor...
                </>
              ) : (
                'Analiz Et'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: RESULTS ──────────────────────────────────────────────── */}
      {result && selectedStoppage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* CARD 1: Kök Neden */}
          <div className="bg-[#161b22] border border-white/10 rounded-lg p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Kök Neden
              </h2>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                Analiz Tamamlandı
              </span>
            </div>
            <p className="text-2xl font-bold text-white leading-tight">
              {result.rootCause}
            </p>
            <div className="mt-auto pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Başlangıç</p>
                <p className="text-sm font-semibold text-gray-200 font-mono">{selectedStoppage.started_on}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Süre</p>
                <p className="text-sm font-semibold text-red-400 font-mono">{durationMinutes} dk</p>
              </div>
            </div>
          </div>

          {/* CARD 2: Zaman Çizelgesi */}
          <div className="bg-[#161b22] border border-white/10 rounded-lg p-6 flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Zaman Çizelgesi
            </h2>
            <div className="flex flex-col gap-0">
              {result.timeline.map((ev, idx) => {
                const isLast = idx === result.timeline.length - 1;
                return (
                  <div key={idx} className="flex gap-3">
                    {/* Left column: dot + line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${SEVERITY_DOT[ev.severity]}`} />
                      {!isLast && <div className="w-px flex-1 bg-white/10 my-1" />}
                    </div>
                    {/* Right column: text */}
                    <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                      <span className="font-mono text-[11px] text-gray-500">
                        {ev.rel === 0 ? 'T=0' : `T${ev.rel} dk`}
                      </span>
                      <p className={`text-sm leading-snug mt-0.5 ${
                        isLast ? 'font-bold text-red-400' : 'text-gray-300'
                      }`}>
                        {isLast && '⛔ '}{ev.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD 3: What-If Köprüsü */}
          <div className="bg-[#161b22] border border-indigo-500/30 rounded-lg p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                What-If Köprüsü
              </h2>
              <p className="text-sm font-semibold text-indigo-400">Erken Müdahale Senaryosu</p>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed flex-1">
              {result.whatif.summary}
            </p>
            <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-white/10">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Kazanılabilir Süre</p>
                <p className="text-xl font-bold text-green-400">{result.whatif.savedMinutes} <span className="text-sm font-normal text-gray-400">dk</span></p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Önerilen Azaltma Oranı</p>
                <p className="text-xl font-bold text-indigo-400">%{result.whatif.reductionPct}</p>
              </div>
            </div>
            <button
              id="rca-whatif-btn"
              onClick={handleWhatIfBridge}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded transition-all duration-200 shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              What-If'te Aç →
            </button>
          </div>
        </div>
      )}

      {/* ── SECTION 3: ERROR BANNER ──────────────────────────────────────────── */}
      {error && (
        <div className="mt-4 flex items-start gap-3 bg-red-900/30 border border-red-500/40 rounded-lg p-4 text-red-300 text-sm">
          <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default RCA;
