import { useState } from "react";
import { CalendarDays, Check, CreditCard, Crown, LockKeyhole, RefreshCw, ShieldCheck, Smartphone, Upload } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { dashboardMockData } from "../../data/mockData";
import { getPlanPrice, planCatalog, readPlanSelection, saveActiveSubscription } from "../../data/subscriptionPlans";
import visaLogo from "../../assets/payments/visa.svg";
import mastercardLogo from "../../assets/payments/mastercard.svg";
import meezaLogo from "../../assets/payments/meeza.svg";
import vodafoneCashLogo from "../../assets/payments/vodafone-cash.svg";
import vodafoneCashIcon from "../../assets/payments/vodafone-cash-icon.svg";
import orangeCashLogo from "../../assets/payments/orange-cash.svg";
import etisalatLogo from "../../assets/payments/etisalat-logo.png";
import paymentPendingArt from "../../assets/payments/payment-pending.svg";
import paymentSuccessArt from "../../assets/payments/payment-success.svg";
import paymentFailedArt from "../../assets/payments/payment-failed.svg";
import "../../css/dashboard/PurchaseCheckout.css";
import "../../css/dashboard/SecurePayment.css";

const paymentMethods = [
  {
    id: "card",
    title: "Credit or Debit Card",
    description: "Visa, Mastercard, or Meeza",
    logos: [
      { src: visaLogo, alt: "Visa", className: "secure-payment-logo visa" },
      { src: mastercardLogo, alt: "Mastercard", className: "secure-payment-logo mastercard" },
      { src: meezaLogo, alt: "Meeza", className: "secure-payment-logo meeza" },
    ],
  },
  {
    id: "vodafone",
    title: "Vodafone Cash",
    description: "Pay using your Vodafone Cash wallet",
    providerLogo: vodafoneCashLogo,
    walletLabel: 'cash',
  },
  {
    id: "orange",
    title: "Orange Cash",
    description: "Pay using your Orange Cash wallet",
    providerLogo: orangeCashLogo,
    walletLabel: 'Orange Cash',
  },
  {
    id: "etisalat",
    title: "Etisalat Cash",
    description: "Pay using your Etisalat Cash wallet",
    providerLogo: etisalatLogo,
    walletLabel: 'etisalat cash',
  },
];

function formatPaymentDate(value) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function getRenewalDate(value, billingCycle) {
  const date = new Date(value);
  if (billingCycle === "yearly") date.setFullYear(date.getFullYear() + 1);
  else date.setMonth(date.getMonth() + 1);
  return date;
}

export default function SecurePayment({ previewOnly = false }) {
  const [params] = useSearchParams();
const requestedCardStatus = previewOnly ? new URLSearchParams(window.location.search).get("card-status") : null;
  const forcedCardStatus = ["success", "pending", "failed"].includes(requestedCardStatus) ? requestedCardStatus : null;
  const [selectedMethod, setSelectedMethod] = useState(() => (forcedCardStatus ? "card" : null));
  const [showCardForm, setShowCardForm] = useState(Boolean(forcedCardStatus));
  const [cardPaymentStatus, setCardPaymentStatus] = useState(forcedCardStatus);
  const [cardPaymentRecord, setCardPaymentRecord] = useState(null);
  const [cardholderInput, setCardholderInput] = useState("");
  const [cardNumberInput, setCardNumberInput] = useState("");
  const [securityCodeInput, setSecurityCodeInput] = useState("");
  const [cardFieldTouched, setCardFieldTouched] = useState({});
  const [expiryInput, setExpiryInput] = useState("");
  const [receiptPreview, setReceiptPreview] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [paymentUnderReview, setPaymentUnderReview] = useState(false);
  const managingPaymentMethod = params.get("from") === "manage-payment";
  const selection = readPlanSelection();
  const requestedPlanId = params.get("plan") || selection?.planId;
  const plan = planCatalog.find((item) => item.id === requestedPlanId && item.id !== "free") || planCatalog[1];
  const requestedCycle = params.get("cycle");
  const billingCycle = requestedCycle === "monthly" || requestedCycle === "yearly"
    ? requestedCycle
    : selection?.billingCycle || "monthly";
  const price = getPlanPrice(plan, billingCycle);
  const cardholderValid = cardholderInput.trim().split(/\s+/).filter(Boolean).length >= 4;
  const cardDigits = cardNumberInput.replace(/\D/g, "");
  const cardNumberValid = cardDigits.length === 16;
  const expiryParts = expiryInput.split("/");
  const expiryMonth = Number(expiryParts[0]);
  const expiryYear = Number(expiryParts[1]);
  const expiryDate = new Date(2000 + expiryYear, expiryMonth, 0, 23, 59, 59);
  const expiryValid = /^\d{2}\/\d{2}$/.test(expiryInput) && expiryMonth >= 1 && expiryMonth <= 12 && expiryDate >= new Date();
  const securityCodeValid = /^\d{3,4}$/.test(securityCodeInput);
  const cardFormValid = cardholderValid && cardNumberValid && expiryValid && securityCodeValid;
  const previewData = previewOnly
    ? {
        previewOnly: true,
        subscription: { planId: plan.id, billingCycle, status: "active" },
        parent: { firstName: dashboardMockData.profile.fullName.split(/\s+/)[0] },
        child: { preferredName: dashboardMockData.child.preferredName, grade: "Grade 10" },
      }
    : null;
  const backPath = managingPaymentMethod
    ? (previewOnly ? `/manage-payment-method-preview?plan=${plan.id}` : `/manage-payment-method?plan=${plan.id}`)
    : (previewOnly ? "/checkout-preview" : "/checkout");
  const completionPath = managingPaymentMethod
    ? (previewOnly ? (plan.id === "family" ? "/manage-subscription-family-preview" : "/manage-subscription-preview") : "/manage-subscription")
    : "/overview";

  function chooseMethod(methodId) {
    setSelectedMethod(methodId);
    setShowCardForm(methodId === "card");
    setReceiptPreview("");
    setReceiptName("");
    setPaymentUnderReview(false);
    setCardPaymentStatus(null);
    setCardPaymentRecord(null);
    setCardholderInput("");
    setCardNumberInput("");
    setSecurityCodeInput("");
    setCardFieldTouched({});
    setExpiryInput("");
  }

  function handleReceiptChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function handlePayClick() {
    if (selectedMethod === "card") setShowCardForm(true);
  }

  function activateSubscription(record = cardPaymentRecord) {
    if (previewOnly) return;
    const paidAt = record?.paidAt || new Date();
    saveActiveSubscription({
      planId: plan.id,
      billingCycle,
      status: "active",
      paidAt: paidAt.toISOString(),
      nextRenewalAt: getRenewalDate(paidAt, billingCycle).toISOString(),
      paymentBrand: "Visa",
      lastFour: record?.lastFour || "4242",
    });
  }

  return (
    <div className="secure-payment-shell">
      <DashboardHeader activePage="payment" previewData={previewData} />
      <main className="secure-payment-page">
        <header className="secure-payment-heading">
          <h1>Secure payment</h1>
          <p>Choose your preferred payment method</p>
        </header>

        <ol className="purchase-stepper secure-payment-stepper" aria-label="Purchase progress">
          <li className="complete"><span><Check size={15} /></span><small>Plan</small></li>
          <i className="complete-line" aria-hidden="true" />
          <li className="complete"><span><Check size={15} /></span><small>Summary</small></li>
          <i className="complete-line" aria-hidden="true" />
          <li className="active" aria-current="step"><span>3</span><small>Payment</small></li>
          <i aria-hidden="true" />
          <li><span>4</span><small>Done</small></li>
        </ol>

        <section className={"secure-payment-card" + (paymentUnderReview ? " has-payment-review" : "") + (showCardForm ? " has-card-form" : "")} aria-label="Choose a payment method">
          <div className="secure-payment-options" role="radiogroup" aria-label="Payment methods">
            {paymentMethods.map(({ id, title, description, logos, providerLogo, walletLabel }) => {
              const selected = selectedMethod === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={"secure-payment-option" + (selected ? " selected" : "")}
                  data-method={id}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => chooseMethod(id)}
                >
                  <span className="secure-payment-radio" aria-hidden="true">{selected && <span />}</span>
                  <span className={"secure-payment-method-icon " + id}>
                    {id === "card" && <CreditCard size={18} strokeWidth={2.1} />}
                    {id === "vodafone" && <img className="secure-payment-brand-mark vodafone-brand-mark" src={vodafoneCashIcon} alt="" />}
                    {id === "orange" && <span className="orange-mark" aria-hidden="true">orange</span>}
                    {id === "etisalat" && <img className="secure-payment-brand-mark" src={etisalatLogo} alt="" />}
                  </span>
                  <span className="secure-payment-copy">
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                  <span className="secure-payment-logos" aria-hidden="true">
                    {logos?.map((logo) => <img key={logo.alt} className={logo.className} src={logo.src} alt="" />)}
                    {providerLogo && (
                      <span className={`secure-payment-provider secure-payment-provider-${id}`}>
                        <img className="secure-payment-provider-logo" src={providerLogo} alt="" />
                        <span className="secure-payment-wallet">
                          <Smartphone size={13} strokeWidth={1.8} />
                          <small>{walletLabel}</small>
                        </span>
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedMethod === "card" && showCardForm && !paymentUnderReview && !cardPaymentStatus && (
            <form
              className="secure-payment-details"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const cardNumber = String(formData.get("cardNumber") || "").replace(/\D/g, "");
                const paidAt = new Date();
                if (!cardFormValid) {
                  setCardFieldTouched({ cardholder: true, cardNumber: true, expiry: true, securityCode: true });
                  return;
                }
                const paymentRecord = { paidAt, lastFour: cardNumber.slice(-4) || "4242" };
                setCardPaymentRecord(paymentRecord);
                activateSubscription(paymentRecord);
                setCardPaymentStatus("success");
              }}
            >
              <div className="secure-payment-details-heading">
                <div className="secure-payment-details-icon"><CreditCard size={18} /></div>
                <div>
                  <h2>Card details</h2>
                  <p>Enter your card information to continue.</p>
                </div>
              </div>
              <label className="secure-payment-field">
                <span>Name on card</span>
                <input autoComplete="cc-name" name="cardholder" value={cardholderInput} onChange={(event) => setCardholderInput(event.target.value)} onBlur={() => setCardFieldTouched((touched) => ({ ...touched, cardholder: true }))} placeholder="Name as shown on card" aria-invalid={(cardFieldTouched.cardholder || cardholderInput) && !cardholderValid} />
                {(cardFieldTouched.cardholder || cardholderInput) && !cardholderValid && <small className="secure-payment-field-error">Enter at least 4 words for the name on the card.</small>}
              </label>
              <label className="secure-payment-field">
                <span>Card number</span>
                <input autoComplete="cc-number" name="cardNumber" value={cardNumberInput} onChange={(event) => { const digits = event.target.value.replace(/\D/g, "").slice(0, 16); setCardNumberInput(digits.replace(/(.{4})/g, "$1 ").trim()); }} onBlur={() => setCardFieldTouched((touched) => ({ ...touched, cardNumber: true }))} placeholder="1234  5678  9012  3456" maxLength={19} inputMode="numeric" aria-invalid={(cardFieldTouched.cardNumber || cardNumberInput) && !cardNumberValid} />
                {(cardFieldTouched.cardNumber || cardNumberInput) && !cardNumberValid && <small className="secure-payment-field-error">Card number must contain exactly 16 digits.</small>}
              </label>
              <div className="secure-payment-field-row">
                <label className="secure-payment-field">
                  <span>Expiry date</span>
                  <input autoComplete="cc-exp" name="expiry" value={expiryInput} onChange={(event) => { const digits = event.target.value.replace(/\D/g, "").slice(0, 4); const monthValue = Number(digits.slice(0, 2)); if (digits.length === 1 && digits !== "0" && Number(digits) > 1) setExpiryInput(`0${digits}/`); else if (digits.length === 2 && monthValue >= 1 && monthValue <= 12) setExpiryInput(`${digits}/`); else setExpiryInput(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits); }} onBlur={() => setCardFieldTouched((touched) => ({ ...touched, expiry: true }))} placeholder="MM/YY" maxLength={5} inputMode="numeric" aria-invalid={(cardFieldTouched.expiry || expiryInput) && !expiryValid} />
                  {(cardFieldTouched.expiry || expiryInput) && !expiryValid && <small className="secure-payment-field-error">Enter a valid expiry date in MM/YY format.</small>}
                </label>
                <label className="secure-payment-field">
                  <span>Security code</span>
                  <input autoComplete="cc-csc" inputMode="numeric" name="securityCode" value={securityCodeInput} onChange={(event) => setSecurityCodeInput(event.target.value.replace(/\D/g, "").slice(0, 4))} onBlur={() => setCardFieldTouched((touched) => ({ ...touched, securityCode: true }))} placeholder="CVV" maxLength={4} aria-invalid={(cardFieldTouched.securityCode || securityCodeInput) && !securityCodeValid} />
                  {(cardFieldTouched.securityCode || securityCodeInput) && !securityCodeValid && <small className="secure-payment-field-error">Security code must be 3 or 4 digits.</small>}
                </label>
              </div>
              <p className="secure-payment-inline-note"><LockKeyhole size={13} /> Your card details stay secure.</p>
              <button className="secure-payment-pay secure-payment-submit" type="submit" disabled={!cardFormValid}>Pay {price.toLocaleString("en-US")} EGP</button>
            </form>
          )}

          {selectedMethod && selectedMethod !== "card" && !paymentUnderReview && (
            <div className="secure-payment-details secure-payment-receipt">
              <div className="secure-payment-details-heading">
                <div className="secure-payment-details-icon"><Smartphone size={18} /></div>
                <div>
                  <h2>Upload transfer receipt</h2>
                  <p>Choose a clear screenshot or photo of your transfer.</p>
                </div>
              </div>
              <label className={`secure-payment-upload${receiptPreview ? " has-file" : ""}`}>
                <input type="file" accept="image/*" onChange={handleReceiptChange} />
                {receiptPreview ? (
                  <>
                    <img className="secure-payment-receipt-preview" src={receiptPreview} alt="Transfer receipt preview" />
                    <span className="secure-payment-upload-copy"><strong>{receiptName}</strong><small>Tap to choose a different image</small></span>
                  </>
                ) : (
                  <>
                    <span className="secure-payment-upload-icon"><Upload size={19} /></span>
                    <span className="secure-payment-upload-copy"><strong>Choose receipt image</strong><small>JPG, PNG, or WEBP</small></span>
                    <span className="secure-payment-upload-action">Browse</span>
                  </>
                )}
              </label>
            </div>
          )}

          {paymentUnderReview && (
            <div className="secure-payment-review" role="status">
              <span className="secure-payment-review-check"><Check size={18} /></span>
              <div>
                <h2>Payment under review</h2>
                <p>{selectedMethod === "card" ? "Your card details are ready for review." : "Your transfer receipt was uploaded successfully."}</p>
                {receiptName && <small>{receiptName}</small>}
              </div>
            </div>
          )}

          <div className="secure-payment-actions">
            <Link className="secure-payment-back" to={backPath}>Back</Link>
            {!paymentUnderReview && !cardPaymentStatus && !(selectedMethod === "card" && showCardForm) && (
              <button
                className="secure-payment-pay"
                type="button"
                disabled={!selectedMethod || (selectedMethod === "card" && showCardForm) || (selectedMethod !== "card" && !receiptPreview)}
                onClick={selectedMethod === "card" ? handlePayClick : () => setPaymentUnderReview(true)}
              >
                {selectedMethod && selectedMethod !== "card" ? "Done" : `Pay ${price.toLocaleString("en-US")} EGP`}
              </button>
            )}
          </div>
        </section>

        <p className="secure-payment-note"><LockKeyhole size={12} /> Your payment information is secure</p>

      {cardPaymentStatus && (
        <div className="card-payment-modal-backdrop">
          <section className={`card-payment-modal card-payment-modal-${cardPaymentStatus}`} role="dialog" aria-modal="true" aria-labelledby="card-payment-modal-title">
            {cardPaymentStatus === "success" && (
              <>
                <img className="card-payment-status-illustration success" src={paymentSuccessArt} alt="" aria-hidden="true" />
                <h2 id="card-payment-modal-title">Payment successful!</h2>
                <p className="card-payment-modal-subtitle">Your {plan.name} plan is now active.</p>
                <div className="card-payment-summary">
                  <div><span><span className="card-payment-summary-icon"><Crown size={15} /></span>Plan</span><strong>{plan.name} Plan</strong></div>
                  <div><span><span className="card-payment-summary-icon"><CreditCard size={15} /></span>Price</span><strong>{price.toLocaleString("en-US")} EGP / {billingCycle === "yearly" ? "year" : "month"}</strong></div>

                  <div><span><span className="card-payment-summary-icon"><CalendarDays size={15} /></span>Renewal date</span><strong>{formatPaymentDate(getRenewalDate(cardPaymentRecord?.paidAt || new Date(), billingCycle))}</strong></div>
                  <div><span><span className="card-payment-summary-icon"><ShieldCheck size={15} /></span>Payment method</span><strong>•••• {cardPaymentRecord?.lastFour || "4242"}</strong></div>
                </div>
                <Link className="card-payment-modal-primary" to={completionPath}>{managingPaymentMethod ? "Back to billing" : "Go to Dashboard"}</Link>
              </>
            )}

            {cardPaymentStatus === "pending" && (
              <>
                <img className="card-payment-status-illustration pending" src={paymentPendingArt} alt="" aria-hidden="true" />
                <h2 id="card-payment-modal-title">Payment pending</h2>
                <p className="card-payment-modal-subtitle">Your payment is being processed. This may take a few minutes.</p>
                <div className="card-payment-summary compact">
                  <div><span><span className="card-payment-summary-icon"><Crown size={15} /></span>Plan</span><strong>{plan.name} Plan</strong></div>
                  <div><span><span className="card-payment-summary-icon"><CreditCard size={15} /></span>Amount</span><strong>{price.toLocaleString("en-US")} EGP</strong></div>
                </div>
                <div className="card-payment-modal-actions">
                  <button className="card-payment-modal-primary" type="button" onClick={() => { activateSubscription(); setCardPaymentStatus("success"); }}><RefreshCw size={14} /> Refresh Status</button>
                  <Link className="card-payment-modal-secondary" to={completionPath}>{managingPaymentMethod ? "Back to billing" : "Back to Dashboard"}</Link>
                </div>
              </>
            )}

            {cardPaymentStatus === "failed" && (
              <>
                <div className="card-payment-failed-art" aria-hidden="true">
                  <img className="card-payment-status-illustration failed" src={paymentFailedArt} alt="" />
                  <span className="failed-art-ray ray-nw" />
                  <span className="failed-art-ray ray-ne" />
                  <span className="failed-art-ray ray-e" />
                  <span className="failed-art-ray ray-w" />
                </div>
                <h2 id="card-payment-modal-title">Payment failed</h2>
                <p className="card-payment-modal-subtitle">Please try again or use a different payment method.</p>
                <div className="card-payment-summary compact card-payment-failed-summary">
                  <div><span>Plan</span><strong>{plan.name} Plan</strong></div>
                  <div><span>Amount</span><strong>{price.toLocaleString("en-US")} EGP</strong></div>
                </div>
                <div className="card-payment-modal-actions stacked card-payment-failed-actions">
                  <button className="card-payment-modal-primary" type="button" onClick={() => { setCardPaymentStatus(null); setSelectedMethod("card"); setShowCardForm(true); }}>Try Again</button>
                  <Link className="card-payment-modal-secondary" to={previewOnly ? "/plans-preview" : "/plans"}>Back to Pricing</Link>
                </div>
              </>
            )}
          </section>
        </div>
      )}      </main>
    </div>
  );
}
