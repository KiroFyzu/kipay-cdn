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
    return <p className="empty-state">No files here yet. Upload something!</p>;
  }

  return (
    <table className="file-table">
      <thead>
        <tr>
          <th></th>
          <th>Name</th>
          <th>Size</th>
          <th>Visibility</th>
          <th>Uploaded</th>
          <th></th>
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
                    onClick={() => onToggleStar(file, !file.is_starred)}
                  >
                    <i className={file.is_starred ? 'fa-solid fa-star' : 'fa-regular fa-star'} />
                  </button>
                )}
              </td>
              <td>
                <button
                  className="file-name-cell"
                  onClick={() => (canPreview(file.mime_type) ? onPreview(file) : undefined)}
                  title={canPreview(file.mime_type) ? 'Click to preview' : file.original_name}
                >
                  <i className={iconClassFor(file.mime_type)} /> {file.original_name}
                </button>
              </td>
              <td>{formatBytes(file.size_bytes)}</td>
              <td>
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={!!file.is_public}
                    onChange={(e) => onToggleVisibility(file, e.target.checked)}
                  />
                  {file.is_public ? (expired ? 'Expired' : 'Public') : 'Private'}
                </label>
              </td>
              <td>{new Date(file.created_at).toLocaleString()}</td>
              <td className="row-actions">
                {file.is_public ? (
                  <button onClick={() => onShare(file)}>Share</button>
                ) : null}
                <button className="icon-button" title="Rename" onClick={() => onRename(file)}>
                  <i className="fa-solid fa-pen" />
                </button>
                <button className="danger" onClick={() => onDelete(file)}>Delete</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
