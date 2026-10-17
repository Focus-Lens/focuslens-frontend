import { ArrowRight, Check, ExternalLink, List, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { dashboardMockData } from "../../data/mockData";
import { getPlanPrice, planCatalog, readPlanSelection } from "../../data/subscriptionPlans";
import nextStepsImage from "../../assets/payments/checkout-next-steps.png";
import planIcon from "../../assets/payments/subscription-plan-icon.png";
import "../../css/dashboard/PurchaseCheckout.css";

export default function PurchaseCheckout({ previewOnly = false }) {
  const navigate = useNavigate();
  const selection = readPlanSelection();
  const plan = planCatalog.find((item) => item.id === selection?.planId && item.id !== "free") || planCatalog[1];
  const billingCycle = selection?.billingCycle || "monthly";
  const price = getPlanPrice(plan, billingCycle);
  const previewData = previewOnly
    ? {
        parent: { firstName: dashboardMockData.profile.fullName.split(/\s+/)[0] },
        child: { preferredName: dashboardMockData.child.preferredName, grade: "Grade 10" },
      }
    : null;
  const plansPath = previewOnly ? "/plans-preview" : "/plans";
  const paymentPath = previewOnly ? "/checkout-payment-preview" : "/checkout/payment";

  return (
    <div className="purchase-checkout-shell">
      <DashboardHeader activePage="children" previewData={previewData} />
      <main className="purchase-checkout-page">
        <header className="purchase-checkout-heading">
          <h1>Complete your purchase</h1>
          <p>Review your plan details and continue to payment.</p>
        </header>

        <ol className="purchase-stepper" aria-label="Purchase progress">
          <li className="complete"><span><Check size={15} /></span><small>Plan</small></li>
          <i className="complete-line" aria-hidden="true" />
          <li className="active" aria-current="step"><span>2</span><small>Summary</small></li>
          <i aria-hidden="true" />
          <li><span>3</span><small>Payment</small></li>
          <i aria-hidden="true" />
          <li><span>4</span><small>Done</small></li>
        </ol>

        <div className="purchase-checkout-grid">
          <section className="purchase-summary-card" aria-labelledby="order-summary-title">
            <header className="purchase-summary-heading">
              <h2 id="order-summary-title">Order summary</h2>
              <p>Here’s what you’re purchasing.</p>
            </header>

            <div className="purchase-plan-highlight">
              <span className="purchase-plan-icon"><img src={planIcon} alt="" /></span>
              <div className="purchase-plan-name">
                <strong>{plan.name} Plan</strong>
                <span>{plan.audience}</span>
              </div>
              <div className="purchase-plan-price">
                <strong>{price.toLocaleString("en-US")} EGP</strong>
                <span>per {billingCycle === "yearly" ? "year" : "month"}</span>
              </div>
            </div>

            <dl className="purchase-details">
              <div><dt><Check size={14} /> Billing cycle</dt><dd>{billingCycle === "yearly" ? "Yearly · Save 20%" : "Monthly"}</dd></div>
              {plan.features.map((feature) => (
                <div className="purchase-feature" key={feature}>
                  <dt><Check size={14} /> {feature}</dt>
                </div>
              ))}
            </dl>

            <div className="purchase-total">
              <strong>Total</strong>
              <span><b>{price.toLocaleString("en-US")} EGP</b> / {billingCycle === "yearly" ? "year" : "month"}</span>
            </div>
          </section>

          <aside className="purchase-next-card" aria-labelledby="purchase-next-title">
            <img src={nextStepsImage} alt="FocusLens payment mascot" />
            <h2 id="purchase-next-title">What happens next?</h2>
            <ul>
              <li><span><ExternalLink size={15} /></span><p>You’ll be redirected to our approved payment provider to securely complete your purchase.</p></li>
              <li><span><ShieldCheck size={15} /></span><p>Your plan becomes active only after we receive confirmation from the payment provider.</p></li>
              <li><span><List size={15} /></span><p>After payment, the status may show as pending, failed, or cancelled depending on the provider’s response.</p></li>
            </ul>
          </aside>
        </div>

        <footer className="purchase-actions">
          <Link className="purchase-back" to={plansPath}>Back</Link>
          <button className="purchase-continue" type="button" onClick={() => navigate(paymentPath)}>Continue to payment <ArrowRight size={17} /></button>
        </footer>
      </main>
    </div>
  );
}
