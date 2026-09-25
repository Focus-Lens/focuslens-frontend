import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ParentLayout,
  Button,
  Card,
  Field,
  AuthLayout,
} from "../../components/ui/CommonUI";
import { useChildProfile } from "../../context/ChildProfileContext";
import { api } from "../../services/api";
import { Info, ChevronLeft, UserRound } from "lucide-react";
import "../../css/onboarding/ChildBasicInfo.css";

export default function ChildBasicInfo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { child, updateChild } = useChildProfile();

  const [name, setName] = useState(child.preferredName || "");
  const [lastName, setLastName] = useState(child.lastName || "");
  const [dateOfBirth, setDateOfBirth] = useState(child.dateOfBirth || "");
  const [errors, setErrors] = useState({});
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [isLoadingProfileImage, setIsLoadingProfileImage] = useState(false);
  const [isSavingProfileImage, setIsSavingProfileImage] = useState(false);
  const [profileImageError, setProfileImageError] = useState("");
  const profileImageObjectUrl = useRef("");
  const draftId = sessionStorage.getItem("childSetupDraftId");

  function displayProfileImage(imageBlob) {
    if (profileImageObjectUrl.current) {
      URL.revokeObjectURL(profileImageObjectUrl.current);
    }
    const objectUrl = URL.createObjectURL(imageBlob);
    profileImageObjectUrl.current = objectUrl;
    setProfileImageUrl(objectUrl);
  }

  useEffect(() => {
    if (!draftId) return undefined;
    let active = true;
    const imagePath = `/api/parents/child-setups/${encodeURIComponent(draftId)}/profile-image`;

    async function loadProfileImage() {
      setIsLoadingProfileImage(true);
      setProfileImageError("");
      try {
        const imageBlob = await api(imagePath, { responseType: "blob" });
        if (active && imageBlob?.size) displayProfileImage(imageBlob);
      } catch (requestError) {
        if (active && requestError.status !== 404) {
          setProfileImageError(requestError.message || "Could not load the profile image.");
        }
      } finally {
        if (active) setIsLoadingProfileImage(false);
      }
    }

    void loadProfileImage();
    return () => {
      active = false;
    };
  // This page loads the image for the current child setup draft once on entry.
  }, [draftId]);

  useEffect(() => () => {
    if (profileImageObjectUrl.current) {
      URL.revokeObjectURL(profileImageObjectUrl.current);
      profileImageObjectUrl.current = "";
    }
  }, []);

  async function handleProfileImageChange(event) {
    const imageFile = event.target.files?.[0];
    event.target.value = "";
    if (!imageFile || !draftId) return;
    if (!imageFile.type.startsWith("image/")) {
      setProfileImageError("Choose an image file to use as the profile picture.");
      return;
    }

    setIsSavingProfileImage(true);
    setProfileImageError("");
    const imagePath = `/api/parents/child-setups/${encodeURIComponent(draftId)}/profile-image`;
    try {
      const imageForm = new FormData();
      imageForm.append("file", imageFile);
      await api(imagePath, { method: "PUT", body: imageForm });
      displayProfileImage(imageFile);

      try {
        const savedImage = await api(imagePath, { responseType: "blob" });
        if (savedImage?.size) displayProfileImage(savedImage);
      } catch (requestError) {
        if (requestError.status !== 404) {
          setProfileImageError(requestError.message || "Image saved, but could not refresh it from the server.");
        }
      }
    } catch (requestError) {
      setProfileImageError(requestError.message || "Could not save the profile image.");
    } finally {
      setIsSavingProfileImage(false);
    }
  }

  const steps = [
    "Basic info",
    "Studies",
    "Context",
    "Goal",
    "Review",
    "Invite",
  ];

  function handleContinue() {
    const nextErrors = {
      name: name.trim() ? "" : "First name is required.",
      lastName: lastName.trim() ? "" : "Last name is required.",
      dateOfBirth: dateOfBirth ? "" : "Date of birth is required.",
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    updateChild({
      preferredName: name.trim(),
      lastName: lastName.trim(),
      dateOfBirth,
    });

    const returnTo = searchParams.get("returnTo");

    if (returnTo === "waiting") {
      navigate("/waiting-for-child");
      return;
    }

    navigate(returnTo === "review" ? "/setup/review" : "/setup/studies");
  }

  function handleBack() {
    const returnTo = searchParams.get("returnTo");
    if (returnTo === "review") navigate("/setup/review");
    else if (returnTo === "waiting") navigate("/setup/review?returnTo=waiting");
    else navigate("/setup-intro");
  }

  return (
    <AuthLayout hideFooter>
      <ParentLayout>
        <div className="child-basic-wrapper">
          <Card>
            <div className="child-basic-page">
              <div className="child-basic-stepper">
                {steps.map((item, index) => {
                  const currentStep = index + 1;

                  return (
                    <div
                      key={item}
                      className={`child-basic-step ${
                        currentStep === 1 ? "active" : ""
                      }`}
                    >
                      <span className="child-basic-step-number">
                        {currentStep}
                      </span>

                      <span className="child-basic-step-label">
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>

              <h1 className="child-basic-title">
                Basic child information
              </h1>

              <p className="child-basic-subtitle">
                Enter your child&apos;s first and last name.
                <br />
                You can safely go back without losing entered information.
              </p>

              <label className="child-basic-avatar-row" htmlFor="child-profile-image">
                <span className="child-basic-avatar">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt={`${name || "Child"} profile`} />
                  ) : name.trim() ? (
                    name.trim()[0].toUpperCase()
                  ) : (
                    <UserRound
                      size={20}
                      strokeWidth={1.8}
                      aria-label="Profile placeholder"
                    />
                  )}
                </span>

                <div className="child-basic-avatar-text">
                  <b>Profile avatar or initial</b>
                  <small>
                    {isLoadingProfileImage
                      ? "Loading profile image…"
                      : isSavingProfileImage
                        ? "Saving profile image…"
                        : "Optional · Choose or change image"}
                  </small>
                </div>
              </label>
              <input
                id="child-profile-image"
                className="child-basic-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                disabled={!draftId || isLoadingProfileImage || isSavingProfileImage}
                aria-label="Upload child profile image"
              />
              {profileImageError && (
                <p className="child-basic-image-error" role="alert">
                  {profileImageError}
                </p>
              )}

              <Field
                className={errors.name ? "setup-field-error" : ""}
                label="First name"
                value={name}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setName(nextName);
                  if (nextName.trim()) setErrors((current) => ({ ...current, name: "" }));
                  updateChild({ preferredName: nextName.trim() });
                }}
              />
              {errors.name && <p className="setup-required-error">{errors.name}</p>}

              <Field
                className={errors.lastName ? "setup-field-error" : ""}
                label="Last name"
                value={lastName}
                onChange={(event) => {
                  const nextLastName = event.target.value;
                  setLastName(nextLastName);
                  if (nextLastName.trim()) setErrors((current) => ({ ...current, lastName: "" }));
                  updateChild({ lastName: nextLastName.trim() });
                }}
              />
              {errors.lastName && <p className="setup-required-error">{errors.lastName}</p>}

              <Field
                className={errors.dateOfBirth ? "setup-field-error" : ""}
                label="Date of birth"
                type="date"
                value={dateOfBirth}
                onChange={(event) => {
                  const nextDateOfBirth = event.target.value;
                  setDateOfBirth(nextDateOfBirth);
                  if (nextDateOfBirth) setErrors((current) => ({ ...current, dateOfBirth: "" }));
                  updateChild({ dateOfBirth: nextDateOfBirth });
                }}
              />
              {errors.dateOfBirth && <p className="setup-required-error">{errors.dateOfBirth}</p>}

              <div className="child-basic-info">
                <Info size={18} strokeWidth={1.8} />
                <span>
                  Age helps FocusLens provide suitable study guidance and
                  privacy settings.
                </span>
              </div>

              <div className="child-basic-actions">
                <button
                  type="button"
                  className="child-basic-back"
                  disabled={isSavingProfileImage}
                  onClick={handleBack}
                  aria-label="Go back"
                >
                  <ChevronLeft size={21} strokeWidth={1.8} />
                </button>

                <Button onClick={handleContinue} disabled={isSavingProfileImage}>
                  Continue
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </ParentLayout>
    </AuthLayout>
  );
}
