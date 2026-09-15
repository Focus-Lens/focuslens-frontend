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
  }).then((data) => ({
    ...data,
    items: (data?.items ?? []).map((session) => ({
      ...session,
      id: session.sessionId,
      date: session.startedAtUtc,
      durationMinutes: session.actualDurationMinutes,
      format: session.mode,
      status: session.status?.toLowerCase(),
      subjectCode: session.subject?.slice(0, 2).toUpperCase() ?? "ST",
      completionPercent: session.completionPercentage,
      aiAnalysisAvailable:
        session.focusScore != null || session.understandingScore != null,
      focusTrend: session.understandingTrend?.toLowerCase(),
    })),
  }));
}

export function getSessionDetail(sessionId, { studentId } = {}) {
  return apiGet(`/api/reports/sessions/${sessionId}`, {
    query: { studentId },
  }).then((session) =>
    session
      ? {
          ...session,
          id: session.sessionId,
          date: session.startedAtUtc,
          format: session.mode,
          status: session.status?.toLowerCase(),
          durationMinutes: session.actualDurationMinutes,
          completionPercent: session.completionPercentage,
          focusQuality: session.focusState,
          focusTrend: session.focusTrend?.toLowerCase(),
          supportiveContext: {
            title: "Session summary",
            description: session.summary,
          },
          learningResults: {
            available: session.questionsGenerated > 0,
            resultPercent: session.learningPercentage,
            mcqScore: session.correctQuestions,
            totalQuestions: session.questionsGenerated,
            questionsCompleted: session.questionsGenerated,
            correctAnswers: session.correctQuestions,
            attempts: session.attempts,
            highlights: session.highlights ?? [],
          },
        }
      : null
  );
}
