import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ParentLayout, Button, Card, AuthLayout } from "../../components/ui/CommonUI";
import { useChildProfile } from "../../context/ChildProfileContext";

import {
  Plus,
  MessageSquare,
  Atom,
  FlaskConical,
  Leaf,
  History,
  CircleDashed,
  Check,
  ChevronLeft,
} from "lucide-react";

import "../../css/onboarding/ChildStudies.css";

const gradesList = [
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Other",
];

const subjectsList = [
  { name: "Math", icon: Plus },
  { name: "English", icon: MessageSquare },
  { name: "Physics", icon: Atom },
  { name: "Chemistry", icon: FlaskConical },
  { name: "Biology", icon: Leaf },
  { name: "History", icon: History },
  { name: "Other", icon: CircleDashed },
];

const steps = [
  "Basic info",
  "Studies",
  "Context",
  "Goal",
  "Review",
  "Invite",
];

export default function ChildStudies() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { child, updateChild } = useChildProfile();

  const [grade, setGrade] = useState(child.grade);
  const [selectedSubjects, setSelectedSubjects] = useState(child.subjects);
  const [errors, setErrors] = useState({});

  function toggleSubject(subject) {
    const nextSubjects = selectedSubjects.includes(subject)
      ? selectedSubjects.filter((item) => item !== subject)
      : [...selectedSubjects, subject];
    setSelectedSubjects(nextSubjects);
    updateChild({ subjects: nextSubjects });
    setErrors((current) => ({ ...current, subjects: "" }));
  }

  function handleGradeSelect(nextGrade) {
    setGrade(nextGrade);
    updateChild({ grade: nextGrade });
    setErrors((current) => ({ ...current, grade: "" }));
  }

  function handleBack() {
    const returnTo = searchParams.get("returnTo");
    const path = "/setup/basic-info";
    navigate(returnTo ? `${path}?returnTo=${encodeURIComponent(returnTo)}` : path);
  }

  function handleContinue() {
    const nextErrors = {
      grade: grade ? "" : "Grade is required.",
      subjects: selectedSubjects.length ? "" : "At least one subject is required.",
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    updateChild({ grade, subjects: selectedSubjects });

    const returnTo = searchParams.get("returnTo");

    if (returnTo === "waiting") {
      navigate("/waiting-for-child");
      return;
    }

    navigate(returnTo === "review" ? "/setup/review" : "/setup/context");
  }

  return (
    <AuthLayout hideFooter>
    <ParentLayout>
      <div className="child-studies-wrapper">
        <Card>
          <div className="child-studies-page">

            {/* Stepper */}
            <div className="child-studies-stepper">
              {steps.map((item, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < 2;
                const isActive = stepNumber === 2;

                return (
                  <div
                    key={item}
                    className={`child-study-step ${
                      isActive ? "active" : ""
                    } ${isCompleted ? "completed" : ""}`}
                  >
                    <span className="child-study-step-circle">
                      {isCompleted ? (
                        <Check size={12} strokeWidth={2.8} />
                      ) : (
                        stepNumber
                      )}
                    </span>

                    <span className="child-study-step-label">
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Title */}
            <h1 className="child-studies-title">
              Grade and subjects
            </h1>

            <p className="child-studies-subtitle">
              Choose the closest grade and the subjects your child is currently
              studying.
            </p>

            {/* Grade */}
            <h3 className="child-studies-section-title">
              Grade
            </h3>

            <div className="grade-options">
              {gradesList.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`grade-chip ${grade === item ? "selected" : ""} ${errors.grade ? "invalid" : ""}`}
                  onClick={() => handleGradeSelect(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            {errors.grade && <p className="setup-required-error">{errors.grade}</p>}

            {/* Subjects */}
            <h3 className="child-studies-section-title subjects-title">
              Subjects
            </h3>

            <div className={`subject-options ${errors.subjects ? "invalid" : ""}`}>
              {subjectsList.map((subject) => {
                const Icon = subject.icon;
                const isSelected = selectedSubjects.includes(subject.name);

                return (
                  <button
                    key={subject.name}
                    type="button"
                    className={`subject-chip ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => toggleSubject(subject.name)}
                  >
                    <span className="subject-chip-icon">
                      <Icon size={17} strokeWidth={1.9} />
                    </span>

                    <span>{subject.name}</span>
                  </button>
                );
              })}
            </div>
            {errors.subjects && <p className="setup-required-error">{errors.subjects}</p>}

            {/* Actions */}
            <div className="child-studies-actions">
              <button
                type="button"
                className="child-studies-back"
                onClick={handleBack}
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
