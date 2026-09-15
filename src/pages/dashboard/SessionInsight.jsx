import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Pause,
  LockKeyhole,
} from "lucide-react";

import { ParentLayout } from "../../components/ui/CommonUI";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { useAuth } from "../../context/AuthContext";
import { getSessionDetail } from "../../services/reports";

import arabicImage from "../../assets/arabic.jpg";
import clockImage from "../../assets/clock.jpg";
import brainImage from "../../assets/brain.jpg";
import rightImage from "../../assets/right.jpg";
import heartImage from "../../assets/heart.jpg";
import historyImage from "../../assets/history.png";
import englishImage from "../../assets/english.png";
import mathematicsImage from "../../assets/mathimatics.png";
import scienceImage from "../../assets/science.png";

import "../../css/dashboard/SessionInsight.css";

export default function SessionInsight() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { child } = useAuth();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // جلب تفاصيل الجلسة من GET /api/reports/sessions/{sessionId}.
  // The backend returns a stable report contract. AI-only fields are nullable.
  // ------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;

    async function loadSessionDetail() {
      try {
        const data = await getSessionDetail(sessionId, {
          studentId: child?.id,
        });
        if (isCancelled) return;
        setSession(data ?? null);
      } catch (err) {
        console.error("Failed to load session detail:", err);
        if (!isCancelled) setSession(null);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadSessionDetail();

    return () => {
      isCancelled = true;
    };
  }, [sessionId, child]);

  if (loading || !session) {
    return (
      <div className="session-insight-shell">
        <DashboardHeader activePage="reports" />

        <ParentLayout>
          <main className="session-not-found">
            <h1>{loading ? "Loading session…" : "Session not found"}</h1>

            <button
              onClick={() => navigate("/reports")}
              type="button"
            >
              Back to Reports
            </button>
          </main>
        </ParentLayout>
      </div>
    );
  }

  const getSubjectImage = (subject) => {
    const value = subject?.toLowerCase() || "";

    if (value.includes("arabic")) {
      return {
        src: arabicImage,
        full: false,
      };
    }

    if (value.includes("math")) {
      return {
        src: mathematicsImage,
        full: true,
      };
    }

    if (value.includes("science")) {
      return {
        src: scienceImage,
        full: true,
      };
    }

    if (value.includes("english")) {
      return {
        src: englishImage,
        full: true,
      };
    }

    if (value.includes("history")) {
      return {
        src: historyImage,
        full: false,
      };
    }

    return {
      src: arabicImage,
      full: false,
    };
  };

  const subjectImage = getSubjectImage(session.subject);

  const chartData = session.focusChart || [];

  const chartWidth = 700;
  const chartHeight = 170;

  const maxScore = 100;
  const minScore = 25;

  const getX = (index) => {
    if (chartData.length <= 1) {
      return chartWidth / 2;
    }

    return (
      index *
      (chartWidth / Math.max(chartData.length - 1, 1))
    );
  };

  const getY = (score) => {
    const normalized =
      (score - minScore) / (maxScore - minScore);

    return chartHeight - normalized * chartHeight;
  };

  const chartPoints = chartData
    .map(
      (point, index) =>
        `${getX(index)},${getY(point.score)}`
    )
    .join(" ");

  const lastPoint =
    chartData[chartData.length - 1];

  const lastPointX =
    chartData.length > 0
      ? getX(chartData.length - 1)
      : 0;

  const lastPointY =
    chartData.length > 0
      ? getY(lastPoint.score)
      : 0;

  const resultPercent =
    session.learningResults?.resultPercent ?? 0;

  return (
    <div className="session-insight-shell">
      <DashboardHeader activePage="reports" />

      <ParentLayout>
        <main className="session-insight-page">

          {/* TOP ROW */}
          <div className="session-top-row">
            <button
              className="session-back-link"
              onClick={() => navigate("/reports")}
              type="button"
            >
              <ArrowLeft
                size={16}
                strokeWidth={2}
              />

              <span>Back to Reports</span>
            </button>

            <span className="session-user-mini">
              JS
            </span>
          </div>

          {/* TITLE */}
          <section className="session-title-card">

            <div
              className={`session-subject-icon ${
                subjectImage.full ? "full-image" : ""
              }`}
            >
              <img
                src={subjectImage.src}
                alt=""
              />
            </div>

            <div className="session-title-content">
              <small>Session insight</small>

              <div className="session-title-line">
                <h1>{session.subject}</h1>

                <span
                  className={
                    session.status === "completed"
                      ? "session-status completed"
                      : "session-status paused"
                  }
                >
                  {session.status === "completed" ? (
                    <>
                      <Check
                        size={12}
                        strokeWidth={2.5}
                      />
                      Completed
                    </>
                  ) : (
                    <>
                      <Pause
                        size={11}
                        strokeWidth={2.5}
                      />
                      Paused
                    </>
                  )}
                </span>
              </div>

              <p>
                {new Date(session.date).toLocaleString()} · {session.format}
              </p>
            </div>
          </section>

          {/* METRICS */}
          <section className="session-metrics">

            {/* BRAIN */}
            <article className="session-metric-card">
              <div className="metric-icon">
                <img
                  src={brainImage}
                  alt=""
                />
              </div>

              <div className="metric-content">
                <small>Focus score</small>

                <div className="metric-number">
                  {session.focusScore ?? "—"}

                  {session.focusScore && (
                    <span>/100</span>
                  )}
                </div>

                <p
                  className={
                    session.focusTrend === "improving"
                      ? "positive"
                      : ""
                  }
                >
                  {session.focusTrend === "improving" ? (
                    <>
                      <ArrowUp
                        size={13}
                        strokeWidth={2}
                      />
                      Improving compared with recent
                      sessions
                    </>
                  ) : (
                    "Focus score was not evaluated"
                  )}
                </p>

                {session.focusScore && (
                  <div className="metric-progress">
                    <span
                      style={{
                        width: `${session.focusScore}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </article>

            {/* CLOCK */}
            <article className="session-metric-card">
              <div className="metric-icon">
                <img
                  src={clockImage}
                  alt=""
                />
              </div>

              <div className="metric-content">
                <small>Study duration</small>

                <div className="metric-number">
                  {session.durationMinutes}
                  <span>min</span>
                </div>

                <p>
                  Verified session duration
                </p>

                <div className="duration-bars">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span className="muted" />
                </div>
              </div>
            </article>

            {/* HEART */}
            <article className="session-metric-card">
              <div className="metric-icon completion-icon">
                <img
                  src={rightImage}
                  alt=""
                />
              </div>

              <div className="metric-content">
                <small>Session completion</small>

                <div className="metric-number">
                  {session.completionPercent}
                  <span>%</span>
                </div>

                <p className="positive">
                  {session.status === "completed"
                    ? "Completed"
                    : "Paused"}
                </p>

                <div className="metric-subtext">
                  Planned session finished
                </div>
              </div>
            </article>
          </section>

          {/* CHART + CONTEXT */}
          {chartData.length > 0 ? (
            <div className="session-insight-grid">

              {/* CHART */}
              <section className="session-chart-card">
                <div className="session-card-top">
                  <div>
                    <small>
                      Processed result
                    </small>

                    <h2>Focus quality</h2>

                    <p>
                      Focus remained stable through
                      most of this session.
                    </p>
                  </div>

                  <span className="focus-quality-pill">
                    <span>—</span>
                    {session.focusQuality}
                  </span>
                </div>

                <div className="chart-wrapper">
                  <div className="chart-y-labels">
                    <span>100</span>
                    <span>75</span>
                    <span>50</span>
                    <span>25</span>
                  </div>

                  <svg
                    aria-label="Focus quality chart"
                    className="session-chart"
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    preserveAspectRatio="none"
                  >
                    <line
                      x1="0"
                      x2={chartWidth}
                      y1={getY(100)}
                      y2={getY(100)}
                    />

                    <line
                      x1="0"
                      x2={chartWidth}
                      y1={getY(75)}
                      y2={getY(75)}
                    />

                    <line
                      x1="0"
                      x2={chartWidth}
                      y1={getY(50)}
                      y2={getY(50)}
                    />

                    <line
                      x1="0"
                      x2={chartWidth}
                      y1={getY(25)}
                      y2={getY(25)}
                    />

                    <polygon
                      className="chart-area"
                      points={`0,${chartHeight} ${chartPoints} ${chartWidth},${chartHeight}`}
                    />

                    <polyline
                      points={chartPoints}
                    />

                    {lastPoint && (
                      <>
                        <circle
                          className="chart-point-ring"
                          cx={lastPointX}
                          cy={lastPointY}
                          r="7"
                        />

                        <circle
                          className="chart-point"
                          cx={lastPointX}
                          cy={lastPointY}
                          r="4"
                        />

                        <rect
                          className="chart-score-bg"
                          x={lastPointX - 17}
                          y={lastPointY - 35}
                          width="34"
                          height="22"
                          rx="8"
                        />

                        <text
                          className="chart-score"
                          x={lastPointX}
                          y={lastPointY - 20}
                          textAnchor="middle"
                        >
                          {lastPoint.score}
                        </text>
                      </>
                    )}
                  </svg>

                  <div className="chart-x-labels">
                    <span>4:20 PM</span>
                    <span>4:35 PM</span>
                    <span>4:50 PM</span>
                    <span>5:02 PM</span>
                  </div>
                </div>

                <div className="session-consistent-note">
                  <span className="consistent-icon">
                    <Check
                      size={13}
                      strokeWidth={2.5}
                    />
                  </span>

                  <strong>
                    Consistent pattern
                  </strong>

                  <span>
                    This session stayed close to
                    {child?.preferredName ?? "the student's"} recent focus range.
                  </span>
                </div>
              </section>

              {/* SUPPORTIVE CONTEXT */}
              <section className="session-context-card">
                <div className="context-icon">
                  <img
                    src={heartImage}
                    alt=""
                  />
                </div>

                <small>
                  Supportive context
                </small>

                <h2>
                  {session.supportiveContext?.title ??
                    "A steady session"}
                </h2>

                <p>
                  {session.supportiveContext?.description ??
                    "The focus score reflects this session's processed pattern. It is separate from time studied and does not diagnose ability."}
                </p>

                <button
                  onClick={() =>
                    navigate("/progress")
                  }
                  type="button"
                >
                  <span>
                    View learning results
                  </span>

                  <ArrowRight
                    size={17}
                    strokeWidth={2}
                  />
                </button>
              </section>
            </div>
          ) : (
            <section className="session-no-chart">
              Focus quality is not available for this
              session.
            </section>
          )}

          {/* LEARNING RESULTS */}
          {session.learningResults?.available && (
            <section className="session-learning-card">
              <div className="session-card-top">
                <div>
                  <small>
                    Shared learning outcome
                  </small>

                  <h2>
                    Learning results
                  </h2>

                  <p>
                    Processed quiz results available
                    after guardian confirmation.
                  </p>
                </div>

                <span className="learning-available">
                  <Check
                    size={12}
                    strokeWidth={2.5}
                  />
                  Available
                </span>
              </div>

              <div className="session-learning-content">
                <article className="mcq-score">
                  <div className="mcq-circle">
                    <b>
                      {session.learningResults.mcqScore}
                    </b>

                    <span>/10</span>
                  </div>

                  <span>MCQ score</span>
                </article>

                <article className="learning-stat">
                  <b>
                    {
                      session.learningResults
                        .questionsCompleted
                    }
                  </b>

                  <span>
                    Questions completed
                  </span>
                </article>

                <article className="learning-stat">
                  <b>
                    {
                      session.learningResults
                        .correctAnswers
                    }
                  </b>

                  <span>
                    Correct answers
                  </span>
                </article>

                <article className="learning-stat">
                  <b>
                    {resultPercent}%
                  </b>

                  <span>
                    Learning result
                  </span>
                </article>

                <div className="learning-result">
                  <div className="result-header">
                    <span>Result</span>
                    <b>{resultPercent}%</b>
                  </div>

                  <div className="result-progress">
                    <span
                      style={{
                        width: `${resultPercent}%`,
                      }}
                    />
                  </div>

                  <p>
                    {child?.preferredName ?? "The student"} completed every question
                    in this session.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* PRIVACY */}
          <div className="session-privacy-footer">
            <span className="privacy-icon">
              <LockKeyhole
                size={15}
                strokeWidth={2}
              />
            </span>

            <strong>
              Detailed activity remains private
            </strong>

            <span>
              This report shows processed learning
              results, not raw tabs, scrolling, or
              minute-by-minute behavior.
            </span>
          </div>
        </main>
      </ParentLayout>
    </div>
  );
}
