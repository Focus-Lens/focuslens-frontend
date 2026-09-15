// ============================================================
// progress.js — تقدّم الطفل (Progress page)
// ============================================================

import { apiGet } from "./apiClient";

export function getProgress({ studentId, range, dateFrom, dateTo } = {}) {
  return apiGet("/api/progress", {
    query: { studentId, range, dateFrom, dateTo },
  });
}

export function getBehavioralProgress({ studentId, range } = {}) {
  return apiGet("/api/progress/behavioral", {
    query: { studentId, range },
  });
}
