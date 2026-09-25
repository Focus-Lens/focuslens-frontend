import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ParentLayout, Button, Card, AuthLayout, Field } from "../../components/ui/CommonUI";
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
  X,
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
  const [otherGrade, setOtherGrade] = useState(child.otherGrade || "");
  const [selectedSubjects, setSelectedSubjects] = useState(child.subjects);
  const [otherSubjects, setOtherSubjects] = useState(
    child.otherSubjects?.length
      ? child.otherSubjects
      : child.otherSubject?.trim()
        ? [child.otherSubject.trim()]
        : [],
  );
  const [otherSubjectInput, setOtherSubjectInput] = useState("");
  const [errors, setErrors] = useState({});

  function addOtherSubject(value = otherSubjectInput) {
    const cleanValue = value.trim();
    if (!cleanValue) return otherSubjects;

    const nextSubjects = otherSubjects.some(
      (subject) => subject.toLowerCase() === cleanValue.toLowerCase(),
    )
      ? otherSubjects
      : [...otherSubjects, cleanValue];
    setOtherSubjects(nextSubjects);
    updateChild({ otherSubjects: nextSubjects, otherSubject: nextSubjects[0] || "" });
    setOtherSubjectInput("");
    setErrors((current) => ({ ...current, otherSubject: "" }));
    return nextSubjects;
  }

  function removeOtherSubject(subjectToRemove) {
    const nextSubjects = otherSubjects.filter((subject) => subject !== subjectToRemove);
    setOtherSubjects(nextSubjects);
    updateChild({ otherSubjects: nextSubjects, otherSubject: nextSubjects[0] || "" });
  }

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
    setErrors((current) => ({
      ...current,
      grade: "",
      otherGrade: nextGrade === "Other" && !otherGrade.trim()
        ? current.otherGrade
        : "",
    }));
  }

  function handleBack() {
    const returnTo = searchParams.get("returnTo");
    const path = "/setup/basic-info";
    navigate(returnTo ? `${path}?returnTo=${encodeURIComponent(returnTo)}` : path);
  }

  function handleContinue() {
    const finalOtherSubjects = otherSubjectInput.trim()
      ? addOtherSubject(otherSubjectInput)
      : otherSubjects;
    const nextErrors = {
      grade: grade ? "" : "Grade is required.",
      otherGrade:
        grade === "Other" && !otherGrade.trim()
          ? "Enter the grade name."
          : "",
      subjects: selectedSubjects.length ? "" : "At least one subject is required.",
      otherSubject:
        selectedSubjects.includes("Other") && !finalOtherSubjects.length
          ? "Enter at least one subject name."
          : "",
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    updateChild({
      grade,
      otherGrade: otherGrade.trim(),
      subjects: selectedSubjects,
      otherSubjects: finalOtherSubjects,
      otherSubject: finalOtherSubjects[0] || "",
    });

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
            {grade === "Other" && (
              <div className="other-subject-input other-grade-input">
                <Field
                  label="Grade name"
                  value={otherGrade}
                  onChange={(event) => {
                    const value = event.target.value;
                    setOtherGrade(value);
                    updateChild({ otherGrade: value });
                    if (value.trim()) {
                      setErrors((current) => ({ ...current, otherGrade: "" }));
                    }
                  }}
                  placeholder="Enter grade name"
                  aria-invalid={Boolean(errors.otherGrade)}
                />
                {errors.otherGrade && (
                  <p className="setup-required-error">{errors.otherGrade}</p>
                )}
              </div>
            )}

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
            {selectedSubjects.includes("Other") && (
              <div className="other-subject-input">
                <Field
                  label="Subject name"
                  value={otherSubjectInput}
                  onChange={(event) => {
                    setOtherSubjectInput(event.target.value);
                  }}
                  placeholder="Enter subject name"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addOtherSubject();
                    }
                  }}
                  aria-invalid={Boolean(errors.otherSubject)}
                />
                <button
                  type="button"
                  className="add-custom-subject"
                  onClick={() => addOtherSubject()}
                  disabled={!otherSubjectInput.trim()}
                >
                  Add subject
                </button>
                {otherSubjects.length > 0 && (
                  <div className="custom-subject-list" aria-label="Added subjects">
                    {otherSubjects.map((subject) => (
                      <span className="custom-subject-chip" key={subject}>
                        {subject}
                        <button
                          type="button"
                          aria-label={`Remove ${subject}`}
                          onClick={() => removeOtherSubject(subject)}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {errors.otherSubject && (
                  <p className="setup-required-error">{errors.otherSubject}</p>
                )}
              </div>
            )}

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
