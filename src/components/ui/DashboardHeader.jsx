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

import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

import "../../css/dashboard/DashboardHeader.css";

export default function DashboardHeader({ activePage = "overview" }) {
  const { user: parent, child } = useAuth();

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
        <button
          type="button"
          className="dashboard-notification"
          aria-label="Notifications"
        >
          <Bell size={20} strokeWidth={1.8} />
          <span className="notification-dot" />
        </button>

        <Link
          to="/children"
          className="dashboard-user-pill"
        >
          <span className="dashboard-user-avatar child-avatar">
            {child?.preferredName?.[0] ?? "Y"}
          </span>

          <span>
            {child?.preferredName ?? "Youssef"} · {child?.grade ?? "Grade 8"}
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
            {parent.firstName?.[0] ?? "M"}
          </span>

          <span>{parent.firstName}</span>

          <ChevronDown
            size={17}
            strokeWidth={1.8}
          />
        </Link>
      </div>
    </header>
  );
}
