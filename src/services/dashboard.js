import { apiGet } from "./apiClient";

export function getParentDashboard(studentId) {
  return apiGet(`/api/parents/students/${studentId}/dashboard`).then((data) => {
    const pulse = data?.weeklyStudyPulse ?? {};
    const goal = data?.currentStudyGoal;
    const goalProgress = data?.currentStudyGoalProgress;

    return {
      ...data,
      weeklyMinutes: pulse.actualStudyMinutes ?? 0,
      previousWeekMinutes: pulse.previousPeriodActualStudyMinutes ?? 0,
      dailyStudyMinutes: (pulse.days ?? []).map((day) => ({
        date: day.date,
        minutes: day.actualStudyMinutes ?? 0,
      })),
      activeGoal: goal
        ? {
            ...goal,
            completedMinutes: goalProgress?.completedMinutes ?? 0,
            completionPercentage: goalProgress?.completionPercentage ?? 0,
            daysRemaining: goalProgress?.daysRemaining ?? 0,
            startsOn: goalProgress?.startsOn,
            endsOn: goalProgress?.endsOn,
            dailyProgress: goalProgress?.days ?? [],
          }
        : null,
      recentSessions: (data?.recentStudySessions ?? []).map((session) => ({
        ...session,
        subject: session.subjectName,
        date: session.startedAtUtc,
        durationMinutes: session.actualStudyMinutes,
        format: session.mode,
      })),
      completedSessionsThisWeek: data?.completedSessionsCount ?? 0,
      sessionsThisWeek: data?.completedSessionsCount ?? 0,
      activeStudyDays: data?.activeStudyDaysCount ?? 0,
    };
  });
}
