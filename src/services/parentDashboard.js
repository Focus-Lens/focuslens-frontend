function durationToMinutes(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const normalized = value.trim().toLowerCase();
  const sign = normalized.startsWith("-") ? -1 : 1;
  const hours = Number(normalized.match(/(\d+)\s*hours?/)?.[1] || 0);
  const minutes = Number(normalized.match(/(\d+)\s*minutes?/)?.[1] || 0);
  return sign * (hours * 60 + minutes);
}

function mapGoal(goal) {
  if (!goal) return null;
  return {
    period: goal.frequency || goal.period,
    targetMinutes: durationToMinutes(goal.target ?? goal.targetMinutes),
    startDate: goal.startsOn || goal.startDate,
    endDate: goal.endsOn || goal.endDate,
  };
}

function mapProposal(proposal) {
  if (!proposal) return null;
  const goal = mapGoal(proposal.goal || proposal);
  return {
    ...proposal,
    ...goal,
    goal,
    suggestedByParentName: proposal.suggestedBy || proposal.suggestedByParentName,
  };
}

export function mapParentStudyGoals(response) {
  if (!response) return null;
  const currentStudyGoal = mapGoal(response.currentStudyGoal);
  const progress = response.currentStudyGoalProgress;
  const thisWeek = response.thisWeek?.days || [];

  return {
    currentStudyGoal,
    currentStudyGoalProgress: progress
      ? {
          completedMinutes: durationToMinutes(progress.completed),
          completionPercentage: progress.completionPercentage,
          daysRemaining: progress.daysRemaining,
          startsOn: response.currentStudyGoal?.startsOn,
          endsOn: response.currentStudyGoal?.endsOn,
          days: thisWeek.map((day) => ({
            date: day.date,
            day: day.day,
            actualStudyMinutes: durationToMinutes(day.studyTime),
          })),
        }
      : null,
    pendingStudyGoalProposal: mapProposal(response.pendingStudyGoalProposal),
    currentStudyGoalAcceptedProposal: response.currentStudyGoalAcceptedProposal
      ? {
          suggestedByParentName: response.currentStudyGoalAcceptedProposal.suggestedBy,
          acceptedByName: response.currentStudyGoalAcceptedProposal.acceptedBy,
        }
      : null,
  };
}

export function mapParentDashboard(response) {
  if (!response) return null;
  const pulse = response.weeklyStudyPulse || {};
  return {
    ...response,
    weeklyStudyPulse: {
      actualStudyMinutes: durationToMinutes(pulse.totalStudyMinutes),
      actualStudyMinutesTrend: durationToMinutes(pulse.studyMinutesTrend),
      days: (pulse.days || []).map((day) => ({
        date: day.date,
        actualStudyMinutes: durationToMinutes(day.studyMinutes),
      })),
      peakDay: pulse.peakDay
        ? { ...pulse.peakDay, actualStudyMinutes: durationToMinutes(pulse.peakDay.studyMinutes) }
        : null,
    },
    focusPattern: {
      days: (response.focusPattern?.days || []).map((day) => ({
        day: day.day,
        sessions: (day.sessions || []).map((session) => ({
          startTime: session.startTime,
          hour: parseStudyHour(session.startTime),
          studyMinutes: durationToMinutes(session.studyMinutes),
        })),
      })),
      mostActiveTimeBlock: response.focusPattern?.mostActiveTimeBlock || null,
    },
    completedSessionsCount: pulse.completedSessions || 0,
    activeStudyDaysCount: pulse.activeStudyDays || 0,
    focusQuality: null,
    focusQualityTrend: pulse.focusQuality?.trend || null,
  };
}

function parseStudyHour(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{1,2})(?::\d{2})?\s*(AM|PM)$/i);
  if (!match) return null;
  const hour = Number(match[1]) % 12;
  return hour + (match[2].toUpperCase() === "PM" ? 12 : 0);
}

export { durationToMinutes };
