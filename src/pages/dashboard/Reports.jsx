import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Pause,
  ArrowUpRight,
  Check,
} from "lucide-react";

import { ParentLayout } from "../../components/ui/CommonUI";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { useAuth } from "../../context/AuthContext";
import { getSessions } from "../../services/reports";



import "../../css/dashboard/Reports.css";

export default function Reports() {
  const navigate = useNavigate();
  const { child } = useAuth();

  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 4;

  const [sessions, setSessions] = useState([]);
  const [loadError, setLoadError] = useState("");

  // ------------------------------------------------------------
  // Load only records authorized for the linked child.
  // ------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;

    async function loadSessions() {
      try {
        const data = await getSessions({ studentId: child?.id });
        if (isCancelled || !data) return;

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
          ? data.items
          : null;

        setSessions(items ?? []);
        setLoadError("");
      } catch (err) {
        console.error("Failed to load reports sessions:", err);
        if (!isCancelled) {
          setSessions([]);
          setLoadError("We couldn't load session reports. Please try again.");
        }
      }
    }

    loadSessions();

    return () => {
      isCancelled = true;
    };
  }, [child]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSubject =
        subjectFilter === "all" ||
        session.subject === subjectFilter;

      const matchesStatus =
        statusFilter === "all" ||
        session.status === statusFilter;

      return matchesSubject && matchesStatus;
    });
  }, [sessions, subjectFilter, statusFilter]);

  const subjects = [
    "all",
    ...new Set(
      sessions.map((session) => session.subject)
    ),
  ];

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSessions.length / sessionsPerPage)
  );

  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * sessionsPerPage;
    return filteredSessions.slice(startIndex, startIndex + sessionsPerPage);
  }, [currentPage, filteredSessions]);

  const firstSessionNumber = filteredSessions.length
    ? (currentPage - 1) * sessionsPerPage + 1
    : 0;
  const lastSessionNumber = Math.min(
    currentPage * sessionsPerPage,
    filteredSessions.length
  );

  return (
    <div className="reports-page-shell">
      <DashboardHeader activePage="reports" />

      <ParentLayout>
        <main className="reports-page">

          {/* =========================
              PAGE HEADER
          ========================= */}

          <header className="reports-heading">



            <div className="reports-title-content">

              <span className="reports-eyebrow">
                ✣ PARENT LEARNING VIEW
              </span>

              <h1>Reports</h1>

              <p>
                Sessions shared by {child?.preferredName ?? "your child"}.
              </p>

            </div>

            <button
              className="reports-date-button"
              type="button"
            >
              <CalendarDays
                size={16}
                strokeWidth={1.7}
              />

              <span>
                All available dates
              </span>
            </button>

          </header>


          {/* =========================
              REPORTS CARD
          ========================= */}

          <section className="reports-card">

            {/* CARD HEADER */}

            <div className="reports-card-heading">

              <div>
                <h2>Session history</h2>

                <p>
                  {filteredSessions.length} sessions in this view
                </p>
              </div>


              <div className="reports-filters">

                {/* SUBJECT FILTER */}

                <label className="reports-select">

                  <select
                    value={subjectFilter}
                    onChange={(event) => {
                      setSubjectFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    {subjects.map((subject) => (
                      <option
                        key={subject}
                        value={subject}
                      >
                        {subject === "all"
                          ? "All subjects"
                          : subject}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={15}
                    strokeWidth={1.7}
                  />

                </label>


                {/* STATUS FILTER */}

                <label className="reports-select">

                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">
                      All statuses
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                    <option value="paused">
                      Paused
                    </option>
                  </select>

                  <ChevronDown
                    size={15}
                    strokeWidth={1.7}
                  />

                </label>

              </div>

            </div>


            {/* =========================
                TABLE
            ========================= */}

            <div className="reports-table-wrap">

              <table className="reports-table">

                <thead>

                  <tr>
                    <th>Date &amp; subject</th>
                    <th>Duration</th>
                    <th>Format</th>
                    <th>Status</th>
                    <th>Focus quality</th>
                    <th />
                  </tr>

                </thead>


                <tbody>

                  {paginatedSessions.map((session) => (

                    <tr key={session.id}>

                      {/* SUBJECT */}

                      <td>

                        <div className="reports-subject">

                          <span>
                            {session.subjectCode}
                          </span>

                          <div>
                            <b>
                              {session.subject}
                            </b>

                            <small>
                              {new Date(session.date).toLocaleString()}
                            </small>
                          </div>

                        </div>

                      </td>


                      {/* DURATION */}

                      <td>

                        <span className="reports-duration">

                          <Clock3
                            size={16}
                            strokeWidth={1.7}
                          />

                          {session.durationMinutes} min

                        </span>

                      </td>


                      {/* FORMAT */}

                      <td>
                        {session.format}
                      </td>


                      {/* STATUS */}

                      <td>

                        <span
                          className={
                            session.status === "completed"
                              ? "reports-status completed"
                              : "reports-status paused"
                          }
                        >

                          {session.status === "completed" ? (
                            <>
                              <Check
                                size={13}
                                strokeWidth={2.2}
                              />

                              Completed
                            </>
                          ) : (
                            <>
                              <Pause
                                size={11}
                                strokeWidth={2.2}
                              />

                              Paused
                            </>
                          )}

                        </span>

                      </td>


                      {/* FOCUS */}

                      <td>

                        <span
                          className={
                            session.focusTrend === "improving"
                              ? "reports-trend improving"
                              : "reports-trend"
                          }
                        >

                          {!session.aiAnalysisAvailable ? (
                            <>
                              <span className="stable-line">—</span>
                              Not available
                            </>
                          ) : session.focusTrend === "improving" ? (
                            <>
                              <ArrowUpRight
                                size={15}
                                strokeWidth={2}
                              />

                              Improving
                            </>
                          ) : (
                            <>
                              <span className="stable-line">
                                —
                              </span>

                              Stable
                            </>
                          )}

                        </span>

                      </td>


                      {/* DETAILS */}

                      <td>

                        <button
                          className="reports-details-button"
                          type="button"
                          onClick={() =>
                            navigate(
                              `/reports/session/${session.id}`
                            )
                          }
                        >

                          View details

                          <ChevronRight
                            size={15}
                            strokeWidth={1.8}
                          />

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>


            {/* EMPTY */}

            {filteredSessions.length === 0 && (
              <div className="reports-empty">
                {loadError || "No sessions match the selected filters."}
              </div>
            )}


            {/* =========================
                PAGINATION
            ========================= */}

            <footer className="reports-pagination">

              <span>
                Showing {firstSessionNumber}–{lastSessionNumber} of {filteredSessions.length} sessions
              </span>

              <div>

                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={page === currentPage ? "active" : ""}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  Next
                  <ChevronRight size={15} />
                </button>

              </div>

            </footer>

          </section>


        </main>
      </ParentLayout>

    </div>
  );
}
