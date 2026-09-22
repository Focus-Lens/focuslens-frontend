import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  AlarmClock,
  Target,
  BookOpen,
  GraduationCap,
  ListChecks,
  Check,
  ChevronLeft,
} from "lucide-react";

import {
  ParentLayout,
  Button,
  Card,
  AuthLayout,
} from "../../components/ui/CommonUI";

import { useChildProfile } from "../../context/ChildProfileContext";

import "../../css/onboarding/ChildStudyContext.css";

const supportOptions = [
  {
    name: "Help my child build a study routine",
    icon: AlarmClock,
  },
  {
    name: "Help my child stay focused",
    icon: Target,
  },
  {
    name: "Help my child understand difficult topics",
    icon: BookOpen,
  },
  {
    name: "Support my child’s exam preparation",
    icon: GraduationCap,
  },
  {
    name: "Encourage my child to reach study goals",
    icon: ListChecks,
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

  function toggleSupport(option) {
    setSelectedSupport((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
    );
  }

  function handleContinue() {
    updateChild({ studyPriorities: selectedSupport });

    const returnTo = searchParams.get("returnTo");

    if (returnTo === "waiting") {
      navigate("/waiting-for-child");
      return;
    }

    navigate(returnTo === "review" ? "/setup/review" : "/setup/goal");
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
              <div className="child-context-options">
                {supportOptions.map((option) => {
                  const Icon = option.icon;
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

              {/* Actions */}
              <div className="child-context-actions">
                <button
                  type="button"
                  className="child-context-back"
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                >
                  <ChevronLeft size={21} strokeWidth={1.8} />
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
