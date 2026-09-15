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
import { child, parent } from "../../data/mockData";
import elementIcon from "../../assets/elementIcon.png";
import { useAuth } from "../../context/AuthContext";
import { getSessionsByDay } from "../../services/home";
import { getSessions } from "../../services/reports";

import "../../css/dashboard/Overview.css";

const defaultSessions = [
  {
    subject: "Mathematics",
    date: "Today, Oct 20 · 5:10 PM",
    duration: "50 min",
    format: "Digital",
    status: "Completed",
    focus: "88%",
    note: "(Steady focus)",
    icon: <Plus size={13} />,
    tone: "",
  },
  {
    subject: "English Literature",
    date: "Yesterday, Oct 19 · 4:20 PM",
    duration: "35 min",
    format: "Paper notes",
    status: "Completed",
    focus: "82%",
    note: "(Calm interval)",
    icon: <BookText size={13} />,
    tone: "tone-blue",
  },
  {
    subject: "Physics",
    date: "Oct 18 · 6:00 PM",
    duration: "22 min",
    format: "Digital",
    status: "Paused",
    focus: "",
    note: "Not evaluated (<25m)",
    icon: <Atom size={13} />,
    tone: "tone-orange",
  },
];

const hours = ["9am", "11am", "2pm", "5pm", "7pm"];

const defaultHeatmap = [
  [0, 0, 0, 0, 0, 2, 0],
  [1, 0, 2, 0, 1, 3, 0],
  [0, 2, 1, 1, 0, 0, 1],
  [3, 3, 2, 3, 3, 0, 0],
  [3, 0, 3, 2, 1, 0, 0],
];

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
    date: raw.date ?? "",
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

export default function Overview() {
  const { user, child: authChild } = useAuth();
  const activeChild = authChild ?? child;

  const [sessionFilter, setSessionFilter] = useState("all");
  const [sessions, setSessions] = useState(defaultSessions);
  const [heatmap, setHeatmap] = useState(defaultHeatmap);

  // ------------------------------------------------------------
  // جلب أحدث الجلسات ونمط الجلسات حسب اليوم من الـ API.
  // شكل الاستجابة غير موثق بالـ spec، فيتم التحقق من الشكل
  // (خاصة أبعاد مصفوفة الـ heatmap) قبل استبدال البيانات
  // الافتراضية، وأي فشل يبقي الواجهة كما كانت.
  // ------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;

    async function loadOverviewData() {
      try {
        const [sessionsByDay, recentSessions] = await Promise.all([
          getSessionsByDay().catch(() => null),
          getSessions({ studentId: activeChild?.id, pageSize: 3 }).catch(
            () => null
          ),
        ]);

        if (isCancelled) return;

        const matrix = Array.isArray(sessionsByDay)
          ? sessionsByDay
          : Array.isArray(sessionsByDay?.matrix)
          ? sessionsByDay.matrix
          : null;

        if (
          Array.isArray(matrix) &&
          matrix.length === defaultHeatmap.length &&
          matrix.every(
            (row) =>
              Array.isArray(row) && row.length === defaultHeatmap[0].length
          )
        ) {
          setHeatmap(matrix);
        }

        const sessionItems = Array.isArray(recentSessions)
          ? recentSessions
          : Array.isArray(recentSessions?.items)
          ? recentSessions.items
          : null;

        if (sessionItems && sessionItems.length > 0) {
          setSessions(sessionItems.slice(0, 3).map(formatSessionForCard));
        }
      } catch (err) {
        console.error("Failed to load overview data:", err);
      }
    }

    loadOverviewData();

    return () => {
      isCancelled = true;
    };
  }, [activeChild]);

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
                45 min from last week
              </span>

              <div className="weekly-main">
                <div>
                  <strong>4h 20m</strong>

                  <small>
                    <CheckCircle2 size={14} />
                    Verified study sessions
                  </small>
                </div>

                <div className="line-chart">
                  <span className="chart-tip">Fri: 1h 30m</span>

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

                    <path
                      fill="url(#pulseFill)"
                      d="M10 70 C30 70 32 68 50 67 S72 61 90 58 S112 52 130 48 S152 32 170 30 S192 36 210 40 S232 44 250 46 L250 92 L10 92 Z"
                    />

                    <path
                      className="chart-line"
                      d="M10 70 C30 70 32 68 50 67 S72 61 90 58 S112 52 130 48 S152 32 170 30 S192 36 210 40 S232 44 250 46"
                    />

                    <circle className="chart-dot" cx="10" cy="70" r="2.6" />
                    <circle className="chart-dot" cx="50" cy="67" r="2.6" />
                    <circle className="chart-dot" cx="90" cy="58" r="2.6" />
                    <circle className="chart-dot" cx="130" cy="48" r="2.6" />
                    <circle className="chart-peak" cx="170" cy="30" r="4.5" />
                    <circle className="chart-dot" cx="210" cy="40" r="2.6" />
                    <circle className="chart-dot" cx="250" cy="46" r="2.6" />
                  </svg>

                  <div className="chart-days">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <b>Fri (Peak)</b>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>

              <div className="weekly-footer">
                <span>
                  <CheckCircle2 size={13} />
                  5 of 6 sessions completed
                </span>

                <span>
                  <CalendarCheck size={13} />
                  4 active study days
                </span>

                <span>
                  <TrendingUp size={13} />
                  Focus quality <b>improving</b>
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
                <b>Insight:</b> {activeChild.preferredName}’s most consistent sessions
                happen between 5:00 PM and 7:00 PM based on verified logs.
              </p>
            </article>
          </section>

          <section className="figma-bottom-grid">
            <article className="figma-card goal-card">
              <CardTitle icon={<Flag size={17} />} title="Active Goal" />

              <span className="weekly-label">Weekly</span>

              <div className="goal-number">
                <strong>4h 20m</strong>
                <span>of 6h</span>
                <b>72% complete</b>
              </div>

              <div className="goal-progress">
                <i />
              </div>

              <div className="goal-badges">
                <span>
                  <UserRound size={12} />
                  Suggested by {user.firstName}
                </span>

                <span>
                  <Check size={12} />
                  Accepted by {activeChild.preferredName}
                </span>
              </div>

              <p>
                {activeChild.preferredName} completed four Math sessions in the last
                14 days.
              </p>

              <p>
                Sessions completed before 7 PM showed stronger sustained focus
                than evening sessions.
              </p>

              <footer>
                <span>2 days remaining in cycle</span>

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
                  Showing {filteredSessions.length} of 18 historical sessions
                </span>

                <Link to="/reports">
                  View all 18 historical reports
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
