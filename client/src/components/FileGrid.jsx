import { filesApi } from '../api/client';
import { formatBytes, iconClassFor, categoryOf, canPreview } from '../utils/fileType';

function Thumbnail({ file }) {
  const category = categoryOf(file.mime_type);
  const src = filesApi.contentUrl(file.id);

  if (category === 'image') {
    return <img className="file-grid-thumb" src={src} alt={file.original_name} loading="lazy" />;
  }
  if (category === 'video') {
    return <video className="file-grid-thumb" src={src} muted preload="metadata" />;
  }
  return <i className={`file-grid-icon ${iconClassFor(file.mime_type)}`} />;
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
    return <p className="empty-state">No files here yet. Upload something!</p>;
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
            >
              <Thumbnail file={file} />
              {onToggleStar && (
                <span
                  className={`file-grid-star ${file.is_starred ? 'is-starred' : ''}`}
                  title={file.is_starred ? 'Unstar' : 'Star'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar(file, !file.is_starred);
                  }}
                >
                  <i className={file.is_starred ? 'fa-solid fa-star' : 'fa-regular fa-star'} />
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
                />
                {file.is_public ? (expired ? 'Expired' : 'Public') : 'Private'}
              </label>
              <span className="row-actions">
                {file.is_public && (
                  <button className="icon-button" title="Share" onClick={() => onShare(file)}>
                    <i className="fa-solid fa-link" />
                  </button>
                )}
                <button className="icon-button" title="Rename" onClick={() => onRename(file)}>
                  <i className="fa-solid fa-pen" />
                </button>
                <button className="icon-button" title="Delete" onClick={() => onDelete(file)}>
                  <i className="fa-solid fa-trash" />
                </button>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
