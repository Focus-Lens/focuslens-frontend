import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CircleCheck,
  Clock3,
  Mail,
  Target,
  UserRound,
} from "lucide-react";

import { ParentLayout } from "../../components/ui/CommonUI";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { api } from "../../services/api";
import {
  cacheParentChildren,
  findConnectedChild,
  findPendingChild,
  getCachedParentChildren,
} from "../../services/parentChildrenCache";
import { getPendingInvitationForUser } from "../../services/pendingInvitationCache";
import { useAuth } from "../../context/AuthContext";

import flagPending from "../../assets/flag1.jpg";
import flagEmpty from "../../assets/flag2.png";
import goalMountain from "../../assets/mount.png";
import weightImage from "../../assets/weight.png";
import calendarImage from "../../assets/calender.jpg";
import activeGoalIcon from "../../assets/arrow.jpg";

import "../../css/dashboard/StudyGoals.css";

function GoalDetails({ goal, showAcceptance = false }) {
  return (
    <div className="study-goal-details">
      <h3>Goal details</h3>

      <p>
        <span><CalendarDays size={14} /> Frequency</span>
        <b>{goal.frequency}</b>
      </p>

      <p>
        <span><Target size={14} /> Target</span>
        <b>{Math.round(goal.targetMinutes / 60)} hours</b>
      </p>

      <p>
        <span><CalendarDays size={14} /> Cycle</span>
        <b>{goal.cycle}</b>
      </p>

      <p>
        <span><UserRound size={14} /> Suggested by</span>
        <b>{goal.suggestedBy}</b>
      </p>

      {showAcceptance && (
        <p>
          <span><CircleCheck size={14} /> Acceptance</span>
          <b>Accepted by {goal.acceptedBy}</b>
        </p>
      )}
    </div>
  );
}

function StudyGoalsUnavailable({ childName }) {
  const isPending = Boolean(childName);
  const displayName = childName || "your child";

  return (
    <main className="study-goals-page study-goals-unavailable-page">
      <header className="study-goals-heading">
        <h1>Study Goals</h1>
        <p>
          {isPending
            ? `Track progress toward ${displayName}’s current study-time goal.`
            : "Track progress toward your child’s current study-time goal."}
        </p>
      </header>

      <section className="study-goals-unavailable-card" aria-labelledby="study-goals-unavailable-title">
        {isPending ? (
          <span className="study-goals-unavailable-icon" aria-hidden="true">
            <Mail size={25} strokeWidth={2} />
          </span>
        ) : (
          <img src={flagEmpty} alt="" />
        )}
        {isPending && <span className="study-goals-pending-badge">Invitation pending</span>}
        <h2 id="study-goals-unavailable-title">
          {isPending ? `Waiting for ${displayName} to accept` : "Add a child to see progress"}
        </h2>
        <p>
          {isPending
            ? `An invitation has been sent to ${displayName}. Study Goals will appear after the connection is approved and study activity begins.`
            : "Enter your child’s information and send an invitation. Progress will appear after the connection is approved and study activity begins."}
        </p>
        <Link to={isPending ? "/children" : "/choose-start"}>
          {isPending ? "Manage invitation" : "Add child information"}
        </Link>
        {isPending && <small className="study-goals-pending-note">You can resend or cancel the invitation from Children.</small>}
      </section>
    </main>
  );
}

export default function StudyGoals() {
  const { user } = useAuth();
  const [view, setView] = useState("empty");
  const [hours, setHours] = useState(5);
  const [dashboard, setDashboard] = useState(null);
  const [goalError, setGoalError] = useState("");
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [childInfo, setChildInfo] = useState(() => findConnectedChild(getCachedParentChildren()));
  const [pendingChild, setPendingChild] = useState(
    () => findPendingChild(getCachedParentChildren()) || getPendingInvitationForUser(user?.email)
  );

  useEffect(() => {
    let active = true;
    api("/api/parents/overview/children")
      .then(async (children) => {
        if (!active) return;
        cacheParentChildren(children);
        const connectedChild = findConnectedChild(children);
        setChildInfo(connectedChild);
        setPendingChild(
          findPendingChild(children) || getPendingInvitationForUser(user?.email)
        );
        if (connectedChild?.studentId) {
          const nextDashboard = await api(
            `/api/parents/students/${connectedChild.studentId}/dashboard`,
          ).catch(() => null);
          if (active) {
            setDashboard(nextDashboard);
            setView(nextDashboard?.pendingStudyGoalProposal ? "pending" : nextDashboard?.currentStudyGoal ? "active" : "empty");
            setHours(nextDashboard?.currentStudyGoal?.targetMinutes / 60 || 5);
          }
        } else if (active) {
          setDashboard(null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!active) return;
      });
    return () => { active = false; };
  }, [user?.email]);

  async function submitGoal(event) {
    event.preventDefault();
    if (!childInfo?.studentId) return;
    try {
      setGoalError("");
      setIsSubmittingGoal(true);
      const proposal = await api(
        `/api/parents/students/${childInfo.studentId}/study-goal-proposals`,
        { method: "POST", body: { period: "Weekly", targetHours: Number(hours) } },
      );
      setDashboard((current) => ({ ...current, pendingStudyGoalProposal: proposal }));
      setView("pending");
    } catch (error) {
      setGoalError(error.message || "We couldn’t create the goal. Please try again.");
    } finally {
      setIsSubmittingGoal(false);
    }
  }

  const displayName = childInfo?.firstName || "your child";
  const pendingGoal = dashboard?.pendingStudyGoalProposal;
  const activeGoal = dashboard?.currentStudyGoal;
  const activeProgress = dashboard?.currentStudyGoalProgress;
  const goal = toDisplayGoal(
    view === "pending" ? pendingGoal?.goal : activeGoal,
    view === "pending" ? pendingGoal : dashboard?.currentStudyGoalAcceptedProposal,
    activeProgress,
    displayName,
  );
  const percentage = Math.min(100, Math.round(goal?.completionPercentage || 0));

  if (!childInfo) {
    return (
      <div className="study-goals-page-shell">
        <DashboardHeader activePage="study-goals" />
        <ParentLayout><StudyGoalsUnavailable childName={pendingChild?.firstName} /></ParentLayout>
      </div>
    );
  }

  return (
    <div className="study-goals-page-shell">
      <DashboardHeader activePage="study-goals" />

      <ParentLayout>
        <main className="study-goals-page">
          <header className="study-goals-heading">
            <h1>Study Goals</h1>

            <p>
              {view === "create"
                ? `Create a study-time goal for ${displayName} to review and accept.`
                : `Track progress toward ${displayName}’s current study-time goal.`}
            </p>
          </header>

          {view === "empty" && (
            <section className="goal-empty-state">
              <span className="state-label">No active goal</span>

              <div className="goal-empty-content">
                <img src={flagEmpty} alt="" />
                <h2>No study goal yet</h2>
                <p>
                  Create a study-time goal for {displayName} and send
                  it for acceptance.
                </p>

                <button onClick={() => setView("create")} type="button">
                  Create study goal
                </button>
              </div>
            </section>
          )}

          {view === "create" && (
            <section className="goal-form-card">
              <form onSubmit={submitGoal}>
                <h2>Set {displayName}’s weekly goal</h2>

                <p>
                  A new study-time goal is required at the start of each week.
                </p>

                <span className="goal-type">Weekly goal</span>

                <label>
                  Weekly study target
                  <input
                    min="1"
                    onChange={(event) => setHours(event.target.value)}
                    type="number"
                    value={hours}
                  />
                  <small>Hours per week</small>
                </label>

                <label>
                  <input disabled value="Current week · Set automatically" />
                </label>

                <div className="goal-form-actions">
                  <button
                    onClick={() => setView("empty")}
                    type="button"
                  >
                    Back
                  </button>

                  <button disabled={isSubmittingGoal} type="submit">
                    {isSubmittingGoal ? "Sending..." : "Add weekly goal"}
                  </button>
                </div>
                {goalError && <p className="goal-form-error" role="alert">{goalError}</p>}
              </form>
            </section>
          )}

          {view === "pending" && (
            <section className="goal-pending-state">
              <span className="state-label">Pending acceptance</span>

              <div className="goal-pending-header">
                <img src={flagPending} alt="" />

                <div>
                  <span className="pending-badge">● Pending</span>
                  <h2>Goal awaiting acceptance</h2>
                  <p>Waiting for {displayName} to accept this goal.</p>
                </div>
              </div>

              <GoalDetails goal={goal} />

            </section>
          )}

          {view === "active" && (
            <>
              <section className="active-goal-card">
                <div className="active-goal-top">
                  <div className="active-goal-title">
                    <span className="active-goal-icon">
                      <img src={activeGoalIcon} alt="" />
                    </span>

                    <h2>Active Goal</h2>

                    <span className="on-track-badge">
                      ● On track
                    </span>
                  </div>

                  <span className="days-remaining">
                    <Clock3 size={16} strokeWidth={1.8} />
                    {goal.daysRemaining} days remaining
                  </span>
                </div>

                <div className="active-goal-body">
                  <div className="active-goal-progress">
                    <strong>{Math.round(goal.completedMinutes / 60)}</strong>
                    <span>of {Math.round(goal.targetMinutes / 60)} hours</span>
                    <b>{percentage}% completed</b>

                    <div className="active-progress-track">
                      <i style={{ width: `${percentage}%` }} />
                      <span style={{ left: `${percentage}%` }}>★</span>
                    </div>

                    <small>0 min</small>
                    <small>{Math.round(goal.targetMinutes / 60)} hours</small>
                  </div>

                  <img
                    className="active-goal-visual"
                    src={goalMountain}
                    alt=""
                  />

                  <GoalDetails goal={goal} showAcceptance />
                </div>
              </section>

              <div className="study-goals-grid">
                <section className="study-goals-card weekly-progress-card">
                  <div className="study-goals-card-title">
                    <img src={calendarImage} alt="" />
                    <div>
                      <h2>This week</h2>
                      <p>Study time by day</p>
                    </div>
                  </div>

                  <div className="weekly-bars">
                    {goal.dailyProgress.map((item) => (
                      <div className="weekly-day" key={item.day}>
                        <small>{item.day}</small>
                        <b>
                          {item.minutes ? `${item.minutes} min` : "No session"}
                        </b>

                        <i
                          className={!item.minutes ? "empty" : ""}
                          style={{
                            height: item.minutes
                              ? `${Math.max(42, item.minutes * 1.2)}px`
                              : "76px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="study-goals-card goal-insight-card">
                  <img src={weightImage} alt="" />
                  <h2>Study time and focus quality are different</h2>
                  <p>
                    Completing a time goal does not automatically mean that
                    focus quality was high.
                  </p>
                  <Link to="/progress">View focus progress →</Link>
                </section>
              </div>
            </>
          )}
        </main>
      </ParentLayout>
    </div>
  );
}

function toDisplayGoal(goal, proposal, progress, childName) {
  if (!goal) return null;
  const startsOn = progress?.startsOn || goal.startDate;
  const endsOn = progress?.endsOn || goal.startDate;
  const cycle = startsOn && endsOn
    ? `${formatDate(startsOn)} – ${formatDate(endsOn)}`
    : "Current cycle";
  const dailyProgress = progress?.days?.map((day) => ({
    day: new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" }),
    minutes: day.actualStudyMinutes || 0,
  })) || [];
  return {
    frequency: goal.period,
    targetMinutes: goal.targetMinutes,
    completedMinutes: progress?.completedMinutes || 0,
    completionPercentage: progress?.completionPercentage || 0,
    cycle,
    daysRemaining: progress?.daysRemaining ?? 0,
    suggestedBy: proposal?.suggestedByParentName || "your parent",
    acceptedBy: childName,
    dailyProgress,
  };
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
