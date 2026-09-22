import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AuthLayout,
  ParentLayout,
  Button,
  Card,
} from "../../components/ui/CommonUI";
import { useChildProfile } from "../../context/ChildProfileContext";
import { Check } from "lucide-react";
import "../../css/onboarding/ChildStudyGoal.css";

const steps = [
  "Basic info",
  "Studies",
  "Context",
  "Goal",
  "Review",
  "Invite",
];

export default function ChildStudyGoal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { child, updateChild } = useChildProfile();
  const [weeklyHours, setWeeklyHours] = useState(
    () => String(child.studyTimeGoal?.value || 8),
  );

  function saveGoal() {
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
                  min="1"
                  value={weeklyHours}
                  onChange={(event) => setWeeklyHours(event.target.value)}
                />
              </div>

              <div className="child-goal-current-week">
                Current week · Set automatically
              </div>

              <div className="child-goal-actions">
                <button
                  type="button"
                  className="child-goal-back"
                  onClick={() => navigate("/setup/context")}
                >
                  Back
                </button>

                <Button onClick={saveGoal}>Add weekly goal</Button>
              </div>
            </div>
          </Card>
        </div>
      </ParentLayout>
    </AuthLayout>
  );
}
