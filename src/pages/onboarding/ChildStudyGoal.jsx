import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AuthLayout,
  ParentLayout,
  Button,
  Card,
} from "../../components/ui/CommonUI";
import { useChildProfile } from "../../context/useChildProfile";
import { api } from "../../services/api";
import { Check, ChevronDown } from "lucide-react";
import "../../css/onboarding/ChildStudyGoal.css";

const steps = [
  "Basic info",
  "Studies",
  "Context",
  "Goal",
  "Review",
  "Invite",
];

const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function ChildStudyGoal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { child, updateChild } = useChildProfile();
  const [weeklyHours, setWeeklyHours] = useState(
    () => String(child.studyTimeGoal?.value || 8),
  );

  // "Start Day" is the parent's week start setting on the server, not part of
  // the child's goal: it is loaded from and saved to /api/parents/me/settings.
  // Sunday is shown until the setting loads, or when the parent has none yet.
  const [weekStartsOn, setWeekStartsOn] = useState("Sunday");
  const [isDayMenuOpen, setIsDayMenuOpen] = useState(false);
  const dayMenuRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/api/parents/me/settings")
      .then((settings) => {
        if (active && weekDays.includes(settings?.weekStartsOn)) {
          setWeekStartsOn(settings.weekStartsOn);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isDayMenuOpen) return undefined;

    function closeOnOutsideClick(event) {
      if (!dayMenuRef.current?.contains(event.target)) setIsDayMenuOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") setIsDayMenuOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isDayMenuOpen]);

  async function saveGoal() {
    if (isSaving) return;

    // The backend needs hours * 60 to be whole minutes, so only quarter-hour
    // values are accepted (1, 1.25, 1.5, 1.75 …). Nothing is rounded.
    const hours = Number(weeklyHours);
    if (!Number.isFinite(hours) || hours <= 0) {
      setError("Enter how many hours per week, greater than 0.");
      return;
    }
    if (!Number.isInteger(hours * 4)) {
      setError("Use quarter-hour steps, for example 1, 1.25, 1.5 or 1.75 hours.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await api("/api/parents/me/settings", {
        method: "PUT",
        body: { weekStartsOn },
      });
    } catch (requestError) {
      setError(requestError.message || "Could not save the week start day. Please try again.");
      setIsSaving(false);
      return;
    }

    updateChild({
      suggestedGoal: `${weeklyHours} hours per week`,
      studyTimeGoal: {
      goalType: "weekly",
      value: weeklyHours,
      cycle: "Current week",
      },
    });

    if (searchParams.get("returnTo") === "waiting") {
      navigate("/waiting-for-child");
      return;
    }

    navigate("/setup/review");
  }

  function handleBack() {
    const returnTo = searchParams.get("returnTo");
    if (returnTo === "review") navigate("/setup/review");
    else if (returnTo === "waiting") navigate("/setup/review?returnTo=waiting");
    else navigate("/setup/context");
  }

  return (
    <AuthLayout hideFooter>
      <ParentLayout>
        <div className="child-goal-wrapper">
          <Card>
            <div className="child-goal-page">
              <div className="child-goal-stepper">
                {steps.map((item, index) => {
                  const stepNumber = index + 1;
                  const isCompleted = stepNumber < 4;
                  const isActive = stepNumber === 4;

                  return (
                    <div
                      key={item}
                      className={`child-goal-step ${
                        isActive ? "active" : ""
                      } ${isCompleted ? "completed" : ""}`}
                    >
                      <span className="child-goal-step-circle">
                        {isCompleted ? (
                          <Check size={12} strokeWidth={2.8} />
                        ) : (
                          stepNumber
                        )}
                      </span>

                      <span className="child-goal-step-label">{item}</span>
                    </div>
                  );
                })}
              </div>

              <h1 className="child-goal-title">
                Set {child.preferredName}’s weekly goal
              </h1>

              <p className="child-goal-subtitle">
                A new study-time goal is required at the start of each week.
              </p>

              <div className="weekly-goal-label">Weekly goal</div>

              <h3 className="child-goal-section-title">
                Weekly study target
              </h3>

              <div className="child-goal-input-wrap">
                <label>Hours per week</label>

                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  inputMode="decimal"
                  value={weeklyHours}
                  onChange={(event) => {
                    setWeeklyHours(event.target.value);
                    setError("");
                  }}
                />
              </div>

              <div
                className={`child-goal-input-wrap child-goal-select-wrap ${
                  isDayMenuOpen ? "open" : ""
                }`}
                ref={dayMenuRef}
              >
                <label id="child-goal-week-start-label">Week starts on</label>

                <button
                  type="button"
                  className="child-goal-select-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={isDayMenuOpen}
                  aria-labelledby="child-goal-week-start-label"
                  onClick={() => setIsDayMenuOpen((open) => !open)}
                >
                  <span>{weekStartsOn}</span>
                  <ChevronDown
                    className="child-goal-select-icon"
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </button>

                {isDayMenuOpen && (
                  <ul
                    className="child-goal-select-menu"
                    role="listbox"
                    aria-labelledby="child-goal-week-start-label"
                  >
                    {weekDays.map((day) => (
                      <li key={day}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={day === weekStartsOn}
                          className={day === weekStartsOn ? "selected" : ""}
                          onClick={() => {
                            setWeekStartsOn(day);
                            setIsDayMenuOpen(false);
                            setError("");
                          }}
                        >
                          <span>{day}</span>
                          {day === weekStartsOn && (
                            <Check size={15} strokeWidth={2.6} aria-hidden="true" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="child-goal-current-week">
                Current week · Set automatically
              </div>

              <div className="child-goal-actions">
                <button
                  type="button"
                  className="child-goal-back"
                  onClick={handleBack}
                >
                  Back
                </button>

                <Button onClick={saveGoal} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Add weekly goal"}
                </Button>
              </div>

              {error && <p className="child-goal-error" role="alert">{error}</p>}
            </div>
          </Card>
        </div>
      </ParentLayout>
    </AuthLayout>
  );
}
