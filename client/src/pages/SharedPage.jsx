import { useEffect, useState } from 'react';
import { filesApi } from '../api/client';
import ShareLinkModal from '../components/ShareLinkModal.jsx';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function SharedPage() {
  const [files, setFiles] = useState([]);
  const [shareFile, setShareFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    filesApi
      .listPublic()
      .then(({ data }) => setFiles(data.files))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="shared-page">
      <h1><i className="fa-solid fa-globe" aria-hidden="true" /> Public Links</h1>
      <p className="page-subtitle">Files you've made publicly accessible via a direct CDN link.</p>

      {loading && (
        <div className="skeleton-stack" aria-busy="true" aria-label="Loading public links">
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
        </div>
      )}
      {!loading && files.length === 0 && (
        <div className="empty-state">
          <i className="fa-solid fa-globe empty-state-icon" aria-hidden="true" />
          <p>You haven't shared any files publicly yet.</p>
        </div>
      )}
      {!loading && files.length > 0 && (
        <div className="table-scroll">
          <table className="file-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Shared on</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id}>
                  <td>{f.original_name}</td>
                  <td>{formatBytes(f.size_bytes)}</td>
                  <td>{new Date(f.created_at).toLocaleString()}</td>
                  <td className="row-actions">
                    <button className="link-button" onClick={() => setShareFile(f)}>
                      View link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {shareFile && <ShareLinkModal file={shareFile} onClose={() => setShareFile(null)} />}
    </div>
  );
}
