/**
 * api.js — Industrial Digital Twin Frontend Servis Katmanı
 * WhatIfAnalysis.jsx: import { api } from '../services/api';
 *
 * Bu dosyayı src/services/api.js konumuna koyun.
 */

const BASE_URL = import.meta.env?.VITE_API_URL ?? "http://localhost:8000";

// ──────────────────────────────────────────────────────────────
// Yardımcı: fetch wrapper + hata yönetimi
// ──────────────────────────────────────────────────────────────
async function request(method, path, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE_URL}${path}`, options);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        status: "error",
        message: errData?.detail ?? `HTTP ${res.status}`,
      };
    }

    return await res.json();
  } catch (err) {
    console.error(`[api] ${method} ${path} →`, err);
    return { status: "error", message: err.message };
  }
}

// ──────────────────────────────────────────────────────────────
// GET /api/dates/{unit_uid}
// Döndürür: { status, data: [ { date, baseline, stoppages,
//             telemetry_available, telemetry } ] }
// ──────────────────────────────────────────────────────────────
async function getAvailableDates(unitUid) {
  return request("GET", `/api/dates/${unitUid}`);
}

// ──────────────────────────────────────────────────────────────
// POST /api/simulate
// payload: {
//   unit_uid, target_date,
//   downtimeReductionPercent, cycleSpeedupPercent,
//   hourlyCost, partMargin,
//   temperature?, pressure?
// }
// Döndürür: { status, data: { baseline, simulated, financial,
//             stoppages, ... } }
// ──────────────────────────────────────────────────────────────
async function simulate(payload) {
  return request("POST", "/api/simulate", payload);
}

// ──────────────────────────────────────────────────────────────
// GET /health
// ──────────────────────────────────────────────────────────────
async function health() {
  return request("GET", "/health");
}

// ──────────────────────────────────────────────────────────────
// GET /api/dashboard_summary
// ──────────────────────────────────────────────────────────────
async function getDashboardSummary() {
  return request("GET", "/api/dashboard_summary");
}

export const api = { getAvailableDates, simulate, health, getDashboardSummary };