import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  Sprout,
  Target,
  BookCopy,
  GraduationCap,
  ListChecks,
  Check,
  ChevronLeft,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

import {
  ParentLayout,
  Button,
  Card,
  AuthLayout,
} from "../../components/ui/CommonUI";

import { useChildProfile } from "../../context/useChildProfile";

import "../../css/onboarding/ChildStudyContext.css";

const supportOptions = [
  {
    name: "Help my child build a study routine",
    icon: Sprout,
    accent: Sparkles,
  },
  {
    name: "Help my child stay focused",
    icon: Target,
    accent: ArrowUpRight,
  },
  {
    name: "Help my child understand difficult topics",
    icon: BookCopy,
    accent: Check,
  },
  {
    name: "Support my child’s exam preparation",
    icon: GraduationCap,
    accent: Sparkles,
  },
  {
    name: "Encourage my child to reach study goals",
    icon: ListChecks,
    accent: Check,
  },
];

const steps = [
  "Basic info",
  "Studies",
  "Context",
  "Goal",
  "Review",
  "Invite",
];

export default function ChildStudyContext() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { child, updateChild } = useChildProfile();

  const [selectedSupport, setSelectedSupport] = useState(
    child.studyPriorities ?? []
  );
  const [error, setError] = useState("");
  const canContinue = selectedSupport.length > 0;

  function toggleSupport(option) {
    const nextSupport = selectedSupport.includes(option)
      ? selectedSupport.filter((item) => item !== option)
      : [...selectedSupport, option];
    setSelectedSupport(nextSupport);
    updateChild({ studyPriorities: nextSupport });
    setError("");
  }

  function handleContinue() {
    if (!selectedSupport.length) {
      setError("At least one support option is required.");
      return;
    }
    updateChild({ studyPriorities: selectedSupport });

    const returnTo = searchParams.get("returnTo");

    if (returnTo === "waiting") {
      navigate("/waiting-for-child");
      return;
    }

    navigate(returnTo === "review" ? "/setup/review" : "/setup/goal");
  }

  function handleBack() {
    const returnTo = searchParams.get("returnTo");
    navigate(returnTo ? `/setup/studies?returnTo=${encodeURIComponent(returnTo)}` : "/setup/studies");
  }

  return (
    <AuthLayout hideFooter>
      <ParentLayout>
        <div className="child-context-wrapper">
          <Card>
            <div className="child-context-page">

              {/* Stepper */}
              <div className="child-context-stepper">
                {steps.map((item, index) => {
                  const stepNumber = index + 1;
                  const isCompleted = stepNumber < 3;
                  const isActive = stepNumber === 3;

                  return (
                    <div
                      key={item}
                      className={`child-context-step ${
                        isActive ? "active" : ""
                      } ${isCompleted ? "completed" : ""}`}
                    >
                      <span className="child-context-step-circle">
                        {isCompleted ? (
                          <Check size={12} strokeWidth={2.8} />
                        ) : (
                          stepNumber
                        )}
                      </span>

                      <span className="child-context-step-label">
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Title */}
              <h1 className="child-context-title">
                How would you like FocusLens
                <br />
                to support your child?
              </h1>

              <p className="child-context-subtitle">
                Choose the support you’d like for your child.
              </p>

              {/* Options */}
              <div className={`child-context-options ${error ? "invalid" : ""}`}>
                {supportOptions.map((option) => {
                  const Icon = option.icon;
                  const Accent = option.accent;
                  const isSelected = selectedSupport.includes(option.name);

                  return (
                    <button
                      key={option.name}
                      type="button"
                      className={`child-context-option ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => toggleSupport(option.name)}
                    >
                      <span className="child-context-option-icon">
                        <Icon size={22} strokeWidth={1.9} />
                        <Accent className="child-context-icon-accent" size={10} strokeWidth={2.8} />
                      </span>

                      <span className="child-context-option-text">
                        {option.name}
                      </span>

                      <span className="child-context-check">
                        {isSelected ? (
                          <Check size={13} strokeWidth={3} />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
              {error && <p className="setup-required-error">{error}</p>}

              {/* Actions */}
              <div className="child-context-actions">
                <button
                  type="button"
                  className="child-context-back back-button-style"
                  onClick={handleBack}
                  aria-label="Go back"
                >
                  <ChevronLeft size={21} strokeWidth={1.8} />
                </button>

                <Button onClick={handleContinue} disabled={!canContinue}>Continue</Button>
              </div>

            </div>
          </Card>
        </div>
      </ParentLayout>
    </AuthLayout>
  );
}
