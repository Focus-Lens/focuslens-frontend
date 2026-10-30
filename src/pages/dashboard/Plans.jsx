import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { ParentLayout } from "../../components/ui/CommonUI";
import { useAuth } from "../../context/useAuth";
import { dashboardMockData } from "../../data/mockData";
import { getPlanPrice, planCatalog, planSelectionStorageKey, readActiveSubscription, readPlanSelection } from "../../data/subscriptionPlans";
import "../../css/dashboard/Plans.css";

export default function Plans({ previewOnly = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const params = new URLSearchParams(window.location.search);
  const changeMode = params.get("change") === "1";
  const fromPlanId = planCatalog.some((plan) => plan.id === params.get("from")) ? params.get("from") : null;
  const activeSubscription = previewOnly
    ? (changeMode && fromPlanId ? { planId: fromPlanId, billingCycle: params.get("cycle") || "monthly", status: "active" } : null)
    : readActiveSubscription(user);
  const currentPlanId = changeMode ? (activeSubscription?.planId || fromPlanId || "free") : null;
  const currentPlan = planCatalog.find((plan) => plan.id === currentPlanId) || planCatalog[0];
  const initialCycle = changeMode
    ? (activeSubscription?.billingCycle === "yearly" ? "yearly" : "monthly")
    : (readPlanSelection()?.billingCycle || "monthly");
  const [billingCycle, setBillingCycle] = useState(initialCycle);
  const [selectedPlanId, setSelectedPlanId] = useState(() => changeMode ? currentPlanId : (readPlanSelection()?.planId || "free"));
  const previewData = previewOnly
    ? {
        parent: { firstName: dashboardMockData.profile.fullName.split(/\s+/)[0] },
        child: { preferredName: dashboardMockData.child.preferredName, grade: "Grade 10" },
      }
    : null;

  const selectedPlan = useMemo(
    () => planCatalog.find((plan) => plan.id === selectedPlanId) || planCatalog[0],
    [selectedPlanId],
  );
  const previewSubscribed = previewOnly && new URLSearchParams(window.location.search).get("subscribed") === "1";
  if (previewData && previewOnly) {
    previewData.previewOnly = true;
    if (changeMode && currentPlanId !== "free") {
      previewData.subscription = { planId: currentPlanId, billingCycle, status: "active" };
    } else if (previewSubscribed) {
      previewData.subscription = { planId: "plus", billingCycle: "monthly", status: "active" };
    }
  }

  function selectPlan(plan) {
    if (plan.id === "free" && !changeMode) return;
    const nextSelection = { planId: plan.id, billingCycle, ...(changeMode ? { changeMode: true, fromPlanId: currentPlanId } : {}) };
    sessionStorage.setItem(planSelectionStorageKey, JSON.stringify(nextSelection));
    setSelectedPlanId(plan.id);
    if (plan.id === "free") return;
    navigate(previewOnly ? "/checkout-preview" : "/checkout");
  }

  function changeBillingCycle(nextCycle) {
    setBillingCycle(nextCycle);
    sessionStorage.setItem(planSelectionStorageKey, JSON.stringify({
      planId: selectedPlanId,
      billingCycle: nextCycle,
      ...(changeMode ? { changeMode: true, fromPlanId: currentPlanId } : {}),
    }));
  }

  return (
    <div className={`plans-page-shell${changeMode ? " plans-change-mode" : ""}`}>
      <DashboardHeader activePage="payment" previewData={previewData} />
      <ParentLayout>
        <main className="plans-page">
          <header className={`plans-heading${changeMode ? " plans-change-heading" : ""}`}>
            {changeMode ? (
              <>
                <p>Compare plans, review the timing, then confirm your change.</p>
                <h1>Change plan — {currentPlan.name} · {billingCycle === "yearly" ? "Yearly" : "Monthly"}</h1>
              </>
            ) : (
              <>
                <h1>Choose the plan that works for your family</h1>
                <p>Same powerful learning experience. More support as you grow.</p>
              </>
            )}
          </header>

          <div className="plans-billing-toggle" role="group" aria-label="Billing period">
            <button type="button" className={billingCycle === "monthly" ? "active" : ""} aria-pressed={billingCycle === "monthly"} onClick={() => changeBillingCycle("monthly")}>Monthly</button>
            <button type="button" className={billingCycle === "yearly" ? "active" : ""} aria-pressed={billingCycle === "yearly"} onClick={() => changeBillingCycle("yearly")}>Yearly <span>Save 20%</span></button>
          </div>

          <section className="plans-grid" aria-label="Available plans">
            {planCatalog.map((plan) => {
              const price = getPlanPrice(plan, billingCycle);
              const isCurrentPlan = changeMode
                ? plan.id === currentPlanId
                : plan.id === "free" && !previewSubscribed;
              const isSelected = changeMode
                ? plan.id !== currentPlanId && selectedPlan.id === plan.id
                : plan.id !== "free" && selectedPlan.id === plan.id;
              const showRecommendedBorder = plan.recommended && (
                !changeMode || selectedPlan.id === currentPlanId || isSelected
              );
              const sourceRank = planCatalog.findIndex((item) => item.id === currentPlanId);
              const targetRank = planCatalog.findIndex((item) => item.id === plan.id);
              const changeLabel = plan.id === "free"
                ? "Switch to free"
                : targetRank > sourceRank ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`;
              return (
                <article className={`plan-card${showRecommendedBorder ? " recommended" : ""}${isSelected ? " selected" : ""}`} key={plan.id}>
                  {plan.recommended && <span className="plan-best-value">Best value</span>}
                  {changeMode && isCurrentPlan && <span className="plan-current-badge">Current plan</span>}
                  <div className="plan-card-copy">
                    <h2>{plan.name}</h2>
                    <p>{plan.audience}</p>
                  </div>
                  <div className="plan-price">
                    <strong>{price.toLocaleString("en-US")} EGP</strong>
                    <span>{billingCycle === "yearly" ? "per year" : "per month"}</span>
                  </div>
                  <ul className="plan-features">
                    {plan.features.map((feature) => <li key={feature}><span className="plan-check"><Check size={11} strokeWidth={2.4} /></span><span>{feature}</span></li>)}
                  </ul>
                  {changeMode ? (
                    <button
                      className={`plan-cta${isCurrentPlan ? " current" : " upgrade"}${isSelected ? " chosen" : ""}`}
                      type="button"
                      disabled={isCurrentPlan}
                      aria-pressed={isSelected}
                      onClick={() => selectPlan(plan)}
                    >
                      {isCurrentPlan ? "Current Plan" : isSelected ? `Selected: ${plan.name}` : changeLabel}
                    </button>
                  ) : plan.id === "free" ? (
                    <button className="plan-cta current" type="button" disabled>Current Plan</button>
                  ) : (
                    <button className={`plan-cta upgrade${isSelected ? " chosen" : ""}`} type="button" aria-pressed={isSelected} onClick={() => selectPlan(plan)}>
                      {isSelected ? `Selected: ${plan.name}` : `Upgrade to ${plan.name}`}
                    </button>
                  )}
                </article>
              );
            })}
          </section>
          {changeMode && (
            <aside className="plan-change-timing">
              <strong>When changes take effect</strong>
              <span>Upgrades apply after confirmed payment. A downgrade is scheduled for the effective date shown in your review.</span>
            </aside>
          )}
        </main>
      </ParentLayout>
    </div>
  );
}
