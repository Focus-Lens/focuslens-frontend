import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ParentLayout,
  Button,
  Card,
  Field,
  AuthLayout,
} from "../../components/ui/CommonUI";
import { useChildProfile } from "../../context/ChildProfileContext";
import { Info, ArrowLeft, UserRound } from "lucide-react";
import "../../css/onboarding/ChildBasicInfo.css";

export default function ChildBasicInfo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { child, updateChild } = useChildProfile();

  const [name, setName] = useState(child.preferredName || "");
  const [lastName, setLastName] = useState(child.lastName || "");
  const [dateOfBirth, setDateOfBirth] = useState(child.dateOfBirth || "");
  const [errors, setErrors] = useState({});

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

              <div className="child-basic-avatar-row">
                <span className="child-basic-avatar">
                  {name.trim() ? (
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
                  <small>Optional · Change or upload later</small>
                </div>
              </div>

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
                  onClick={handleBack}
                  aria-label="Go back"
                >
                  <ArrowLeft size={20} strokeWidth={1.8} />
                </button>

                <Button onClick={handleContinue}>Continue</Button>
              </div>
            </div>
          </Card>
        </div>
      </ParentLayout>
    </AuthLayout>
  );
}
