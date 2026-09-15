import"../../css/components/LinkCopiedModal.css"
export default function LinkCopiedModal({
  childName,
  onDone,
  title = "Invitation link copied",
  message,
}) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">
        <h2>{title}</h2>

        <p>
          {message ?? (
            <>
              Share it privately with {childName}.
              <br />
              He’ll review the setup before activating. The invitation expires
              in 7 days.
            </>
          )}
        </p>

        <button
          type="button"
          className="confirm-cancel-button"
          onClick={onDone}
        >
          Done
        </button>
      </div>
    </div>
  );
}