import { useEffect, useState } from "react";
import { api } from "./api";

// The profile photo of a child setup is served behind the parent's session,
// so it is downloaded once per draft and shown through an object URL. A draft
// without a photo (404) resolves to null and the initial is shown instead.
const imageRequests = new Map();

function loadChildSetupImage(draftId) {
  if (!imageRequests.has(draftId)) {
    const request = api(
      `/api/parents/child-setups/${encodeURIComponent(draftId)}/profile-image`,
      { responseType: "blob" },
    )
      .then((blob) => (blob?.size ? URL.createObjectURL(blob) : null))
      .catch(() => {
        // Let a later render try again (e.g. after a network hiccup).
        imageRequests.delete(draftId);
        return null;
      });
    imageRequests.set(draftId, request);
  }
  return imageRequests.get(draftId);
}

// Called after a new photo is uploaded so every avatar shows it right away.
export function setChildSetupImage(draftId, blob) {
  if (!draftId || !blob) return;
  imageRequests.set(draftId, Promise.resolve(URL.createObjectURL(blob)));
}

export function useChildSetupImage(draftId) {
  const [image, setImage] = useState({ draftId: null, url: null });

  useEffect(() => {
    if (!draftId) return undefined;
    let active = true;
    loadChildSetupImage(draftId).then((url) => {
      if (active) setImage({ draftId, url });
    });
    return () => {
      active = false;
    };
  }, [draftId]);

  // Ignore a result that belongs to a previously shown draft.
  return image.draftId === draftId ? image.url : null;
}
