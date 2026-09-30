import { useEffect, useState } from "react";

const MIN_INTERVAL_MS = 5000;

// Returns a counter that increases when the parent comes back to this tab
// (it becomes visible or the window regains focus), so pages can put it in an
// effect's dependencies and reload server data changed from another browser.
export default function useTabReturnRefresh() {
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let lastRefresh = Date.now();

    function handleReturn() {
      if (document.visibilityState !== "visible") return;
      // Focus and visibility often fire together; refresh once.
      if (Date.now() - lastRefresh < MIN_INTERVAL_MS) return;
      lastRefresh = Date.now();
      setRefreshCount((count) => count + 1);
    }

    document.addEventListener("visibilitychange", handleReturn);
    window.addEventListener("focus", handleReturn);
    return () => {
      document.removeEventListener("visibilitychange", handleReturn);
      window.removeEventListener("focus", handleReturn);
    };
  }, []);

  return refreshCount;
}
