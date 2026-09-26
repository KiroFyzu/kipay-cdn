export default function UploadQueue({ uploads, onDismiss }) {
  if (uploads.length === 0) return null;

  const allDone = uploads.every((u) => u.status === 'done' || u.status === 'error');

  return (
    <div className="upload-queue" role="status" aria-live="polite">
      <div className="upload-queue-header">
        <span>
          {allDone ? 'Upload complete' : `Uploading ${uploads.filter((u) => u.status === 'uploading').length} file(s)…`}
        </span>
        {allDone && (
          <button className="icon-button" onClick={onDismiss} aria-label="Dismiss upload summary">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        )}
      </div>
      <ul className="upload-queue-list">
        {uploads.map((u) => (
          <li key={u.id} className={`upload-queue-item status-${u.status}`}>
            <span className="upload-queue-name" title={u.name}>{u.name}</span>
            {u.status === 'uploading' && (
              <div
                className="upload-queue-bar"
                role="progressbar"
                aria-valuenow={u.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Uploading ${u.name}`}
              >
                <div className="upload-queue-bar-fill" style={{ width: `${u.progress}%` }} />
              </div>
            )}
            {u.status === 'done' && <i className="upload-queue-icon success fa-solid fa-circle-check" aria-hidden="true" />}
            {u.status === 'error' && (
              <i className="upload-queue-icon error fa-solid fa-triangle-exclamation" title={u.error} aria-label={u.error || 'Upload failed'} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
