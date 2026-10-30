import missionsScreen from "../../assets/landing/return-level-path-screen.png";
import levelPathScreen from "../../assets/landing/return-missions-screen.png";
import bookIcon from "../../assets/landing/return-book-icon.png";
import phoneFrame from "../../assets/landing/landing-phone-frame-cropped.png";
import "../../css/landing/LandingPage.css";

function ReturnPhone({ screen, alt, className }) {
  return (
    <div className={`return-phone ${className}`}>
      <div className="return-phone-screen">
        <img src={screen} alt={alt} />
      </div>
      <img className="return-phone-frame" src={phoneFrame} alt="" />
    </div>
  );
}

export default function ReasonsToReturnSection() {
  return (
    <section className="reasons-to-return" aria-labelledby="reasons-to-return-title">
      <div className="reasons-to-return-inner">
        <div className="reasons-to-return-copy">
          <p className="reasons-to-return-eyebrow">REASONS TO RETURN</p>
          <h2 id="reasons-to-return-title">
            Make effort feel<br />
            <span>worth coming back to.</span>
          </h2>
          <p className="reasons-to-return-description">
            Missions, achievements and mascot levels make consistent study visible.
          </p>
          <p className="reasons-to-return-encouragement">Progress at their own pace.</p>
          <img className="reasons-to-return-book" src={bookIcon} alt="" />
        </div>
        <div className="reasons-to-return-phones" aria-label="Missions and level path screens">
          <ReturnPhone
            className="return-phone--missions"
            screen={missionsScreen}
            alt="Missions and achievements screen"
          />
          <ReturnPhone
            className="return-phone--levels"
            screen={levelPathScreen}
            alt="Level path screen"
          />
        </div>
      </div>
    </section>
  );
}
