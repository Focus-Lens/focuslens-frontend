import { CircleHelp } from "lucide-react";
import { Link } from "react-router-dom";
import "../../css/common/EmailStatusAlert.css";

export default function EmailStatusAlert({ message, actionTo, actionText }) {
  if (!message) return null;

  return (
    <div className="email-status-alert" role="alert">
      <CircleHelp aria-hidden="true" className="email-status-alert-icon" size={19} />
      <div className="email-status-alert-content">
        <span>{message}</span>
        {actionTo && actionText && (
          <Link className="email-status-alert-action" to={actionTo}>
            {actionText}
          </Link>
        )}
      </div>
    </div>
  );
}
