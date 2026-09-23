import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Check,
  ChevronDown,
  CircleAlert,
  Mail,
  X,
} from "lucide-react";

import { Card } from "../../components/ui/CommonUI";
import { parent } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import { useChildProfile } from "../../context/ChildProfileContext";
import {
  getChildInvitationDraft,
  saveChildInvitationDraft,
} from "../../services/childInvitationDraft";
import { cachePendingInvitation } from "../../services/pendingInvitationCache";
import { api } from "../../services/api";
import logo from "../../assets/logo.png";

import "../../css/onboarding/InviteChild.css";

const steps = [
  "Basic info",
  "Studies",
  "Context",
  "Goal",
  "Review",
  "Invite",
];

export default function InviteChild() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { child, updateChild } = useChildProfile();
  const parentName = user?.firstName || parent.firstName || "Account";

  function buildInviteLink() {
    return `https://focuslens.app/invite/${encodeURIComponent(
      child.preferredName || "demo"
    )}`;
  }

  const [method, setMethod] = useState(
    searchParams.get("method") === "link" ? "link" : "email"
  );

  const [email, setEmail] = useState(
    () => getChildInvitationDraft().email || child.email
  );
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);

  const [inviteLink, setInviteLink] = useState(() =>
    searchParams.get("method") === "link" ? buildInviteLink() : ""
  );
  const [showCopiedModal, setShowCopiedModal] = useState(false);
  const [showEmailMessage, setShowEmailMessage] = useState(false);
  const [showLinkMessage, setShowLinkMessage] = useState(false);

  const sendingTimer = useRef(null);
  const errorToastTimer = useRef(null);

  const isSending = status === "sending";
  const hasFailed = status === "failed";

  useEffect(() => {
    return () => {
      window.clearTimeout(sendingTimer.current);
      window.clearTimeout(errorToastTimer.current);
    };
  }, []);

  useEffect(() => {
    const draftId = sessionStorage.getItem("childSetupDraftId");
    if (!draftId) return;

    api(`/api/parents/child-setups/${draftId}`)
      .then((draft) => {
        if (!draft.firstName && !draft.lastName) return;

        updateChild({
          preferredName: draft.firstName || child.preferredName,
          lastName: draft.lastName || child.lastName,
          dateOfBirth: draft.dateOfBirth || child.dateOfBirth,
          grade: draft.grade?.replace(/(\D)(\d)/, "$1 $2") || child.grade,
          subjects: draft.subjects?.length
            ? draft.subjects.map((subject) => subject.customName || subject.type)
            : child.subjects,
          studyPriorities: draft.studyPriorities?.length
            ? draft.studyPriorities
            : child.studyPriorities,
          studyTimeGoal: draft.studyTimeGoal
            ? {
                goalType: draft.studyTimeGoal.period?.toLowerCase(),
                value: String(draft.studyTimeGoal.targetMinutes / 60),
                cycle: "Current week",
              }
            : child.studyTimeGoal,
        });
      })
      .catch(() => {});
  // This hydration only runs once when the page opens; user edits remain authoritative.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateChild]);

  function showSendingError(message) {
    setStatus("failed");
    setErrorMessage(message);
    setShowErrorToast(true);

    window.clearTimeout(errorToastTimer.current);

    errorToastTimer.current = window.setTimeout(() => {
      setShowErrorToast(false);
    }, 3000);
  }

  async function handleSendEmail() {
    if (isSending) return;

    const cleanEmail = email.trim();
    const validEmail = /\S+@\S+\.\S+/.test(cleanEmail);

    setShowEmailMessage(true);
    setShowErrorToast(false);

    if (!validEmail) {
      showSendingError("Please enter a valid email address.");
      return;
    }

    updateChild({ email: cleanEmail });
    saveChildInvitationDraft({ email: cleanEmail });
    setStatus("sending");
    setErrorMessage("");
    try {
      const draftId = sessionStorage.getItem("childSetupDraftId");
      if (!draftId) {
        throw new Error("Start the child setup again before sending an invitation.");
      }
      const targetHours = Number(child.studyTimeGoal?.value);
      if (!Number.isFinite(targetHours) || targetHours <= 0) {
        throw new Error("Add a weekly study goal before sending an invitation.");
      }

      const settings = await api("/api/parents/me/settings");
      if (!settings.weekStartsOn) {
        await api("/api/parents/me/settings", {
          method: "PUT",
          body: { weekStartsOn: "Sunday" },
        });
      }

      const subjectTypes = {
        Mathematics: "Math", Math: "Math", English: "English", History: "History",
        Physics: "Physics", Chemistry: "Chemistry", Biology: "Biology",
        Geography: "Geography", Languages: "Languages", "Computer Science": "ComputerScience",
        ComputerScience: "ComputerScience", Other: "Other",
      };
      const priorities = {
        "Help my child build a study routine": "BuildStudyRoutine",
        "Help my child stay focused": "StayFocused",
        "Help my child understand difficult topics": "UnderstandDifficultTopics",
        "Support my child’s exam preparation": "ExamPreparation",
        "Encourage my child to reach study goals": "ReachStudyGoals",
        BuildStudyRoutine: "BuildStudyRoutine",
        StayFocused: "StayFocused",
        UnderstandDifficultTopics: "UnderstandDifficultTopics",
        ExamPreparation: "ExamPreparation",
        ReachStudyGoals: "ReachStudyGoals",
      };
      const selectedSubjects = (child.subjects || [])
        .map((subject) => ({
          type: subjectTypes[subject] || "Other",
          customName: subjectTypes[subject] ? null : subject,
        }));
      const selectedPriorities = (child.studyPriorities || [])
        .map((item) => priorities[item])
        .filter(Boolean);

      const missingSteps = [
        !child.preferredName?.trim() && "preferred name",
        !child.lastName?.trim() && "last name",
        !child.dateOfBirth && "date of birth",
        !child.grade && "grade",
        selectedSubjects.length === 0 && "at least one subject",
        selectedPriorities.length === 0 && "at least one study priority",
      ].filter(Boolean);
      if (missingSteps.length) {
        throw new Error(`Complete ${missingSteps.join(", ")} before sending an invitation.`);
      }

      await api(`/api/parents/child-setups/${draftId}`, {
        method: "PUT",
        body: {
          firstName: child.preferredName?.trim(),
          lastName: child.lastName?.trim(),
          dateOfBirth: child.dateOfBirth || null,
          grade: child.grade?.replace(/\s/g, "") || null,
          subjects: selectedSubjects,
          studyPriorities: selectedPriorities,
          studyTimeGoal: {
            period: "Weekly",
            targetMinutes: Math.round(targetHours * 60),
            days: null,
            startDate: new Date().toISOString().slice(0, 10),
          },
        },
      });

      const updatedDraft = await api(`/api/parents/child-setups/${draftId}`);
      const completed =
        updatedDraft.firstName &&
        updatedDraft.lastName &&
        updatedDraft.dateOfBirth &&
        updatedDraft.grade &&
        updatedDraft.subjects?.length &&
        updatedDraft.studyPriorities?.length &&
        updatedDraft.studyTimeGoal;
      if (!completed) {
        throw new Error("Complete the child setup before sending an invitation.");
      }

      const invitation = await api(`/api/parents/child-setups/${draftId}/invite`, {
        method: "POST",
        body: { childEmail: cleanEmail },
      });
      sessionStorage.setItem("childSetupInvitation", JSON.stringify(invitation));
      cachePendingInvitation({
        type: "ChildSetup",
        childSetupInvitationStatus: "Pending",
        childSetupDraftId: draftId,
        firstName: child.preferredName,
        lastName: child.lastName,
        email: cleanEmail,
        grade: child.grade,
        parentEmail: user?.email,
        childSetupInvitationExpiresAtUtc: invitation?.expiresAtUtc,
      });
      navigate("/setup/invitation-sent");
    } catch (requestError) {
      const message = requestError.message || "Something went wrong. Please try again.";
      if (/already.*invited|invitation.*already exists/i.test(message)) {
        showSendingError("This child already has an invitation. Manage it from your dashboard.");
      } else if (requestError.status === 401) {
        showSendingError("Your session expired. Please sign in again.");
      } else if (requestError.status === 403) {
        showSendingError("You can’t send this invitation with this account.");
      } else if (/failed to fetch|network/i.test(message)) {
        showSendingError("Check your internet connection and try again.");
      } else if (/complete .* before sending|start the child setup again/i.test(message)) {
        showSendingError("Finish your child’s profile before sending the invitation.");
      } else {
        showSendingError("We couldn’t send the invitation. Please try again.");
      }
    }
  }

  function retrySending() {
    handleSendEmail();
  }

  function handleEmailTab() {
    setMethod("email");
    setStatus("idle");
    setShowErrorToast(false);
    setShowEmailMessage(false);
    setShowLinkMessage(false);
  }

  function handleLinkTab() {
    setMethod("link");
    setStatus("idle");
    setShowErrorToast(false);
    setShowEmailMessage(false);
    setInviteLink((currentLink) => currentLink || buildInviteLink());
    setShowLinkMessage(true);
  }

  function handleCopyLink() {
    const link = inviteLink || buildInviteLink();

    setInviteLink(link);
    if (!navigator.clipboard) {
      showSendingError("Your browser could not copy the link. Please copy it manually.");
      return;
    }

    navigator.clipboard.writeText(link).catch(() => {
      showSendingError("Your browser could not copy the link. Please try again.");
    });

    setShowLinkMessage(true);
    setShowCopiedModal(true);
  }

  return (
    <div className="invite-shell">
      <header className="invite-navbar">
        <Link to="/" className="invite-brand">
          <img src={logo} alt="FocusLens" />
          <span>FocusLens</span>
        </Link>

        <Link
          to="/profile"
          className="invite-parent-profile"
          aria-label={`Open ${parentName}'s profile`}
        >
          <span className="invite-parent-avatar">
            {parentName[0]?.toUpperCase() ?? "A"}
          </span>

          <span>{parentName}</span>

          <ChevronDown size={15} strokeWidth={1.8} />
        </Link>
      </header>

      <main className="invite-main">
        {showErrorToast && (
          <div className="invite-error-toast" role="alert" aria-live="assertive">
            <span className="invite-error-icon">
              <CircleAlert size={22} strokeWidth={2.4} />
            </span>

            <div>
              <b>{method === "email" ? "We couldn’t send the invitation" : "We couldn’t send the link"}</b>
              <small>
                {errorMessage || "Please try again in a moment."}
              </small>
            </div>

            <button
              type="button"
              aria-label="Close error message"
              onClick={() => setShowErrorToast(false)}
            >
              <X size={19} />
            </button>
          </div>
        )}

        <div className="invite-page">
          <Card>
            <div className="invite-card-page">
              <div className="invite-stepper">
                {steps.map((item, index) => {
                  const number = index + 1;
                  const isCompleted = number < 6;
                  const isActive = number === 6;

                  return (
                    <div
                      key={item}
                    className={`invite-step ${
  isCompleted ? "is-completed" : ""
} ${isActive ? "is-active" : ""}`}
                    >
                      <span className="invite-step-circle">
                        {isCompleted ? (
                          <Check size={12} strokeWidth={2.8} />
                        ) : (
                          number
                        )}
                      </span>

                      <span className="invite-step-label">{item}</span>
                    </div>
                  );
                })}
              </div>

              <h1 className="invite-title">
                Invite {child.preferredName} to FocusLens
              </h1>

              <p className="invite-subtitle">
                Choose one private way to share the invitation.
              </p>

              <div className="invite-tabs">
                <button
                  type="button"
                  className={method === "email" ? "active" : ""}
                  disabled={isSending}
                  onClick={handleEmailTab}
                >
                  Send by email
                </button>

                <button
                  type="button"
                  className={method === "link" ? "active" : ""}
                  disabled={isSending}
                  onClick={handleLinkTab}
                >
                  Copy invitation link
                </button>
              </div>

              {method === "email" && (
                <div className="invite-email-content">
                  {showEmailMessage && (
                    <p className="invite-field-title">
                      <Mail size={17} strokeWidth={1.8} />
                      Send a private email
                    </p>
                  )}

                  <div className="invite-input-wrap">
                    <label htmlFor="child-email">
                      {child.preferredName}&apos;s email
                    </label>

                    <input
                      id="child-email"
                      type="email"
                      value={email}
                      disabled={isSending}
                      onChange={(event) => {
                        const nextEmail = event.target.value;
                        setEmail(nextEmail);
                        saveChildInvitationDraft({ email: nextEmail });
                      }}
                    />
                  </div>

                  {showEmailMessage && (
                    <p className="invite-hint">
                      Only {child.preferredName} should use this invitation.
                      It expires 7 days after creation.
                    </p>
                  )}
                </div>
              )}

              {method === "link" && (
                <div className="invite-link-content">
                  {showLinkMessage && (
                    <p className="invite-field-title">
                      Share a private invitation link
                    </p>
                  )}

                  <div className="invite-input-wrap">
                    <label htmlFor="private-link">
                      Private invitation link
                    </label>

                    <input
                      id="private-link"
                      type="text"
                      readOnly
                      value={inviteLink}
                    />
                  </div>

                  {showLinkMessage && (
                    <p className="invite-hint">
                      Share directly with {child.preferredName}. Anyone with
                      this link may be able to open the invitation.
                    </p>
                  )}
                </div>
              )}

              <div className="invite-notice">
                <b>{child.preferredName} stays in control</b>

                <p>
                  He&apos;ll see who invited him, review his profile and
                  suggested goal, then activate the invitation.
                </p>

                <small>
                  You won&apos;t see study data before activation and sharing
                  approval.
                </small>
              </div>

              <div className="invite-actions">
                <button
                  type="button"
                  aria-label="Back to review"
                  className="invite-back"
                  disabled={isSending}
                  onClick={() => navigate("/setup/review")}
                >
                  ‹
                </button>

                {method === "link" ? (
                  <button
                    type="button"
                    className="invite-primary-button"
                    onClick={handleCopyLink}
                  >
                    Copy invitation
                  </button>
                ) : isSending ? (
                  <button
                    type="button"
                    className="invite-primary-button sending"
                    disabled
                  >
                    Sending...
                  </button>
                ) : hasFailed ? (
                  <button
                    type="button"
                    className="invite-primary-button"
                    onClick={retrySending}
                  >
                    Retry
                  </button>
                ) : (
                  <button
                    type="button"
                    className="invite-primary-button"
                    onClick={handleSendEmail}
                  >
                    Send invitation
                  </button>
                )}
              </div>

              {method === "link" && (
                <p className="invite-expiry">
                  Expires 7 days after creation. You can cancel it from the
                  dashboard.
                </p>
              )}
            </div>
          </Card>
        </div>

        {showCopiedModal && (
          <div className="invite-modal-overlay">
            <section className="invite-copied-modal">
              <h2>Invitation link copied</h2>

              <p>
                Share it privately with {child.preferredName}.
                <br />
                He&apos;ll review the setup before activating. The invitation
                expires in 7 days.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowCopiedModal(false);
                  navigate("/setup/invitation-sent");
                }}
              >
                Done
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
