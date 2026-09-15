import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowUp,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Info,
  Moon,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";

import { ParentLayout } from "../../components/ui/CommonUI";
import { progressMock } from "../../data/mockData";
import { getProgress, getBehavioralProgress } from "../../services/progress";
import DashboardHeader from "../../components/ui/DashboardHeader";

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

  const [range, setRange] = useState("30");
  const [progressData, setProgressData] = useState(progressMock);

  const [selectedSubjectName, setSelectedSubjectName] = useState(
    progressMock.subjects[0]?.name
  );

  const [selectedTimePeriod, setSelectedTimePeriod] = useState("Afternoon");

  useEffect(() => {
    let isCancelled = false;

    async function loadProgress() {
      try {
        const [progress, behavioral] = await Promise.all([
          getProgress({ range }).catch(() => null),
          getBehavioralProgress({ range }).catch(() => null),
        ]);

        if (isCancelled) return;

        if (progress || behavioral) {
          setProgressData((current) => ({
            ...current,
            ...(progress ?? {}),
            ...(behavioral ? { timeOfDayPattern: behavioral.timeOfDayPattern ?? current.timeOfDayPattern } : {}),
            focusQuality: {
              ...current.focusQuality,
              ...(progress?.focusQuality ?? {}),
            },
            studyTime: {
              ...current.studyTime,
              ...(progress?.studyTime ?? {}),
            },
            subjects: Array.isArray(progress?.subjects)
              ? progress.subjects
              : current.subjects,
          }));
        }
      } catch (err) {
        console.error("Failed to load progress data:", err);
      }
    }

    loadProgress();

    return () => {
      isCancelled = true;
    };
  }, [range]);

  const selectedSubject = useMemo(
    () =>
      progressData.subjects.find(
        (subject) => subject.name === selectedSubjectName
      ) ?? progressData.subjects[0],
    [selectedSubjectName, progressData.subjects]
  );

  const focusPoints = progressData.focusQuality.points;

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

  const maxStudyMinutes = Math.max(
    ...progressData.studyTime.points
  );

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
                    {progressData.focusQuality.average}%
                  </strong>
                </div>

                <span className="progress-change positive">
                  <ArrowUp
                    size={14}
                    strokeWidth={2.2}
                  />

                  {progressData.focusQuality.changePercent}% vs
                  previous period
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
                      <span>Mar 1</span>
                      <span>Mar 6</span>
                      <span>Mar 11</span>
                      <span>Mar 16</span>
                      <span>Mar 21</span>
                      <span>Mar 26</span>
                      <span>Mar 31</span>
                    </div>

                  </div>
                </div>

                <p className="progress-card-note">
                  Focus quality is improving compared with the
                  previous period.
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
                      progressData.studyTime.totalMinutes
                    )}
                  </strong>

                </div>

                <span className="progress-change lime">
                  {/* <ArrowUp
                    size={14}
                    strokeWidth={2.2}
                  /> */}

                  {formatStudyTime(
                    progressData.studyTime.changeMinutes
                  )}

                  {" "}more than previous period
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

                      {progressData.studyTime.points.map(
                        (minutes, index) => (
                          <div
                            className="study-bar-column"
                            key={`${minutes}-${index}`}
                          >
                            <i
                              className={
                                index ===
                                progressData.studyTime.points.length - 1
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
                      <span>Mar 1</span>
                      <span>Mar 6</span>
                      <span>Mar 11</span>
                      <span>Mar 16</span>
                      <span>Mar 21</span>
                      <span>Mar 26</span>
                      <span>Mar 31</span>
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

                      {progressData.subjects.map((subject) => (
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
                  There is enough data to show trends for 3 of 5
                  subjects.
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
                    progressData.subjects[0]?.name
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
