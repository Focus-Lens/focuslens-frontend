import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ParentLayout } from "../../components/ui/CommonUI";
import { useAuth } from "../../context/AuthContext";
import { getNotifications, markNotificationRead } from "../../services/notifications";
import "../../css/dashboard/Notifications.css";

export default function Notifications() {
  const navigate = useNavigate();
  const { child } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((data) => {
        if (!cancelled) setNotifications(Array.isArray(data) ? data : data?.items ?? []);
      })
      .catch((error) => console.error("Failed to load notifications:", error));
    return () => { cancelled = true; };
  }, [child?.id]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") {
      return notifications;
    }

    return notifications.filter(
      (notification) => notification.type === activeTab
    );
  }, [activeTab, notifications]);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  async function openNotification(notification) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, isRead: true }
          : item
      )
    );

    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    if (notification.actionPath) {
      navigate(notification.actionPath);
    }
  }

  return (
    <ParentLayout>
      <main className="notifications-page">
        <header className="notifications-heading">
          <div className="notifications-title-icon">🔔</div>

          <div>
            <div className="notifications-title-row">
              <h1>Notifications</h1>
              <span>{unreadCount} unread</span>
            </div>

            <p>Meaningful updates about {child?.preferredName ?? "your child"}&apos;s learning activity.</p>
          </div>
        </header>

        <div className="notifications-tabs">
          <button
            className={activeTab === "all" ? "active" : ""}
            onClick={() => setActiveTab("all")}
            type="button"
          >
            All
          </button>

          <button
            className={activeTab === "alert" ? "active" : ""}
            onClick={() => setActiveTab("alert")}
            type="button"
          >
            Alerts
          </button>

          <button
            className={activeTab === "system" ? "active" : ""}
            onClick={() => setActiveTab("system")}
            type="button"
          >
            System
          </button>
        </div>

        <section className="notifications-list">
          {filteredNotifications.map((notification) => (
            <article
              className={
                notification.isRead
                  ? "notification-item"
                  : "notification-item unread"
              }
              key={notification.id}
            >
              <span className="notification-icon">
                {notification.type === "alert" ? "⚡" : "●"}
              </span>

              <div className="notification-content">
                <div className="notification-top-row">
                  <h2>{notification.title}</h2>
                  <small>{new Date(notification.createdAtUtc).toLocaleString()}</small>
                </div>

                <p>{notification.message}</p>

                <button
                  onClick={() => openNotification(notification)}
                  type="button"
                >
                  {notification.actionLabel} →
                </button>
              </div>
            </article>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="notifications-empty">
              <span>✓</span>
              <h2>No notifications here</h2>
              <p>You&apos;re all caught up for this category.</p>
            </div>
          )}
        </section>
      </main>
    </ParentLayout>
  );
}
