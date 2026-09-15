import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { ParentLayout } from "../../components/ui/CommonUI";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { getCurrentUser, updateCurrentUser } from "../../services/users";
import { ApiError } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";

import "../../css/dashboard/ProfileAccount.css";

const emptyProfile = {
  fullName: "",
  email: "",
  phone: "",
  memberSince: "",
  productUpdatesEnabled: true,
  importantNoticesEnabled: true,
};

export default function ProfileAccount() {
  const { refreshUser, child } = useAuth();

  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadProfile() {
      try {
        const userData = await getCurrentUser();
        if (isCancelled) return;

        const merged = {
          ...emptyProfile,
          ...userData,
          fullName:
            [userData.firstName, userData.lastName].filter(Boolean).join(" "),
        };

        setProfile(merged);
        setDraft(merged);
      } catch (err) {
        console.error("Failed to load parent profile:", err);
      }
    }

    loadProfile();

    return () => {
      isCancelled = true;
    };
  }, []);

  function updateDraft(event) {
    const { name, value } = event.target;

    setDraft((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startEditing() {
    setDraft(profile);
    setEmailError("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(profile);
    setEmailError("");
    setIsEditing(false);
  }

  async function saveProfile() {
    const [firstName, ...rest] = (draft.fullName || "").trim().split(" ");

    try {
      await updateCurrentUser({
        firstName: firstName || "",
        lastName: rest.join(" "),
      });

      setProfile(draft);
      setDraft(draft);
      setIsEditing(false);
      setEmailError("");
      setMessage("Profile updated successfully");
      refreshUser();

      window.setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (err) {
      setEmailError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  }

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
                  <span className="profile-avatar">{profile.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "P"}</span>

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
                  Email verified
                </p>

                <small>
                  {profile.email}
                </small>
              </section>

              <section className="profile-status-card">
                <h2>Account status</h2>

                <div className="profile-status-row">
                  <span>Email</span>
                  <b className="verified-status">Verified</b>
                </div>

                <div className="profile-status-row">
                  <span>Account status</span>
                  <b className="verified-status">Active</b>
                </div>

                <div className="profile-status-row">
                  <span>Connected child</span>
                  <b className="dark-status">{child?.preferredName ?? "Not connected"}</b>
                </div>

                <div className="profile-status-row">
                  <span>Relationship status</span>
                  <b className="dark-status">Confirmed</b>
                </div>
              </section>
            </aside>

            <div className="profile-content">
              <section className="profile-card personal-card">
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

                <div className="profile-fields">
                  <label>
                    <span>Full name</span>

                    <input
                      disabled
                      name="fullName"
                      onChange={updateDraft}
                      value={draft.fullName}
                    />
                  </label>

                  <label>
                    <span>Email address</span>

                    <input
                      className={emailError ? "error" : ""}
                      disabled
                      name="email"
                      onChange={updateDraft}
                      value={draft.email}
                    />

                    {emailError && (
                      <small>{emailError}</small>
                    )}
                  </label>

                  <label>
                    <span>Phone number</span>

                    <input
                      disabled={!isEditing}
                      name="phone"
                      onChange={updateDraft}
                      value={draft.phone}
                      placeholder="Not available from the API"
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

                  <button type="button">
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

                  <button type="button">
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
                    disabled
                    title="Notification preferences are not exposed by the parent API yet"
                    aria-pressed={profile.productUpdatesEnabled}
                    className={
                      profile.productUpdatesEnabled
                        ? "toggle active"
                        : "toggle"
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
                    disabled
                    title="Notification preferences are not exposed by the parent API yet"
                    aria-pressed={profile.importantNoticesEnabled}
                    className={
                      profile.importantNoticesEnabled
                        ? "toggle active"
                        : "toggle"
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
                  "Privacy policy",
                  "Terms of use",
                  "Data and account settings",
                ].map((item) => (
                  <button
                    className="profile-link-row"
                    key={item}
                    type="button"
                  >
                    <span>{item}</span>
                    <b>›</b>
                  </button>
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

                <button type="button">
                  Delete account
                </button>
              </section>
            </div>
          </div>
        </main>
      </ParentLayout>
    </div>
  );
}
