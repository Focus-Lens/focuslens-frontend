import "../../css/components/DeclineInvitationModal.css"
export default function DeclineInvitationModal({
  childName,
  error = "",
  submitting = false,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">

        <h2>Decline {childName === "your child" ? "this" : `${childName}’s`} invitation?</h2>

        <p>
          You won’t be connected to {childName}, and no study information
          will be shared. You can connect later with a new invitation.
        </p>

        {error && <p className="confirm-modal-error" role="alert">{error}</p>}

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-decline-link"
            disabled={submitting}
            onClick={onConfirm}
          >
            {submitting ? "Declining…" : "Yes, decline invitation"}
          </button>

          <button
            type="button"
            className="confirm-cancel-button"
            disabled={submitting}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
