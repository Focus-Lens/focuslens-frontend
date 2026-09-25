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
import { useAuth } from "../../context/AuthContext";
import { useChildProfile } from "../../context/ChildProfileContext";
import {
  getChildInvitationDraft,
  saveChildInvitationDraft,
} from "../../services/childInvitationDraft";
import {
  createEmailChildSetupInvitation,
  createLinkChildSetupInvitation,
  getChildSetupValidationMessage,
  getDraftProfileSetupMode,
} from "../../services/childSetupFlow";
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

function buildChildSetupPayload(child) {
  const customSubjects = child.otherSubjects?.length
    ? child.otherSubjects
    : child.otherSubject?.trim()
      ? [child.otherSubject.trim()]
      : [];
  const subjects = (child.subjects || []).flatMap((subject) =>
    subject === "Other"
      ? customSubjects.map((customName) => ({ type: "Other", customName }))
      : [{
          type: subjectTypes[subject] || "Other",
          customName: subjectTypes[subject] ? null : subject,
        }],
  );
  const studyPriorities = (child.studyPriorities || [])
    .map((item) => priorities[item])
    .filter(Boolean);
  const targetHours = Number(child.studyTimeGoal?.value);

  return {
    profileSetupMode: child.profileSetupMode,
    firstName: child.preferredName?.trim(),
    lastName: child.lastName?.trim(),
    dateOfBirth: child.dateOfBirth || null,
    grade: child.grade === "Other"
      ? child.otherGrade?.trim() || null
      : child.grade?.replace(/\s/g, "") || null,
    subjects,
    studyPriorities,
    studyTimeGoal: {
      period: "Weekly",
      targetMinutes: Number.isFinite(targetHours) && targetHours > 0
        ? Math.round(targetHours * 60)
        : null,
      days: null,
      startDate: Number.isFinite(targetHours) && targetHours > 0
        ? new Date().toISOString().slice(0, 10)
        : null,
    },
  };
}

export default function InviteChild() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { child, updateChild } = useChildProfile();
  const parentName = [
    user?.firstName,
    user?.displayName,
    user?.parentName,
    user?.name,
    user?.fullName,
    user?.email?.split("@")[0],
  ].find((value) => typeof value === "string" && value.trim())?.trim() || "Parent";

  const initialMethod = searchParams.get("method") === "email" ? "email" : "link";
  const [method, setMethod] = useState(initialMethod);

  const [email, setEmail] = useState(
    () => getChildInvitationDraft().email || child.email
  );
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);

  const [inviteLink, setInviteLink] = useState("");
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [isDraftReady, setIsDraftReady] = useState(
    () => !sessionStorage.getItem("childSetupDraftId"),
  );
  const [showCopiedModal, setShowCopiedModal] = useState(false);
  const [showEmailMessage, setShowEmailMessage] = useState(false);
  const [showLinkMessage, setShowLinkMessage] = useState(initialMethod === "link");

  const sendingTimer = useRef(null);
  const errorToastTimer = useRef(null);
  const linkRequestInFlight = useRef(false);

  const isSending = status === "sending";
  const hasFailed = status === "failed";

  useEffect(() => {
    return () => {
      window.clearTimeout(sendingTimer.current);
      window.clearTimeout(errorToastTimer.current);
    };
  }, []);

  async function loadInviteLink() {
    if (inviteLink) return inviteLink;
    if (linkRequestInFlight.current) return null;

    const draftId = sessionStorage.getItem("childSetupDraftId");
    if (!draftId) {
      showSendingError("Your child setup draft is missing. Please start setup again.");
      return null;
    }

    linkRequestInFlight.current = true;
    setIsLoadingLink(true);
    setShowErrorToast(false);
    try {
      await api(`/api/parents/child-setups/${encodeURIComponent(draftId)}`, {
        method: "PUT",
        body: buildChildSetupPayload(child),
      });
      const response = await createLinkChildSetupInvitation(draftId, api);
      const url = response?.invitationUrl || response?.setupUrl || response?.url;
      if (!url) throw new Error("The server did not return an invitation link.");
      sessionStorage.setItem("childSetupInvitation", JSON.stringify(response));
      setInviteLink(url);
      return url;
    } catch (requestError) {
      showSendingError(
        getChildSetupValidationMessage(requestError) ||
          requestError.message ||
          "Could not create the invitation link.",
      );
      return null;
    } finally {
      linkRequestInFlight.current = false;
      setIsLoadingLink(false);
    }
  }

  useEffect(() => {
    if (method !== "link" || !isDraftReady) return;
    let active = true;
    queueMicrotask(() => {
      // This request updates loading/error state after its asynchronous network response.
      if (active) void loadInviteLink();
    });
    return () => {
      active = false;
    };
    // Link creation is intentionally automatic when the link method is selected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, isDraftReady]);

  useEffect(() => {
    const draftId = sessionStorage.getItem("childSetupDraftId");
    if (!draftId) return;

    api(`/api/parents/child-setups/${draftId}`)
      .then((draft) => {
        if (!draft.firstName && !draft.lastName) return;
        const draftGrade = draft.grade?.replace(/(\D)(\d)/, "$1 $2");
        const isStandardGrade = /^Grade (7|8|9|10|11|12)$/i.test(draftGrade || "");
        const draftOtherSubjects = draft.subjects
          ?.filter((subject) => subject.type === "Other" && subject.customName?.trim())
          .map((subject) => subject.customName.trim()) || [];
        const draftSubjects = draft.subjects?.length
          ? [...new Set(draft.subjects.map((subject) =>
              subject.type === "Other"
                ? "Other"
                : subject.customName || subject.type,
            ))]
          : child.subjects;

        updateChild({
          profileSetupMode: getDraftProfileSetupMode(draft),
          preferredName: draft.firstName || child.preferredName,
          lastName: draft.lastName || child.lastName,
          dateOfBirth: draft.dateOfBirth || child.dateOfBirth,
          grade: draftGrade
            ? isStandardGrade ? draftGrade : "Other"
            : child.grade,
          otherGrade: draftGrade && !isStandardGrade
            ? draftGrade
            : child.otherGrade,
          subjects: draftSubjects,
          otherSubjects: draft.subjects?.length ? draftOtherSubjects : child.otherSubjects,
          otherSubject: draft.subjects?.length
            ? draftOtherSubjects[0] || ""
            : child.otherSubject,
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
      .catch(() => {})
      .finally(() => setIsDraftReady(true));
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
      const settings = await api("/api/parents/me/settings");
      if (!settings.weekStartsOn) {
        await api("/api/parents/me/settings", {
          method: "PUT",
          body: { weekStartsOn: "Sunday" },
        });
      }

      await api(`/api/parents/child-setups/${draftId}`, {
        method: "PUT",
        body: buildChildSetupPayload(child),
      });

      const invitation = await createEmailChildSetupInvitation(draftId, cleanEmail, api);
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
      const validationMessage = getChildSetupValidationMessage(requestError);
      if (validationMessage) {
        showSendingError(validationMessage);
      } else if (/already.*invited|invitation.*already exists/i.test(message)) {
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
        showSendingError(message.slice(0, 240) || "We couldn’t send the invitation. Please try again.");
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
    setShowLinkMessage(true);
  }

  async function handleCopyLink() {
    if (isLoadingLink) return;
    const link = inviteLink || await loadInviteLink();
    if (!link) return;

    if (!navigator.clipboard) {
      showSendingError("Your browser could not copy the link. Please copy it manually.");
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      const draftId = sessionStorage.getItem("childSetupDraftId");
      let invitation = null;
      try {
        invitation = JSON.parse(sessionStorage.getItem("childSetupInvitation") || "null");
      } catch {
        invitation = null;
      }
      cachePendingInvitation({
        type: "ChildSetup",
        childSetupInvitationStatus: "Pending",
        childSetupDraftId: draftId,
        firstName: child.preferredName,
        lastName: child.lastName,
        dateOfBirth: child.dateOfBirth,
        grade: child.grade,
        otherGrade: child.otherGrade,
        subjects: child.subjects,
        otherSubjects: child.otherSubjects,
        otherSubject: child.otherSubject,
        studyPriorities: child.studyPriorities,
        suggestedGoal: child.suggestedGoal,
        studyTimeGoal: child.studyTimeGoal,
        parentEmail: user?.email,
        childSetupInvitationExpiresAtUtc: invitation?.expiresAtUtc,
      });
      setShowLinkMessage(true);
      setShowCopiedModal(true);
    } catch {
      showSendingError("Your browser could not copy the link. Please try again.");
    }
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
                      placeholder={isLoadingLink ? "Creating invitation link…" : ""}
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
                    disabled={isLoadingLink}
                  >
                    {isLoadingLink ? "Creating link..." : "Copy invitation"}
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
                He/She will review the setup before activating. The invitation
                expires in 7 days.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowCopiedModal(false);
                  navigate("/overview", { replace: true });
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
