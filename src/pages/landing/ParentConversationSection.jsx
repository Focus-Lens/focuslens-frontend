import laptopFrame from "../../assets/landing/parent-dashboard-laptop-frame.png";
import laptopScreen from "../../assets/landing/parent-dashboard-screen.png";
import phoneFrame from "../../assets/landing/landing-phone-frame-cropped.png";
import phoneScreen from "../../assets/landing/parent-connection-screen.png";
import "../../css/landing/LandingPage.css";

export default function ParentConversationSection() {
  return (
    <section id="parent-conversation" className="parent-conversation" aria-labelledby="parent-conversation-title">
      <div className="parent-conversation-inner">
        <header className="parent-conversation-header">
          <p className="parent-conversation-eyebrow">FOR PARENTS</p>
          <h2 id="parent-conversation-title">Turn progress into<br /><span>a better conversation.</span></h2>
          <p className="parent-conversation-subtitle">See shared study summaries and understand where encouragement can help.</p>
        </header>

        <div className="parent-conversation-devices" aria-label="FocusLens parent dashboard and connection screens">
          <div className="parent-laptop">
            <div className="parent-laptop-screen">
              <img src={laptopScreen} alt="Parent dashboard showing study reports" />
            </div>
            <img className="parent-laptop-frame" src={laptopFrame} alt="" />
          </div>
          <div className="parent-phone">
            <div className="parent-phone-screen">
              <img src={phoneScreen} alt="Parent connection review screen" />
            </div>
            <img className="parent-phone-frame" src={phoneFrame} alt="" />
          </div>
        </div>

        <div className="parent-conversation-prompt">
          <p className="parent-conversation-eyebrow">A CONVERSATION TO TRY</p>
          <p>“What felt clearer today?”</p>
        </div>
      </div>
    </section>
  );
}

