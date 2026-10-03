export function getStudyGoalView(dashboard) {
  if (dashboard?.pendingStudyGoalProposal) return "pending";

  if (
    dashboard?.currentStudyGoalAcceptedProposal ||
    dashboard?.currentStudyGoal
  ) {
    return "active";
  }

  return "empty";
}
