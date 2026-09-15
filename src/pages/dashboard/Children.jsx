import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ParentLayout } from "../../components/ui/CommonUI";
import ChildProfileModal from "../../components/ui/ChildProfileModal";
import DashboardHeader from "../../components/ui/DashboardHeader";

import { getStudents, getStudent } from "../../services/access";
import { getParentDashboard } from "../../services/dashboard";
import {
  resendChildSetupInvite,
  cancelChildSetupInvite,
  inviteChildSetupByLink,
  getChildSetupInvitations,
} from "../../services/parents";

import "../../css/dashboard/Children.css";

const emptyChild = {
  id: null,
  fullName: "",
  preferredName: "Student",
  grade: "Not provided",
  email: "",
  connectionStatus: "not_connected",
  subjects: [],
  priorities: [],
  availableData: [],
  currentGoal: null,
  invitation: null,
};

function normalizeStudent(raw, dashboard) {
  if (!raw || typeof raw !== "object") return null;

  return {
    ...emptyChild,
    ...raw,
    fullName: raw.fullName ?? [raw.firstName, raw.lastName].filter(Boolean).join(" "),
    subjects: Array.isArray(raw.subjects)
      ? raw.subjects.map((subject) => subject.customName ?? subject.type ?? subject)
      : [],
    priorities: Array.isArray(raw.priorities ?? raw.studyPriorities)
      ? raw.priorities ?? raw.studyPriorities
      : [],
    availableData: Array.isArray(raw.availableData)
      ? raw.availableData
      : ["Session summaries", "Study-time progress", "Study goals"],
    currentGoal: dashboard?.activeGoal ?? {
      targetMinutes: 0,
      completedMinutes: 0,
    },
    invitation: raw.invitation ?? null,
    connectionStatus: "connected",
  };
}

export default function Children() {
  const navigate = useNavigate();

  const [child, setChild] = useState(emptyChild);
  const [showProfile, setShowProfile] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const feedbackTimer = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadStudents() {
      try {
        const data = await getStudents();
        const list = Array.isArray(data) ? data : data?.items ?? [];

        if (isCancelled) return;

        if (list.length === 0) {
          const invitations = await getChildSetupInvitations();
          if (isCancelled) return;
          const pending = (invitations ?? []).find(
            (item) => item.status?.toLowerCase() === "pending"
          );

          if (!pending) {
            setChild(emptyChild);
            return;
          }

          sessionStorage.setItem("childSetupDraftId", pending.draftId);
          setChild({
            ...emptyChild,
            fullName: [pending.firstName, pending.lastName].filter(Boolean).join(" "),
            preferredName: pending.firstName || "Student",
            grade: pending.grade ?? "Not provided",
            email: pending.targetEmail ?? "",
            connectionStatus: "pending",
            invitation: {
              sentAt: "Sent",
              expiresAt: pending.expiresAtUtc
                ? new Date(pending.expiresAtUtc).toLocaleString()
                : "Not available",
            },
          });
          return;
        }

        const details = await getStudent(list[0].id);
        const dashboard = await getParentDashboard(list[0].id).catch(() => null);
        const normalized = normalizeStudent(details, dashboard);
        if (normalized) {
          setChild(normalized);
        }
      } catch (err) {
        console.error("Failed to load connected students:", err);
      }
    }

    loadStudents();

    return () => {
      isCancelled = true;
    };
  }, []);

  const isConnected = child.connectionStatus === "connected";
  const isPending = child.connectionStatus === "pending";

  function showFeedback(type) {
    window.clearTimeout(feedbackTimer.current);
    setFeedback(type);

    feedbackTimer.current = window.setTimeout(() => {
      setFeedback(null);
      feedbackTimer.current = null;
    }, 3000);
  }

  async function resendInvitation() {
    const draftId = sessionStorage.getItem("childSetupDraftId");

    try {
      if (draftId) {
        await resendChildSetupInvite(draftId);
      }
    } catch (err) {
      console.error("Failed to resend invitation:", err);
    }

    showFeedback("resent");
  }

  async function copyInvitationLink() {
    const draftId = sessionStorage.getItem("childSetupDraftId");
    let link = "focuslens.example/invite/youssef-demo";

    if (draftId) {
      try {
        const data = await inviteChildSetupByLink(draftId);
        const realLink =
          data?.invitationUrl ?? data?.link ?? data?.url ?? data?.inviteLink;
        if (realLink) link = realLink;
      } catch (err) {
        console.error("Failed to create invitation link:", err);
      }
    }

    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Mock UI
    }

    showFeedback("copied");
  }

  async function cancelInvitation() {
    const draftId = sessionStorage.getItem("childSetupDraftId");

    try {
      if (draftId) {
        await cancelChildSetupInvite(draftId);
      }
    } catch (err) {
      console.error("Failed to cancel invitation:", err);
    }

    setChild((current) => ({
      ...current,
      connectionStatus: "not_connected",
    }));

    setShowCancel(false);

    showFeedback("cancelled");
  }

  const goalPercentage = child.currentGoal
    && child.currentGoal.targetMinutes > 0
    ? Math.round(
        (child.currentGoal.completedMinutes /
          child.currentGoal.targetMinutes) *
          100
      )
    : 0;

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

            <span className="children-heading-avatar">
              {child.fullName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "FL"}
            </span>
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
                    src="/src/assets/people.png"
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
                          src="/src/assets/book.jpg"
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

                  <section className="children-panel current-goal-panel">
                    <div className="children-panel-title">
                      <span className="children-panel-icon">
                        <img
                          src="/src/assets/arrow.jpg"
                          alt=""
                        />
                      </span>

                      <h2>Current study goal</h2>
                    </div>

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
                  </section>
                </div>

                <div className="children-right-column">
                  <section className="children-panel privacy-panel">
                    <div className="children-panel-title privacy-title">
                      <div className="privacy-title-row">
                        <span className="children-panel-icon">
                          <img
                            src="/src/assets/secure.png"
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

                      <small>Available data</small>

                      {child.availableData.map((item) => (
                        <p
                          className="children-data-item"
                          key={item}
                        >
                          <span>✓</span>
                          {item}
                        </p>
                      ))}

                      <p className="children-permission-text">
                        You can view shared session summaries,
                        progress trends and study goals.
                      </p>
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
                        <img src="/src/assets/paper.png" alt="" />
                      </span>

                      <span>View Reports</span>
                      <b>→</b>
                    </button>

                    <button
                      onClick={() => navigate("/progress")}
                      type="button"
                    >
                      <span className="quick-link-icon">
                        <img src="/src/assets/colum.png" alt="" />
                      </span>

                      <span>View Progress</span>
                      <b>→</b>
                    </button>

                    <button
                      onClick={() => navigate("/study-goals")}
                      type="button"
                    >
                      <span className="quick-link-icon">
                        <img src="/src/assets/flash.png" alt="" />
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
                        src="/src/assets/message.png"
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
    src="/src/assets/double.png"
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

                      <p>
                        {child.preferredName} will no longer be able to use this
                        invitation link.
                      </p>

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
                      src="/src/assets/seclock.png"
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
                      src="/src/assets/people.png"
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
