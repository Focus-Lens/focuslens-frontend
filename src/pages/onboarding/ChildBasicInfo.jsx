import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ParentLayout, Button, Card, Field, AuthLayout } from "../../components/ui/CommonUI";
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

  const steps = [
    "Basic info",
    "Studies",
    "Context",
    "Goal",
    "Review",
    "Invite",
  ];

  function handleContinue() {
    updateChild({ preferredName: name.trim(), lastName: lastName.trim(), dateOfBirth });

    const returnTo = searchParams.get("returnTo");

    if (returnTo === "waiting") {
      navigate("/waiting-for-child");
      return;
    }

    navigate(returnTo === "review" ? "/setup/review" : "/setup/studies");
  }

  return (
    <AuthLayout hideFooter>
    <ParentLayout>
      <div className="child-basic-wrapper">
        <Card>
          <div className="child-basic-page">

            {/* =========================
                Stepper
            ========================= */}
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

            {/* =========================
                Title
            ========================= */}
            <h1 className="child-basic-title">
              Basic child information
            </h1>

            <p className="child-basic-subtitle">
              Use the name your child prefers.
              <br />
              You can safely go back without losing entered information.
            </p>

            {/* =========================
                Avatar row
            ========================= */}
            <div className="child-basic-avatar-row">
              <span className="child-basic-avatar">
                {name.trim()
                  ? name.trim()[0].toUpperCase()
                  : <UserRound size={20} strokeWidth={1.8} aria-label="Profile placeholder" />}
              </span>

              <div className="child-basic-avatar-text">
                <b>Profile avatar or initial</b>
                <small>Optional · Change or upload later</small>
              </div>
            </div>

            {/* =========================
                Preferred name
            ========================= */}
            <Field
              label="Preferred name"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                updateChild({ preferredName: nextName.trim() });
              }}
            />

            {/* =========================
                Last name
            ========================= */}
            <Field
              label="Last name"
              value={lastName}
              onChange={(event) => {
                const nextLastName = event.target.value;
                setLastName(nextLastName);
                updateChild({ lastName: nextLastName.trim() });
              }}
            />

            {/* =========================
                Date of birth
            ========================= */}
            <Field
              label="Date of birth"
              type="date"
              value={dateOfBirth}
              onChange={(event) => {
                const nextDateOfBirth = event.target.value;
                setDateOfBirth(nextDateOfBirth);
                updateChild({ dateOfBirth: nextDateOfBirth });
              }}
            />

            {/* =========================
                Info
            ========================= */}
            <div className="child-basic-info">
              <Info size={18} strokeWidth={1.8} />

              <span>
                Age helps FocusLens provide suitable study guidance and
                privacy settings.
              </span>
            </div>

            {/* =========================
                Actions
            ========================= */}
            <div className="child-basic-actions">
              <button
                type="button"
                className="child-basic-back"
                onClick={() => navigate(-1)}
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
