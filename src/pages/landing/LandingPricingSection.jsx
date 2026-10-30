import { useState } from "react";
import { useAuth } from "../../context/useAuth";
import { Check, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { getPlanPrice, planCatalog, planSelectionStorageKey } from "../../data/subscriptionPlans";

export default function LandingPricingSection() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const { isAuthenticated } = useAuth();

  function choosePlan(plan) {
    sessionStorage.setItem(planSelectionStorageKey, JSON.stringify({ planId: plan.id, billingCycle }));
  }

  return (
    <section className="landing-pricing" id="pricing" aria-labelledby="landing-pricing-title">
      <div className="landing-pricing-inner">
        <header className="landing-pricing-heading">
          <p className="landing-pricing-eyebrow">PARENT PLANS</p>
          <h2 id="landing-pricing-title">Choose the support<br /><span>that fits your family.</span></h2>
          <p className="landing-pricing-subtitle">Start with Free. Choose monthly or yearly billing in EGP.</p>
        </header>
        <div className="landing-pricing-toggle" role="group" aria-label="Billing period">
          <span className={`landing-pricing-toggle-thumb${billingCycle === "yearly" ? " is-yearly" : ""}`} />
          <button type="button" aria-pressed={billingCycle === "monthly"} onClick={() => setBillingCycle("monthly")}>Monthly</button>
          <button type="button" aria-pressed={billingCycle === "yearly"} onClick={() => setBillingCycle("yearly")}>Yearly</button>
        </div>
        <div className="landing-pricing-grid">
          {planCatalog.map((plan) => (
            <article className={`landing-plan-card${plan.recommended ? " is-recommended" : ""}`} key={plan.id}>
              {plan.recommended && <span className="landing-plan-badge">Best value</span>}
              <div className="landing-plan-title"><h3>{plan.name}</h3><p>{plan.audience}</p></div>
              <div className="landing-plan-price" key={`${plan.id}-${billingCycle}`}>
                <strong>{getPlanPrice(plan, billingCycle).toLocaleString("en-US")} EGP</strong>
                <span>per {billingCycle === "yearly" ? "year" : "month"}</span>
              </div>
              <ul className="landing-plan-features">
                {plan.features.map((feature) => <li key={feature}><Check aria-hidden="true" /><span>{feature}</span></li>)}
              </ul>
              <Link className={`landing-plan-cta${plan.id === "free" ? " is-free" : ""}`} to={isAuthenticated ? (plan.id === "free" ? "/overview" : "/checkout") : "/register"} onClick={() => choosePlan(plan)}>
                {plan.id === "free" ? "Start with Free" : `Choose ${plan.name}`}
              </Link>
            </article>
          ))}
        </div>
        <p className="landing-pricing-summary" aria-live="polite">{billingCycle === "monthly" ? "Monthly" : "Yearly"} billing: {planCatalog.map((plan, index) => `${index ? " · " : ""}${plan.name} EGP ${getPlanPrice(plan, billingCycle).toLocaleString("en-US")}`).join("")}.</p>
        <aside className="landing-pricing-note"><Info aria-hidden="true" /><span>Sessions and AI credits are separate allowances. Family allowances are not pooled.</span></aside>
      </div>
    </section>
  );
}

