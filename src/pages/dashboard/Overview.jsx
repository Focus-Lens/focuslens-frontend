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
  Plus,
  BookText,
  Atom,
} from "lucide-react";

import { ParentLayout } from "../../components/ui/CommonUI";
import DashboardHeader from "../../components/ui/DashboardHeader";
import elementIcon from "../../assets/elementIcon.png";
import { useAuth } from "../../context/AuthContext";
import { getParentDashboard } from "../../services/dashboard";

import "../../css/dashboard/Overview.css";

const hours = ["9am", "11am", "2pm", "5pm", "7pm"];

const emptyHeatmap = Array.from({ length: 5 }, () => Array(7).fill(0));

const days = ["M", "T", "W", "T", "F", "S", "S"];

// ------------------------------------------------------------
// اختيار أيقونة/لون موجودين مسبقًا في الملف حسب اسم المادة،
// بنفس منطق الاختيار المستخدم أصلاً في هذه الصفحة — بدون أي
// عنصر واجهة جديد.
// ------------------------------------------------------------
function getSessionVisual(subjectRaw) {
  const subject = (subjectRaw || "").toLowerCase();

  if (subject.includes("english") || subject.includes("literature")) {
    return { icon: <BookText size={13} />, tone: "tone-blue" };
  }

  if (
    subject.includes("physic") ||
    subject.includes("science") ||
    subject.includes("chemistry")
  ) {
    return { icon: <Atom size={13} />, tone: "tone-orange" };
  }

  return { icon: <Plus size={13} />, tone: "" };
}

function formatSessionForCard(raw) {
  const subject = raw.subject ?? raw.subjectName ?? "Study session";
  const visual = getSessionVisual(subject);
  const statusRaw = (raw.status ?? "completed").toString().toLowerCase();
  const durationMinutes = raw.durationMinutes ?? null;

  return {
    subject,
    date: raw.date ? new Date(raw.date).toLocaleString() : "",
    duration:
      durationMinutes != null
        ? `${durationMinutes} min`
        : raw.duration ?? "",
    format: raw.format ?? "Digital",
    status: statusRaw === "paused" ? "Paused" : "Completed",
    focus:
      raw.focusScore != null ? `${raw.focusScore}%` : raw.focus ?? "",
    note: raw.focusQuality ?? raw.note ?? "",
    icon: visual.icon,
    tone: visual.tone,
  };
}

function formatMinutes(minutes) {
  const value = Number(minutes) || 0;
  const hoursValue = Math.floor(value / 60);
  const remaining = value % 60;
  return hoursValue ? `${hoursValue}h ${remaining}m` : `${remaining}m`;
}

export default function Overview() {
  const { user, child: authChild } = useAuth();
  const activeChild = authChild ?? { preferredName: "your child", id: null };

  const [sessionFilter, setSessionFilter] = useState("all");
  const [sessions, setSessions] = useState([]);
  const [heatmap, setHeatmap] = useState(emptyHeatmap);
  const [dashboard, setDashboard] = useState(null);

  // ------------------------------------------------------------
  // Load the parent-authorized dashboard aggregate for the linked child.
  // ------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;

    async function loadOverviewData() {
      try {
        if (!activeChild?.id) return;
        const data = await getParentDashboard(activeChild.id);

        if (isCancelled) return;

        const matrix = data?.activityMatrix;

        if (
          Array.isArray(matrix) &&
            matrix.length === emptyHeatmap.length &&
          matrix.every(
            (row) =>
              Array.isArray(row) && row.length === emptyHeatmap[0].length
          )
        ) {
          setHeatmap(matrix);
        }

        setDashboard(data);
        setSessions((data?.recentSessions ?? []).map(formatSessionForCard));
      } catch (err) {
        console.error("Failed to load overview data:", err);
        if (!isCancelled) {
          setDashboard(null);
          setSessions([]);
          setHeatmap(emptyHeatmap);
        }
      }
    }

    loadOverviewData();

    return () => {
      isCancelled = true;
    };
  }, [activeChild.id]);

  const weeklyMinutes = dashboard?.weeklyMinutes ?? 0;
  const previousWeekMinutes = dashboard?.previousWeekMinutes ?? 0;
  const weeklyChange = weeklyMinutes - previousWeekMinutes;
  const activeGoal = dashboard?.activeGoal;
  const goalPercentage = activeGoal?.targetMinutes
    ? Math.min(100, Math.round((activeGoal.completedMinutes / activeGoal.targetMinutes) * 100))
    : 0;
  const weeklyPoints = dashboard?.dailyStudyMinutes?.map((item) => item.minutes) ?? Array(7).fill(0);
  const maxWeeklyMinutes = Math.max(1, ...weeklyPoints);
  const chartPoints = weeklyPoints
    .map((minutes, index) => `${10 + index * 40},${82 - (minutes / maxWeeklyMinutes) * 62}`)
    .join(" ");
  const peakIndex = weeklyPoints.indexOf(Math.max(...weeklyPoints));

  const filteredSessions = sessions.filter((session) => {
    if (sessionFilter === "all") return true;

    return session.status.toLowerCase() === sessionFilter;
  });

  return (
    <div className="overview-page">
      <DashboardHeader activePage="overview" />

      <ParentLayout>
        <main className="figma-overview">
          <header className="figma-heading">
            <div>
              <h1>Good morning, {user.firstName}</h1>

              <p>
                Here’s how {activeChild.preferredName}’s studying is going this week.
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
                {weeklyChange >= 0 ? "+" : ""}{weeklyChange} min from last week
              </span>

              <div className="weekly-main">
                <div>
                  <strong>{formatMinutes(weeklyMinutes)}</strong>

                  <small>
                    <CheckCircle2 size={14} />
                    Verified study sessions
                  </small>
                </div>

                <div className="line-chart">
                  <span className="chart-tip">Peak: {formatMinutes(weeklyPoints[peakIndex] ?? 0)}</span>

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

                    <polygon fill="url(#pulseFill)" points={`10,92 ${chartPoints} 250,92`} />
                    <polyline className="chart-line" fill="none" points={chartPoints} />
                    {weeklyPoints.map((minutes, index) => (
                      <circle
                        className={index === peakIndex && minutes > 0 ? "chart-peak" : "chart-dot"}
                        cx={10 + index * 40}
                        cy={82 - (minutes / maxWeeklyMinutes) * 62}
                        key={index}
                        r={index === peakIndex && minutes > 0 ? 4.5 : 2.6}
                      />
                    ))}
                  </svg>

                  <div className="chart-days">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>

              <div className="weekly-footer">
                <span>
                  <CheckCircle2 size={13} />
                  {dashboard?.completedSessionsThisWeek ?? 0} of {dashboard?.sessionsThisWeek ?? 0} sessions completed
                </span>

                <span>
                  <CalendarCheck size={13} />
                  {dashboard?.activeStudyDays ?? 0} active study days
                </span>

                <span>
                  <TrendingUp size={13} />
                  Focus quality <b>available after AI analysis</b>
                </span>
              </div>
            </article>

            <article className="figma-card focus-card">
              <CardTitle
                icon={<img src={elementIcon} alt="" />}
                title="Focus pattern"
                subtitle="Recorded session density by time block"
              />

              <div className="heatmap">
                <div className="heat-row days">
                  <span>Hour</span>

                  {days.map((day, index) => (
                    <span key={index}>{day}</span>
                  ))}
                </div>

                {hours.map((time, row) => (
                  <div
                    className={`heat-row${row >= 3 ? " is-active" : ""}`}
                    key={time}
                  >
                    <span>{time}</span>

                    {heatmap[row].map((level, index) => (
                      <i className={`level-${level}`} key={index}>
                        {level === 3 ? "★" : ""}
                      </i>
                    ))}
                  </div>
                ))}
              </div>

              <div className="intensity">
                <span>Intensity:</span>

                <div className="legend">
                  <span>
                    <i /> None
                  </span>

                  <span>
                    <i className="level-1" /> &lt;20m
                  </span>

                  <span>
                    <i className="level-2" /> 35m
                  </span>

                  <span>
                    <i className="level-3" /> Deep
                  </span>
                </div>
              </div>

              <p className="insight">
                <b>Insight:</b> {dashboard?.mostConsistentTimeOfDay
                  ? `${activeChild.preferredName} most often studies in the ${dashboard.mostConsistentTimeOfDay.toLowerCase()}.`
                  : "More completed sessions are needed to identify a pattern."}
              </p>
            </article>
          </section>

          <section className="figma-bottom-grid">
            <article className="figma-card goal-card">
              <CardTitle icon={<Flag size={17} />} title="Active Goal" />

              <span className="weekly-label">{activeGoal?.frequency ?? "Weekly"}</span>

              <div className="goal-number">
                <strong>{formatMinutes(activeGoal?.completedMinutes ?? 0)}</strong>
                <span>of {formatMinutes(activeGoal?.targetMinutes ?? 0)}</span>
                <b>{activeGoal ? `${goalPercentage}% complete` : "No goal this week"}</b>
              </div>

              <div className="goal-progress">
                <i style={{ width: `${goalPercentage}%` }} />
              </div>

              <div className="goal-badges">
                <span>
                  <UserRound size={12} />
                  Suggested by {user.firstName}
                </span>

                <span>
                  <Check size={12} />
                  {activeGoal?.status === "active" ? `Accepted by ${activeChild.preferredName}` : "Pending acceptance"}
                </span>
              </div>

              <p>
                {activeChild.preferredName} has completed {dashboard?.completedSessionsThisWeek ?? 0} sessions this week.
              </p>

              <p>
                AI-based focus comparisons will appear after the second integration stage.
              </p>

              <footer>
                <span>{activeGoal?.daysRemaining ?? 0} days remaining in cycle</span>

                <Link to="/study-goals">
                  View goal
                  <ArrowRight size={13} />
                </Link>
              </footer>
            </article>

            <article className="figma-card sessions-card">
              <div className="sessions-top">
                <CardTitle
                  icon={<BookOpenCheck size={17} />}
                  title="Recent study sessions"
                  subtitle={`Verified study session records shared by ${activeChild.preferredName}`}
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

              {filteredSessions.map((session, index) => (
                <div className="session" key={`${session.subject}-${index}`}>
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
                  Showing {filteredSessions.length} recent sessions
                </span>

                <Link to="/reports">
                  View all historical reports
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
