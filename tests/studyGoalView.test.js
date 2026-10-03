import test from "node:test";
import assert from "node:assert/strict";
import { getStudyGoalView } from "../src/services/studyGoalView.js";

test("shows the empty state when no pending or accepted goal exists", () => {
  assert.equal(
    getStudyGoalView({
      pendingStudyGoalProposal: null,
      currentStudyGoal: null,
      currentStudyGoalAcceptedProposal: null,
    }),
    "empty",
  );
});

test("shows a pending proposal before any active goal", () => {
  assert.equal(
    getStudyGoalView({
      pendingStudyGoalProposal: { status: "Pending", goal: { targetMinutes: 600 } },
      currentStudyGoal: null,
      currentStudyGoalAcceptedProposal: null,
    }),
    "pending",
  );
});

test("shows an accepted proposal as active when currentStudyGoal is null", () => {
  assert.equal(
    getStudyGoalView({
      pendingStudyGoalProposal: null,
      currentStudyGoal: null,
      currentStudyGoalAcceptedProposal: {
        status: "Accepted",
        goal: { period: "Weekly", targetMinutes: 600, startDate: "2026-09-27" },
      },
    }),
    "active",
  );
});
