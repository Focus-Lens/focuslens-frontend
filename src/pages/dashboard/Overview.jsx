import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ArrowRight,
  Download,
  Flag,
  LineChart,
  BookOpenCheck,
  CheckCircle2,
  CalendarCheck,
  TrendingUp,
  Smartphone,
  FileText,
  UserRound,
  Check,
  BookText,
} from "lucide-react";

import { ParentLayout } from "../../components/ui/CommonUI";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  cacheParentChildren,
  findConnectedChild,
  getCachedParentChildren,
  findPendingChild,
} from "../../services/parentChildrenCache";
import {
  cachePendingInvitation,
  clearPendingInvitation,
  getPendingInvitationForUser,
} from "../../services/pendingInvitationCache";
import WaitingForChild from "../onboarding/WaitingForChild";
import elementIcon from "../../assets/elementIcon.png";
import logo from "../../assets/logo.png";

import "../../css/dashboard/Overview.css";

export default function Overview() {
  const [sessionFilter, setSessionFilter] = useState("all");
  const { user } = useAuth();
  const cachedChildren = getCachedParentChildren();
  const [childInfo, setChildInfo] = useState(() => findConnectedChild(cachedChildren));
  const [pendingChildInfo, setPendingChildInfo] = useState(
    () => findPendingChild(cachedChildren) || getPendingInvitationForUser(user?.email),
  );
  const [dashboard, setDashboard] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [sessionPagination, setSessionPagination] = useState(null);

  useEffect(() => {
    let active = true;
    api("/api/parents/overview/children").then((children) => {
      if (!active) return null;
      cacheParentChildren(children);
      const firstChild = findConnectedChild(children);
      const localPending = getPendingInvitationForUser(user?.email);
      const pendingChild = findPendingChild(children) || (!firstChild ? localPending : null);
      setPendingChildInfo(pendingChild);
      setChildInfo(firstChild);
      if (firstChild) {
        clearPendingInvitation();
      } else if (findPendingChild(children)) {
        cachePendingInvitation({
          ...localPending,
          firstName: pendingChild.firstName,
          parentEmail: user?.email,
        });
      } else if (!localPending) {
        clearPendingInvitation();
      }
      if (!firstChild) {
        setDashboard(null);
        return null;
      }
      return api(`/api/parents/students/${firstChild.studentId}/dashboard`).then(
        async (dashboardData) => {
          // The dashboard contains the summary; this endpoint provides the real
          // session total and makes the filters work beyond the latest five items.
          const history = await api(
            `/api/parents/students/${firstChild.studentId}/dashboard/sessions?page=1&pageSize=20`,
          ).catch(() => null);
          return { dashboardData, history };
        },
      );
    }).then((data) => {
      if (!data || !active) return;
      setDashboard(data.dashboardData);
      setSessionHistory(data.history?.sessions || data.dashboardData.recentStudySessions || []);
      setSessionPagination(data.history?.pagination || null);
    }).catch(() => {
      // Keep the last locally cached invitation visible if the request fails.
    });
    return () => { active = false; };
  }, [user?.email, user?.userId]);

  const childName = childInfo?.firstName || "your child";

  function handleInvitationCancelled(cancelledInvitation) {
    const cancelledId = cancelledInvitation?.childSetupDraftId || cancelledInvitation?.id;
    const remainingChildren = (getCachedParentChildren() || []).filter((item) => {
      const itemId = item.childSetupDraftId || item.id;
      return itemId !== cancelledId;
    });

    cacheParentChildren(remainingChildren);
    clearPendingInvitation();
    setPendingChildInfo(null);
  }

  const sessions = sessionHistory.map((session) => ({
    id: session.id,
    subject: session.subjectName || "Study session",
    date: new Date(session.startedAtUtc).toLocaleString(),
    duration: `${session.actualStudyMinutes} min`,
    format: session.mode,
    status: session.status,
    focus: dashboard.focusQuality ? `${dashboard.focusQuality}%` : "",
    note: "", icon: <BookText size={13} />, tone: "",
  }));

  const filteredSessions = sessions.filter((session) => {
    if (sessionFilter === "all") return true;

    return session.status.toLowerCase() === sessionFilter;
  });

  const pulse = dashboard?.weeklyStudyPulse;
  const pulseDays = pulse?.days || [];
  const peakDay = pulseDays.reduce(
    (peak, day) =>
      !peak || day.actualStudyMinutes > peak.actualStudyMinutes ? day : peak,
    null,
  );
  const pulsePoints = buildPulsePoints(pulseDays);
  const goal = dashboard?.currentStudyGoal;
  const goalProgress = dashboard?.currentStudyGoalProgress;
  const goalCompletion = Math.min(
    100,
    Math.max(0, Number(goalProgress?.completionPercentage || 0)),
  );
  const hasStudyData =
    sessions.length > 0 ||
    (pulse?.actualStudyMinutes || 0) > 0 ||
    dashboard?.focusQuality != null ||
    Boolean(goal);

  if (!childInfo && pendingChildInfo) {
    return (
      <WaitingForChild
        childName={pendingChildInfo.firstName}
        childEmail={pendingChildInfo.email}
        pendingChild={pendingChildInfo}
        onInvitationCancelled={handleInvitationCancelled}
      />
    );
  }

  if (!childInfo) {
    return (
      <div className="overview-page">
        <DashboardHeader activePage="overview" />
        <ParentLayout>
          <main className="overview-content">
            <header className="overview-heading">
              <h1>Welcome, {user?.firstName || "Parent"}</h1>
              <p>Your parent account is ready. Let’s make room for your child.</p>
            </header>
            <section className="overview-empty-card">
              <div className="overview-empty-content">
                <div className="overview-mascot"><img src={logo} alt="FocusLens" /></div>
                <h2>Your family’s FocusLens journey starts here</h2>
                <p className="overview-empty-description">You haven’t added a child yet. Create their study profile and send a private invitation, or connect with a child who already uses FocusLens.</p>
                <Link to="/choose-start" className="button">Add your child</Link>
                <p className="overview-empty-hint">Your child chooses what to share. Study reports appear only after you connect.</p>
              </div>
            </section>
          </main>
        </ParentLayout>
      </div>
    );
  }

  // A connection only gives the parent permission to see shared data. Until the
  // child records a session, never populate this view with sample statistics.
  if (!hasStudyData) {
    return (
      <div className="overview-page">
        <DashboardHeader activePage="overview" />
        <ParentLayout>
          <main className="overview-content">
            <header className="overview-heading">
              <h1>Welcome, {user?.firstName || "Parent"}</h1>
              <p>
                {childName} is connected. Shared study activity will appear
                here.
              </p>
            </header>

            <section className="overview-metrics">
              <article className="overview-metric-card">
                <CardTitle
                  icon={<LineChart size={17} />}
                  title="Weekly Study Pulse & Trend"
                  subtitle="Cumulative focus rhythm"
                />
                <div className="overview-card-empty">
                  <img className="overview-empty-mascot" src={logo} alt="" />
                  <h2>A fresh start for {childName}</h2>
                  <p>
                    Once {childName} records and shares a study session, their
                    weekly study rhythm will appear here.
                  </p>
                </div>
              </article>

              <article className="overview-metric-card">
                <CardTitle
                  icon={<img src={elementIcon} alt="" />}
                  title="Focus pattern"
                  subtitle="Recorded session density by time block"
                />
                <div className="overview-card-empty">
                  <img
                    className="overview-empty-pattern-icon"
                    src={elementIcon}
                    alt=""
                  />
                  <h2>Patterns take a little time</h2>
                  <p>
                    As shared sessions build up, you&apos;ll see when {childName}
                    tends to study. AI insights need recorded activity first.
                  </p>
                </div>
              </article>

              <article className="overview-metric-card">
                <CardTitle icon={<Flag size={17} />} title="Active Goal" />
                <div className="overview-card-empty">
                  <Flag size={38} />
                  <h2>No shared goal yet</h2>
                  <p>Suggest a gentle study-time goal. {childName} stays in control of accepting it.</p>
                  <Link to="/study-goals" className="button">Suggest a goal</Link>
                </div>
              </article>
            </section>

            <section className="overview-sessions">
              <CardTitle
                icon={<BookOpenCheck size={17} />}
                title="Recent study sessions"
                subtitle={`Verified study session records shared by ${childName}`}
              />
              <div className="overview-sessions-empty">
                <BookOpenCheck size={38} />
                <h2>No study sessions shared yet</h2>
                <p>
                  Sessions will appear here when {childName} records them and
                  chooses to share them with you.
                </p>
                <small>They stay in control of what you can see.</small>
              </div>
            </section>
          </main>
        </ParentLayout>
      </div>
    );
  }

  return (
    <div className="overview-page">
      <DashboardHeader activePage="overview" />

      <ParentLayout>
        <main className="figma-overview">
          <header className="figma-heading">
            <div>
              <h1>Good morning, {user?.firstName || "there"}</h1>

              <p>
                Here’s how {childName}’s studying is going this week.
              </p>
            </div>

            <div className="figma-heading-actions">
              <button type="button">
                <CalendarDays size={15} />
                This week
              </button>

              <Link to="/reports" className="view-report-button">
                View full report
                <ArrowRight size={15} />
              </Link>
            </div>
          </header>

          <section className="figma-top-grid">
            <article className="figma-card weekly-card">
              <CardTitle
                icon={<LineChart size={17} />}
                title="Weekly Study Pulse & Trend"
                subtitle="Cumulative focus rhythm"
              />

              <span className="green-badge">
                <TrendingUp size={12} />
                {formatTrend(pulse?.actualStudyMinutesTrend)} from last week
              </span>

              <div className="weekly-main">
                <div>
                  <strong>{formatDuration(pulse?.actualStudyMinutes || 0)}</strong>

                  <small>
                    <CheckCircle2 size={14} />
                    Shared study time this week
                  </small>
                </div>

                <div className="line-chart">
                  {peakDay?.actualStudyMinutes > 0 && (
                    <span className="chart-tip">
                      {formatDay(peakDay.date)}: {formatDuration(peakDay.actualStudyMinutes)}
                    </span>
                  )}

                  <svg
                    viewBox="0 0 260 92"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id="pulseFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#8138f4"
                          stopOpacity="0.22"
                        />
                        <stop
                          offset="100%"
                          stopColor="#8138f4"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    {pulsePoints.length > 1 && <polygon
                      fill="url(#pulseFill)"
                      points={`${pulsePoints} 250,92 10,92`}
                    />}

                    <polyline
                      className="chart-line"
                      points={pulsePoints}
                    />
                    {buildPulseCircles(pulseDays).map(({ x, y, isPeak }, index) => (
                      <circle
                        className={isPeak ? "chart-peak" : "chart-dot"}
                        cx={x}
                        cy={y}
                        r={isPeak ? "4.5" : "2.6"}
                        key={index}
                      />
                    ))}
                  </svg>

                  <div className="chart-days">
                    {pulseDays.map((day) =>
                      day === peakDay && day.actualStudyMinutes > 0 ? (
                        <b key={day.date}>{formatDay(day.date)} (Peak)</b>
                      ) : (
                        <span key={day.date}>{formatDay(day.date)}</span>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="weekly-footer">
                <span>
                  <CheckCircle2 size={13} />
                  {dashboard?.completedSessionsCount || 0} completed this week
                </span>

                <span>
                  <CalendarCheck size={13} />
                  {dashboard?.activeStudyDaysCount || 0} active study days
                </span>

                <span>
                  <TrendingUp size={13} />
                  Focus quality <b>{dashboard?.focusQuality != null ? `${dashboard.focusQuality}%` : "not shared"}</b>
                </span>
              </div>
            </article>

            <article className="figma-card focus-card">
              <CardTitle
                icon={<img src={elementIcon} alt="" />}
                title="Focus pattern"
                subtitle="Shared activity by day"
              />

              <div className="heatmap">
                <div className="heat-row days">
                  <span>Day</span>

                  {pulseDays.map((day) => (
                    <span key={day.date}>{formatDay(day.date)}</span>
                  ))}
                </div>

                <div className="heat-row">
                    <span>Minutes</span>

                    {pulseDays.map((day) => {
                      const level = intensityLevel(day.actualStudyMinutes);
                      return (
                      <i className={`level-${level}`} key={day.date}>
                        {day.actualStudyMinutes > 0 ? day.actualStudyMinutes : ""}
                      </i>
                      );
                    })}
                  </div>
              </div>

              <div className="intensity">
                <span>Intensity:</span>

                <div className="legend">
                  <span>
                    <i /> None
                  </span>

                  <span><i className="level-1" /> 1–29m</span>

                  <span>
                    <i className="level-2" /> 30–59m
                  </span>

                  <span>
                    <i className="level-3" /> 60m+
                  </span>
                </div>
              </div>

              <p className="insight">
                <b>Insight:</b>{" "}
                {dashboard?.focusQuality != null
                  ? `${childName}'s shared focus quality is ${dashboard.focusQuality}%.`
                  : `Focus-quality insights will appear when ${childName} shares enough recorded activity.`}
              </p>
            </article>
          </section>

          <section className="figma-bottom-grid">
            <article className="figma-card goal-card">
              <CardTitle icon={<Flag size={17} />} title="Active Goal" />

              <span className="weekly-label">{goal?.period || "No goal"}</span>

              {goal ? (
                <>
                  <div className="goal-number">
                    <strong>{formatDuration(goalProgress?.completedMinutes || 0)}</strong>
                    <span>of {formatDuration(goal.targetMinutes)}</span>
                    <b>{Math.round(goalCompletion)}% complete</b>
                  </div>

                  <div className="goal-progress">
                    <i style={{ width: `${goalCompletion}%` }} />
                  </div>

                  <div className="goal-badges">
                    <span><UserRound size={12} /> Suggested by {dashboard?.currentStudyGoalAcceptedProposal?.suggestedByParentName || user?.firstName || "you"}</span>
                    <span><Check size={12} /> Shared by {childName}</span>
                  </div>

                  <p>{childName} has recorded {formatDuration(goalProgress?.completedMinutes || 0)} toward this goal in the current cycle.</p>

                  <footer>
                    <span>{goalProgress?.daysRemaining ?? 0} days remaining in cycle</span>
                    <Link to="/study-goals">View goal <ArrowRight size={13} /></Link>
                  </footer>
                </>
              ) : (
                <div className="overview-card-empty">
                  <Flag size={38} />
                  <h2>No shared goal yet</h2>
                  <p>{childName} has not shared an active study goal.</p>
                  <Link to="/study-goals" className="button">Suggest a goal</Link>
                </div>
              )}
            </article>

            <article className="figma-card sessions-card">
              <div className="sessions-top">
                <CardTitle
                  icon={<BookOpenCheck size={17} />}
                  title="Recent study sessions"
                  subtitle={`Verified study session records shared by ${childName}`}
                />

                <div className="filters">
                  <div className="segmented">
                    <button
                      type="button"
                      className={sessionFilter === "all" ? "is-active" : ""}
                      onClick={() => setSessionFilter("all")}
                    >
                      All Subjects
                    </button>

                    <button
                      type="button"
                      className={
                        sessionFilter === "completed" ? "is-active" : ""
                      }
                      onClick={() => setSessionFilter("completed")}
                    >
                      Completed
                    </button>

                    <button
                      type="button"
                      className={sessionFilter === "paused" ? "is-active" : ""}
                      onClick={() => setSessionFilter("paused")}
                    >
                      In Progress
                    </button>
                  </div>

                  <button type="button" className="export-btn">
                    <Download size={12} />
                    Export log
                  </button>
                </div>
              </div>

              <div className="sessions-labels">
                <span>Date &amp; Subject</span>
                <span>Duration</span>
                <span>Format</span>
                <span>Status</span>
                <span>Focus Quality</span>
              </div>

              {filteredSessions.map((session) => (
                <div className="session" key={session.id}>
                  <div className="subject">
                    <i className={session.tone}>{session.icon}</i>

                    <div>
                      <b>{session.subject}</b>
                      <small>{session.date}</small>
                    </div>
                  </div>

                  <span className="duration">{session.duration}</span>

                  <span className="format">
                    {session.format === "Digital" ? (
                      <Smartphone size={11} />
                    ) : (
                      <FileText size={11} />
                    )}

                    {session.format}
                  </span>

                  <span
                    className={
                      session.status === "Paused" ? "paused" : "completed"
                    }
                  >
                    {session.status === "Paused"
                      ? "In Progress"
                      : session.status}
                  </span>

                  <span className="focus">
                    {session.focus && <b>{session.focus}</b>}
                    <small>{session.note}</small>
                  </span>
                </div>
              ))}

              <footer>
                <span>
                  Showing {filteredSessions.length} of {sessionPagination?.totalCount ?? sessions.length} shared sessions
                </span>

                <Link to="/reports">
                  View all shared reports
                  <ArrowRight size={13} />
                </Link>
              </footer>
            </article>
          </section>
        </main>
      </ParentLayout>
    </div>
  );
}

function formatDuration(totalMinutes) {
  const minutes = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes}m`;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatTrend(minutes) {
  const value = Number(minutes) || 0;
  if (value === 0) return "No change";
  return value > 0
    ? `${formatDuration(value)} more`
    : `${formatDuration(Math.abs(value))} less`;
}

function formatDay(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
  });
}

function intensityLevel(minutes) {
  if (minutes >= 60) return 3;
  if (minutes >= 30) return 2;
  if (minutes > 0) return 1;
  return 0;
}

function buildPulseCircles(days) {
  const highest = Math.max(1, ...days.map((day) => day.actualStudyMinutes || 0));
  const peak = Math.max(...days.map((day) => day.actualStudyMinutes || 0));
  const step = days.length > 1 ? 240 / (days.length - 1) : 0;
  return days.map((day, index) => ({
    x: 10 + step * index,
    y: 76 - ((day.actualStudyMinutes || 0) / highest) * 56,
    isPeak: peak > 0 && day.actualStudyMinutes === peak,
  }));
}

function buildPulsePoints(days) {
  return buildPulseCircles(days)
    .map(({ x, y }) => `${x},${y}`)
    .join(" ");
}

function CardTitle({ icon, title, subtitle }) {
  return (
    <div className="figma-card-title">
      <span className="figma-icon">{icon}</span>

      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}
