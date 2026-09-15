import { useEffect, useState } from "react";
import {
  CalendarDays,
  CircleCheck,
  Clock3,
  Target,
  UserRound,
} from "lucide-react";

import { ParentLayout } from "../../components/ui/CommonUI";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { useAuth } from "../../context/AuthContext";
import { createStudyGoal, getStudyGoal } from "../../services/studyGoals";
import { ApiError } from "../../services/apiClient";

import flagPending from "../../assets/flag1.jpg";
import flagEmpty from "../../assets/flag2.png";
import goalMountain from "../../assets/mount.png";
import weightImage from "../../assets/weight.png";
import calendarImage from "../../assets/calender.jpg";
import activeGoalIcon from "../../assets/arrow.jpg";

import "../../css/dashboard/StudyGoals.css";

function normalizeGoal(goal) {
  if (!goal) return null;
  return {
    ...goal,
    cycle: `${goal.weekStart} – ${goal.weekEnd}`,
    dailyProgress: Array.isArray(goal.dailyProgress) ? goal.dailyProgress : [],
  };
}

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

export default function StudyGoals() {
  const { child, user } = useAuth();
  const childName = child?.preferredName ?? "your child";
  const [view, setView] = useState("loading");
  const [hours, setHours] = useState(5);
  const [goal, setGoal] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadGoal() {
      if (!child?.id) {
        setView("empty");
        return;
      }
      try {
        const data = await getStudyGoal(child.id);
        if (cancelled) return;
        const normalized = normalizeGoal(data);
        setGoal(normalized);
        setView(normalized?.status === "active" ? "active" : normalized ? "pending" : "empty");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Unable to load the study goal.");
          setView("empty");
        }
      }
    }
    loadGoal();
    return () => { cancelled = true; };
  }, [child?.id]);

  async function submitGoal(event) {
    event.preventDefault();
    if (!child?.id) return;
    setError("");
    try {
      const data = await createStudyGoal({
        studentId: child.id,
        targetMinutes: Number(hours) * 60,
      });
      setGoal(normalizeGoal(data));
      setView("pending");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create the study goal.");
    }
  }

  const percentage = goal?.targetMinutes
    ? Math.min(100, Math.round((goal.completedMinutes / goal.targetMinutes) * 100))
    : 0;

  return (
    <div className="study-goals-page-shell">
      <DashboardHeader activePage="study-goals" />

      <ParentLayout>
        <main className="study-goals-page">
          <header className="study-goals-heading">
            <h1>Study Goals</h1>

            <p>
              {view === "create"
                ? `Create a study-time goal for ${childName} to review and accept.`
                : `Track progress toward ${childName}’s current study-time goal.`}
            </p>
          </header>

          {error && <p className="password-error">{error}</p>}

          {view === "loading" && <section className="goal-empty-state">Loading study goal…</section>}

          {view === "empty" && (
            <section className="goal-empty-state">
              <span className="state-label">No active goal</span>

              <div className="goal-empty-content">
                <img src={flagEmpty} alt="" />
                <h2>No study goal yet</h2>
                <p>
                  Create a study-time goal for {childName} and send
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
                <h2>Set {childName}’s weekly goal</h2>

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

                  <button type="submit">Add weekly goal</button>
                </div>
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
              <p>Waiting for {childName} to accept this goal.</p>
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

                    <GoalDetails goal={{ ...goal, suggestedBy: goal.suggestedBy || user.firstName }} showAcceptance />
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
                  <a href="/progress">View focus progress →</a>
                </section>
              </div>
            </>
          )}
        </main>
      </ParentLayout>
    </div>
  );
}
