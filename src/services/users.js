// ============================================================
// users.js — بيانات المستخدم الحالي (Users)
// ============================================================

import { apiGet, apiPut, apiPost } from "./apiClient";

export function getCurrentUser() {
  return apiGet("/api/users/me");
}

export function updateCurrentUser({ firstName, lastName }) {
  return apiPut("/api/users/me", { firstName, lastName });
}

export function changePassword({
  currentPassword,
  newPassword,
  confirmPassword,
}) {
  return apiPost("/api/users/change-password", {
    currentPassword,
    newPassword,
    confirmPassword,
  });
}
