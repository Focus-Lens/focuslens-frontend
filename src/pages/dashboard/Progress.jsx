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
  TrendingDown,
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
import { useAuth } from "../../context/useAuth";

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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [childInfo, setChildInfo] = useState(() => findConnectedChild(getCachedParentChildren()));
  const [pendingChild, setPendingChild] = useState(
    () => findPendingChild(getCachedParentChildren()) || getPendingInvitationForUser(user?.email)
  );
  const [progressData, setProgressData] = useState(null);
  const [behaviorData, setBehaviorData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const customRangeReady = isCompleteDate(dateFrom) && isCompleteDate(dateTo) && dateFrom <= dateTo;

  useEffect(() => {
    if (range === "custom" && !customRangeReady) {
      setIsLoadingData(false);
      return;
    }

    let active = true;
    setIsLoadingData(true);
    api("/api/parents/overview/children")
      .then(async (children) => {
        if (!active) return;
        cacheParentChildren(children);
        const connectedChild = findConnectedChild(children);
        setChildInfo(connectedChild);
        const pendingFromServer = findPendingChild(children);
        const pending = pendingFromServer || getPendingInvitationForUser(user?.email);
        setPendingChild(pending);
        if (!connectedChild?.studentId) {
          if (pending) {
            const invitations = await api("/api/parents/child-setups/invitations").catch(() => []);
            const pendingDraftId = pending.childSetupDraftId || pending.draftId || pending.id;
            const invitation = invitations.find((item) =>
              (pendingDraftId && item.draftId === pendingDraftId) ||
              (pending.childSetupInvitationId && item.invitationId === pending.childSetupInvitationId),
            );
            if (active) setPendingChild(invitation ? { ...pending, ...invitation } : pendingFromServer);
          }
          setProgressData(null);
          setBehaviorData(null);
          setIsLoadingData(false);
          return;
        }
        const rangeQuery = range === "7" ? "Last7Days" : range === "30" ? "Last30Days" : "Custom";
        const params = new URLSearchParams({ studentId: connectedChild.studentId, range: rangeQuery });
        if (range === "custom") {
          params.set("dateFrom", dateFrom);
          params.set("dateTo", dateTo);
        }
        const behavioralParams = new URLSearchParams({ studentId: connectedChild.studentId, range: rangeQuery });
        if (range === "custom") {
          behavioralParams.set("dateFrom", dateFrom);
          behavioralParams.set("dateTo", dateTo);
        }
        const [progress, behavior] = await Promise.all([
          api(`/api/progress?${params.toString()}`).catch(() => null),
          api(`/api/progress/behavioral?${behavioralParams.toString()}`).catch(() => null),
        ]);
        if (active) {
          setProgressData(progress);
          setBehaviorData(behavior);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoadingData(false);
      });
    return () => { active = false; };
  }, [user?.email, range, dateFrom, dateTo]);

  const subjects = useMemo(() => (progressData?.subjects || []).map((subject) => {
    const insight = (behaviorData?.subjects || []).find((item) =>
      (subject.subjectId && item.subjectId === subject.subjectId) || item.subject === subject.subject,
    );
    const apiTrend = String(insight?.focusTrend || "").toLowerCase();
    return {
      name: subject.subject,
      sessions: subject.sessionCount,
      totalMinutes: subject.actualStudyMinutes,
      trend: apiTrend === "steady" ? "stable" : apiTrend || null,
      hasEnoughData: subject.dataStatus === "EnoughData" || subject.dataStatus === 1,
    };
  }), [progressData, behaviorData]);
  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.name === selectedSubjectName) || subjects[0],
    [selectedSubjectName, subjects],
  );
  const pulseDays = (progressData?.daily || []).map((day) => ({
    date: day.date,
    actualStudyMinutes: day.actualStudyMinutes,
  }));
  const behavioralByDate = new Map((behaviorData?.daily || []).map((day) => [normalizeDateKey(day.date), day.focusScore]));
  const selectedTimeInsight = (behaviorData?.timeOfDay || []).find(
    (item) => item.period?.toLowerCase() === selectedTimePeriod.toLowerCase(),
  );
  const overallFocusTrend = String(behaviorData?.focus?.trend || "").toLowerCase();

  const chartWidth = 330;
  const chartHeight = 150;

  const focusPoints = pulseDays.flatMap((day, index) => {
    const score = behavioralByDate.get(normalizeDateKey(day.date));
    if (score == null || !Number.isFinite(Number(score))) return [];
    return [{
      x: index * (chartWidth / Math.max(pulseDays.length - 1, 1)),
      y: chartHeight * (1 - Number(score) / 100),
      score: Number(score),
    }];
  });
  const focusLinePath = buildSmoothChartPath(focusPoints);
  const focusAreaPath = focusPoints.length
    ? `${focusLinePath} L ${focusPoints.at(-1).x} ${chartHeight} L ${focusPoints[0].x} ${chartHeight} Z`
    : "";

  const studyPoints = pulseDays.map((day) => day.actualStudyMinutes || 0);
  const maxStudyMinutes = 180;
  const axisDays = pulseDays.filter((_, index) => {
    const stride = Math.max(1, Math.ceil(pulseDays.length / 7));
    return index === 0 || index === pulseDays.length - 1 || index % stride === 0;
  });
  const hasActivity = (progressData?.sessionCount || 0) > 0 || (progressData?.actualStudyMinutes || 0) > 0;

  if (!childInfo) {
    return (
      <div className="progress-page-shell">
        <DashboardHeader activePage="progress" />
        <ParentLayout>
          <ProgressUnavailable
            pendingInvitation={pendingChild}
            onAction={() => navigate(pendingChild ? "/children" : "/choose-start")}
          />
        </ParentLayout>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="progress-page-shell">
        <DashboardHeader activePage="progress" />
        <ParentLayout>
          <main className="progress-page" role="status" aria-live="polite">Loading progress…</main>
        </ParentLayout>
      </div>
    );
  }

  if (range === "custom" && !customRangeReady) {
    return (
      <div className="progress-page-shell">
        <DashboardHeader activePage="progress" />
        <ParentLayout>
          <main className="progress-page">
            <header className="progress-heading">
              <div>
                <h1>Progress</h1>
                <p>See how focus quality and study patterns change over time.</p>
              </div>
              <div className="progress-ranges">
                <button onClick={() => setRange("7")} type="button">Last 7 days</button>
                <button onClick={() => setRange("30")} type="button">Last 30 days</button>
                <button className="active" onClick={() => setRange("custom")} type="button">Custom range</button>
              </div>
              <div className="progress-custom-dates">
                <label>From <input aria-label="Start date" onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom} /></label>
                <label>To <input aria-label="End date" onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} /></label>
              </div>
            </header>
            <section className="progress-custom-prompt" role="status">
              Choose a complete start date and end date to view progress for this range.
            </section>
          </main>
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
              <div className="progress-empty-intro">
                <span className="progress-empty-spark"><TrendingUp size={26} strokeWidth={2.1} /></span>
                <span className="progress-empty-eyebrow">PROGRESS OVERVIEW</span>
                <h2>{childInfo.firstName || "Your child"}&apos;s progress will grow here</h2>
                <p>
                  There&apos;s no shared study activity yet. Once {childInfo.firstName || "your child"} records a session,
                  this page will show study time, focus quality, and subject progress.
                </p>
              </div>
              <div className="progress-empty-stats" aria-label="Progress summary">
                <article>
                  <span>Study time</span>
                  <b>0<span>m</span></b>
                </article>
                <article>
                  <span>Focus quality</span>
                  <b className="progress-empty-unavailable">Not available yet</b>
                </article>
                <article>
                  <span>Sessions</span>
                  <b>0</b>
                </article>
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
              {range === "custom" && (
                <div className="progress-custom-dates">
                  <label>From <input aria-label="Start date" onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom} /></label>
                  <label>To <input aria-label="End date" onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} /></label>
                </div>
              )}
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
                    {behaviorData?.focus?.latestScore != null ? `${behaviorData.focus.latestScore}%` : "—"}
                  </strong>
                </div>

                <span className={`progress-change${overallFocusTrend ? ` ${overallFocusTrend}` : ""}`}>
                  {overallFocusTrend === "improving" ? (
                    <><ArrowUp size={14} strokeWidth={2.2} />Improving</>
                  ) : overallFocusTrend === "declining" ? (
                    <><TrendingDown size={14} strokeWidth={2.2} />Declining</>
                  ) : overallFocusTrend === "steady" ? (
                    <>— Steady</>
                  ) : behaviorData?.focus?.latestScore != null ? (
                    "Latest shared focus quality"
                  ) : (
                    "Focus quality has not been shared"
                  )}
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
                        <filter id="progressFocusGlow" x="-10%" y="-30%" width="120%" height="170%">
                          <feGaussianBlur stdDeviation="7" />
                        </filter>
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

                      {focusAreaPath && <path className="progress-focus-glow" d={focusAreaPath} />}
                      {focusAreaPath && <path className="progress-focus-area" d={focusAreaPath} />}
                      {focusLinePath && <path className="progress-focus-line" d={focusLinePath} />}

                      {focusPoints.map((point, index) => {
                        return (
                          <circle
                            cx={point.x}
                            cy={point.y}
                            key={`${point.score}-${index}`}
                            r="3"
                          />
                        );
                      })}
                    </svg>

                    <div className="focus-x-axis">
                      {axisDays.map((day) => <span key={day.date}>{formatDay(day.date, range === "7")}</span>)}
                    </div>

                  </div>
                </div>

                <p className="progress-card-note">
                  {behaviorData?.focus?.latestScore != null
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
                      progressData?.actualStudyMinutes
                    )}
                  </strong>

                </div>

                <span className="progress-change lime">
                  {/* <ArrowUp
                    size={14}
                    strokeWidth={2.2}
                  /> */}

                  {progressData?.dateFrom && progressData?.dateTo
                    ? `${formatRangeDate(progressData.dateFrom)} – ${formatRangeDate(progressData.dateTo)}`
                    : "Study time in the selected period"}
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

                    <div
                      className="progress-bars-chart"
                      style={{ gridTemplateColumns: `repeat(${Math.max(studyPoints.length, 1)}, minmax(0, 1fr))` }}
                    >

                      {studyPoints.map(
                        (minutes, index) => (
                          <div
                            className="study-bar-column"
                            key={`${minutes}-${index}`}
                          >
                            <i
                              className={
                                `${index === studyPoints.length - 1 ? "last" : ""} ${minutes <= 0 ? "empty" : ""}`.trim()
                              }
                              style={{
                                height: `${Math.min(minutes, maxStudyMinutes) / maxStudyMinutes * 100}%`,
                              }}
                            />
                          </div>
                        )
                      )}

                    </div>

                    <div className="study-x-axis">
                      {axisDays.map((day) => <span key={day.date}>{formatDay(day.date, range === "7")}</span>)}
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
                            ) : subject.trend === "declining" ? (
                              <span className="table-trend declining">
                                <TrendingDown size={15} strokeWidth={2.2} />
                                Declining
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
                              onClick={() => setSelectedSubjectName(subject.name)}
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
                {selectedTimeInsight?.averageFocusScore != null
                  ? `${selectedTimePeriod} focus quality averaged ${selectedTimeInsight.averageFocusScore}% across ${selectedTimeInsight.analyzedDayCount} analyzed days. `
                  : `There isn’t enough shared focus data for ${selectedTimePeriod.toLowerCase()} yet. `}
                {behaviorData?.strongestTimeOfDay
                  ? `Focus has been strongest during ${behaviorData.strongestTimeOfDay.toLowerCase()}.`
                  : "There isn’t enough data yet to identify the strongest time of day."}
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

                <p className={selectedSubject?.trend ? `subject-${selectedSubject.trend}` : ""}>
                  {selectedSubject?.trend === "declining" ? (
                    <TrendingDown size={20} strokeWidth={2.2} />
                  ) : selectedSubject?.trend === "improving" ? (
                    <TrendingUp size={20} strokeWidth={2.2} />
                  ) : (
                    <span aria-hidden="true">—</span>
                  )}

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

function formatDay(date, showWeekday) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, showWeekday
    ? { weekday: "short" }
    : { month: "short", day: "numeric" });
}

function normalizeDateKey(date) {
  return String(date || "").slice(0, 10);
}

function isCompleteDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

function buildSmoothChartPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const beforePrevious = points[index - 2] || previous;
    const next = points[index + 1] || point;
    const control1X = previous.x + (point.x - beforePrevious.x) / 6;
    const control1Y = previous.y + (point.y - beforePrevious.y) / 6;
    const control2X = point.x - (next.x - previous.x) / 6;
    const control2Y = point.y - (next.y - previous.y) / 6;
    return `${path} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${point.x} ${point.y}`;
  }, "");
}

function formatRangeDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
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

function ProgressUnavailable({ pendingInvitation, onAction }) {
  const isPending = Boolean(pendingInvitation);
  const invitedEmail = pendingInvitation?.targetEmail || pendingInvitation?.email;

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
          {isPending ? "Waiting for the student to accept" : "Add a child to see progress"}
        </h2>
        <p>
          {isPending
            ? invitedEmail
              ? `An invitation has been sent to ${invitedEmail}. Progress will appear after the student accepts the connection and completes setup.`
              : "A private invitation is ready for the student. Progress will appear after the student accepts the connection and completes setup."
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
