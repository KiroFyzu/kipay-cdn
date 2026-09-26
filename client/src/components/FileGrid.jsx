import { filesApi } from '../api/client';
import { formatBytes, iconClassFor, categoryOf, canPreview } from '../utils/fileType';

function Thumbnail({ file }) {
  const category = categoryOf(file.mime_type);
  const src = filesApi.contentUrl(file.id);

  if (category === 'image') {
    return <img className="file-grid-thumb" src={src} alt={file.original_name} loading="lazy" />;
  }
  if (category === 'video') {
    return <video className="file-grid-thumb" src={src} muted preload="metadata" aria-label={file.original_name} />;
  }
  return <i className={`file-grid-icon ${iconClassFor(file.mime_type)}`} aria-hidden="true" />;
}

export default function FileGrid({
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
    <div className="file-grid">
      {files.map((file) => {
        const expired = file.expires_at && new Date(file.expires_at).getTime() <= Date.now();
        return (
          <div className="file-grid-card" key={file.id}>
            <button
              className="file-grid-thumb-wrap"
              onClick={() => (canPreview(file.mime_type) ? onPreview(file) : undefined)}
              title={canPreview(file.mime_type) ? 'Click to preview' : file.original_name}
              aria-label={canPreview(file.mime_type) ? `Preview ${file.original_name}` : file.original_name}
            >
              <Thumbnail file={file} />
              {onToggleStar && (
                <span
                  className={`file-grid-star ${file.is_starred ? 'is-starred' : ''}`}
                  role="button"
                  tabIndex={0}
                  title={file.is_starred ? 'Unstar' : 'Star'}
                  aria-label={file.is_starred ? `Unstar ${file.original_name}` : `Star ${file.original_name}`}
                  aria-pressed={!!file.is_starred}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar(file, !file.is_starred);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleStar(file, !file.is_starred);
                    }
                  }}
                >
                  <i className={file.is_starred ? 'fa-solid fa-star' : 'fa-regular fa-star'} aria-hidden="true" />
                </span>
              )}
            </button>
            <div className="file-grid-meta">
              <span className="file-grid-name" title={file.original_name}>{file.original_name}</span>
              <span className="file-grid-size">{formatBytes(file.size_bytes)}</span>
            </div>
            <div className="file-grid-actions">
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={!!file.is_public}
                  onChange={(e) => onToggleVisibility(file, e.target.checked)}
                  aria-label={`Make ${file.original_name} ${file.is_public ? 'private' : 'public'}`}
                />
                {file.is_public ? (expired ? 'Expired' : 'Public') : 'Private'}
              </label>
              <span className="row-actions">
                {file.is_public ? (
                  <button className="icon-button" title="Share" aria-label={`Share ${file.original_name}`} onClick={() => onShare(file)}>
                    <i className="fa-solid fa-link" aria-hidden="true" />
                  </button>
                ) : null}
                <button className="icon-button" title="Rename" aria-label={`Rename ${file.original_name}`} onClick={() => onRename(file)}>
                  <i className="fa-solid fa-pen" aria-hidden="true" />
                </button>
                <button className="icon-button" title="Delete" aria-label={`Delete ${file.original_name}`} onClick={() => onDelete(file)}>
                  <i className="fa-solid fa-trash" aria-hidden="true" />
                </button>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
