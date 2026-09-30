// Keep API calls on the current origin during local development. Vite proxies
// `/api` to the backend, so a browser opened through an ngrok URL reaches the
// backend on this machine instead of trying its own `localhost`.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function tokens() {
  return {
    accessToken: sessionStorage.getItem("accessToken"),
    refreshToken: sessionStorage.getItem("refreshToken"),
  };
}

// "Remember me" keeps the session (never the password) on this device so the
// sign-in page can offer it again after the browser is closed. The backend
// rotates the refresh token, so every refresh updates the remembered copy.
const REMEMBERED_SESSION_KEY = "focusLensRememberedSession";

export function getRememberedSession() {
  try {
    const session = JSON.parse(localStorage.getItem(REMEMBERED_SESSION_KEY) || "null");
    return session?.refreshToken && session?.accessToken && session?.user ? session : null;
  } catch {
    return null;
  }
}

export function rememberSession(user) {
  const { accessToken, refreshToken } = tokens();
  if (!accessToken || !refreshToken || !user) return;
  try {
    localStorage.setItem(
      REMEMBERED_SESSION_KEY,
      JSON.stringify({ accessToken, refreshToken, user }),
    );
  } catch {
    // Storage can be unavailable (private mode); remembering is best effort.
  }
}

export function forgetRememberedSession() {
  try {
    localStorage.removeItem(REMEMBERED_SESSION_KEY);
  } catch {
    // Nothing to forget.
  }
}

function saveTokens(nextTokens) {
  if (!nextTokens?.accessToken || !nextTokens?.refreshToken) return;
  sessionStorage.setItem("accessToken", nextTokens.accessToken);
  sessionStorage.setItem("refreshToken", nextTokens.refreshToken);

  const remembered = getRememberedSession();
  if (remembered) {
    try {
      localStorage.setItem(
        REMEMBERED_SESSION_KEY,
        JSON.stringify({
          ...remembered,
          accessToken: nextTokens.accessToken,
          refreshToken: nextTokens.refreshToken,
        }),
      );
    } catch {
      // Best effort, see rememberSession.
    }
  }
}

export function clearSession() {
  ["accessToken", "refreshToken", "focusLensUser", "focusLensOverviewChildren"].forEach((key) =>
    sessionStorage.removeItem(key),
  );
}

// Moves a remembered session into this tab and exchanges its refresh token
// for fresh tokens. Returns the remembered user, or null if the session is no
// longer valid (it is then forgotten).
export async function restoreRememberedSession() {
  const remembered = getRememberedSession();
  if (!remembered) return null;

  sessionStorage.setItem("accessToken", remembered.accessToken);
  sessionStorage.setItem("refreshToken", remembered.refreshToken);

  const nextTokens = await refreshAccessToken();
  if (!nextTokens) {
    clearSession();
    forgetRememberedSession();
    return null;
  }
  return remembered.user;
}

// Used when the backend returns an error without a body (e.g. 401/403 from
// the authorization middleware).
const statusMessages = {
  401: "Your session has expired. Please sign in again.",
  403: "This account doesn’t have access to this action. Please sign in with a parent account.",
  404: "We couldn’t find what you were looking for.",
  500: "The server ran into a problem. Please try again in a moment.",
};

async function parseResponse(response, responseType) {
  if (response.status === 204) return null;
  if (response.ok && responseType === "blob") return response.blob();
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("json")
    ? await response.json().catch(() => null)
    : await response.text();

  if (!response.ok) {
    const validationMessages =
      payload?.errors && typeof payload.errors === "object"
        ? Object.values(payload.errors)
            .flat()
            .map((error) =>
              typeof error === "string" ? error : error?.description,
            )
            .filter(Boolean)
            .join(" ")
        : "";
    const message =
      validationMessages ||
      payload?.detail ||
      payload?.message ||
      payload?.Message ||
      payload?.title ||
      (typeof payload?.error === "string"
        ? payload.error
        : typeof payload?.Error === "string"
          ? payload.Error
          : "") ||
      payload?.errors?.[0]?.description ||
      // A server crash comes back as a raw stack trace; never show that text.
      (typeof payload === "string" && response.status < 500 && payload) ||
      statusMessages[response.status] ||
      `Something went wrong (error ${response.status}). Please try again.`;
    throw new ApiError(message, response.status, payload);
  }
  return payload;
}

// The backend rotates the refresh token on every use, so parallel refreshes
// would all send the same token and every one after the first would be
// rejected, signing the parent out. All callers share one in-flight refresh.
let refreshInFlight = null;

function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const { accessToken, refreshToken } = tokens();
    if (!accessToken || !refreshToken) return null;
    const headers = { "Content-Type": "application/json" };
    if (API_BASE_URL.includes("ngrok-free.dev")) headers["ngrok-skip-browser-warning"] = "true";
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers,
      body: JSON.stringify({ accessToken, refreshToken }),
    });
    if (!response.ok) return null;
    const nextTokens = await parseResponse(response);
    saveTokens(nextTokens);
    return nextTokens;
  })()
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

// Seconds until the access token's `exp` claim, or null if it can't be read.
function accessTokenSecondsLeft(accessToken) {
  try {
    const payload = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "=")));
    return typeof exp === "number" ? exp - Date.now() / 1000 : null;
  } catch {
    return null;
  }
}

export async function api(path, options = {}) {
  const { auth = true, retry = true, headers, body, responseType, ...init } = options;
  const requestHeaders = new Headers(headers);
  // ngrok's free tunnel can otherwise return its browser-warning HTML instead
  // of the API response.
  if (API_BASE_URL.includes("ngrok-free.dev")) {
    requestHeaders.set("ngrok-skip-browser-warning", "true");
  }
  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    // Refresh shortly before the 15-minute access token expires so requests
    // don't fail first and have to be retried.
    const current = tokens();
    const secondsLeft = current.accessToken ? accessTokenSecondsLeft(current.accessToken) : null;
    if (secondsLeft !== null && secondsLeft < 60 && current.refreshToken) {
      await refreshAccessToken();
    }
    const { accessToken } = tokens();
    if (accessToken) requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: requestHeaders,
    body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
  });

  if (response.status === 401 && auth && retry) {
    const nextTokens = await refreshAccessToken();
    if (nextTokens) return api(path, { ...options, retry: false });
    clearSession();
    forgetRememberedSession();
  }
  return parseResponse(response, responseType);
}

export const apiUrl = (path) => `${API_BASE_URL}${path}`;

const accessInvitationIdKey = "pendingAccessInvitationId";

export function getAccessInvitationId(invitation) {
  return invitation?.invitationId || invitation?.id || sessionStorage.getItem(accessInvitationIdKey);
}

export async function resolveAccessInvitation(token) {
  // Never let an older invitation ID be reused if the new token cannot be
  // resolved to an ID by the backend.
  sessionStorage.removeItem(accessInvitationIdKey);
  const invitation = await api(
    `/api/access/invitations/resolve?token=${encodeURIComponent(token)}`,
    { auth: false },
  );
  const invitationId = invitation?.invitationId || invitation?.id;
  if (invitationId) sessionStorage.setItem(accessInvitationIdKey, invitationId);
  return invitation;
}

export const acceptAccessInvitation = (invitationId) =>
  api(`/api/access/invitations/${invitationId}/accept`, { method: "POST" });
export const declineAccessInvitation = (invitationId) =>
  api(`/api/access/invitations/${encodeURIComponent(invitationId)}/decline`, { method: "POST" });

// Sender-side endpoints, used by the Student app rather than Parent Web's
// child-setup invitation flow.
export const listAccessInvitations = () => api("/api/access/invitations");
export const createAccessInvitation = (email) =>
  api("/api/access/invitations", { method: "POST", body: { email } });
export const cancelAccessInvitation = (invitationId) =>
  api(`/api/access/invitations/${invitationId}/cancel`, { method: "POST" });

export function clearAccessInvitation() {
  ["pendingInvitationToken", "pendingInvitationName", accessInvitationIdKey].forEach((key) =>
    sessionStorage.removeItem(key),
  );
}
export { saveTokens };
