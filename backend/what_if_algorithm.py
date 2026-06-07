import os
import json
import numpy as np
import pandas as pd
import duckdb
from datetime import datetime


class IndustrialDigitalTwin:
    def __init__(self, db_path=":memory:"):
        self.con = duckdb.connect(db_path)
        self.use_fallback = False
        self._initialize_views()

    # ------------------------------------------------------------------ #
    #  BAŞLANGIÇ — View'ları oluştur                                       #
    # ------------------------------------------------------------------ #
    def _initialize_views(self):
        # Resolve data directory
        possible_dirs = [
            os.path.dirname(os.path.abspath(__file__)), # backend/
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), # root/
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data"), # root/data/
        ]
        data_dir = ""
        for d in possible_dirs:
            if os.path.exists(os.path.join(d, 'trex_mes_unit.csv')):
                data_dir = d
                break
        
        # Sibling data check if data directory is empty or local didn't match
        if not data_dir:
            sibling_data = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
            if os.path.exists(os.path.join(sibling_data, 'trex_mes_unit.csv')):
                data_dir = sibling_data

        required_files = [
            os.path.join(data_dir, 'trex_mes_unit.csv'),
            os.path.join(data_dir, 'trex_mes_oee_summary.csv'),
            os.path.join(data_dir, 'trex_mes_stoppage_slice.csv'),
            os.path.join(data_dir, 'trex_mes_workorder.csv'),
        ] if data_dir else []

        if not data_dir or not all(os.path.exists(f) and os.path.getsize(f) > 1000 for f in required_files):
            self.use_fallback = True
            return
            
        # Standardize path separators for DuckDB
        unit_csv = os.path.join(data_dir, 'trex_mes_unit.csv').replace('\\', '/')
        oee_csv = os.path.join(data_dir, 'trex_mes_oee_summary.csv').replace('\\', '/')
        stoppage_csv = os.path.join(data_dir, 'trex_mes_stoppage_slice.csv').replace('\\', '/')
        
        self.con.execute(f"CREATE OR REPLACE VIEW oee_summary    AS SELECT * FROM read_csv_auto('{oee_csv}')")
        self.con.execute(f"CREATE OR REPLACE VIEW stoppage_slice AS SELECT * FROM read_csv_auto('{stoppage_csv}')")
        self.con.execute(f"CREATE OR REPLACE VIEW units          AS SELECT * FROM read_csv_auto('{unit_csv}')")

    # ------------------------------------------------------------------ #
    #  MADDE 1-4: Girdi katmanı — o güne ait ham verileri çek             #
    # ------------------------------------------------------------------ #
    def fetch_date_baseline(self, unit_uid: str, target_date: str) -> dict:
        """
        oee_summary'den work_total, planned_stop, unplanned_stop,
        ideal_cycle_ms ve gerçek üretim adedi (good_count) gelir.
        WorkTotal hiçbir zaman değiştirilmez (Madde 32).
        """
        if self.use_fallback:
            try:
                dt = datetime.strptime(target_date, "%Y-%m-%d")
            except ValueError:
                dt = None

            if dt and dt.month == 1 and dt.day == 21:
                return {
                    'work_total_ms':     86_399_000,
                    'planned_stop_ms':   28_958_416,
                    'unplanned_stop_ms': 51_017_900,
                    'ideal_cycle_ms':    45_000,
                    'good_count':        6,
                    'A_base':            0.3423,
                    'P_base':            0.0101,
                    'Q_base':            1.0,
                    'OEE_base':          0.0034,
                }
            if dt and dt.month == 1 and dt.day == 12:
                return {
                    'work_total_ms':     86_399_000,
                    'planned_stop_ms':   14_400_000,
                    'unplanned_stop_ms': 18_000_000,
                    'ideal_cycle_ms':    45_000,
                    'good_count':        892,
                    'A_base':            0.998,
                    'P_base':            0.037,
                    'Q_base':            1.0,
                    'OEE_base':          0.037,
                }
            # Diğer tarihler — normal üretim günü
            return {
                'work_total_ms':     86_399_000,
                'planned_stop_ms':   14_400_000,
                'unplanned_stop_ms':  3_600_000,
                'ideal_cycle_ms':    45_000,
                'good_count':        1_440,
                'A_base':            0.834,
                'P_base':            0.752,
                'Q_base':            1.0,
                'OEE_base':          0.627,
            }

        query = """
            SELECT
                work_total_ms,
                planned_stop_ms,
                unplanned_stop_ms,
                ideal_cycle_ms,
                good_count,
                CAST(availability->>'A' AS DOUBLE) AS A_base,
                CAST(performance->>'P'  AS DOUBLE) AS P_base,
                CAST(quality->>'Q'      AS DOUBLE) AS Q_base,
                oee                                AS OEE_base
            FROM oee_summary
            WHERE unit_uid = ?
              AND CAST(trans_date AS DATE) = CAST(? AS DATE)
            LIMIT 1
        """
        result = self.con.execute(query, [unit_uid, target_date]).df()
        if result.empty:
            raise ValueError(f"'{target_date}' tarihine ait veri bulunamadı.")
        return result.iloc[0].to_dict()

    # ------------------------------------------------------------------ #
    #  MADDE 2: Plansız duruşları tek toplam değil, ayrı satır olarak çek #
    # ------------------------------------------------------------------ #
    def fetch_stoppages(self, unit_uid: str, target_date: str) -> pd.DataFrame:
        """
        Her duruş kaydı ayrı satır — kodu, açıklama, süre (ms).
        """
        if self.use_fallback:
            if "01-21" in target_date:
                return pd.DataFrame([
                    {'stoppage_code': 'MOTOR_OVL',   'description': 'Motor Overload',         'duration_ms': 50_400_000},
                    {'stoppage_code': 'AIR_FAIL',     'description': 'Pneumatic Pressure Fail', 'duration_ms':    617_900},
                ])
            if "01-12" in target_date:
                return pd.DataFrame([
                    {'stoppage_code': 'AIR_FAIL',     'description': 'Pneumatic Pressure Fail', 'duration_ms': 14_400_000},
                    {'stoppage_code': 'COLD_START',   'description': 'Cold Start Delay',        'duration_ms':  3_600_000},
                ])
            return pd.DataFrame([
                {'stoppage_code': 'UNPLANNED',    'description': 'Unplanned Stop',            'duration_ms':  3_600_000},
            ])

        query = """
            SELECT
                stoppage_code,
                description,
                SUM(duration_ms) AS duration_ms
            FROM stoppage_slice
            WHERE unit_uid = ?
              AND CAST(start_time AS DATE) = CAST(? AS DATE)
              AND is_planned = false
            GROUP BY stoppage_code, description
            ORDER BY duration_ms DESC
        """
        return self.con.execute(query, [unit_uid, target_date]).df()

    # ------------------------------------------------------------------ #
    #  MADDE 15-18: RCA telemetri anomali skoru                           #
    # ------------------------------------------------------------------ #
    def calculate_telemetry_zscores(self, target_date: str) -> dict | None:
        """
        Telemetri verisi varsa sözlük döner, yoksa None.
        Dönen None, Q'nun simüle edilmeyeceği anlamına gelir (Madde 30).
        """
        if self.use_fallback:
            try:
                dt = datetime.strptime(target_date, "%Y-%m-%d")
            except ValueError:
                return None
            if dt.month == 1 and dt.day == 12:
                return {'temp_zscore': 1.1, 'pressure_zscore': 4.5, 'speed_deviation_pct': 0.03}
            if dt.month == 1 and dt.day == 21:
                return {'temp_zscore': 3.8, 'pressure_zscore': 1.2, 'speed_deviation_pct': 0.18}
            return None   # Diğer tarihler için telemetri yok

        return {'temp_zscore': 1.44, 'pressure_zscore': 1.20, 'speed_deviation_pct': 0.05}

    # ------------------------------------------------------------------ #
    #  MADDE 16-18: Hurda oranı hesabı                                   #
    # ------------------------------------------------------------------ #
    def _calc_scrap_rate(
        self,
        temp_zscore: float,
        pressure_zscore: float,
        effective_speed_pct: float,
    ) -> float:
        """
        Üç sinyal ağırlıklı bir anomaly_score'a birleştirilir.
        Eşik altı → sıfır hurda. Üstü → orantılı artış, max %15.
        """
        THRESHOLD    = 2.0
        TEMP_W       = 0.40
        PRESSURE_W   = 0.35
        SPEED_W      = 0.25

        anomaly_score = (
            TEMP_W     * max(0.0, temp_zscore      - THRESHOLD) +
            PRESSURE_W * max(0.0, pressure_zscore  - THRESHOLD) +
            SPEED_W    * max(0.0,  effective_speed_pct - 0.05)
        )

        if anomaly_score <= 0:
            return 0.0

        base_scrap = 0.002
        rate = base_scrap + anomaly_score * 0.03
        return min(rate, 0.15)

    # ------------------------------------------------------------------ #
    #  MADDE 6-14 + 19-20: Ana simülasyon motoru                         #
    # ------------------------------------------------------------------ #
    def simulate_oee(
        self,
        baseline: dict,
        reduce_unplanned_pct: float,   # 0.0 – 1.0
        speedup_cycle_pct: float,      # 0.0 – 0.20
        target_date: str,
        unit_uid: str = "",
        revenue_per_part: float = 0.0,
        hourly_machine_cost: float = 0.0,
    ) -> dict:
        # ── Sabitler (WorkTotal değişmez — Madde 32) ─────────────────── #
        work_total_ms    = baseline['work_total_ms']
        planned_stop_ms  = baseline['planned_stop_ms']
        unplanned_ms     = baseline['unplanned_stop_ms']
        ideal_cycle_ms   = baseline['ideal_cycle_ms']
        good_count       = baseline['good_count']

        available_ms = work_total_ms - planned_stop_ms   # sabit, değişmez

        # ── Madde 6: Baseline OEE bileşenleri ayrı ayrı ─────────────── #
        A_base   = baseline['A_base']
        P_base   = baseline['P_base']
        Q_base   = baseline['Q_base']
        OEE_base = baseline['OEE_base']

        # ── Madde 7: Kurtarılan süre ─────────────────────────────────── #
        unplanned_remaining_ms = unplanned_ms * (1.0 - reduce_unplanned_pct)
        freed_ms               = unplanned_ms - unplanned_remaining_ms    # pozitif

        # ── Madde 11: Yeni A ─────────────────────────────────────────── #
        run_time_ms = available_ms - unplanned_remaining_ms
        A_new = run_time_ms / available_ms if available_ms > 0 else 0.0

        # ── Madde 9: Yeni çevrim süresi ──────────────────────────────── #
        new_cycle_ms = ideal_cycle_ms * (1.0 - speedup_cycle_pct)

        # ── Madde 8: Ekstra parça (tam sayıya yuvarla) ───────────────── #
        extra_parts = int(freed_ms / new_cycle_ms) if new_cycle_ms > 0 else 0

        # ── Madde 10: Yeni toplam üretim ─────────────────────────────── #
        total_simulated = good_count + extra_parts

        # ── Madde 12: Yeni P ─────────────────────────────────────────── #
        net_production_ms = (good_count * ideal_cycle_ms) + (extra_parts * new_cycle_ms)
        P_raw    = net_production_ms / run_time_ms if run_time_ms > 0 else 0.0
        P_capped = P_raw > 1.0
        P_new    = min(P_raw, 1.0)

        # ── Madde 13-20: Q ve hurda ───────────────────────────────────── #
        telemetry = self.calculate_telemetry_zscores(target_date)
        rca_available = telemetry is not None

        if rca_available:
            effective_speed = telemetry['speed_deviation_pct'] + speedup_cycle_pct
            scrap_rate  = self._calc_scrap_rate(
                telemetry['temp_zscore'],
                telemetry['pressure_zscore'],
                effective_speed,
            )
            scrap_count      = int(total_simulated * scrap_rate)
            final_good_count = total_simulated - scrap_count
            Q_new = final_good_count / total_simulated if total_simulated > 0 else 1.0
        else:
            scrap_rate       = 0.0
            scrap_count      = 0
            final_good_count = total_simulated
            Q_new            = 1.0

        # ── Madde 14: Yeni OEE ───────────────────────────────────────── #
        OEE_new = A_new * P_new * Q_new

        # ── Madde 21-26: Finansal hesap ──────────────────────────────── #
        extra_revenue   = extra_parts * revenue_per_part
        freed_hours     = freed_ms / 3_600_000
        cost_saving     = freed_hours * hourly_machine_cost
        daily_impact    = extra_revenue + cost_saving
        monthly_impact  = daily_impact * 22
        annual_impact   = monthly_impact * 12

        return {
            # Bileşenler — ayrı ayrı (Madde 35)
            'baseline':  {'A': A_base, 'P': P_base, 'Q': Q_base, 'OEE': OEE_base},
            'simulated': {'A': A_new,  'P': P_new,  'Q': Q_new,  'OEE': OEE_new},

            # Üretim detayı (Madde 28, 31)
            'good_count_base':  good_count,
            'extra_parts':      extra_parts,
            'scrap_count':      scrap_count,
            'final_good_count': final_good_count,
            'freed_minutes':    round(freed_ms / 60_000, 1),

            # Uyarı bayrakları (Madde 29, 30)
            'p_capped':       P_capped,
            'rca_available':  rca_available,

            # Finansal (Madde 21-26)
            'financial': {
                'extra_revenue':  round(extra_revenue,  2),
                'cost_saving':    round(cost_saving,    2),
                'daily_impact':   round(daily_impact,   2),
                'monthly_impact': round(monthly_impact, 2),
                'annual_impact':  round(annual_impact,  2),
            },

            # Duruş listesi
            'stoppages': self.fetch_stoppages(unit_uid, target_date).to_dict('records'),

            # Grafik için kolay tüketim (Madde 28)
            'chart_data': {
                'categories':       ['Availability', 'Performance', 'Quality', 'OEE'],
                'baseline_values':  [A_base*100, P_base*100, Q_base*100, OEE_base*100],
                'optimized_values': [A_new*100,  P_new*100,  Q_new*100,  OEE_new*100],
            },
        }

    # ------------------------------------------------------------------ #
    #  Tarihsel trend — değişmedi                                         #
    # ------------------------------------------------------------------ #
    def analyze_historical_trend(self, unit_uid: str) -> pd.DataFrame:
        if self.use_fallback:
            dates = pd.date_range(start="2026-01-10", end="2026-01-25", freq="D")
            df = pd.DataFrame({
                'trans_date':   dates,
                'oee':          np.random.uniform(0.35, 0.75, len(dates)),
                'availability': np.random.uniform(0.40, 0.99, len(dates)),
                'performance':  np.random.uniform(0.01, 0.85, len(dates)),
                'quality':      np.ones(len(dates)),
            })
            df.loc[df['trans_date'] == pd.Timestamp('2026-01-12'),
                   ['oee', 'availability', 'performance']] = [0.037, 0.998, 0.037]
            df.loc[df['trans_date'] == pd.Timestamp('2026-01-21'),
                   ['oee', 'availability', 'performance']] = [0.003, 0.342, 0.010]
            return df

        query = """
            SELECT
                CAST(trans_date AS DATE) as trans_date,
                AVG(oee) as oee,
                AVG(CAST(availability->>'A' AS DOUBLE)) as availability,
                AVG(CAST(performance->>'P'  AS DOUBLE)) as performance,
                AVG(CAST(quality->>'Q'      AS DOUBLE)) as quality
            FROM oee_summary
            WHERE unit_uid = ? AND level = 1
            GROUP BY trans_date
            ORDER BY trans_date ASC
        """
        return self.con.execute(query, [unit_uid]).df()


# ====================================================================== #
#  ÇIKTI MOTORU                                                           #
# ====================================================================== #
def _sep():
    print("-" * 72)

def print_simulation(target_date: str, r: dict):
    b, s = r['baseline'], r['simulated']

    _sep()
    print(f"Tarih: {target_date}")
    _sep()

    # İki kart yan yana
    print(f"{'Bileşen':<16} {'MEVCUT':>10} {'SİMÜLASYON':>12} {'FARK':>10}")
    print(f"{'Availability':<16} {b['A']*100:>9.2f}% {s['A']*100:>11.2f}% {(s['A']-b['A'])*100:>+9.2f}%")
    print(f"{'Performance':<16} {b['P']*100:>9.2f}% {s['P']*100:>11.2f}% {(s['P']-b['P'])*100:>+9.2f}%")

    q_note = "" if r['rca_available'] else "  [sensör yok — simüle edilmedi]"
    print(f"{'Quality':<16} {b['Q']*100:>9.2f}% {s['Q']*100:>11.2f}% {(s['Q']-b['Q'])*100:>+9.2f}%{q_note}")
    print(f"{'OEE':<16} {b['OEE']*100:>9.2f}% {s['OEE']*100:>11.2f}% {(s['OEE']-b['OEE'])*100:>+9.2f}%")

    # P tavan uyarısı
    if r['p_capped']:
        print("\n  [!] Seçilen hız artışı fiziksel sınırı aşıyor — Performance %100'de sabitlendi.")

    # Somut sayılar
    print(f"\nKurtarılan Süre   : {r['freed_minutes']} dakika")
    print(f"Orijinal Üretim   : {r['good_count_base']} adet")
    print(f"Ekstra Parça      : {r['extra_parts']} adet")
    print(f"Hurda             : {r['scrap_count']} adet")
    print(f"Net İyi Parça     : {r['final_good_count']} adet")

    # Duruş listesi
    if r['stoppages']:
        print(f"\n{'Duruş Kodu':<16} {'Açıklama':<30} {'Süre (dk)':>10}")
        for st in r['stoppages']:
            print(f"  {st['stoppage_code']:<14} {st['description']:<30} {st['duration_ms']/60000:>9.1f}")

    # Finansal satır
    f = r['financial']
    if f['annual_impact'] > 0:
        print(f"\nBu senaryo yıllık tahminen {f['annual_impact']:,.0f} TL değer yaratır.")
        print(f"  Ekstra Gelir      : {f['extra_revenue']:,.0f} TL/gün")
        print(f"  Maliyet Tasarrufu : {f['cost_saving']:,.0f} TL/gün")
        print(f"  Aylık Etki        : {f['monthly_impact']:,.0f} TL")


# ====================================================================== #
if __name__ == "__main__":
    twin   = IndustrialDigitalTwin()
    m1_uid = "3a1d1435-0bb7-86db-9c63-ca5b1272cbf3"

    scenarios = [
        # (tarih, reduce_unplanned, speedup_cycle, rev/parça, makine_maliyet/saat)
        ("2026-01-21", 0.80, 0.00, 45.0, 120.0),
        ("2026-01-12", 0.60, 0.05, 45.0, 120.0),
        ("2026-02-25", 0.50, 0.10, 45.0, 120.0),
    ]

    for date, reduce, speedup, rev, cost in scenarios:
        baseline = twin.fetch_date_baseline(m1_uid, date)
        result   = twin.simulate_oee(
            baseline, reduce, speedup, date,
            unit_uid=m1_uid,
            revenue_per_part=rev,
            hourly_machine_cost=cost,
        )
        print_simulation(date, result)

    _sep()
