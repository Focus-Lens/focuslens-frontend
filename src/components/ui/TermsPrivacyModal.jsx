import { useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { api } from "../../services/api";
import "../../css/components/TermsPrivacyModal.css";

import accountIcon from "../../assets/Account Icon.png";
import privacyIcon from "../../assets/Privacy Icon.png";
import studyIcon from "../../assets/Study Icon.png";
import elementsIcon from "../../assets/elements.png";

export default function TermsPrivacyModal({ onClose, onAgree }) {
  const [terms, setTerms] = useState(null);
  const [termsError, setTermsError] = useState("");
  const [termsLoading, setTermsLoading] = useState(false);
  const [showTermsContent, setShowTermsContent] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const termsSectionRef = useRef(null);

  async function reviewTerms() {
    setShowTermsContent(true);
    setTermsError("");
    window.requestAnimationFrame(() => {
      termsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    if (terms || termsLoading) return;

    try {
      setTermsLoading(true);
      const document = await api("/api/terms?audience=Parent", { auth: false });
      if (!document?.content) throw new Error("Terms content is unavailable.");
      setTerms(document.content);
    } catch (error) {
      setTermsError(error.message || "Could not load the terms. Please try again.");
    } finally {
      setTermsLoading(false);
    }
  }

  return (
    <div className="terms-overlay" onClick={onClose}>
      <aside
        className="terms-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="terms-close"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX />
        </button>

        <h2>Terms &amp; Privacy</h2>

        <p className="terms-intro">
          A plain-language summary of how FocusLens protects your family’s
          information.
        </p>

        <div className="privacy-highlight">
          <img
            className="highlight-icon"
            src={elementsIcon}
            alt=""
          />

          <span>FocusLens does not sell personal data.</span>
        </div>

        <div className="privacy-item">
          <div className="privacy-icon">
            <img src={accountIcon} alt="" />
          </div>

          <div className="privacy-content">
            <b>Account information</b>
            <small>
              Name and contact details support secure authentication.
            </small>
          </div>
        </div>

        <div className="privacy-item">
          <div className="privacy-icon">
            <img src={studyIcon} alt="" />
          </div>

          <div className="privacy-content">
            <b>Study profile and AI insights</b>
            <small>
              Optional study details support personalization, reports, and
              insights based on recorded metrics.
            </small>
          </div>
        </div>

        <div className="privacy-item">
          <div className="privacy-icon">
            <img src={privacyIcon} alt="" />
          </div>

          <div className="privacy-content">
            <b>Sharing and privacy settings</b>
            <small>
              Student preferences control parent visibility; settings remain
              available later.
            </small>
          </div>
        </div>

        <button
          type="button"
          className="terms-scroll-hint"
          onClick={reviewTerms}
          disabled={termsLoading}
        >
          {termsLoading ? "Loading terms…" : "View full terms"}
        </button>

        {showTermsContent && (
          <section className="terms-document" ref={termsSectionRef} aria-live="polite">
            <button
              type="button"
              className="terms-document-close"
              onClick={() => setShowTermsContent(false)}
              aria-label="Close terms details"
            >
              <FiX />
            </button>
            <h3>Terms of Use</h3>
            {termsError ? (
              <p className="terms-document-status error">{termsError}</p>
            ) : termsLoading ? (
              <p className="terms-document-status">Loading terms…</p>
            ) : terms ? (
              <p className="terms-document-content">{terms}</p>
            ) : null}
          </section>
        )}

        <label className="terms-understood">
          <input
            type="checkbox"
            checked={understood}
            onChange={(event) => setUnderstood(event.target.checked)}
          />
          <span>I understand and agree to these terms.</span>
        </label>

        <button
          type="button"
          className="terms-agree"
          disabled={!understood}
          onClick={onAgree}
        >
          Agree and continue
        </button>

        <button
          type="button"
          className="terms-decline"
          onClick={onClose}
        >
          Decline
        </button>

        <p className="terms-note">
          Closing or declining returns to registration without deleting
          entered data.
        </p>
      </aside>
    </div>
  );
}
