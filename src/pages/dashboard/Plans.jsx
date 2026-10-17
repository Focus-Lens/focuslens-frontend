import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { ParentLayout } from "../../components/ui/CommonUI";
import { dashboardMockData } from "../../data/mockData";
import { getPlanPrice, planCatalog, planSelectionStorageKey, readPlanSelection } from "../../data/subscriptionPlans";
import "../../css/dashboard/Plans.css";

export default function Plans({ previewOnly = false }) {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState(() => readPlanSelection()?.billingCycle || "monthly");
  const [selectedPlanId, setSelectedPlanId] = useState(() => readPlanSelection()?.planId || "free");
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

  function selectPlan(plan) {
    if (plan.id === "free") return;
    const nextSelection = { planId: plan.id, billingCycle };
    sessionStorage.setItem(planSelectionStorageKey, JSON.stringify(nextSelection));
    setSelectedPlanId(plan.id);
    navigate(previewOnly ? "/checkout-preview" : "/checkout");
  }

  function changeBillingCycle(nextCycle) {
    setBillingCycle(nextCycle);
    if (selectedPlanId !== "free") {
      sessionStorage.setItem(planSelectionStorageKey, JSON.stringify({ planId: selectedPlanId, billingCycle: nextCycle }));
    }
  }

  return (
    <div className="plans-page-shell">
      <DashboardHeader activePage="children" previewData={previewData} />
      <ParentLayout>
        <main className="plans-page">
          <header className="plans-heading">
            <h1>Choose the plan that works for your family</h1>
            <p>Same powerful learning experience. More support as you grow.</p>
          </header>

          <div className="plans-billing-toggle" role="group" aria-label="Billing period">
            <button type="button" className={billingCycle === "monthly" ? "active" : ""} aria-pressed={billingCycle === "monthly"} onClick={() => changeBillingCycle("monthly")}>Monthly</button>
            <button type="button" className={billingCycle === "yearly" ? "active" : ""} aria-pressed={billingCycle === "yearly"} onClick={() => changeBillingCycle("yearly")}>Yearly <span>Save 20%</span></button>
          </div>

          <section className="plans-grid" aria-label="Available plans">
            {planCatalog.map((plan) => {
              const price = getPlanPrice(plan, billingCycle);
              const isSelected = plan.id !== "free" && selectedPlan.id === plan.id;
              return (
                <article className={`plan-card${plan.recommended ? " recommended" : ""}${isSelected ? " selected" : ""}`} key={plan.id}>
                  {plan.recommended && <span className="plan-best-value">Best value</span>}
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
                  {plan.id === "free" ? (
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
        </main>
      </ParentLayout>
    </div>
  );
}
