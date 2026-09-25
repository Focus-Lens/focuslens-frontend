import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Field,
  Card,
  AuthLayout,
} from "../../components/ui/CommonUI";
import { RiArrowLeftLine } from "react-icons/ri";
import { api } from "../../services/api";
import {
  createEmailChildSetupInvitation,
  createLinkChildSetupInvitation,
  getChildSetupValidationMessage,
} from "../../services/childSetupFlow";
import "../../css/onboarding/SendSetupLink.css";

export default function SendSetupLink() {
  const navigate = useNavigate();

  const draftId = sessionStorage.getItem("childSetupDraftId");

  const [link, setLink] = useState("");
  const [method, setMethod] = useState("link");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(() =>
    draftId ? "" : "Your child setup draft is missing. Please start setup again.",
  );
  const [notice, setNotice] = useState("");
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const linkRequestInFlight = useRef(false);

  async function ensureInvitationLink() {
    if (link) return link;
    if (!draftId || linkRequestInFlight.current) return null;

    linkRequestInFlight.current = true;
    setIsLoadingLink(true);
    setError("");
    setNotice("");
    try {
      const response = await createLinkChildSetupInvitation(draftId, api);
      const invitationLink = response?.invitationUrl || response?.setupUrl || response?.url;
      if (!invitationLink) throw new Error("The setup link was not returned by the server.");
      sessionStorage.setItem("childSetupInvitation", JSON.stringify(response));
      setLink(invitationLink);
      return invitationLink;
    } catch (requestError) {
      setError(
        getChildSetupValidationMessage(requestError) ||
          requestError.message ||
          "Could not create the setup link.",
      );
      return null;
    } finally {
      linkRequestInFlight.current = false;
      setIsLoadingLink(false);
    }
  }

  useEffect(() => {
    if (method === "link") void ensureInvitationLink();
    // The link is generated automatically when this page opens in link mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  function handleSelectLink() {
    setMethod("link");
    setError("");
    setNotice("");
  }

  async function handleCopy() {
    if (!draftId || isLoadingLink || linkRequestInFlight.current) return;

    setError("");
    setNotice("");
    const invitationLink = await ensureInvitationLink();
    if (!invitationLink) return;
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable.");
      }

      await navigator.clipboard.writeText(invitationLink);
      setNotice("Invitation link copied.");
    } catch (requestError) {
      setError(requestError.message === "Clipboard access is unavailable."
        ? "We couldn’t copy the setup link. You can copy it directly from the field."
        : getChildSetupValidationMessage(requestError) ||
          requestError.message ||
          "Could not create the setup link.");
    }
  }

  async function handleSendEmail() {
    const cleanEmail = email.trim();
    if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError("Enter a valid email address.");
      setNotice("");
      return;
    }
    if (!draftId) return;

    try {
      setIsSending(true);
      setError("");
      setNotice("");
      await createEmailChildSetupInvitation(draftId, cleanEmail, api);
      setNotice(`Invitation sent to ${cleanEmail}.`);
    } catch (requestError) {
      setError(
        getChildSetupValidationMessage(requestError) ||
          requestError.message ||
          "Could not send the invitation. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AuthLayout hideFooter>
      <div className="send-setup-link-wrapper">
        <Card>
          <div className="send-setup-link-page">
            <h1 className="send-setup-link-title">
              Send your child a setup link
            </h1>

            <p className="send-setup-link-subtitle">
              Your invitation will be attached automatically.
            </p>

            <div className="setup-link-methods" role="tablist" aria-label="Invitation delivery method">
              <button
                type="button"
                role="tab"
                aria-selected={method === "email"}
                className={method === "email" ? "active" : ""}
                onClick={() => { setMethod("email"); setError(""); setNotice(""); }}
              >
                Send by email
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={method === "link"}
                className={method === "link" ? "active" : ""}
                onClick={handleSelectLink}
              >
                Copy invitation link
              </button>
            </div>

            {method === "email" ? (
              <>
                <Field
                  label="Your child’s email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="child@example.com"
                  className="setup-link-field setup-link-email-field"
                />
                <p className="send-setup-link-hint">
                  Only your child should use this invitation. It expires 7 days after creation.
                </p>
              </>
            ) : (
              <>
                <Field
                  label="Private profile setup link"
                  value={link}
                  readOnly
                  placeholder={isLoadingLink ? "Creating setup link…" : ""}
                  className="setup-link-field setup-link-readonly-field"
                />
                <p className="send-setup-link-hint">
                  Share only with your child; the link includes your invitation.
                </p>
              </>
            )}

            {error && <p className="send-setup-link-error" role="alert">{error}</p>}
            {notice && <p className="send-setup-link-success" role="status">{notice}</p>}

            <div className="send-setup-link-notice">
              <b>Your child stays in control</b>

              <p>
                They’ll create their own profile, see who invited them, and
                choose whether to activate the invitation.
              </p>

              <p>
                You won’t see study data before activation and sharing approval.
              </p>
            </div>

            <div className="send-setup-link-actions">
              <button
                type="button"
                className="send-setup-link-back"
                onClick={() => navigate("/profile-setup-choice")}
                aria-label="Go back"
              >
                <RiArrowLeftLine />
              </button>

              <Button
                onClick={method === "email" ? handleSendEmail : handleCopy}
                disabled={method === "email" ? isSending || !draftId : isLoadingLink || !draftId}
              >
                {method === "email"
                  ? isSending ? "Sending invitation..." : "Send invitation"
                  : isLoadingLink ? "Creating link..." : "Copy invitation link"}
              </Button>
            </div>

            <p className="send-setup-link-expiry">
              Expires 7 days after creation. You can cancel it from the
              dashboard.
            </p>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
