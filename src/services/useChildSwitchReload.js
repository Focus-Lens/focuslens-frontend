import { useCallback, useEffect, useState } from "react";

export default function useChildSwitchReload(enabled = true) {
  const params = new URLSearchParams(window.location.search);
  const previewMode = params.get("childSwitchLoading") === "preview";
  const errorPreviewMode = params.get("childSwitchError") === "preview";
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(previewMode && !errorPreviewMode);
  const [isError, setIsError] = useState(errorPreviewMode);

  useEffect(() => {
    if (!enabled || previewMode) return undefined;
    const handleChildSwitch = () => {
      setIsError(false);
      setIsLoading(true);
      setReloadKey((value) => value + 1);
    };
    window.addEventListener("focuslens:active-child-changed", handleChildSwitch);
    return () => window.removeEventListener("focuslens:active-child-changed", handleChildSwitch);
  }, [enabled, previewMode]);

  const finishLoading = useCallback(() => {
    if (!previewMode || errorPreviewMode) setIsLoading(false);
  }, [previewMode, errorPreviewMode]);
  const failLoading = useCallback(() => {
    setIsLoading(false);
    setIsError(true);
  }, []);
  const retry = useCallback(() => {
    setIsError(false);
    setIsLoading(enabled);
    if (enabled) setReloadKey((value) => value + 1);
  }, [enabled]);
  return {
    reloadKey,
    isLoading: enabled || previewMode ? isLoading : false,
    isError,
    finishLoading,
    failLoading,
    retry,
  };
}
