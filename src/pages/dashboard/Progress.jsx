import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowUp,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Info,
  Mail,
  Moon,
  Sun,
  TrendingUp,
  X,
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

import arrowImage from "../../assets/arrow.jpg";
import mathImage from "../../assets/math.jpg";
import clockImage from "../../assets/clock.jpg";

import "../../css/dashboard/Progress.css";

function formatStudyTime(minutes) {
  const safeMinutes = Number(minutes) || 0;

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export default function Progress() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [range, setRange] = useState("30");

  const [selectedSubjectName, setSelectedSubjectName] = useState("");

  const [selectedTimePeriod, setSelectedTimePeriod] = useState("Afternoon");
  const [childInfo, setChildInfo] = useState(() => findConnectedChild(getCachedParentChildren()));
  const [pendingChild, setPendingChild] = useState(
    () => findPendingChild(getCachedParentChildren()) || getPendingInvitationForUser(user?.email)
  );
  const [dashboard, setDashboard] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

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
          const [dashboardData, history] = await Promise.all([
            api(`/api/parents/students/${connectedChild.studentId}/dashboard`).catch(() => null),
            api(`/api/parents/students/${connectedChild.studentId}/dashboard/sessions?page=1&pageSize=100`).catch(() => null),
          ]);
          if (active) {
            setDashboard(dashboardData);
            setSessionHistory(history?.sessions || dashboardData?.recentStudySessions || []);
          }
        } else if (active) {
          setDashboard(null);
          setSessionHistory([]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!active) return;
      });
    return () => { active = false; };
  }, [user?.email]);

  const subjects = useMemo(() => buildSubjectStats(sessionHistory), [sessionHistory]);
  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.name === selectedSubjectName) || subjects[0],
    [selectedSubjectName, subjects],
  );
  const pulseDays = dashboard?.weeklyStudyPulse?.days || [];
  const focusPoints = pulseDays.map(() => dashboard?.focusQuality ?? 0);

  const chartWidth = 330;
  const chartHeight = 150;

  const chartCoordinates = focusPoints
    .map((value, index) => {
      const x =
        index *
        (chartWidth / Math.max(focusPoints.length - 1, 1));

      const y = chartHeight - value;

      return `${x},${y}`;
    })
    .join(" ");

  const studyPoints = pulseDays.map((day) => day.actualStudyMinutes || 0);
  const maxStudyMinutes = Math.max(1, ...studyPoints);
  const hasActivity = sessionHistory.length > 0 || (dashboard?.weeklyStudyPulse?.actualStudyMinutes || 0) > 0;

  if (!childInfo) {
    return (
      <div className="progress-page-shell">
        <DashboardHeader activePage="progress" />
        <ParentLayout>
          <ProgressUnavailable
            childName={pendingChild?.firstName}
            onAction={() => navigate(pendingChild ? "/children" : "/choose-start")}
          />
        </ParentLayout>
      </div>
    );
  }

  if (!hasActivity) {
    return (
      <div className="progress-page-shell">
        <DashboardHeader activePage="progress" />
        <ParentLayout>
          <main className="progress-page progress-empty-connected-page">
            <header className="progress-heading">
              <div>
                <h1>Progress</h1>
                <p>See how focus quality and study patterns change over time.</p>
              </div>
            </header>
            <section className="progress-connected-empty-card">
              <span className="progress-empty-spark"><TrendingUp size={30} /></span>
              <h2>{childInfo.firstName || "Your child"}&apos;s progress will grow here</h2>
              <p>
                There&apos;s no shared study activity yet. Once {childInfo.firstName || "your child"}
                records sessions, this page will show real study time, focus quality, and subject progress.
              </p>
              <div>
                <span>Study time</span><b>0m</b>
                <span>Focus quality</span><b>Not available yet</b>
                <span>Sessions</span><b>0</b>
              </div>
            </section>
          </main>
        </ParentLayout>
      </div>
    );
  }

  return (
    <div className="progress-page-shell">

      {/* 
        null = مفيش أي item في الـ navbar Active
        لو عايزة Progress يبقى Active:
        activePage="progress"
      */}
      <DashboardHeader activePage="progress" />

      <ParentLayout>
        <main className="progress-page">

          {/* =========================
              Heading
          ========================= */}

          <header className="progress-heading">
            <div>
              <h1>Progress</h1>

              <p>
                See how focus quality and study patterns change
                over time.
              </p>
            </div>

            <div className="progress-ranges">
              <button
                className={range === "7" ? "active" : ""}
                onClick={() => setRange("7")}
                type="button"
              >
                Last 7 days
              </button>

              <button
                className={range === "30" ? "active" : ""}
                onClick={() => setRange("30")}
                type="button"
              >
                Last 30 days
              </button>

              <button
                className={range === "custom" ? "active" : ""}
                onClick={() => setRange("custom")}
                type="button"
              >
                Custom range
              </button>
            </div>
          </header>


          {/* =========================
              Main content
          ========================= */}

          <div className="progress-main-grid">

            {/* =========================
                LEFT
            ========================= */}

            <div className="progress-left">

              {/* =========================
                  Focus quality
              ========================= */}

              <section className="progress-chart-card">
                <h2>Focus quality over time</h2>

                <div className="progress-main-number">

                  <span className="progress-number-icon">
                    <img
                      src={arrowImage}
                      alt=""
                    />
                  </span>

                  <strong>
                    {dashboard?.focusQuality != null ? `${dashboard.focusQuality}%` : "—"}
                  </strong>
                </div>

                <span className="progress-change positive">
                  <ArrowUp
                    size={14}
                    strokeWidth={2.2}
                  />

                  {dashboard?.focusQuality != null
                    ? "Average shared focus quality"
                    : "Focus quality has not been shared"}
                </span>

                <div className="focus-chart">

                  <div className="focus-y-axis">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>

                  <div className="focus-chart-area">

                    <svg
                      aria-label="Focus quality over time"
                      className="progress-line-chart"
                      viewBox="0 0 330 150"
                      preserveAspectRatio="none"
                    >

                      <defs>
                        <linearGradient
                          id="focusAreaGradient"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#8138f4"
                            stopOpacity="0.18"
                          />

                          <stop
                            offset="100%"
                            stopColor="#8138f4"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>

                      <line
                        x1="0"
                        x2="330"
                        y1="0"
                        y2="0"
                      />

                      <line
                        x1="0"
                        x2="330"
                        y1="37.5"
                        y2="37.5"
                      />

                      <line
                        x1="0"
                        x2="330"
                        y1="75"
                        y2="75"
                      />

                      <line
                        x1="0"
                        x2="330"
                        y1="112.5"
                        y2="112.5"
                      />

                      <line
                        x1="0"
                        x2="330"
                        y1="150"
                        y2="150"
                      />

                      <polygon
                        points={`0,${chartHeight} ${chartCoordinates} 330,${chartHeight}`}
                        fill="url(#focusAreaGradient)"
                      />

                      <polyline
                        points={chartCoordinates}
                      />

                      {focusPoints.map((value, index) => {
                        const x =
                          index *
                          (chartWidth /
                            Math.max(
                              focusPoints.length - 1,
                              1
                            ));

                        const y = chartHeight - value;

                        return (
                          <circle
                            cx={x}
                            cy={y}
                            key={`${value}-${index}`}
                            r="3"
                          />
                        );
                      })}
                    </svg>

                    <div className="focus-x-axis">
                      {pulseDays.map((day) => <span key={day.date}>{formatDay(day.date)}</span>)}
                    </div>

                  </div>
                </div>

                <p className="progress-card-note">
                  {dashboard?.focusQuality != null
                    ? "Focus quality reflects the child’s shared study activity."
                    : "Focus quality will appear after enough activity is shared."}
                </p>
              </section>


              {/* =========================
                  Study time
              ========================= */}

              <section className="progress-chart-card">

                <h2>Study time over time</h2>

                <div className="progress-main-number">

                  <span className="progress-number-icon">
                    <img
                      src={clockImage}
                      alt=""
                    />
                  </span>

                  <strong>
                    {formatStudyTime(
                      dashboard?.weeklyStudyPulse?.actualStudyMinutes
                    )}
                  </strong>

                </div>

                <span className="progress-change lime">
                  {/* <ArrowUp
                    size={14}
                    strokeWidth={2.2}
                  /> */}

                  {formatStudyTime(
                    Math.abs(dashboard?.weeklyStudyPulse?.actualStudyMinutesTrend || 0)
                  )}

                  {" "}{(dashboard?.weeklyStudyPulse?.actualStudyMinutesTrend || 0) >= 0 ? "more than previous period" : "less than previous period"}
                </span>

                <div className="study-chart">

                  <div className="study-y-axis">
                    <span>3h</span>
                    <span>2h</span>
                    <span>1h</span>
                    <span>0h</span>
                  </div>

                  <div className="study-chart-area">

                    <div className="study-grid-lines">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>

                    <div className="progress-bars-chart">

                      {studyPoints.map(
                        (minutes, index) => (
                          <div
                            className="study-bar-column"
                            key={`${minutes}-${index}`}
                          >
                            <i
                              className={
                                index ===
                                studyPoints.length - 1
                                  ? "last"
                                  : ""
                              }
                              style={{
                                height: `${Math.max(
                                  20,
                                  (minutes / maxStudyMinutes) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        )
                      )}

                    </div>

                    <div className="study-x-axis">
                      {pulseDays.map((day) => <span key={day.date}>{formatDay(day.date)}</span>)}
                    </div>

                  </div>
                </div>

              </section>


              {/* =========================
                  Subject comparison
              ========================= */}

              <section className="progress-comparison-card">

                <h2>Subject comparison</h2>

                <p>
                  Compare available study evidence across subjects.
                </p>

                <div className="progress-table-wrap">

                  <table>

                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Sessions</th>
                        <th>Study time</th>
                        <th>Focus trend</th>
                        <th>Data status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>

                      {subjects.map((subject) => (
                        <tr key={subject.name}>

                          <td className="subject-name">
                            {subject.name}
                          </td>

                          <td>
                            {subject.sessions}
                          </td>

                          <td>
                            {formatStudyTime(
                              subject.totalMinutes
                            )}
                          </td>

                          <td>

                            {subject.trend === "improving" ? (
                              <span className="table-trend improving">
                                <TrendingUp
                                  size={15}
                                  strokeWidth={2.2}
                                />
                                Improving
                              </span>
                            ) : subject.trend === "stable" ? (
                              <span className="table-trend stable">
                                <span>—</span>
                                Stable
                              </span>
                            ) : (
                              <span className="table-trend empty">
                                —
                              </span>
                            )}

                          </td>

                          <td>

                            {subject.hasEnoughData ? (
                              <span className="table-data enough">
                                <span />
                                Enough data
                              </span>
                            ) : (
                              <span className="table-data not-enough">
                                <span />
                                Not enough data yet
                              </span>
                            )}

                          </td>

                          <td>

                            <button
                              className="details-button"
                              onClick={() =>
                                setSelectedSubjectName(
                                  subject.name
                                )
                              }
                              type="button"
                            >
                              Details
                            </button>

                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              </section>


          {/* =========================
              Bottom
          ========================= */}

          <div className="progress-bottom-grid">

            {/* Time of day */}

            <section className="progress-pattern-card">

              <h2>Time-of-day pattern</h2>

              <div className="time-pattern-options">

                <button
                  className={
                    selectedTimePeriod === "Morning"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSelectedTimePeriod("Morning")
                  }
                  type="button"
                >
                  <Sun
                    size={20}
                    strokeWidth={1.8}
                  />

                  <span>Morning</span>
                </button>


                <button
                  className={
                    selectedTimePeriod === "Afternoon"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSelectedTimePeriod("Afternoon")
                  }
                  type="button"
                >
                  <span className="afternoon-sun">
                    <Sun
                      size={20}
                      strokeWidth={1.8}
                    />
                  </span>

                  <span>Afternoon</span>
                </button>


                <button
                  className={
                    selectedTimePeriod === "Evening"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSelectedTimePeriod("Evening")
                  }
                  type="button"
                >
                  <Moon
                    size={20}
                    strokeWidth={1.8}
                  />

                  <span>Evening</span>
                </button>

              </div>

              <p>
                Focus has been strongest during{" "}
                {selectedTimePeriod.toLowerCase()} sessions.
              </p>

            </section>


            {/* About */}

            <section className="progress-about-card">

              <div className="about-icon">
                <Info
                  size={15}
                  strokeWidth={2.2}
                />
              </div>

              <div>
                <h2>About this data</h2>

                <p>
                  {subjects.length} subject{subjects.length === 1 ? "" : "s"} with shared study activity.
                </p>
              </div>

            </section>

          </div>


            </div>


            {/* =========================
                Mathematics card
            ========================= */}

            <aside className="progress-subject-card">

              <button
                aria-label="Clear selected subject"
                className="subject-close"
                onClick={() =>
                  setSelectedSubjectName(
                    subjects[0]?.name || ""
                  )
                }
                type="button"
              >
                <X
                  size={18}
                  strokeWidth={1.8}
                />
              </button>

              <div className="subject-icon-box">
                <img
                  src={mathImage}
                  alt=""
                />
              </div>

              <h2>
                {selectedSubject?.name}
              </h2>

              <span
                className={
                  selectedSubject?.hasEnoughData
                    ? "subject-data-status enough"
                    : "subject-data-status not-enough"
                }
              >
                <span />

                {selectedSubject?.hasEnoughData
                  ? "Enough data"
                  : "Not enough data"}
              </span>

              <div className="subject-details">

                <p>
                  <CalendarDays
                    size={18}
                    strokeWidth={1.7}
                  />

                  <b>
                    {selectedSubject?.sessions}
                  </b>

                  sessions
                </p>

                <p>
                  <Clock3
                    size={18}
                    strokeWidth={1.7}
                  />

                  <b>
                    {formatStudyTime(
                      selectedSubject?.totalMinutes ?? 0
                    )}
                  </b>
                </p>

                <p
                  className={
                    selectedSubject?.trend === "improving"
                      ? "subject-improving"
                      : ""
                  }
                >
                  <TrendingUp
                    size={20}
                    strokeWidth={2.2}
                  />

                  <b>
                    {selectedSubject?.trend
                      ? selectedSubject.trend.charAt(0).toUpperCase() +
                        selectedSubject.trend.slice(1)
                      : "No trend yet"}
                  </b>
                </p>

              </div>

              <button
                className="progress-report-button"
                onClick={() =>
                  navigate(
                    `/reports?subject=${encodeURIComponent(
                      selectedSubject?.name ?? ""
                    )}`
                  )
                }
                type="button"
              >
                View related reports

                <ArrowUpRight
                  size={21}
                  strokeWidth={1.8}
                />
              </button>

            </aside>

          </div>


        </main>
      </ParentLayout>
    </div>
  );
}

function formatDay(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
  });
}

function buildSubjectStats(sessions) {
  const byName = new Map();
  sessions.forEach((session) => {
    const name = session.subjectName || "Study session";
    const existing = byName.get(name) || { name, sessions: 0, totalMinutes: 0 };
    existing.sessions += 1;
    existing.totalMinutes += session.actualStudyMinutes || 0;
    byName.set(name, existing);
  });
  return [...byName.values()].map((subject) => ({
    ...subject,
    trend: null,
    hasEnoughData: subject.sessions >= 3,
  }));
}

function ProgressUnavailable({ childName, onAction }) {
  const isPending = Boolean(childName);
  const displayName = childName || "your child";

  return (
    <main className="progress-page progress-unavailable-page">
      <header className="progress-heading">
        <div>
          <h1>Progress</h1>
          <p>See how focus quality and study patterns change over time.</p>
        </div>
      </header>

      <section className="progress-unavailable-card" aria-labelledby="progress-unavailable-title">
        <span className="progress-unavailable-icon" aria-hidden="true">
          {isPending ? <Mail size={25} strokeWidth={2} /> : <TrendingUp size={25} strokeWidth={2} />}
        </span>
        {isPending && <span className="progress-pending-badge">Invitation pending</span>}
        <h2 id="progress-unavailable-title">
          {isPending ? `Waiting for ${displayName} to accept` : "Add a child to see progress"}
        </h2>
        <p>
          {isPending
            ? `An invitation has been sent to ${displayName}. Progress will appear after the connection is approved and study activity begins.`
            : "Enter your child’s information and send an invitation. Progress will appear after the connection is approved and study activity begins."}
        </p>
        <button type="button" onClick={onAction}>
          {isPending ? "Manage invitation" : "Add child information"}
        </button>
        {isPending && <small className="progress-pending-note">You can resend or cancel the invitation from Children.</small>}
      </section>
    </main>
  );
}
