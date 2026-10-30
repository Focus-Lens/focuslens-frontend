import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  ChevronDown,
  LayoutGrid,
  FileText,
  RefreshCw,
  TrendingUp,
  Target,
  Users,
  LockKeyhole,
  X,
} from "lucide-react";

import { useAuth } from "../../context/useAuth";
import {
  findConnectedChild,
  findPendingChild,
  getActiveParentChildId,
  getCachedParentChildren,
  cacheParentChildren,
  isConnectedParentChild,
  isPausedParentChild,
  isPendingParentChild,
  setActiveParentChild,
} from "../../services/parentChildrenCache";
import { useChildSetupImage } from "../../services/childSetupImage";
import { getStudentDisplayName } from "../../services/studentDisplayName";
import { api } from "../../services/api";
import { readActiveSubscription } from "../../data/subscriptionPlans";
import logo from "../../assets/logo.png";

import "../../css/dashboard/DashboardHeader.css";

const familyPreviewChildren = [
  { studentId: "preview-youssef", id: "preview-youssef", preferredName: "Youssef", name: "Youssef", grade: "Grade 10", status: "Connected" },
  { id: "preview-salma-invitation", preferredName: "Salma", name: "Salma", grade: "Grade 8", type: "ChildSetup", childSetupInvitationStatus: "Pending" },
  { studentId: "preview-omar", id: "preview-omar", preferredName: "Omar", name: "Omar", grade: "Grade 5", status: "Paused" },
];

export default function DashboardHeader({ activePage = "overview", previewData = null }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [childrenMenuOpen, setChildrenMenuOpen] = useState(() => Boolean(previewData?.childrenError));
  const [activeChildId, setActiveChildId] = useState(getActiveParentChildId);
  const [switchingChildId, setSwitchingChildId] = useState("");
  const [cachedChildren, setCachedChildren] = useState(() => getCachedParentChildren() || []);
  const hasPreviewData = Boolean(previewData);
  const [childrenRequestPending, setChildrenRequestPending] = useState(() => !hasPreviewData && getCachedParentChildren() === null);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [childrenLoadError, setChildrenLoadError] = useState(() => Boolean(previewData?.childrenError));
  const [childrenRetryToken, setChildrenRetryToken] = useState(0);

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
  useEffect(() => {
    if (hasPreviewData || getCachedParentChildren() !== null) return undefined;

    let active = true;
    const loadingTimer = window.setTimeout(() => {
      if (active) setChildrenLoading(true);
    }, 300);
    api("/api/parents/overview/children")
      .then((nextChildren) => {
        if (!active) return;
        const normalizedChildren = Array.isArray(nextChildren) ? nextChildren : [];
        cacheParentChildren(normalizedChildren);
        setCachedChildren(normalizedChildren);
        setChildrenLoadError(false);
      })
      .catch(() => {
        if (active) setChildrenLoadError(true);
      })
      .finally(() => {
        window.clearTimeout(loadingTimer);
        if (active) {
          setChildrenLoading(false);
          setChildrenRequestPending(false);
        }
      });

    return () => {
      active = false;
      window.clearTimeout(loadingTimer);
    };
  }, [user?.userId, user?.id, hasPreviewData, childrenRetryToken]);

  useEffect(() => {
    const syncActiveChild = () => setActiveChildId(getActiveParentChildId());
    window.addEventListener("focuslens:active-child-changed", syncActiveChild);
    return () => window.removeEventListener("focuslens:active-child-changed", syncActiveChild);
  }, []);

  useEffect(() => {
    const openChildrenMenu = () => setChildrenMenuOpen(true);
    window.addEventListener("focuslens:open-child-picker", openChildrenMenu);
    return () => window.removeEventListener("focuslens:open-child-picker", openChildrenMenu);
  }, []);

  useEffect(() => {
    if (!childrenMenuOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setChildrenMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [childrenMenuOpen]);

  useEffect(() => {
    if (!switchingChildId) return undefined;
    const timer = window.setTimeout(() => setSwitchingChildId(""), 700);
    return () => window.clearTimeout(timer);
  }, [switchingChildId]);

  // Only the server's children list (cached after it loads) is trusted, so a
  // cancelled invitation never flashes here.
  const activeSubscription = readActiveSubscription(
    previewData?.subscription ? { subscription: previewData.subscription } : user,
  );
  const previewChildren = previewData?.children ||
    previewData?.subscription?.childUsage?.map((item) => ({
      ...item,
      studentId: item.studentId || item.id,
      preferredName: item.preferredName || item.name,
    })) ||
    (activeSubscription?.planId === "family"
      ? familyPreviewChildren
      : previewData?.child
        ? [{ ...previewData.child, studentId: previewData.child.studentId || "preview-youssef" }]
        : []);
  const selectorChildren = previewData?.previewOnly ? previewChildren : cachedChildren;
  const child = selectorChildren.find((item) =>
    isConnectedParentChild(item) && String(item.studentId) === activeChildId
  ) || findConnectedChild(selectorChildren) || findPendingChild(selectorChildren) || previewData?.child;
  const hasExplicitChildSelection = Boolean(
    activeChildId && child?.studentId && String(child.studentId) === activeChildId
  );
  const switchingChild = selectorChildren.find((item) =>
    item.studentId && String(item.studentId) === switchingChildId
  );
  const displayedChild = switchingChild || child;
  const childName = getStudentDisplayName(displayedChild, "Your children");
  const childImage = useChildSetupImage(displayedChild?.childSetupDraftId);
  const displayUser = previewData?.parent || user;
  const connectedCount = selectorChildren.filter(isConnectedParentChild).length;
  const hasMultipleChildren = selectorChildren.length > 1;
  const canOpenChildrenMenu = hasMultipleChildren || childrenRequestPending || childrenLoadError;
  const childSlotLimit = activeSubscription?.planId === "family" ? 3 : 1;
  const isFamilyPlan = activeSubscription?.planId === "family";
  const pendingInvitationCount = selectorChildren.filter(isPendingParentChild).length;
  const occupiedSlotCount = connectedCount + pendingInvitationCount;
  const familySlotsFull = occupiedSlotCount >= childSlotLimit;

  function selectChild(selectedChild) {
    if (!selectedChild?.studentId) return;
    if (String(selectedChild.studentId) === String(child?.studentId)) {
      setChildrenMenuOpen(false);
      return;
    }
    setSwitchingChildId(String(selectedChild.studentId));
    setActiveParentChild(selectedChild.studentId);
    setActiveChildId(String(selectedChild.studentId));
    setChildrenMenuOpen(false);
  }
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
    <header className={`dashboard-header${childrenMenuOpen ? " children-selector-open" : ""}`}>
      {/* Logo */}
      <Link to="/" className="dashboard-brand" aria-label="FocusLens home">
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
        <div className={`dashboard-child-selector-wrap${childrenMenuOpen ? " open" : ""}`}>
          <button
            type="button"
            aria-haspopup={canOpenChildrenMenu ? "dialog" : undefined}
            aria-expanded={childrenMenuOpen}
            aria-controls={canOpenChildrenMenu ? "dashboard-children-popover" : undefined}
            aria-label={`${childName}${displayedChild?.grade ? ` · ${displayedChild.grade}` : ""}${canOpenChildrenMenu ? ", switch child" : ""}`}
            className={`dashboard-user-pill dashboard-child-selector-trigger${hasExplicitChildSelection ? " is-explicitly-selected" : ""}${switchingChild ? " is-switching" : ""}${!canOpenChildrenMenu ? " is-single-child" : ""}`}
            onClick={() => {
              if (canOpenChildrenMenu) setChildrenMenuOpen((open) => !open);
            }}
          >
            <span className="dashboard-user-avatar child-avatar">
              {childImage
                ? <img src={childImage} alt="" />
                : childName !== "Your children"
                  ? childName[0].toUpperCase()
                  : <Users size={16} strokeWidth={2.2} aria-label="No children yet" />}
            </span>

            <span>
              {displayedChild?.grade ? `${childName} · ${displayedChild.grade}` : childName}
            </span>

            {switchingChild
              ? <RefreshCw className="dashboard-child-switching-icon" size={17} strokeWidth={2} aria-hidden="true" />
              : canOpenChildrenMenu
                ? <ChevronDown size={17} strokeWidth={1.8} aria-hidden="true" />
                : null}
          </button>

          {childrenMenuOpen && (
            <>
              <button
                type="button"
                className="dashboard-children-backdrop"
                aria-label="Close children menu"
                onClick={() => setChildrenMenuOpen(false)}
              />
              <section
                id="dashboard-children-popover"
                className="dashboard-children-popover"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dashboard-children-title"
              >
                <header className="dashboard-children-popover-heading">
                  <div>
                    <h2 id="dashboard-children-title">Your children</h2>
                    <p>View one child at a time</p>
                  </div>
                  <button type="button" aria-label="Close" onClick={() => setChildrenMenuOpen(false)}>
                    <X size={19} strokeWidth={1.8} />
                  </button>
                </header>

                {childrenLoadError ? (
                  <div className="dashboard-children-error" role="alert">
                    <h3>Couldn’t load your children</h3>
                    <p>Your current child has not changed. Try again.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setChildrenLoadError(false);
                        setChildrenRequestPending(true);
                        setChildrenLoading(false);
                        setChildrenRetryToken((token) => token + 1);
                      }}
                    >
                      Try again
                    </button>
                  </div>
                ) : childrenRequestPending && !childrenLoading ? (
                  <div className="dashboard-children-pending-space" aria-hidden="true" />
                ) : childrenLoading ? (
                  <div className="dashboard-children-loading" role="status" aria-label="Loading child connections" aria-busy="true">
                    <div className="dashboard-children-skeleton-list" aria-hidden="true">
                      {Array.from({ length: 3 }, (_, index) => (
                        <div className="dashboard-child-skeleton" key={index}>
                          <span className="dashboard-child-skeleton-avatar" />
                          <span className="dashboard-child-skeleton-copy">
                            <span />
                            <span />
                          </span>
                        </div>
                      ))}
                    </div>
                    <p>Loading child connections...</p>
                  </div>
                ) : (
                <div className="dashboard-children-list">
                  {selectorChildren.length === 0 && (
                    <p className="dashboard-children-empty">No children connected yet.</p>
                  )}
                  {selectorChildren.map((item) => {
                    const itemId = item.studentId ? String(item.studentId) : String(item.childSetupDraftId || item.id);
                    const itemName = getStudentDisplayName(item, "Child");
                    const connected = isConnectedParentChild(item);
                    const pending = isPendingParentChild(item);
                    const paused = isPausedParentChild(item);
                    const selected = connected && itemId === String(child?.studentId || activeChildId);
                    const status = pending
                      ? "Awaiting child approval"
                      : paused
                        ? "Connection paused"
                        : "Connected";
                    return (
                      <button
                        type="button"
                        key={itemId}
                        className={`dashboard-child-option${selected ? " selected" : ""}${!connected ? " unavailable" : ""}${paused ? " paused" : ""}${pending ? " pending" : ""}`}
                        aria-pressed={selected}
                        disabled={!connected}
                        onClick={() => connected && selectChild(item)}
                      >
                        <span className="dashboard-child-option-avatar" aria-hidden="true">{itemName[0]?.toUpperCase() || "C"}</span>
                        <span className="dashboard-child-option-copy">
                          <strong>{itemName}</strong>
                          <small>{[item.grade || item.gradeLevel, status].filter(Boolean).join(" · ")}</small>
                        </span>
                        {selected
                          ? <Check className="dashboard-child-option-check" size={21} strokeWidth={2.2} aria-hidden="true" />
                          : !connected && <LockKeyhole className="dashboard-child-option-lock" size={18} strokeWidth={1.8} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
                )}

                {!childrenRequestPending && !childrenLoadError && <div className="dashboard-family-slots">
                  <p>
                    {occupiedSlotCount} of {childSlotLimit} {isFamilyPlan ? "slots" : "child slots"} in use
                    {pendingInvitationCount > 0 && ` · ${pendingInvitationCount} invitation${pendingInvitationCount === 1 ? "" : "s"} pending`}
                  </p>
                  <button
                    type="button"
                    className="dashboard-add-child-button"
                    disabled={familySlotsFull}
                    onClick={() => {
                      setChildrenMenuOpen(false);
                      navigate("/choose-start");
                    }}
                  >
                    Add child
                  </button>
                  <p className="dashboard-add-child-note">
                    {familySlotsFull
                      ? `All ${childSlotLimit} ${isFamilyPlan ? "Family slots are" : "child slots are"} in use. Manage children to free a slot before adding another.`
                      : isFamilyPlan
                        ? "Family supports up to 3 children. Pending invitations count toward your limit."
                        : `${childSlotLimit - occupiedSlotCount} child slot available.`}
                  </p>
                  <Link
                    className="dashboard-manage-children-link"
                    to={previewData?.previewOnly ? "/children-preview" : "/children"}
                    onClick={() => setChildrenMenuOpen(false)}
                  >
                    Manage children <span aria-hidden="true">→</span>
                  </Link>
                </div>}
              </section>
            </>
          )}
        </div>

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

        <Link
          to={activeSubscription
            ? previewData?.previewOnly
              ? activeSubscription.planId === "family" ? "/manage-subscription-family-preview" : "/manage-subscription-preview"
              : "/manage-subscription"
            : "/plans"}
          className={`dashboard-payment-cta${activePage === "payment" ? " active" : ""}`}
          aria-current={activePage === "payment" ? "page" : undefined}
        >
          {activeSubscription ? "Manage subscription" : "Try premium"}
        </Link>
      </div>
    </header>
  );
}
