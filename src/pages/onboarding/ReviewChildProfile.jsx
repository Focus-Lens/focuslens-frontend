import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ParentLayout,
  Card,
  AuthLayout,
} from "../../components/ui/CommonUI";
import { useChildProfile } from "../../context/ChildProfileContext";
import { Check, ChevronLeft } from "lucide-react";

import "../../css/onboarding/ReviewChildProfile.css";

const steps = [
  "Basic info",
  "Studies",
  "Context",
  "Goal",
  "Review",
  "Invite",
];

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

export default function ReviewChildProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { child } = useChildProfile();

  const returnTo = searchParams.get("returnTo");

  const age = calculateAge(child.dateOfBirth);

  const studyPriorities =
    child.studyPriorities?.length > 0
      ? child.studyPriorities.join(" · ")
      : "No priorities selected · Optional";

  function editPath(path) {
    return returnTo === "waiting"
      ? `${path}?returnTo=waiting`
      : `${path}?returnTo=review`;
  }

  const reviewItems = [
    {
      title: "Preferred name & age",
      value: age != null
        ? `${child.preferredName} · ${age} years old`
        : `${child.preferredName}`,
      editPath: editPath("/setup/basic-info"),
    },
    {
      title: "Grade & subjects",
      value: `${child.grade || "No grade selected"} · ${(child.subjects || []).join(", ") || "No subjects selected"}`,
      editPath: editPath("/setup/studies"),
    },
    {
      title: "Study priorities",
      value: studyPriorities,
      editPath: editPath("/setup/context"),
    },
    {
      title: "Suggested goal",
      value: child.suggestedGoal ?? "No goal suggested · Optional",
      editPath: editPath("/setup/goal"),
    },
  ];

  function handleConfirm() {
    navigate(returnTo === "waiting" ? "/waiting-for-child" : "/setup/invite");
  }

  return (
    <AuthLayout hideFooter>
      <ParentLayout>
        <div className="review-child-wrapper">
          <Card>
            <div className="review-child-page">

              {/* Stepper */}
              <div className="review-child-stepper">
                {steps.map((item, index) => {
                  const stepNumber = index + 1;

                  const isCompleted = stepNumber < 5;
                  const isActive = stepNumber === 5;

                  return (
                    <div
                      key={item}
                      className={`review-child-step ${
                        isActive ? "active" : ""
                      } ${isCompleted ? "completed" : ""}`}
                    >
                      <span className="review-child-step-circle">
                        {isCompleted ? (
                          <Check size={12} strokeWidth={2.8} />
                        ) : (
                          stepNumber
                        )}
                      </span>

                      <span className="review-child-step-label">
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Title */}
              <h1 className="review-child-title">
                Review {child.preferredName}’s profile
              </h1>

              <p className="review-child-subtitle">
                A thoughtful starting point. You can edit any section.
              </p>

              {/* Review items */}
              <div className="review-child-list">
                {reviewItems.map((item) => (
                  <div
                    className="review-child-item"
                    key={item.title}
                  >
                    <div className="review-child-item-content">
                      <h3>{item.title}</h3>
                      <p>{item.value}</p>
                    </div>

                    <button
                      type="button"
                      className="review-child-edit"
                      onClick={() => navigate(item.editPath)}
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>

              {/* Note */}
              <p className="review-child-note">
                {child.preferredName} will review this setup when
                activating the invitation.
              </p>

              {/* Actions */}
              <div className="review-child-actions">
                <button
                  type="button"
                  className="review-child-back"
                  onClick={() => navigate("/setup/goal")}
                  aria-label="Go back"
                >
                  <ChevronLeft size={21} strokeWidth={1.8} />
                </button>

                <button
                  type="button"
                  className="review-child-confirm"
                  onClick={handleConfirm}
                >
                  Confirm and continue
                </button>
              </div>

            </div>
          </Card>
        </div>
      </ParentLayout>
    </AuthLayout>
  );
}
