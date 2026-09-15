import { apiDelete, apiGet, apiPost } from "./apiClient";

function mapGoal(data) {
  if (!data) return null;

  const goal = data.goal ?? data.currentStudyGoal ?? data;
  const progress = data.currentStudyGoalProgress ?? {};

  return {
    ...goal,
    id: data.id ?? data.currentStudyGoalAcceptedProposal?.id,
    status: data.status ?? (data.currentStudyGoal ? "active" : null),
    frequency: goal.period ?? "Weekly",
    completedMinutes: progress.completedMinutes ?? 0,
    weekStart: progress.startsOn ?? goal.startDate ?? "Current week",
    weekEnd: progress.endsOn ?? "Current week",
    daysRemaining: progress.daysRemaining ?? 0,
    dailyProgress: (progress.days ?? []).map((day) => ({
      day: day.date,
      minutes: day.actualStudyMinutes ?? 0,
    })),
    suggestedBy: data.suggestedByParentName,
  };
}

export function getStudyGoal(studentId) {
  return apiGet(`/api/parents/students/${studentId}/dashboard`).then((data) => {
    if (data?.pendingStudyGoalProposal) {
      return mapGoal(data.pendingStudyGoalProposal);
    }

    if (!data?.currentStudyGoal) return null;

    return mapGoal(data);
  });
}

export function createStudyGoal({ studentId, targetMinutes }) {
  return apiPost(`/api/parents/students/${studentId}/study-goal-proposals`, {
    period: "Weekly",
    targetHours: Number(targetMinutes) / 60,
  }).then(mapGoal);
}

export function cancelStudyGoal(proposalId) {
  return apiDelete(`/api/parents/study-goal-proposals/${proposalId}`);
}
