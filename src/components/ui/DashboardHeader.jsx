import { Link } from "react-router-dom";
import {
  ChevronDown,
  LayoutGrid,
  FileText,
  TrendingUp,
  Target,
  Users,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
  findConnectedChild,
  findPendingChild,
  getCachedParentChildren,
} from "../../services/parentChildrenCache";
import { getPendingInvitationForUser } from "../../services/pendingInvitationCache";
import logo from "../../assets/logo.png";

import "../../css/dashboard/DashboardHeader.css";

export default function DashboardHeader({ activePage = "overview" }) {
  const { user } = useAuth();
  const cachedChildren = getCachedParentChildren();
  const child =
    findConnectedChild(cachedChildren) ||
    findPendingChild(cachedChildren) ||
    getPendingInvitationForUser(user?.email);
  const childName = child?.firstName || "Your children";
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
        <Link
          to="/children"
          className="dashboard-user-pill"
        >
          <span className="dashboard-user-avatar child-avatar">
            {childName[0]?.toUpperCase() ?? "Y"}
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
            {user?.firstName?.[0] ?? "M"}
          </span>

          <span>{user?.firstName || "Account"}</span>

          <ChevronDown
            size={17}
            strokeWidth={1.8}
          />
        </Link>
      </div>
    </header>
  );
}
