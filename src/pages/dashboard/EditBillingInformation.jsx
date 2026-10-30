import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { planCatalog, readActiveSubscription } from "../../data/subscriptionPlans";
import { readBillingContact, saveBillingContact } from "../../data/billingContact";
import { dashboardMockData } from "../../data/mockData";
import "../../css/dashboard/EditBillingInformation.css";

export default function EditBillingInformation({ previewOnly = false }) {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const subscription = useMemo(() => previewOnly ? null : readActiveSubscription(user), [previewOnly, user]);
  const requestedPlanId = params.get("plan") || subscription?.planId || "plus";
  const plan = planCatalog.find((item) => item.id === requestedPlanId) || planCatalog[1];
  const baseName = previewOnly
    ? dashboardMockData.profile.fullName
    : `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  const fallback = {
    fullName: baseName || "Parent account",
    email: previewOnly ? dashboardMockData.profile.email : user?.email || "",
    city: user?.city || "Cairo",
    country: user?.country || "Egypt",
    address: user?.billingAddress || "",
  };
  const returnPath = previewOnly
    ? (plan.id === "family" ? "/manage-subscription-family-preview" : "/manage-subscription-preview")
    : "/manage-subscription";
  const headerPreview = previewOnly ? {
    previewOnly: true,
    subscription: { planId: plan.id, billingCycle: "monthly", status: "active" },
    parent: { firstName: "Mariam", lastName: "Hassan", email: fallback.email },
    child: { preferredName: "Youssef", grade: "Grade 10" },
  } : null;
  const [contact, setContact] = useState(() => readBillingContact(fallback));
  const [showSuccess, setShowSuccess] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setContact((current) => ({ ...current, [name]: value }));
  }

  function save(event) {
    event.preventDefault();
    saveBillingContact(contact);
    setShowSuccess(true);
  }

  return (
    <>
      <DashboardHeader activePage="payment" previewData={headerPreview} />
      <main className="billing-edit-page">
        <header className="billing-edit-heading">
          <h1>Edit billing information</h1>
          <p>Keep the contact details on your receipts up to date.</p>
        </header>

      <form className="billing-edit-card" onSubmit={save}>
        <h2>Billing contact</h2>
        <label className="billing-edit-field">
          <span>Full name</span>
          <input name="fullName" value={contact.fullName} onChange={updateField} required autoComplete="name" />
        </label>
        <label className="billing-edit-field">
          <span>Billing email</span>
          <input type="email" name="email" value={contact.email} onChange={updateField} required autoComplete="email" />
        </label>
        <div className="billing-edit-location-fields">
          <label className="billing-edit-field">
            <span>City</span>
            <input name="city" value={contact.city} onChange={updateField} required autoComplete="address-level2" />
          </label>
          <label className="billing-edit-field">
            <span>Country</span>
            <input name="country" value={contact.country} onChange={updateField} required autoComplete="country-name" />
          </label>
        </div>
        <label className="billing-edit-field">
          <span>Billing address (optional)</span>
          <input name="address" value={contact.address} onChange={updateField} autoComplete="street-address" placeholder="Add address" />
        </label>
        <aside className="billing-edit-note">
          <strong>Applies to future billing documents</strong>
          <span>Existing receipts keep their original billing details. Payment card details are managed securely with the payment provider.</span>
        </aside>
        <div className="billing-edit-actions">
          <Link className="billing-edit-cancel" to={returnPath}>Cancel</Link>
          <button className="billing-edit-save" type="submit">Save billing information</button>
        </div>
      </form>

      {showSuccess && (
        <div className="billing-edit-modal-backdrop" role="presentation">
          <section className="billing-edit-success-modal" role="dialog" aria-modal="true" aria-labelledby="billing-edit-success-title">
            <button className="billing-edit-modal-close" type="button" aria-label="Close" onClick={() => navigate(returnPath, { replace: true })}><X size={18} /></button>
            <span className="billing-edit-success-icon"><Check size={20} /></span>
            <h2 id="billing-edit-success-title">Billing information saved</h2>
            <p>Your billing contact details have been updated.</p>
            <button className="billing-edit-save" type="button" onClick={() => navigate(returnPath, { replace: true })}>Back to billing</button>
          </section>
        </div>
      )}
      </main>
    </>
  );
}
