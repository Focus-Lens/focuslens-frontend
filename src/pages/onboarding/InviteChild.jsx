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
import { child } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import {
  inviteChildSetupByEmail,
  inviteChildSetupByLink,
} from "../../services/parents";
import { ApiError } from "../../services/apiClient";
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
  const { user: parent } = useAuth();

  const [method, setMethod] = useState(
    searchParams.get("method") === "link" ? "link" : "email"
  );

  const [email, setEmail] = useState(child.email);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);

  const [inviteLink, setInviteLink] = useState("");
  const [showCopiedModal, setShowCopiedModal] = useState(false);
  const [showEmailMessage, setShowEmailMessage] = useState(false);
  const [showLinkMessage, setShowLinkMessage] = useState(false);

  const errorToastTimer = useRef(null);

  const isSending = status === "sending";
  const hasFailed = status === "failed";

  useEffect(() => {
    return () => {
      window.clearTimeout(errorToastTimer.current);
    };
  }, []);

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

    setStatus("sending");
    setErrorMessage("");

    const draftId = sessionStorage.getItem("childSetupDraftId");

    if (!draftId) {
      showSendingError(
        "We couldn't find this child's setup. Please go back and try again."
      );
      return;
    }

    try {
      await inviteChildSetupByEmail(draftId, { childEmail: cleanEmail });
      navigate("/setup/invitation-sent");
    } catch (err) {
      showSendingError(
        err instanceof ApiError
          ? err.message
          : "We couldn’t send the link."
      );
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
    setShowLinkMessage(false);
  }

  async function handleCopyLink() {
    const draftId = sessionStorage.getItem("childSetupDraftId");
    let link = `https://focuslens.app/invite/${encodeURIComponent(
      child.preferredName || "demo"
    )}`;

    if (draftId) {
      try {
        const data = await inviteChildSetupByLink(draftId);
        const realLink = data?.link ?? data?.url ?? data?.inviteLink;
        if (realLink) link = realLink;
      } catch (err) {
        console.error("Failed to create child setup link:", err);
      }
    }

    setInviteLink(link);
    navigator.clipboard?.writeText(link).catch(() => {});

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
          aria-label="Open Mariam's profile"
        >
          <span className="invite-parent-avatar">
            {parent.firstName?.[0] ?? "M"}
          </span>

          <span>{parent.firstName}</span>

          <ChevronDown size={15} strokeWidth={1.8} />
        </Link>
      </header>

      <main className="invite-main">
        {showErrorToast && (
          <div className="invite-error-toast" role="alert">
            <span className="invite-error-icon">
              <CircleAlert size={22} strokeWidth={2.4} />
            </span>

            <div>
              <b>We couldn&apos;t send the link</b>
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
                      onChange={(event) => setEmail(event.target.value)}
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
                      value={
                        inviteLink ||
                        "Tap “Copy invitation” to generate a link"
                      }
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
