// ============================================================
// home.js — بيانات الصفحة الرئيسية (Overview)
// ============================================================

import { apiGet } from "./apiClient";

export function getStudyOverview() {
  return apiGet("/api/home/study-overview");
}

export function getStreak() {
  return apiGet("/api/home/streak");
}

export function getSessionsByDay() {
  return apiGet("/api/home/sessions-by-day");
}
