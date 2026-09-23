import { useEffect, useRef, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { GoogleLogin } from "@react-oauth/google";
import "../../css/common/GoogleAuthButton.css";

const GOOGLE_BUTTON_BASE_WIDTH = 400;

export default function GoogleAuthButton({ onSuccess, onError }) {
  const buttonRef = useRef(null);
  const [hitAreaScale, setHitAreaScale] = useState(1);

  useEffect(() => {
    const element = buttonRef.current;
    if (!element) return undefined;

    const updateScale = () => {
      const width = element.getBoundingClientRect().width;
      setHitAreaScale(Math.min(2, width / GOOGLE_BUTTON_BASE_WIDTH));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="google-auth-button" ref={buttonRef}>
      <div className="google-auth-button__visual" aria-hidden="true">
        <FcGoogle className="google-auth-button__icon" />
        <span>Continue with Google</span>
      </div>

      <div
        className="google-auth-button__provider"
        style={{ "--google-hit-area-scale": hitAreaScale }}
      >
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          text="continue_with"
          theme="outline"
          size="medium"
          shape="pill"
          width={GOOGLE_BUTTON_BASE_WIDTH}
          containerProps={{ className: "google-auth-button__gsi" }}
        />
      </div>
    </div>
  );
}