// ============================================================
// reports.js — جلسات المذاكرة (Reports + SessionInsight)
// ============================================================

import { apiGet } from "./apiClient";

export function getSessions({
  studentId,
  dateFrom,
  dateTo,
  subjectId,
  status,
  page,
  pageSize,
} = {}) {
  return apiGet("/api/reports/sessions", {
    query: {
      studentId,
      dateFrom,
      dateTo,
      subjectId,
      status,
      page,
      pageSize,
    },
  });
}

export function getSessionDetail(sessionId, { studentId } = {}) {
  return apiGet(`/api/reports/sessions/${sessionId}`, {
    query: { studentId },
  });
}
