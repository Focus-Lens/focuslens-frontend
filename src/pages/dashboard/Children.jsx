import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ParentLayout } from "../../components/ui/CommonUI";
import ChildProfileModal from "../../components/ui/ChildProfileModal";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { api } from "../../services/api";
import { cacheParentChildren, findConnectedChild, findPendingChild, getCachedParentChildren } from "../../services/parentChildrenCache";
import logo from "../../assets/logo.png";
import peopleImage from "../../assets/people.png";
import bookImage from "../../assets/book.jpg";
import arrowImage from "../../assets/arrow.jpg";
import secureImage from "../../assets/secure.png";
import paperImage from "../../assets/paper.png";
import columnImage from "../../assets/colum.png";
import flashImage from "../../assets/flash.png";
import messageImage from "../../assets/message.png";
import doubleImage from "../../assets/double.png";
import sessionClockImage from "../../assets/seclock.png";


import "../../css/dashboard/Children.css";

function ChildrenUnavailable({ onAction }) {
  return (
    <main className="children-page children-unavailable-page">
      <header className="children-heading children-unavailable-heading">
        <div>
          <h1>Children</h1>
          <p>Add a child to view their profile and shared progress.</p>
        </div>
      </header>

      <section className="children-unavailable-card" aria-labelledby="children-unavailable-title">
        <img className="children-unavailable-mascot" src={logo} alt="" />
        <h2 id="children-unavailable-title">No child added yet</h2>
        <p>
          Create your child’s study profile and send a private invitation, or connect with a child
          who already uses FocusLens.
        </p>
        <button type="button" onClick={onAction}>Add your child</button>
        <small>Your child chooses what to share. Study reports appear only after you connect.</small>
      </section>
    </main>
  );
}

export default function Children() {
  const navigate = useNavigate();
  const [childInfo, setChildInfo] = useState(() => findConnectedChild(getCachedParentChildren()));
  const [pendingChild, setPendingChild] = useState(() => findPendingChild(getCachedParentChildren()));
  const [studentDetails, setStudentDetails] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const feedbackTimer = useRef(null);

  useEffect(() => {
    let active = true;
    api("/api/parents/overview/children")
      .then(async (children) => {
        if (!active) return;
        cacheParentChildren(children);
        const connectedChild = findConnectedChild(children);
        setChildInfo(connectedChild);
        setPendingChild(findPendingChild(children));
        if (connectedChild?.studentId) {
          const [details, dashboardData] = await Promise.all([
            api(`/api/access/students/${connectedChild.studentId}`).catch(() => null),
            api(`/api/parents/students/${connectedChild.studentId}/dashboard`).catch(() => null),
          ]);
          if (active) {
            setStudentDetails(details);
            setDashboard(dashboardData);
          }
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const isConnected = Boolean(childInfo?.studentId);
  const isPending = !isConnected && Boolean(pendingChild);
  const child = buildChildView(studentDetails, childInfo, pendingChild, dashboard);

  function showFeedback(type) {
    window.clearTimeout(feedbackTimer.current);
    setFeedback(type);

    feedbackTimer.current = window.setTimeout(() => {
      setFeedback(null);
      feedbackTimer.current = null;
    }, 3000);
  }

  async function resendInvitation() {
    try {
      await api(`/api/parents/child-setups/${pendingChild.childSetupDraftId || pendingChild.id}/invite/resend`, { method: "POST" });
      showFeedback("resent");
    } catch {
      showFeedback("error");
    }
  }

  async function copyInvitationLink() {
    try {
      const response = await api(`/api/parents/child-setups/${pendingChild.childSetupDraftId || pendingChild.id}/invite/link`, { method: "POST" });
      await navigator.clipboard.writeText(response.invitationUrl);
    } catch {
      // Mock UI
    }

    showFeedback("copied");
  }

  async function cancelInvitation() {
    try {
      await api(`/api/parents/child-setups/${pendingChild.childSetupDraftId || pendingChild.id}/invite/cancel`, { method: "POST" });
      setPendingChild(null);
      setShowCancel(false);
      showFeedback("cancelled");
    } catch {
      showFeedback("error");
    }
  }

  const goalPercentage = child.currentGoal
    ? Math.round(
        (child.currentGoal.completedMinutes /
          child.currentGoal.targetMinutes) *
          100
      )
    : 0;

  if (!childInfo && !pendingChild) {
    return (
      <div className="children-page-shell">
        <DashboardHeader activePage="children" />
        <ParentLayout>
          <ChildrenUnavailable onAction={() => navigate("/choose-start")} />
        </ParentLayout>
      </div>
    );
  }

  return (
    <div className="children-page-shell">
      <DashboardHeader activePage="children" />

      <ParentLayout>
        <main className="children-page">
          <header className="children-heading">
            <div>
              <h1>Children</h1>

              <p>
                View your child&apos;s profile, connection and access status.
              </p>
            </div>

            <span className="children-heading-avatar">{child.preferredName?.[0]?.toUpperCase() || "C"}</span>
          </header>

          {/* =====================================================
              CONNECTED
          ===================================================== */}

          {isConnected && (
            <>
              <section className="children-hero">
                <div className="children-avatar">
                  {child.preferredName?.[0] || "Y"}
                </div>

                <div className="children-hero-main">
                  <div className="children-hero-info">
                    <h2>{child.fullName}</h2>

                    <p>
                      {child.grade}

                      <em>
                        <i />
                        Connected
                      </em>
                    </p>

                    <small>Parent access active</small>
                  </div>

                  <div className="children-hero-bottom">
                    <div className="children-relationship">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="8" r="3.5" />
                        <path d="M5.5 20c.8-3.1 3-5 6.5-5s5.7 1.9 6.5 5" />
                      </svg>

                      <div>
                        <span>Relationship</span>
                        <b>Parent</b>
                      </div>
                    </div>

                    <button
                      className="children-text-button"
                      onClick={() => setShowProfile(true)}
                      type="button"
                    >
                      View profile →
                    </button>
                  </div>
                </div>

                <div className="children-hero-image">
                  <img
                    src={peopleImage}
                    alt=""
                  />
                </div>
              </section>

              <div className="children-grid">
                <div className="children-left-column">
                  <section className="children-panel study-profile-panel">
                    <div className="children-panel-title">
                      <span className="children-panel-icon">
                        <img
                          src={bookImage}
                          alt=""
                        />
                      </span>

                      <h2>Study profile</h2>
                    </div>

                    <div className="children-panel-body">
                      <div className="children-row">
                        <span>Subjects</span>

                        <div className="children-chips">
                          {child.subjects.map((subject) => (
                            <span key={subject}>{subject}</span>
                          ))}
                        </div>
                      </div>

                      <div className="children-row">
                        <span>Study priorities</span>

                        <div className="children-chips">
                          {child.priorities.map((priority) => (
                            <span key={priority}>{priority}</span>
                          ))}
                        </div>
                      </div>

                      <div className="children-detail">
                        <span>Grade</span>
                        <b>{child.grade}</b>
                      </div>
                    </div>
                  </section>

                  <section className={`children-panel current-goal-panel ${!child.currentGoal ? "children-panel-compact" : ""}`}>
                    <div className="children-panel-title">
                      <span className="children-panel-icon">
                        <img
                          src={arrowImage}
                          alt=""
                        />
                      </span>

                      <h2>Current study goal</h2>
                    </div>

                    {child.currentGoal ? <>
                    <div className="children-goal-values">
                      <div>
                        <span>Weekly target</span>

                        <b>
                          {Math.round(
                            child.currentGoal.targetMinutes / 60
                          )}{" "}
                          <small>hours</small>
                        </b>
                      </div>

                      <div>
                        <span>Completed</span>

                        <b>
                          {Math.round(
                            child.currentGoal.completedMinutes / 60
                          )}{" "}
                          <small>hours</small>
                        </b>
                      </div>
                    </div>

                    <p className="children-completed">
                      {goalPercentage}% completed
                    </p>

                    <div className="children-progress">
                      <i
                        style={{
                          width: `${goalPercentage}%`,
                        }}
                      />

                      <span className="children-progress-star">
                        ✦
                      </span>
                    </div>

                    <div className="children-progress-scale">
                      <span>0 min</span>

                      <span>
                        {Math.round(
                          child.currentGoal.targetMinutes / 60
                        )}{" "}
                        hours
                      </span>
                    </div>

                    <button
                      className="children-text-button children-goal-button"
                      onClick={() => navigate("/study-goals")}
                      type="button"
                    >
                      View study goal →
                    </button>
                    </> : (
                      <div className="children-goal-empty">
                        <p>No active goal shared yet.</p>
                        <button className="children-text-button children-goal-button" onClick={() => navigate("/study-goals")} type="button">Suggest a study goal →</button>
                      </div>
                    )}
                  </section>
                </div>

                <div className="children-right-column">
                  <section className={`children-panel privacy-panel ${child.availableData.length === 0 ? "children-panel-compact" : ""}`}>
                    <div className="children-panel-title privacy-title">
                      <div className="privacy-title-row">
                        <span className="children-panel-icon">
                          <img
                            src={secureImage}
                            alt=""
                          />
                        </span>

                        <div>
                          <h2>Privacy &amp; access</h2>

                          <span className="access-active">
                            <i />
                            Access active
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="privacy-content">
                      <div className="children-detail">
                        <span>Guardian confirmation</span>
                        <b>Confirmed</b>
                      </div>

                      <div className="privacy-divider" />

                      {child.availableData.length > 0 ? (
                        <>
                          <small>Available data</small>
                          {child.availableData.map((item) => (
                            <p className="children-data-item" key={item}>
                              <span>✓</span>
                              {item}
                            </p>
                          ))}
                          <p className="children-permission-text">
                            You can view shared session summaries,
                            progress trends and study goals.
                          </p>
                        </>
                      ) : (
                        <p className="children-data-empty">
                          No study data has been shared yet. It will appear here when your child chooses to share it.
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="children-panel quick-links-panel">
                    <div className="children-panel-title quick-links-title">
                      <h2>Quick links</h2>
                    </div>

                    <button
                      onClick={() => navigate("/reports")}
                      type="button"
                    >
                      <span className="quick-link-icon">
                        <img src={paperImage} alt="" />
                      </span>

                      <span>View Reports</span>
                      <b>→</b>
                    </button>

                    <button
                      onClick={() => navigate("/progress")}
                      type="button"
                    >
                      <span className="quick-link-icon">
                        <img src={columnImage} alt="" />
                      </span>

                      <span>View Progress</span>
                      <b>→</b>
                    </button>

                    <button
                      onClick={() => navigate("/study-goals")}
                      type="button"
                    >
                      <span className="quick-link-icon">
                        <img src={flashImage} alt="" />
                      </span>

                      <span>View Study Goals</span>
                      <b>→</b>
                    </button>
                  </section>
                </div>
              </div>
            </>
          )}

          {/* =====================================================
              PENDING
          ===================================================== */}

          {isPending && (
            <>
              <div className="children-pending-top">
                {/* INVITATION CARD */}

                <section className="children-panel children-invitation-card">
                  <div className="pending-child-header">
                    <span className="pending-message-icon">
                      <img
                        src={messageImage}
                        alt=""
                      />
                    </span>

                    <div>
                      <h2>{child.fullName}</h2>

                      <p>
                        {child.grade}

                        <em>
                          <i />
                          Invitation pending
                        </em>
                      </p>
                    </div>
                  </div>

                  <div className="pending-details">
                    <div className="pending-detail-row">
                      <span>Invitation destination</span>
                      <b>{child.email}</b>
                    </div>

                    <div className="pending-detail-row">
                      <span>Invitation sent</span>
                      <b>{child.invitation.sentAt}</b>
                    </div>

                    <div className="pending-detail-row">
                      <span>Expires</span>
                      <b>{child.invitation.expiresAt}</b>
                    </div>
                  </div>

                  <div className="children-invitation-actions">
                    <button
                      onClick={resendInvitation}
                      type="button"
                    >
                      Resend invitation
                    </button>

                   <button
  className="copy-invitation-button"
  onClick={copyInvitationLink}
  type="button"
>
  <img
    src={doubleImage}
    alt=""
    className="copy-invitation-icon"
  />
  <span>Copy invitation link</span>
</button>

                    <button
                      className="children-danger-button"
                      onClick={() => setShowCancel(true)}
                      type="button"
                    >
                      Cancel invitation
                    </button>
                  </div>
                </section>

                {/* RIGHT SIDE */}

                <div className="children-pending-right">
                  {feedback && (
                    <div className={`pending-feedback ${feedback}`}>
                      <span className="feedback-icon">
                        {feedback === "copied" ? "i" : "✓"}
                      </span>

                      <span className="feedback-message">
                        {feedback === "resent" && "Invitation resent"}
                        {feedback === "copied" && "Link copied"}
                        {feedback === "cancelled" && "Invitation cancelled"}
                        {feedback === "error" && "We couldn’t complete that action"}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          window.clearTimeout(feedbackTimer.current);
                          feedbackTimer.current = null;
                          setFeedback(null);
                        }}
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {showCancel && (
                    <section className="children-cancel-card">
                      <button
                        className="cancel-close"
                        type="button"
                        onClick={() => setShowCancel(false)}
                      >
                        ×
                      </button>

                      <h2>Cancel invitation?</h2>

                      <p>{child.preferredName} will no longer be able to use this invitation link.</p>

                      <div className="cancel-actions">
                        <button
                          className="keep-invitation"
                          onClick={() => setShowCancel(false)}
                          type="button"
                        >
                          Keep invitation
                        </button>

                        <button
                          className="cancel-confirm"
                          onClick={cancelInvitation}
                          type="button"
                        >
                          Cancel invitation
                        </button>
                      </div>
                    </section>
                  )}
                </div>
              </div>

              {/* BOTTOM PENDING CARDS */}

              <div className="children-pending-bottom">
                <section className="children-panel pending-empty-card">
                  <div className="pending-empty-image">
                    <img
                      src={sessionClockImage}
                      alt=""
                    />
                  </div>

                  <h2>Waiting for guardian confirmation</h2>

                  <p>
                    Reports and progress will become available after
                    confirmation is complete.
                  </p>

                  <span className="confirmation-pending">
                    <i />
                    Confirmation pending
                  </span>

                  <small>
                    Complete confirmation from the secure guardian link.
                  </small>
                </section>

                <section className="children-panel pending-empty-card">
                  <div className="pending-empty-image">
                    <img
                      src={peopleImage}
                      alt=""
                    />
                  </div>

                  <h2>No child connected</h2>

                  <p>
                    Connect a child to view shared profile and learning
                    information.
                  </p>

                  <button
                    onClick={() => navigate("/choose-start")}
                    type="button"
                  >
                    Continue onboarding
                  </button>
                </section>
              </div>

              <footer className="children-future-footer">
                <div>
                  <strong>FUTURE · NOT FOR IMPLEMENTATION</strong>
                  <span>Not linked in prototype</span>
                </div>

                <div className="children-future-actions">
                  <button
                    type="button"
                    onClick={() => navigate("/choose-start")}
                  >
                    Add another child
                  </button>

                  <button type="button" disabled>
                    Future
                  </button>
                </div>
              </footer>
            </>
          )}

          {/* =====================================================
              NOT CONNECTED
          ===================================================== */}

          {child.connectionStatus === "not_connected" && (
            <section className="children-panel children-empty-panel">
              <span>👥</span>

              <h2>No child connected</h2>

              <p>
                Connect a child to view shared profile and learning
                information.
              </p>

              <button
                onClick={() => navigate("/choose-start")}
                type="button"
              >
                Continue onboarding
              </button>
            </section>
          )}

          {showProfile && (
            <ChildProfileModal
              child={child}
              onClose={() => setShowProfile(false)}
            />
          )}
        </main>
      </ParentLayout>
    </div>
  );
}

function buildChildView(details, connectedChild, pendingChild, dashboard) {
  const source = connectedChild || pendingChild || {};
  const firstName = details?.preferredName || details?.firstName || source.firstName || "your child";
  const lastName = details?.lastName || source.lastName || "";
  const goal = dashboard?.currentStudyGoal;
  const progress = dashboard?.currentStudyGoalProgress;
  return {
    fullName: `${firstName} ${lastName}`.trim(),
    preferredName: firstName,
    grade: formatLabel(details?.grade) || "Grade not shared",
    email: details?.email || "Not shared",
    subjects: (details?.subjects || []).map((subject) => subject.customName || formatLabel(subject.type)).filter(Boolean),
    priorities: (details?.studyPriorities || []).map(formatLabel).filter(Boolean),
    connectionStatus: connectedChild?.studentId ? "connected" : pendingChild ? "pending" : "not_connected",
    relationship: "Parent",
    availableData: [
      details?.shareSessionSummariesWithParents && "Session summaries",
      details?.shareSubjectTrendsWithParents && "Progress trends",
      dashboard?.currentStudyGoal && "Study goals",
    ].filter(Boolean),
    currentGoal: goal ? {
      targetMinutes: goal.targetMinutes,
      completedMinutes: progress?.completedMinutes || 0,
    } : null,
    invitation: {
      sentAt: pendingChild ? "Sent" : "",
      expiresAt: pendingChild?.childSetupInvitationExpiresAtUtc
        ? new Date(pendingChild.childSetupInvitationExpiresAtUtc).toLocaleDateString()
        : "",
    },
  };
}

function formatLabel(value) {
  return value ? String(value).replace(/([a-z])([A-Z])/g, "$1 $2") : "";
}
