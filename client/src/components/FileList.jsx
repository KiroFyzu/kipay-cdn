import { formatBytes, iconClassFor, canPreview } from '../utils/fileType';

export default function FileList({
  files,
  onDelete,
  onToggleVisibility,
  onShare,
  onRename,
  onPreview,
  onToggleStar,
}) {
  if (files.length === 0) {
    return (
      <div className="empty-state">
        <i className="fa-solid fa-folder-open empty-state-icon" aria-hidden="true" />
        <p>No files here yet. Upload something!</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="file-table">
        <thead>
          <tr>
            <th><span className="sr-only">Starred</span></th>
            <th>Name</th>
            <th>Size</th>
            <th>Visibility</th>
            <th>Uploaded</th>
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const expired = file.expires_at && new Date(file.expires_at).getTime() <= Date.now();
            return (
              <tr key={file.id}>
                <td>
                  {onToggleStar && (
                    <button
                      className={`icon-button star-toggle ${file.is_starred ? 'is-starred' : ''}`}
                      title={file.is_starred ? 'Unstar' : 'Star'}
                      aria-label={file.is_starred ? `Unstar ${file.original_name}` : `Star ${file.original_name}`}
                      aria-pressed={!!file.is_starred}
                      onClick={() => onToggleStar(file, !file.is_starred)}
                    >
                      <i className={file.is_starred ? 'fa-solid fa-star' : 'fa-regular fa-star'} aria-hidden="true" />
                    </button>
                  )}
                </td>
                <td>
                  <button
                    className="file-name-cell"
                    onClick={() => (canPreview(file.mime_type) ? onPreview(file) : undefined)}
                    title={canPreview(file.mime_type) ? 'Click to preview' : file.original_name}
                  >
                    <i className={iconClassFor(file.mime_type)} aria-hidden="true" /> {file.original_name}
                  </button>
                </td>
                <td>{formatBytes(file.size_bytes)}</td>
                <td>
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      checked={!!file.is_public}
                      onChange={(e) => onToggleVisibility(file, e.target.checked)}
                      aria-label={`Make ${file.original_name} ${file.is_public ? 'private' : 'public'}`}
                    />
                    {file.is_public ? (expired ? 'Expired' : 'Public') : 'Private'}
                  </label>
                </td>
                <td>{new Date(file.created_at).toLocaleString()}</td>
                <td className="row-actions">
                  {file.is_public ? (
                    <button onClick={() => onShare(file)}>Share</button>
                  ) : null}
                  <button className="icon-button" title="Rename" aria-label={`Rename ${file.original_name}`} onClick={() => onRename(file)}>
                    <i className="fa-solid fa-pen" aria-hidden="true" />
                  </button>
                  <button className="danger" onClick={() => onDelete(file)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
