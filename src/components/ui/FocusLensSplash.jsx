import { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import "../../css/common/FocusLensSplash.css";

const INTRO_DURATION_MS = 900;
const MOTION_DURATION_MS = 4000;

export default function FocusLensSplash({ onComplete }) {
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    const motionTimeoutId = window.setTimeout(
      () => setIsMoving(true),
      INTRO_DURATION_MS,
    );
    const completeTimeoutId = window.setTimeout(
      onComplete,
      INTRO_DURATION_MS + MOTION_DURATION_MS,
    );

    return () => {
      window.clearTimeout(motionTimeoutId);
      window.clearTimeout(completeTimeoutId);
    };
  }, [onComplete]);

  return (
    <main className="focus-splash" aria-label="FocusLens is loading">
      <img
        className={`focus-splash__logo${isMoving ? " is-moving" : ""}`}
        src={logo}
        alt="FocusLens"
      />
    </main>
  );
}
