import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ParentLayout, Button, Card, Field, AuthLayout } from "../../components/ui/CommonUI";
import { child } from "../../data/mockData";
import { createChildSetupDraft } from "../../services/parents";
import { Info, ArrowLeft } from "lucide-react";
import "../../css/onboarding/ChildBasicInfo.css";

export default function ChildBasicInfo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState(child.preferredName || "");
  const [lastName, setLastName] = useState(child.lastName || "");
  const [dateOfBirth, setDateOfBirth] = useState(child.dateOfBirth || "");

  // ننشئ مسودة إعداد الطفل (child-setup draft) مرة واحدة عند بداية الرحلة،
  // ونحتفظ بمعرّفها لباقي خطوات الإعداد (الأمر لا يظهر في الواجهة إطلاقًا).
  useEffect(() => {
    if (sessionStorage.getItem("childSetupDraftId")) return;

    createChildSetupDraft()
      .then((data) => {
        const draftId = data?.id ?? data?.draftId;
        if (draftId) {
          sessionStorage.setItem("childSetupDraftId", draftId);
        }
      })
      .catch((err) => {
        console.error("Failed to create child setup draft:", err);
      });
  }, []);

  const steps = [
    "Basic info",
    "Studies",
    "Context",
    "Goal",
    "Review",
    "Invite",
  ];

  function handleContinue() {
    child.preferredName = name;
    child.lastName = lastName;
    child.dateOfBirth = dateOfBirth;

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
                {name?.[0]?.toUpperCase() ?? "Y"}
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
              onChange={(event) => setName(event.target.value)}
            />

            {/* =========================
                Last name
            ========================= */}
            <Field
              label="Last name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />

            {/* =========================
                Date of birth
            ========================= */}
            <Field
              label="Date of birth"
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
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
