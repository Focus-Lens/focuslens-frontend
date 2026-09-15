import { FiX } from "react-icons/fi";
import "../../css/components/TermsPrivacyModal.css";

import accountIcon from "../../assets/Account Icon.png";
import privacyIcon from "../../assets/Privacy Icon.png";
import studyIcon from "../../assets/Study Icon.png";
import elementsIcon from "../../assets/elements.png";

export default function TermsPrivacyModal({ onClose, onAgree }) {
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
          className="terms-agree"
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