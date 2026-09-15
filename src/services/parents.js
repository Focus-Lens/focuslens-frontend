// ============================================================
// parents.js — بيانات ولي الأمر + مسودات إعداد ملف الطفل (child-setups)
// ============================================================

import { apiGet, apiPost, apiPut } from "./apiClient";

export function getMe() {
  return apiGet("/api/parents/me");
}

export function createChildSetupDraft() {
  return apiPost("/api/parents/child-setups");
}

export function getChildSetupDraft(draftId) {
  return apiGet(`/api/parents/child-setups/${draftId}`);
}

export function updateChildSetupDraft(draftId, payload) {
  return apiPut(`/api/parents/child-setups/${draftId}`, payload);
}

export function inviteChildSetupByEmail(draftId, { childEmail }) {
  return apiPost(`/api/parents/child-setups/${draftId}/invite`, {
    childEmail,
  });
}

export function inviteChildSetupByLink(draftId) {
  return apiPost(`/api/parents/child-setups/${draftId}/invite/link`);
}

export function resendChildSetupInvite(draftId) {
  return apiPost(`/api/parents/child-setups/${draftId}/invite/resend`);
}

export function cancelChildSetupInvite(draftId) {
  return apiPost(`/api/parents/child-setups/${draftId}/invite/cancel`);
}

export function getChildSetupInvitations() {
  return apiGet("/api/parents/child-setups/invitations");
}
