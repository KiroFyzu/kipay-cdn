export default function UploadQueue({ uploads, onDismiss }) {
  if (uploads.length === 0) return null;

  const allDone = uploads.every((u) => u.status === 'done' || u.status === 'error');

  return (
    <div className="upload-queue">
      <div className="upload-queue-header">
        <span>
          {allDone ? 'Upload complete' : `Uploading ${uploads.filter((u) => u.status === 'uploading').length} file(s)…`}
        </span>
        {allDone && (
          <button className="icon-button" onClick={onDismiss}><i className="fa-solid fa-xmark" /></button>
        )}
      </div>
      <ul className="upload-queue-list">
        {uploads.map((u) => (
          <li key={u.id} className={`upload-queue-item status-${u.status}`}>
            <span className="upload-queue-name" title={u.name}>{u.name}</span>
            {u.status === 'uploading' && (
              <div className="upload-queue-bar">
                <div className="upload-queue-bar-fill" style={{ width: `${u.progress}%` }} />
              </div>
            )}
            {u.status === 'done' && <i className="upload-queue-icon success fa-solid fa-circle-check" />}
            {u.status === 'error' && <i className="upload-queue-icon error fa-solid fa-triangle-exclamation" title={u.error} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
