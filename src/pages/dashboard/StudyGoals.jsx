import { useState } from "react";
import {
  CalendarDays,
  CircleCheck,
  Clock3,
  Target,
  UserRound,
} from "lucide-react";

import { ParentLayout } from "../../components/ui/CommonUI";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { child, parent, studyGoalMock } from "../../data/mockData";

import flagPending from "../../assets/flag1.jpg";
import flagEmpty from "../../assets/flag2.png";
import goalMountain from "../../assets/mount.png";
import weightImage from "../../assets/weight.png";
import calendarImage from "../../assets/calender.jpg";
import activeGoalIcon from "../../assets/arrow.jpg";

import "../../css/dashboard/StudyGoals.css";

const initialGoal = {
  ...studyGoalMock,
  targetMinutes: 300,
  completedMinutes: 180,
  frequency: "Weekly",
  cycle: "Sep 8 – Sep 14",
  daysRemaining: 3,
  suggestedBy: parent.firstName,
  acceptedBy: child.preferredName,
  dailyProgress: [
    { day: "Monday", minutes: 40 },
    { day: "Tuesday", minutes: 55 },
    { day: "Wednesday", minutes: 0 },
    { day: "Thursday", minutes: 35 },
  ],
};

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
  const [view, setView] = useState("empty");
  const [hours, setHours] = useState(5);
  const [goal, setGoal] = useState(initialGoal);

  function submitGoal(event) {
    event.preventDefault();

    setGoal((current) => ({
      ...current,
      targetMinutes: Number(hours) * 60,
    }));

    setView("pending");
  }

  const percentage = Math.round(
    (goal.completedMinutes / goal.targetMinutes) * 100
  );

  return (
    <div className="study-goals-page-shell">
      <DashboardHeader activePage="study-goals" />

      <ParentLayout>
        <main className="study-goals-page">
          <header className="study-goals-heading">
            <h1>Study Goals</h1>

            <p>
              {view === "create"
                ? `Create a study-time goal for ${child.preferredName} to review and accept.`
                : `Track progress toward ${child.preferredName}’s current study-time goal.`}
            </p>
          </header>

          {view === "empty" && (
            <section className="goal-empty-state">
              <span className="state-label">No active goal</span>

              <div className="goal-empty-content">
                <img src={flagEmpty} alt="" />
                <h2>No study goal yet</h2>
                <p>
                  Create a study-time goal for {child.preferredName} and send
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
                <h2>Set {child.preferredName}’s weekly goal</h2>

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
                  <p>Waiting for {child.preferredName} to accept this goal.</p>
                </div>
              </div>

              <GoalDetails goal={goal} />

              {/* للتجربة فقط؛ احذفيه عند ربط قبول الطفل بالباك إند */}
              <button
                className="demo-accept-button"
                onClick={() => setView("active")}
                type="button"
              >
                Mark as accepted
              </button>
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