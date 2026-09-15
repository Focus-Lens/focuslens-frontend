import "../../css/components/DeclineInvitationModal.css"
export default function DeclineInvitationModal({
  childName,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">

        <h2>Decline {childName}’s invitation?</h2>

        <p>
          You won’t be connected to {childName}, and no study information
          will be shared. You can connect later with a new invitation.
        </p>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-decline-link"
            onClick={onConfirm}
          >
            Yes, decline invitation
          </button>

          <button
            type="button"
            className="confirm-cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}