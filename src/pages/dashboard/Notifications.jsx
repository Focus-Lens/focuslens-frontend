import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ParentLayout } from "../../components/ui/CommonUI";
import { dashboardMockData } from "../../data/mockData";
import "../../css/dashboard/Notifications.css";

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState(
    dashboardMockData.notifications
  );

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

  function openNotification(notification) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, isRead: true }
          : item
      )
    );

    navigate(notification.actionPath);
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

            <p>Meaningful updates about Youssef&apos;s learning activity.</p>
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
                  <small>{notification.date}</small>
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