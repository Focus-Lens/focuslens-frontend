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

function saveTokens(nextTokens) {
  if (!nextTokens?.accessToken || !nextTokens?.refreshToken) return;
  sessionStorage.setItem("accessToken", nextTokens.accessToken);
  sessionStorage.setItem("refreshToken", nextTokens.refreshToken);
}

export function clearSession() {
  ["accessToken", "refreshToken", "focusLensUser", "focusLensOverviewChildren"].forEach((key) =>
    sessionStorage.removeItem(key),
  );
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("json")
    ? await response.json()
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
      (typeof payload === "string" && payload) ||
      "Something went wrong. Please try again.";
    throw new ApiError(message, response.status, payload);
  }
  return payload;
}

async function refreshAccessToken() {
  const { accessToken, refreshToken } = tokens();
  if (!accessToken || !refreshToken) return null;
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, refreshToken }),
  });
  if (!response.ok) return null;
  const nextTokens = await parseResponse(response);
  saveTokens(nextTokens);
  return nextTokens;
}

export async function api(path, options = {}) {
  const { auth = true, retry = true, headers, body, ...init } = options;
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
  }
  return parseResponse(response);
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
