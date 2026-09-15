import { apiGet, apiPost } from "./apiClient";

function toWebPath(url) {
  if (!url) return null;
  if (/^\/parents\/students\/[^/]+\/dashboard\/sessions/.test(url)) {
    return "/reports";
  }
  if (/^\/parents\/students\/[^/]+\/dashboard/.test(url)) {
    return "/overview";
  }
  return url.startsWith("/") ? url : null;
}

export function getNotifications(filter = "All") {
  return apiGet("/api/notifications", { query: { filter } }).then((items) =>
    (Array.isArray(items) ? items : []).map((notification) => {
      const category = notification.category?.toLowerCase();
      return {
        ...notification,
        audience: notification.type?.toLowerCase(),
        type: category === "system" ? "system" : "alert",
        category,
        actionLabel: notification.action?.text ?? "Open",
        actionPath: toWebPath(notification.action?.url),
      };
    })
  );
}

export function markNotificationRead(notificationId) {
  return apiPost(`/api/notifications/${notificationId}/read`);
}
