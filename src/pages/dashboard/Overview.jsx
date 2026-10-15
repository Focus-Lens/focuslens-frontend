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
  Star,
} from "lucide-react";

import { ParentLayout } from "../../components/ui/CommonUI";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { useAuth } from "../../context/useAuth";
import { api } from "../../services/api";
import { durationToMinutes, mapParentDashboard, mapParentStudyGoals } from "../../services/parentDashboard";
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

import useTabReturnRefresh from "../../services/useTabReturnRefresh";
import "../../css/dashboard/Overview.css";

export default function Overview() {
  const [sessionFilter, setSessionFilter] = useState("all");
  const { user } = useAuth();
  // Nothing child-specific is shown until the server has answered: cached
  // copies can describe an invitation that was cancelled in the meantime.
  const [isChildrenLoaded, setIsChildrenLoaded] = useState(false);
  const [childInfo, setChildInfo] = useState(null);
  const [pendingChildInfo, setPendingChildInfo] = useState(null);
  const [pendingInvitationDetails, setPendingInvitationDetails] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [sessionPagination, setSessionPagination] = useState(null);
  const [overviewWeeks, setOverviewWeeks] = useState([]);
  const [overviewWeekStart, setOverviewWeekStart] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  // Reload when the parent returns to this tab, so changes made in another
  // browser (e.g. a cancelled invitation) show without a manual refresh.
  const tabReturnCount = useTabReturnRefresh();
  const userKey = user?.userId || user?.id;

  useEffect(() => {
    let active = true;
    // The children list has no invitation email or type, so the invitation
    // details are requested at the same time instead of after the card mounts.
    Promise.all([
      api("/api/parents/overview/children"),
      api("/api/parents/child-setups/invitations").catch(() => null),
    ]).then(([children, invitations]) => {
      if (!active) return null;
      cacheParentChildren(children);
      const firstChild = findConnectedChild(children);
      const localPending = getPendingInvitationForUser(user?.email);
      // The server list includes pending child-setup invitations, so it is the
      // source of truth; a locally cached invitation may already have been
      // cancelled (e.g. from another browser).
      const pendingChild = firstChild ? null : findPendingChild(children);
      setPendingChildInfo(pendingChild);
      setPendingInvitationDetails(
        pendingChild && Array.isArray(invitations)
          ? invitations.find((item) => item.draftId === pendingChild.childSetupDraftId) ||
              invitations[0] ||
              null
          : null,
      );
      setChildInfo(firstChild);
      // A connected child keeps the placeholder until the dashboard arrives,
      // so the empty "no data yet" view never flashes first.
      if (!firstChild) setIsChildrenLoaded(true);
      if (pendingChild) {
        cachePendingInvitation({
          ...localPending,
          firstName: pendingChild.firstName,
          parentEmail: user?.email,
        });
      } else {
        clearPendingInvitation();
      }
      if (!firstChild) {
        setDashboard(null);
        return null;
      }
      // This read may create the current StudentWeek row. Complete it before
      // requesting the dashboard, which resolves that same row as well.
      return api(`/api/parents/students/${firstChild.studentId}/overview-weeks`)
        .catch(() => null)
        .then((weeksData) => ({ firstChild, weeksData }));
    }).then((context) => {
      if (!context || !active) return null;
      const { firstChild, weeksData } = context;
      // The dashboard contains the summary; the sessions endpoint provides the
      // real session total and makes the filters work beyond the latest five
      // items. Both only need the student, so they load in parallel.
      return Promise.all([
        api(`/api/parents/students/${firstChild.studentId}/dashboard`),
        api(
          `/api/parents/students/${firstChild.studentId}/dashboard/sessions?page=1&pageSize=20`,
        ).catch(() => null),
        api(`/api/parents/students/${firstChild.studentId}/study-goals`).catch(() => null),
        api(`/api/progress/behavioral?studentId=${encodeURIComponent(firstChild.studentId)}&range=Week`).catch(() => null),
      ]).then(([dashboardData, history, goalsData, behavioralData]) => ({ dashboardData, history, goalsData, behavioralData, weeksData }));
    }).then((data) => {
      if (!data || !active) return;
      setIsChildrenLoaded(true);
      const mappedDashboard = mapParentDashboard(data.dashboardData);
      setDashboard({
        ...mappedDashboard,
        ...mapParentStudyGoals(data.goalsData),
        focusQuality: data.behavioralData?.focus?.latestScore ?? null,
        focusQualityTrend:
          mappedDashboard.focusQualityTrend || data.behavioralData?.focus?.trend || null,
      });
      setOverviewWeeks(data.weeksData?.weeks || []);
      setOverviewWeekStart(data.dashboardData.week?.startsOn || "");
      setSessionHistory(data.history?.sessions || data.dashboardData.recentStudySessions || []);
      setSessionPagination(data.history?.pagination || null);
    }).catch(() => {
      if (active) setIsChildrenLoaded(true);
    });
    return () => { active = false; };
  }, [user?.email, userKey, tabReturnCount, dashboardRefreshKey]);

  async function changeOverviewWeek(weekStart) {
    if (!childInfo?.studentId || !weekStart || weekStart === overviewWeekStart) return;
    try {
      const selectedWeek = overviewWeeks.find((week) => week.startsOn === weekStart);
      const updatedWeek = await api(`/api/parents/students/${childInfo.studentId}/overview-week`, {
        method: "PUT",
        // A null weekStart tells the API to clear the saved selection and
        // resolve the student's actual current week.
        body: { weekStart: selectedWeek?.isCurrentWeek ? null : weekStart },
      });
      setOverviewWeekStart(updatedWeek?.startsOn || weekStart);
      setDashboardRefreshKey((value) => value + 1);
    } catch (error) {
      setExportError(error.message || "We couldn’t update the selected week.");
    }
  }

  async function exportSessionLog() {
    if (!childInfo?.studentId) return;
    setIsExporting(true);
    setExportError("");
    try {
      const params = new URLSearchParams();
      if (sessionFilter !== "all") params.set("status", sessionFilter === "completed" ? "Completed" : "Paused");
      const blob = await api(`/api/parents/students/${childInfo.studentId}/dashboard/sessions/export?${params.toString()}`, { responseType: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "focuslens-study-sessions.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setExportError(error.message || "We couldn’t export the session log.");
    } finally {
      setIsExporting(false);
    }
  }

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
    duration: `${durationToMinutes(session.actualStudyMinutes)} min`,
    format: session.mode,
    status: session.status,
    focus: session.focusQuality != null ? `${session.focusQuality}%` : "",
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
  const pulseLinePath = buildSmoothPulsePath(pulseDays);
  const focusPatternDays = dashboard?.focusPattern?.days || [];
  const focusPatternRows = buildFocusPatternRows(focusPatternDays);
  const focusTrend = dashboard?.focusQualityTrend;
  const activeTimeBlock = dashboard?.focusPattern?.mostActiveTimeBlock;
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

  if (!isChildrenLoaded) {
    return (
      <div className="overview-page">
        <DashboardHeader activePage="overview" />
        <ParentLayout>
          <main className="overview-content overview-loading" aria-busy="true" aria-label="Loading your dashboard">
            <div className="overview-skeleton overview-skeleton-title" />
            <div className="overview-skeleton overview-skeleton-line" />
            <section className="overview-skeleton-card">
              <div className="overview-skeleton-row">
                <div className="overview-skeleton overview-skeleton-dot" />
                <div className="overview-skeleton overview-skeleton-label" />
                <div className="overview-skeleton overview-skeleton-pill" />
              </div>
              <div className="overview-skeleton overview-skeleton-text" />
              <div className="overview-skeleton overview-skeleton-box" />
              <div className="overview-skeleton overview-skeleton-button" />
            </section>
          </main>
        </ParentLayout>
      </div>
    );
  }

  if (!childInfo && pendingChildInfo) {
    return (
      <WaitingForChild
        childName={pendingChildInfo.firstName}
        childEmail={pendingChildInfo.email}
        pendingChild={pendingChildInfo}
        initialInvitation={pendingInvitationDetails}
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
                  <Link to="/study-goals" state={{ openCreateGoal: true }} className="button">Suggest a goal</Link>
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
              <label className="overview-week-picker">
                <CalendarDays size={15} />
                <select aria-label="Choose dashboard week" onChange={(event) => changeOverviewWeek(event.target.value)} value={overviewWeekStart}>
                  {overviewWeeks.map((week) => (
                    <option key={week.startsOn} value={week.startsOn}>
                      {week.isCurrentWeek ? "This week" : formatWeekRange(week.startsOn, week.endsOn)}
                    </option>
                  ))}
                </select>
              </label>

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
                          stopOpacity="0.16"
                        />
                        <stop
                          offset="100%"
                          stopColor="#8138f4"
                          stopOpacity="0"
                        />
                      </linearGradient>
                      <linearGradient id="pulseGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8138f4" stopOpacity="0.22" />
                        <stop offset="65%" stopColor="#8138f4" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="#8138f4" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {pulseLinePath && <path
                      className="chart-area-glow"
                      d={`${pulseLinePath} L250,92 L10,92 Z`}
                      fill="url(#pulseGlow)"
                    />}

                    {pulseLinePath && <path
                      className="chart-area"
                      d={`${pulseLinePath} L250,92 L10,92 Z`}
                      fill="url(#pulseFill)"
                    />}

                    {pulseLinePath && <path
                      className="chart-line-glow"
                      d={pulseLinePath}
                      transform="translate(0 4)"
                    />}

                    {pulseLinePath && <path
                      className="chart-line"
                      d={pulseLinePath}
                    />}
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
                  Focus quality <b>{dashboard?.focusQualityTrend || (dashboard?.focusQuality != null ? `${dashboard.focusQuality}%` : "not shared")}</b>
                </span>
              </div>
            </article>

            <article className="figma-card focus-card">
              <CardTitle
                icon={<img src={elementIcon} alt="" />}
                title="Focus pattern"
                subtitle="Recorded session density by time block"
              />

              {focusPatternRows.length > 0 ? <div className="heatmap">
                <div className="heat-row days">
                  <span>Hour</span>

                  {focusPatternDays.map((day, index) => (
                    <span key={`${day.day}-${index}`}>{formatWeekday(day.day)}</span>
                  ))}
                </div>

                {focusPatternRows.map((row) => (
                  <div className={`heat-row${isHourInFocusBlock(row.hour, activeTimeBlock) ? " is-active" : ""}`} key={row.hour}>
                    <span>{formatHourLabel(row.hour)}</span>
                    {row.minutesByDay.map((minutes, index) => (
                      <i
                        aria-label={minutes ? `${minutes} minutes` : "No sessions"}
                        className={`level-${intensityLevel(minutes)}`}
                        key={`${row.hour}-${index}`}
                        role="img"
                        title={minutes ? `${minutes} minutes` : "No sessions"}
                      >
                        {intensityLevel(minutes) === 3 ? <Star size={10} fill="currentColor" strokeWidth={2} aria-hidden="true" /> : null}
                      </i>
                    ))}
                  </div>
                ))}
              </div> : <p className="insight">No shared study-time pattern is available for this week yet.</p>}

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
                {activeTimeBlock
                  ? `${childName}'s most active study time is ${activeTimeBlock.startTime}–${activeTimeBlock.endTime}. `
                  : "Most active study time is not available yet. "}
                {formatFocusTrend(focusTrend, childName)}
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
                  <Link to="/study-goals" state={{ openCreateGoal: true }} className="button">Suggest a goal</Link>
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

                  <button type="button" className="export-btn" disabled={isExporting} onClick={exportSessionLog}>
                    <Download size={12} />
                    {isExporting ? "Exporting…" : "Export log"}
                  </button>
                </div>
              </div>
              {exportError && <p className="overview-export-error" role="alert">{exportError}</p>}

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

function formatWeekRange(startsOn, endsOn) {
  const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${formatDate(startsOn)} – ${formatDate(endsOn)}`;
}

function formatRangeDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function intensityLevel(minutes) {
  if (minutes >= 60) return 3;
  if (minutes >= 30) return 2;
  if (minutes > 0) return 1;
  return 0;
}

function isHourInFocusBlock(hour, timeBlock) {
  const start = parseFocusBlockHour(timeBlock?.startTime);
  const end = parseFocusBlockHour(timeBlock?.endTime);
  if (start == null || end == null) return false;
  return start <= end ? hour >= start && hour <= end : hour >= start || hour <= end;
}

function parseFocusBlockHour(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{1,2})(?::\d{2})?(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  const hour = Number(match[1]);
  if (hour > 23) return null;
  if (!match[2]) return hour;
  return (hour % 12) + (match[2].toUpperCase() === "PM" ? 12 : 0);
}

function buildFocusPatternRows(days) {
  const totalsByHour = new Map();
  days.forEach((day) => {
    (day.sessions || []).forEach((session) => {
      if (session.hour == null) return;
      totalsByHour.set(session.hour, (totalsByHour.get(session.hour) || 0) + session.studyMinutes);
    });
  });

  const selectedHours = [...totalsByHour.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 5)
    .map(([hour]) => hour)
    .sort((a, b) => a - b);

  return selectedHours.map((hour) => ({
    hour,
    minutesByDay: days.map((day) =>
      (day.sessions || []).reduce(
        (total, session) => total + (session.hour === hour ? session.studyMinutes : 0),
        0,
      ),
    ),
  }));
}

function formatHourLabel(hour) {
  const normalized = hour % 12 || 12;
  return `${normalized}${hour < 12 ? "am" : "pm"}`;
}

function formatWeekday(day) {
  return typeof day === "string" ? day.slice(0, 1).toUpperCase() : "–";
}

function formatFocusTrend(trend, childName) {
  if (trend === "Improving") return `${childName}'s shared focus quality is improving.`;
  if (trend === "Declining") return `${childName}'s shared focus quality has declined.`;
  if (trend === "Steady") return `${childName}'s shared focus quality is steady.`;
  return "Focus-quality trend will appear after enough shared activity.";
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

function buildSmoothPulsePath(days) {
  const points = buildPulseCircles(days);
  if (points.length < 2) return "";

  return points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x},${point.y}`;

    const previous = points[index - 1];
    const beforePrevious = points[index - 2] || previous;
    const next = points[index + 1] || point;
    const control1X = previous.x + (point.x - beforePrevious.x) / 6;
    const control1Y = previous.y + (point.y - beforePrevious.y) / 6;
    const control2X = point.x - (next.x - previous.x) / 6;
    const control2Y = point.y - (next.y - previous.y) / 6;

    return `${path} C${control1X},${control1Y} ${control2X},${control2Y} ${point.x},${point.y}`;
  }, "");
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
