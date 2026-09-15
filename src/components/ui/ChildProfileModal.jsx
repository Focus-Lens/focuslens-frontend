import "../../css/components/ChildProfileModal.css";
import headIcon from "../../assets/head.png";
import openBookIcon from "../../assets/openbook.png";

export default function ChildProfileModal({ child, onClose }) {
  return (
    <div className="child-profile-overlay">
      <section className="child-profile-modal">
        <button
          aria-label="Close child profile"
          className="child-profile-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        <h2>Child profile</h2>

        <div className="child-profile-summary">
          <span>{child.preferredName[0]}</span>

          <div>
            <b>{child.fullName}</b>
            <small>
              {child.grade} · <em>● Connected</em>
            </small>
            <small>Parent access active</small>
          </div>
        </div>

        <section className="child-profile-section">
          <h3>
            <img src={headIcon} alt="" />
            <span>Connection</span>
          </h3>

          <p>
            <span>Relationship</span>
            <b>{child.relationship}</b>
          </p>

          <p>
            <span>Guardian confirmation</span>
            <b>Confirmed</b>
          </p>

          <p>
            <span>Access status</span>
            <b>Active</b>
          </p>
        </section>

        <section className="child-profile-section">
          <h3>
            <img src={openBookIcon} alt="" />
            <span>Study profile</span>
          </h3>

          <small>SUBJECTS</small>

          <div className="child-profile-chips">
            {child.subjects.map((subject) => (
              <span key={subject}>{subject}</span>
            ))}
          </div>

          <small>STUDY PRIORITIES</small>

          <div className="child-profile-chips">
            {child.priorities.map((priority) => (
              <span key={priority}>{priority}</span>
            ))}
          </div>
        </section>

        <div className="child-profile-privacy">
          <span className="child-profile-lock">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6.5" y="10" width="11" height="9" rx="1.5" />
              <path d="M9 10V7.5a3 3 0 0 1 6 0V10" />
              <path d="M12 13.5v2" />
            </svg>
          </span>
          <div>
            <p>
              Only profile information shared through the active connection is
              shown.
            </p>
            <button type="button">Privacy &amp; access details →</button>
          </div>
        </div>
      </section>
    </div>
  );
}
