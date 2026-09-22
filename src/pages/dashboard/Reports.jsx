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
import { api } from "../../services/api";
import {
  cacheParentChildren,
  findConnectedChild,
  findPendingChild,
  getCachedParentChildren,
} from "../../services/parentChildrenCache";
import { getPendingInvitationForUser } from "../../services/pendingInvitationCache";
import { useAuth } from "../../context/AuthContext";
import seclock from "../../assets/seclock.png";
import people from "../../assets/people.png";



import "../../css/dashboard/Reports.css";

export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [childInfo, setChildInfo] = useState(() => findConnectedChild(getCachedParentChildren()));
  const [pendingChild, setPendingChild] = useState(
    () => findPendingChild(getCachedParentChildren()) || getPendingInvitationForUser(user?.email)
  );
  const [sessions, setSessions] = useState([]);
  const sessionsPerPage = 4;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [subjectFilter, statusFilter]);

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
          const history = await api(
            `/api/parents/students/${connectedChild.studentId}/dashboard/sessions?page=1&pageSize=100`,
          ).catch(() => null);
          if (active) {
            setSessions((history?.sessions || []).map(mapSession));
          }
        } else if (active) {
          setSessions([]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!active) return;
        // A dashboard endpoint may be unavailable or privacy-restricted; that
        // must render the empty state, never a blank page.
      });
    return () => { active = false; };
  }, [user?.email]);

  if (!childInfo) {
    return (
      <div className="reports-page-shell">
        <DashboardHeader activePage="reports" />
        <ParentLayout>
          <ReportsUnavailable
            childName={pendingChild?.firstName}
            onAction={() => navigate(pendingChild ? "/waiting-for-child" : "/choose-start")}
          />
        </ParentLayout>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="reports-page-shell">
        <DashboardHeader activePage="reports" />
        <ParentLayout>
          <main className="reports-page reports-empty-connected-page">
            <header className="reports-heading">
              <div className="reports-title-content">
                <span className="reports-eyebrow">✣ Parent learning view</span>
                <h1>Reports</h1>
                <p>Completed sessions shared by {childInfo.firstName || "your child"} will appear here.</p>
              </div>
            </header>
            <section className="reports-connected-empty-card">
              <span className="reports-connected-empty-icon"><Clock3 size={28} /></span>
              <h2>No reports shared yet</h2>
              <p>
                {childInfo.firstName || "Your child"} is connected, but hasn&apos;t shared any study sessions yet.
                Reports will appear automatically after their first recorded session.
              </p>
              <span>Shared data stays under {childInfo.firstName || "your child"}&apos;s control.</span>
            </section>
          </main>
        </ParentLayout>
      </div>
    );
  }

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
                Completed sessions shared by {childInfo.firstName || "your child"}.
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
                Sep 1 – Sep 8, 2026
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
                    onChange={(event) => setSubjectFilter(event.target.value)}
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
                    onChange={(event) => setStatusFilter(event.target.value)}
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
                              {session.date}
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

                          {session.focusTrend === "improving" ? (
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
                No sessions match the selected filters.
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

function mapSession(session) {
  const subject = session.subjectName || "Study session";
  return {
    id: session.id,
    subject,
    subjectCode: subject.slice(0, 2).toUpperCase(),
    date: new Date(session.startedAtUtc).toLocaleString(),
    durationMinutes: session.actualStudyMinutes || 0,
    format: session.mode || "Study session",
    status: String(session.status || "").toLowerCase(),
    focusTrend: null,
  };
}

function ReportsUnavailable({ childName, onAction }) {
  const isPending = Boolean(childName);

  return (
    <main className="reports-page reports-unavailable-page">
      <header className="reports-heading">
        <div className="reports-title-content">
          <span className="reports-eyebrow">✣ Parent learning view</span>
          <h1>Reports</h1>
          <p>
            {isPending
              ? `Reports will appear after ${childName} confirms the connection.`
              : "Connect with your child to view shared study reports."}
          </p>
        </div>
      </header>
      <section className="reports-unavailable-card" aria-labelledby="reports-unavailable-title">
        <div className="reports-unavailable-icon">
          {isPending ? (
            <img src={seclock} alt="Waiting" />
          ) : (
            <img src={people} alt="" />
          )}
        </div>
        <h2 id="reports-unavailable-title">
          {isPending ? `Waiting for ${childName} to confirm` : "No child connected"}
        </h2>
        <p>
          {isPending
            ? `Reports will appear after ${childName} accepts your connection request and chooses what to share.`
            : "Connect with your child to view shared sessions, focus trends, and learning progress."}
        </p>
        {isPending && <span className="reports-pending-badge">● Connection pending</span>}
        <button type="button" onClick={onAction}>
          {isPending ? "Manage invitation" : "Connect with your child"}
        </button>
      </section>
    </main>
  );
}
