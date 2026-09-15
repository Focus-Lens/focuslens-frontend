// ============================================================
// access.js — ربط الوالد بالطفل (دعوات + الأطفال المرتبطين)
// ============================================================

import { apiGet, apiPost, apiDelete } from "./apiClient";

// دعوة الوالد لطالب عن طريق إيميل الطالب
export function createInvitation({ studentEmail }) {
  return apiPost("/api/access/invitations", { studentEmail });
}

export function getInvitations() {
  return apiGet("/api/access/invitations");
}

export function acceptInvitation(invitationId) {
  return apiPost(`/api/access/invitations/${invitationId}/accept`);
}

export function rejectInvitation(invitationId) {
  return apiPost(`/api/access/invitations/${invitationId}/reject`);
}

// دعوة يرسلها الطالب لولي الأمر (parent-invitations) — هذا ما يخص
// شاشات /invite/:token و ReviewChildInvitation و ConnectChild
export function createParentInvitation({ parentEmail }) {
  return apiPost("/api/access/parent-invitations", { parentEmail });
}

export function resolveParentInvitation(token) {
  return apiGet("/api/access/parent-invitations/resolve", {
    query: { token },
    auth: false,
  });
}

export function acceptParentInvitation(token) {
  return apiPost("/api/access/parent-invitations/accept", { token });
}

export function declineParentInvitation(token) {
  return apiPost("/api/access/parent-invitations/decline", { token });
}

export function cancelParentInvitation(invitationId) {
  return apiPost(`/api/access/parent-invitations/${invitationId}/cancel`);
}

// الأطفال المرتبطين بولي الأمر الحالي
export function getStudents() {
  return apiGet("/api/access/students");
}

export function getStudent(studentId) {
  return apiGet(`/api/access/students/${studentId}`);
}

export function getParents() {
  return apiGet("/api/access/parents");
}

export function removeRelationship(relationshipId) {
  return apiDelete(`/api/access/${relationshipId}`);
}
