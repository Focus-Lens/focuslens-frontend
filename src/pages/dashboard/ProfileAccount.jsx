import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import { ParentLayout } from "../../components/ui/CommonUI";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "../../css/dashboard/ProfileAccount.css";

function toProfile(user) {
  return {
    fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Parent",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    productUpdatesEnabled: false,
    importantNoticesEnabled: true,
  };
}

export default function ProfileAccount() {
  const { logout, refreshUser, user: signedInUser } = useAuth();
  const navigate = useNavigate();
  // The signed-in user is already stored in the session, so render it at once
  // and refresh the full profile in the background.
  const [profile, setProfile] = useState(() => toProfile(signedInUser));
  const [draft, setDraft] = useState(() => toProfile(signedInUser));
  const [accountStatus, setAccountStatus] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([api("/api/users/me"), api("/api/users/me/account-status")])
      .then(([user, status]) => {
        if (!active) return;
        const nextProfile = toProfile(user);
        setProfile(nextProfile);
        setDraft(nextProfile);
        setAccountStatus(status);
      })
      .catch((requestError) => active && setMessage(requestError.message));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timeoutId = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  function updateDraft(event) {
    const { name, value } = event.target;

    setDraft((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startEditing() {
    setDraft(profile);
    setSaveError("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(profile);
    setSaveError("");
    setIsEditing(false);
  }

  async function saveProfile() {
    const [firstName, ...lastNameParts] = draft.fullName.trim().split(/\s+/);
    if (!firstName || !lastNameParts.length) {
      setSaveError("Please enter both first and last name.");
      return;
    }
    try {
      const user = await api("/api/users/me", {
        method: "PUT", body: { firstName, lastName: lastNameParts.join(" "), phoneNumber: draft.phone || null },
      });
      const nextProfile = { ...draft, fullName: `${user.firstName} ${user.lastName}`, email: user.email, phone: user.phoneNumber || "" };
      setProfile(nextProfile); setDraft(nextProfile); setIsEditing(false); setSaveError("");
      await refreshUser();
      setMessage("Profile updated successfully");
    } catch (requestError) { setSaveError(requestError.message); }
  }

  function toggleSetting(setting) {
    setProfile((current) => ({
      ...current,
      [setting]: !current[setting],
    }));

    setDraft((current) => ({
      ...current,
      [setting]: !current[setting],
    }));
  }

  function signOut() {
    navigate("/invite/continue", { replace: true });
    void logout();
  }

  async function deleteAccount() {
    setIsDeleting(true);
    setDeleteError("");
    try {
      await api("/api/users/me", { method: "DELETE" });
      navigate("/invite/continue", { replace: true });
      void logout();
    } catch (requestError) {
      setDeleteError(requestError.message);
      setIsDeleting(false);
    }
  }

  const initials = profile.fullName.split(" ").filter(Boolean).map((name) => name[0]).join("").slice(0, 2).toUpperCase();
  const relationship = accountStatus?.childRelationships?.[0];

  return (
    <div className="profile-page-shell">
      <DashboardHeader activePage={null} />

      <ParentLayout>
        <main className="profile-page">
          <header className="profile-heading">
            <h1>Profile &amp; account</h1>
            <p>
              Manage your personal information and account preferences.
            </p>
          </header>

          {message && (
            <div className="profile-success-toast">
              <span className="profile-toast-check">✓</span>

              <div>
                <b>{message}</b>
                <span>
                  Your personal information has been saved.
                </span>
              </div>

              <button
                onClick={() => setMessage(null)}
                type="button"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          )}

          <div className="profile-layout">
            <aside className="profile-sidebar">
              <section className="profile-user-card">
                <div className="profile-user-top">
                  <span className="profile-avatar">{initials}</span>

                  <button
                    onClick={startEditing}
                    type="button"
                  >
                    Edit profile
                  </button>
                </div>

                <div className="profile-user-name-row">
                  <h2>{profile.fullName}</h2>
                  <span className="profile-account-badge">
                    Parent account
                  </span>
                </div>

                <p className="profile-email-verified">
                  <span>●</span>
                  {accountStatus?.emailConfirmed ? "Email verified" : "Email not verified"}
                </p>

                <small>Parent account</small>
              </section>

              <section className="profile-status-card">
                <h2>Account status</h2>

                <div className="profile-status-row">
                  <span>Email</span>
                  <b className="verified-status">{accountStatus?.emailVerificationStatus || "Unknown"}</b>
                </div>

                <div className="profile-status-row">
                  <span>Account status</span>
                  <b className="verified-status">{accountStatus?.accountStatus || "Unknown"}</b>
                </div>

                <div className="profile-status-row">
                  <span>Connected child</span>
                  <b className="dark-status">{relationship?.childName || "No connected child"}</b>
                </div>

                <div className="profile-status-row">
                  <span>Relationship status</span>
                  <b className="dark-status">{relationship?.relationshipStatus || "—"}</b>
                </div>
              </section>
            </aside>

            <div className="profile-content">
              <section className="profile-card personal-card" id="personal-information">
                <div className="profile-card-heading">
                  <div>
                    <h2>Personal information</h2>

                    <p>
                      {isEditing
                        ? "You’re editing your details. Save or cancel below."
                        : "Fields are read-only until edit is enabled."}
                    </p>
                  </div>

                  {!isEditing ? (
                    <button
                      className="profile-primary-button"
                      onClick={startEditing}
                      type="button"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="profile-edit-actions">
                      <button
                        onClick={cancelEditing}
                        type="button"
                      >
                        Cancel
                      </button>

                      <button
                        className="save-button"
                        onClick={saveProfile}
                        type="button"
                      >
                        Save changes
                      </button>
                    </div>
                  )}
                </div>

                {saveError && <p className="profile-form-error">{saveError}</p>}

                <div className="profile-fields">
                  <label>
                    <span>Full name</span>

                    <input
                      disabled={!isEditing}
                      name="fullName"
                      onChange={updateDraft}
                      value={draft.fullName}
                    />
                  </label>

                  <label>
                    <span>Email address</span>

                    <input
                      disabled
                      name="email"
                      onChange={updateDraft}
                      value={draft.email}
                    />
                  </label>

                  <label>
                    <span>Phone number</span>

                    <input
                      disabled={!isEditing}
                      name="phone"
                      onChange={updateDraft}
                      value={draft.phone}
                      placeholder="Phone number"
                    />
                  </label>
                </div>
              </section>

              <section className="profile-card security-card">
                <h2>Security</h2>

                <div className="profile-row">
                  <div>
                    <b>Password</b>
                    <small>Last updated recently</small>
                  </div>

                  <button type="button" onClick={() => navigate("/change-password")}>
                    Change password
                  </button>
                </div>

                <div className="profile-row">
                  <div>
                    <b>Sign out of all devices</b>
                    <small>
                      You’ll be signed out everywhere, including this device.
                    </small>
                  </div>

                  <button type="button" onClick={signOut}>
                    Sign out
                  </button>
                </div>
              </section>

              <section className="profile-card notifications-card">
                <h2>Notifications</h2>

                <div className="profile-toggle-row">
                  <div>
                    <b>Product and account updates</b>
                    <small>
                      Occasional news about new features and improvements.
                    </small>
                  </div>

                  <button
                    aria-pressed={profile.productUpdatesEnabled}
                    className={
                      profile.productUpdatesEnabled
                        ? "toggle active"
                        : "toggle"
                    }
                    onClick={() =>
                      toggleSetting("productUpdatesEnabled")
                    }
                    type="button"
                  >
                    <i />
                  </button>
                </div>

                <div className="profile-toggle-row">
                  <div>
                    <b>Important parent account notices</b>
                    <small>
                      Security alerts and required account actions.
                    </small>
                  </div>

                  <button
                    aria-pressed={profile.importantNoticesEnabled}
                    className={
                      profile.importantNoticesEnabled
                        ? "toggle active"
                        : "toggle"
                    }
                    onClick={() =>
                      toggleSetting("importantNoticesEnabled")
                    }
                    type="button"
                  >
                    <i />
                  </button>
                </div>
              </section>

              <section className="profile-card privacy-card">
                <h2>Privacy &amp; data</h2>

                {[
                  ["Privacy policy", "/privacy-policy"],
                  ["Terms of use", "/terms-of-use"],
                  ["Data and account settings", "/profile#personal-information"],
                ].map(([item, to]) => (
                  <Link
                    className="profile-link-row"
                    key={item}
                    to={to}
                  >
                    <span>{item}</span>
                    <b>›</b>
                  </Link>
                ))}

                <p className="profile-privacy-note">
                  <ShieldCheck size={14} />
                  <span>
                    FocusLens only shows parent data that belongs to your
                    account and approved child connections.
                  </span>
                </p>
              </section>

              <section className="profile-delete-card">
                <div>
                  <h2>Account actions</h2>

                  <b>Delete account</b>

                  <small>
                    Permanently remove your parent account.
                  </small>
                </div>

                <button type="button" onClick={() => { setDeleteError(""); setShowDeleteConfirmation(true); }}>
                  Delete account
                </button>
              </section>
            </div>
          </div>
        </main>
      </ParentLayout>

      {showDeleteConfirmation && (
        <div className="delete-account-overlay" role="presentation">
          <section aria-labelledby="delete-account-title" aria-modal="true" className="delete-account-modal" role="dialog">
            <h2 id="delete-account-title">Delete parent account?</h2>
            <p className="delete-account-intro">
              Deleting your parent account affects your parent profile, access, and approved student
              relationships. Final legal language is pending professional review.
            </p>
            <ul className="delete-account-effects">
              <li>Your parent access ends and you will be signed out.</li>
              <li>Approved parent and student relationships are disconnected.</li>
              <li>Deleting the parent account does not automatically delete the student’s account.</li>
            </ul>
            <p className="delete-account-legal">
              [Legal review required: confirm deletion effects and any applicable processing details.]
            </p>
            {deleteError && <p className="delete-account-error">{deleteError}</p>}
            <div className="delete-account-actions">
              <button className="delete-account-cancel" disabled={isDeleting} onClick={() => setShowDeleteConfirmation(false)} type="button">
                Cancel
              </button>
              <button className="delete-account-confirm" disabled={isDeleting} onClick={deleteAccount} type="button">
                {isDeleting ? "Deleting account…" : "Delete parent account"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
