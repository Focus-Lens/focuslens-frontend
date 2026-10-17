import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LayoutGrid,
  FileText,
  TrendingUp,
  Target,
  Users,
} from "lucide-react";

import { useAuth } from "../../context/useAuth";
import {
  findConnectedChild,
  findPendingChild,
  getCachedParentChildren,
} from "../../services/parentChildrenCache";
import { useChildSetupImage } from "../../services/childSetupImage";
import { getStudentDisplayName } from "../../services/studentDisplayName";
import { api } from "../../services/api";
import logo from "../../assets/logo.png";

import "../../css/dashboard/DashboardHeader.css";

export default function DashboardHeader({ activePage = "overview", previewData = null }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    api("/api/notifications?filter=All")
      .then((response) => {
        if (!active) return;
        setUnreadCount(response?.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => {
        if (!active) return;
      });
    return () => { active = false; };
  }, [user?.userId, user?.id]);
  const cachedChildren = getCachedParentChildren();
  // Only the server's children list (cached after it loads) is trusted, so a
  // cancelled invitation never flashes here.
  const child = previewData?.child ||
    findConnectedChild(cachedChildren) || findPendingChild(cachedChildren);
  const childName = getStudentDisplayName(child, "Your children");
  const childImage = useChildSetupImage(child?.childSetupDraftId);
  const displayUser = previewData?.parent || user;
  const navItems = [
    {
      key: "overview",
      label: "Overview",
      to: "/overview",
      icon: LayoutGrid,
    },
    {
      key: "reports",
      label: "Reports",
      to: "/reports",
      icon: FileText,
    },
    {
      key: "progress",
      label: "Progress",
      to: "/progress",
      icon: TrendingUp,
    },
    {
      key: "study-goals",
      label: "Study Goals",
      to: "/study-goals",
      icon: Target,
    },
    {
      key: "children",
      label: "Children",
      to: "/children",
      icon: Users,
    },
  ];

  return (
    <header className="dashboard-header">
      {/* Logo */}
      <Link to="/overview" className="dashboard-brand">
        <img src={logo} alt="FocusLens" />
        <span>FocusLens</span>
      </Link>

      {/* Navigation */}
      <nav className="dashboard-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.key;

          return (
            <Link
              key={item.key}
              to={item.to}
              className={`dashboard-nav-item ${
                isActive ? "active" : ""
              }`}
            >
              {isActive && (
                <span className="dashboard-active-bg" />
              )}

              <span className="dashboard-nav-content">
                {isActive && (
                  <Icon
                    size={17}
                    strokeWidth={2.2}
                  />
                )}

                <span>{item.label}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="dashboard-header-right">
        <div className="dashboard-notification-wrap">
          <Link
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            className="dashboard-notification"
            to="/notifications"
          >
            <Bell size={19} strokeWidth={1.8} />
            {unreadCount > 0 && <span className="notification-dot" />}
          </Link>
        </div>
        <Link
          to="/children"
          className="dashboard-user-pill"
        >
          <span className="dashboard-user-avatar child-avatar">
            {childImage
              ? <img src={childImage} alt="" />
              : childName !== "Your children"
                ? childName[0].toUpperCase()
                : <Users size={16} strokeWidth={2.2} aria-label="No children yet" />}
          </span>

          <span>
            {child?.grade ? `${childName} · ${child.grade}` : childName}
          </span>

          <ChevronDown
            size={17}
            strokeWidth={1.8}
          />
        </Link>

        <Link
          to="/profile"
          className="dashboard-user-pill parent-pill"
        >
          <span className="dashboard-user-avatar parent-avatar">
            {displayUser?.firstName?.[0] ?? "M"}
          </span>

          <span>{displayUser?.firstName || "Account"}</span>

          <ChevronDown
            size={17}
            strokeWidth={1.8}
          />
        </Link>
      </div>
    </header>
  );
}
