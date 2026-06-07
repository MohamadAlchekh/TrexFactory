"""
IndustrialDigitalTwin — FastAPI Backend
Entegrasyon: WhatIfAnalysis.jsx ile tam uyumlu REST API
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import sys, os

# ──────────────────────────────────────────────────────────────
# IndustrialDigitalTwin sınıfını import et
# (bu dosya what_if_algorithm.py ile aynı dizinde olmalı)
# ──────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from what_if_algorithm import IndustrialDigitalTwin

app = FastAPI(
    title="Industrial Digital Twin API",
    description="OEE What-If Simülatörü — Kestirimci İyileştirme ve Finansal ROI",
    version="1.0.0",
)

# CORS — React geliştirme sunucusu için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Prod'da sadece kendi domain'inize kısıtlayın
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton twin instance
twin = IndustrialDigitalTwin()


# ──────────────────────────────────────────────────────────────
# Pydantic Modeller
# ──────────────────────────────────────────────────────────────

class SimulateRequest(BaseModel):
    unit_uid: str                              = Field(..., description="Makine UID")
    target_date: str                           = Field(..., description="YYYY-MM-DD")
    downtimeReductionPercent: float            = Field(30.0, ge=0, le=100)
    cycleSpeedupPercent: float                 = Field(5.0, ge=0, le=20)
    hourlyCost: float                          = Field(120.0, ge=0)
    partMargin: float                          = Field(45.0, ge=0)
    # Kullanıcı telemetri override'ları (opsiyonel)
    temperature: Optional[float]               = Field(None, ge=0, le=10)
    pressure: Optional[float]                  = Field(None, ge=0, le=10)


# ──────────────────────────────────────────────────────────────
# GET /api/dates/{unit_uid}
# WhatIfAnalysis.jsx → api.getAvailableDates(uid) bunu çağırır
# ──────────────────────────────────────────────────────────────
@app.get("/api/dates/{unit_uid}")
def get_available_dates(unit_uid: str):
    """
    Seçili makine için mevcut tarihleri ve her tarihe ait
    baseline OEE değerlerini, duruş listesini ve telemetri
    durumunu döndürür.
    """
    # Fallback modda zengin demo tarihler (60 gün)
    if twin.use_fallback:
        from datetime import date, timedelta
        start_date = date(2026, 1, 1)
        demo_dates = [str(start_date + timedelta(days=i)) for i in range(59, -1, -1)]
    else:
        try:
            df = twin.analyze_historical_trend(unit_uid)
            demo_dates = [str(d.date()) for d in df["trans_date"].tolist()]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    result = []
    for date_str in demo_dates:
        try:
            baseline   = twin.fetch_date_baseline(unit_uid, date_str)
            stoppages  = twin.fetch_stoppages(unit_uid, date_str).to_dict("records")
            telemetry  = twin.calculate_telemetry_zscores(date_str)

            result.append({
                "date": date_str,
                "baseline": {
                    "A":          round(baseline["A_base"] * 100, 2),
                    "P":          round(baseline["P_base"] * 100, 2),
                    "Q":          round(baseline["Q_base"] * 100, 2),
                    "OEE":        round(baseline["OEE_base"] * 100, 2),
                    "good_count": baseline["good_count"],
                },
                "stoppages": [
                    {
                        "stoppage_code": s["stoppage_code"],
                        "description":   s["description"],
                        "duration_ms":   s["duration_ms"],
                    }
                    for s in stoppages
                ],
                "telemetry_available": telemetry is not None,
                "telemetry": telemetry,
            })
        except Exception:
            continue  # Veri eksikse tarihi atla

    return {"status": "success", "data": result}


# ──────────────────────────────────────────────────────────────
# POST /api/simulate
# WhatIfAnalysis.jsx → api.simulate(payload) bunu çağırır
# ──────────────────────────────────────────────────────────────
@app.post("/api/simulate")
def simulate(req: SimulateRequest):
    """
    OEE What-If simülasyonu çalıştırır ve
    WhatIfAnalysis.jsx'in beklediği formatta sonuç döndürür.
    """
    try:
        baseline = twin.fetch_date_baseline(req.unit_uid, req.target_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Kullanıcı telemetri override'larını uygula
    # (twin._calc_scrap_rate doğrudan çağrılabilmesi için
    #  calculate_telemetry_zscores monkey-patch ediyoruz)
    original_telemetry_fn = twin.calculate_telemetry_zscores

    if req.temperature is not None or req.pressure is not None:
        base_tel = twin.calculate_telemetry_zscores(req.target_date) or {
            "temp_zscore": 1.44,
            "pressure_zscore": 1.20,
            "speed_deviation_pct": 0.05,
        }
        overridden = {
            "temp_zscore":          req.temperature if req.temperature is not None else base_tel["temp_zscore"],
            "pressure_zscore":      req.pressure    if req.pressure    is not None else base_tel["pressure_zscore"],
            "speed_deviation_pct":  base_tel.get("speed_deviation_pct", 0.05),
        }
        twin.calculate_telemetry_zscores = lambda _date: overridden

    try:
        result = twin.simulate_oee(
            baseline            = baseline,
            reduce_unplanned_pct= req.downtimeReductionPercent / 100.0,
            speedup_cycle_pct   = req.cycleSpeedupPercent       / 100.0,
            target_date         = req.target_date,
            unit_uid            = req.unit_uid,
            revenue_per_part    = req.partMargin,
            hourly_machine_cost = req.hourlyCost,
        )
    finally:
        # Her zaman orijinal fonksiyonu geri yükle
        twin.calculate_telemetry_zscores = original_telemetry_fn

    # JSX'in beklediği alan adlarına map et
    return {
        "status": "success",
        "data": {
            "baseline":  {
                "A":   result["baseline"]["A"],
                "P":   result["baseline"]["P"],
                "Q":   result["baseline"]["Q"],
                "OEE": result["baseline"]["OEE"],
            },
            "simulated": {
                "A":   result["simulated"]["A"],
                "P":   result["simulated"]["P"],
                "Q":   result["simulated"]["Q"],
                "OEE": result["simulated"]["OEE"],
            },
            "good_count_base":  result["good_count_base"],
            "extra_parts":      result["extra_parts"],
            "scrap_count":      result["scrap_count"],
            "final_good_count": result["final_good_count"],
            "freed_minutes":    result["freed_minutes"],
            "p_capped":         result["p_capped"],
            "rca_available":    result["rca_available"],
            "financial":        result["financial"],
            "stoppages":        result["stoppages"],
            "chart_data":       result["chart_data"],
        },
    }


# ──────────────────────────────────────────────────────────────
# GET /api/dashboard_summary
# DigitalFactoryHub.jsx için genel özet verileri
# ──────────────────────────────────────────────────────────────
@app.get("/api/dashboard_summary")
def get_dashboard_summary():
    """
    RCA dosyası ve baz alınan OEE değerleri üzerinden ana sayfa
    (dashboard) göstergeleri için özet verileri döner.
    """
    try:
        data = twin.get_dashboard_summary()
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────
# GET /health  — basit sağlık kontrolü
# ──────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status":       "ok",
        "fallback_mode": twin.use_fallback,
    }


# ──────────────────────────────────────────────────────────────
# Çalıştırma: uvicorn api:app --reload --port 8000
# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)