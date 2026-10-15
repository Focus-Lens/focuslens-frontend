import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  ChartNoAxesColumnIncreasing,
  CheckCheck,
  Clock3,
  FileText,
  Link2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { ParentLayout } from "../../components/ui/CommonUI";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { useAuth } from "../../context/useAuth";
import { api } from "../../services/api";
import { findConnectedChild, getCachedParentChildren } from "../../services/parentChildrenCache";
import { getStudentDisplayName } from "../../services/studentDisplayName";
import notificationBellImage from "../../assets/notifications/bell.png";
import focusPatternImage from "../../assets/notifications/focus-pattern.png";
import sessionReportImage from "../../assets/notifications/session-report.png";
import connectionImage from "../../assets/notifications/connection.png";
import privacyImage from "../../assets/notifications/privacy.png";
import scienceReportImage from "../../assets/notifications/science-report.png";
import "../../css/dashboard/Notifications.css";

const FILTERS = ["All", "Alerts", "System"];
const FILTER_VALUES = { All: 0, Alerts: 1, System: 2 };

export default function Notifications() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const child = findConnectedChild(getCachedParentChildren());
  const childName = getStudentDisplayName(child, "your child");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api(`/api/notifications?filter=${FILTER_VALUES[filter]}`)
      .then((response) => {
        if (!active) return;
        setNotifications(response?.notifications || []);
        setUnreadCount(response?.unreadCount || 0);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "We couldn’t load notifications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [filter, user?.userId, user?.id]);

  const initials = useMemo(() => {
    const first = user?.firstName?.trim()?.[0] || "";
    const last = user?.lastName?.trim()?.[0] || "";
    return `${first}${last}`.toUpperCase() || "P";
  }, [user?.firstName, user?.lastName]);

  async function markRead(notification) {
    if (notification.isRead) return true;
    try {
      const updated = await api(`/api/notifications/${notification.id}/read`, { method: "POST" });
      setNotifications((current) => current.map((item) =>
        item.id === notification.id ? (updated || { ...item, isRead: true }) : item,
      ));
      setUnreadCount((count) => Math.max(0, count - 1));
      return true;
    } catch (requestError) {
      setError(requestError.message || "We couldn’t update this notification.");
      return false;
    }
  }

  async function markAllRead() {
    try {
      await api("/api/notifications/read-all", { method: "POST" });
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (requestError) {
      setError(requestError.message || "We couldn’t mark notifications as read.");
    }
  }

  return (
    <div className="notifications-page">
      <DashboardHeader activePage="children" />
      <ParentLayout>
        <main className="notifications-content">
          <header className="notifications-heading">
            <div className="notifications-heading-main">
              <span className="notifications-heading-icon"><img src={notificationBellImage} alt="" /></span>
              <div>
                <div className="notifications-title-line">
                  <h1>Notifications</h1>
                  <span className="notifications-unread-count">{unreadCount} unread</span>
                </div>
                <p>Meaningful updates about {childName}’s learning activity.</p>
              </div>
            </div>
            <span className="notifications-parent-avatar" aria-label={`${user?.firstName || "Parent"} account`}>{initials}</span>
          </header>

          <div className="notifications-toolbar">
            <div className="notifications-tabs" role="tablist" aria-label="Notification filter">
              {FILTERS.map((item) => (
                <button
                  aria-selected={filter === item}
                  className={filter === item ? "active" : ""}
                  key={item}
                  onClick={() => setFilter(item)}
                  role="tab"
                  type="button"
                >{item}</button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button className="notifications-mark-all" onClick={markAllRead} type="button">
                <CheckCheck size={15} /> Mark all as read
              </button>
            )}
          </div>

          {error && <p className="notifications-error" role="alert">{error}</p>}
          {loading ? (
            <section aria-busy="true" aria-label="Loading notifications" className="notifications-list">
              {[0, 1, 2].map((item) => <div className="notification-skeleton" key={item} />)}
            </section>
          ) : notifications.length ? (
            <section aria-label="Your notifications" className="notifications-list">
              {notifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} onRead={markRead} />
              ))}
            </section>
          ) : (
            <section className="notifications-empty">
              <span className="notifications-empty-icon"><Bell size={26} /></span>
              <h2>You’re all caught up</h2>
              <p>New updates about {childName} will appear here.</p>
            </section>
          )}
        </main>
      </ParentLayout>
    </div>
  );
}

function NotificationCard({ notification, onRead }) {
  const navigate = useNavigate();
  const presentation = getPresentation(notification);
  const Icon = presentation.icon;
  const actionText = notification.action?.text || presentation.action;
  const actionUrl = getNotificationDestination(actionText, notification.action?.url) || presentation.url;

  return (
    <article className={`notification-page-card ${notification.isRead ? "is-read" : "is-unread"}`}>
      <span className={`notification-page-icon ${presentation.tone}`}>
        {presentation.image
          ? <img src={presentation.image} alt="" />
          : <Icon size={21} strokeWidth={1.8} />}
      </span>
      <div className="notification-page-copy">
        <button className="notification-page-main" onClick={() => onRead(notification)} type="button">
          <span className="notification-page-title-row">
            {!notification.isRead && <i aria-label="Unread" className="notification-unread-dot" />}
            <strong>{notification.title}</strong>
          </span>
          <span className="notification-page-message">{notification.message}</span>
        </button>
      </div>
      <div className="notification-page-meta">
        <time dateTime={notification.createdAtUtc}>{formatRelativeTime(notification.createdAtUtc)}</time>
        {actionUrl && actionText && (
          actionUrl.startsWith("/") ? (
            <Link onClick={async (event) => {
              event.preventDefault();
              if (await onRead(notification)) navigate(actionUrl);
            }} to={actionUrl}>{actionText} <span aria-hidden="true">→</span></Link>
          ) : (
            <a href={actionUrl} onClick={() => { void onRead(notification); }} rel="noreferrer" target="_blank">{actionText} <span aria-hidden="true">→</span></a>
          )
        )}
      </div>
    </article>
  );
}

function resolveNotificationActionUrl(actionUrl) {
  if (!actionUrl || /^https?:\/\//i.test(actionUrl)) return actionUrl;

  const sessionReport = actionUrl.match(/^\/students\/me\/reports\/sessions\/([\w-]+)\/?$/i);
  if (sessionReport) return `/reports/session/${encodeURIComponent(sessionReport[1])}`;

  if (/^\/parents\/students\/[\w-]+\/dashboard\/sessions\/?$/i.test(actionUrl)) {
    return "/reports";
  }
  if (/^\/parents\/students\/[\w-]+\/dashboard\/?$/i.test(actionUrl)) {
    return "/overview";
  }
  if (/^\/access\/parents\/?$/i.test(actionUrl)) {
    return "/children";
  }
  if (/^\/students\/me\/study-goal-proposals(?:\/[\w-]+)?\/?$/i.test(actionUrl)) {
    return "/study-goals";
  }

  return actionUrl;
}

function getNotificationDestination(actionText, actionUrl) {
  const label = (actionText || "").toLowerCase();
  const sessionReport = actionUrl?.match(/^\/students\/me\/reports\/sessions\/([\w-]+)\/?$/i);

  if (/report|summary/.test(label)) {
    return sessionReport
      ? `/reports/session/${encodeURIComponent(sessionReport[1])}`
      : "/reports";
  }
  if (/progress|trend/.test(label)) return "/progress";
  if (/child|student|connection/.test(label)) return "/children";
  if (/privacy/.test(label)) return "/privacy-policy";
  if (/goal/.test(label)) return "/study-goals";

  return resolveNotificationActionUrl(actionUrl);
}

function getPresentation(notification) {
  const value = `${notification.category || ""} ${notification.type || ""} ${notification.title || ""}`.toLowerCase();
  if (value.includes("focus")) return { image: focusPatternImage, icon: TrendingUp, tone: "tone-gold", action: "View progress trend", url: "/progress" };
  if (value.includes("science")) return { image: scienceReportImage, icon: FileText, tone: "tone-lavender", action: "View report", url: "/reports" };
  if (value.includes("session") || value.includes("report")) return { image: sessionReportImage, icon: FileText, tone: "tone-lavender", action: "View report", url: "/reports" };
  if (value.includes("connection") || value.includes("parentactivity")) return { image: connectionImage, icon: Link2, tone: "tone-green", action: "View child profile", url: "/children" };
  if (value.includes("privacy")) return { image: privacyImage, icon: ShieldCheck, tone: "tone-blue", action: "View privacy details", url: "/privacy-policy" };
  if (value.includes("goal")) return { icon: Target, tone: "tone-violet", action: "View study goals", url: "/study-goals" };
  if (value.includes("reminder")) return { icon: Clock3, tone: "tone-violet", action: "View study goals", url: "/study-goals" };
  if (value.includes("tip")) return { icon: Sparkles, tone: "tone-gold", action: "View progress", url: "/progress" };
  if (value.includes("weekly") || value.includes("progress")) return { image: focusPatternImage, icon: ChartNoAxesColumnIncreasing, tone: "tone-lavender", action: "View progress", url: "/progress" };
  if (value.includes("child")) return { image: connectionImage, icon: UserRound, tone: "tone-green", action: "View child profile", url: "/children" };
  return { icon: Bell, tone: "tone-blue", action: "", url: "" };
}

function formatRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "Yesterday" : `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
